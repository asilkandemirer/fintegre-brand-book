// 06 — Positioning. A slow chapter: long copy, and the four blocks drift apart
// and turn quietly behind it. What Fintegre is not gets struck through by a hairline.
import { C } from '../world.js';
import { fitLogo, classAt } from './common.js';
import { clamp, seg, ease, TAU } from '../util.js';

export default {
  id: 'position', title: 'Positioning', cat: 'Strategy', len: 2.6,
  build() {
    this.strikes = [...document.querySelectorAll('#ch-position [data-strike]')];
  },
  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    const t = c.t * 0.001;
    const s = P ? fitLogo(c, 0.9, 0.36) : fitLogo(c, 0.5, 0.62);
    const open = ease.inOutSine(seg(u, 0.0, 0.5));
    w.camTo({ pos: [0, 0, 9], look: [0, 0, 0], fov: 30, lambda: 3 });
    w.logoTo({
      pos: P ? [0, 1.75, -2.2] : [c.halfW0 * 0.38, 0.1, -1.2],
      rot: [0.25 + u * 0.3, -0.6 + u * 1.2, 0.08],
      scale: s, float: 1, vis: 1, mat: 'titanium',
    });
    const spread = 0.35 + open * 0.55;
    w.blockTo(0, [0.25 * spread, 0.35 * spread, 0.5 * spread], [0.2 * open, 0.5 * open + Math.sin(t * 0.3) * 0.1, 0]);
    w.blockTo(1, [-0.15 * spread, 0.05 * spread, -0.4 * spread], [-0.15 * open, -0.4 * open, 0.05]);
    w.blockTo(2, [-0.35 * spread, -0.35 * spread, 0.3 * spread], [0.4 * open, 0.2 * open, -0.1 * open]);
    w.blockTo(3, [0.2 * spread, -0.45 * spread, -0.6 * spread], [-0.3 * open, 0.6 * open, 0.1]);
    w.bgTo({ base: C.graphite, ca: C.indigo, cb: C.titanium, pa: [0.85, 0.5], pb: [0.1, 0.9], ia: 0.12, ib: 0.03, slant: 0.18, field: 0 });
    w.postTo({ bloom: 0.4, vig: 0.75, envRot: 2 + u, envInt: 0.75 });
    w.lightsTo({ sweep: 10, signal: 6 });
  },
  tick(p, c) {
    for (const el of this.strikes) classAt(el, 'is-struck', p >= +el.dataset.strike && p < 1.02);
  },
};
