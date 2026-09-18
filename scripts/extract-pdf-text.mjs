// Extract per-page text from every PDF in src/data/documents.json so Pagefind can
// index full document text and deep-link to the page. Output is committed
// (src/data/doc-text/*.json) because the hosted build machine has no pdftotext.
// Run locally after adding or replacing a PDF:  npm run extract   (needs poppler: brew install poppler)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const docs = JSON.parse(readFileSync('src/data/documents.json', 'utf8'));
mkdirSync('src/data/doc-text', { recursive: true });

// The State Auditor prefixes each filed audit with a one-page disclaimer; it is not document content.
const OSA_COVER = /was not prepared by the Office of the State Auditor/i;

for (const d of docs) {
  const file = `public${d.file}`;
  const pages = [];
  for (let p = 1; p <= d.pages; p++) {
    const raw = execFileSync('pdftotext', ['-layout', '-f', String(p), '-l', String(p), file, '-'], { encoding: 'utf8' });
    if (p === 1 && OSA_COVER.test(raw)) continue;
    const text = raw.replace(/\f/g, '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    if (text) pages.push({ page: p, text });
  }
  const out = `src/data/doc-text/${d.collection}__${d.slug}.json`;
  writeFileSync(out, JSON.stringify(pages) + '\n');
  console.log(`${out}: ${pages.length} pages`);
}
