// 30 s blockout for Higgsfield Genjutsu: boxes, lines and dots on a fixed 20 fps clock.
// Every frame is a pure function of its time, so any frame can be rendered on its own.
// Shot list (seconds): see SHOTS below; the README has the full table.
import * as THREE from 'three';
import { LOGO, LOGO_W } from '../src/logo.js';

export const FPS = 20, DUR = 30, W = 1920, H = 1080;
export const SHOTS = [
  [0, 3, '01 · Billboard, kamera geri çekilir, pan, yükselir'],
  [3, 5, '02 · Time-lapse: hayalet insan akışı'],
  [5, 6.5, '03 · Uzun pozlama araç izleri'],
  [6.5, 7.8, '04 · Donma, kamera döner ve uzaklaşır'],
  [7.8, 10, '05 · Otobüs girer, ağır çekime yavaşlar'],
  [10, 11.5, '06 · Yaklaşma: otobüs paneli (slogan)'],
  [11.5, 14.6, '07 · Sisten 360° reklam silindiri, yörünge'],
  [14.6, 15.5, '08 · Arkada bina: cephe ve çatı reklamı'],
  [15.5, 17, '09 · Her şey silinir, açılış kadrajı'],
  [17, 20, '10 · Eski telefon, noktalardan amblem içinden geçer'],
  [20, 22, '11 · Yeni telefon'],
  [22, 23.5, '12 · Laptop'],
  [23.5, 25, '13 · Tablet'],
  [25, 26, '14 · Saat'],
  [26, 27, '15 · Kulaklık'],
  [27, 30, '16 · Noktalara dağılır, amblem olur, döner'],
];

// ------------------------------------------------------------------ helpers
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const out = (k) => 1 - Math.pow(1 - k, 3);
const back = (k) => { const c = 1.70158; return k <= 0 ? 0 : 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const win = (t, a, b, f = 0.4) => seg(t, a - f, a) * (1 - seg(t, b, b + f)); // fade in before a, out after b
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(7);

// ------------------------------------------------------------------ renderer, light, studio
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const HAZE = new THREE.Color('#D9E6F8');
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
scene.fog = new THREE.Fog(HAZE, 34, 120);
const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 500);
scene.add(new THREE.HemisphereLight(0xffffff, 0xc6d4ea, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(-16, 26, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 120 });
sun.shadow.bias = -0.0006;
scene.add(sun);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#E3ECF8', roughness: 0.5 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const INDIGO = '#3047EC', ICE = '#B7D7FF', FRAME = '#B9C2CF';
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, transparent: true, ...o });
function box(w, h, d, c, x = 0, y = 0, z = 0, base = 1, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  m.userData.base = base;
  return m;
}
function plane(w, h, c, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(c, { emissive: c, emissiveIntensity: 0.25, ...o }));
  m.position.set(x, y, z);
  m.userData.base = 1;
  return m;
}
// opacity for a whole group; shadows only while mostly solid
function fade(obj, a) {
  obj.visible = a > 0.003;
  obj.traverse((n) => {
    if (!n.material) return;
    n.material.opacity = a * (n.userData.base ?? 1);
    n.material.depthWrite = a > 0.98;
    if (n.isMesh) n.castShadow = a > 0.6;
  });
}
const logoShape = (b, s = 1) => {
  const sh = new THREE.Shape();
  b.forEach((p, i) => (i ? sh.lineTo(p[0] * s, p[1] * s) : sh.moveTo(p[0] * s, p[1] * s)));
  return sh;
};
// points inside the mark, in mark units (height 1)
const inMark = (x, y) => LOGO.some((b) => {
  let c = false;
  for (let i = 0, j = b.length - 1; i < b.length; j = i++) {
    const [xi, yi] = b[i], [xj, yj] = b[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
});
function markPoints(n, depth = 0) {
  const pts = [];
  while (pts.length < n) {
    const x = (R() - 0.5) * LOGO_W, y = R() - 0.5;
    if (inMark(x, y)) pts.push([x, y, (R() - 0.5) * depth]);
  }
  return pts;
}
function dots(n, color, size) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: false, transparent: true, depthWrite: false }));
  p.frustumCulled = false;
  scene.add(p);
  return p;
}

