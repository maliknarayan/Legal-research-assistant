"use client";

import { Loader2, Sparkles, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function GenerateButton({
  isPending,
  hasData,
  onRun,
}: {
  isPending: boolean;
  hasData: boolean;
  onRun: () => void;
}) {
  return (
    <Button size="sm" variant={hasData ? "outline" : "default"} onClick={onRun} disabled={isPending}>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {hasData ? "Regenerate" : "Generate"}
    </Button>
  );
}

// Green: quoted from a document in the local corpus. Amber: model reasoning with
// no citation behind it. Grey: the corpus had nothing to offer.
export function SourcedBadge() {
  return (
    <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
      <ShieldCheck className="size-3" /> Sourced
    </Badge>
  );
}

export function InferredBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
      <TriangleAlert className="size-3" /> Inferred
    </Badge>
  );
}

export function NoSourceBadge() {
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <TriangleAlert className="size-3" /> No source
    </Badge>
  );
}

// Collapsed passage exactly as stored in the corpus — the evidence for a claim.
export function SourceQuote({
  quote,
  sourceUrl,
  label,
}: {
  quote: string;
  sourceUrl: string;
  label: string;
}) {
  if (!quote) return null;
  return (
    <details className="mt-2 rounded-md border bg-muted/40 p-2">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
        Source text — {label}
      </summary>
      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed">{quote}</p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-primary hover:underline"
        >
          Open original document
        </a>
      )}
    </details>
  );
}

export function AiDisclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
      {children}
    </p>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
