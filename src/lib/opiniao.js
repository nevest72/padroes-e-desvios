import { getCollection } from 'astro:content';
import { marked } from 'marked';
import { byDateDesc } from './format.js';

// «no Público», «na Página da Educação», «na Revista X»…
export function emOutlet(outlet) {
  const o = String(outlet || '').trim();
  if (/^A\s/.test(o)) return 'na ' + o.slice(2);
  if (/^(Revista|Folha|Gazeta|Visão|Sábado)\b/i.test(o)) return 'na ' + o;
  return 'no ' + o;
}

// «in Público», «in A Página da Educação»
export function inOutlet(outlet) {
  return 'in ' + String(outlet || '').trim();
}

// Texto em Markdown (ou HTML vindo do editor) → HTML.
export function mdToHtml(md) {
  return marked.parse(String(md || ''), { async: false });
}

// Devolve os textos de opinião publicados, do mais recente para o mais antigo.
// - native: o texto tem página própria no site (tem o texto completo, ou não tem jornal nem ligação).
// - original: o texto saiu primeiro num jornal (fica a referência «Publicado originalmente no …»).
// - href: página própria, se existir; senão, a ligação para o jornal.
// - hasEn / enHref: existe tradução inglesa com página própria em /en/opiniao/….
export async function getOpinion() {
  const all = await getCollection('opiniao', e => !e.data.draft);
  return all
    .map(e => {
      const hasBody = Boolean(e.body && e.body.trim());
      const native = hasBody || (!e.data.url && !e.data.outlet);
      const original = e.data.outlet ? { outlet: e.data.outlet, url: e.data.url } : null;
      const hasEn = native && Boolean(e.data.title_en?.trim() && e.data.body_en?.trim());
      return {
        ...e.data, id: e.id, native, original, hasEn,
        href: native ? `/opiniao/${e.id}/` : e.data.url,
        enHref: hasEn ? `/en/opiniao/${e.id}/` : null,
        entry: e
      };
    })
    .sort(byDateDesc);
}
