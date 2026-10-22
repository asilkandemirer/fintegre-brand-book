// 01 — The promise. The mark takes on its signature indigo→ice gradient and turns
// one full revolution while the headline is computed into place.
import { fitLogo } from './common.js';
import { C } from '../world.js';
import { TAU, ease, seg } from '../util.js';

export default {
  id: 'promise', title: 'The promise', cat: 'Strategy', len: 1.8,
  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    const s = P ? fitLogo(c, 0.5, 0.2) : fitLogo(c, 0.3, 0.42);
    const x = P ? 0 : c.halfW0 * 0.46;
    const y = P ? 1.3 : 0.05;
    const turn = ease.inOutCubic(seg(u, 0.05, 0.9));
    w.camTo({ pos: [0, 0, 8.6 - u * 0.6], look: [0, 0, 0], fov: 30 });
    w.logoTo({
      pos: [x, y, 0],
      rot: [0.32, -0.5 + turn * TAU, -0.06],
      scale: s, float: 0.8, vis: 1, mat: 'signal',
    });
    w.blocksHome();
    w.bgTo({
      base: C.graphite, ca: C.indigo, cb: C.ice,
      pa: [P ? 0.5 : 0.74, P ? 0.78 : 0.55], pb: [0.15, 0.1],
      ia: 0.3 + u * 0.12, ib: 0.05, slant: 0, field: 0,
    });
    w.postTo({ bloom: 0.62, vig: 0.7, envRot: 1.2 + u * 1.5, envInt: 1.0 });
    w.lightsTo({ sweep: 18, signal: 22 });
  },
};
