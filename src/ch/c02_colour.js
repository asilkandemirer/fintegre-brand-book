// 02 — Colour. Two primaries are born, each divides into a lighter tone, a fifth
// tone appears where the two families meet, and finally the spheres melt into the
// background as a living gradient field.
import { Group, Mesh, SphereGeometry, MeshPhysicalMaterial, Color, Vector2, Vector3 } from 'three';
import { C } from '../world.js';
import { HALF_H0, crossedFwd } from './common.js';
import { clamp, ease, seg, lerp, smooth, TAU } from '../util.js';

// chain order (left → right): neighbours define the allowed gradients
const SPH = [
  { key: 'graphite', name: 'Midnight Graphite', hex: '#0F1115', role: 'Ground', note: 146.83,
    mat: { color: '#0F1115', metalness: 0.25, roughness: 0.1, clearcoat: 1, envMapIntensity: 1.7 } },
  { key: 'titanium', name: 'Soft Titanium', hex: '#A7B0BE', role: 'Structure', note: 329.63,
    mat: { color: '#A7B0BE', metalness: 1, roughness: 0.3, clearcoat: 0.3, envMapIntensity: 1.2 } },
  { key: 'smoke', name: 'White Smoke', hex: '#F5F7FA', role: 'Air', note: 440,
    mat: { color: '#F5F7FA', metalness: 0, roughness: 0.32, clearcoat: 0.8, envMapIntensity: 1.0 } },
  { key: 'ice', name: 'Ice Blue', hex: '#B7D7FF', role: 'Clarity', note: 369.99,
    mat: { color: '#B7D7FF', metalness: 0, roughness: 0.12, clearcoat: 1, envMapIntensity: 1.1, emissive: '#3a57ff', emissiveIntensity: 0.04 } },
  { key: 'indigo', name: 'Deep Indigo', hex: '#3047EC', role: 'Signal', note: 220,
    mat: { color: '#3047EC', metalness: 0.1, roughness: 0.14, clearcoat: 1, envMapIntensity: 1.0, emissive: '#3047EC', emissiveIntensity: 0.28 } },
];
const IDX = Object.fromEntries(SPH.map((s, i) => [s.key, i]));

// timeline (chapter-local progress)
const BIRTH = { graphite: [0.03, 0.13], indigo: [0.08, 0.18], ice: [0.3, 0.4], titanium: [0.34, 0.44], smoke: [0.4, 0.5] };
const PARENT = { ice: 'indigo', titanium: 'graphite', smoke: null };

