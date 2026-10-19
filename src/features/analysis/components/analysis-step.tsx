"use client";

import { StepSection } from "@/features/research/components/step-section";
import { useStepGeneration } from "@/features/steps/use-step-generation";
import type { AnalysisView } from "@/features/steps/types";
import {
  AiDisclaimer,
  EmptyHint,
  GenerateButton,
} from "@/features/steps/components/step-controls";
import { Skeleton } from "@/components/ui/skeleton";

const FIELDS: { key: keyof AnalysisView; label: string }[] = [
  { key: "issues", label: "Issues" },
  { key: "applicableLaw", label: "Applicable Law" },
  { key: "strengths", label: "Strengths" },
  { key: "weaknesses", label: "Weaknesses" },
  { key: "missingFacts", label: "Missing Facts" },
];

export function AnalysisStep({
  researchId,
  initial,
}: {
  researchId: string;
  initial: AnalysisView | null;
}) {
  const { data, run, isPending } = useStepGeneration<AnalysisView | null>(
    researchId,
    "analysis",
    initial,
  );

  return (
    <StepSection
      step={4}
      title="Legal Analysis"
      description="Issues, applicable law, strengths, weaknesses, and gaps."
      action={
        <GenerateButton isPending={isPending} hasData={!!data} onRun={run} />
      }
    >
      {isPending && !data ? (
        <Skeleton className="h-32 w-full" />
      ) : !data ? (
        <EmptyHint>Not generated yet. Click Generate.</EmptyHint>
      ) : (
        <div className="flex flex-col gap-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <h3 className="text-sm font-semibold">{f.label}</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {data[f.key] || "—"}
              </p>
            </div>
          ))}
          <AiDisclaimer>
            This is AI analysis, not legal advice. Verify every legal reference
            before acting on it.
          </AiDisclaimer>
        </div>
      )}
    </StepSection>
  );
}
