// 00 — Zero gravity. The mark floats in a dark studio, polished like a mirror;
// light slides across its faces and the room slowly changes colour around it.
import { fitLogo } from './common.js';
import { C } from '../world.js';
import { TAU } from '../util.js';

export default {
  id: 'intro', title: 'Zero gravity', cat: 'Opening', len: 1.3,
  update(u, c) {
    const { w } = c;
    const t = c.t * 0.001;
    const P = c.portrait;
    const s = P ? fitLogo(c, 0.66, 0.3) : fitLogo(c, 0.36, 0.44);
    w.camTo({ pos: [0, 0, 9 - u * 0.8], look: [0, 0, 0], fov: 30 });
    w.logoTo({
      pos: [0, P ? 0.55 : 0.18, 0],
      rot: [0.12 + Math.sin(u * Math.PI) * 0.2, -0.35 + u * TAU, 0.0],
      scale: s, float: 1, vis: 1, mat: 'chrome',
    });
    w.blocksHome();
    // the room breathes between indigo and ice
    const k = (Math.sin(t * 0.35) + 1) / 2;
    w.bgTo({
      base: C.graphite,
      ca: k > 0.5 ? C.indigo : C.indigo, cb: C.ice,
      pa: [0.5 + Math.sin(t * 0.21) * 0.28, 0.62 + Math.cos(t * 0.17) * 0.12],
      pb: [0.5 - Math.sin(t * 0.19) * 0.3, 0.3],
      ia: 0.2 + k * 0.16 + u * 0.1, ib: 0.04 + (1 - k) * 0.06, slant: 0.0, field: 0,
    });
    w.postTo({ bloom: 0.6, vig: 0.72, grain: 0.012, envInt: 1.0, envRot: u * 2.2, exposure: 1.0, flash: 0 });
    w.lightsTo({ sweep: 26, signal: 12 });
  },
};
