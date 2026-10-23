// Fintegre Brand Book — entry point.
// The page never scrolls. Input moves a clock (see engine.js); every frame the clock time T
// decides which scenes are on stage, which elements are in, on or out, and drives the few
// motions that follow time continuously (zooms, the 3D mark, the galleries, the reel).
import { Clock, bindInput } from './engine.js';
import { TextFX } from './textfx.js';
import { Ascii } from './ascii.js';
import { Stage3D } from './stage3d.js';
import { sound } from './audio.js';
import { icon } from './icons.js';
import { logoSVG } from './logo.js';
import { clamp, seg, smooth, ease, lerp } from './util.js';
import { TR } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
root.classList.add('js', 'boot');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mq = matchMedia('(max-width: 760px)');
let mobile = mq.matches;
const BOOT = performance.now();

// images are embedded once at build time; repeated uses copy that source
for (const el of $$('img[data-ref]')) {
  const src = $(`img[data-id="${el.dataset.ref}"]`);
  if (src) el.src = src.src;
}

// ------------------------------------------------------------------ language
// The page is written in English, the master copy. Turkish is a layer on top: every string is
// looked up by its exact English text, so switching back always returns the original.
const norm = (v) => v.replace(/\s+/g, ' ').trim();
let lang = 'tr';
try { const v = localStorage.getItem('fb-lang'); if (v === 'tr' || v === 'en') lang = v; } catch (e) { /* private mode */ }
const missing = new Set();
const tr = (en) => {
  if (lang === 'en') return en;
  const v = TR[norm(en)];
  if (v == null && /[A-Za-z]{2}/.test(en)) missing.add(norm(en));
  return v ?? en;
};
const L10N = { fx: [], text: [], attr: [] };
for (const el of $$('[data-fx], #ctr')) L10N.fx.push({ el, en: norm(el.innerHTML) });
{
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const p = n.parentElement;
    if (!p || !/[A-Za-z]{2}/.test(n.nodeValue) || p.closest('script, style, svg, [data-fx], #ctr, #snd-t, #idx-list')) continue;
    const [, a, , b] = n.nodeValue.match(/^(\s*)([\s\S]*?)(\s*)$/);
    L10N.text.push({ n, a, b, en: n.nodeValue.trim() });
  }
}
for (const el of $$('[alt], [aria-label], [title]')) {
  for (const k of ['alt', 'aria-label', 'title']) {
    const v = el.getAttribute(k);
    if (v && /[A-Za-z]{2}/.test(v) && el.id !== 'lang') L10N.attr.push({ el, k, en: v });
  }
}
function applyText() {
  root.lang = lang;
  document.title = tr('Fintegre Brand Book');
  for (const t of L10N.text) t.n.nodeValue = t.a + tr(t.en) + t.b;
  for (const t of L10N.attr) t.el.setAttribute(t.k, tr(t.en));
  root.style.setProperty('--avoid', JSON.stringify(tr('Avoid')));
}
applyText();
for (const f of L10N.fx) if (lang !== 'en') f.el.innerHTML = tr(f.en);

// ------------------------------------------------------------------ timeline
const scenes = $$('.scn').map((el) => ({
  el, id: el.id.slice(2), len: +el.dataset.len, bg: el.dataset.bg, bg2: el.dataset.bg2,
  slow: el.dataset.slow, name: el.dataset.name, num: el.dataset.num || '', start: 0, vis: false, items: [],
}));
let acc = 0;
for (const s of scenes) { s.start = acc; acc += s.len; }
const TOTAL = acc;
const S = Object.fromEntries(scenes.map((s) => [s.id, s]));
const regions = scenes.filter((s) => s.slow).map((s) => {
  const [a, b, vmin, vmax, lead] = s.slow.split(',').map(Number);
  return { a: s.start + a, b: s.start + b, vmin, vmax, lead };
});
const clock = new Clock(TOTAL, regions);

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const keys = [];
for (const s of scenes) {
  keys.push([s.start, hex(s.bg)]);
  if (s.bg2) { const [lt, c] = s.bg2.split(':'); keys.push([s.start + +lt, hex(c)]); }
}
function bgAt(T) {
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1][0] <= T) i++;
  const prev = i > 0 ? keys[i - 1][1] : keys[0][1];
  const k = smooth(clamp((T - keys[i][0]) / 0.6));
  return prev.map((v, j) => Math.round(v + (keys[i][1][j] - v) * k));
}