// ------------------------------------------------------------------ city (shots 1–9)
const billboard = new THREE.Group();
billboard.add(
  box(0.32, 3.7, 0.32, FRAME, -2.8, 1.85, 0), box(0.32, 3.7, 0.32, FRAME, 2.8, 1.85, 0),
  box(9.4, 4.9, 0.4, FRAME, 0, 6.05, 0),
  plane(9, 4.5, INDIGO, 0, 6.05, 0.205),
);
const wall = box(36, 10, 0.6, '#EDF2FA', 0, 5, -6, 0.5);
const pavement = box(46, 0.14, 5, '#F1F5FB', 0, 0.07, 4.3);
scene.add(billboard, wall, pavement);

const people = [];
for (let i = 0; i < 38; i++) {
  const h = 1.6 + R() * 0.3;
  const m = box(0.14, h, 0.14, '#56607A', 0, h / 2, 2.2 + R() * 4.2, 1);
  m.userData.x0 = (R() - 0.5) * 44;
  m.userData.dir = R() < 0.5 ? -1 : 1;
  m.userData.v = 1.1 + R() * 0.5;
  scene.add(m);
  people.push(m);
}
// time multiplier for the crowd: walk, time-lapse, freeze, slow motion
const mult = (t) => {
  if (t < 3) return 1;
  if (t < 3.4) return lerp(1, 9, seg(t, 3, 3.4));
  if (t < 6.5) return 9;
  if (t < 6.75) return lerp(9, 0, seg(t, 6.5, 6.75));
  if (t < 7.6) return 0;
  return lerp(0, 0.12, seg(t, 7.6, 8.4));
};
const crowdClock = [0];
for (let i = 1; i <= DUR * 400; i++) crowdClock.push(crowdClock[i - 1] + mult((i - 0.5) / 400) / 400);
const crowdT = (t) => crowdClock[Math.min(crowdClock.length - 1, Math.round(t * 400))];

const cars = [];
for (let i = 0; i < 6; i++) {
  const lane = i % 2, dir = lane ? -1 : 1;
  const g = new THREE.Group();
  g.add(box(4.3, 1.25, 1.9, '#C3CCDA', 0, 0.75, 0, 0.55));
  g.add(box(20, 0.16, 0.16, '#FFFFFF', -dir * 12, 0.6, 0.7, 0.95, { emissive: '#FFFFFF', emissiveIntensity: 1 }));
  g.add(box(20, 0.16, 0.16, ICE, -dir * 12, 0.95, -0.7, 0.95, { emissive: ICE, emissiveIntensity: 1 }));
  g.userData = { lane, dir, x0: -dir * (30 + (i >> 1) * 16), z: lane ? 11 : 8.2 };
  scene.add(g);
  cars.push(g);
}

const bus = new THREE.Group();
bus.add(
  box(12, 3.1, 2.6, '#F3F6FB', 0, 2.0, 0),
  box(11.3, 0.85, 2.64, '#97A3B6', 0, 2.75, 0),
  ...[-3.8, 3.8].map((x) => box(1, 1, 2.7, '#3A404C', x, 0.5, 0)),
  plane(8.2, 1.25, INDIGO, -0.6, 1.55, 1.315),
);
bus.position.z = 9.5;
scene.add(bus);
const busX = (t) => (t < 9.9 ? lerp(34, 1.2, 1 - Math.pow(1 - seg(t, 7.6, 9.9), 4)) : 1.2 - 0.55 * (t - 9.9));

const C = new THREE.Vector3(0, 0, 5); // the ad column
const column = new THREE.Group();
column.add(
  new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 5.2, 48), mat('#DDE3EC')),
  new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 3.4, 48), mat(INDIGO, { emissive: INDIGO, emissiveIntensity: 0.2 })),
  new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.45, 0.4, 48), mat('#C6CED9')),
);
column.children[0].position.y = 2.6;
column.children[1].position.y = 2.7;
column.children[2].position.y = 5.35;
column.children.forEach((m) => { m.castShadow = m.receiveShadow = true; m.userData.base = 1; });
column.position.copy(C);
scene.add(column);

const building = new THREE.Group();
building.add(
  box(18, 22, 12, '#E6ECF5', 0, 11, 0),
  plane(12, 9, INDIGO, 0, 13, 6.01),
  box(0.4, 3, 0.4, FRAME, -3.5, 23.5, 0), box(0.4, 3, 0.4, FRAME, 3.5, 23.5, 0),
  box(10.4, 4.6, 0.4, FRAME, 0, 27, 0),
  plane(10, 4.2, INDIGO, 0, 27, 0.21),
);
building.position.set(0, 0, -22);
scene.add(building);

