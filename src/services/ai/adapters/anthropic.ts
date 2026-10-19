import type { CompleteOptions, LLMProvider } from "../types";

// Direct Anthropic Messages API adapter. Used only when AI_PROVIDER=anthropic
// and ANTHROPIC_API_KEY is set. This is the production-ready path.
export const anthropicProvider: LLMProvider = {
  name: "anthropic",
  async complete(opts: CompleteOptions): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

    const model = opts.model || process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens ?? 4096,
        system: opts.system,
        messages: [{ role: "user", content: opts.prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");

    if (!text) throw new Error("Empty Anthropic response");
    return text;
  },
};
