// AI provider selection. Real engines only — no placeholder output.

export type ProviderName = "claude-cli" | "anthropic" | "ollama";

const VALID: readonly ProviderName[] = ["claude-cli", "anthropic", "ollama"];

// Resolve the configured provider, defaulting to the local Claude CLI.
export function getProviderName(): ProviderName {
  const value = process.env.AI_PROVIDER?.toLowerCase();
  return VALID.includes(value as ProviderName)
    ? (value as ProviderName)
    : "claude-cli";
}
