import { notFound } from "next/navigation";
import { getResearch } from "@/features/research/service";
import { StepSection } from "@/features/research/components/step-section";
import { CaseFactsForm } from "@/features/case/components/case-facts-form";
import { LawsStep } from "@/features/laws/components/laws-step";
import { PrecedentsStep } from "@/features/precedents/components/precedents-step";
import { AnalysisStep } from "@/features/analysis/components/analysis-step";
import { ArgumentsStep } from "@/features/arguments/components/arguments-step";
import { RecommendationsStep } from "@/features/recommendations/components/recommendations-step";
import type {
  AnalysisView,
  ArgumentsView,
  LawView,
  PrecedentView,
  RecommendationView,
} from "@/features/steps/types";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ResearchWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const research = await getResearch(id);
  if (!research) notFound();

  const facts = research.caseFacts;

  const laws: LawView[] = research.lawResults.map((l) => ({
    act: l.act,
    section: l.section,
    explanation: l.explanation,
    reason: l.reason,
    verified: l.verified,
    quote: l.quote,
    sourceUrl: l.sourceUrl,
  }));

  const precedents: PrecedentView[] = research.precedents.map((p) => ({
    caseName: p.caseName,
    court: p.court,
    citation: p.citation,
    year: p.year,
    legalPrinciple: p.legalPrinciple,
    relevance: p.relevance,
    similarityScore: p.similarityScore,
    verificationStatus: p.verificationStatus,
    sourceUrl: p.sourceUrl,
    quote: p.quote,
  }));

  const analysis: AnalysisView | null = research.analysis
    ? {
        issues: research.analysis.issues,
        applicableLaw: research.analysis.applicableLaw,
        strengths: research.analysis.strengths,
        weaknesses: research.analysis.weaknesses,
        missingFacts: research.analysis.missingFacts,
      }
    : null;

  const argumentsView: ArgumentsView = {
    applicant: research.arguments
      .filter((a) => a.side === "applicant")
      .map((a) => ({
        content: a.content,
        supportingLaw: a.supportingLaw,
        sourcePassageId: a.sourcePassageId,
      })),
    counter: research.arguments
      .filter((a) => a.side === "counter")
      .map((a) => ({
        content: a.content,
        supportingLaw: a.supportingLaw,
        sourcePassageId: a.sourcePassageId,
      })),
  };

  const recommendations: RecommendationView[] = research.recommendations.map(
    (r) => ({ action: r.action, reason: r.reason, priority: r.priority }),
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{research.title}</h1>
          <p className="text-sm text-muted-foreground">
            Work through each step. Each result is generated independently.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 capitalize">
          {research.status.replace("_", " ")}
        </Badge>
      </div>

      <StepSection
        step={1}
        title="Case Facts"
        description="Enter the dispute details. Drafts auto-save as you type."
      >
        <CaseFactsForm
          researchId={research.id}
          initial={{
            facts: facts?.facts ?? "",
            timeline: facts?.timeline ?? "",
            parties: facts?.parties ?? "",
            reliefSought: facts?.reliefSought ?? "",
          }}
        />
      </StepSection>

      <LawsStep researchId={research.id} initial={laws} />
      <PrecedentsStep researchId={research.id} initial={precedents} />
      <AnalysisStep researchId={research.id} initial={analysis} />
      <ArgumentsStep researchId={research.id} initial={argumentsView} />
      <RecommendationsStep researchId={research.id} initial={recommendations} />
    </div>
  );
}
