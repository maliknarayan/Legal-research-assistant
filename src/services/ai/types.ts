// Contract every AI adapter implements. The app depends only on this interface.

export interface CompleteOptions {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  complete(opts: CompleteOptions): Promise<string>;
}
