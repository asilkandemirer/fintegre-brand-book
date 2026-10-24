// 18 s device chain for Kling 4.0: one object turns into ten devices in a row while the
// Fintegre mark stays fixed in the centre of the frame, always on the spot where each
// device carries its logo (the back of the phones, the screen of iPad, MacBook, iMac and
// Watch, the top of Mac mini and Studio). It ends on the earbuds exactly as the campaign film
// opens, and only then does the mark move: it lands on the case lid. Locked camera, pure function of time.
import * as THREE from 'three';
import { LOGO } from '../src/logo.js';

export const FPS = 20, DUR = 18, W = 1920, H = 1080;
export const SHOTS = [
  [0, 2, '01 · Eski telefon (sırt)'],
  [2, 3.8, '02 · Yeni telefon (sırt)'],
  [3.8, 5.6, '03 · iPad (ekran)'],
  [5.6, 7.4, '04 · MacBook Air (ekran)'],
  [7.4, 9.2, '05 · MacBook Pro (ekran)'],
  [9.2, 11, '06 · iMac (ekran)'],
  [11, 12.8, '07 · Mac mini (üst yüz)'],
  [12.8, 14.6, '08 · Mac Studio (üst yüz)'],
  [14.6, 16.4, '09 · Watch (kadran)'],
  [16.4, 18, '10 · Kulaklık: kampanya filminin ilk karesi'],
];
// each device holds still for a beat, then morphs into the next in 0.8 s
const HOLD = [[0, 1.2], [2.0, 3.0], [3.8, 4.8], [5.6, 6.6], [7.4, 8.4], [9.2, 10.2], [11.0, 12.0], [12.8, 13.8], [14.6, 15.6], [16.4, 18.0]];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const out = (k) => 1 - Math.pow(1 - k, 3);
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(11);

// ------------------------------------------------------------------ studio (same as blockout.js)
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
{
  const c = document.createElement('canvas');
  c.width = 4; c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#FAFCFF'); gr.addColorStop(0.5, '#E4EDFA'); gr.addColorStop(1, '#D3E2F6');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
}
scene.fog = new THREE.Fog(new THREE.Color('#D9E6F8'), 34, 120);
const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 500);
cam.position.set(0, 4.7, 12.6);
cam.lookAt(0, 4.5, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0xc6d4ea, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(-10, 18, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 60 });
sun.shadow.bias = -0.0006;
scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#E3ECF8', roughness: 0.5 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const INDIGO = '#3047EC', ICE = '#B7D7FF';
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.15, transparent: true, ...o });
const unitBox = new THREE.BoxGeometry(1, 1, 1);
function part(c, o) {
  const m = new THREE.Mesh(unitBox, mat(c, o));
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
}

// ------------------------------------------------------------------ the fixed mark
const ANCHOR = new THREE.Vector3(0, 4.5, 0); // the mark never moves; the logo face of every device sits here
// …until the last device: the open earbuds lid, tilted back, carries it where the campaign film shows it
const LID = new THREE.Vector3(0.31, 6.35, -1.2), LID_TILT = -0.35;
const MARK_ON_LID = LID.clone()
  .add(new THREE.Vector3(0.09, 0.6 * Math.cos(LID_TILT), 0.6 * Math.sin(LID_TILT)))
  .add(new THREE.Vector3(0, -0.18 * Math.sin(LID_TILT), 0.18 * Math.cos(LID_TILT)));
const markShape = LOGO.map((b) => {
  const s = new THREE.Shape();
  b.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  return s;
});
const mark = new THREE.Mesh(new THREE.ExtrudeGeometry(markShape, { depth: 0.05, bevelEnabled: false }), mat(INDIGO, { emissive: INDIGO, emissiveIntensity: 0.35, roughness: 0.3 }));
mark.position.copy(ANCHOR);
mark.scale.setScalar(1.05);
scene.add(mark);

