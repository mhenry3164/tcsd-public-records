# TCSD Public Record

A static, searchable website of public records about the **Tishomingo County School District** (Iuka, Mississippi): audited financial statements, audit findings, board meetings and recorded votes, legal notices, board policies, payroll, vendor payments, and a comparison with six neighboring districts.

Every figure on the site links to the document it came from. The site carries no commentary and endorses no one.

Built and maintained by Matthew Henry, a parent with two children in the district. Independent of every candidate, the district, and the board. Nothing is sponsored. Refreshed quarterly.

**Corrections:** email mhenry@effiwise.com with the page and a source, or open an issue in this repository. Corrections are made promptly and noted in the [changelog](src/data/changelog.json).

## What is in this repository

Everything needed to rebuild the site, and nothing that is not already public.

| Content | Where | Source |
|---|---|---|
| Audited financial statements, FY2022–FY2025, and six neighboring districts' audits (PDF) | `public/audits/`, `public/peer-audits/` | Mississippi Office of the State Auditor |
| Four-year financial tables, audit findings, cost per student | `src/data/finances.json`, `findings.json`, `cost-per-student.json` | Transcribed from those audits; `audits.json` and `citations.json` hold the PDF page numbers |
| District comparison | `src/data/benchmarks.json`, `public/data/tcsd_benchmarks.csv` | The same schedules in each district's audit; MDE ratings; OpenTheBooks |
| Payroll 2017–2025, vendor annual totals 2023–2024 | `public/data/*.csv`, `src/data/salaries-*.json`, `vendors-*.json` | Mississippi Department of Education and the district, as published by OpenTheBooks.com, reproduced unchanged |
| Index of 320 board policies | `src/data/policies.json` | The district's policy manual on Simbli |
| Meeting calendar | `src/data/meetings-calendar.json` | The district's OAgendas page |
| Reported meetings, recorded votes, board member records | `src/data/meetings/*.json`, `votes.json`, `members.json` | Facts reported by the Tishomingo County News, each cited by issue date and page |
| District legal notices, full text | `src/content/notices/*.md` | Notices the district published under state law |
| Mississippi Ethics Commission order M-25-022 (PDF) | `public/records/` | Mississippi Ethics Commission |
| Searchable text of every PDF | `src/data/doc-text/*.json` | Extracted from the PDFs above |

**What is not here.** No newspaper issues, pages, or article text. The Tishomingo County News's reporting is its copyrighted work; this project records only the facts reported, short attributed quotes, and the issue date and page. To read the reports, subscribe at [tishconews.org](https://tishconews.org).

## Editorial rules

- Public record only. No social-media content, no opinion.
- Never a page without a source line.
- No adjectives about people. Verbs from the record only: moved, seconded, opposed, recused, absent, requested, stated.
- A board member's vote appears only when it was printed. Nothing is inferred.
- Personnel actions on meeting pages are counted, not named.
- Executive-session items are listed as the paper listed them, nothing more.
- What is not public is listed on the Missing records page, with a log of records requests.

Meeting files carry `"reviewed": false` until a person has checked them against the printed page.

## Run it

Requires Node 20 or newer.

```
npm install
npm run dev        # local dev server (search works only after a build)
npm run build      # static site in dist/, plus the Pagefind search index
npm run preview
```

Stack: [Astro](https://astro.build) static output, Tailwind CSS, [Pagefind](https://pagefind.app) search, PDF.js for the document viewer. Charts are plain HTML and inline SVG rendered at build time. Deploys to any static host; `vercel.json` sets the Astro preset and serves PDFs inline.

## Maintaining the data

| To change | Edit |
|---|---|
| Site address, corrections email, last-updated date | `src/data/site.json` (the address feeds canonical tags, the sitemap and robots.txt) |
| A new reported meeting | Copy a file in `src/data/meetings/`, name it by meeting date, fill it from the report, set `reviewed` once checked |
| A recorded vote or member fact | `src/data/votes.json`, `src/data/members.json` |
| A legal notice | New Markdown file in `src/content/notices/` (frontmatter schema in `src/content.config.ts`) |
| A records request or response | `src/data/records-requests.json`: `{ sent, to, items[], responseDue, status, responseSummary, files[] }` |
| A new PDF (audit, budget, records response) | Put it under `public/<collection>/`, add an entry to `src/data/documents.json` (title, author, date, pages, key pages, plain-language summary), run `npm run extract`, commit `src/data/doc-text/`. Link to it as `/documents/<collection>/<slug>#page=N` |
| What changed | `src/data/changelog.json` |

Two helper scripts regenerate data from source files kept outside this repo:

- `npm run import` (Python 3 with `openpyxl`) rebuilds the JSON and CSV files from the source spreadsheet and CSVs. Set `TCSD_DATA_DIR` to the folder that holds them.
- `npm run extract` (needs `pdftotext` from poppler) rebuilds the per-page PDF text. Its output is committed so hosted builds do not need poppler.

`npm run refresh` runs import, extract and build in order.

### Quarterly refresh (January, April, July, October; audits each February)

1. Review new issues of the newspaper for district legal notices and board meeting reports; add notices and meeting files.
2. Update the meeting calendar from OAgendas.
3. Each February, check the State Auditor's site for the district's new audit and the six neighbors' audits; add the PDFs and update the finance, findings and benchmark data.
4. Replace the payroll and vendor CSVs when OpenTheBooks posts a new year.
5. Refresh the policy index from Simbli.
6. Update the records-request log and add any documents received.
7. Set `lastUpdated`, add a changelog entry, rebuild, deploy, resubmit the sitemap.

## Reuse

The audits, legal notices, policies, payroll and vendor data are public records. Facts are free to reuse; please cite the original source, which every page names. Found an error? Open an issue or send a correction with a source.
