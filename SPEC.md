# Indian Legal Research Assistant — Specification

Status: v1 spec, written 2026-08-08. Supersedes the undocumented MVP.

## 1. What this tool is

A local-first research assistant for Indian law. A user describes a dispute in
plain language; the tool returns **grounded** guidance: applicable statutory
sections and relevant judgments, each quoted from a document the tool actually
holds on disk, with a link back to the source.

## 2. Non-negotiable rule

**Every legal citation shown to the user must resolve to a document in the local
corpus.** The model never supplies a citation from memory. If the corpus has no
match, the tool says so rather than filling the gap.

This inverts the MVP, which asked the model to recall Indian law and marked the
output "unverified". Recall is replaced by retrieval.

## 3. Corpus

Self-hosted. No paid API, no per-call cost, works offline once built.

| Source | Content | Access | Size |
|---|---|---|---|
| AWS Open Data `indian-supreme-court-judgments` | SC judgments 1950–present, PDF + parquet metadata | public S3, `--no-sign-request` / plain HTTPS | ~52 GB full |
| AWS Open Data `indian-high-court-judgments` | 25 HCs, ~17.8M judgments | public S3 | ~1.25 TiB — subset by court/year only |
| India Code (indiacode.nic.in) | Central + state bare acts, section text | HTML pages + PDF bitstreams (no API) | ~2 GB central acts |

Both AWS datasets are CC-BY-4.0 — attribution required in the UI.

Default ingest profile (`slim`): central bare acts + SC judgments 2000–present.
Profiles `full` (all SC years) and `custom` (year/court filters) also supported.

## 4. Retrieval architecture

Retrieve first, then reason.

```
case facts
  → query builder (facts → search terms)
  → FTS5 BM25 over corpus (sections + judgment chunks)
  → top-K passages with source ids
  → LLM prompted with ONLY those passages
  → answer citing passage ids
  → post-check: every citation id must exist in the retrieved set
```

Storage: SQLite FTS5 via `node:sqlite` (built in, FTS5 confirmed available).
Corpus lives in its own database file, separate from the app's Prisma database,
so it can be rebuilt or shipped independently.

Ranking v1 is BM25 only. Embedding rerank (Ollama `nomic-embed-text`) is a
later, optional layer — not required for correctness.

## 5. Workflow (UI unchanged, sources added)

The existing six-step workspace stays. Each step gains real sources.

| Step | Input | Output | Grounding |
|---|---|---|---|
| 1 Case facts | user text | stored draft | — |
| 2 Applicable law | facts | Act + section + text | section text quoted from corpus |
| 3 Reference cases | facts + laws | judgments | passage quoted, link to source PDF |
| 4 Analysis | facts + retrieved law | issues/strengths/weaknesses | cites step 2–3 sources only |
| 5 Arguments | facts + law | applicant + counter | each argument names its source |
| 6 Next steps | facts + analysis | procedural actions | flagged as procedure, not citation |

A badge distinguishes three states, replacing today's binary:
- **Sourced** — text came from a corpus document, quote shown.
- **Inferred** — model reasoning over sourced text, no independent citation.
- **No source** — corpus had nothing; gap stated openly.

## 6. Out of scope for v1

Auth / multi-user, HC full corpus, OCR of pre-1990 scanned judgments,
export to PDF, drafting of pleadings, state amendments tracking,
anything presented as legal advice.

## 7. Disclaimer requirement

Every generated view carries a standing notice: research assistance only, not
legal advice, verify against the official text before relying on it.

## 8. Build phases

1. **Corpus infrastructure** — ingestion scripts, FTS5 schema, search service.
2. **Rewire steps** — retrieval-first prompts, citation post-check, source persistence.
3. **UI sources** — quotes, links, three-state badges, corpus status in settings.
4. **Quality** — embedding rerank, HC subset ingest, tests.

## 9. Definition of done for v1

- [ ] Corpus builds from scratch with one command, resumable.
- [ ] Every law/precedent row stores a corpus document id and quoted passage.
- [ ] No citation can render without a resolvable source.
- [ ] Empty-corpus and no-match paths produce an honest message, never a guess.
- [ ] Settings shows corpus size, coverage years, and last ingest date.
