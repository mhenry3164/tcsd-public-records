import site from '../data/site.json';

export type SourceRef = { issue: string; page: number };

const MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** ISO date (YYYY-MM-DD or Date) → "Sept. 5, 2024" (AP style). Never shifts by timezone. */
export function fmtDate(d: string | Date, long = false): string {
  const iso = typeof d === 'string' ? d : d.toISOString().slice(0, 10);
  const [y, m, day] = iso.split('-').map(Number);
  if (!day) return `${(long ? MONTHS_LONG : MONTHS)[m - 1]} ${y}`;
  return `${(long ? MONTHS_LONG : MONTHS)[m - 1]} ${day}, ${y}`;
}

export const isoDate = (d: string | Date) => (typeof d === 'string' ? d : d.toISOString().slice(0, 10));

export function money(n: number | null | undefined, opts: { cents?: boolean } = {}): string {
  if (n === null || n === undefined) return '—';
  const neg = n < 0;
  const s = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
  return `${neg ? '−' : ''}$${s}`;
}

/** $13.9M style, for tiles. */
export function moneyShort(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return money(n);
}

export const int = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('en-US'));

export function pct(from: number | null | undefined, to: number | null | undefined): string {
  if (!from || to === null || to === undefined) return '—';
  if (from < 0 || to < 0) return '—'; // % change across a sign flip isn't meaningful
  const p = ((to - from) / Math.abs(from)) * 100;
  return `${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(1)}%`;
}

export const newspaperUrl = site.newspaper.eEditionUrl;

export function citeText(s: SourceRef): string {
  return `Tishomingo County News, ${fmtDate(s.issue)}, p. ${s.page}`;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
