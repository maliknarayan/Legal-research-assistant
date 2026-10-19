"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import {
  caseFactsSchema,
  type CaseFactsSchema,
} from "@/features/research/schema";
import { saveCaseFactsAction } from "@/features/research/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SaveState = "idle" | "saving" | "saved";

const AUTOSAVE_DELAY = 1200;

export function CaseFactsForm({
  researchId,
  initial,
}: {
  researchId: string;
  initial: CaseFactsSchema;
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<CaseFactsSchema>({
    resolver: zodResolver(caseFactsSchema),
    defaultValues: initial,
    mode: "onChange",
  });

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(JSON.stringify(initial));

  // Debounced auto-save: persist drafts a short moment after typing stops.
  useEffect(() => {
    const subscription = watch((values) => {
      const snapshot = JSON.stringify(values);
      if (snapshot === lastSaved.current) return;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        setSaveState("saving");
        const result = await saveCaseFactsAction(researchId, values);
        if (result.ok) {
          lastSaved.current = snapshot;
          setSaveState("saved");
        } else {
          setSaveState("idle");
          toast.error(result.error);
        }
      }, AUTOSAVE_DELAY);
    });

    return () => {
      subscription.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [watch, researchId]);

  return (
    <form className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="facts">Facts of the dispute</Label>
          <SaveIndicator state={saveState} />
        </div>
        <Textarea
          id="facts"
          rows={8}
          placeholder="Describe what happened, in detail..."
          {...register("facts")}
        />
        {errors.facts && (
          <p className="text-xs text-destructive">{errors.facts.message}</p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="parties">Parties involved</Label>
          <Textarea
            id="parties"
            rows={4}
            placeholder="Applicant, respondent, and their roles..."
            {...register("parties")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="timeline">Timeline</Label>
          <Textarea
            id="timeline"
            rows={4}
            placeholder="Key dates and events in order..."
            {...register("timeline")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reliefSought">Relief sought</Label>
        <Textarea
          id="reliefSought"
          rows={3}
          placeholder="What outcome or remedy is the client seeking?"
          {...register("reliefSought")}
        />
      </div>
    </form>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="size-3" /> Draft saved
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">Auto-saves</span>;
}
