import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import type { CompleteOptions, LLMProvider } from "../types";

const TIMEOUT_MS = 180_000;

// Calls the locally logged-in Claude Code CLI in headless print mode.
// Uses the user's subscription — no API key. Local only.
export const claudeCliProvider: LLMProvider = {
  name: "claude-cli",
  async complete(opts: CompleteOptions): Promise<string> {
    const bin = process.env.CLAUDE_CLI_BIN || "claude";
    const model = opts.model || process.env.CLAUDE_CLI_MODEL || "claude-sonnet-5";

    // System + user prompt combined via stdin to avoid shell-quoting issues.
    const input = `${opts.system}\n\n${opts.prompt}`;

    const raw = await runClaude(bin, model, input);

    let parsed: { result?: string; is_error?: boolean };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Claude CLI returned non-JSON output");
    }
    if (parsed.is_error || typeof parsed.result !== "string") {
      throw new Error("Claude CLI reported an error");
    }
    return parsed.result;
  },
};

function runClaude(bin: string, model: string, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      bin,
      ["-p", "--output-format", "json", "--model", model],
      // Neutral cwd so the project's CLAUDE.md is not loaded into context.
      { shell: true, cwd: tmpdir() },
    );

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Claude CLI timed out"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr || `Claude CLI exited with code ${code}`));
        return;
      }
      resolve(stdout);
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}
