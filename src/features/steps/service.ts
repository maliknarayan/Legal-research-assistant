import "server-only";
import { prisma } from "@/database/prisma";
import { getProvider } from "@/services/ai";
import { extractJson } from "@/services/ai/json";
import { kanoonSearchUrl } from "@/services/verification";
import {
  buildQuery,
  corpusStatus,
  getPassages,
  searchCorpus,
  type Passage,
} from "@/services/corpus/search.ts";
import { formatCaseFacts, formatPassages } from "@/prompts/context.ts";
import type { CaseFactsInput } from "@/types";
import {
  identifyLawsPrompt,
  identifyLawsSchema,
} from "@/prompts/identify-laws.ts";
import {
  findPrecedentsPrompt,
  findPrecedentsSchema,
} from "@/prompts/find-precedents.ts";
import { analyzeCasePrompt, analyzeCaseSchema } from "@/prompts/analyze-case.ts";
import {
  generateArgumentsPrompt,
  generateArgumentsSchema,
} from "@/prompts/generate-arguments.ts";
import {
  recommendNextStepPrompt,
  recommendNextStepSchema,
} from "@/prompts/recommend-next-step.ts";
import type { StepKey } from "./service-keys";

export { STEP_KEYS, isStepKey, type StepKey } from "./service-keys";

// How many passages are retrieved and shown to the model per step.
const STATUTE_K = 14;
const JUDGMENT_K = 10;

// Run one workflow step: retrieve from the corpus, reason over what was
// retrieved, drop anything the model invented, persist, and return it.
export async function generateStep(researchId: string, step: StepKey) {
  const status = corpusStatus();
  if (!status.present || status.passages === 0) {
    throw new Error(
      "The legal corpus is empty. Run `npm run corpus:acts` (and `npm run corpus:sc`) before generating.",
    );
  }

  const research = await prisma.research.findUnique({
    where: { id: researchId },
    include: {
      caseFacts: true,
      lawResults: true,
      precedents: true,
      analysis: true,
    },
  });
  if (!research) throw new Error("Research not found");

  const facts = toFactsInput(research.caseFacts);
  if (!facts.facts.trim()) {
    throw new Error("Enter the case facts (Step 1) before running this step.");
  }

  const caseText = formatCaseFacts(facts);
  const query = buildQuery(caseText);
  const provider = getProvider();

  let result: unknown;
  switch (step) {
    case "laws":
      result = await runLaws(researchId, provider, caseText, query);
      break;
    case "precedents":
      result = await runPrecedents(researchId, provider, caseText, query, research.lawResults);
      break;
    case "analysis":
      result = await runAnalysis(researchId, provider, caseText);
      break;
    case "arguments":
      result = await runArguments(researchId, provider, caseText);
      break;
    case "recommendations":
      result = await runRecommendations(researchId, provider, caseText);
      break;
  }

  await prisma.research.update({
    where: { id: researchId },
    data: { status: step === "recommendations" ? "complete" : "in_progress" },
  });

  return result;
}

