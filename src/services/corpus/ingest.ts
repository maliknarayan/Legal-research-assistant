import type { DatabaseSync } from "node:sqlite";

export interface CorpusDocument {
  id: string;
  kind: "statute" | "judgment";
  title: string;
  act?: string;
  section?: string;
  chapter?: string;
  court?: string;
  year?: string;
  citation?: string;
  caseId?: string;
  judges?: string;
  decisionDate?: string;
  sourceUrl: string;
}

export interface CorpusChunk {
  heading: string;
  body: string;
}

// Insert one document with its passages. Re-ingesting an id replaces it.
export function upsertDocument(
  db: DatabaseSync,
  doc: CorpusDocument,
  chunks: CorpusChunk[],
): void {
  db.prepare("DELETE FROM chunks WHERE doc_id = ?").run(doc.id);
  db.prepare("DELETE FROM documents WHERE id = ?").run(doc.id);

  db.prepare(
    `INSERT INTO documents
       (id, kind, title, act, section, chapter, court, year, citation, case_id,
        judges, decision_date, source_url, ingested_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    doc.id,
    doc.kind,
    doc.title,
    doc.act ?? "",
    doc.section ?? "",
    doc.chapter ?? "",
    doc.court ?? "",
    doc.year ?? "",
    doc.citation ?? "",
    doc.caseId ?? "",
    doc.judges ?? "",
    doc.decisionDate ?? "",
    doc.sourceUrl,
    new Date().toISOString(),
  );

  const insert = db.prepare(
    "INSERT INTO chunks (doc_id, ordinal, heading, body) VALUES (?, ?, ?, ?)",
  );
  chunks.forEach((c, i) => insert.run(doc.id, i, c.heading, c.body));
}

export function hasDocument(db: DatabaseSync, id: string): boolean {
  const row = db.prepare("SELECT 1 AS n FROM documents WHERE id = ?").get(id);
  return row !== undefined;
}

export function logIngest(
  db: DatabaseSync,
  source: string,
  detail: string,
  documents: number,
): void {
  db.prepare(
    `INSERT INTO ingest_log (source, detail, documents, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(source) DO UPDATE SET detail = excluded.detail,
       documents = excluded.documents, updated_at = excluded.updated_at`,
  ).run(source, detail, documents, new Date().toISOString());
}

// Split long text on paragraph boundaries, keeping passages retrievable and
// small enough to paste into a prompt whole.
export function chunkText(
  text: string,
  maxChars = 2600,
  overlapChars = 250,
): string[] {
  const clean = normaliseText(text);
  if (clean.length <= maxChars) return clean ? [clean] : [];

  const paragraphs = clean.split(/\n{2,}/);
  const out: string[] = [];
  let buffer = "";

  for (const para of paragraphs) {
    for (const piece of splitOversized(para, maxChars)) {
      if (buffer && buffer.length + piece.length + 2 > maxChars) {
        out.push(buffer);
        buffer = overlapChars > 0 ? buffer.slice(-overlapChars) : "";
      }
      buffer = buffer ? `${buffer}\n\n${piece}` : piece;
    }
  }
  if (buffer.trim()) out.push(buffer);
  return out;
}

// A single paragraph longer than the limit is cut on sentence ends.
function splitOversized(para: string, maxChars: number): string[] {
  if (para.length <= maxChars) return [para];
  const sentences = para.split(/(?<=[.;])\s+/);
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && buf.length + s.length + 1 > maxChars) {
      out.push(buf);
      buf = "";
    }
    buf = buf ? `${buf} ${s}` : s;
    while (buf.length > maxChars) {
      out.push(buf.slice(0, maxChars));
      buf = buf.slice(maxChars);
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}

// Strip PDF extraction artefacts: hard-wrapped lines, page furniture, mojibake.
export function normaliseText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/�/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