// ------------------------------------------------------------------ devices
// body w × h × d (the face toward camera carries the logo), oy = body centre relative to the
// mark, colour, and the parts that make each device readable
const DEVICES = [
  { w: 2.9, h: 5.6, d: 0.48, oy: -0.25, c: '#8F959F' }, // old phone, back
  { w: 2.75, h: 5.7, d: 0.3, oy: -0.3, c: '#A3ABB8', cam: [1.25, 1.25, 0.14, -0.55, 1.95] }, // new phone, back
  { w: 5.0, h: 6.9, d: 0.22, oy: 0, c: '#C9CED6', screen: [0.9, 0.93] }, // iPad, screen
  { w: 7.4, h: 4.9, d: 0.1, oy: 0, c: '#C7CDD6', screen: [0.94, 0.9], base: [0.14, 5.0] }, // MacBook Air, open, screen
  { w: 7.9, h: 5.2, d: 0.16, oy: 0, c: '#8E949E', screen: [0.95, 0.92], base: [0.26, 5.4] }, // MacBook Pro, open, screen
  { w: 6.8, h: 4.9, d: 0.14, oy: -0.5, c: '#A8C4EA', screen: [0.94, 0.76], stand: [2.0, 1.8] }, // iMac, screen above the chin
  { w: 3.8, h: 3.8, d: 1.2, oy: 0, c: '#C9CED6' }, // Mac mini, top face to camera
  { w: 4.4, h: 4.4, d: 2.4, oy: 0, c: '#BFC5CE' }, // Mac Studio, top face to camera
  { w: 2.0, h: 2.4, d: 0.5, oy: 0, c: '#2A2E36', band: [1.6, 2.5], screen: [0.86, 0.86] }, // Watch, face
  { w: 4.1, h: 2.8, d: 2.0, oy: -0.17, c: '#F4F6FA', buds: true }, // earbuds: case, open lid and buds framed as the campaign film's first frame
];
const body = part('#A3ABB8');
const extras = DEVICES.map((s) => {
  const e = {};
  if (s.cam) e.cam = part('#7F8896');
  if (s.stand) { e.stand = part(s.c); e.foot = part(s.c); }
  if (s.buds) {
    e.buds = [-1, 1].map(() => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 6, 16), mat('#F7F8FB'));
      m.castShadow = true; scene.add(m); return m;
    });
    e.lid = part(s.c);
  }
  if (s.band) { e.top = part(INDIGO); e.bot = part(INDIGO); }
  return e;
});
// screen and laptop base are shared, so when both devices have one it stays and only reshapes
const screen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(ICE, { emissive: ICE, emissiveIntensity: 0.3 }));
scene.add(screen);
const base = part('#C7CDD6'), keys = part('#3A3F48');

const sparks = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(900 * 3), 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: INDIGO, size: 4, sizeAttenuation: false, transparent: true, depthWrite: false }));
  p.frustumCulled = false;
  scene.add(p);
  return p;
})();
const sparkSeed = Array.from({ length: 900 }, () => [R(), R(), R(), R()]);

// where we are: device i holding, or morphing from i to i+1 with k in 0..1
function stateAt(t) {
  for (let i = 0; i < HOLD.length; i++) {
    if (t <= HOLD[i][1]) return { i, k: 0 };
    if (i + 1 < HOLD.length && t < HOLD[i + 1][0]) return { i, k: io(seg(t, HOLD[i][1], HOLD[i + 1][0])) };
  }
  return { i: HOLD.length - 1, k: 0 };
}

