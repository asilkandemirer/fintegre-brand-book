// 07 — Ecosystem. We start on a phone's trade-in screen, then pull back to see the
// whole network: where devices come from, the orchestration layer, and the buyers.
// Slanted packets travel the links; scrolling fast-forwards their traffic.
import { Group, Mesh, TubeGeometry, CatmullRomCurve3, MeshBasicMaterial, MeshPhysicalMaterial, Vector3, Color, AdditiveBlending } from 'three';
import { C } from '../world.js';
import { makePhone } from '../props.js';
import { buildBlockGeometries } from '../logo.js';
import { clamp, seg, ease, lerp } from '../util.js';

const SRC = [
  { id: 'store', label: 'Store' },
  { id: 'consumer', label: 'Consumer' },
  { id: 'online', label: 'Online' },
];
const BUY = [
  { id: 'buyers', label: 'Buyers' },
  { id: 'refurb', label: 'Refurbishers' },
  { id: 'recom', label: 'Recommerce<br>partners' },
];
const CAPS = ['Diagnostics', 'Value intelligence', 'Program logic', 'Vendor routing', 'Operations'];

export default {
  id: 'ecosystem', title: 'Ecosystem', cat: 'Strategy', len: 3.0,

  build(c) {
    const g = (this.group = new Group());
    g.visible = false;
    c.w.scene.add(g);
    this.phone = makePhone(c.w.renderer);
    g.add(this.phone);
    const nodeGeo = buildBlockGeometries({ depth: 0.12 })[0].geometry;
    const nodeMat = new MeshPhysicalMaterial({ color: new Color('#A7B0BE'), metalness: 1, roughness: 0.25, clearcoat: 0.5 });
    const capMat = new MeshPhysicalMaterial({ color: new Color('#3047EC'), metalness: 0.3, roughness: 0.2, emissive: new Color('#3047EC'), emissiveIntensity: 0.6 });
    this.nodes = {};
    const mk = (id, mat, s) => { const m = new Mesh(nodeGeo, mat); m.scale.setScalar(s); g.add(m); this.nodes[id] = m; return m; };
    for (const s of SRC) if (s.id !== 'consumer') mk(s.id, nodeMat, 0.32);
    for (const b of BUY) mk(b.id, nodeMat, 0.32);
    this.caps = CAPS.map((n, i) => mk('cap' + i, capMat, 0.12));
    // links + packets
    this.linkMat = new MeshBasicMaterial({ color: new Color('#B7D7FF'), transparent: true, opacity: 0.0, depthWrite: false });
    this.pktMat = new MeshBasicMaterial({ color: new Color('#B7D7FF').multiplyScalar(2.2), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
    this.links = [];
    for (let i = 0; i < 6; i++) {
      const pk = [];
      for (let k = 0; k < 3; k++) { const m = new Mesh(nodeGeo, this.pktMat); m.scale.setScalar(0.07); g.add(m); pk.push(m); }
      this.links.push({ tube: null, curve: null, pk, phase: Math.random() });
    }
    // labels
    const V = (o) => () => o.getWorldPosition(new Vector3());
    this.lbls = [];
    const below = (o, d) => () => o.localToWorld(new Vector3(0, d, 0));
    for (const s of SRC) {
      const pos = s.id === 'consumer' ? below(this.phone, -0.95) : V(this.nodes[s.id]);
      this.lbls.push({ l: c.labels.add(s.label, pos, { cls: 'lbl-node', dy: s.id === 'consumer' ? 6 : 30 }), from: 0.36, caps: false });
    }
    for (const b of BUY) this.lbls.push({ l: c.labels.add(b.label, V(this.nodes[b.id]), { cls: 'lbl-node', dy: 30 }), from: 0.42, caps: false });
    this.caps.forEach((m, i) => this.lbls.push({ l: c.labels.add(CAPS[i], V(m), { cls: 'lbl-cap', dx: 12, dy: -6 }), from: 0.5 + i * 0.025, caps: true }));
    this.speed = 0;
    this.layoutKey = '';
  },

  layout(c) {
    const P = c.portrait;
    const key = P ? 'p' : 'l' + c.halfW0.toFixed(2);
    if (key === this.layoutKey) return this.L;
    this.layoutKey = key;
    let L;
    if (P) {
      L = {
        center: new Vector3(0, 0.95, 0),
        src: { store: [-0.85, 2.1, 0], consumer: [0, 2.1, 0.2], online: [0.85, 2.1, 0] },
        buy: { buyers: [-0.85, -0.1, 0], refurb: [0, -0.1, 0], recom: [0.85, -0.1, 0] },
        core: [0, 0.95, 0], ring: 0.55, phoneScale: 0.4, dist: 10.5,
      };
    } else {
      const x = Math.min(2.0, c.halfW0 * 0.45);
      const cx = c.halfW0 * 0.28;
      const y0 = 0.15;
      L = {
        center: new Vector3(0, y0, 0),
        src: { store: [cx - x, 1.3 + y0, 0], consumer: [cx - x, y0, 0.2], online: [cx - x, -1.3 + y0, 0] },
        buy: { buyers: [cx + x, 1.1 + y0, 0], refurb: [cx + x, y0, 0], recom: [cx + x, -1.1 + y0, 0] },
        core: [cx, y0, 0], ring: 0.85, phoneScale: 0.6, dist: 10.5,
      };
    }
    // position nodes
    for (const s of SRC) if (s.id !== 'consumer') this.nodes[s.id].position.set(...L.src[s.id]);
    for (const b of BUY) this.nodes[b.id].position.set(...L.buy[b.id]);
    this.phone.position.set(...L.src.consumer);
    this.phone.scale.setScalar(L.phoneScale);
    const core = new Vector3(...L.core);
    this.caps.forEach((m, i) => {
      const a = ((90 - i * 72) * Math.PI) / 180;
      m.position.set(core.x + Math.cos(a) * L.ring, core.y + Math.sin(a) * L.ring * 0.8, 0.1);
    });
    // curves
    const ends = [
      ...SRC.map((s) => [new Vector3(...L.src[s.id]), core]),
      ...BUY.map((b) => [core, new Vector3(...L.buy[b.id])]),
    ];
    ends.forEach(([a, b], i) => {
      const mid = a.clone().lerp(b, 0.5);
      mid.z += 0.5;
      if (P) mid.x += (a.x + b.x) * 0.15; else mid.y += (a.y + b.y - 2 * L.center.y) * 0.12;
      const curve = new CatmullRomCurve3([a.clone(), mid, b.clone()]);
      const link = this.links[i];
      if (link.tube) { this.group.remove(link.tube); link.tube.geometry.dispose(); }
      link.curve = curve;
      link.tube = new Mesh(new TubeGeometry(curve, 48, 0.006, 5, false), this.linkMat);
      this.group.add(link.tube);
    });
    this.L = L;
    return L;
  },

  update(u, c) {
    const { w } = c;
    const L = this.layout(c);
    const P = c.portrait;
    const ph = new Vector3(...L.src.consumer);
    const pull = ease.inOutCubic(seg(u, 0.16, 0.56));
    const orbit = ease.inOutSine(seg(u, 0.56, 1)) ;
    const closePos = ph.clone().add(new Vector3(0.12, 0.02, P ? 1.55 : 1.9));
    const farPos = L.center.clone().add(new Vector3(0, -0.2, L.dist));
    const pos = closePos.clone().lerp(farPos, pull);
    const yaw = (orbit - 0.5) * 0.5 * pull;
    const r = pos.clone().sub(L.center);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    pos.set(L.center.x + r.x * cy + r.z * sy, pos.y + Math.sin(orbit * Math.PI) * 0.8, L.center.z - r.x * sy + r.z * cy);
    const look = ph.clone().lerp(L.center, pull);
    w.camTo({ pos: pos.toArray(), look: look.toArray(), fov: 30, lambda: 5 });
    w.logoTo({ pos: L.core, rot: [0.15, c.t * 0.0004, 0], scale: P ? 0.36 : 0.5, float: 0.3, vis: pull > 0.2 ? 1 : 0, mat: 'signal' });
    w.blocksHome();
    w.bgTo({ base: C.graphite, ca: C.indigo, cb: C.ice, pa: [0.5, 0.55], pb: [0.1, 0.1], ia: 0.1 + pull * 0.15, ib: 0.04, slant: 0, field: 0 });
    w.postTo({ bloom: 0.7, vig: 0.7, envRot: 1 + u, envInt: 1.0 });
    w.lightsTo({ sweep: 16, signal: 10 });
  },

  tick(p, c) {
    const near = p > -0.06 && p < 1.06;
    this.group.visible = near;
    if (!near) { for (const x of this.lbls) c.labels.show(x.l, false); return; }
    this.layout(c);
    const u = clamp(p);
    const pull = ease.inOutCubic(seg(u, 0.16, 0.56));
    const vis = seg(p, -0.06, 0.02) * (1 - seg(p, 0.98, 1.06));
    this.linkMat.opacity = 0.32 * pull * vis;
    this.pktMat.opacity = pull * vis;
    for (const m of Object.values(this.nodes)) m.visible = pull > 0.05;
    // phone faces the camera at first, then settles
    const t = c.t * 0.001;
    this.phone.rotation.set(Math.sin(t * 0.5) * 0.04, lerp(0, 0.45, pull) + Math.sin(t * 0.4) * 0.05, 0);
    this.phone.visible = vis > 0.01;
    // traffic speed: base drift plus scroll speed (scroll fast-forwards time)
    this.speed = lerp(this.speed, 0.1 + Math.min(2.5, Math.abs(c.vel) * 3), 0.1);
    for (const link of this.links) {
      if (!link.curve) continue;
      link.phase += c.dt * this.speed;
      link.pk.forEach((m, k) => {
        const s = (link.phase + k / 3) % 1;
        link.curve.getPointAt(s, m.position);
        m.visible = pull > 0.3;
        m.rotation.set(0, 0, 0);
      });
    }
    for (const n of Object.values(this.nodes)) n.rotation.y = Math.sin(t * 0.4 + n.position.x) * 0.3;
    for (const x of this.lbls) c.labels.show(x.l, u >= x.from && u < 0.98 && p < 1 && (!x.caps || !c.portrait));
  },
};