// ------------------------------------------------------------------ timed elements
const parseT = (v) => (v ? v.split(',').map(Number) : null);
const fxs = [];
for (const s of scenes) {
  for (const el of $$('[data-t]', s.el)) {
    const it = { el, t: parseT(el.dataset.t), tm: parseT(el.dataset.tm), wait: +(el.dataset.wait || 0), st: '' };
    if (el.dataset.fx) { it.fx = el.__fx = new TextFX(el); fxs.push(it.fx); }
    if (el.classList.contains('count')) it.count = { to: +el.dataset.to, pre: el.dataset.pre || '', t0: 0, on: false };
    s.items.push(it);
  }
}
const ctr = new TextFX($('#ctr'));
fxs.push(ctr);

const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function setItem(it, t, now) {
  const [a, b] = (mobile && it.tm) || it.t;
  const want = t >= a && t < b && now - BOOT >= it.wait;
  if (it.fx) { it.fx.want(want, now); return; }
  const st = t < a ? 'st-pre' : t < b ? 'st-on' : 'st-post';
  if (st !== it.st) {
    if (it.st) it.el.classList.remove(it.st);
    it.el.classList.add(st);
    it.st = st;
    if (it.count) { it.count.on = st === 'st-on'; it.count.t0 = now; if (!it.count.on) it.el.textContent = it.count.pre + '0'; }
  }
  if (it.count && it.count.on) {
    const q = ease.outCubic(clamp((now - it.count.t0) / 1300));
    it.el.textContent = it.count.pre + fmt(it.count.to * q);
  }
}

