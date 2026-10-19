"use client";

import { ExternalLink } from "lucide-react";
import { StepSection } from "@/features/research/components/step-section";
import { useStepGeneration } from "@/features/steps/use-step-generation";
import type { PrecedentView } from "@/features/steps/types";
import {
  AiDisclaimer,
  EmptyHint,
  GenerateButton,
  SourceQuote,
  SourcedBadge,
} from "@/features/steps/components/step-controls";
import { Skeleton } from "@/components/ui/skeleton";

export function PrecedentsStep({
  researchId,
  initial,
}: {
  researchId: string;
  initial: PrecedentView[];
}) {
  // hasRun distinguishes "corpus had no match" from "never generated" —
  // identical in the data alone.
  const { data, run, isPending, hasRun } = useStepGeneration<PrecedentView[]>(
    researchId,
    "precedents",
    initial,
  );

  return (
    <StepSection
      step={3}
      title="Reference Cases"
      description="Similar judgments from Indian courts. Citations must be verified."
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
        <EmptyHint>
          {hasRun
            ? "No judgment in the corpus matched these facts. Refine the facts, or ingest more years with npm run corpus:sc."
            : "Not generated yet. Click Generate."}
        </EmptyHint>
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-4">
            {data.map((p, i) => (
              <li key={i} className="rounded-md border p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.caseName}</span>
                  <SourcedBadge />
                  <span className="ml-auto text-xs text-muted-foreground">
                    {Math.round(p.similarityScore * 100)}% similar
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {[p.court, p.year, p.citation].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Principle: </span>
                  {p.legalPrinciple}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium">Relevance: </span>
                  {p.relevance}
                </p>
                <SourceQuote
                  quote={p.quote}
                  sourceUrl={p.sourceUrl}
                  label={p.citation || p.caseName}
                />
                <a
                  href={`https://indiankanoon.org/search/?formInput=${encodeURIComponent(
                    `${p.caseName} ${p.citation}`.trim(),
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Cross-check on Indian Kanoon <ExternalLink className="size-3" />
                </a>
              </li>
            ))}
          </ul>
          <AiDisclaimer>
            Each judgment above is quoted from the Supreme Court corpus held
            locally (AWS Open Data, CC-BY-4.0). The principle and relevance lines
            are AI-written summaries of that passage — read the source text
            before relying on either.
          </AiDisclaimer>
        </div>
      )}
    </StepSection>
  );
}
