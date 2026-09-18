# TCSD Public Record

Static, searchable public-record site for the Tishomingo County School District (Mississippi). Astro (static output) + Tailwind + Pagefind. Every fact links to its source.

## Commands

```
npm install
npm run import     # rebuild src/data/*.json, public/data/*.csv and the PDFs in public/ from ../tish_paper/district_data (needs: pip install openpyxl)
npm run extract    # per-page PDF text -> src/data/doc-text/*.json (needs poppler: brew install poppler). Commit the output:
                   # Vercel builds remotely and has no pdftotext, so the build only reads these files.
npm run dev        # local dev server (search only works after a build)
npm run build      # astro build + pagefind index
npm run preview
vercel --prod      # deploy
```

## Where content lives

| What | File(s) | How it's made |
|---|---|---|
| Site settings (domain, corrections email) | `src/data/site.json` | Hand-edited — **set `url` and `correctionsEmail` before launch** (also used by robots.txt, sitemap, canonical tags) |
| Board members, recorded votes | `src/data/members.json`, `src/data/votes.json` | Hand-authored from `school_board/02_BOARD_MEMBER_RECORD.md`, checked against page text |
| Meeting reports | `src/data/meetings/YYYY-MM-DD.json` | Extracted from newspaper reports; every file has `"reviewed": false` until a person checks it against the issue |
| Meeting calendar | `src/data/meetings-calendar.json` | `npm run import` (xlsx "Board Meetings" tab, from OAgendas) |
| Legal notices | `src/content/notices/*.md` | Transcribed in full from `*_legal-notice.md` pages, trimmed to the notice |
| Finances, audit findings | `src/data/finances.json`, `findings.json`, `cost-per-student.json`, `audits.json` (PDF page numbers) | `npm run import` + hand-verified page refs |
| Budget hearings | `src/data/budget-hearings.json` | Hand-authored from TCN 2025-07-24 p2 and 2026-07-30 p4 |
| Salaries, vendors, policies | `src/data/salaries-*.json`, `vendors-*.json`, `policies.json` | `npm run import` from the CSVs |
| Records requests | `src/data/records-requests.json` | Hand-edited. Shape: `{ "sent", "to", "items": [], "responseDue", "status", "responseSummary", "files": [{ "label", "href" }] }` |
| Sources page | `src/data/sources.json` | Hand-edited |
| Documents (PDF viewer) | `src/data/documents.json` | Hand-edited registry: title, author, report date, file, key pages (PDF page numbers), plain-language summary (`{{Key page label}}` becomes a page link) |
| Document text for search | `src/data/doc-text/*.json` | `npm run extract` |
| Which site pages cite which PDF page | `src/data/citations.json` | Hand-edited; shown on each document page |
| Benchmarks | `src/data/benchmarks.json` | `npm run import` from `tcsd_benchmarks.csv`; the fact bullets and summary are in `src/pages/benchmarks.astro` |

## Adding a new meeting report

1. Copy an existing `src/data/meetings/*.json`, name it by meeting date.
2. Fill it from the report: counts only for personnel (no employee names), every dollar item in `money`, members' votes only when printed.
3. Set `"reviewed": true` once checked against the printed page.

## Editorial rules (enforced by the templates, keep them when editing data)

- Never a page without a source line.
- No adjectives about people. Verbs from the record only: moved, seconded, opposed, recused, absent, requested, stated.
- Personnel actions are counted, not named, on meeting pages.
- Executive-session items listed as the paper listed them, nothing more.
- No social-media content.

## Adding a PDF (budget, records-request response, new audit)

1. Put the file under `public/<collection>/` (`audits`, `peer-audits`, `budget`, `records`) with a descriptive name.
2. Add an entry to `src/data/documents.json` (copy an existing one; set `collection`, `slug`, `pages`, `keyPages`, `summary`).
3. `npm run extract`, then commit `src/data/doc-text/`.
4. Link to it from anywhere with `/documents/<collection>/<slug>#page=N` and add rows to `citations.json`.

## Quarterly refresh (January, April, July, October; audits each February)

The gathering steps are done with Claude Code in `~/projects/tish_paper`; `npm run refresh` then re-imports, re-extracts PDF text and rebuilds.

1. **Newspaper.** Review the new weekly issues (subscriber access) for district legal notices and board meeting reports. New district notices go to `src/content/notices/`; new meeting reports get a `src/data/meetings/YYYY-MM-DD.json` with `reviewed: false` for a person to check. Newspaper issues and page text never go in this repo.
2. **Meetings calendar.** Re-pull the OAgendas list into the workbook's Board Meetings tab (or edit `src/data/meetings-calendar.json`).
3. **Audits (February).** Check osa.ms.gov for the new TCSD audit and the six peer audits; add PDFs and `documents.json` entries; update `tcsd_benchmarks.csv`, `finances.json` inputs, `findings`, `audits.json`, `cost-per-student.json`, `citations.json`.
4. **Payroll and vendors.** Re-pull OpenTheBooks when a new year appears; replace the CSVs.
5. **Policies.** Re-scrape the Simbli listing into `tcsd_policy_index.csv`.
6. **Records log.** Update `src/data/records-requests.json`; put any documents received under `public/records/` and register them in `documents.json`.
7. Set `lastUpdated` in `src/data/site.json`, add an entry to `src/data/changelog.json`, run `npm run refresh`, deploy, resubmit the sitemap.
