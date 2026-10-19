import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { CORPUS_SCHEMA } from "./schema.ts";

// Resolve the corpus file. Override with CORPUS_DB_PATH to point at a prebuilt corpus.
export function corpusPath(): string {
  return resolve(process.env.CORPUS_DB_PATH || "data/corpus/corpus.db");
}

export function corpusExists(): boolean {
  return existsSync(corpusPath());
}

let cached: DatabaseSync | null = null;

// Open (and migrate) the corpus. Reused across requests in dev and prod.
export function openCorpus(): DatabaseSync {
  if (cached) return cached;
  const path = corpusPath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(CORPUS_SCHEMA);
  cached = db;
  return db;
}

// Writers open their own handle so a long ingest never holds the request handle.
export function openCorpusForWrite(path = corpusPath()): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec(CORPUS_SCHEMA);
  return db;
}
