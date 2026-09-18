import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const ref = z.object({ issue: z.coerce.string(), page: z.number() });

const notices = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notices' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    runs: z.array(z.object({ issue: z.coerce.date(), page: z.number() })).default([]),
    kind: z.enum(['budget', 'bid', 'hearing', 'borrowing', 'sale', 'program', 'other']),
    summary: z.string(),
    signedBy: z.string().nullable().optional(),
    textQuality: z.enum(['good', 'partial']).default('good'),
  }),
});

export const collections = { notices };
export { ref };