// ------------------------------------------------------------------ products (shots 10–16)
const P = new THREE.Vector3(0.6, 4.8, 1.2);
const prod = {};
const grp = (...ms) => { const g = new THREE.Group(); g.add(...ms); g.position.copy(P); scene.add(g); return g; };
prod.old = grp(box(1.35, 2.5, 0.28, '#8F959F'), plane(1.0, 1.55, '#2C3038', 0, 0.2, 0.141), box(0.4, 0.12, 0.05, '#6E747E', 0, -0.95, 0.15));
{
  const back = new THREE.Mesh(new THREE.ShapeGeometry(LOGO.map((b) => logoShape(b, 0.45))), mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 0.4, side: THREE.DoubleSide }));
  back.position.set(0, -0.1, -0.07); back.rotation.y = Math.PI; back.userData.base = 1;
  prod.phone = grp(box(1.2, 2.5, 0.13, '#A3ABB8'), plane(1.08, 2.35, '#1E2128', 0, 0, 0.066), box(0.52, 0.52, 0.06, '#8A93A1', 0.27, 0.86, -0.09), back);
}
{
  const lid = new THREE.Group();
  lid.add(box(3.2, 2.1, 0.08, '#C7CDD6', 0, 1.05, 0), plane(3.0, 1.9, INDIGO, 0, 1.05, 0.041));
  lid.position.set(0, 0.06, -1.05);
  prod.laptop = grp(box(3.2, 0.12, 2.1, '#C7CDD6'), plane(2.6, 0.9, '#3A3F48', 0, 0.061, -0.35, { side: THREE.DoubleSide }), lid);
  prod.laptop.children[1].rotation.x = -Math.PI / 2;
  prod.laptop.userData.lid = lid;
}
prod.tablet = grp(box(2.7, 1.95, 0.1, '#B9C0CB'), plane(2.5, 1.75, INDIGO, 0, 0, 0.051));
prod.watch = grp(box(1.0, 1.2, 0.36, '#2A2E36'), plane(0.84, 1.02, INDIGO, 0, 0, 0.181), box(0.6, 1.1, 0.12, INDIGO, 0, 1.12, -0.05), box(0.6, 1.1, 0.12, INDIGO, 0, -1.12, -0.05));
{
  const bud = (x) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.42, 6, 16), mat('#F7F8FB')); m.position.set(x, 0.1, 0.55); m.rotation.z = 0.5; m.castShadow = true; m.userData.base = 1; return m; };
  prod.buds = grp(box(1.5, 1.15, 0.8, '#F4F6FA'), box(1.5, 0.08, 0.8, '#DDE2EA', 0, 0.62, -0.25), bud(-1.25), bud(1.3));
}
const logo3d = new THREE.Mesh(
  new THREE.ExtrudeGeometry(LOGO.map((b) => logoShape(b)), { depth: 0.22, bevelEnabled: false }),
  mat(INDIGO, { roughness: 0.3, metalness: 0.2, emissive: INDIGO, emissiveIntensity: 0.15 }),
);
logo3d.geometry.translate(0, 0, -0.11);
logo3d.castShadow = true; logo3d.userData.base = 1;
const logoG = new THREE.Group(); logoG.add(logo3d); logoG.position.copy(P); logoG.scale.setScalar(2.6); scene.add(logoG);

// product order and swap times: each one replaces the previous at its start
const ORDER = [['old', 17.0], ['phone', 20.0], ['laptop', 22.0], ['tablet', 23.5], ['watch', 25.0], ['buds', 26.0]];
const SIZE = { old: 1, phone: 1, laptop: 1, tablet: 1, watch: 0.85, buds: 1.5 };

const scanDots = dots(2600, INDIGO, 4);
const scanSrc = markPoints(2600);
const puff = dots(900, INDIGO, 4);
const puffDir = Array.from({ length: 900 }, () => { const v = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(); return [v, 0.2 + R() * 1.1]; });
const finale = dots(3200, INDIGO, 4);
const finaleSrc = Array.from({ length: 3200 }, () => { const v = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(); return [v, 0.3 + R() * 1.2, R() * Math.PI * 2]; });
const finaleDst = markPoints(3200, 0.22);

