// 09 — Voice. Slow again. Pairs of sentences: what we say, what we never say.
// Behind them the mark turns slowly in ice glass.
import { C } from '../world.js';
import { fitLogo, classAt } from './common.js';
import { clamp } from '../util.js';

export default {
  id: 'voice', title: 'Voice', cat: 'Verbal', len: 2.4,
  build() { this.strikes = [...document.querySelectorAll('#ch-voice [data-strike]')]; },
  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    const s = P ? fitLogo(c, 0.95, 0.34) : fitLogo(c, 0.55, 0.7);
    w.camTo({ pos: [0, 0, 9], look: [0, 0, 0], fov: 30, lambda: 3 });
    w.logoTo({
      pos: P ? [0.2, 1.35, -1.2] : [c.halfW0 * 0.42, 0.15, -1.2],
      rot: [0.35, -0.8 + u * Math.PI, 0.1], scale: s, float: 1, vis: 1, mat: 'ice',
    });
    w.blocksHome();
    w.bgTo({ base: C.graphite, ca: C.indigo, cb: C.ice, pa: [0.8, 0.6], pb: [0.75, 0.2], ia: 0.22, ib: 0.12, slant: 0, field: 0 });
    w.postTo({ bloom: 0.5, vig: 0.72, envRot: 3 + u * 2, envInt: 1.25 });
    w.lightsTo({ sweep: 22, signal: 14 });
  },
  tick(p) {
    for (const el of this.strikes) classAt(el, 'is-struck', p >= +el.dataset.strike && p < 1.02);
  },
};
