// 08 — In motion. The fast chapter: hard cuts, zoom punches, colour flips.
// Cubes flip in a wave, the mark slams together, the app icon spins and we cut
// into it, the partner plaque turns, colours flip on the beat, a phone turns in
// slow motion, the process words race past.
import { Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, MeshStandardMaterial, Color, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { C } from '../world.js';
import { makePhone } from '../props.js';
import { buildBlockGeometries } from '../logo.js';
import { tex, logoTile, plaque } from '../textures.js';
import { roundedRect, fitLogo } from './common.js';
import { clamp, seg, ease, TAU, lerp } from '../util.js';

const SHOTS = [
  { id: 'cubes', a: 0.0, b: 0.13 },
  { id: 'formed', a: 0.13, b: 0.26 },
  { id: 'icon', a: 0.26, b: 0.4 },
  { id: 'plaque', a: 0.4, b: 0.52 },
  { id: 'flips', a: 0.52, b: 0.66 },
  { id: 'number', a: 0.66, b: 0.8 },
  { id: 'rows', a: 0.8, b: 0.92 },
  { id: 'settle', a: 0.92, b: 1.0 },
];
const BEATS = [
  { word: 'Know', base: '#0F1115', mat: 'signal', light: false },
  { word: 'Design', base: '#3047EC', mat: 'smoke', light: false },
  { word: 'Connect', base: '#F5F7FA', mat: 'indigo', light: true },
  { word: 'Route', base: '#B7D7FF', mat: 'graphite', light: true },
  { word: 'Scale', base: '#0F1115', mat: 'chrome', light: false },
];
BEATS.forEach((b) => (b.c = new Color(b.base)));

export default {
  id: 'montage', title: 'In motion', cat: 'Identity', len: 3.6,
  // which moments sit on a light background (the text layer flips to dark ink)
  isLight(u) {
    const si = SHOTS.findIndex((s) => u >= s.a && u < s.b);
    const shot = SHOTS[si < 0 ? SHOTS.length - 1 : si];
    if (shot.id === 'icon') return true;
    if (shot.id === 'flips') {
      const lu = seg(u, shot.a, shot.b);
      return BEATS[Math.min(BEATS.length - 1, Math.floor(lu * BEATS.length))].light;
    }
    return false;
  },

  build(c) {
    const r = c.w.renderer;
    const root = (this.root = new Group());
    c.w.scene.add(root);
    this.g = {};
    for (const s of SHOTS) { const g = new Group(); g.visible = false; root.add(g); this.g[s.id] = g; }

    // cubes
    const tDark = tex(logoTile(256, '#0F1115'), r);
    const tIce = tex(logoTile(256, '#B7D7FF', '#0F1115'), r);
    const mats = [
      new MeshPhysicalMaterial({ color: new Color('#3047EC'), metalness: 0.3, roughness: 0.25, clearcoat: 1 }),
      new MeshPhysicalMaterial({ color: new Color('#3047EC'), metalness: 0.3, roughness: 0.25, clearcoat: 1 }),
      new MeshPhysicalMaterial({ color: new Color('#A7B0BE'), metalness: 1, roughness: 0.3 }),
      new MeshPhysicalMaterial({ color: new Color('#A7B0BE'), metalness: 1, roughness: 0.3 }),
      new MeshStandardMaterial({ map: tDark, roughness: 0.35, metalness: 0.1 }),
      new MeshStandardMaterial({ map: tIce, roughness: 0.35, metalness: 0.0 }),
    ];
    const cubeGeo = new RoundedBoxGeometry(0.62, 0.62, 0.62, 4, 0.06);
    this.cubes = [];
    for (let i = 0; i < 15; i++) {
      const m = new Mesh(cubeGeo, mats);
      this.g.cubes.add(m);
      this.cubes.push({ m, done: 0 });
    }

    // app icon: indigo tile with the mark in white relief
    const icon = (this.icon = new Group());
    const tile = new Mesh(
      new RoundedBoxGeometry(1.5, 1.5, 0.3, 6, 0.3),
      new MeshPhysicalMaterial({ color: new Color('#3047EC'), metalness: 0.25, roughness: 0.22, clearcoat: 1, emissive: new Color('#3047EC'), emissiveIntensity: 0.25 })
    );
    icon.add(tile);
    const white = new MeshPhysicalMaterial({ color: new Color('#F5F7FA'), metalness: 0.0, roughness: 0.3, clearcoat: 1, emissive: new Color('#F5F7FA'), emissiveIntensity: 0.32 });
    const mini = new Group();
    for (const { geometry, centroid } of buildBlockGeometries({ depth: 0.08 })) {
      const m = new Mesh(geometry, white);
      m.position.set(centroid[0], centroid[1], 0);
      mini.add(m);
    }
    mini.scale.setScalar(0.62);
    mini.position.z = 0.17;
    icon.add(mini);
    this.g.icon.add(icon);

    // partner plaque
    const pl = (this.plaque = new Group());
    pl.add(new Mesh(new RoundedBoxGeometry(2.24, 1.28, 0.08, 4, 0.05), new MeshPhysicalMaterial({ color: new Color('#A7B0BE'), metalness: 1, roughness: 0.22, clearcoat: 0.6 })));
    const face = new Mesh(roundedRect(2.1, 1.176, 0.05), new MeshBasicMaterial({ map: tex(plaque(), r), color: new Color(0.8, 0.8, 0.8) }));
    face.position.z = 0.042;
    pl.add(face);
    this.g.plaque.add(pl);

    // slow-motion phone
    this.phone = makePhone(r);
    this.g.number.add(this.phone);

    this.word = document.getElementById('mont-word');
    this.rows = [...document.querySelectorAll('#ch-montage .mq-track')];
    this.rowWrap = document.getElementById('mont-rows');
    this.shot = -1;
    this.beat = -1;
    this.prevU = 0;
  },

  update(u, c) {
    const { w } = c;
    const P = c.portrait;
    const si = SHOTS.findIndex((s) => u >= s.a && u < s.b);
    const shot = SHOTS[si < 0 ? SHOTS.length - 1 : si];
    const lu = seg(u, shot.a, shot.b);
    const idx = SHOTS.indexOf(shot);
    const changed = idx !== this.shot;
    const t = c.t * 0.001;
    const s = P ? fitLogo(c, 0.7, 0.3) : fitLogo(c, 0.38, 0.5);

    // defaults for every shot
    w.blocksHome();
    w.postTo({ bloom: 0.55, vig: 0.68, envRot: u * 6, envInt: 1.05, flash: 0 });
    w.lightsTo({ sweep: 24, signal: 10 });
    let logo = { vis: 0 };
    let cam = { pos: [0, 0, 9], look: [0, 0, 0], fov: 30, roll: 0 };
    let bg = { base: C.graphite, ca: C.indigo, cb: C.ice, pa: [0.5, 0.6], pb: [0.2, 0.2], ia: 0.2, ib: 0.05, slant: 0, field: 0 };
    let blocksSnap = false;

    switch (shot.id) {
      case 'cubes':
        cam = { pos: [0, 0, 9.4 - lu * 1.8], look: [0, 0, 0], fov: 30, roll: (lu - 0.5) * 0.08 };
        bg = { ...bg, base: tmp.copy(C.indigo).multiplyScalar(0.22), ia: 0.55, ca: C.indigo, pa: [0.5, 0.5] };
        break;
      case 'formed': {
        cam = { pos: [0, 0, 7.6], look: [0, 0, 0], fov: 30, roll: 0 };
        logo = { pos: [0, P ? 0.5 : 0, 0], rot: [0.1, -0.25 + lu * 0.5, 0], scale: s, float: 0.2, vis: 1, mat: 'chrome' };
        const land = ease.outExpo(seg(lu, 0.38, 0.5));
        const from = [[2.4, 3.1, -9], [-3.2, 0.8, -11], [-1.5, -3.4, -8], [3.3, -2.2, -12]];
        for (let i = 0; i < 4; i++) w.blockTo(i, from[i].map((v) => v * (1 - land)), [(1 - land) * 2.5, (1 - land) * (i % 2 ? 3 : -3), 0]);
        blocksSnap = changed;
        if (this.prevU < shot.a + 0.5 * (shot.b - shot.a) && u >= shot.a + 0.5 * (shot.b - shot.a) - 0.0001) {
          w.punch(1.1, C.ice); c.sound.thump(1);
        }
        bg = { ...bg, ia: 0.2 + land * 0.25 };
        break;
      }
      case 'icon': {
        const zoom = lu > 0.62;
        cam = zoom
          ? { pos: [0.25, 0.1, P ? 4.6 : 3.4], look: [0.1, P ? 0.6 : 0, 0], fov: 30, roll: -0.06 }
          : { pos: [0, 0, 8.5], look: [0, P ? 0.5 : 0, 0], fov: 30, roll: 0 };
        if (crossedAt(this.prevU, u, shot.a + 0.62 * (shot.b - shot.a))) { w.punch(1.2, C.ice); c.sound.thump(0.8); this.pendingCut = true; }
        bg = { ...bg, base: tmp.set('#C9DEFF'), ca: C.white, cb: C.indigo, ia: 0.2, ib: 0.1, pa: [0.3, 0.8] };
        w.postTo({ bloom: 0.2, vig: 0.25 });
        break;
      }
      case 'plaque':
        cam = { pos: [0, 0.3, 8], look: [0, P ? 0.5 : 0, 0], fov: 30, roll: 0 };
        bg = { ...bg, base: C.graphite, ca: C.titanium, ia: 0.14, pa: [0.5, 0.75] };
        w.postTo({ bloom: 0.2 });
        w.lightsTo({ sweep: 8, signal: 4 });
        break;
      case 'flips': {
        const bi = Math.min(BEATS.length - 1, Math.floor(lu * BEATS.length));
        const B = BEATS[bi];
        logo = { pos: [P ? 0 : c.halfW0 * 0.42, P ? 1.15 : 0, 0], rot: [0.2, lu * TAU * 1.5, 0], scale: s * 0.85, float: 0.4, vis: 1, mat: B.mat };
        bg = { ...bg, base: B.c, ia: B.light ? 0.06 : 0.25, ca: B.light ? C.white : C.indigo };
        w.postTo({ bloom: B.light ? 0.15 : 0.55, vig: B.light ? 0.2 : 0.6 });
        if (bi !== this.beat) {
          this.beat = bi;
          const fx = this.word && this.word.__fx;
          if (fx) {
            this.word.classList.toggle('on-light', B.light);
            fx.replace(B.word);
            if (fx.state === 'hidden' || fx.state === 'out') fx.show(c.t, true);
          }
          if (!changed) { w.punch(0.6, B.light ? C.indigo : C.ice); c.sound.thump(0.45); this.pendingCut = true; }
        }
        break;
      }
      case 'number':
        cam = { pos: [0, 0, 6.2 - lu * 0.6], look: [0, P ? 0.55 : 0, 0], fov: 30, roll: 0 };
        bg = { ...bg, ia: 0.35, pa: [0.5, 0.55] };
        w.postTo({ bloom: 0.65 });
        break;
      case 'rows': {
        logo = { pos: [0, P ? 0.4 : 0, 0], rot: [0.3, lu * 2, 0], scale: s * 1.1, float: 0.6, vis: 1, mat: 'signal' };
        for (let i = 0; i < 4; i++) {
          const k = lerp(6.5, -6.5, ease.inOutSine(clamp(lu * 1.25 - i * 0.07)));
          w.blockTo(i, [k * (0.8 + i * 0.12), (i - 1.5) * 0.12, (i - 1.5) * 0.9], [k * 0.15, k * 0.25, 0]);
        }
        blocksSnap = changed;
        bg = { ...bg, ia: 0.25, slant: 0.4 };
        break;
      }
      case 'settle':
        logo = { pos: [0, P ? 0.5 : 0, 0], rot: [0.12, -0.7 + ease.outCubic(lu) * 0.7, 0], scale: s, float: 1, vis: 1, mat: 'chrome' };
        bg = { ...bg, ia: 0.22 };
        break;
    }
    w.camTo({ ...cam, lambda: 7 });
    w.logoTo(logo.vis ? logo : { vis: 0 });
    w.bgTo(bg);

    if (changed) {
      if (this.shot !== -1) {
        w.punch(0.9, shot.id === 'icon' ? C.indigo : C.ice);
        c.sound.whoosh(0.35, 1);
        c.sound.thump(0.5);
      }
      this.pendingCut = true;
      if (shot.id !== 'flips') this.beat = -1;
      this.shot = idx;
    }
    if (this.pendingCut) {
      w.cut({ blocks: blocksSnap, logo: true });
      this.pendingCut = false;
    }
    this.prevU = u;
  },

  tick(p, c) {
    const near = p > -0.02 && p < 1.02;
    this.root.visible = near;
    const u = clamp(p);
    const si = near ? SHOTS.findIndex((s) => u >= s.a && u < s.b) : -1;
    const cur = si < 0 ? (near && p >= 1 ? 'settle' : null) : SHOTS[si].id;
    for (const s of SHOTS) this.g[s.id].visible = s.id === cur;
    if (this.word) {
      this.word.classList.toggle('show', cur === 'flips');
      const fx = this.word.__fx;
      if (fx && cur !== 'flips' && (fx.state === 'in' || fx.state === 'shown')) fx.hide(c.t);
    }
    if (this.rowWrap) this.rowWrap.classList.toggle('show', cur === 'rows');
    if (!near) { this.shot = -1; return; }
    const t = c.t * 0.001;
    const P = c.portrait;
    const shot = SHOTS[Math.max(0, si)];
    const lu = seg(u, shot.a, shot.b);

    if (cur === 'cubes') {
      const cols = P ? 3 : 5, rows = P ? 5 : 3;
      const sp = P ? 0.62 : 0.95;
      this.cubes.forEach((cb, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        cb.m.position.set((col - (cols - 1) / 2) * sp, ((rows - 1) / 2 - row) * sp + (P ? 0.75 : 0), 0);
        const a = lu * 7 - (col + row) * 0.45;
        const k = Math.floor(a);
        const f = a - k;
        const ang = a > 0 ? (k + ease.inOutCubic(clamp(f * 1.7))) * (Math.PI / 2) : 0;
        if (a > 0 && k !== cb.done) { cb.done = k; c.sound.key('label', (col / (cols - 1)) * 2 - 1); }
        cb.m.rotation.set(ang, Math.sin(t + i) * 0.05, 0);
        cb.m.scale.setScalar(P ? 0.66 : 1);
      });
    }
    if (cur === 'icon') {
      this.icon.position.set(0, P ? 0.6 : 0, 0);
      this.icon.rotation.set(0.15 + Math.sin(t * 0.8) * 0.05, ease.inOutCubic(clamp(lu / 0.62)) * TAU + (lu > 0.62 ? -0.35 : 0), 0);
      this.icon.scale.setScalar(P ? 0.9 : 1.15);
    }
    if (cur === 'plaque') {
      this.plaque.position.set(0, P ? 0.55 : 0, 0);
      this.plaque.rotation.set(0.12, (ease.inOutSine(lu) - 0.5) * TAU * 0.92, 0.02);
      this.plaque.scale.setScalar(P ? 0.62 : 1.15);
    }
    if (cur === 'number') {
      this.phone.position.set(0, P ? 0.55 : 0, 0);
      // slow motion: half a turn across the whole shot
      this.phone.rotation.set(0.1, -0.9 + ease.inOutSine(lu) * Math.PI * 1.1, -0.05);
      this.phone.scale.setScalar(P ? 1.0 : 1.35);
    }
    if (cur === 'rows') {
      const off = (((c.T * 30) % 50) + 50) % 50;
      this.rows.forEach((el, i) => { el.style.transform = `translate3d(${(i % 2 ? -50 + off : -off).toFixed(3)}%,0,0)`; });
    }
  },
};
const tmp = new Color();
const crossedAt = (prev, u, x) => (prev < x && u >= x) || (prev >= x && u < x);
