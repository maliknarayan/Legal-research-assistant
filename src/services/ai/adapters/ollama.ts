import type { CompleteOptions, LLMProvider } from "../types";

// Local Ollama adapter. Used when AI_PROVIDER=ollama and an Ollama server runs.
export const ollamaProvider: LLMProvider = {
  name: "ollama",
  async complete(opts: CompleteOptions): Promise<string> {
    const base = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = opts.model || process.env.OLLAMA_MODEL || "llama3.1";

    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const text = data.message?.content;
    if (!text) throw new Error("Empty Ollama response");
    return text;
  },
};
