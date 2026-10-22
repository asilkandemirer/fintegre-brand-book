// Text that is *computed* into place.
// Entry: every character cycles through three random glyphs before locking onto the
// right one. Locking travels from the last character to the first along a curve, and
// the whole word takes the same time however long it is, so writing never slows the
// pace. Each lock ticks like a typewriter key.
// Exit ("wind"): a gust from the right pushes letters left, they bunch up irregularly,
// thin out and are gone. Exit ("line"): the text slides inside a band that collapses
// to a single hairline and snaps off.
import { sound } from './audio.js';
import { clamp, ease, rng } from './util.js';

const GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZabcdefghkmnoprstuvwxyz0123456789/\\|+=<>#%&*';
const R = rng(7);
const pick = () => GLYPHS[Math.floor(R() * GLYPHS.length)];

export const reduceMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const PRESET = {
  head: { span: 560, dt: 46, slide: 1, exit: 'wind' },
  big: { span: 480, dt: 44, slide: 1, exit: 'wind' },
  body: { span: 640, dt: 30, slide: 0, exit: 'line' },
  label: { span: 300, dt: 34, slide: 0, exit: 'line' },
};

export class TextFX {
  constructor(el) {
    this.el = el;
    this.kind = el.dataset.fx || 'body';
    this.p = { ...PRESET[this.kind] };
    if (el.dataset.exit) this.p.exit = el.dataset.exit;
    this.ch = el.dataset.ch != null ? +el.dataset.ch : null;
    this.in = el.dataset.in != null ? +el.dataset.in : 0;
    this.out = el.dataset.out != null ? +el.dataset.out : 1.01;
    this.state = 'hidden';
    this.silent = el.dataset.silent != null;
    this.source = el.innerHTML;
    this.build();
    el.classList.add('fx', 'fx-' + this.kind);
  }

