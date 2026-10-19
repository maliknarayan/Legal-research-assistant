import "server-only";
import { getProviderName, type ProviderName } from "./provider";
import type { LLMProvider } from "./types";
import { claudeCliProvider } from "./adapters/claude-cli";
import { anthropicProvider } from "./adapters/anthropic";
import { ollamaProvider } from "./adapters/ollama";

const registry: Record<ProviderName, LLMProvider> = {
  "claude-cli": claudeCliProvider,
  anthropic: anthropicProvider,
  ollama: ollamaProvider,
};

// Resolve the active provider from configuration.
export function getProvider(): LLMProvider {
  return registry[getProviderName()];
}

export type { LLMProvider, CompleteOptions } from "./types";
export { getProviderName } from "./provider";
