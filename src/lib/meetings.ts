import calendar from '../data/meetings-calendar.json';
import type { SourceRef } from './format';

export type Money = { item: string; vendor: string | null; amount: number | null; amountText: string; source: SourceRef };
export type Vote = { item: string; member: string; action: string; outcome: string; source: SourceRef };
export type Report = {
  date: string; type: string; dateNote: string | null; sources: SourceRef[]; headline: string; summary: string;
  attendance: string | null; calledToOrderBy: string | null; minutesApproved: string[]; publicComment: string | null;
  votes: Vote[];
  personnel: { hires: number; resignations: number; retirements: number; transfers: number; other: number; note: string | null };
  money: Money[]; donations: { count: number; total: number; note: string | null };
  policy: { item: string; source: SourceRef }[]; superintendent: string[]; executiveSession: string[]; otherActions: string[];
  quote: { text: string; speaker: string; source: SourceRef } | null; reviewed: boolean;
};

const files = import.meta.glob<Report>('../data/meetings/*.json', { eager: true, import: 'default' });
export const reports: Report[] = Object.values(files).sort((a, b) => a.date.localeCompare(b.date));
export const reportByDate = new Map(reports.map((r) => [r.date, r]));

export type CalendarRow = (typeof calendar)[number] & { report?: Report };

/** OAgendas calendar merged with reported meetings (reports whose date isn't on the calendar are added). */
export function allMeetings(): CalendarRow[] {
  const rows: CalendarRow[] = calendar.map((m) => ({ ...m }));
  const used = new Set<string>();
  for (const row of rows) {
    const r = reportByDate.get(row.date);
    if (r && !used.has(r.date) && (r.type === row.type || !rows.some((x) => x.date === row.date && x.type === r.type))) {
      row.report = r;
      used.add(r.date);
    }
  }
  for (const r of reports) {
    if (!used.has(r.date))
      rows.push({ date: r.date, time: '', weekday: '', type: r.type, agendaPublic: false, minutesPublic: false, agendaId: '', report: r });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}
