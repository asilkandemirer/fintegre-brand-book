// The only 3D moment in the brand book: the four blocks of the mark travel in along the
// 65° slant and lock together, then the finished mark turns slowly. Scroll drives it.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial,
  PMREMGenerator, DirectionalLight, NeutralToneMapping, SRGBColorSpace,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildBlockGeometries, LOGO_W } from './logo.js';
import { seg, ease, dampK } from './util.js';

const DIR = [Math.cos((65 * Math.PI) / 180), Math.sin((65 * Math.PI) / 180)];
// how far each block starts from home along the slant, plus depth and spin
const START = [
  { k: 1.15, z: -0.8, r: [0.5, -0.9, 0.2] },
  { k: -0.9, z: 0.7, r: [-0.6, 0.8, -0.1] },
  { k: -1.35, z: -0.4, r: [0.4, 1.1, 0.3] },
  { k: 0.8, z: 0.9, r: [-0.5, -1.2, -0.2] },
];

export class Logo3D {
  constructor(canvas, { onAssembled } = {}) {
    this.canvas = canvas;
    this.onAssembled = onAssembled;
    const r = (this.r = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputColorSpace = SRGBColorSpace;
    r.toneMapping = NeutralToneMapping;
    r.toneMappingExposure = 1.05;
    r.setClearColor(0x000000, 0);

    this.scene = new Scene();
    const pm = new PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();

    const key = new DirectionalLight(0xffffff, 1.6);
    key.position.set(-3, 5, 6); // key light from the upper left, along the slant
    this.scene.add(key);
    const rim = new DirectionalLight(0xb7d7ff, 2.2);
    rim.position.set(4, -2, -3);
    this.scene.add(rim);

    this.cam = new PerspectiveCamera(28, 1, 0.1, 100);
    this.cam.position.set(0, 0, 8);

    this.mat = new MeshPhysicalMaterial({
      color: 0xf5f7fa, metalness: 0.18, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08,
      envMapIntensity: 1.15, iridescence: 0.35, iridescenceIOR: 1.5, sheen: 0.4, sheenColor: 0xb7d7ff,
    });
    this.group = new Group();
    this.blocks = buildBlockGeometries({ depth: 0.2 }).map(({ geometry, centroid }, i) => {
      const m = new Mesh(geometry, this.mat);
      m.userData = { home: centroid, s: START[i] };
      this.group.add(m);
      return m;
    });
    this.scene.add(this.group);

    this.p = 0;
    this.shown = 0;
    this.assembled = false;
    this.mx = 0; this.my = 0; this.cx = 0; this.cy = 0;
    window.addEventListener('pointermove', (e) => {
      this.mx = (e.clientX / window.innerWidth) * 2 - 1;
      this.my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.r.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    this.portrait = w / h < 0.9;
  }

  // p: 0..1 progress through the logo scene
  frame(p, dt, reduce) {
    this.shown += (p - this.shown) * (reduce ? 1 : dampK(7, dt));
    const u = this.shown;
    const e = ease.inOutCubic(seg(u, 0.04, 0.56));
    for (const m of this.blocks) {
      const { home, s } = m.userData;
      const k = s.k * (1 - e);
      m.position.set(home[0] + DIR[0] * k, home[1] + DIR[1] * k, s.z * (1 - e));
      m.rotation.set(s.r[0] * (1 - e), s.r[1] * (1 - e), s.r[2] * (1 - e));
    }
    if (!this.assembled && e > 0.985) { this.assembled = true; this.onAssembled?.(); }
    if (e < 0.6) this.assembled = false;

    // after assembly the finished mark turns slowly; the pointer adds a little parallax
    this.cx += (this.mx - this.cx) * dampK(3, dt);
    this.cy += (this.my - this.cy) * dampK(3, dt);
    const turn = reduce ? 0 : seg(u, 0.56, 1) * 0.9;
    this.group.rotation.set(0.08 + this.cy * 0.08, -0.25 + turn + this.cx * 0.12, 0);

    // size and place: right half on wide screens, upper half on tall ones
    const vh = 2 * Math.tan((this.cam.fov * Math.PI) / 360) * this.cam.position.z;
    const vw = vh * this.cam.aspect;
    const s = this.portrait ? Math.min(vw * 0.62 / LOGO_W, vh * 0.3) : Math.min(vh * 0.46, vw * 0.36 / LOGO_W);
    this.group.scale.setScalar(s);
    this.group.position.set(this.portrait ? 0 : vw * 0.2, this.portrait ? vh * 0.2 : 0, 0);
    this.r.render(this.scene, this.cam);
  }
}
