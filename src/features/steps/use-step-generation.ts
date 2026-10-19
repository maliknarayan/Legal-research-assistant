"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { StepKey } from "./service-keys";

// Runs one step via its API route and holds the latest result for rendering.
export function useStepGeneration<T>(
  researchId: string,
  step: StepKey,
  initial: T,
) {
  const [data, setData] = useState<T>(initial);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (): Promise<T> => {
      const res = await fetch(`/api/research/${researchId}/${step}`, {
        method: "POST",
      });
      const json = (await res.json()) as { data?: T; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      return json.data as T;
    },
    onSuccess: (d) => {
      setData(d);
      toast.success("Step complete");
      // Server components hold the status badge and list timestamps.
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    data,
    run: () => mutation.mutate(),
    isPending: mutation.isPending,
    hasRun: mutation.isSuccess,
  };
}