export default {
  id: 'colour', title: 'Colour', cat: 'Identity', len: 3.2,

  build(c) {
    const g = (this.group = new Group());
    g.visible = false;
    const geo = new SphereGeometry(1, 64, 40);
    this.sph = SPH.map((s, i) => {
      const m = new MeshPhysicalMaterial({ ...s.mat, color: new Color(s.mat.color), emissive: new Color(s.mat.emissive || '#000000') });
      const mesh = new Mesh(geo, m);
      mesh.scale.setScalar(0.0001);
      g.add(mesh);
      return { ...s, mesh, pos: new Vector3(), r: 0, uv: new Vector2() };
    });
    c.w.scene.add(g);
    // labels to the side of each sphere
    this.lbls = this.sph.map((s) => {
      const lbl = c.labels.add(`${s.name}<br><em>${s.hex} · ${s.role}</em>`, () => s.labelPos || s.pos, { cls: 'lbl-sphere' });
      return lbl;
    });
    this.ramps = document.getElementById('ramps');
    this.prevU = 0;
  },

  layout(c) {
    const P = c.portrait;
    if (P) {
      const ys = [1.75, 1.15, 0.55, -0.05, -0.65];
      return {
        a: { graphite: [-0.5, 1.25, 0], indigo: [0.5, 0.4, 0] },
        r0: 0.44,
        chain: SPH.map((s, i) => [i % 2 ? 0.42 : -0.42, ys[i], 0]),
        r1: 0.27,
        side: SPH.map((s, i) => (i % 2 ? -1 : 1)),
      };
    }
    const hw = Math.min(c.halfW0, 4.4);
    const sx = hw * 0.36;
    return {
      a: { graphite: [-1.05, 0.38, 0], indigo: [1.05, 0.38, 0] },
      r0: 0.78,
      chain: SPH.map((s, i) => { const x = (i - 2) * sx; return [x, 0.5 - 0.05 * x * x, 0]; }),
      r1: Math.min(0.46, sx * 0.33),
      side: SPH.map(() => 0),
    };
  },

  update(u, c) {
    const { w } = c;
    w.logoTo({ vis: 0, scale: 0.4, float: 1, mat: 'chrome', pos: [0, 0, -1] });
    w.camTo({ pos: [0, 0, 9], look: [0, 0, 0], fov: 30 });
    const fieldOn = smooth(seg(u, 0.66, 0.78));
    const fieldOff = smooth(seg(u, 0.95, 1.0));
    w.bgTo({
      base: tmpBase.copy(C.graphite).lerp(C.titanium, 0.035), ca: C.indigo, cb: C.ice,
      pa: [0.8, 0.85], pb: [0.15, 0.1], ia: 0.12, ib: 0.04, slant: 0,
      field: lerp(0.38, 1, fieldOn) * (1 - fieldOff * 0.6),
    });
    w.postTo({ bloom: 0.5, vig: 0.62, envRot: u * 3, envInt: 1.05 });
    w.lightsTo({ sweep: 16, signal: 0 });

    // sound + haptics on births
    for (const s of this.sph) {
      const b = BIRTH[s.key];
      if (crossedFwd(this.prevU, u, b[0] + 0.02)) c.sound.pop(s.note, 0);
    }
    this.prevU = u;
  },

  tick(p, c) {
    const near = p > -0.08 && p < 1.08;
    this.group.visible = near;
    const show = near && p > 0 && p < 1;
    if (!near) { for (const l of this.lbls) c.labels.show(l, false); this.ramps?.classList.remove('on'); return; }
    const u = clamp(p);
    const L = this.layout(c);
    const t = c.t * 0.001;
    const toB = ease.inOutCubic(seg(u, 0.3, 0.5));
    const stageC = ease.inOutCubic(seg(u, 0.66, 0.82));
    const out = ease.inCubic(seg(u, 0.9, 1.0));

    for (const s of this.sph) {
      const i = IDX[s.key];
      const chain = L.chain[i];
      const bw = BIRTH[s.key];
      const born = seg(u, bw[0], bw[1]);
      let pos = new Vector3(...chain);
      let r = L.r1;
      if (s.key === 'graphite' || s.key === 'indigo') {
        const a = new Vector3(...L.a[s.key]);
        pos = a.lerp(new Vector3(...chain), toB);
        r = lerp(L.r0, L.r1, toB) * ease.outElastic(born);
      } else {
        const par = PARENT[s.key];
        let from;
        if (par) {
          const pa = this.sph[IDX[par]];
          from = pa.pos.clone();
        } else {
          from = new Vector3(...L.chain[IDX.titanium]).lerp(new Vector3(...L.chain[IDX.ice]), 0.5);
        }
        const e = ease.outBack(born, 1.4);
        pos = from.lerp(new Vector3(...chain), born > 0 ? e : 0);
        r = L.r1 * (born > 0 ? ease.outCubic(born) : 0);
        // parent squash while dividing
        if (par && born > 0 && born < 1) this.sph[IDX[par]].squash = Math.sin(born * Math.PI);
      }
      // zero-g drift; in stage C the spheres orbit freely over the field
      const ph = i * 1.7;
      pos.x += Math.sin(t * 0.6 + ph) * 0.05;
      pos.y += Math.cos(t * 0.5 + ph) * 0.06;
      if (stageC > 0) {
        // stage C: the five tones circle slowly in a calm ring that stays clear of the text
        const a = (i / 5) * Math.PI * 2 + t * 0.18;
        const ring = c.portrait
          ? new Vector3(Math.cos(a) * 0.62, -0.3 + Math.sin(a) * 0.5, Math.sin(a) * 0.3)
          : new Vector3(-c.halfW0 * 0.12 + Math.cos(a) * 1.5, 0.45 + Math.sin(a) * 0.75, Math.sin(a) * 0.4);
        pos.lerp(ring, stageC);
      }
      r *= lerp(1, 0.55, stageC) * (1 - out);
      s.pos.copy(pos);
      s.r = r;
      const sq = s.squash || 0;
      s.mesh.position.copy(pos);
      s.mesh.scale.set(r * (1 + sq * 0.16), r * (1 - sq * 0.1), r);
      s.mesh.rotation.y = t * 0.2 + i;
      s.squash = 0;
      // label placement
      const side = c.portrait ? (pos.x > 0 ? -1 : 1) : L.side[i];
      s.labelPos = s.labelPos || new Vector3();
      if (side === 0) s.labelPos.set(pos.x, pos.y - r - 0.16, pos.z);
      else s.labelPos.set(pos.x + side * (r + 0.12), pos.y + r * 0.35, pos.z);
      const lbl = this.lbls[i];
      lbl.el.classList.toggle('lbl-l', side < 0);
      lbl.el.classList.toggle('lbl-below', side === 0);
      // labels only while the tones sit still: the primaries in stage A, all five once the splits have settled
      const still = (u > 0.12 && u < 0.29) || (u > 0.52 && u < 0.65);
      c.labels.show(lbl, show && born > 0.95 && still);
    }

    // feed the background field with the spheres' screen positions
    const bu = c.w.bgU;
    for (const s of this.sph) {
      const i = IDX[s.key];
      c.w.projectUV(s.pos, bu.uFP.value[i]);
      bu.uFC.value[i].set(s.hex);
      const rr = (s.r / (2 * HALF_H0)) * lerp(2.4, 6.5, stageC) + 0.0001;
      bu.uFR.value[i] = lerp(bu.uFR.value[i], rr, 0.2);
      bu.uFW.value[i] = s.r > 0.001 ? 1 : 0;
    }
    if (this.ramps) this.ramps.classList.toggle('on', show && u > 0.76 && u < 0.97);
  },
};
const tmpBase = new Color();
