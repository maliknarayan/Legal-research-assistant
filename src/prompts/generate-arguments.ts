import { z } from "zod";
import { HONESTY_RULES } from "./context.ts";

// Step 5 — arguments for both sides, each tied to a supplied source.
export const generateArgumentsSchema = z.object({
  applicant: z.array(
    z.object({
      content: z.string(),
      supportingLaw: z.string(),
      passageId: z.string().optional(),
    }),
  ),
  counter: z.array(
    z.object({
      content: z.string(),
      supportingLaw: z.string(),
      passageId: z.string().optional(),
    }),
  ),
});

export type GenerateArgumentsOutput = z.infer<typeof generateArgumentsSchema>;

export const generateArgumentsPrompt = {
  system: `You are drafting arguments for an Indian court. ${HONESTY_RULES} An argument with no supporting source must say so in "supportingLaw".`,
  build: (caseText: string, sources: string) =>
    `Draft arguments for the applicant and the counter-arguments the other side will raise.\n\nCASE:\n${caseText}\n\nSOURCES:\n${sources}\n\nReturn JSON: {"applicant":[{"content":"","supportingLaw":"","passageId":""}],"counter":[{"content":"","supportingLaw":"","passageId":""}]}. "supportingLaw" names the section or judgment from SOURCES that backs the argument, or "no source in corpus" when it rests on the facts alone. "passageId" is the source id where one applies.`,
};
