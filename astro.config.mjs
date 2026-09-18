// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import site from './src/data/site.json' with { type: 'json' };
import documents from './src/data/documents.json' with { type: 'json' };

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'ignore',
  // PDFs are listed in the sitemap too so search engines index the documents themselves.
  integrations: [sitemap({ customPages: documents.map((d) => new URL(d.file, site.url).href) })],
  vite: { plugins: [tailwindcss()] },
});
