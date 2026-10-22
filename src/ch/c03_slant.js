// 03 — The slant. The four blocks slide in along the one angle they share, the
// construction lines are drawn over them, then the finished mark turns a full
// revolution to show its depth.
import { BufferGeometry, Float32BufferAttribute, LineSegments, LineBasicMaterial, Object3D, Vector3, Color } from 'three';
import { LOGO, SLANT_DEG } from '../logo.js';
import { C } from '../world.js';
import { fitLogo, crossedFwd } from './common.js';
import { clamp, ease, seg, TAU, lerp } from '../util.js';

const D = [Math.cos((SLANT_DEG * Math.PI) / 180), Math.sin((SLANT_DEG * Math.PI) / 180)];
const WIN = [[0.08, 0.27], [0.14, 0.33], [0.2, 0.39], [0.26, 0.45]];
const FROM = [3.4, -3.0, -3.8, 3.1];

export default {
  id: 'slant', title: 'The slant', cat: 'Identity', len: 2.4,

  build(c) {
    const pts = [];
    const ext = 0.55;
    for (const b of LOGO) {
      // two slanted edges: BL→TL and BR→TR, extended both ways
      for (const [a, z] of [[b[1], b[0]], [b[2], b[3]]]) {
        const dx = z[0] - a[0], dy = z[1] - a[1];
        const l = Math.hypot(dx, dy);
        const ux = dx / l, uy = dy / l;
        pts.push(a[0] - ux * ext, a[1] - uy * ext, 0.1, z[0] + ux * ext, z[1] + uy * ext, 0.1);
      }
    }
    // horizontals at the top and bottom of every block
    const ys = new Set();
    for (const b of LOGO) { ys.add(b[0][1].toFixed(4)); ys.add(b[1][1].toFixed(4)); }
    for (const y of ys) pts.push(-0.92, +y, 0.1, 0.98, +y, 0.1);
    // 65° arc at the lower-left block
    const o = LOGO[2][1];
    const R = 0.2, n = 24;
    const arc = [];
    for (let i = 0; i < n; i++) {
      const a0 = ((i / n) * SLANT_DEG * Math.PI) / 180, a1 = (((i + 1) / n) * SLANT_DEG * Math.PI) / 180;
      arc.push(o[0] + Math.cos(a0) * R, o[1] + Math.sin(a0) * R, 0.1, o[0] + Math.cos(a1) * R, o[1] + Math.sin(a1) * R, 0.1);
    }
    const all = pts.concat(arc);
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(all, 3));
    this.nGuide = pts.length / 3;
    this.nAll = all.length / 3;
    this.mat = new LineBasicMaterial({ color: new Color('#B7D7FF'), transparent: true, opacity: 0, depthTest: false });
    this.lines = new LineSegments(g, this.mat);
    this.lines.renderOrder = 10;
    this.lines.visible = false;
    c.w.logoSpin.add(this.lines);
    // anchor for the angle label
    const mid = ((SLANT_DEG / 2) * Math.PI) / 180;
    this.anchor = new Object3D();
    this.anchor.position.set(o[0] + Math.cos(mid) * (R + 0.16), o[1] + Math.sin(mid) * (R + 0.12) - 0.03, 0.1);
    c.w.logoSpin.add(this.anchor);
    const v = new Vector3();
    this.angleLbl = c.labels.add(`${SLANT_DEG}°`, () => this.anchor.getWorldPosition(v), { cls: 'lbl-angle', fx: 'label' });
    this.prevU = 0;
  },

  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    const s = P ? fitLogo(c, 0.74, 0.28) : fitLogo(c, 0.4, 0.5);
    const spin = ease.inOutCubic(seg(u, 0.64, 0.97));
    w.camTo({ pos: [0, 0, 9], look: [0, 0, 0], fov: 30 });
    w.logoTo({
      pos: [P ? 0 : c.halfW0 * 0.22, P ? 0.75 : 0.05, 0],
      rot: [Math.sin(spin * Math.PI) * 0.35, spin * TAU, 0],
      scale: s, float: lerp(0.12, 0.7, spin), vis: 1,
      mat: u < 0.56 ? 'titanium' : 'signal',
    });
    for (let i = 0; i < 4; i++) {
      const e = ease.outExpo(seg(u, WIN[i][0], WIN[i][1]));
      const d = FROM[i] * (1 - e);
      w.blockTo(i, [D[0] * d, D[1] * d, (1 - e) * (i - 1.5) * 0.6], [0, 0, (1 - e) * (i % 2 ? 0.5 : -0.5)]);
      if (crossedFwd(this.prevU, u, WIN[i][1] - 0.035)) { c.sound.thump(0.35); c.sound.key('head', 0); }
    }
    w.bgTo({ base: C.graphite, ca: C.indigo, cb: C.ice, pa: [0.7, 0.4], pb: [0.2, 0.8], ia: 0.16, ib: 0.05, slant: u < 0.62 ? 1 : 0.35, field: 0 });
    w.postTo({ bloom: 0.45, vig: 0.66, envRot: 0.6 + u, envInt: 1.0 });
    w.lightsTo({ sweep: 20, signal: 10 });
    this.prevU = u;
  },

  tick(p, c) {
    const near = p > -0.05 && p < 1.05;
    this.lines.visible = near;
    if (!near) { c.labels.show(this.angleLbl, false); return; }
    const u = clamp(p);
    const draw = ease.inOutCubic(seg(u, 0.36, 0.6));
    const fade = 1 - seg(u, 0.62, 0.72);
    this.mat.opacity = 0.62 * fade * (draw > 0 ? 1 : 0);
    const n = Math.floor(this.nGuide * draw);
    const arcN = Math.floor((this.nAll - this.nGuide) * ease.outCubic(seg(u, 0.5, 0.6)));
    // draw guides progressively, then the arc
    if (arcN > 0) this.lines.geometry.setDrawRange(0, this.nGuide + arcN - ((this.nGuide + arcN) % 2));
    else this.lines.geometry.setDrawRange(0, n - (n % 2));
    c.labels.show(this.angleLbl, u > 0.54 && u < 0.66 && p < 1);
  },
};
