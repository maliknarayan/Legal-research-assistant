import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Consistent numbered container for each workflow step in the workspace.
export function StepSection({
  step,
  title,
  description,
  action,
  children,
  className,
}: {
  step: number;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-lg border bg-card text-card-foreground", className)}
    >
      <header className="flex items-start justify-between gap-4 border-b p-4 md:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {step}
          </span>
          <div>
            <h2 className="font-semibold leading-tight">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}
