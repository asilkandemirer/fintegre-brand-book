// One Three.js stage for the two 3D moments:
//  · the mark: four blocks lock together along 65°, then a sweeping line turns its surface
//    into digits that keep turning in 3D and finally scatter;
//  · the devices: laptop and phones carrying the brand, in real materials (the notebook,
//    pen, mug and stickers live in the brand film, see main.js).
// Scenes only set parameters; this module eases, renders and reports the digit cloud.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial,
  PMREMGenerator, DirectionalLight, NeutralToneMapping, SRGBColorSpace, Plane, Vector3,
  PlaneGeometry, CylinderGeometry, CanvasTexture, DoubleSide,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { buildBlockGeometries, drawLogo, LOGO_W } from './logo.js';
import { ease, seg, rng } from './util.js';

const DIR = [Math.cos((65 * Math.PI) / 180), Math.sin((65 * Math.PI) / 180)];
const START = [
  { k: 1.3, z: -0.8, r: [0.5, -0.9, 0.2] },
  { k: -1.0, z: 0.7, r: [-0.6, 0.8, -0.1] },
  { k: -1.5, z: -0.4, r: [0.4, 1.1, 0.3] },
  { k: 0.9, z: 0.9, r: [-0.5, -1.2, -0.2] },
];
const DIG = '01123581321345589';
const N_PLANE = new Vector3(0.906, -0.423, 0).normalize();

const tex = (w, h, draw) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};
const grad = (ctx, x0, x1) => {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, '#3047EC'); g.addColorStop(1, '#B7D7FF');
  return g;
};

