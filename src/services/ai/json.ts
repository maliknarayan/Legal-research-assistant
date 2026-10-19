// Extract the first JSON object/array from a model response, tolerating
// markdown code fences and surrounding prose.
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  // Strip ```json ... ``` fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : trimmed;

  const start = body.search(/[[{]/);
  if (start === -1) {
    throw new Error("No JSON found in AI response");
  }

  // Walk from the first bracket to its matching close.
  const open = body[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        return JSON.parse(body.slice(start, i + 1));
      }
    }
  }

  throw new Error("Malformed JSON in AI response");
}
