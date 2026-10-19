import type { CaseFactsInput } from "@/types";
import type { Passage } from "@/services/corpus/search.ts";

// Format the user's case facts into a consistent block for every prompt.
export function formatCaseFacts(facts: CaseFactsInput): string {
  return [
    `FACTS:\n${facts.facts || "(none provided)"}`,
    `PARTIES:\n${facts.parties || "(none provided)"}`,
    `TIMELINE:\n${facts.timeline || "(none provided)"}`,
    `RELIEF SOUGHT:\n${facts.reliefSought || "(none provided)"}`,
  ].join("\n\n");
}

// Render retrieved passages as a labelled source list the model must cite by id.
export function formatPassages(passages: Passage[]): string {
  if (!passages.length) return "(no sources retrieved)";

  return passages
    .map((p) => {
      const label =
        p.kind === "statute"
          ? `${p.act} — Section ${p.section}`
          : `${p.title} ${p.citation} (${p.court}, ${p.year})`;
      return `[${p.passageId}] ${label}\n${p.body}`;
    })
    .join("\n\n---\n\n");
}

// Appended to every system prompt. The corpus, not the model's memory, is the authority.
export const HONESTY_RULES = [
  "You are assisting with Indian law only.",
  "You may rely ONLY on the SOURCES supplied in the user message.",
  "Never introduce an Act, section, judgment, citation, or court from your own memory.",
  "Every item you return must reference the id of a supplied source.",
  "If the sources do not support an answer, return an empty list rather than guessing.",
  "Respond with ONLY valid JSON matching the requested shape. No prose, no markdown fences.",
].join(" ");