// ------------------------------------------------------------------ camera path
const OPEN = { p: [-8.4, 2.5, 12.5], q: [-6.0, 5.6, 0] };
const KEYS = [
  [0, OPEN.p, OPEN.q],
  [1.5, [-8.6, 5.2, 16.5], [-1.2, 5.0, 0]],
  [3.0, [-11, 8.5, 22], [-0.4, 4.5, 0]],
  [6.5, [-12.2, 9.2, 23.6], [0, 4.2, 0]],
  [7.2, [-4, 5.2, 27], [0, 3.6, 2]],
  [7.8, [3.5, 3.0, 25], [0.4, 2.8, 6]],
  [10, [3.0, 2.6, 23], [0.4, 2.2, 9.6]],
  [11.5, [0.6, 2.05, 15.4], [0, 1.85, 9.8]],
];
// orbit around the ad column, then look past it at the building
for (let i = 0; i <= 10; i++) {
  const t = 12.0 + i * 0.26, a = 0.08 + (i / 10) * Math.PI * 1.85;
  const rad = lerp(11.5, 13, i / 10), h = lerp(2.6, 4.4, i / 10);
  KEYS.push([t, [C.x + Math.sin(a) * rad, h, C.z + Math.cos(a) * rad], [C.x, 2.9, C.z]]);
}
KEYS.push(
  [15.5, [-4.6, 2.6, 20], [1.0, 10, -18]],
  [17.0, OPEN.p, OPEN.q],
  [18.4, [-1.8, 5.0, 7.9], P.toArray()],
);
for (let i = 1; i <= 8; i++) {
  const t = 18.4 + i * 1.075, a = -0.24 + (i / 8) * 1.25;
  KEYS.push([t, [P.x + Math.sin(a) * 6.8, 5.0 + Math.sin(i / 8 * Math.PI) * 0.6, P.z + Math.cos(a) * 6.8], P.toArray()]);
}
KEYS.push([28.6, [0.6, 5.0, 9.2], P.toArray()], [30, [0.6, 4.9, 8.6], P.toArray()]);

const curP = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[1])), false, 'centripetal');
const curQ = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[2])), false, 'centripetal');
// time → curve parameter with a monotone cubic, so speed changes smoothly between keys
const KT = KEYS.map((k) => k[0]);
const n = KT.length;
const slope = KT.map((_, i) => {
  if (i === 0 || i === n - 1) return 0;
  const d0 = 1 / (KT[i] - KT[i - 1]), d1 = 1 / (KT[i + 1] - KT[i]);
  return (2 * d0 * d1) / (d0 + d1);
});
function uAt(t) {
  if (t <= KT[0]) return 0;
  if (t >= KT[n - 1]) return 1;
  let i = 0;
  while (KT[i + 1] < t) i++;
  const h = KT[i + 1] - KT[i], s = (t - KT[i]) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return (h00 * i + h10 * h * slope[i] + h01 * (i + 1) + h11 * h * slope[i + 1]) / (n - 1);
}

