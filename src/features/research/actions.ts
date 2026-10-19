"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createResearch,
  deleteResearch,
  saveCaseFacts,
} from "./service";
import { caseFactsSchema } from "./schema";

// Create a new research session and jump straight into its workspace.
export async function createResearchAction() {
  const research = await createResearch();
  revalidatePath("/research");
  redirect(`/research/${research.id}`);
}

// Delete a research session from the list/history views.
export async function deleteResearchAction(id: string) {
  z.string().min(1).parse(id);
  await deleteResearch(id);
  revalidatePath("/research");
  revalidatePath("/history");
}

// Auto-save Step 1 case facts. Validated before it touches the DB.
export async function saveCaseFactsAction(
  researchId: string,
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsedId = z.string().min(1).safeParse(researchId);
  if (!parsedId.success) return { ok: false, error: "Invalid research id" };

  const parsed = caseFactsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await saveCaseFacts(parsedId.data, parsed.data);
  return { ok: true };
}
