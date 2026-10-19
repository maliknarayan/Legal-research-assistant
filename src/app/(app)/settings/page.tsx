import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProviderName } from "@/services/ai/provider";
import { corpusStatus } from "@/services/corpus/search.ts";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const provider = getProviderName();
  const corpus = corpusStatus();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Environment configuration for this MVP.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Provider</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Active provider</span>
            <Badge variant="outline" className="uppercase">
              {provider}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Change the provider by setting <code>AI_PROVIDER</code> in{" "}
            <code>.env</code> to <code>claude-cli</code>, <code>anthropic</code>,
            or <code>ollama</code>, then restart the dev server.
          </p>
          {provider === "claude-cli" && (
            <p className="rounded-md bg-muted p-3 text-muted-foreground">
              The <strong>claude-cli</strong> provider calls your locally
              logged-in Claude Code subscription — no API key. Local only,
              slower per request, and subject to your subscription rate limits.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legal Corpus</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {!corpus.present || corpus.passages === 0 ? (
            <p className="rounded-md bg-muted p-3 text-muted-foreground">
              No corpus found. Build it with <code>npm run corpus:acts</code>{" "}
              (Central Acts) and <code>npm run corpus:sc</code> (Supreme Court
              judgments). Generation is blocked until then.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Sections" value={corpus.statutes} />
                <Stat label="Judgments" value={corpus.judgments} />
                <Stat label="Passages" value={corpus.passages} />
              </div>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                {corpus.sources.map((s) => (
                  <li key={s.source}>
                    <span className="font-medium">{s.source}</span> — {s.detail}{" "}
                    (updated {new Date(s.updatedAt).toLocaleDateString("en-IN")})
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verification Policy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sections and judgments are retrieved from the local corpus before the
          model is called, and anything the model cites that is not in that
          retrieved set is discarded. Nothing reaches this screen without a
          quotable source. Statute data ends at 2020 and Supreme Court coverage
          depends on the years you ingested — treat both as research aids, not
          legal advice.
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-lg font-semibold">{value.toLocaleString("en-IN")}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
