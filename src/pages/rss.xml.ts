import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import site from '../data/site.json';
import { reports } from '../lib/meetings';
import { fmtDate } from '../lib/format';
export function GET(context: APIContext) {
  return rss({
    title: `${site.name} — board meetings`,
    description: 'Tishomingo County School Board meetings as reported, with sources.',
    site: context.site!,
    items: [...reports].reverse().map((r) => ({
      title: `${r.type}, ${fmtDate(r.date, true)}`,
      link: `/meetings/${r.date}/`,
      pubDate: new Date(`${r.sources[0].issue}T12:00:00-05:00`),
      description: r.summary,
    })),
  });
}
