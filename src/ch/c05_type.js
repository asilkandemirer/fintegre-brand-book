// 05 — Typography (light). The room turns to White Smoke. A giant specimen moves
// through Geologica's weight, sharpness and slant axes as you scroll; the process
// words run past like a ticker.
import { C } from '../world.js';
import { fitLogo } from './common.js';
import { clamp, seg, ease, TAU, lerp } from '../util.js';

export default {
  id: 'type', title: 'Typography', cat: 'Identity', len: 2.6, theme: 'light',
  build() {
    this.aa = document.getElementById('aa');
    this.axes = document.getElementById('aa-axes');
    this.mq = [...document.querySelectorAll('#ch-type .mq-track')];
  },
  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    w.camTo({ pos: [0, 0, 9], look: [0, 0, 0], fov: 30 });
    w.logoTo({
      pos: P ? [c.halfW0 * 0.6, 1.3, 0] : [c.halfW0 * 0.78, 1.72, 0],
      rot: [0.2, u * TAU * 1.5, 0], scale: P ? 0.34 : 0.48, float: 0.6, vis: 1, mat: 'graphite',
    });
    w.blocksHome();
    w.bgTo({ base: C.smoke, ca: C.ice, cb: C.indigo, pa: [0.85, 0.85], pb: [0.1, 0.05], ia: 0.12, ib: 0.04, slant: 0, field: 0 });
    w.postTo({ bloom: 0.12, vig: 0.12, grain: 0.008, envRot: u * 2, envInt: 1.1, exposure: 1.0 });
    w.lightsTo({ sweep: 14, signal: 0 });
  },
  tick(p, c) {
    if (p < -0.2 || p > 1.2) return;
    const u = clamp(p);
    // specimen: weight 150→800, sharpness 0→100, slant follows scroll velocity
    const wgt = lerp(150, 800, ease.inOutSine(seg(u, 0.05, 0.75)));
    const shrp = lerp(0, 100, ease.inOutSine(seg(u, 0.3, 0.9)));
    const vs = clamp(c.vel * 6, -1, 1);
    this.slnt = lerp(this.slnt || 0, -Math.abs(vs) * 12, 0.12);
    if (this.aa) {
      this.aa.style.fontVariationSettings = `"wght" ${wgt.toFixed(0)}, "SHRP" ${shrp.toFixed(0)}, "slnt" ${this.slnt.toFixed(1)}`;
      if (this.axes) this.axes.textContent = `wght ${wgt.toFixed(0)} · SHRP ${shrp.toFixed(0)} · slnt ${this.slnt.toFixed(1)}`;
    }
    // ticker rows driven by scroll time, opposite directions
    const off = (((c.T * 22) % 50) + 50) % 50;
    this.mq.forEach((el, i) => {
      const x = i % 2 ? -50 + off : -off;
      el.style.transform = `translate3d(${x.toFixed(3)}%,0,0)`;
    });
  },
};
