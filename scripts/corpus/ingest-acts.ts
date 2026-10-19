// Ingest Central Acts into the corpus, one document per section.
// Source: "An annotated dataset of Central Acts enacted by the Indian Parliament"
// (Zenodo record 5088102, CC-BY-4.0) — 858 Acts, 1838-2020, parsed from India Code PDFs.
//
// Usage: npm run corpus:acts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { openCorpusForWrite } from "../../src/services/corpus/db.ts";
import {
  chunkText,
  logIngest,
  normaliseText,
  upsertDocument,
} from "../../src/services/corpus/ingest.ts";

const ZIP_URL =
  "https://zenodo.org/api/records/5088102/files/annotatedCentralActs.zip/content";
const ZIP_PATH = resolve("data/corpus/raw/annotatedCentralActs.zip");
const SOURCE = "central-acts";

// The dataset nests section text as {"0": "text"} or {"0": {text, contains: {...}}}.
type Nested = string | { text?: string; contains?: Record<string, Nested> };

interface ActSection {
  heading?: string;
  paragraphs?: Record<string, Nested>;
}

interface ActChapter {
  ID?: string;
  Name?: string;
  Sections?: Record<string, ActSection>;
}

interface ActFile {
  "Act Title"?: string;
  "Act ID"?: string;
  "Enactment Date"?: string;
  Chapters?: Record<string, ActChapter>;
}

async function main(): Promise<void> {
  const zip = await ensureZip();
  const files = unzipSync(zip, { filter: (f) => f.name.endsWith(".json") });

  const db = openCorpusForWrite();
  let acts = 0;
  let sections = 0;

  db.exec("BEGIN");
  try {
    for (const [name, bytes] of Object.entries(files)) {
      const act = JSON.parse(strFromU8(bytes)) as ActFile;
      const title = clean(act["Act Title"]);
      if (!title) continue;

      const actKey = name.replace(/\.json$/, "");
      const year = title.match(/,\s*(\d{4})\s*$/)?.[1] ?? "";
      acts++;

      for (const chapter of Object.values(act.Chapters ?? {})) {
        const chapterName = [clean(chapter.ID), clean(chapter.Name)]
          .filter(Boolean)
          .join(" — ");

        for (const [sectionLabel, section] of Object.entries(
          chapter.Sections ?? {},
        )) {
          const body = normaliseText(flatten(section.paragraphs));
          if (body.length < 40) continue;

          const sectionNo = clean(sectionLabel).replace(/^Section\s*|\.$/g, "");
          const heading = clean(section.heading);
          const docId = `act:${actKey}:${sectionNo || String(sections)}`;

          upsertDocument(
            db,
            {
              id: docId,
              kind: "statute",
              title: `${title} — Section ${sectionNo}${heading ? `: ${heading}` : ""}`,
              act: title,
              section: sectionNo,
              chapter: chapterName,
              year,
              citation: clean(act["Act ID"]),
              sourceUrl: `https://www.indiacode.nic.in/handle/123456789/1362/simple-search?query=${encodeURIComponent(title)}`,
            },
            chunkText(body).map((c) => ({ heading: `${title} s.${sectionNo} ${heading}`.trim(), body: c })),
          );
          sections++;
        }
      }

      if (acts % 100 === 0) console.log(`  ${acts} acts, ${sections} sections`);
    }

    logIngest(
      db,
      SOURCE,
      `Zenodo 5088102 (CC-BY-4.0) — ${acts} Central Acts, 1838-2020`,
      sections,
    );
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  console.log(`Done. ${acts} acts, ${sections} sections indexed.`);
  console.warn(
    "Note: this dataset ends at 2020 — BNS/BNSS/BSA 2023 are not included.",
  );
}

// Download once, then reuse the local copy on every rebuild.
async function ensureZip(): Promise<Uint8Array> {
  if (existsSync(ZIP_PATH)) return new Uint8Array(readFileSync(ZIP_PATH));

  console.log("Downloading Central Acts dataset (13 MB)...");
  mkdirSync(resolve("data/corpus/raw"), { recursive: true });
  const res = await fetch(ZIP_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  writeFileSync(ZIP_PATH, bytes);
  return bytes;
}

// Walk the nested paragraph tree depth-first into flat text.
function flatten(node: Record<string, Nested> | undefined, depth = 0): string {
  if (!node || depth > 12) return "";
  const parts: string[] = [];
  for (const value of Object.values(node)) {
    if (typeof value === "string") {
      parts.push(value);
    } else if (value && typeof value === "object") {
      if (value.text) parts.push(value.text);
      if (value.contains) parts.push(flatten(value.contains, depth + 1));
    }
  }
  return parts.filter(Boolean).join("\n");
}

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

await main();