// ------------------------------------------------------------------ layers
const ascii = new Ascii($('#asc'));
let stage = null;
try { stage = new Stage3D($('#gl')); } catch (e) { console.warn('WebGL unavailable', e); }
const heroph = $('#heroph');
const sweep = $('#sweep');
const markMask = 'url("data:image/svg+xml,' + encodeURIComponent(logoSVG({ h: 100, fill: '#000' }).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')) + '")';

// ------------------------------------------------------------------ scene motions (continuous)
const V = { w: innerWidth, h: innerHeight };
let introBox = null;
const motions = {};

motions.intro = () => {};
function heroMotion(T) {
  const im = $('#intro-mark');
  if (!introBox) {
    im.style.transform = 'translate(-50%,-50%)';
    const r = im.getBoundingClientRect();
    introBox = { x: r.left, y: r.top, w: r.width, h: r.height };
  }
  const z = smooth(seg(T, 0.12, 2.2));
  const s = 1 + Math.pow(z, 3.2) * 90;
  const ox = 0.608, oy = 0.132; // a point inside the top block of the mark
  const O = { x: introBox.x + introBox.w * ox, y: introBox.y + introBox.h * oy };
  im.style.transformOrigin = `${ox * 100}% ${oy * 100}%`;
  im.style.transform = `translate(-50%,-50%) scale(${s.toFixed(4)})`;
  im.style.opacity = (1 - smooth(seg(z, 0.015, 0.16))).toFixed(3);
  $('#intro-wm').style.transform = `translateX(calc(-50% - ${(ease.inCubic(seg(T, 0.05, 0.5)) * 110).toFixed(2)}vw))`;
  $('#cue').style.visibility = T > 0.04 ? 'hidden' : '';
  const he = S.hero.start;
  const show = T > 0.12 && T < he + S.hero.len + 0.2;
  heroph.style.visibility = show ? 'visible' : 'hidden';
  if (!show) return;
  if (s < 70) {
    const w = introBox.w * s, h = introBox.h * s;
    const x = O.x - (O.x - introBox.x) * s, y = O.y - (O.y - introBox.y) * s;
    heroph.style.webkitMaskImage = heroph.style.maskImage = markMask;
    heroph.style.webkitMaskSize = heroph.style.maskSize = `${w}px ${h}px`;
    heroph.style.webkitMaskPosition = heroph.style.maskPosition = `${x}px ${y}px`;
    heroph.style.webkitMaskRepeat = heroph.style.maskRepeat = 'no-repeat';
  } else {
    heroph.style.webkitMaskImage = heroph.style.maskImage = 'none';
  }
  // hero: the veil rises under the slogan, then the photo shrinks and leaves to the left
  const th = T - he;
  heroph.style.setProperty('--veil', smooth(seg(th, -0.2, 0.4)).toFixed(3));
  const e = ease.inOutCubic(seg(th, 1.95, 2.6));
  heroph.style.transform = e > 0 ? `translateX(${(-e * 78).toFixed(2)}vw) scale(${(1 - e * 0.62).toFixed(4)})` : '';
  heroph.style.borderRadius = e > 0 ? `${(e * 40).toFixed(1)}px` : '';
}

// 04 · the mark in 3D, turning into digits, then into a valuation screen
let chimed = false;
motions.logo = (t, now) => {
  if (!stage) return;
  const asm = seg(t, 0.05, 1.1);
  if (asm >= 1 && !chimed) { chimed = true; sound.chime(); }
  if (asm < 0.5) chimed = false;
  stage.setMark({
    vis: smooth(seg(t, -0.2, 0.25)) * (t < 4.8 ? 1 : 0),
    asm,
    ry: -0.55 + seg(t, 0, 4.6) * 2.4 + Math.sin(now / 2600) * 0.06,
    rx: 0.12 + Math.sin(now / 3100) * 0.04,
    x: mobile ? 0 : 0.2, y: mobile ? 0.16 : 0,
    s: 1, sweep: t < 1.95 ? -1 : seg(t, 1.95, 2.8), scatter: smooth(seg(t, 3.4, 4.5)),
  });
};

// 05 · the signature panel: a hard 65° split softens into the gradient
motions.colour = (t) => {
  const k = smooth(seg(t, 2.95, 3.5));
  const a = 52 - k * 40, b = 52 + k * 40;
  $('#cp1f').style.background = `linear-gradient(115deg, var(--indigo) 0 ${a}%, var(--ice) ${b}% 100%)`;
  const p = smooth(seg(t, 6.2, 6.6));
  const f = [60, 25, 10, 5].map((v) => lerp(25, v, p));
  $$('#prop span').forEach((sp, i) => (sp.style.flex = f[i].toFixed(2)));
};

// 06 · Geologica gains weight with time, then snaps to italic
motions.type = (t) => {
  const w = lerp(300, 700, smooth(seg(t, 0.7, 2.0)));
  const tw = $('#tword');
  tw.style.setProperty('--wg', w.toFixed(0));
  tw.style.setProperty('--sl', t > 2.15 ? '-12' : '0');
  tw.style.transition = 'font-variation-settings .35s cubic-bezier(.3,1.5,.5,1)';
  const idx = t > 2.15 ? 5 : w < 350 ? 0 : w < 450 ? 1 : w < 540 ? 2 : w < 640 ? 3 : 4;
  $$('#tfam li').forEach((li, i) => li.classList.toggle('on', i === idx));
};

// 07 · the paced gallery: images drift right to left, one is cut, one is replaced, one is resized
const gal = { items: $$('#strip .gi'), cursor: $('#cursor'), handles: $('#handles'), cut: null };
function layoutGallery() {
  const strip = $('#strip');
  const H = strip.clientHeight, W = strip.clientWidth;
  const sizes = [[0.8, 0.62], [1.5, 0.5], [0.8, 0.7], [0.8, 0.58], [0.8, 0.66], [0.8, 0.66], [1.5, 0.52], [1.5, 0.46], [1, 0.56]];
  let x = 0;
  const gap = Math.max(14, W * 0.025);
  gal.slots = gal.items.map((el, i) => {
    const [ar, hh] = sizes[i];
    const h = H * hh * (mobile ? 1.35 : 1), w = h * ar;
    const slot = { x, w, h, dy: (i % 2 ? 1 : -1) * H * 0.05 };
    if (i !== 4) x += w + gap; // image 5 opens in the slot of image 4
    return slot;
  });
  gal.span = x; gal.W = W; gal.H = H;
  if (!gal.cut) {
    gal.cut = document.createElement('span');
    gal.cut.className = 'line65';
    gal.cut.style.cssText = 'top:0;height:100%;opacity:0;z-index:3;background:var(--indigo)';
    strip.appendChild(gal.cut);
  }
}
motions.gallery = (t) => {
  if (!gal.slots) layoutGallery();
  const p = seg(t, 0.35, 7.3);
  const off = gal.W * 0.98 - p * (gal.span + gal.W * 1.02);
  gal.items.forEach((el, i) => {
    const s = gal.slots[i];
    let sc = 1, clip = '', w = s.w, h = s.h, dx = 0, dy = 0;
    if (i === 2) { // cut by a passing 65° line
      const c = seg(t, 2.3, 2.9);
      if (c > 0) clip = `polygon(${(c * 146).toFixed(1)}% 0, 100% 0, 100% 100%, ${(c * 146 - 46).toFixed(1)}% 100%)`;
    }
    if (i === 4) sc = 1 - ease.inBack(seg(t, 3.4, 3.75)); // shrinks away with a little bounce
    if (i === 5) { const o = ease.outBack(seg(t, 3.75, 4.2)); sc = o; }
    if (i === 6) { // grabbed by the cursor, resized, set down a little to the side
      const g = ease.inOutCubic(seg(t, 5.0, 5.5)), d = ease.inOutCubic(seg(t, 5.5, 5.9));
      w = s.w * (1 + 0.3 * g); h = s.h * (1 + 0.24 * g); dx = 14 * d; dy = -s.h * 0.06 * d;
    }
    const x = off + s.x + dx, y = s.dy + dy;
    el.style.width = w.toFixed(1) + 'px';
    el.style.height = h.toFixed(1) + 'px';
    el.style.transform = `translate(${x.toFixed(1)}px, calc(-50% + ${y.toFixed(1)}px)) scale(${Math.max(0, sc).toFixed(4)})`;
    el.style.clipPath = clip;
    el.style.visibility = (i === 5 && sc <= 0.001) || (i === 4 && sc <= 0.001) ? 'hidden' : '';
  });
  // the cut line
  const c = seg(t, 2.3, 2.9);
  const s2 = gal.slots[2];
  gal.cut.style.opacity = c > 0 && c < 1 ? '1' : '0';
  gal.cut.style.transform = `translateX(${(off + s2.x + s2.w * (c * 1.46 - 0.23)).toFixed(1)}px) skewX(-25deg)`;
  // cursor + handles on image 7
  const s6 = gal.slots[6], el6 = gal.items[6];
  const g = ease.inOutCubic(seg(t, 5.0, 5.5)), d = ease.inOutCubic(seg(t, 5.5, 5.9));
  const w6 = s6.w * (1 + 0.3 * g), h6 = s6.h * (1 + 0.24 * g);
  const x6 = off + s6.x + 14 * d, y6 = gal.H / 2 + s6.dy - s6.h * 0.06 * d - h6 / 2;
  const appear = seg(t, 4.5, 4.9), leave = seg(t, 5.9, 6.2);
  const cx = lerp(x6 + w6 + 160, x6 + w6 - 4, ease.outCubic(appear)) + leave * 120;
  const cy = lerp(y6 + h6 + 120, y6 + h6 - 4, ease.outCubic(appear)) + leave * 80;
  gal.cursor.style.opacity = appear > 0 && leave < 1 ? '1' : '0';
  gal.cursor.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) scale(${g > 0 && g < 1 ? 0.9 : 1})`;
  const hOn = t > 4.85 && t < 5.95;
  gal.handles.style.opacity = hOn ? '1' : '0';
  gal.handles.style.width = w6.toFixed(1) + 'px';
  gal.handles.style.height = h6.toFixed(1) + 'px';
  gal.handles.style.transform = `translate(${x6.toFixed(1)}px, ${y6.toFixed(1)}px)`;
  el6.style.zIndex = hOn ? 3 : '';
};

// 08 · one card through four ratios, then bright and busy images
motions.ptype = (t) => {
  const card = $('#pcard');
  const fr = card.parentElement;
  const Aw = fr.clientWidth * (mobile ? 1 : 0.62), Ah = fr.clientHeight * (mobile ? 0.6 : 0.92);
  const R = [0.8, 1, 16 / 9, 9 / 16];
  const a = smooth(seg(t, 1.3, 1.7)), b = smooth(seg(t, 2.0, 2.4)), c = smooth(seg(t, 2.7, 3.1));
  let r = lerp(R[0], R[1], a); r = lerp(r, R[2], b); r = lerp(r, R[3], c);
  let w = Math.min(Aw, Ah * r), h = w / r;
  if (h > Ah) { h = Ah; w = h * r; }
  card.style.width = w.toFixed(1) + 'px';
  card.style.height = h.toFixed(1) + 'px';
  const mode = t > 4.0 ? 'busy' : t > 3.0 ? 'bright' : '';
  card.classList.toggle('bright', mode === 'bright');
  card.classList.toggle('busy', mode === 'busy');
  $('#pc-b').style.opacity = mode === 'bright' ? 1 : 0;
  $('#pc-c').style.opacity = mode === 'busy' ? 1 : 0;
};

// 09 · an icon drawn as a sketch, snapped to the grid, finished; then colour and angle
const ib = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const grid = $('#b-grid'), sk = $('#b-sketch'), fin = $('#b-final');
  let g = '';
  for (let i = 0; i <= 24; i++) g += `<line x1="${i}" y1="0" x2="${i}" y2="24"/><line x1="0" y1="${i}" x2="24" y2="${i}"/>`;
  grid.innerHTML = g + '<rect class="live" x="2" y="2" width="20" height="20"/>';
  const ic = icon('trade');
  const probe = document.createElementNS(NS, 'path');
  sk.appendChild(probe);
  const rnd = (i, k) => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;
  const lines = [...ic.s, ic.a.d].map((d, j) => {
    probe.setAttribute('d', d);
    const len = probe.getTotalLength();
    const n = Math.max(6, Math.ceil(len / 0.3));
    const pts = [];
    for (let i = 0; i <= n; i++) { const q = probe.getPointAtLength((len * i) / n); pts.push([q.x, q.y]); }
    const el = document.createElementNS(NS, 'path');
    sk.appendChild(el);
    return { pts, el, len, j, ox: rnd(j, 1) * 0.55, oy: rnd(j, 2) * 0.55 };
  });
  probe.remove();
  return { grid, sk, fin, lines, keys: $('#b-keys'), accent: $$('.ia', fin), steps: $$('#isteps li'), up: $('#b-up'), ghost: $('#b-ghost'), g65: $('#b-g65'), last: -1 };
})();
motions.icons = (t) => {
  const p = seg(t, 0.4, 3.0);
  const draw = smooth(seg(p, 0.02, 0.3)), build = smooth(seg(p, 0.32, 0.42));
  const snap = ease.inOutCubic(seg(p, 0.38, 0.62)), done = smooth(seg(p, 0.6, 0.7)), accv = smooth(seg(p, 0.7, 0.82));
  const A = 1 - snap;
  for (const L of ib.lines) {
    let d = '';
    L.pts.forEach(([x, y], i) => {
      const w = Math.sin(i * 0.55 + L.j * 1.7) * 0.22 + Math.sin(i * 1.9 + L.j) * 0.08;
      d += (i ? 'L' : 'M') + (x + A * (L.ox + w)).toFixed(2) + ' ' + (y + A * (L.oy + Math.cos(i * 0.7 + L.j) * 0.2)).toFixed(2);
    });
    L.el.setAttribute('d', d);
    L.el.style.strokeDasharray = L.len * 1.4;
    L.el.style.strokeDashoffset = (L.len * 1.4 * (1 - draw)).toFixed(2);
    const ink = smooth(seg(snap, 0.72, 1));
    L.el.style.strokeWidth = (0.34 + 1.41 * ink).toFixed(3);
    L.el.style.stroke = ink > 0.4 ? '#0F1115' : '#5b616d';
  }
  ib.grid.style.opacity = (build * (1 - done * 0.55)).toFixed(3);
  ib.keys.style.opacity = (build * (1 - done * 0.7)).toFixed(3);
  ib.sk.style.opacity = (1 - done).toFixed(3);
  const swap = smooth(seg(t, 3.55, 3.85));
  ib.fin.style.opacity = (done * (1 - swap)).toFixed(3);
  ib.fin.style.transform = `scale(${(1 - swap * 0.3).toFixed(3)})`;
  ib.up.style.opacity = swap.toFixed(3);
  ib.up.style.transform = `scale(${(0.7 + 0.3 * ease.outBack(swap)).toFixed(3)})`;
  ib.accent.forEach((a) => (a.style.opacity = accv.toFixed(3)));
  ib.ghost.style.opacity = (0.12 * smooth(seg(t, 3.85, 4.1))).toFixed(3);
  ib.g65.style.transform = `skewX(-25deg) scaleY(${smooth(seg(t, 3.9, 4.3)).toFixed(3)})`;
  const si = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
  if (si !== ib.last) { ib.steps.forEach((li, k) => li.classList.toggle('on', k === si)); ib.last = si; }
};

// 10 · the app flow slides right to left; the illustration screen is flagged
motions.illus = (t) => {
  const x = smooth(seg(t, 1.0, 1.55)) + smooth(seg(t, 2.5, 3.05));
  $('#reel').style.transform = `translateX(${(-x * 33.3334).toFixed(3)}%)`;
  $('#flag').style.opacity = x > 0.7 && x < 1.3 ? '1' : '0';
};

// 11 · posts, the reel and the grid
motions.social = (t) => {
  const area = $('#posts');
  const H = area.clientHeight, W = area.clientWidth;
  const gap = Math.max(12, H * 0.04);
  const w0 = Math.min(H * 0.8, mobile ? W * 0.62 : (W - 2 * gap) / 3.05);
  const ph = w0 / 0.8;
  for (const id of ['#sp1', '#reelpost', '#sp3']) { const el = $(id); el.style.height = ph.toFixed(1) + 'px'; el.style.top = ((H - ph) / 2).toFixed(1) + 'px'; }
  const m = ease.inOutCubic(seg(t, 2.05, 2.55));
  const rw = lerp(w0, ph * 9 / 16, m);
  const cx = W / 2;
  const rp = $('#reelpost');
  rp.style.width = rw.toFixed(1) + 'px';
  rp.style.aspectRatio = 'auto';
  rp.style.left = (cx - rw / 2).toFixed(1) + 'px';
  $('#sp1').style.left = (cx - w0 * 1.5 - gap).toFixed(1) + 'px';
  $('#sp3').style.left = (cx + w0 * 0.5 + gap).toFixed(1) + 'px';
  const F = [2.6, 3.3, 4.0, 4.9];
  const fi = t < F[0] ? 0 : t < F[1] ? 1 : t < F[2] ? 2 : 3;
  $$('#reelpost .frames img').forEach((im, i) => {
    im.classList.toggle('on', i === fi);
    const a = i === 0 ? 0.6 : F[i - 1], b = i === 0 ? F[0] : F[i];
    const k = seg(t, a, b);
    im.style.transform = `scale(${(1.04 + k * 0.1).toFixed(4)}) translateX(${((0.5 - k) * 3).toFixed(2)}%)`;
  });
  ['#rk0', '#rk1', '#rk2', '#rk3'].forEach((id, i) => {
    const on = i === fi;
    const el = $(id);
    el.style.opacity = on ? 1 : 0;
    el.style.transform = on ? 'none' : 'scale(.85)';
  });
  $('#rbars').style.opacity = t > 2.55 ? 1 : 0;
  $$('#rbars i b').forEach((b, i) => b.style.setProperty('--f', seg(t, F[i], F[i + 1]).toFixed(3)));
  $('#rsafe').style.opacity = t > 2.9 && t < 3.7 ? 1 : 0;
  $('#gdiag').style.strokeDashoffset = (1 - smooth(seg(t, 5.45, 6.0))).toFixed(3);
};

// 12 · fashion strip, billboard pan with passers-by, then the objects in 3D
motions.strip = (t) => {
  const fs = $('#fstrip');
  const H = fs.clientHeight, W = fs.clientWidth, w = H * 0.8, gap = Math.max(16, W * 0.02);
  const items = $$('.fi', fs), span = items.length * (w + gap);
  const off = W * 1.02 - seg(t, 0.2, 3.5) * (span + W * 1.06);
  items.forEach((el, i) => {
    const x = off + i * (w + gap);
    const edge = clamp((W - x) / (W * 0.2)); // opens as it enters from the right edge
    el.style.transform = `translateX(${x.toFixed(1)}px) scale(${(0.9 + 0.1 * ease.outCubic(edge)).toFixed(4)})`;
  });
};
motions.board = (t) => {
  const p = seg(t, 0, 3.5);
  $('#bbimg').style.transform = `translateX(${lerp(7, -9, p).toFixed(2)}vw) rotateY(${lerp(-9, 9, p).toFixed(2)}deg) scale(${(1 + 0.08 * p).toFixed(4)})`;
  [['#silh1', 0.3, 1.35, 1], ['#silh2', 1.1, 2.05, 1.15], ['#silh3', 1.9, 2.9, 0.92]].forEach(([id, a, b, k]) => {
    const q = seg(t, a, b);
    const el = $(id);
    el.style.transform = `translateX(${lerp(105, -45, q).toFixed(2)}vw) scale(${k})`;
    el.style.visibility = q > 0 && q < 1 ? 'visible' : 'hidden';
  });
};
motions.objects = (t) => {
  if (!stage) return;
  const win = (a, b) => {
    const i = ease.outBack(seg(t, a, a + 0.4));
    const o = ease.inBack(seg(t, b - 0.35, b));
    return Math.max(0, i * (1 - o));
  };
  const orbit = Math.sin(t * 0.9) * (mobile ? 0.35 : 1.1);
  stage.setObjects({
    on: t > 0 && t < 8.0, cx: orbit, cy: 1.3, cz: mobile ? 9.5 : 7.4, ly: 0.05,
    note: { s: win(0.1, 1.95), ry: lerp(-0.8, 0.6, seg(t, 0.1, 1.95)), x: mobile ? 0 : 0.6 },
    lap: { s: win(1.95, 4.35), ry: lerp(-0.6, 0.35, seg(t, 1.95, 4.35)), y: -0.55, x: mobile ? 0 : 0.5, lid: smooth(seg(t, 2.95, 3.65)), stick: seg(t, 2.2, 2.95) },
    mug: { s: win(4.4, 5.85), ry: lerp(-1.3, 0.4, seg(t, 4.4, 5.85)), x: mobile ? 0 : 0.6 },
    phones: { s: win(5.9, 7.95), ry: (t - 5.9) * 1.9, x: mobile ? 0 : 0.6, spread: smooth(seg(t, 6.3, 6.9)) },
  });
};

// ------------------------------------------------------------------ chrome
const idx = $('#index');
const list = $('#idx-list');
const chapters = scenes.filter((s, i) => s.num && scenes.findIndex((o) => o.num === s.num) === i);
[...chapters, S.end].forEach((s) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button"><span class="n">${s.num || '··'}</span><span class="t"></span></button>`;
  li.querySelector('.t').dataset.en = s.name;
  li.querySelector('button').addEventListener('click', () => { closeIndex(); clock.seek(s.start + 0.04); });
  list.appendChild(li);
});
const openers = [$('#idx-open'), $('#idx-open2')];
const openIndex = () => { idx.hidden = false; openers.forEach((b) => b.setAttribute('aria-expanded', 'true')); $('#idx-close').focus(); };
const closeIndex = () => { idx.hidden = true; openers.forEach((b) => b.setAttribute('aria-expanded', 'false')); };
openers.forEach((b) => b.addEventListener('click', openIndex));
$('#idx-close').addEventListener('click', closeIndex);
$('#restart').addEventListener('click', () => clock.seek(0));
const snd = $('#snd');
let soundOn = false;
const sndLabel = () => ($('#snd-t').textContent = tr(soundOn ? 'Sound on' : 'Sound off'));
snd.addEventListener('click', () => {
  soundOn = sound.toggle();
  snd.setAttribute('aria-pressed', String(soundOn));
  sndLabel();
  if (soundOn) sound.chime();
});
const sceneLabel = (s) => (s.num ? `${s.num} · ${tr(s.name)}` : tr('Fintegre Brand Book'));
function chromeText() {
  for (const t of $$('#idx-list .t')) t.textContent = tr(t.dataset.en);
  sndLabel();
  $('#lang').setAttribute('aria-label', lang === 'tr' ? 'Dil: Türkçe. İngilizceye geç' : 'Language: English. Switch to Turkish');
  stage?.setLang(tr);
}
chromeText();
function setLang(next) {
  if (next === lang) return;
  lang = next;
  try { localStorage.setItem('fb-lang', lang); } catch (e) { /* private mode */ }
  applyText();
  chromeText();
  root.classList.add('measuring');
  for (const f of L10N.fx) f.el.__fx?.replace(tr(f.en));
  ctr.replace(curScene ? sceneLabel(curScene) : tr('Fintegre Brand Book'));
  root.classList.remove('measuring');
}
$('#lang').addEventListener('click', () => setLang(lang === 'tr' ? 'en' : 'tr'));
window.addEventListener('keydown', (e) => {
  if ((e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey && !e.altKey && idx.hidden) setLang(lang === 'tr' ? 'en' : 'tr');
});
bindInput(clock, window, { onKey: (e) => { if (!idx.hidden) { if (e.key === 'Escape') closeIndex(); return true; } return false; } });
idx.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

// ------------------------------------------------------------------ loop
let last = performance.now(), curScene = null, navDark = null;
const bar = $('#bar');
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (idx.hidden) clock.tick(dt);
  const T = clock.T;

  const bg = bgAt(T);
  const bgs = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
  root.style.setProperty('--bg', bgs);

  let active = null;
  for (const s of scenes) {
    const t = T - s.start;
    const vis = t > -0.6 && t < s.len + 0.7;
    if (vis !== s.vis) { s.el.classList.toggle('vis', vis); s.vis = vis; }
    if (vis || s.dirty) {
      const tt = vis ? t : t < 0 ? -1 : s.len + 1;
      for (const it of s.items) setItem(it, tt, now);
      if (vis && motions[s.id]) motions[s.id](t, now);
      s.dirty = vis;
    }
    if (t >= 0 && t < s.len) active = s;
  }
  heroMotion(T);
  if (stage) {
    const lt = T - S.logo.start, ot = T - S.objects.start;
    if (lt < -0.3 || lt > S.logo.len + 0.3) stage.setMark({ vis: 0 });
    if (ot < -0.1 || ot > S.objects.len + 0.1) stage.setObjects({ on: false });
  }

  // nav ink follows the ground (the hero photo counts as dark)
  const lum = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
  const photo = T > 1.0 && T < S.hero.start + S.hero.len - 0.3;
  const dark = photo || lum < 0.55;
  if (dark !== navDark) { root.dataset.nav = dark ? 'dark' : 'light'; navDark = dark; }

  if (active && active !== curScene) {
    curScene = active;
    ctr.replace(sceneLabel(active));
    if (ctr.state === 'hidden') ctr.show(now, true);
  }
  for (const f of [ctr]) f.update(now);
  bar.style.setProperty('--p', (T / TOTAL).toFixed(4));

  // digits: the mark's cloud (always) and the pointer field (desktop)
  let cloud = null, line = null;
  if (stage) {
    const r = stage.frame(now);
    if (r) { cloud = r.cloud; line = r.line; }
  }
  const lt = T - S.logo.start;
  const sw = seg(lt, 1.95, 2.8);
  if (line && sw > 0 && sw < 1) {
    sweep.style.opacity = Math.sin(sw * Math.PI).toFixed(3);
    sweep.style.transform = `translate(${line.x.toFixed(1)}px, ${line.y.toFixed(1)}px) translate(-50%, -50%) rotate(25deg)`;
  } else sweep.style.opacity = '0';
  const ink = lum < 0.55 ? [183, 215, 255] : [48, 71, 236];
  ascii.frame(now, ink, cloud);
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ boot
function measureAll() {
  root.classList.add('measuring');
  for (const f of fxs) f.measure();
  root.classList.remove('measuring');
}
async function boot() {
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* ignore */ }
  measureAll();
  ctr.show(performance.now(), true);
  frame(performance.now());
  requestAnimationFrame(() => root.classList.remove('boot'));
  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      mobile = mq.matches;
      V.w = innerWidth; V.h = innerHeight;
      introBox = null; gal.slots = null;
      measureAll();
      stage?.resize(); ascii.resize();
    }, 150);
  });
}
window.__fb = { setLang, get lang() { return lang; }, missing: () => [...missing], seek: (t) => clock.seek(t), scenes: scenes.map((s) => ({ id: s.id, start: s.start, len: s.len })), total: TOTAL, get T() { return clock.T; } };
boot();
