import { NextResponse } from "next/server";
import { generateStep, isStepKey } from "@/features/steps/service";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/research/:id/:step — run a single workflow step and return its data.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; step: string }> },
) {
  const { id, step } = await params;

  if (!isStepKey(step)) {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }

  try {
    const data = await generateStep(id, step);
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
