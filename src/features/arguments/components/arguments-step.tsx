"use client";

import { StepSection } from "@/features/research/components/step-section";
import { useStepGeneration } from "@/features/steps/use-step-generation";
import type { ArgumentEntry, ArgumentsView } from "@/features/steps/types";
import {
  AiDisclaimer,
  EmptyHint,
  GenerateButton,
  NoSourceBadge,
  SourcedBadge,
} from "@/features/steps/components/step-controls";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY: ArgumentsView = { applicant: [], counter: [] };

export function ArgumentsStep({
  researchId,
  initial,
}: {
  researchId: string;
  initial: ArgumentsView;
}) {
  const { data, run, isPending } = useStepGeneration<ArgumentsView>(
    researchId,
    "arguments",
    initial ?? EMPTY,
  );

  const hasData = data.applicant.length > 0 || data.counter.length > 0;

  return (
    <StepSection
      step={5}
      title="Arguments"
      description="Arguments for the applicant and likely counter-arguments."
      action={
        <GenerateButton isPending={isPending} hasData={hasData} onRun={run} />
      }
    >
      {isPending && !hasData ? (
        <Skeleton className="h-32 w-full" />
      ) : !hasData ? (
        <EmptyHint>Not generated yet. Click Generate.</EmptyHint>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <ArgumentColumn title="For Applicant" items={data.applicant} />
            <ArgumentColumn title="Counter Arguments" items={data.counter} />
          </div>
          <AiDisclaimer>
            AI-drafted arguments. Confirm any Act or section cited before use.
          </AiDisclaimer>
        </div>
      )}
    </StepSection>
  );
}

function ArgumentColumn({
  title,
  items,
}: {
  title: string;
  items: ArgumentEntry[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((a, i) => (
            <li key={i} className="rounded-md border p-3 text-sm">
              <p>{a.content}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {a.sourcePassageId ? <SourcedBadge /> : <NoSourceBadge />}
                <span className="text-xs text-muted-foreground">
                  {a.supportingLaw}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
