"use client";

import { StepSection } from "@/features/research/components/step-section";
import { useStepGeneration } from "@/features/steps/use-step-generation";
import type { RecommendationView } from "@/features/steps/types";
import {
  AiDisclaimer,
  EmptyHint,
  GenerateButton,
} from "@/features/steps/components/step-controls";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function RecommendationsStep({
  researchId,
  initial,
}: {
  researchId: string;
  initial: RecommendationView[];
}) {
  const { data, run, isPending } = useStepGeneration<RecommendationView[]>(
    researchId,
    "recommendations",
    initial,
  );

  const sorted = [...data].sort((a, b) => b.priority - a.priority);

  return (
    <StepSection
      step={6}
      title="Next Steps"
      description="Recommended procedural action, most urgent first."
      action={
        <GenerateButton
          isPending={isPending}
          hasData={data.length > 0}
          onRun={run}
        />
      }
    >
      {isPending && data.length === 0 ? (
        <Skeleton className="h-24 w-full" />
      ) : data.length === 0 ? (
        <EmptyHint>Not generated yet. Click Generate.</EmptyHint>
      ) : (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3">
            {sorted.map((r, i) => (
              <li key={i} className="rounded-md border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium">{r.action}</span>
                  <Badge variant="secondary" className="ml-auto">
                    Priority {r.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ol>
          <AiDisclaimer>
            AI-suggested procedural steps, not a substitute for advice from a
            licensed advocate.
          </AiDisclaimer>
        </div>
      )}
    </StepSection>
  );
}
