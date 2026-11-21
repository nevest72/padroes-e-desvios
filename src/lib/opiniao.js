import { getCollection } from 'astro:content';
import { byDateDesc } from './format.js';

// Devolve os textos de opinião publicados, do mais recente para o mais antigo.
// Cada texto fica com "href" (página própria ou ligação externa) e "native" (tem página própria).
export async function getOpinion() {
  const all = await getCollection('opiniao', e => !e.data.draft);
  return all
    .map(e => {
      // Sem jornal e sem ligação = texto próprio do site.
      const native = !e.data.url && !e.data.outlet;
      return { ...e.data, id: e.id, native, href: native ? `/opiniao/${e.id}/` : e.data.url, entry: e };
    })
    .sort(byDateDesc);
}
