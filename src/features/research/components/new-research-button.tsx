import { FilePlus2 } from "lucide-react";
import { createResearchAction } from "@/features/research/actions";
import { Button } from "@/components/ui/button";

// Primary call-to-action for starting a new research session.
export function NewResearchButton() {
  return (
    <form action={createResearchAction}>
      <Button type="submit">
        <FilePlus2 className="size-4" />
        New Research
      </Button>
    </form>
  );
}
