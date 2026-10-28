// Quiet data in the background. On desktop, digits surface under the pointer and short
// number streams flicker now and then, as if a valuation were running behind the page.
// The same layer draws the mark when it turns into numbers.
const DIG = '01123581321345589';
const pick = (r) => DIG[(r * DIG.length) | 0];

export class Ascii {
  constructor(canvas) {
    this.c = canvas;
    this.x = canvas.getContext('2d');
    this.mx = -999; this.my = -999; this.mt = 0;
    this.streams = [];
    this.on = matchMedia('(pointer: fine)').matches && window.innerWidth >= 900 &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.addEventListener('pointermove', (e) => { this.mx = e.clientX; this.my = e.clientY; this.mt = performance.now(); }, { passive: true });
    window.addEventListener('pointerleave', () => { this.mx = -999; });
    this.resize();
  }

  resize() {
    const d = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.c.width = this.w * d; this.c.height = this.h * d;
    this.c.style.width = this.w + 'px'; this.c.style.height = this.h + 'px';
    this.x.setTransform(d, 0, 0, d, 0, 0);
    this.on = matchMedia('(pointer: fine)').matches && this.w >= 900 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ink: [r,g,b] that reads on the current ground; cloud: projected points of the mark
  frame(now, ink, cloud) {
    const { x, w, h } = this;
    x.clearRect(0, 0, w, h);
    const col = (a) => `rgba(${ink[0]},${ink[1]},${ink[2]},${a.toFixed(3)})`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';

    if (cloud && cloud.length) {
      for (const p of cloud) {
        if (p.a <= 0.01) continue;
        x.font = `700 ${p.s.toFixed(1)}px "Inter", sans-serif`;
        x.fillStyle = p.c || col(p.a);
        x.globalAlpha = p.c ? p.a : 1;
        x.fillText(p.ch, p.x, p.y);
      }
      x.globalAlpha = 1;
    }
    if (!this.on) return;

    // digits under the pointer, fading a second after it stops
    const idle = Math.max(0, 1 - (now - this.mt - 600) / 900);
    if (idle > 0 && this.mx > -900) {
      const G = 18, R = 150;
      x.font = '700 11px "Inter", sans-serif';
      const gx0 = Math.floor((this.mx - R) / G), gx1 = Math.ceil((this.mx + R) / G);
      const gy0 = Math.floor((this.my - R) / G), gy1 = Math.ceil((this.my + R) / G);
      const tick = Math.floor(now / 160);
      for (let gx = gx0; gx <= gx1; gx++) {
        for (let gy = gy0; gy <= gy1; gy++) {
          const cx = gx * G + G / 2, cy = gy * G + G / 2;
          const dd = Math.hypot(cx - this.mx, cy - this.my) / R;
          if (dd >= 1) continue;
          const hsh = Math.sin(gx * 127.1 + gy * 311.7 + (tick % 7) * 0.37) * 43758.5453;
          const r = hsh - Math.floor(hsh);
          if (r < 0.35) continue;
          x.fillStyle = col((1 - dd) * (1 - dd) * 0.34 * idle);
          x.fillText(pick(r), cx, cy);
        }
      }
    }

    // a short stream of numbers appears, scrambles and goes, every few seconds
    if (this.streams.length < 2 && Math.random() < 0.006) {
      this.streams.push({ x: 40 + Math.random() * (w - 360), y: 90 + Math.random() * (h - 180), n: 8 + ((Math.random() * 10) | 0), t0: now, seed: Math.random() * 1000 });
    }
    x.font = '700 10px "Inter", sans-serif';
    x.textAlign = 'left';
    this.streams = this.streams.filter((s) => {
      const age = (now - s.t0) / 1000;
      if (age > 2.6) return false;
      const a = age < 0.3 ? age / 0.3 : age > 2 ? (2.6 - age) / 0.6 : 1;
      let str = '';
      for (let i = 0; i < s.n; i++) {
        const lock = age > 0.4 + i * 0.05;
        const v = Math.sin(s.seed + i * 12.9898 + (lock ? 0 : Math.floor(now / 60))) * 43758.5453;
        str += pick(v - Math.floor(v)) + (i % 4 === 3 ? ' ' : '');
      }
      x.fillStyle = col(0.22 * a);
      x.fillText(str, s.x, s.y);
      return true;
    });
  }
}
