import rss from '@astrojs/rss';
import { getOpinion } from '../lib/opiniao.js';

// Feed dos textos de opinião. É este endereço (/rss.xml) que o serviço de newsletter lê.
export async function GET(context) {
  const items = (await getOpinion()).filter(o => o.date);
  return rss({
    title: 'Padrões e Desvios',
    description: 'Textos de opinião de Tiago Neves e Gil Nata sobre a atualidade educativa.',
    site: context.site,
    xmlns: { dc: 'http://purl.org/dc/elements/1.1/' },
    customData: '<language>pt-PT</language>',
    items: items.map(o => ({
      title: o.title,
      pubDate: o.date,
      link: o.native ? `/opiniao/${o.id}/` : o.href || '/#opiniao',
      description: o.summary || (o.native ? '' : `Publicado em ${o.outlet}.`),
      customData: `<dc:creator>${o.authors.join(', ').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</dc:creator>`,
      content: o.native ? (o.entry.rendered?.html || '') : undefined
    }))
  });
}
