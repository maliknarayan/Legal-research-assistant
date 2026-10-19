"use client";

import { StepSection } from "@/features/research/components/step-section";
import { useStepGeneration } from "@/features/steps/use-step-generation";
import type { LawView } from "@/features/steps/types";
import {
  AiDisclaimer,
  EmptyHint,
  GenerateButton,
  NoSourceBadge,
  SourceQuote,
  SourcedBadge,
} from "@/features/steps/components/step-controls";
import { Skeleton } from "@/components/ui/skeleton";

export function LawsStep({
  researchId,
  initial,
}: {
  researchId: string;
  initial: LawView[];
}) {
  const { data, run, isPending } = useStepGeneration<LawView[]>(
    researchId,
    "laws",
    initial,
  );

  return (
    <StepSection
      step={2}
      title="Applicable Law"
      description="Indian Acts and sections that apply to the facts."
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
          <ul className="flex flex-col gap-4">
            {data.map((law, i) => (
              <li key={i} className="rounded-md border p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{law.act}</span>
                  <span className="text-sm text-muted-foreground">
                    {law.section}
                  </span>
                  {law.quote ? <SourcedBadge /> : <NoSourceBadge />}
                </div>
                <p className="text-sm">{law.explanation}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium">Why it applies: </span>
                  {law.reason}
                </p>
                <SourceQuote
                  quote={law.quote}
                  sourceUrl={law.sourceUrl}
                  label={`${law.act} s.${law.section}`}
                />
              </li>
            ))}
          </ul>
          <AiDisclaimer>
            Section text is quoted from the local corpus of Central Acts. The
            explanation and reasoning are AI-written. Check the section against
            the current bare Act — the corpus dataset ends at 2020.
          </AiDisclaimer>
        </div>
      )}
    </StepSection>
  );
}
