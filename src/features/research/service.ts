import "server-only";
import { prisma } from "@/database/prisma";
import type { CaseFactsInput } from "@/types";

// Data-access layer for research sessions. Callable from Server Components and actions.

export async function createResearch(title?: string) {
  return prisma.research.create({
    data: {
      title: title?.trim() || "Untitled research",
      caseFacts: { create: {} },
    },
  });
}

export async function listResearch() {
  return prisma.research.findMany({
    orderBy: { updatedAt: "desc" },
    include: { caseFacts: true },
  });
}

export async function getResearch(id: string) {
  return prisma.research.findUnique({
    where: { id },
    include: {
      caseFacts: true,
      lawResults: { orderBy: { createdAt: "asc" } },
      precedents: { orderBy: { similarityScore: "desc" } },
      analysis: true,
      arguments: { orderBy: { createdAt: "asc" } },
      recommendations: { orderBy: { priority: "desc" } },
    },
  });
}

export type ResearchWithRelations = NonNullable<
  Awaited<ReturnType<typeof getResearch>>
>;

export async function deleteResearch(id: string) {
  return prisma.research.delete({ where: { id } });
}

export async function saveCaseFacts(researchId: string, input: CaseFactsInput) {
  const title = deriveTitle(input.facts);
  await prisma.research.update({
    where: { id: researchId },
    data: {
      ...(title ? { title } : {}),
      caseFacts: {
        upsert: {
          create: input,
          update: input,
        },
      },
    },
  });
}

// Use the first line of the facts as a readable research title.
function deriveTitle(facts: string): string | null {
  const firstLine = facts.trim().split("\n")[0]?.trim();
  if (!firstLine) return null;
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
}
