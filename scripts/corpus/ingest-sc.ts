// Ingest Supreme Court judgments into the corpus.
// Source: AWS Open Data "indian-supreme-court-judgments" (CC-BY-4.0), public bucket,
// no credentials. Metadata is read straight from the remote parquet; only the PDFs
// of the selected years are downloaded, and only their text is kept.
//
// Usage: npm run corpus:sc -- --from=2020 --to=2026 [--limit=200] [--concurrency=4]

import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import { extractText, getDocumentProxy } from "unpdf";
import { openCorpusForWrite } from "../../src/services/corpus/db.ts";
import {
  chunkText,
  hasDocument,
  logIngest,
  upsertDocument,
} from "../../src/services/corpus/ingest.ts";

const BUCKET = "https://indian-supreme-court-judgments.s3.ap-south-1.amazonaws.com";
const SOURCE = "sc-judgments";

interface MetaRow {
  title?: string;
  petitioner?: string;
  respondent?: string;
  judge?: string;
  citation?: string;
  case_id?: string;
  decision_date?: string;
  available_languages?: string;
  path?: string;
  year?: string | number;
}

const args = parseArgs();

async function main(): Promise<void> {
  const db = openCorpusForWrite();
  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  for (let year = args.from; year <= args.to; year++) {
    const rows = await readYearMetadata(year);
    if (!rows.length) {
      console.log(`${year}: no metadata`);
      continue;
    }

    const english = rows.filter(
      (r) => r.path && (r.available_languages ?? "").includes("ENG"),
    );
    const wanted = args.limit ? english.slice(0, args.limit) : english;
    console.log(`${year}: ${wanted.length} English judgments`);

    await inBatches(wanted, args.concurrency, async (row) => {
      const docId = `sc:${row.path}`;
      if (hasDocument(db, docId)) {
        skipped++;
        return;
      }

      const url = `${BUCKET}/data/pdf/year=${year}/english/${row.path}_EN.pdf`;
      try {
        const text = await pdfText(url);
        const chunks = chunkText(text);
        if (!chunks.length) {
          failed++;
          return;
        }

        upsertDocument(
          db,
          {
            id: docId,
            kind: "judgment",
            title: row.title || `${row.petitioner ?? ""} v. ${row.respondent ?? ""}`.trim(),
            court: "Supreme Court of India",
            year: String(year),
            citation: row.citation ?? "",
            caseId: row.case_id ?? "",
            judges: row.judge ?? "",
            decisionDate: row.decision_date ?? "",
            sourceUrl: url,
          },
          chunks.map((body, i) => ({
            heading: `${row.title ?? ""} ${row.citation ?? ""} (part ${i + 1})`.trim(),
            body,
          })),
        );
        indexed++;
        if (indexed % 25 === 0) console.log(`  indexed ${indexed}`);
      } catch {
        // A single unreadable or scanned PDF must not abort a long ingest.
        failed++;
      }
    });
  }

  const total = Number(
    (db.prepare("SELECT COUNT(*) AS n FROM documents WHERE kind = 'judgment'").get() as
      | { n: number | bigint }
      | undefined)?.n ?? 0,
  );
  logIngest(
    db,
    SOURCE,
    `AWS Open Data indian-supreme-court-judgments (CC-BY-4.0) — years ${args.from}-${args.to}`,
    total,
  );

  console.log(
    `Done. indexed ${indexed}, already present ${skipped}, unreadable ${failed}, corpus total ${total}.`,
  );
}

// Remote parquet: hyparquet range-reads it, so no full-file download.
async function readYearMetadata(year: number): Promise<MetaRow[]> {
  const url = `${BUCKET}/metadata/parquet/year=${year}/metadata.parquet`;
  try {
    const file = await asyncBufferFromUrl({ url });
    return (await parquetReadObjects({ file })) as MetaRow[];
  } catch {
    return [];
  }
}

async function pdfText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const pdf = await getDocumentProxy(new Uint8Array(await res.arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

// Fixed-size worker pool — the bucket is public, so stay polite.
async function inBatches<T>(
  items: T[],
  size: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.max(1, size) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

function parseArgs() {
  const get = (name: string) =>
    process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  const year = new Date().getFullYear();
  return {
    from: Number(get("from") ?? year - 5),
    to: Number(get("to") ?? year),
    limit: Number(get("limit") ?? 0),
    concurrency: Number(get("concurrency") ?? 4),
  };
}

await main();
