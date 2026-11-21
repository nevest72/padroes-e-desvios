import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Textos de opinião: um ficheiro Markdown por texto, em src/content/opiniao/.
// - Texto publicado noutro sítio (jornal, revista): preencher "outlet" (e "url", se houver); o corpo fica vazio.
// - Texto próprio do site: deixar "outlet" e "url" vazios e escrever o texto no corpo; ganha página própria.
const opiniao = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/opiniao' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    dateText: z.string().optional().default(''),
    authors: z.array(z.string()).default(['Tiago Neves', 'Gil Nata']),
    outlet: z.string().optional().default(''),
    url: z.string().optional().default(''),
    summary: z.string().optional().default(''),
    draft: z.boolean().optional().default(false)
  })
});

export const collections = { opiniao };
