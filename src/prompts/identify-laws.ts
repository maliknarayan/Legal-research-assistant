import { z } from "zod";
import { HONESTY_RULES } from "./context.ts";

// Step 2 — pick the applicable sections from retrieved statute passages.
// The model selects and explains; it never supplies an Act or section itself.
export const identifyLawsSchema = z.object({
  laws: z.array(
    z.object({
      passageId: z.string(),
      explanation: z.string(),
      reason: z.string(),
    }),
  ),
});

export type IdentifyLawsOutput = z.infer<typeof identifyLawsSchema>;

export const identifyLawsPrompt = {
  system: `You are an expert Indian legal researcher specialising in statutory analysis. ${HONESTY_RULES}`,
  build: (caseText: string, sources: string) =>
    `Select the statutory sections from SOURCES that apply to this case. Ignore sources that do not apply.\n\nCASE:\n${caseText}\n\nSOURCES:\n${sources}\n\nReturn JSON: {"laws":[{"passageId":"<id of the source, e.g. p123>","explanation":"<what this section provides, in plain language>","reason":"<why it applies to these facts>"}]}. Order the most directly applicable first. Use only ids that appear in SOURCES. If none apply, return {"laws":[]}.`,
};
