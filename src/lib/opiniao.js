import { getCollection } from 'astro:content';
import { byDateDesc } from './format.js';

// «no Público», «na Página da Educação», «na Revista X»…
export function emOutlet(outlet) {
  const o = String(outlet || '').trim();
  if (/^A\s/.test(o)) return 'na ' + o.slice(2);
  if (/^(Revista|Folha|Gazeta|Visão|Sábado)\b/i.test(o)) return 'na ' + o;
  return 'no ' + o;
}

// Devolve os textos de opinião publicados, do mais recente para o mais antigo.
// - native: o texto tem página própria no site (tem o texto completo, ou não tem jornal nem ligação).
// - original: o texto saiu primeiro num jornal (fica a referência «Publicado originalmente no …»).
// - href: página própria, se existir; senão, a ligação para o jornal.
export async function getOpinion() {
  const all = await getCollection('opiniao', e => !e.data.draft);
  return all
    .map(e => {
      const hasBody = Boolean(e.body && e.body.trim());
      const native = hasBody || (!e.data.url && !e.data.outlet);
      const original = e.data.outlet ? { outlet: e.data.outlet, url: e.data.url } : null;
      return { ...e.data, id: e.id, native, original, href: native ? `/opiniao/${e.id}/` : e.data.url, entry: e };
    })
    .sort(byDateDesc);
}
