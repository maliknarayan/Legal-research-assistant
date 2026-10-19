import { listResearch } from "@/features/research/service";
import { ResearchList } from "@/features/research/components/research-list";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const items = await listResearch();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          Recent research activity, most recent first.
        </p>
      </div>
      <ResearchList items={items} emptyLabel="No research history yet." />
    </div>
  );
}
