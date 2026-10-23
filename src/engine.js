// The clock. Scrolling never moves the page: wheel, touch and keys push a target time,
// and a playhead follows it at a limited speed. Some regions (galleries, the billboard)
// have their own pace: a minimum speed so they keep flowing, and a low maximum so a hard
// flick cannot rush them. Time is measured in beats; one beat ≈ one screen of scrolling.
import { clamp } from './util.js';

export class Clock {
  constructor(total, regions) {
    this.total = total;
    this.regions = regions; // [{ a, b, vmin, vmax, lead }]
    this.T = 0;
    this.target = 0;
    this.v = 0;
    this.base = { vmin: 0, vmax: 1.5, lead: 1.2 };
  }

  region(t) {
    for (const r of this.regions) if (t >= r.a && t < r.b) return r;
    return this.base;
  }

  push(d) {
    const r = this.region(this.T);
    const lead = r.lead ?? this.base.lead;
    this.target = clamp(this.target + d, Math.max(0, this.T - lead), Math.min(this.total, this.T + lead));
  }

  seek(t) { this.T = this.target = clamp(t, 0, this.total); this.v = 0; }

  tick(dt) {
    const d = this.target - this.T;
    const ad = Math.abs(d);
    if (ad < 1e-4) { this.T = this.target; this.v = 0; return; }
    const r = this.region(this.T);
    const vmax = r.vmax ?? this.base.vmax;
    const vmin = r.vmin ?? 0;
    // ease towards the target, but never faster than vmax and (in paced regions) never slower than vmin
    let v = clamp(ad * 3.2, vmin, vmax);
    // accelerate smoothly instead of jumping to full speed
    this.v += (v - this.v) * Math.min(1, dt * 7);
    const step = Math.min(ad, Math.max(this.v, vmin) * dt);
    this.T += Math.sign(d) * step;
  }
}

// Input: wheel, touch and keys become beats.
export function bindInput(clock, el, { onKey } = {}) {
  const vh = () => Math.max(1, window.innerHeight);
  const inPanel = (e) => e.target && e.target.closest && e.target.closest('.index');
  el.addEventListener('wheel', (e) => {
    if (inPanel(e)) return;
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= vh();
    clock.push(dy / (vh() * 1.15));
  }, { passive: false });

  let ty = null, tv = 0, tt = 0;
  el.addEventListener('touchstart', (e) => { if (inPanel(e)) { ty = null; return; } ty = e.touches[0].clientY; tv = 0; tt = performance.now(); }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (ty == null) return;
    e.preventDefault();
    const y = e.touches[0].clientY, now = performance.now();
    const d = (ty - y) / (vh() * 0.85);
    tv = d / Math.max(1, now - tt);
    clock.push(d);
    ty = y; tt = now;
  }, { passive: false });
  el.addEventListener('touchend', () => { if (ty != null) clock.push(clamp(tv * 220, -0.8, 0.8)); ty = null; }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (onKey && onKey(e)) return;
    const k = e.key;
    if (['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(k)) { e.preventDefault(); clock.push(k === 'PageDown' || k === ' ' ? 1 : 0.5); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(k)) { e.preventDefault(); clock.push(k === 'PageUp' ? -1 : -0.5); }
    else if (k === 'Home') { e.preventDefault(); clock.seek(0); }
    else if (k === 'End') { e.preventDefault(); clock.seek(clock.total); }
  });
}
