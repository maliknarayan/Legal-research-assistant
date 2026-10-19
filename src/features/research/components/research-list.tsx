import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteResearchAction } from "@/features/research/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ResearchListItem {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
}

export function ResearchList({
  items,
  emptyLabel,
}: {
  items: ResearchListItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card className="transition-colors hover:border-primary/40">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <Link href={`/research/${item.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {item.updatedAt.toLocaleString("en-IN")}
                </p>
              </Link>
              <Badge variant="secondary" className="shrink-0 capitalize">
                {item.status.replace("_", " ")}
              </Badge>
              {/* Delete is a server action bound to this research id. */}
              <form action={deleteResearchAction.bind(null, item.id)}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete research"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
