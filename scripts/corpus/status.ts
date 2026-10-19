// Report what the corpus currently holds, and sanity-check retrieval.
// Usage: npm run corpus:status -- [--query="cheque dishonour notice"]

import { corpusPath } from "../../src/services/corpus/db.ts";
import {
  buildQuery,
  corpusStatus,
  searchCorpus,
} from "../../src/services/corpus/search.ts";

const status = corpusStatus();
console.log(`corpus: ${corpusPath()}`);

if (!status.present) {
  console.log("Not built. Run: npm run corpus:acts");
  process.exit(0);
}

console.log(
  `statutes ${status.statutes}, judgments ${status.judgments}, passages ${status.passages}`,
);
for (const s of status.sources) {
  console.log(`  ${s.source}: ${s.detail} (${s.documents} docs, ${s.updatedAt})`);
}

const probe = process.argv
  .find((a) => a.startsWith("--query="))
  ?.slice("--query=".length);

if (probe) {
  const query = buildQuery(probe);
  console.log(`\nquery: ${query}`);
  for (const kind of ["statute", "judgment"] as const) {
    console.log(`\n${kind}:`);
    const hits = searchCorpus(kind, query, 5);
    if (!hits.length) console.log("  (no match)");
    for (const p of hits) {
      const label = kind === "statute" ? `${p.act} s.${p.section}` : `${p.title} ${p.citation}`;
      console.log(`  ${p.score.toFixed(1)}  ${label}`);
    }
  }
}
