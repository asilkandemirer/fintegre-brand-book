// 04 — Matter. The camera circles the mark a full 360° while it changes material:
// titanium, indigo, ice glass, graphite. Each change rings like glass and the room
// takes on the new colour.
import { Color } from 'three';
import { C } from '../world.js';
import { fitLogo, crossed } from './common.js';
import { TAU, seg, ease } from '../util.js';

const MATS = [
  { at: 0.0, mat: 'titanium', base: '#101318', ca: '#A7B0BE', ia: 0.12, cb: '#3047EC', ib: 0.05, flash: '#A7B0BE' },
  { at: 0.25, mat: 'indigo', base: '#0d1030', ca: '#3047EC', ia: 0.5, cb: '#B7D7FF', ib: 0.08, flash: '#3047EC' },
  { at: 0.5, mat: 'ice', base: '#0e141f', ca: '#3047EC', ia: 0.2, cb: '#B7D7FF', ib: 0.32, flash: '#B7D7FF' },
  { at: 0.75, mat: 'graphite', base: '#08090c', ca: '#3047EC', ia: 0.16, cb: '#A7B0BE', ib: 0.05, flash: '#F5F7FA' },
];
const col = (h) => new Color(h);
MATS.forEach((m) => { m.cBase = col(m.base); m.cA = col(m.ca); m.cB = col(m.cb); m.cF = col(m.flash); });

export default {
  id: 'matter', title: 'Matter', cat: 'Identity', len: 2.4,
  build() { this.prevU = 0; },
  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    const cur = MATS.filter((m) => u >= m.at).pop() || MATS[0];
    const orbit = ease.inOutSine(seg(u, 0.02, 0.98)) * TAU;
    const dist = P ? 10.5 : 8.2;
    const s = P ? fitLogo(c, 0.7, 0.26) : fitLogo(c, 0.42, 0.5);
    const lift = Math.sin(u * Math.PI) * 1.4;
    const cy = P ? 0.85 : 0;
    // keep the mark framed off-centre on wide screens by shifting the look target
    const lx = P ? 0 : -c.halfW0 * 0.2;
    w.camTo({
      pos: [Math.sin(orbit) * dist, cy + lift, Math.cos(orbit) * dist],
      look: [Math.cos(orbit) * lx, cy - (P ? 0.55 : 0), -Math.sin(orbit) * lx], fov: 30, lambda: 5,
    });
    w.logoTo({ pos: [0, cy, 0], rot: [0, 0, 0], scale: s, float: 0.45, vis: 1, mat: cur.mat });
    w.blocksHome();
    w.bgTo({ base: cur.cBase, ca: cur.cA, cb: cur.cB, pa: [0.72, 0.62], pb: [0.25, 0.25], ia: cur.ia, ib: cur.ib, slant: 0, field: 0 });
    w.postTo({ bloom: cur.mat === 'indigo' ? 0.75 : 0.5, vig: 0.68, envRot: u * 4, envInt: cur.mat === 'ice' ? 1.3 : 1.05 });
    w.lightsTo({ sweep: 34, signal: cur.mat === 'indigo' ? 30 : cur.mat === 'ice' ? 8 : 0, sweepAngle: u * 6 });
    for (const m of MATS.slice(1)) {
      if (crossed(this.prevU, u, m.at)) {
        c.sound.glass();
        w.punch(0.35, m.cF);
      }
    }
    this.prevU = u;
  },
};
