import documents from '../data/documents.json';
import citations from '../data/citations.json';

export type Doc = (typeof documents)[number];
export const docs: Doc[] = documents;
export const docById = new Map(docs.map((d) => [d.id, d]));

export const docHref = (id: string, page?: number) => `/documents/${id}${page ? `#page=${page}` : ''}`;

export function keyPage(d: Doc, label: string): number | undefined {
  return d.keyPages.find((k) => k.label === label)?.page;
}

/** Summary with {{Key page label}} tokens turned into deep links (HTML string; content is ours). */
export function summaryHtml(d: Doc): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc(d.summary).replace(/\{\{(.+?)\}\}/g, (_, label) => {
    const p = keyPage(d, label);
    return p ? `<a href="#page=${p}" data-goto="${p}">PDF page ${p}</a>` : label;
  });
}

export const citationsFor = (id: string) => citations.filter((c) => c.doc === id);

const TCSD_FY: Record<string, string> = { FY2022: 'audits/tcsd-fy2022', FY2023: 'audits/tcsd-fy2023', FY2024: 'audits/tcsd-fy2024', FY2025: 'audits/tcsd-fy2025' };
export const tcsdAuditId = (fy: string) => TCSD_FY[fy];
