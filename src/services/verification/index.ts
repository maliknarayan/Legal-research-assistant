// Verification is now structural: nothing reaches the UI unless it came from a
// corpus passage (see features/steps/service.ts). This module only builds the
// manual cross-check link a user follows to read the judgment on a public site.

// Build an Indian Kanoon search URL so the user can confirm a judgment independently.
export function kanoonSearchUrl(caseName: string, citation: string): string {
  const query = [caseName, citation].filter(Boolean).join(" ").trim();
  return `https://indiankanoon.org/search/?formInput=${encodeURIComponent(query)}`;
}