// ------------------------------------------------------------------ one frame
const tmp = new THREE.Vector3();
export function renderAt(f) {
  const t = f / FPS;
  const u = uAt(t);
  cam.position.copy(curP.getPoint(u));
  cam.lookAt(curQ.getPoint(u));

  // city
  const cityA = 1 - seg(t, 11.4, 12.0);
  fade(billboard, cityA);
  fade(wall, cityA * 0.55);
  fade(pavement, cityA);
  const ct = crowdT(t), m = mult(t);
  for (const p of people) {
    const { x0, dir, v } = p.userData;
    let x = x0 + dir * v * ct;
    x = ((((x + 22) % 44) + 44) % 44) - 22;
    p.position.x = x;
    p.scale.x = 1 + 1.4 * Math.max(0, m - 1);
    fade(p, lerp(0.95, 0.22, seg(m, 1, 9)) * cityA);
  }
  for (const c of cars) {
    const { dir, x0, z } = c.userData;
    c.position.set(x0 + dir * 46 * (t - 5), 0, z);
    fade(c, win(t, 5.15, 6.3, 0.25));
  }
  bus.position.x = busX(t);
  fade(bus, seg(t, 7.6, 7.61) * (1 - seg(t, 11.5, 12.0)));
  const colA = seg(t, 11.8, 12.6) * (1 - seg(t, 15.5, 16.2));
  column.position.y = -1.2 * (1 - out(seg(t, 11.8, 12.6))) - 1.5 * io(seg(t, 15.5, 16.2));
  fade(column, colA);
  fade(building, seg(t, 14.2, 15.0) * (1 - seg(t, 15.6, 16.3)));
  building.position.y = -2 * io(seg(t, 15.6, 16.3));

  // products face the camera, each with its own small turn
  const az = Math.atan2(cam.position.x - P.x, cam.position.z - P.z);
  const bob = Math.sin(t * 1.3) * 0.08;
  ORDER.forEach(([k, a], i) => {
    const b = i + 1 < ORDER.length ? ORDER[i + 1][1] : 27.0;
    const g = prod[k];
    const inS = k === 'old' ? out(seg(t, a, a + 0.6)) : back(seg(t, a, a + 0.4));
    const outS = 1 - io(seg(t, b - 0.2, b));
    const s = Math.max(0, Math.min(inS, outS)) * SIZE[k];
    g.visible = s > 0.002;
    g.scale.setScalar(Math.max(0.0001, s));
    g.position.set(P.x, P.y + bob, P.z);
    let off = Math.sin((t - a) * 0.8) * 0.35;
    if (k === 'phone') off = Math.PI * io(seg(t, 20.2, 21.3)) - 0.3 + Math.sin((t - a) * 0.8) * 0.15;
    if (k === 'laptop') off = -0.35 + 0.5 * seg(t, a, b);
    g.rotation.set(k === 'laptop' ? 0.18 : 0, az + off, k === 'laptop' ? 0 : 0.05);
  });
  // the laptop lid starts closed (lying on the base, +90°) and opens to 110° from the base
  prod.laptop.userData.lid.rotation.x = Math.PI / 2 - ((Math.PI / 180) * 110) * io(seg(t, 22.15, 22.8));

  // scan: the mark, in dots, slides through the old phone
  {
    const k = seg(t, 18.0, 19.8), a = win(t, 18.1, 19.6, 0.25);
    scanDots.visible = a > 0.003;
    scanDots.material.opacity = a;
    const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
    const pos = scanDots.geometry.attributes.position;
    const off = lerp(-4.2, 4.2, io(k));
    scanDots.geometry.attributes.position.needsUpdate = true;
    scanSrc.forEach(([x, y], i) => {
      tmp.set(x * 3.0, y * 3.0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), az).add(P).addScaledVector(right, off);
      pos.setXYZ(i, tmp.x, tmp.y + bob, tmp.z);
    });
  }
  // puffs of dots at every swap
  {
    let tb = null;
    for (const [, a] of ORDER.slice(1)) if (t > a - 0.25 && t < a + 0.5) tb = a;
    puff.visible = tb !== null;
    if (tb !== null) {
      const k = seg(t, tb - 0.25, tb + 0.5);
      puff.material.opacity = 1 - k;
      const pos = puff.geometry.attributes.position;
      puffDir.forEach(([v, r0], i) => { const r = r0 + 1.9 * out(k); pos.setXYZ(i, P.x + v.x * r * 1.4, P.y + bob + v.y * r, P.z + v.z * r * 1.4); });
      pos.needsUpdate = true;
    }
  }
  // finale: burst, swirl, converge into the mark, then the solid mark turns
  {
    const a = seg(t, 26.95, 27.1) * (1 - seg(t, 28.8, 29.15));
    finale.visible = a > 0.003;
    finale.material.opacity = a;
    if (finale.visible) {
      const kb = out(seg(t, 26.95, 27.8)), kc = io(seg(t, 27.8, 28.8));
      const pos = finale.geometry.attributes.position;
      const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), az - 0.9 + 0.9 * seg(t, 28.6, 30));
      finaleSrc.forEach(([v, r0, sw], i) => {
        const r = r0 + 1.3 * kb;
        const ang = sw + 2.4 * kb;
        const sx = P.x + Math.cos(ang) * v.x * r * 1.3, sy = P.y + v.y * r, sz = P.z + Math.sin(ang) * v.z * r * 1.3;
        const [dx, dy, dz] = finaleDst[i];
        tmp.set(dx * 2.6, dy * 2.6, dz * 2.6).applyQuaternion(rot).add(P);
        pos.setXYZ(i, lerp(sx, tmp.x, kc), lerp(sy, tmp.y, kc), lerp(sz, tmp.z, kc));
      });
      pos.needsUpdate = true;
    }
    const la = seg(t, 28.55, 29.0);
    fade(logoG, la);
    logoG.rotation.y = az - 0.9 + 0.9 * seg(t, 28.6, 30) + 0.25 * io(seg(t, 29.0, 30));
    logoG.position.set(P.x, P.y + bob, P.z);
  }
  renderer.render(scene, cam);
}
window.renderAt = renderAt;
window.BLOCKOUT = { FPS, DUR, W, H, SHOTS };
