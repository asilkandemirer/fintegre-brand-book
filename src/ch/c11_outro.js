// 11 — The question. The mark returns to zero gravity in its signature gradient
// and the book ends on the question the website is built around.
import { C } from '../world.js';
import { fitLogo } from './common.js';
import { TAU } from '../util.js';

export default {
  id: 'outro', title: 'The question', cat: 'Closing', len: 1.4,
  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    const t = c.t * 0.001;
    const s = P ? fitLogo(c, 0.5, 0.2) : fitLogo(c, 0.2, 0.22);
    w.camTo({ pos: [0, 0, 9], look: [0, 0, 0], fov: 30 });
    w.logoTo({ pos: [0, P ? 1.55 : 1.42, 0], rot: [0.15, -0.4 + u * TAU, 0], scale: s, float: 1, vis: 1, mat: 'signal' });
    w.blocksHome();
    w.bgTo({
      base: C.graphite, ca: C.indigo, cb: C.ice,
      pa: [0.5 + Math.sin(t * 0.2) * 0.2, 0.75], pb: [0.5, 0.0], ia: 0.34, ib: 0.08, slant: 0.22, field: 0,
    });
    w.postTo({ bloom: 0.62, vig: 0.7, envRot: u * 2, envInt: 1.0 });
    w.lightsTo({ sweep: 22, signal: 18 });
  },
};
