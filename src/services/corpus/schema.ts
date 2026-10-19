// Corpus database schema. Plain SQLite + FTS5 via node:sqlite — no ORM, no native deps.
// Kept separate from the Prisma app database so the corpus can be rebuilt or shipped alone.

export const CORPUS_SCHEMA = `
CREATE TABLE IF NOT EXISTS documents (
  id            TEXT PRIMARY KEY,
  kind          TEXT NOT NULL,
  title         TEXT NOT NULL,
  act           TEXT NOT NULL DEFAULT '',
  section       TEXT NOT NULL DEFAULT '',
  chapter       TEXT NOT NULL DEFAULT '',
  court         TEXT NOT NULL DEFAULT '',
  year          TEXT NOT NULL DEFAULT '',
  citation      TEXT NOT NULL DEFAULT '',
  case_id       TEXT NOT NULL DEFAULT '',
  judges        TEXT NOT NULL DEFAULT '',
  decision_date TEXT NOT NULL DEFAULT '',
  source_url    TEXT NOT NULL DEFAULT '',
  ingested_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS documents_kind ON documents(kind);
CREATE INDEX IF NOT EXISTS documents_act ON documents(act);

CREATE TABLE IF NOT EXISTS chunks (
  id      INTEGER PRIMARY KEY,
  doc_id  TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  heading TEXT NOT NULL DEFAULT '',
  body    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS chunks_doc ON chunks(doc_id);

CREATE VIRTUAL TABLE IF NOT EXISTS chunk_fts USING fts5(
  heading,
  body,
  content='chunks',
  content_rowid='id',
  tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunk_fts(rowid, heading, body) VALUES (new.id, new.heading, new.body);
END;

CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunk_fts(chunk_fts, rowid, heading, body) VALUES ('delete', old.id, old.heading, old.body);
END;

CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunk_fts(chunk_fts, rowid, heading, body) VALUES ('delete', old.id, old.heading, old.body);
  INSERT INTO chunk_fts(rowid, heading, body) VALUES (new.id, new.heading, new.body);
END;

-- One row per ingest source so the UI can report coverage and staleness.
CREATE TABLE IF NOT EXISTS ingest_log (
  source     TEXT PRIMARY KEY,
  detail     TEXT NOT NULL DEFAULT '',
  documents  INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
`;
