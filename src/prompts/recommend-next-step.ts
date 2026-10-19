import { z } from "zod";

// Step 6 — procedural next steps. Procedure, not citation, so this step is the
// one place the model may answer without a corpus passage. It is labelled as such.
export const recommendNextStepSchema = z.object({
  recommendations: z.array(
    z.object({
      action: z.string(),
      reason: z.string(),
      priority: z.number().int().min(0).max(10),
    }),
  ),
});

export type RecommendNextStepOutput = z.infer<typeof recommendNextStepSchema>;

export const recommendNextStepPrompt = {
  system:
    "You advise on Indian civil and criminal procedure. Recommend practical procedural steps only — filings, notices, evidence to collect, limitation deadlines to check. Never state a section number or judgment unless it appears in SOURCES. Respond with ONLY valid JSON. No prose, no markdown fences.",
  build: (caseText: string, sources: string) =>
    `Recommend the next procedural steps for this matter.\n\nCASE:\n${caseText}\n\nSOURCES:\n${sources}\n\nReturn JSON: {"recommendations":[{"action":"","reason":"","priority":<0-10, 10 most urgent>}]}. Keep each action concrete enough to act on this week.`,
};
