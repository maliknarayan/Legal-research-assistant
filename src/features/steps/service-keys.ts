// Client-safe step identifiers. Kept separate from the server-only service.

export const STEP_KEYS = [
  "laws",
  "precedents",
  "analysis",
  "arguments",
  "recommendations",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export function isStepKey(value: string): value is StepKey {
  return (STEP_KEYS as readonly string[]).includes(value);
}