export class Stage3D {
  constructor(canvas) {
    this.canvas = canvas;
    const r = (this.r = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputColorSpace = SRGBColorSpace;
    r.toneMapping = NeutralToneMapping;
    r.toneMappingExposure = 1.05;
    r.localClippingEnabled = true;
    r.setClearColor(0x000000, 0);
    this.scene = new Scene();
    const pm = new PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    const key = new DirectionalLight(0xffffff, 1.5);
    key.position.set(-3, 5, 6);
    const rim = new DirectionalLight(0xb7d7ff, 1.6);
    rim.position.set(4, -1, -3);
    this.scene.add(key, rim);
    this.cam = new PerspectiveCamera(28, 1, 0.1, 100);
    this.cam.position.set(0, 0, 8);
    this.mobile = window.innerWidth < 760;
    this.buildMark();
    this.objects = null;
    this.L = { vis: 0, asm: 0, ry: 0, rx: 0, x: 0, y: 0, s: 1, sweep: -1, scatter: 0 };
    this.O = null;
    this.resize();
  }

  // ------------------------------------------------------------------ mark
  buildMark() {
    this.plane = new Plane(N_PLANE.clone(), 10);
    this.markMat = new MeshPhysicalMaterial({
      color: 0xf5f7fa, metalness: 0.18, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08,
      envMapIntensity: 1.15, iridescence: 0.35, iridescenceIOR: 1.5, sheen: 0.4, sheenColor: 0xb7d7ff,
      clippingPlanes: [this.plane],
    });
    this.mark = new Group();
    const R = rng(11);
    this.points = [];
    const per = this.mobile ? 420 : 900;
    this.blocks = buildBlockGeometries({ depth: 0.22 }).map(({ geometry, centroid }, bi) => {
      const m = new Mesh(geometry, this.markMat);
      m.userData = { home: centroid, s: START[bi] };
      this.mark.add(m);
      // sample the surface, weighted by triangle area, for the digit version of the mark
      const pos = geometry.attributes.position;
      const idx = geometry.index;
      const tri = [];
      let area = 0;
      const n = idx ? idx.count / 3 : pos.count / 3;
      const v = (i) => new Vector3().fromBufferAttribute(pos, idx ? idx.getX(i) : i);
      for (let t = 0; t < n; t++) {
        const a = v(t * 3), b = v(t * 3 + 1), c = v(t * 3 + 2);
        const ar = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a)).length() / 2;
        area += ar; tri.push([a, b, c, area]);
      }
      const count = Math.round(per * (bi < 2 ? 1.4 : 0.6));
      for (let k = 0; k < count; k++) {
        const q = R() * area;
        let lo = 0, hi = tri.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (tri[mid][3] < q) lo = mid + 1; else hi = mid; }
        const [a, b, c] = tri[lo];
        let u = R(), w = R();
        if (u + w > 1) { u = 1 - u; w = 1 - w; }
        const p = a.clone().add(b.clone().sub(a).multiplyScalar(u)).add(c.clone().sub(a).multiplyScalar(w));
        const dir = new Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize();
        this.points.push({ m, p, dir, sp: 0.6 + R() * 1.6, ch: DIG[(R() * DIG.length) | 0], seed: R() });
      }
      return m;
    });
    this.scene.add(this.mark);
  }

  setMark(p) { Object.assign(this.L, p); }

  // the phone screen is drawn from strings, so it follows the page language
  setLang(tr) { this.tr = tr; if (this.uiTex) this.drawUI(); }
  drawUI() {
    const t = this.tr || ((v) => v);
    const c = this.uiTex.image, x = c.getContext('2d'), w = c.width, h = c.height;
    x.fillStyle = '#F5F7FA'; x.fillRect(0, 0, w, h);
    drawLogo(x, 74, 92, 34, grad(x, 50, 98));
    x.fillStyle = '#0F1115'; x.font = '600 26px Geologica, sans-serif'; x.fillText('Fintegre', 104, 101);
    x.fillStyle = '#3047EC'; x.font = '700 20px "Inter", sans-serif'; x.fillText(t('VALUATION READY'), 44, 220);
    x.fillStyle = '#0F1115'; x.font = '600 50px Geologica, sans-serif'; x.fillText(t('Your phone is'), 44, 290); x.fillText(t('worth more.'), 44, 350);
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(44, 410, w - 88, 300, 28); x.fill();
    x.fillStyle = '#0F1115'; x.font = '700 22px "Inter", sans-serif'; x.fillText(t('TRADE-IN VALUE'), 76, 470);
    x.fillStyle = '#3047EC'; x.font = '600 96px Geologica, sans-serif'; x.fillText('₺14.250', 70, 580);
    x.fillStyle = 'rgba(15,17,21,.55)'; x.font = '700 22px "Inter", sans-serif'; x.fillText(t('Example · 00:58'), 76, 650);
    x.fillStyle = '#3047EC'; x.beginPath(); x.roundRect(44, h - 230, w - 88, 104, 26); x.fill();
    x.fillStyle = '#FFFFFF'; x.font = '600 32px Geologica, sans-serif'; x.fillText(t('Use on a new device'), 92, h - 165);
    this.uiTex.needsUpdate = true;
  }

  // ------------------------------------------------------------------ objects
  buildObjects() {
    const O = (this.objects = new Group());
    const metal = (c, rgh = 0.32) => new MeshPhysicalMaterial({ color: c, metalness: 0.9, roughness: rgh, clearcoat: 0.3, envMapIntensity: 1.2 });
    const basic = (t, transparent = false) => new MeshBasicMaterial({ map: t, transparent, toneMapped: false });
    const shadowTex = tex(256, 256, (x, w) => {
      const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(15,17,21,.32)'); g.addColorStop(1, 'rgba(15,17,21,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, w);
    });
    const shadow = (sx, sz, y) => {
      const m = new Mesh(new PlaneGeometry(sx, sz), new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = y;
      return m;
    };
    const markTex = (fill, bg = null, w = 512, h = 384, scale = 0.62) => tex(w, h, (x) => {
      if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
      const mh = h * scale;
      drawLogo(x, w / 2, h / 2, mh, fill === 'grad' ? grad(x, w / 2 - (mh * LOGO_W) / 2, w / 2 + (mh * LOGO_W) / 2) : fill);
    });

    // laptop: aluminium base, lid on a hinge, stickers outside, wallpaper inside
    const lap = new Group();
    const alu = metal(0xc9ced6);
    const base = new Mesh(new RoundedBoxGeometry(3.0, 0.1, 2.0, 4, 0.04), alu);
    const deck = new Mesh(new PlaneGeometry(2.62, 1.02), new MeshPhysicalMaterial({ color: 0x23262c, roughness: 0.7 }));
    deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0.052, -0.28);
    const pad = new Mesh(new PlaneGeometry(1.05, 0.62), new MeshPhysicalMaterial({ color: 0xb9bec6, metalness: 0.6, roughness: 0.3 }));
    pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.052, 0.55);
    const hinge = new Group();
    hinge.position.set(0, 0.09, -1.0);
    const lid = new Mesh(new RoundedBoxGeometry(3.0, 2.0, 0.07, 4, 0.03), alu);
    lid.position.set(0, 1.0, 0);
    const wall = tex(1024, 680, (x, w, h) => {
      const g = x.createLinearGradient(0, h, w * 0.47, 0);
      g.addColorStop(0, '#3047EC'); g.addColorStop(1, '#B7D7FF');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 2;
      for (let i = -h; i < w; i += 46) { x.beginPath(); x.moveTo(i, h); x.lineTo(i + h * 0.4663, 0); x.stroke(); }
      drawLogo(x, w / 2, h / 2, 120, '#FFFFFF');
    });
    const screen = new Mesh(new PlaneGeometry(2.78, 1.8), basic(wall));
    screen.position.set(0, 1.0, 0.037);
    const stickers = [
      [markTex('grad', null, 512, 384, 0.8), 0.7, 0.52, -0.75, 1.45, -0.2],
      [markTex('#FFFFFF', '#3047EC', 384, 384, 0.5), 0.56, 0.56, 0.55, 1.25, 0.15],
      [markTex('#3047EC', '#B7D7FF', 384, 384, 0.5), 0.46, 0.46, -0.1, 0.6, -0.12],
    ].map(([t, w, h, x, y, rz]) => {
      const s = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, side: DoubleSide }));
      s.position.set(x, y, -0.038); s.rotation.set(0, Math.PI, rz);
      return s;
    });
    hinge.add(lid, screen, ...stickers);
    lap.add(base, deck, pad, hinge, shadow(4.2, 3.0, -0.06));
    lap.userData = { hinge, stickers };
    O.add(lap);

    // phones: mark on the back, a valuation screen on the front
    const ui = (this.uiTex = tex(512, 1060, () => {}));
    this.drawUI();
    const phones = new Group();
    const back = markTex('#FFFFFF', null, 384, 384, 0.6);
    const mkPhone = (col) => {
      const g = new Group();
      const frame = new Mesh(new RoundedBoxGeometry(0.8, 1.64, 0.09, 4, 0.11), metal(col, 0.28));
      const scr = new Mesh(new PlaneGeometry(0.73, 1.52), basic(ui));
      scr.position.z = 0.047;
      const logo = new Mesh(new PlaneGeometry(0.42, 0.42), new MeshBasicMaterial({ map: back, transparent: true, toneMapped: false }));
      logo.position.set(0, -0.05, -0.047); logo.rotation.y = Math.PI;
      const bump = new Mesh(new RoundedBoxGeometry(0.32, 0.32, 0.03, 3, 0.07), metal(col, 0.18));
      bump.position.set(0.18, 0.55, -0.055);
      const lens = (x, y) => {
        const l = new Mesh(new CylinderGeometry(0.055, 0.055, 0.03, 24), new MeshPhysicalMaterial({ color: 0x111318, roughness: 0.1, metalness: 0.4, clearcoat: 1 }));
        l.rotation.x = Math.PI / 2; l.position.set(x, y, -0.072);
        return l;
      };
      g.add(frame, scr, logo, bump, lens(0.11, 0.62), lens(0.25, 0.48), lens(0.11, 0.48));
      return g;
    };
    const p1 = mkPhone(0x9aa3b2), p2 = mkPhone(0xdfe3e8);
    phones.add(p1, p2, shadow(2.6, 1.4, -0.86));
    phones.userData = { p1, p2 };
    O.add(phones);

    this.items = { lap, phones };
    for (const k in this.items) this.items[k].scale.setScalar(0.0001);
    this.scene.add(O);
  }

  setObjects(p) {
    if (!this.objects) this.buildObjects();
    this.O = p;
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    this.w = w; this.h = h;
    this.portrait = w / h < 0.9;
  }

  // returns the digit cloud and the sweep line in screen space (or null)
  frame(now) {
    const L = this.L;
    const markOn = L.vis > 0.001;
    const objOn = this.O && this.O.on;
    this.mark.visible = markOn;
    if (this.objects) this.objects.visible = !!objOn;
    if (!markOn && !objOn) { this.r.clear(); return null; }

    const cam = this.cam;
    let out = null;
    if (markOn) {
      cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0);
      const e = ease.inOutCubic(L.asm);
      for (const m of this.blocks) {
        const { home, s } = m.userData;
        const k = s.k * (1 - e);
        m.position.set(home[0] + DIR[0] * k, home[1] + DIR[1] * k, s.z * (1 - e));
        m.rotation.set(s.r[0] * (1 - e), s.r[1] * (1 - e), s.r[2] * (1 - e));
      }
      const vh = 2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z;
      const vw = vh * cam.aspect;
      const size = this.portrait ? Math.min((vw * 0.7) / LOGO_W, vh * 0.3) : Math.min(vh * 0.46, (vw * 0.36) / LOGO_W);
      this.mark.scale.setScalar(size * L.s * (0.0001 + L.vis));
      this.mark.position.set(L.x * vw, L.y * vh, 0);
      this.mark.rotation.set(L.rx, L.ry, 0);
      this.mark.updateMatrixWorld(true);
      // sweep: plane constant runs from "all solid" to "all digits"
      const R = size * 1.3;
      this.plane.constant = L.sweep < 0 ? 100 : R - L.sweep * 2 * R + this.plane.normal.dot(this.mark.position) * -1;
      if (L.sweep >= 0) {
        const cloud = [];
        const wp = new Vector3();
        const sc = L.scatter;
        const tick = Math.floor(now / 120);
        const base = this.portrait ? 9 : 11;
        for (const pt of this.points) {
          wp.copy(pt.p).applyMatrix4(pt.m.matrixWorld);
          const dist = this.plane.normal.dot(wp) + this.plane.constant;
          if (dist >= 0 && sc <= 0) continue;
          if (sc > 0) wp.addScaledVector(pt.dir, Math.pow(sc, 1.5) * size * 2.2 * pt.sp);
          const z = wp.z;
          wp.project(cam);
          const ch = (pt.seed * 1000 + tick) % 9 < 1 ? DIG[(tick + (pt.seed * 97 | 0)) % DIG.length] : pt.ch;
          if (ch !== pt.ch && Math.random() < 0.3) pt.ch = ch;
          cloud.push({
            x: (wp.x * 0.5 + 0.5) * this.w, y: (-wp.y * 0.5 + 0.5) * this.h,
            s: base * (1 + z * 0.12) * (1 + sc * 0.6), a: Math.max(0, (1 - sc * sc) * (0.55 + 0.45 * pt.seed)) * Math.min(1, L.vis * 1.5), ch: pt.ch,
          });
        }
        // the sweep line passes through the plane's point nearest the mark centre
        const p0 = this.mark.position.clone().addScaledVector(this.plane.normal, -(this.plane.normal.dot(this.mark.position) + this.plane.constant));
        p0.project(cam);
        out = { cloud, line: { x: (p0.x * 0.5 + 0.5) * this.w, y: (-p0.y * 0.5 + 0.5) * this.h } };
      } else out = { cloud: null, line: null };
    }

    if (objOn) {
      const P = this.O;
      cam.position.set(P.cx ?? 0, P.cy ?? 1.3, P.cz ?? 7.5);
      cam.lookAt(0, P.ly ?? 0.1, 0);
      const fit = this.portrait ? 0.62 : 1;
      for (const k in this.items) {
        const it = this.items[k], q = P[k] || { s: 0 };
        it.visible = q.s > 0.001;
        it.scale.setScalar(Math.max(0.0001, q.s * fit * (k === 'lap' ? (this.portrait ? 0.62 : 0.78) : 1)));
        it.rotation.set(q.rx || 0, q.ry || 0, q.rz || 0);
        it.position.set((q.x || 0) * fit, q.y || 0, 0);
      }
      const lap = this.items.lap.userData;
      lap.hinge.rotation.x = Math.PI / 2 - (P.lap?.lid || 0) * (Math.PI / 2 + 0.18);
      lap.stickers.forEach((s, i) => s.scale.setScalar(Math.max(0.0001, ease.outBack(seg(P.lap?.stick || 0, i * 0.22, i * 0.22 + 0.5)))));
      const ph = this.items.phones.userData, spread = P.phones?.spread || 0;
      ph.p1.position.set(-0.55 * spread, 0, -0.1 * spread); ph.p1.rotation.set(0, -0.35 * spread, 0.06 * spread);
      ph.p2.position.set(0.55 * spread, 0, 0.1 * spread); ph.p2.rotation.set(0, Math.PI + 0.35 * spread, -0.06 * spread);
    }
    this.r.render(this.scene, cam);
    return out;
  }
}
