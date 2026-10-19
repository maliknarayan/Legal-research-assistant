# Indian Legal Research Assistant

Describe a dispute in plain language; get back the applicable statutory sections
and relevant judgments — each one quoted from a document held in a local corpus,
not recalled from a model's memory.

See [SPEC.md](SPEC.md) for the full specification.

## How it works

```
case facts → BM25 search over local corpus → top passages
           → model reasons over ONLY those passages
           → any citation not in the retrieved set is discarded
           → result stored with its source quote and link
```

The model never supplies an Act, section, case name, or citation. It selects
from what was retrieved and explains the choice. If the corpus has nothing, the
step returns empty and says so.

## Setup

```bash
npm install
npx prisma migrate dev      # app database (SQLite)
npm run corpus:acts         # Central Acts — 13 MB download, ~1 min
npm run corpus:sc           # Supreme Court judgments — see options below
npm run dev
```

### Corpus

| Command | Source | Licence |
|---|---|---|
| `npm run corpus:acts` | [Zenodo 5088102](https://zenodo.org/records/5088102) — 858 Central Acts, 1838–2020, parsed from India Code | CC-BY-4.0 |
| `npm run corpus:sc` | [AWS Open Data `indian-supreme-court-judgments`](https://registry.opendata.aws/indian-supreme-court-judgments/) — SC judgments 1950–present | CC-BY-4.0 |

`corpus:acts` indexes ~20,400 sections. `corpus:sc` takes a year range; the full
set is ~52 GB, so start narrow:

```bash
npm run corpus:sc -- --from=2020 --to=2026              # recent years
npm run corpus:sc -- --from=2024 --to=2024 --limit=50   # quick sample
npm run corpus:sc -- --from=1950 --to=2026              # everything, hours
```

Ingestion is resumable — judgments already indexed are skipped. Only extracted
text is stored; PDFs are streamed and discarded.

```bash
npm run corpus:status -- --query="cheque dishonour notice"
```

Corpus lives at `data/corpus/corpus.db` (gitignored). Point `CORPUS_DB_PATH` at a
prebuilt file to share one corpus across checkouts.

### Coverage limits

- Statutes end at **2020** — BNS, BNSS and BSA (2023) are not in the dataset.
- High Court judgments are not ingested (1.25 TiB dataset; subset support is future work).
- Old scanned judgments without a text layer are skipped, not OCR'd.

Both are stated in the UI. Do not treat gaps as "no such law".

## AI provider

Set `AI_PROVIDER` in `.env`:

| Value | Needs | Notes |
|---|---|---|
| `claude-cli` | local logged-in Claude Code | default; no API key, rate-limited by subscription |
| `anthropic` | `ANTHROPIC_API_KEY` | production path |
| `ollama` | local Ollama server | fully offline with the corpus |

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run lint           # eslint
npm run corpus:acts    # ingest Central Acts
npm run corpus:sc      # ingest Supreme Court judgments
npm run corpus:status  # corpus coverage + retrieval probe
```

## Not legal advice

Research assistance only. Every section and judgment must be read in its
official current text before it is relied on or cited anywhere.
