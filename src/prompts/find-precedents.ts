import { z } from "zod";
import { HONESTY_RULES } from "./context.ts";

// Step 3 — pick relevant judgments from retrieved judgment passages.
// Case names and citations come from the corpus, never from the model.
export const findPrecedentsSchema = z.object({
  precedents: z.array(
    z.object({
      passageId: z.string(),
      legalPrinciple: z.string(),
      relevance: z.string(),
      similarityScore: z.number().min(0).max(1),
    }),
  ),
});

export type FindPrecedentsOutput = z.infer<typeof findPrecedentsSchema>;

export const findPrecedentsPrompt = {
  system: `You are an expert on Indian case law from the Supreme Court and High Courts. ${HONESTY_RULES}`,
  build: (caseText: string, sources: string, laws: string) =>
    `Select the judgments from SOURCES that are genuinely relevant to this case. Discard any that only share generic wording.\n\nCASE:\n${caseText}\n\n${
      laws ? `APPLICABLE LAW ALREADY IDENTIFIED:\n${laws}\n\n` : ""
    }SOURCES:\n${sources}\n\nReturn JSON: {"precedents":[{"passageId":"<id from SOURCES>","legalPrinciple":"<the principle this passage establishes>","relevance":"<how it bears on these facts>","similarityScore":<0.0-1.0>}]}. Use only ids that appear in SOURCES. If none are relevant, return {"precedents":[]}.`,
};
