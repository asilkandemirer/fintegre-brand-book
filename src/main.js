// Fintegre Brand Book v2 — entry point.
// The page is a normal document. One frame loop reads the scroll position and:
//  · blends the fixed backdrop between section tones (photo → night → indigo → ice → smoke → white),
//  · sets the nav ink and progress,
//  · drives the few pinned scenes (cover, logo, type build, icon build) and the scroll-drawn strikes.
// Everything has a finished resting state in CSS, so the page reads correctly before this runs.
import { sound } from './audio.js';
import { icon } from './icons.js';
import { clamp, seg, smooth, ease } from './util.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
root.classList.add('js');
// images are embedded once at build time; repeated uses copy that source
for (const el of document.querySelectorAll('img[data-ref]')) {
  const src = document.querySelector(`img[data-id="${el.dataset.ref}"]`);
  if (src) el.src = src.src;
}
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TONE = { night: [26, 36, 107], indigo: [48, 71, 236], ice: [183, 215, 255], smoke: [245, 247, 250], white: [255, 255, 255] };
const LIGHT = new Set(['ice', 'smoke', 'white']);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

const secs = $$('main > .sec');
const backdrop = $('#backdrop');
const groupLinks = $$('.nav-groups a');
let vh = window.innerHeight;
let S = []; // measured sections
let strikes = [];

const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;

function measure() {
  vh = window.innerHeight;
  S = secs.map((el) => ({ el, top: absTop(el), h: el.offsetHeight, tone: el.dataset.tone, group: el.dataset.group }));
  strikes = $$('.strike').map((el) => ({ el, top: absTop(el), v: -1 }));
  for (const sc of scenes) sc.top = absTop(sc.el), sc.h = sc.el.offsetHeight;
  cardsTop = cardsTrack ? absTop(cardsTrack) : 0;
  dirty = true;
}

const at = (y) => {
  for (let i = S.length - 1; i >= 0; i--) if (y >= S[i].top) return i;
  return 0;
};

// ---------------------------------------------------------------- tone + nav
let lastBd = '', lastNav = '', lastGroup = '', lastNb = '';
function tone(y) {
  const probe = y + vh * 0.62;
  const i = at(probe);
  const s = S[i], n = S[i + 1];
  let c = TONE[s.tone];
  if (n) {
    const W = vh * 0.5;
    const t = smooth(clamp((probe - (n.top - W)) / W));
    c = mix(c, TONE[n.tone], t);
  }
  const bd = rgb(c);
  if (bd !== lastBd) { root.style.setProperty('--bd', bd); lastBd = bd; }

  const k = at(y + 40);
  const nav = S[k].el.classList.contains('lt') ? 'light' : 'dark';
  const nb = rgb(TONE[S[k].el.dataset.navbg || S[k].tone]);
  if (nb !== lastNb) { root.style.setProperty('--nb', nb); lastNb = nb; }
  if (nav !== lastNav) { root.dataset.nav = nav; lastNav = nav; }
  const scrolled = y > vh * 0.9;
  if (scrolled !== ('scrolled' in root.dataset)) scrolled ? (root.dataset.scrolled = '') : delete root.dataset.scrolled;

  const g = S[at(y + vh * 0.5)].group || '';
  if (g !== lastGroup) {
    groupLinks.forEach((a) => a.classList.toggle('on', a.dataset.group === g));
    lastGroup = g;
  }
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  root.style.setProperty('--prog', (y / max).toFixed(4));
}

// ---------------------------------------------------------------- strikes
function drawStrikes(y) {
  for (const s of strikes) {
    const rel = s.top - y;
    if (rel > vh * 1.2 || rel < -vh * 0.4) continue;
    const v = Math.round(smooth(clamp((vh * 0.86 - rel) / (vh * 0.28))) * 100) / 100;
    if (v !== s.v) { s.el.style.setProperty('--s', v); s.v = v; }
  }
}

// ---------------------------------------------------------------- scenes
const scenes = [];
const scene = (el, fn) => el && scenes.push({ el, fn, top: 0, h: 1 });
const progress = (sc, y) => clamp((y - sc.top) / Math.max(1, sc.h - vh));
const visible = (sc, y) => y + vh > sc.top - vh * 0.2 && y < sc.top + sc.h + vh * 0.2;

// Cover: the photo darkens into Night Indigo while the headline lifts away.
const cover = $('#cover');
scene(cover, (p) => cover.style.setProperty('--cp', p.toFixed(4)));

// Logo: 3D blocks assemble along the slant; copy steps through three statements.
const logoSec = $('#logo');
const steps = $$('#logo .step');
const meter = $$('#logo .meter i');
let logo3d = null, logoTried = false, logoP = 0, curStep = -1;
async function initLogo() {
  logoTried = true;
  try {
    const { Logo3D } = await import('./logo3d.js');
    logo3d = new Logo3D($('#logo-gl'), { onAssembled: () => sound.chime() });
  } catch (e) {
    console.warn('WebGL unavailable', e);
    root.classList.add('no-gl');
  }
}
function setStep(i) {
  if (i === curStep) return;
  curStep = i;
  steps.forEach((s, k) => s.classList.toggle('on', k === i));
  meter.forEach((m, k) => m.classList.toggle('on', k <= i));
}
scene(logoSec, (p) => {
  logoP = p;
  setStep(p < 0.3 ? 0 : p < 0.6 ? 1 : 2);
});

