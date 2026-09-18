// Data shaping for /benchmarks. Kept out of the .astro frontmatter so it type-checks as plain TS.
import bench from '../data/benchmarks.json';
import { docs, docHref, keyPage } from '../lib/documents';
import { money } from '../lib/format';

export type Row = Record<string, string | number | null>;
export const rows = bench as Row[];
export const tcsd = rows.find((r) => r.District === 'Tishomingo County')!;
export const avg = rows.find((r) => String(r.District).startsWith('Peer average'))!;
export const peers = rows.filter((r) => r !== tcsd && r !== avg);
export const districtRows = [tcsd, ...peers];

// District name → its audit in the viewer, landing on the cost-per-student schedule.
export const docFor = (district: string) =>
  district === 'Tishomingo County' ? docs.find((d) => d.id === 'audits/tcsd-fy2025')! : docs.find((d) => d.collection === 'peer-audits' && d.district === district)!;
export const auditLink = (district: string) => { const d = docFor(district); return docHref(d.id, keyPage(d, 'Cost per student')); };

export const n = (v: unknown) => (typeof v === 'number' ? v : null);
export const usd = (v: unknown) => (n(v) === null ? 'n/a' : money(n(v)));
export const pctf = (v: unknown) => (n(v) === null ? 'n/a' : `${(n(v)! * 100).toFixed(1)}%`);
export const mil = (v: unknown) => (n(v) === null ? 'n/a' : `$${(n(v)! / 1e6).toFixed(1)}M`);
export const dec = (v: unknown, d = 1) => (n(v) === null ? 'n/a' : n(v)!.toFixed(d));
export const int = (v: unknown) => (n(v) === null ? 'n/a' : Math.round(n(v)!).toLocaleString('en-US'));
export const txt = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));

export const cols: { key: string; label: string; f: (v: unknown) => string }[] = [
  { key: 'Audit FY', label: 'Audit FY', f: (v) => (v ? `FY${v}` : '—') },
  { key: 'Students (ADA)', label: 'Students', f: int },
  { key: 'Cost per student, total', label: 'Cost / student', f: usd },
  { key: 'Instruction per student', label: 'Instruction / student', f: usd },
  { key: 'General admin per student', label: 'Gen. admin / student', f: usd },
  { key: 'School admin per student', label: 'School admin / student', f: usd },
  { key: 'Other per student', label: 'Other / student', f: usd },
  { key: 'Instruction share of spending', label: 'Instruction share', f: pctf },
  { key: 'Admin (gen+school) share', label: 'Admin share', f: pctf },
  { key: 'Local revenue share (all funds)', label: 'Local revenue share', f: pctf },
  { key: 'Property tax per student', label: 'Property tax / student', f: usd },
  { key: 'GF ending balance', label: 'GF balance', f: mil },
  { key: 'GF balance, months of GF spending', label: 'GF months', f: (v) => dec(v) },
  { key: 'Long-term debt per student', label: 'Debt / student', f: usd },
  { key: 'Net pension liability per student', label: 'Pension liability / student', f: usd },
  { key: 'Audit findings (state law)', label: 'Audit findings', f: (v) => (n(v) === null ? '—' : dec(v, Number.isInteger(n(v)) ? 0 : 1)) },
  { key: 'Repeat findings', label: 'Repeat', f: (v) => (n(v) === null ? '—' : dec(v, Number.isInteger(n(v)) ? 0 : 1)) },
  { key: 'Superintendent pay 2025', label: 'Supt. pay', f: usd },
  { key: 'Supt pay per student', label: 'Supt. pay / student', f: usd },
  { key: 'Accountability 2025', label: 'Accountability 2025', f: (v) => (v === 'N/A' ? 'Not rated' : txt(v)) },
];

export const diff = (a: number, b: number, unit: 'usd' | 'months') => {
  const d = a - b;
  const amt = unit === 'usd' ? money(Math.abs(Math.round(d))) : `${Math.abs(d).toFixed(1)} months`;
  const tiny = unit === 'usd' ? 0.5 : 0.05;
  return Math.abs(d) < tiny ? 'Same as peers' : `${amt} ${d < 0 ? 'below' : 'above'} peers`;
};
export const tiles = [
  { label: 'Cost per student', key: 'Cost per student, total', unit: 'usd' as const },
  { label: 'Instruction per student', key: 'Instruction per student', unit: 'usd' as const },
  { label: 'General administration per student', key: 'General admin per student', unit: 'usd' as const },
  { label: 'General Fund reserve', key: 'GF balance, months of GF spending', unit: 'months' as const },
].map((t) => {
  const a = n(tcsd[t.key])!, b = n(avg[t.key])!;
  const show = (v: number) => (t.unit === 'usd' ? money(Math.round(v)) : `${v.toFixed(1)} months`);
  return { ...t, tcsd: show(a), peer: show(b), words: diff(a, b, t.unit) };
});

export const charts = [
  { id: 'b-cost', title: 'Cost per student', key: 'Cost per student, total', format: 'money' as const, f: usd },
  { id: 'b-instr', title: 'Instruction share of all spending', key: 'Instruction share of spending', format: 'pct' as const, f: pctf },
  { id: 'b-months', title: 'General Fund reserve, months of spending', key: 'GF balance, months of GF spending', format: 'num' as const, f: (v: unknown) => dec(v) },
  { id: 'b-debt', title: 'Long-term debt per student', key: 'Long-term debt per student', format: 'money' as const, f: usd },
  { id: 'b-admin', title: 'General administration per student', key: 'General admin per student', format: 'money' as const, f: usd },
  { id: 'b-tax', title: 'Property tax per student', key: 'Property tax per student', format: 'money' as const, f: usd },
  { id: 'b-find', title: 'State-law audit findings, latest audit', key: 'Audit findings (state law)', format: 'num' as const, f: (v: unknown) => dec(v, 0) },
  { id: 'b-supt', title: 'Superintendent pay, 2025', key: 'Superintendent pay 2025', format: 'money' as const, f: usd },
].map((c) => ({ ...c, sorted: [...districtRows].filter((r) => n(r[c.key]) !== null).sort((a, b) => n(b[c.key])! - n(a[c.key])!) }));