  build(html = this.source) {
    const el = this.el;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    el.textContent = '';
    this.chars = [];
    const add = (parent, node, acc) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          for (const w of parts) {
            if (!w) continue;
            if (/^\s+$/.test(w)) { parent.appendChild(document.createTextNode(' ')); continue; }
            const ws = document.createElement('span');
            ws.className = 'w';
            for (const chr of w) {
              const c = document.createElement('span');
              c.className = acc ? 'c acc' : 'c';
              c.textContent = chr;
              ws.appendChild(c);
              this.chars.push({ el: c, f: chr, ph: -1, x: 0, line: 0 });
            }
            parent.appendChild(ws);
          }
        } else if (n.nodeName === 'BR') {
          parent.appendChild(document.createElement('br'));
        } else if (n.nodeName === 'EM') {
          add(parent, n, true);
        } else if (n.nodeType === 1) {
          // keep other inline wrappers (e.g. <s>, <b>) with their class
          const wrap = document.createElement(n.nodeName.toLowerCase());
          wrap.className = n.className;
          parent.appendChild(wrap);
          add(wrap, n, acc);
        }
      }
    };
    add(el, tmp, false);
    // screen readers get the plain sentence, not a pile of single letters
    for (const w of el.querySelectorAll('.w')) w.setAttribute('aria-hidden', 'true');
    const sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = tmp.textContent.replace(/\s+/g, ' ').trim();
    el.insertBefore(sr, el.firstChild);
    this.measured = false;
  }

  replace(html) {
    this.source = html;
    this.build(html);
    this.measure();
    if (this.state !== 'hidden') this.show(performance.now(), true);
  }

  measure() {
    const { el, chars } = this;
    for (const c of chars) { c.el.style.width = ''; c.el.textContent = c.f; c.el.style.transform = ''; }
    const box = el.getBoundingClientRect();
    const tops = [];
    for (const c of chars) {
      const r = c.el.getBoundingClientRect();
      c.w = r.width;
      c.x = r.left - box.left + r.width / 2;
      c.y = r.top - box.top;
      let li = tops.findIndex((t) => Math.abs(t - c.y) < r.height * 0.5);
      if (li < 0) { tops.push(c.y); li = tops.length - 1; }
      c.line = li;
    }
    for (const c of chars) c.el.style.width = c.w.toFixed(2) + 'px';
    this.lines = tops.length;
    this.bw = box.width || 1;
    this.measured = true;
    if (this.state === 'hidden') for (const c of chars) c.el.style.opacity = '0';
  }

  show(t, force = false) {
    if (!force && (this.state === 'in' || this.state === 'shown')) return;
    if (!this.measured) this.measure();
    const el = this.el;
    this.state = 'in';
    this.t0 = t;
    el.classList.remove('fx-close');
    el.classList.add('fx-on');
    if (this.p.exit === 'line' || this.kind === 'body' || this.kind === 'label') {
      el.classList.remove('fx-open');
      void el.offsetWidth; // restart the hairline reveal
      el.classList.add('fx-open');
    }
    const n = this.chars.length;
    const { span, dt } = this.p;
    const lead = this.kind === 'body' || this.kind === 'label' ? 160 : 0;
    this.chars.forEach((c, i) => {
      const k = n > 1 ? (n - 1 - i) / (n - 1) : 0; // 0 for last char, 1 for first
      c.tl = t + lead + 3 * dt + span * Math.pow(k, 0.82);
      c.ts = c.tl - 3 * dt;
      c.ph = -1;
      c.el.classList.remove('lk', 'scr');
      c.el.style.opacity = '0';
      c.el.style.transform = '';
    });
    this.dur = lead + 3 * dt + span + 140;
    if (reduceMotion) {
      for (const c of this.chars) { c.el.textContent = c.f; c.el.style.opacity = ''; }
      this.state = 'shown';
    }
  }

  hide(t) {
    if (this.state === 'hidden' || this.state === 'out') return;
    this.state = 'out';
    this.t1 = t;
    const el = this.el;
    if (reduceMotion) { this.finishHide(); return; }
    if (this.p.exit === 'wind') {
      const bw = this.bw;
      // letters bunch towards a point left of the text block while being blown left
      const target = -bw * 0.15;
      this.chars.forEach((c) => {
        const xn = c.x / bw;
        c.ed = (1 - xn) * 230 + R() * 90; // right side leaves first
        c.edur = 300 + R() * 160;
        c.push = (70 + R() * 190) * (0.6 + 0.4 * (1 - xn));
        c.conv = (target - c.x) * (0.25 + R() * 0.25);
        c.dy = (R() - 0.5) * 36;
        c.rot = (R() - 0.5) * 28;
        if (c.ph < 3) { c.el.textContent = c.f; c.el.classList.remove('scr'); }
      });
      this.edurTotal = 230 + 90 + 460;
      if (!this.silent) sound.whoosh(0.5, this.kind === 'big' ? 1.2 : 0.9);
    } else {
      el.classList.remove('fx-open');
      el.classList.add('fx-close');
      this.edurTotal = 480;
    }
  }

  finishHide() {
    this.state = 'hidden';
    const el = this.el;
    el.classList.remove('fx-on', 'fx-open', 'fx-close');
    for (const c of this.chars) {
      c.el.style.transform = '';
      c.el.style.opacity = '0';
      c.el.textContent = c.f;
      c.el.classList.remove('scr', 'lk');
    }
  }

  update(t) {
    if (this.state === 'in') this.tickIn(t);
    else if (this.state === 'out') this.tickOut(t);
  }

  tickIn(t) {
    const { chars, kind } = this;
    let done = true;
    const slide = this.p.slide && !reduceMotion;
    for (const c of chars) {
      let ph;
      if (t < c.ts) ph = -1;
      else if (t >= c.tl) ph = 3;
      else ph = Math.floor((t - c.ts) / this.p.dt); // 0,1,2: three generated glyphs
      if (ph !== c.ph) {
        if (ph === -1) c.el.style.opacity = '0';
        else if (ph < 3) {
          c.el.textContent = c.f === ' ' ? ' ' : pick();
          c.el.style.opacity = '1';
          if (c.ph < 0) c.el.classList.add('scr');
        } else {
          c.el.textContent = c.f;
          c.el.style.opacity = '';
          c.el.classList.remove('scr');
          c.el.classList.add('lk');
          if (!this.silent) sound.key(kind === 'big' ? 'head' : kind, (c.x / this.bw) * 2 - 1);
        }
        c.ph = ph;
      }
      if (ph < 3) done = false;
      if (slide) {
        // lines arrive from the right, alternating slightly large / small
        const lt = clamp((t - this.t0 - c.line * 70) / 820);
        const e = ease.outExpo(lt);
        const off = (1 - e) * (90 + c.line * 46);
        const sc = 1 + (1 - e) * (c.line % 2 ? -0.08 : 0.12);
        c.el.style.transform = `translate3d(${off.toFixed(1)}px,0,0) scale(${sc.toFixed(3)})`;
        if (lt < 1) done = false;
      }
    }
    if (done || t - this.t0 > this.dur + 900) {
      for (const c of chars) { c.el.style.transform = ''; c.el.classList.remove('scr'); }
      this.state = 'shown';
    }
  }

  tickOut(t) {
    const el = t - this.t1;
    if (this.p.exit !== 'wind') {
      if (el > this.edurTotal) this.finishHide();
      return;
    }
    let done = true;
    for (const c of this.chars) {
      const q = clamp((el - c.ed) / c.edur);
      if (q < 1) done = false;
      if (q <= 0) continue;
      const a = ease.inCubic(q);
      const tx = -c.push * ease.inQuad(q) + c.conv * a;
      const ty = c.dy * q;
      const sx = 1 - 0.65 * a;
      const op = q < 0.55 ? 1 : 1 - clamp((q - 0.55) / 0.22);
      c.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${(c.rot * q).toFixed(1)}deg) scale(${sx.toFixed(3)},1)`;
      c.el.style.opacity = op.toFixed(3);
    }
    if (done) this.finishHide();
  }

  // Desired visibility for a chapter-local progress u
  wants(u) { return u >= this.in && u < this.out; }
}

export class FXManager {
  constructor() { this.items = []; }
  scan(root) {
    root.querySelectorAll('[data-fx]').forEach((el) => this.items.push(new TextFX(el)));
  }
  measureAll() { for (const it of this.items) it.measure(); }
  // chapterU(ch) -> unclamped local progress for chapter index ch
  sync(chapterU, t) {
    for (const it of this.items) {
      if (it.ch == null) { it.update(t); continue; }
      const u = chapterU(it.ch);
      const want = it.wants(u);
      if (want && (it.state === 'hidden' || it.state === 'out')) it.show(t, it.state === 'out');
      else if (!want && (it.state === 'in' || it.state === 'shown')) it.hide(t);
      it.update(t);
    }
  }
}