// Type build: three cards grow from skeleton into type, hold, then turn away along 65°.
const tb = $$('#type-build .tb');
const tbPhase = $('#tb-phase');
let lastPhase = '';
scene($('#type-build'), (p) => {
  tb.forEach((c, i) => {
    const b = smooth(seg(p, 0.06 + i * 0.07, 0.3 + i * 0.07));
    const x = reduce ? 0 : ease.inCubic(seg(p, 0.7 + i * 0.05, 0.92 + i * 0.03));
    c.style.setProperty('--b', b.toFixed(3));
    c.style.setProperty('--x', x.toFixed(3));
  });
  const ph = p < 0.1 ? 'Skeleton' : p < 0.5 ? 'Type' : p < 0.7 ? 'Hierarchy holds' : 'Exit at 65°';
  if (ph !== lastPhase) { tbPhase.textContent = ph; lastPhase = ph; }
});

// Icon build: a pencil sketch draws itself, snaps to the grid, and becomes the final icon.
const board = $('#board');
let iconScene = null;
if (board) iconScene = buildIconScene();
function buildIconScene() {
  const NS = 'http://www.w3.org/2000/svg';
  const grid = $('#b-grid'), keys = $('#b-keys'), sk = $('#b-sketch'), fin = $('#b-final');
  // 24 × 24 grid with the 20 px live area
  let g = '';
  for (let i = 0; i <= 24; i++) g += `<line x1="${i}" y1="0" x2="${i}" y2="24"/><line x1="0" y1="${i}" x2="24" y2="${i}"/>`;
  grid.innerHTML = g + '<rect class="live" x="2" y="2" width="20" height="20"/>';
  // sample every path of the hero icon into points
  const ic = icon('trade');
  const ds = [...ic.s, ic.a.d];
  const probe = document.createElementNS(NS, 'path');
  sk.appendChild(probe);
  const rnd = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * 43758.5453 % 1;
  const lines = ds.map((d, j) => {
    probe.setAttribute('d', d);
    const len = probe.getTotalLength();
    const n = Math.max(6, Math.ceil(len / 0.3));
    const pts = [];
    for (let i = 0; i <= n; i++) { const q = probe.getPointAtLength((len * i) / n); pts.push([q.x, q.y]); }
    const el = document.createElementNS(NS, 'path');
    sk.appendChild(el);
    return { pts, el, len, j, ox: rnd(j, 1) * 0.55, oy: rnd(j, 2) * 0.55 };
  });
  // one loose construction circle, the kind drawn before the real lines
  const circ = document.createElementNS(NS, 'path');
  let cd = '';
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2.08 - 0.3, r = 8.6 + Math.sin(i * 0.7) * 0.35;
    cd += (i ? 'L' : 'M') + (12 + Math.cos(a) * r).toFixed(2) + ' ' + (12.3 + Math.sin(a) * r * 0.97).toFixed(2);
  }
  circ.setAttribute('d', cd);
  circ.style.opacity = '.45';
  sk.insertBefore(circ, sk.firstChild);
  probe.remove();
  const circLen = 58;
  circ.style.strokeDasharray = circLen;

  const accent = $$('.ia', fin);
  const stepsLi = $$('#icon-build .ib-steps li');
  let lastI = -1;

  return (p) => {
    const draw = smooth(seg(p, 0.02, 0.3));
    const build = smooth(seg(p, 0.32, 0.42));
    const snap = ease.inOutCubic(seg(p, 0.38, 0.62));
    const done = smooth(seg(p, 0.6, 0.7));
    const acc = smooth(seg(p, 0.7, 0.82));
    const A = 1 - snap;
    for (const L of lines) {
      let d = '';
      L.pts.forEach(([x, y], i) => {
        const w = Math.sin(i * 0.55 + L.j * 1.7) * 0.22 + Math.sin(i * 1.9 + L.j) * 0.08;
        const px = x + A * (L.ox + w), py = y + A * (L.oy + Math.cos(i * 0.7 + L.j) * 0.2);
        d += (i ? 'L' : 'M') + px.toFixed(2) + ' ' + py.toFixed(2);
      });
      L.el.setAttribute('d', d);
      L.el.style.strokeDasharray = L.len * 1.4;
      L.el.style.strokeDashoffset = (L.len * 1.4 * (1 - draw)).toFixed(2);
      const ink = smooth(seg(snap, 0.72, 1));
      L.el.style.strokeWidth = (0.34 + (1.75 - 0.34) * ink).toFixed(3);
      L.el.style.stroke = ink > 0.4 ? '#0F1115' : '#5b616d';
    }
    circ.style.strokeDashoffset = (circLen * (1 - draw)).toFixed(2);
    circ.style.opacity = (0.45 * (1 - build)).toFixed(3);
    grid.style.opacity = (build * (1 - done * 0.55)).toFixed(3);
    keys.style.opacity = (build * (1 - done * 0.7)).toFixed(3);
    sk.style.opacity = (1 - done).toFixed(3);
    fin.style.opacity = done.toFixed(3);
    accent.forEach((a) => (a.style.opacity = acc.toFixed(3)));
    const si = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
    if (si !== lastI) { stepsLi.forEach((li, k) => li.classList.toggle('on', k === si)); lastI = si; }
  };
}
scene($('#icon-build'), (p) => iconScene && iconScene(p));

