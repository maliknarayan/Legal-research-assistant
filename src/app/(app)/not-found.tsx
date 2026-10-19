import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h2 className="text-lg font-semibold">Not found</h2>
      <p className="text-sm text-muted-foreground">
        This research session does not exist or was deleted.
      </p>
      <Button render={<Link href="/research" />}>Back to research</Button>
    </div>
  );
}