const col = new THREE.Color(), c2 = new THREE.Color();
export function renderAt(f) {
  const t = f / FPS;
  const { i, k } = stateAt(t);
  const A = DEVICES[i], B = DEVICES[Math.min(i + 1, DEVICES.length - 1)];
  const w = lerp(A.w, B.w, k), h = lerp(A.h, B.h, k), d = lerp(A.d, B.d, k), oy = lerp(A.oy, B.oy, k);
  const s = 1;
  const front = ANCHOR.z - 0.03; // the logo face of the body, just behind the mark
  body.visible = s > 0.04;
  body.scale.set(w * s, h * s, d * s);
  body.position.set(ANCHOR.x, ANCHOR.y + oy * s, front - (d * s) / 2);
  body.material.color.copy(col.set(A.c).lerp(c2.set(B.c), k));

  // parts: the outgoing device's parts shrink in the first half of a morph, the incoming ones grow in the second
  extras.forEach((e, j) => {
    let p = 0;
    if (j === i) p = 1 - io(seg(k, 0, 0.5));
    if (j === i + 1) p = io(seg(k, 0.5, 1));
    p *= s;
    const S = DEVICES[j];
    const bx = ANCHOR.x, by = ANCHOR.y + oy * s, bz = front - (d * s) / 2;
    const top = by + (h * s) / 2, bottom = by - (h * s) / 2;
    const on = p > 0.002;
    Object.values(e).flat().forEach((m) => (m.visible = on));
    if (!on) return;
    if (e.cam) {
      const [cw, ch, cd, cx, cy] = S.cam;
      e.cam.scale.set(cw * p, ch * p, cd);
      e.cam.position.set(bx + cx * (w / S.w) * s, by + cy * (h / S.h) * s, front + cd / 2 - 0.001);
    }
    if (e.stand) {
      const [sw, sh] = S.stand;
      e.stand.scale.set(sw * p, sh * p, 0.14);
      e.stand.position.set(bx, bottom - (sh * p) / 2 + 0.25, front - d * s - 0.45);
      e.stand.rotation.x = 0.2;
      e.foot.scale.set(sw * p, 0.12, 2.0 * p);
      e.foot.position.set(bx, bottom - sh * p + 0.2, front - d * s - 0.2);
    }
    if (e.buds) { // where the campaign film's first frame has them: buds either side, the lid open and tilted back
      e.buds.forEach((m, n) => { m.scale.setScalar(2.2 * p); m.position.set(n ? 3.4 : -3.24, n ? 4.33 : 5.1, -0.5); m.rotation.z = n ? -0.25 : 0.35; });
      e.lid.scale.set(4.1 * p, 2.3 * p, 0.3);
      e.lid.position.copy(LID);
      e.lid.rotation.x = LID_TILT;
    }
    if (e.top) {
      const [bw, bh] = S.band;
      e.top.scale.set(bw * p, bh * p, 0.2);
      e.top.position.set(bx, top + (bh * p) / 2 - 0.05, bz);
      e.bot.scale.set(bw * p, bh * p, 0.2);
      e.bot.position.set(bx, bottom - (bh * p) / 2 + 0.05, bz);
    }
  });

  // shared parts: a part only one side has grows or shrinks in its half of the morph
  {
    const has = (D, key) => (D[key] ? 1 : 0);
    const pres = (key) => {
      const a = has(A, key), b = has(B, key);
      if (a && b) return 1;
      if (a) return 1 - io(seg(k, 0, 0.5));
      if (b) return io(seg(k, 0.5, 1));
      return 0;
    };
    const fr = (key, n, dflt) => lerp(A[key] ? A[key][n] : dflt, B[key] ? B[key][n] : dflt, k);
    const ps = pres('screen') * s;
    screen.visible = ps > 0.002;
    screen.scale.set(w * s * fr('screen', 0, 0.9) * ps, h * s * fr('screen', 1, 0.9) * ps, 1);
    screen.position.set(ANCHOR.x, ANCHOR.y, front + 0.002);
    const pb = pres('base') * s;
    base.visible = keys.visible = pb > 0.002;
    const bh = fr('base', 0, 0.14), bd = fr('base', 1, 5.0) * pb, bottom = ANCHOR.y + oy * s - (h * s) / 2;
    base.scale.set(w * s, bh, bd);
    base.position.set(ANCHOR.x, bottom - bh / 2, front + bd / 2); // toward the camera from the bottom of the lid
    base.material.color.copy(body.material.color);
    keys.scale.set(Math.max(0.01, w * s - 0.9), 0.02, bd * 0.5);
    keys.position.set(ANCHOR.x, bottom + 0.01, front + bd * 0.3);
  }

  // the mark holds still through every device, then lands on the earbuds case lid
  {
    const land = i === DEVICES.length - 1 ? 1 : i === DEVICES.length - 2 ? k : 0;
    mark.position.lerpVectors(ANCHOR, MARK_ON_LID, land);
    mark.rotation.x = LID_TILT * land;
    mark.scale.setScalar(lerp(1.05, 0.72, land));
  }

  // a shimmer of digits along the outline while a device changes
  {
    const m = Math.sin(Math.PI * k) * (k > 0 ? 1 : 0), fin = 0;
    const a = m;
    sparks.visible = a > 0.01;
    sparks.material.opacity = a * 0.9;
    if (sparks.visible) {
      const pos = sparks.geometry.attributes.position;
      const ww = w * s + 0.2, hh = h * s + 0.2, by = ANCHOR.y + oy * s;
      sparkSeed.forEach(([u, v, r, q], n) => {
        const per = u * 2 * (ww + hh);
        let x, y;
        if (per < ww) { x = -ww / 2 + per; y = hh / 2; } else if (per < ww + hh) { x = ww / 2; y = hh / 2 - (per - ww); } else if (per < 2 * ww + hh) { x = ww / 2 - (per - ww - hh); y = -hh / 2; } else { x = -ww / 2; y = -hh / 2 + (per - 2 * ww - hh); }
        const spread = (0.15 + 0.6 * r) * m + fin * (1.5 + 3 * r);
        const ang = v * Math.PI * 2;
        pos.setXYZ(n, ANCHOR.x + x * (1 - fin * 0.3) + Math.cos(ang) * spread, by + y * (1 - fin * 0.3) + Math.sin(ang) * spread, front + 0.2 + (q - 0.5) * 0.6);
      });
      pos.needsUpdate = true;
    }
  }
  renderer.render(scene, cam);
}
window.renderAt = renderAt;
window.BLOCKOUT = { FPS, DUR, W, H, SHOTS };
