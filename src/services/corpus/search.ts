// Server-only by construction — node:sqlite cannot resolve in a browser bundle.
import { openCorpus, corpusExists } from "./db.ts";

export interface Passage {
  passageId: string;
  docId: string;
  kind: "statute" | "judgment";
  title: string;
  act: string;
  section: string;
  court: string;
  year: string;
  citation: string;
  caseId: string;
  sourceUrl: string;
  heading: string;
  body: string;
  score: number;
}

interface ChunkRow {
  chunk_id: number;
  doc_id: string;
  kind: string;
  title: string;
  act: string;
  section: string;
  court: string;
  year: string;
  citation: string;
  case_id: string;
  source_url: string;
  heading: string;
  body: string;
  score: number;
}

// Words that carry no retrieval signal in Indian legal prose.
const STOPWORDS = new Set([
  "about", "after", "against", "also", "another", "because", "been", "before",
  "being", "between", "both", "case", "cases", "court", "does", "during",
  "each", "even", "ever", "every", "from", "have", "having", "here",
  "however", "into", "matter", "more", "most", "much", "must", "only",
  "other", "over", "same", "shall", "should", "since", "some", "such", "than",
  "that", "their", "them", "then", "there", "these", "they", "this", "those",
  "through", "under", "upon", "very", "were", "what", "when", "where", "which",
  "while", "will", "with", "within", "without", "would", "your",
]);

// Turn free-text case facts into an FTS5 OR query. Unknown input is never
// interpolated raw — every token is quoted, so MATCH syntax cannot be injected.
export function buildQuery(text: string, extraTerms: string[] = []): string {
  const tokens = `${text} ${extraTerms.join(" ")}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));

  // Keep the most frequent distinct terms — long facts otherwise dilute BM25.
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([t]) => `"${t}"`);

  return ranked.join(" OR ");
}

// Retrieve the best-matching passages of one kind. Empty query or empty corpus
// yields an empty list — callers must treat that as "no source", never guess.
export function searchCorpus(
  kind: "statute" | "judgment",
  query: string,
  limit = 12,
): Passage[] {
  if (!corpusExists() || !query.trim()) return [];

  const db = openCorpus();
  const rows = db
    .prepare(
      `SELECT c.id AS chunk_id, d.id AS doc_id, d.kind, d.title, d.act, d.section,
              d.court, d.year, d.citation, d.case_id, d.source_url,
              c.heading, c.body,
              bm25(chunk_fts, 2.0, 1.0) AS score
         FROM chunk_fts
         JOIN chunks c ON c.id = chunk_fts.rowid
         JOIN documents d ON d.id = c.doc_id
        WHERE chunk_fts MATCH ? AND d.kind = ?
        ORDER BY score
        LIMIT ?`,
    )
    .all(query, kind, limit) as unknown as ChunkRow[];

  return rows.map(toPassage);
}

// Fetch specific passages by id so a citation can be re-resolved on render.
export function getPassages(passageIds: string[]): Passage[] {
  if (!corpusExists() || passageIds.length === 0) return [];

  const ids = passageIds
    .map((id) => Number(id.replace(/^p/, "")))
    .filter((n) => Number.isInteger(n));
  if (ids.length === 0) return [];

  const db = openCorpus();
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT c.id AS chunk_id, d.id AS doc_id, d.kind, d.title, d.act, d.section,
              d.court, d.year, d.citation, d.case_id, d.source_url,
              c.heading, c.body, 0 AS score
         FROM chunks c
         JOIN documents d ON d.id = c.doc_id
        WHERE c.id IN (${placeholders})`,
    )
    .all(...ids) as unknown as ChunkRow[];

  return rows.map(toPassage);
}

export interface CorpusStatus {
  present: boolean;
  statutes: number;
  judgments: number;
  passages: number;
  sources: { source: string; detail: string; documents: number; updatedAt: string }[];
}

// Coverage report for the settings page.
export function corpusStatus(): CorpusStatus {
  if (!corpusExists()) {
    return { present: false, statutes: 0, judgments: 0, passages: 0, sources: [] };
  }

  const db = openCorpus();
  const count = (sql: string, ...args: string[]) =>
    Number(
      (db.prepare(sql).get(...args) as { n: number | bigint } | undefined)?.n ?? 0,
    );

  return {
    present: true,
    statutes: count("SELECT COUNT(*) AS n FROM documents WHERE kind = ?", "statute"),
    judgments: count("SELECT COUNT(*) AS n FROM documents WHERE kind = ?", "judgment"),
    passages: count("SELECT COUNT(*) AS n FROM chunks"),
    sources: db
      .prepare(
        "SELECT source, detail, documents, updated_at AS updatedAt FROM ingest_log ORDER BY source",
      )
      .all() as unknown as CorpusStatus["sources"],
  };
}

function toPassage(r: ChunkRow): Passage {
  return {
    passageId: `p${r.chunk_id}`,
    docId: r.doc_id,
    kind: r.kind === "statute" ? "statute" : "judgment",
    title: r.title,
    act: r.act,
    section: r.section,
    court: r.court,
    year: r.year,
    citation: r.citation,
    caseId: r.case_id,
    sourceUrl: r.source_url,
    heading: r.heading,
    body: r.body,
    score: r.score,
  };
}