// Card patterns: the six cards grow from skeleton as the carousel scrolls into view.
const cardsTrack = $('#cards-track');
const kcs = $$('#cards-track .kc');
let cardsTop = 0, lastCardsP = -1;
function buildCards(y) {
  if (!cardsTrack) return;
  const rel = cardsTop - y;
  if (rel > vh * 1.3 || rel < -vh) return;
  const p = Math.round(clamp((vh * 0.92 - rel) / (vh * 0.5)) * 200) / 200;
  if (p === lastCardsP) return;
  lastCardsP = p;
  kcs.forEach((c, i) => c.style.setProperty('--b', smooth(clamp(p * 1.7 - i * 0.14)).toFixed(3)));
}

// ---------------------------------------------------------------- loop
let lastY = -1, dirty = true, lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const y = window.scrollY;
  if (y !== lastY || dirty) {
    tone(y);
    drawStrikes(y);
    buildCards(y);
    for (const sc of scenes) if (visible(sc, y)) sc.fn(progress(sc, y));
    lastY = y;
    dirty = false;
  }
  // the 3D mark keeps easing and turning while its scene is on screen
  const ls = scenes.find((s) => s.el === logoSec);
  if (ls) {
    const near = y + vh * 2.5 > ls.top && y < ls.top + ls.h + vh;
    if (near && !logoTried) initLogo();
    if (logo3d && visible(ls, y)) logo3d.frame(logoP, dt, reduce);
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- carousels
for (const car of $$('[data-car]')) {
  const track = $('.car-track', car);
  const items = [...track.children];
  const prev = $('[data-prev]', car), next = $('[data-next]', car), count = $('[data-count]', car);
  const stepW = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : track.clientWidth);
  const update = () => {
    const i = Math.min(items.length - 1, Math.round(track.scrollLeft / stepW()));
    if (count) count.textContent = `${i + 1} / ${items.length}`;
    const end = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    prev.disabled = track.scrollLeft < 4;
    next.disabled = end;
    prev.style.opacity = prev.disabled ? 0.35 : 1;
    next.style.opacity = next.disabled ? 0.35 : 1;
  };
  const go = (d) => track.scrollBy({ left: d * stepW(), behavior: reduce ? 'auto' : 'smooth' });
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  track.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------------------------------------------------------------- instagram profile grid
const pgrid = $('#p-grid');
const posts = $$('#posts .post');
if (pgrid && posts.length) {
  const diag = $('.p-diag', pgrid);
  for (const p of posts) {
    const c = p.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    $$('img', c).forEach((im) => { im.alt = ''; im.loading = 'eager'; });
    pgrid.insertBefore(c, diag);
  }
  const btn = $('#diag-btn'), prof = $('#profile');
  btn.addEventListener('click', () => {
    const on = !prof.classList.contains('show-diag');
    prof.classList.toggle('show-diag', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Hide the diagonal' : 'Show the diagonal';
  });
}

// ---------------------------------------------------------------- index + sound
const index = $('#index');
const openers = [$('#idx-open'), $('#idx-open2')].filter(Boolean);
const openIndex = () => {
  index.hidden = false;
  openers.forEach((b) => b.setAttribute('aria-expanded', 'true'));
  document.body.style.overflow = 'hidden';
  $('#idx-close').focus();
};
const closeIndex = () => {
  index.hidden = true;
  openers.forEach((b) => b.setAttribute('aria-expanded', 'false'));
  document.body.style.overflow = '';
};
openers.forEach((b) => b.addEventListener('click', openIndex));
$('#idx-close').addEventListener('click', () => { closeIndex(); openers[0].focus(); });
$$('#index a').forEach((a) => a.addEventListener('click', closeIndex));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !index.hidden) closeIndex(); });

const snd = $('#snd');
snd.addEventListener('click', () => {
  const on = sound.toggle();
  snd.setAttribute('aria-pressed', String(on));
  $('#snd-txt').textContent = on ? 'Sound on' : 'Sound off';
  if (on) sound.chime();
});

// ---------------------------------------------------------------- boot
measure();
tone(window.scrollY);
let mt = 0;
const remeasure = () => { clearTimeout(mt); mt = setTimeout(() => { measure(); logo3d?.resize(); }, 120); };
window.addEventListener('resize', remeasure);
window.addEventListener('load', measure);
if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe($('main'));
document.fonts?.ready.then(measure);
requestAnimationFrame(frame);
