// 10 — Rollout. Six touchpoints stand on a ring around the mark and the ring
// turns a full 360° as you scroll. The card facing you names itself.
import { Group, Mesh, MeshStandardMaterial, MeshPhysicalMaterial, Color, Vector3, DoubleSide } from 'three';
import { C } from '../world.js';
import { CARDS, tex } from '../textures.js';
import { roundedRect } from './common.js';
import { clamp, seg, ease, TAU } from '../util.js';

export default {
  id: 'rollout', title: 'Rollout', cat: 'Rollout', len: 2.6,
  build(c) {
    const ring = (this.ring = new Group());
    ring.visible = false;
    c.w.scene.add(ring);
    const backMat = new MeshPhysicalMaterial({ color: new Color('#1a1e26'), metalness: 0.8, roughness: 0.35, side: DoubleSide });
    this.cards = CARDS.map((cd, i) => {
      const g = new Group();
      const map = tex(cd.make(), c.w.renderer);
      const front = new Mesh(roundedRect(cd.w, cd.h, 0.05), new MeshStandardMaterial({ map, emissiveMap: map, emissive: new Color('#ffffff'), emissiveIntensity: 0.22, roughness: 0.55, metalness: 0.0 }));
      front.position.z = 0.006;
      const back = new Mesh(roundedRect(cd.w, cd.h, 0.05), backMat);
      back.position.z = -0.006;
      back.rotation.y = Math.PI;
      g.add(front, back);
      ring.add(g);
      return { ...cd, g };
    });
    this.nameEl = document.getElementById('roll-name');
    this.active = -1;
  },
  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    w.camTo({ pos: [0, P ? 0.9 : 0.55, P ? 11 : 9.4], look: [0, P ? 0.35 : 0.05, 0], fov: 30 });
    w.logoTo({ pos: [P ? 0 : c.halfW0 * 0.24, P ? 0.35 : 0, 0], rot: [0.15, c.t * 0.0005, 0], scale: P ? 0.45 : 0.62, float: 0.6, vis: 1, mat: 'signal' });
    w.blocksHome();
    w.bgTo({ base: C.graphite, ca: C.indigo, cb: C.ice, pa: [0.5, 0.45], pb: [0.5, 0.95], ia: 0.24, ib: 0.05, slant: 0.1, field: 0 });
    w.postTo({ bloom: 0.25, vig: 0.7, envRot: u * 3, envInt: 0.85 });
    w.lightsTo({ sweep: 14, signal: 8 });
  },
  tick(p, c) {
    const near = p > -0.06 && p < 1.06;
    this.ring.visible = near;
    if (!near) {
      const fx = this.nameEl && this.nameEl.__fx;
      if (fx && (fx.state === 'in' || fx.state === 'shown')) fx.hide(c.t);
      this.active = -1;
      return;
    }
    const u = clamp(p);
    const P = c.portrait;
    const R = P ? 1.7 : 2.4;
    const cx = P ? 0 : c.halfW0 * 0.24;
    const n = this.cards.length;
    const spin = ease.inOutSine(seg(u, 0.04, 0.96)) * TAU * ((n - 1) / n);
    const appear = ease.outCubic(seg(p, -0.06, 0.08)) * (1 - ease.inCubic(seg(p, 0.94, 1.06)));
    let best = -1, bestZ = -1e9;
    this.cards.forEach((cd, i) => {
      const a = (i / n) * TAU - spin;
      const x = Math.sin(a) * R, z = Math.cos(a) * R;
      const sc = (P ? 0.78 : 1.25) * appear;
      cd.g.position.set(cx + x, (P ? 0.35 : 0.05) + Math.sin(c.t * 0.0007 + i) * 0.04, z);
      cd.g.rotation.set(0, a, 0);
      cd.g.scale.setScalar(Math.max(0.0001, sc));
      if (z > bestZ) { bestZ = z; best = i; }
    });
    if (best !== this.active && p > 0.02 && p < 0.98) {
      this.active = best;
      const fx = this.nameEl && this.nameEl.__fx;
      if (fx) {
        fx.replace(`${String(best + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')} — ${this.cards[best].name}`);
        if (fx.state === 'hidden' || fx.state === 'out') fx.show(c.t, true);
      }
    }
    if (p <= 0.02 || p >= 0.98) {
      const fx = this.nameEl && this.nameEl.__fx;
      if (fx && (fx.state === 'in' || fx.state === 'shown')) { fx.hide(c.t); this.active = -1; }
    }
  },
};
