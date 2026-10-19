import { z } from "zod";
import { HONESTY_RULES } from "./context.ts";

// Step 4 — structured analysis built strictly on the sourced law and judgments.
export const analyzeCaseSchema = z.object({
  issues: z.string(),
  applicableLaw: z.string(),
  strengths: z.string(),
  weaknesses: z.string(),
  missingFacts: z.string(),
});

export type AnalyzeCaseOutput = z.infer<typeof analyzeCaseSchema>;

export const analyzeCasePrompt = {
  system: `You are a senior Indian litigator analysing a brief. ${HONESTY_RULES} Reference sections and judgments only as they appear in SOURCES.`,
  build: (caseText: string, sources: string) =>
    `Analyse this case using only the supplied sources.\n\nCASE:\n${caseText}\n\nSOURCES:\n${sources}\n\nReturn JSON: {"issues":"","applicableLaw":"","strengths":"","weaknesses":"","missingFacts":""}. Each value is markdown text. In "applicableLaw", cite sections exactly as named in SOURCES. In "missingFacts", list what the client must still supply. Where the sources are silent on a point, say so instead of filling the gap.`,
};
