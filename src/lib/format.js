// Formatação partilhada pelas páginas.
export const SITE_AUTHORS = ['Tiago Neves', 'Gil Nata'];

const MONTHS = {
  pt: ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};
const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function isoDate(d) {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export function fmtDate(d, lang, nd = '') {
  const iso = isoDate(d);
  if (!iso) return nd;
  const [y, m, day] = iso.split('-');
  return parseInt(day, 10) + ' ' + MONTHS[lang][parseInt(m, 10) - 1] + ' ' + y;
}

export function fmtDateLong(d) {
  const iso = isoDate(d);
  if (!iso) return '';
  const [y, m, day] = iso.split('-');
  return parseInt(day, 10) + ' de ' + MONTHS_LONG[parseInt(m, 10) - 1] + ' de ' + y;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// *texto* → <i>texto</i> (itálicos das referências), depois de escapar o resto.
export function italics(s) {
  return esc(s).replace(/\*([^*]+)\*/g, '<i>$1</i>');
}

export function joinNames(names, and) {
  const h = names.map(n => SITE_AUTHORS.includes(n) ? `<span class="me">${esc(n)}</span>` : esc(n));
  return h.length < 2 ? (h[0] || '') : h.slice(0, -1).join(', ') + esc(and) + h[h.length - 1];
}

export function boldMe(authors) {
  return esc(authors)
    .replace(/Neves, T\./g, '<span class="me">Neves, T.</span>')
    .replace(/Nata, G\./g, '<span class="me">Nata, G.</span>');
}

export function plain(s) {
  return String(s ?? '').replace(/\*/g, '');
}

export function norm(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[*<>]/g, '').toLowerCase();
}

export function byDateDesc(a, b) {
  const x = isoDate(a.date), y = isoDate(b.date);
  if (!x) return 1; if (!y) return -1;
  return x < y ? 1 : x > y ? -1 : 0;
}
