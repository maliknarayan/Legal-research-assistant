import { z } from "zod";

// Validation for Step 1 case facts. Long-form free text; facts required.
export const caseFactsSchema = z.object({
  facts: z.string().trim().min(1, "Facts are required").max(20_000),
  timeline: z.string().trim().max(10_000),
  parties: z.string().trim().max(5_000),
  reliefSought: z.string().trim().max(5_000),
});

export type CaseFactsSchema = z.infer<typeof caseFactsSchema>;