async function runLaws(
  researchId: string,
  provider: ReturnType<typeof getProvider>,
  caseText: string,
  query: string,
) {
  const passages = searchCorpus("statute", query, STATUTE_K);
  if (!passages.length) {
    await prisma.lawResult.deleteMany({ where: { researchId } });
    return [];
  }

  const raw = await provider.complete({
    system: identifyLawsPrompt.system,
    prompt: identifyLawsPrompt.build(caseText, formatPassages(passages)),
  });
  const { laws } = identifyLawsSchema.parse(extractJson(raw));

  const byId = new Map(passages.map((p) => [p.passageId, p]));
  const created = laws
    .map((l) => {
      // Citation post-check: an id the model invented has no passage, so it dies here.
      const p = byId.get(l.passageId.trim());
      if (!p) return null;
      return {
        researchId,
        act: p.act,
        section: p.section,
        explanation: l.explanation,
        reason: l.reason,
        verified: true,
        sourceDocId: p.docId,
        sourcePassageId: p.passageId,
        quote: p.body,
        sourceUrl: p.sourceUrl,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  await prisma.lawResult.deleteMany({ where: { researchId } });
  if (created.length) await prisma.lawResult.createMany({ data: created });
  return created;
}

async function runPrecedents(
  researchId: string,
  provider: ReturnType<typeof getProvider>,
  caseText: string,
  query: string,
  priorLaws: { act: string; section: string }[],
) {
  const passages = searchCorpus("judgment", query, JUDGMENT_K);
  if (!passages.length) {
    await prisma.precedent.deleteMany({ where: { researchId } });
    return [];
  }

  const raw = await provider.complete({
    system: findPrecedentsPrompt.system,
    prompt: findPrecedentsPrompt.build(
      caseText,
      formatPassages(passages),
      summariseLaws(priorLaws),
    ),
  });
  const { precedents } = findPrecedentsSchema.parse(extractJson(raw));

  const byId = new Map(passages.map((p) => [p.passageId, p]));
  const created = precedents
    .map((r) => {
      const p = byId.get(r.passageId.trim());
      if (!p) return null;
      return {
        researchId,
        caseName: p.title,
        court: p.court,
        citation: p.citation,
        year: p.year,
        legalPrinciple: r.legalPrinciple,
        relevance: r.relevance,
        similarityScore: r.similarityScore,
        // Sourced: the judgment text is in the corpus and quoted below.
        verificationStatus: "sourced",
        sourceUrl: p.sourceUrl || kanoonSearchUrl(p.title, p.citation),
        sourceDocId: p.docId,
        sourcePassageId: p.passageId,
        quote: p.body,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  await prisma.precedent.deleteMany({ where: { researchId } });
  if (created.length) await prisma.precedent.createMany({ data: created });
  return created;
}

async function runAnalysis(
  researchId: string,
  provider: ReturnType<typeof getProvider>,
  caseText: string,
) {
  const sources = await sourcesForResearch(researchId);

  const raw = await provider.complete({
    system: analyzeCasePrompt.system,
    prompt: analyzeCasePrompt.build(caseText, formatPassages(sources)),
  });
  const parsed = analyzeCaseSchema.parse(extractJson(raw));
  const data = {
    issues: labelPassages(parsed.issues, sources),
    applicableLaw: labelPassages(parsed.applicableLaw, sources),
    strengths: labelPassages(parsed.strengths, sources),
    weaknesses: labelPassages(parsed.weaknesses, sources),
    missingFacts: labelPassages(parsed.missingFacts, sources),
  };

  await prisma.analysis.upsert({
    where: { researchId },
    create: { researchId, ...data },
    update: data,
  });
  return data;
}

// Swap the internal ids the model cites for the source names a reader expects.
// An id with no passage behind it is stripped, not shown.
function labelPassages(text: string, sources: Passage[]): string {
  const labels = new Map(
    sources.map((p) => [
      p.passageId,
      p.kind === "statute"
        ? `${shortAct(p.act)} s.${p.section}`
        : `${p.title} ${p.citation}`.trim(),
    ]),
  );

  return text
    .replace(/\[(p\d+)\]/g, (_m, id: string) => {
      const label = labels.get(id);
      return label ? `[${label}]` : "";
    })
    .replace(/ {2,}/g, " ")
    .replace(/\[\s*\]/g, "")
    .trim();
}

// "THE NEGOTIABLE INSTRUMENTS ACT, 1881" reads better as "Negotiable Instruments Act, 1881".
function shortAct(act: string): string {
  return act.replace(/^THE\s+/i, "").replace(/\b([A-Z])([A-Z']+)\b/g, (_m, a: string, b: string) => a + b.toLowerCase());
}

async function runArguments(
  researchId: string,
  provider: ReturnType<typeof getProvider>,
  caseText: string,
) {
  const sources = await sourcesForResearch(researchId);
  const known = new Set(sources.map((p) => p.passageId));

  const raw = await provider.complete({
    system: generateArgumentsPrompt.system,
    prompt: generateArgumentsPrompt.build(caseText, formatPassages(sources)),
  });
  const data = generateArgumentsSchema.parse(extractJson(raw));

  const toRow = (side: "applicant" | "counter") =>
    (a: { content: string; supportingLaw: string; passageId?: string }) => {
      const id = a.passageId?.trim() ?? "";
      const sourced = known.has(id);
      return {
        researchId,
        side,
        content: labelPassages(a.content, sources),
        // Never let an unmatched id masquerade as a citation.
        supportingLaw: sourced
          ? labelPassages(a.supportingLaw, sources)
          : "No source in corpus",
        sourcePassageId: sourced ? id : "",
      };
    };

  const rows = [
    ...data.applicant.map(toRow("applicant")),
    ...data.counter.map(toRow("counter")),
  ];

  await prisma.argument.deleteMany({ where: { researchId } });
  if (rows.length) await prisma.argument.createMany({ data: rows });

  return {
    applicant: rows
      .filter((r) => r.side === "applicant")
      .map(({ content, supportingLaw, sourcePassageId }) => ({
        content,
        supportingLaw,
        sourcePassageId,
      })),
    counter: rows
      .filter((r) => r.side === "counter")
      .map(({ content, supportingLaw, sourcePassageId }) => ({
        content,
        supportingLaw,
        sourcePassageId,
      })),
  };
}

async function runRecommendations(
  researchId: string,
  provider: ReturnType<typeof getProvider>,
  caseText: string,
) {
  const sources = await sourcesForResearch(researchId);

  const raw = await provider.complete({
    system: recommendNextStepPrompt.system,
    prompt: recommendNextStepPrompt.build(caseText, formatPassages(sources)),
  });
  const { recommendations } = recommendNextStepSchema.parse(extractJson(raw));

  await prisma.recommendation.deleteMany({ where: { researchId } });
  const rows = recommendations.map((r) => ({ researchId, ...r }));
  if (rows.length) await prisma.recommendation.createMany({ data: rows });
  return recommendations;
}

// Later steps reason over what steps 2-3 already sourced, so the whole
// workspace stays anchored to the same passages.
async function sourcesForResearch(researchId: string): Promise<Passage[]> {
  const [laws, precedents] = await Promise.all([
    prisma.lawResult.findMany({
      where: { researchId },
      select: { sourcePassageId: true },
    }),
    prisma.precedent.findMany({
      where: { researchId },
      select: { sourcePassageId: true },
    }),
  ]);

  const ids = [...laws, ...precedents]
    .map((r) => r.sourcePassageId)
    .filter(Boolean);

  return getPassages(ids);
}

function toFactsInput(
  facts: {
    facts: string;
    timeline: string;
    parties: string;
    reliefSought: string;
  } | null,
): CaseFactsInput {
  return {
    facts: facts?.facts ?? "",
    timeline: facts?.timeline ?? "",
    parties: facts?.parties ?? "",
    reliefSought: facts?.reliefSought ?? "",
  };
}

function summariseLaws(laws: { act: string; section: string }[]): string {
  if (!laws.length) return "";
  return laws.map((l) => `- ${l.act}, ${l.section}`).join("\n");
}
