// Comportamento da página principal: figuras animadas, filtros das publicações, "mostrar mais".
// Sem JavaScript, a página mostra tudo (todas as publicações e intervenções), só sem filtros nem animação.

const UI = JSON.parse(document.getElementById('uiData').textContent);
const FIG = JSON.parse(document.getElementById('figData').textContent);
const fill = (s, vars) => Object.entries(vars).reduce((a, [k, v]) => a.replaceAll('{' + k + '}', v), s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Figuras ---------- */
const SERIES = ['ind', 'dep', 'pub'];
const NS = 'http://www.w3.org/2000/svg';
const CH = {
  fig1: { key: 'abs', min: -2, max: 11, ticks: [-2, 0, 2, 4, 6, 8, 10], dec: 1 },
  fig2: { key: 'rel', min: -0.2, max: 1, ticks: [-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1], dec: 2 }
};
const G = { l: 38, r: 10, t: 10, b: 46, w: 480, h: 290 };
function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const sx = x => G.l + x / 19 * (G.w - G.l - G.r);
const sy = (c, v) => G.t + (c.max - v) / (c.max - c.min) * (G.h - G.t - G.b);
const num = (v, d) => v.toFixed(d).replace('.', UI.lang === 'pt' ? ',' : '.');
const signed = (v, d) => (v > 0.0049 ? '+' : v < -0.0049 ? '−' : '') + num(Math.abs(v), d);
const interp = (arr, x) => { const i = Math.min(18, Math.floor(x)), f = x - i; return arr[i] + (arr[i + 1] - arr[i]) * f; };
let curX = 0, lastK = -1;

function drawFigs() {
  for (const id of ['fig1', 'fig2']) {
    const c = CH[id], svg = document.getElementById(id);
    svg.innerHTML = '';
    const g = el('g', { class: 'grid' }, svg);
    for (const v of c.ticks) {
      if (v !== 0) el('line', { x1: G.l, x2: G.w - G.r, y1: sy(c, v), y2: sy(c, v) }, g);
      el('text', { x: G.l - 6, y: sy(c, v) + 4, 'text-anchor': 'end' }, svg).textContent = (v < 0 ? '−' : '') + num(Math.abs(v), c.dec === 1 ? 0 : 1);
    }
    for (const x of [0, 5, 10, 15, 19]) el('text', { x: sx(x), y: G.h - G.b + 20, 'text-anchor': 'middle' }, svg).textContent = x;
    el('text', { x: (G.l + G.w - G.r) / 2, y: G.h - 4, 'text-anchor': 'middle' }, svg).textContent = UI.figX;
    el('line', { class: 'zero', x1: G.l, x2: G.w - G.r, y1: sy(c, 0), y2: sy(c, 0) }, svg);
    c.band = el('rect', { class: 'cursor-band', y: G.t, height: G.h - G.t - G.b, width: sx(1) - sx(0) }, svg);
    for (const k of [...SERIES].reverse()) {
      const d = FIG[c.key][k].map((v, i) => (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(c, v).toFixed(1)).join('');
      el('path', { class: 'series s-' + k, d }, svg);
    }
    c.line = el('line', { class: 'cursor-line', y1: G.t, y2: G.h - G.b }, svg);
    c.dots = {};
    for (const k of SERIES) c.dots[k] = el('circle', { class: 'cursor-dot d-' + k, r: 4.5 }, svg);
  }
  setCursor(curX);
}

function setCursor(x) {
  curX = x;
  const k = Math.round(x);
  for (const id of ['fig1', 'fig2']) {
    const c = CH[id]; if (!c.line) continue;
    const px = sx(x);
    c.line.setAttribute('x1', px); c.line.setAttribute('x2', px);
    const a = sx(Math.max(0, k - 0.5)), b = sx(Math.min(19, k + 0.5));
    c.band.setAttribute('x', a); c.band.setAttribute('width', b - a);
    for (const s of SERIES) { c.dots[s].setAttribute('cx', px); c.dots[s].setAttribute('cy', sy(c, interp(FIG[c.key][s], x))); }
  }
  if (k !== lastK) {
    lastK = k;
    document.getElementById('roHead').textContent = fill(UI.figRo, { k });
    document.getElementById('roBody').innerHTML = SERIES.map(s =>
      `<tr><td class="k"><span class="key k-${s}"></span>${esc(UI[s])}</td><td>${signed(FIG.abs[s][k], 1)}</td><td>${signed(FIG.rel[s][k], 2)}</td></tr>`
    ).join('');
  }
}

(function animate() {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let held = false, visible = true, t0 = null;
  const SWEEP = 9000, HOLD = 2200;
  if (reduce) curX = 12;
  drawFigs();
  function frame(ts) {
    if (!held && visible && !reduce) {
      if (t0 === null) t0 = ts - curX / 19 * SWEEP;
      const p = Math.min(1, ((ts - t0) % (SWEEP + HOLD)) / SWEEP);
      setCursor(19 * p);
    } else t0 = null;
    requestAnimationFrame(frame);
  }
  function scrub(evt) {
    const r = evt.currentTarget.getBoundingClientRect();
    const vx = (evt.clientX - r.left) / r.width * G.w;
    held = true;
    setCursor(Math.round(Math.max(0, Math.min(19, (vx - G.l) / (G.w - G.l - G.r) * 19))));
  }
  for (const id of ['fig1', 'fig2']) {
    const svg = document.getElementById(id);
    svg.addEventListener('pointermove', scrub);
    svg.addEventListener('pointerdown', scrub);
    svg.addEventListener('pointerleave', () => { held = false; });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(en => { visible = en[0].isIntersecting; }).observe(document.getElementById('figPair'));
  }
  requestAnimationFrame(frame);
})();

/* ---------- Publicações: filtros e "mostrar mais" ---------- */
const PUB_PAGE = 15;
const state = { type: 'all', who: 'all', q: '', limit: PUB_PAGE };
const refs = [...document.querySelectorAll('#refs > li')];
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function matches(li) {
  const who = li.dataset.who.split(' ');
  if (state.type !== 'all' && li.dataset.type !== state.type) return false;
  if (state.who === 'both' && !(who.includes('tn') && who.includes('gn'))) return false;
  if ((state.who === 'tn' || state.who === 'gn') && !who.includes(state.who)) return false;
  const q = norm(state.q.trim());
  if (q && !li.dataset.q.includes(q)) return false;
  return true;
}
function moreBtn(id, remaining) {
  const b = document.getElementById(id);
  b.hidden = remaining <= 0;
  if (remaining > 0) b.textContent = fill(UI.more, { n: remaining });
}
function renderPubs() {
  let n = 0;
  for (const li of refs) {
    const ok = matches(li);
    li.hidden = !ok || n >= state.limit;
    if (ok) n++;
  }
  document.getElementById('count').textContent = n === 1 ? UI.count1 : fill(UI.countN, { n });
  document.getElementById('pubEmpty').hidden = n > 0;
  moreBtn('pubMore', n - Math.min(n, state.limit));
}
function syncSeg(id, val) {
  for (const b of document.querySelectorAll('#' + id + ' button')) b.setAttribute('aria-pressed', b.dataset.v === val ? 'true' : 'false');
}
function onSeg(id, key) {
  document.getElementById(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    state[key] = b.dataset.v; state.limit = PUB_PAGE; syncSeg(id, state[key]); renderPubs();
  });
}
document.getElementById('pubFilters').hidden = false;
onSeg('segType', 'type');
onSeg('segWho', 'who');
document.getElementById('q').addEventListener('input', e => { state.q = e.target.value; state.limit = PUB_PAGE; renderPubs(); });
document.getElementById('pubMore').addEventListener('click', () => { state.limit += 25; renderPubs(); });
for (const a of document.querySelectorAll('#nav a[data-type]')) {
  a.addEventListener('click', () => { state.type = 'all'; state.limit = PUB_PAGE; syncSeg('segType', 'all'); renderPubs(); });
}
renderPubs();

/* ---------- Media: "mostrar mais" ---------- */
const extra = [...document.querySelectorAll('#mediaList > [data-extra]')];
extra.forEach(r => { r.hidden = true; });
moreBtn('mediaMore', extra.length);
document.getElementById('mediaMore').addEventListener('click', () => {
  extra.forEach(r => { r.hidden = false; });
  moreBtn('mediaMore', 0);
});

/* Ao mudar de língua, manter a secção em que se está. */
const langBtn = document.getElementById('langBtn');
langBtn.addEventListener('click', () => { if (location.hash) langBtn.href = langBtn.getAttribute('href').split('#')[0] + location.hash; });
