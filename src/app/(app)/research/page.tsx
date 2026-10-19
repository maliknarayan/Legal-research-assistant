import { listResearch } from "@/features/research/service";
import { ResearchList } from "@/features/research/components/research-list";
import { NewResearchButton } from "@/features/research/components/new-research-button";

export const dynamic = "force-dynamic";

export default async function SavedResearchPage() {
  const items = await listResearch();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Saved Research</h1>
          <p className="text-sm text-muted-foreground">
            Every case you have started researching.
          </p>
        </div>
        <NewResearchButton />
      </div>
      <ResearchList
        items={items}
        emptyLabel="No research yet. Start a new one to begin."
      />
    </div>
  );
}
