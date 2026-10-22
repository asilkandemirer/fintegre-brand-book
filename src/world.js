// Renderer, studio environment, background field, post-processing and the two
// "rigs" every chapter steers: the logo and the camera. Chapters only set targets;
// the rigs ease towards them, so crossing a chapter boundary never jumps.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Vector2, Vector3, Group, Mesh,
  MeshPhysicalMaterial, MeshBasicMaterial, PlaneGeometry, SphereGeometry, ShaderMaterial,
  BackSide, PMREMGenerator, HalfFloatType, WebGLRenderTarget, NeutralToneMapping,
  SRGBColorSpace, PointLight, Euler, MathUtils,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildBlockGeometries } from './logo.js';
import { dampK, lerp, drift, clamp } from './util.js';

export const C = {
  graphite: new Color('#0F1115'),
  titanium: new Color('#A7B0BE'),
  indigo: new Color('#3047EC'),
  ice: new Color('#B7D7FF'),
  smoke: new Color('#F5F7FA'),
  black: new Color('#07080a'),
  white: new Color('#ffffff'),
};

export const isLite =
  (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) ||
  Math.min(screen.width, screen.height) < 700;

// ---------------------------------------------------------------------------
// Material presets for anything made of "brand matter"
export const PRESETS = {
  chrome: { color: '#e4e9f2', metalness: 1, roughness: 0.1, clearcoat: 1, emissive: '#000000', ei: 0, opacity: 1, grad: 0, env: 1.25, irid: 0 },
  titanium: { color: '#A7B0BE', metalness: 1, roughness: 0.27, clearcoat: 0.35, emissive: '#000000', ei: 0, opacity: 1, grad: 0, env: 1.15, irid: 0 },
  signal: { color: '#ffffff', metalness: 0.12, roughness: 0.2, clearcoat: 1, emissive: '#3047EC', ei: 0.1, opacity: 1, grad: 1, env: 0.95, irid: 0 },
  indigo: { color: '#3047EC', metalness: 0.35, roughness: 0.18, clearcoat: 1, emissive: '#3047EC', ei: 0.3, opacity: 1, grad: 0, env: 0.9, irid: 0 },
  ice: { color: '#B7D7FF', metalness: 0.0, roughness: 0.03, clearcoat: 1, emissive: '#7fa6ff', ei: 0.08, opacity: 0.34, grad: 0, env: 2.6, irid: 0.9 },
  graphite: { color: '#16191f', metalness: 0.7, roughness: 0.14, clearcoat: 1, emissive: '#000000', ei: 0, opacity: 1, grad: 0, env: 1.0, irid: 0 },
  smoke: { color: '#F5F7FA', metalness: 0.0, roughness: 0.42, clearcoat: 0.6, emissive: '#000000', ei: 0, opacity: 1, grad: 0, env: 1.1, irid: 0 },
  ghost: { color: '#A7B0BE', metalness: 1, roughness: 0.35, clearcoat: 0, emissive: '#000000', ei: 0, opacity: 0.0, grad: 0, env: 1.0, irid: 0 },
};
const presetCache = {};
function P(name) {
  if (presetCache[name]) return presetCache[name];
  const s = PRESETS[name];
  return (presetCache[name] = { ...s, color: new Color(s.color), emissive: new Color(s.emissive) });
}

// A material whose parameters ease towards a preset.
export class SmartMaterial {
  constructor(preset = 'titanium', { gradient = false } = {}) {
    const p = P(preset);
    this.m = new MeshPhysicalMaterial({
      color: p.color.clone(), metalness: p.metalness, roughness: p.roughness,
      clearcoat: p.clearcoat, clearcoatRoughness: 0.08, emissive: p.emissive.clone(),
      emissiveIntensity: p.ei, envMapIntensity: p.env, iridescence: Math.max(0.002, p.irid), iridescenceIOR: 1.6,
    });
    this.cur = { ...p, color: p.color.clone(), emissive: p.emissive.clone() };
    this.target = preset;
    this.uGrad = { value: p.grad };
    if (gradient) {
      const uGrad = this.uGrad;
      this.m.onBeforeCompile = (sh) => {
        sh.uniforms.uGrad = uGrad;
        sh.uniforms.uGA = { value: C.indigo };
        sh.uniforms.uGB = { value: C.ice };
        sh.vertexShader = 'attribute float gx;\nvarying float vGx;\n' +
          sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGx = gx;');
        sh.fragmentShader = 'uniform float uGrad; uniform vec3 uGA; uniform vec3 uGB; varying float vGx;\n' +
          sh.fragmentShader
            .replace('#include <color_fragment>', '#include <color_fragment>\n vec3 gcol = mix(uGA, uGB, smoothstep(0.05, 0.95, vGx));\n diffuseColor.rgb = mix(diffuseColor.rgb, gcol, uGrad);')
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= mix(vec3(1.0), gcol * 1.6, uGrad);');
      };
      this.m.customProgramCacheKey = () => 'grad';
    }
    this.apply(1);
  }
  set(name) { this.target = name; }
  step(k) {
    const t = P(this.target);
    const c = this.cur;
    c.color.lerp(t.color, k);
    c.emissive.lerp(t.emissive, k);
    for (const key of ['metalness', 'roughness', 'clearcoat', 'ei', 'opacity', 'grad', 'env', 'irid']) c[key] = lerp(c[key], t[key], k);
    this.apply();
  }
  snap() { this.step(1); }
  apply() {
    const m = this.m, c = this.cur;
    m.color.copy(c.color);
    m.emissive.copy(c.emissive);
    m.metalness = c.metalness;
    m.roughness = c.roughness;
    m.clearcoat = c.clearcoat;
    m.emissiveIntensity = c.ei;
    m.envMapIntensity = c.env;
    m.iridescence = Math.max(0.002, c.irid); // never zero: keeps one shader program
    this.uGrad.value = c.grad;
    const tr = c.opacity < 0.985;
    if (tr !== m.transparent) { m.transparent = tr; m.depthWrite = !tr; m.needsUpdate = true; }
    m.opacity = c.opacity;
  }
}

// ---------------------------------------------------------------------------
const BG_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`;
const BG_FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uBase; uniform vec3 uCA; uniform vec3 uCB;
uniform vec2 uPA; uniform vec2 uPB; uniform float uIA; uniform float uIB;
uniform float uSlant; uniform float uSlantPhase;
uniform float uField; uniform vec2 uFP[5]; uniform vec3 uFC[5]; uniform float uFR[5]; uniform float uFW[5];
uniform float uSweep; uniform vec3 uSweepCol;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  vec2 asp = vec2(uRes.x/uRes.y, 1.0);
  vec2 p = vUv;
  vec2 w = p + 0.018*vec2(sin(p.y*5.0 + uTime*0.21), cos(p.x*4.0 + uTime*0.17));
  vec3 col = uBase;
  float da = length((w-uPA)*asp); col += uCA * uIA * exp(-da*da*2.6);
  float db = length((w-uPB)*asp); col += uCB * uIB * exp(-db*db*3.4);
  // field of colour attractors (the "blending" chapter)
  vec3 fc = vec3(0.0); float fw = 0.0;
  for (int i = 0; i < 5; i++) {
    float d = length((w - uFP[i]) * asp);
    float r = max(uFR[i], 0.001);
    float k = uFW[i] * exp(-d*d/(r*r));
    fc += uFC[i] * k; fw += k;
  }
  vec3 field = fw > 0.0001 ? fc / fw : col;
  col = mix(col, field, uField * clamp(fw * 1.4, 0.0, 1.0));
  // the slant: hairlines at 65 degrees
  vec2 q = (p - 0.5) * asp;
  float a = radians(65.0);
  float s = dot(q, vec2(sin(a), -cos(a))) * 9.0 + uSlantPhase;
  float fwid = fwidth(s);
  float g = abs(fract(s) - 0.5);
  float line = 1.0 - smoothstep(0.0, fwid * 1.6, 0.5 - g);
  col += vec3(0.55, 0.68, 1.0) * line * uSlant * 0.05;
  // a bright sweep line (used on cuts)
  float sw = exp(-pow((dot(q, vec2(sin(a), -cos(a))) - uSweep) * 90.0, 2.0));
  col += uSweepCol * sw * step(-1.5, uSweep) * 0.8;
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

const FINAL = {
  uniforms: {
    tDiffuse: { value: null }, uCA: { value: 0.0 }, uVig: { value: 0.6 }, uGrain: { value: 0.012 },
    uTime: { value: 0 }, uFlash: { value: 0 }, uFlashCol: { value: new Color('#B7D7FF') },
    uRes: { value: new Vector2(1, 1) }, uLine: { value: 0 }, uLineY: { value: 0.5 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
  uniform sampler2D tDiffuse; uniform float uCA, uVig, uGrain, uTime, uFlash, uLine, uLineY;
  uniform vec3 uFlashCol; uniform vec2 uRes; varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  void main(){
    vec2 uv = vUv; vec2 c = uv - 0.5; float r = length(c);
    vec2 off = c * uCA * (0.35 + r);
    vec3 col;
    col.r = texture2D(tDiffuse, uv + off).r;
    col.g = texture2D(tDiffuse, uv).g;
    col.b = texture2D(tDiffuse, uv - off).b;
    col *= mix(1.0, smoothstep(1.0, 0.2, r), uVig);
    col = mix(col, uFlashCol, uFlash);
    float ln = exp(-pow((uv.y - uLineY) * uRes.y * 0.5, 2.0));
    col += uFlashCol * ln * uLine * 2.0;
    col += (hash(uv * uRes + fract(uTime * 7.0) * 100.0) - 0.5) * uGrain;
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }`,
};

// ---------------------------------------------------------------------------
export class World {
  constructor(canvas) {
    this.canvas = canvas;
    const renderer = (this.renderer = new WebGLRenderer({
      canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false,
    }));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    this.maxDpr = isLite ? 1.5 : 1.8;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    renderer.setPixelRatio(this.dpr);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(30, 1, 0.05, 200);
    this.camera.position.set(0, 0, 9);

    this.buildEnv();
    this.buildBackground();
    this.buildLogo();
    this.buildLights();
    this.buildPost();

    // camera rig targets
    this.cam = {
      pos: new Vector3(0, 0, 9), look: new Vector3(0, 0, 0), fov: 30,
      cpos: new Vector3(0, 0, 9), clook: new Vector3(0, 0, 0), cfov: 30,
      kick: 0, roll: 0, croll: 0, lambda: 4.2,
    };
    // background targets
    this.bgT = {
      base: C.graphite.clone(), ca: C.indigo.clone(), cb: C.ice.clone(),
      pa: new Vector2(0.75, 0.7), pb: new Vector2(0.2, 0.2), ia: 0.22, ib: 0.06, slant: 0, field: 0,
    };
    this.post = { bloom: 0.55, ca: 0.0, vig: 0.65, grain: 0.012, flash: 0, line: 0, envRot: 0, envInt: 1, exposure: 1 };
    this.postC = { ...this.post };
    this.flashCol = new Color('#B7D7FF');
    this.resize();
  }

  buildEnv() {
    const r = this.renderer;
    const env = new Scene();
    const dome = new Mesh(
      new SphereGeometry(30, 32, 16),
      new ShaderMaterial({
        side: BackSide,
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vP; void main(){ float h = vP.y; vec3 top = vec3(0.42,0.46,0.56); vec3 mid = vec3(0.11,0.12,0.155); vec3 bot = vec3(0.006,0.007,0.01); vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.9, h)) : mix(mid, bot, smoothstep(0.0, 0.35, -h)); gl_FragColor = vec4(c,1.0); }`,
      })
    );
    env.add(dome);
    const box = (w, h, col, mult, pos, look) => {
      const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(col).multiplyScalar(mult), side: 2 }));
      m.position.set(...pos);
      m.lookAt(...look);
      env.add(m);
    };
    box(14, 5, '#ffffff', 2.6, [0, 11, 2], [0, 0, 0]);       // overhead softbox
    // a ring of soft panels at eye level: flat faces always find a reflection,
    // and rotating the environment sweeps light across them
    [[0, 1.0], [Math.PI / 2, 0.5], [Math.PI, 0.85], [Math.PI * 1.5, 0.4]].forEach(([a, k]) =>
      box(8, 3.6, '#e8eefb', k, [Math.sin(a) * 13, 1.4, Math.cos(a) * 13], [0, 1.4, 0]));
    box(1.0, 12, '#3047EC', 3.2, [-9, 1, -3], [0, 0, 0]);    // indigo strip, left-behind (rim)
    box(0.9, 12, '#B7D7FF', 2.2, [9, 0, -2.5], [0, 0, 0]);   // ice strip, right-behind (rim)
    box(16, 0.7, '#ffffff', 4.0, [0, 2.5, -10], [0, 0, 0]);   // back rim
    box(6, 2, '#A7B0BE', 0.5, [0, -4, 10], [0, 0, 0]);       // low front fill
    const pm = new PMREMGenerator(r);
    this.envTex = pm.fromScene(env, 0.03).texture;
    pm.dispose();
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 1;
  }

  buildBackground() {
    const u = (this.bgU = {
      uRes: { value: new Vector2(1, 1) }, uTime: { value: 0 },
      uBase: { value: C.graphite.clone() }, uCA: { value: C.indigo.clone() }, uCB: { value: C.ice.clone() },
      uPA: { value: new Vector2(0.75, 0.7) }, uPB: { value: new Vector2(0.2, 0.2) },
      uIA: { value: 0.2 }, uIB: { value: 0.05 }, uSlant: { value: 0 }, uSlantPhase: { value: 0 },
      uField: { value: 0 },
      uFP: { value: [0, 1, 2, 3, 4].map(() => new Vector2(0.5, 0.5)) },
      uFC: { value: [0, 1, 2, 3, 4].map(() => new Color()) },
      uFR: { value: [0.2, 0.2, 0.2, 0.2, 0.2] },
      uFW: { value: [0, 0, 0, 0, 0] },
      uSweep: { value: -9 }, uSweepCol: { value: C.ice.clone() },
    });
    const bg = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
      uniforms: u, vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthWrite: false, depthTest: false,
    }));
    bg.frustumCulled = false;
    bg.renderOrder = -100;
    this.scene.add(bg);
  }

  buildLogo() {
    const root = (this.logo = new Group());
    const spin = (this.logoSpin = new Group());
    root.add(spin);
    this.blocks = [];
    this.logoMat = [];
    const geos = buildBlockGeometries();
    geos.forEach(({ geometry, centroid }, i) => {
      const sm = new SmartMaterial('chrome', { gradient: true });
      const mesh = new Mesh(geometry, sm.m);
      mesh.position.set(centroid[0], centroid[1], 0);
      spin.add(mesh);
      this.blocks.push({ mesh, home: new Vector3(centroid[0], centroid[1], 0), off: new Vector3(), offT: new Vector3(), rot: new Vector3(), rotT: new Vector3() });
      this.logoMat.push(sm);
    });
    this.scene.add(root);
    this.L = {
      pos: new Vector3(), rot: new Vector3(), scale: 1, float: 1, vis: 1,
      cpos: new Vector3(), crot: new Vector3(), cscale: 1, cfloat: 1, cvis: 1,
      lambda: 4.5,
    };
    this.geos = geos;
  }

  buildLights() {
    // A moving key light gives the mark a travelling specular highlight.
    this.sweep = new PointLight('#ffffff', 0, 30, 1.6);
    this.sweep.position.set(4, 3, 5);
    this.scene.add(this.sweep);
    this.signalLight = new PointLight('#3047EC', 0, 25, 1.4);
    this.signalLight.position.set(-4, -2, 3);
    this.scene.add(this.signalLight);
    this.lightT = { sweep: 20, signal: 14, sweepAngle: 0 };
    this.lightC = { ...this.lightT };
  }

  buildPost() {
    const r = this.renderer;
    const rt = new WebGLRenderTarget(4, 4, { type: HalfFloatType, samples: isLite ? 0 : 4 });
    const comp = (this.composer = new EffectComposer(r, rt));
    comp.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new Vector2(256, 256), 0.55, 0.62, 0.92);
    comp.addPass(this.bloom);
    this.final = new ShaderPass(FINAL);
    comp.addPass(this.final);
    comp.addPass(new OutputPass());
  }

  resize() {
    const w = Math.max(1, window.innerWidth || 1), h = Math.max(1, window.innerHeight || 1);
    this.w = w; this.h = h;
    this.aspect = w / h;
    this.portrait = w / h < 0.9;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.dpr);
    this.composer.setSize(w, h);
    const bs = isLite ? 0.35 : 0.5;
    this.bloom.setSize(Math.round(w * this.dpr * bs), Math.round(h * this.dpr * bs));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.bgU.uRes.value.set(w, h);
    this.final.uniforms.uRes.value.set(w * this.dpr, h * this.dpr);
  }

  // Fit factor: how many world units fit across half the screen width at the origin.
  get halfW() {
    const vfov = (this.cam.cfov * Math.PI) / 180;
    const d = this.cam.cpos.distanceTo(this.cam.clook);
    return Math.tan(vfov / 2) * d * this.aspect;
  }

  // -------------------------------------------------------------------------
  // Targets chapters can write
  logoTo({ pos, rot, scale, float, vis, mat } = {}) {
    const L = this.L;
    if (pos) L.pos.set(...pos);
    if (rot) L.rot.set(...rot);
    if (scale != null) L.scale = scale;
    if (float != null) L.float = float;
    if (vis != null) L.vis = vis;
    if (mat) for (const m of this.logoMat) m.set(mat);
  }
  blockTo(i, off, rot) {
    const b = this.blocks[i];
    if (off) b.offT.set(...off);
    if (rot) b.rotT.set(...rot);
  }
  blocksHome() { for (let i = 0; i < 4; i++) this.blockTo(i, [0, 0, 0], [0, 0, 0]); }
  camTo({ pos, look, fov, roll, lambda } = {}) {
    const c = this.cam;
    if (pos) c.pos.set(...pos);
    if (look) c.look.set(...look);
    if (fov != null) c.fov = fov;
    if (roll != null) c.roll = roll;
    c.lambda = lambda ?? 4.2;
  }
  bgTo(o = {}) {
    const b = this.bgT;
    if (o.base) b.base.copy(o.base);
    if (o.ca) b.ca.copy(o.ca);
    if (o.cb) b.cb.copy(o.cb);
    if (o.pa) b.pa.set(...o.pa);
    if (o.pb) b.pb.set(...o.pb);
    for (const k of ['ia', 'ib', 'slant', 'field']) if (o[k] != null) b[k] = o[k];
  }
  postTo(o = {}) { Object.assign(this.post, o); }
  lightsTo(o = {}) { Object.assign(this.lightT, o); }

  // An impact: zoom punch, chromatic spike and a hairline flash.
  punch(strength = 1, col = null) {
    this.cam.kick = Math.max(this.cam.kick, 7 * strength);
    this.postC.ca = Math.max(this.postC.ca, 0.05 * strength);
    this.postC.line = 1;
    this.lineY = 0.3 + Math.random() * 0.4;
    if (col) this.flashCol.copy(col);
    this.sweepT = 0; // background sweep line
  }

  // Hard cut: camera, background and logo pose jump straight to their targets.
  cut({ blocks = false, logo = true } = {}) {
    const c = this.cam;
    c.cpos.copy(c.pos); c.clook.copy(c.look); c.cfov = c.fov; c.croll = c.roll;
    const u = this.bgU, b = this.bgT;
    u.uBase.value.copy(b.base); u.uCA.value.copy(b.ca); u.uCB.value.copy(b.cb);
    u.uIA.value = b.ia; u.uIB.value = b.ib;
    if (logo) {
      const L = this.L;
      L.cpos.copy(L.pos); L.crot.copy(L.rot); L.cscale = L.scale;
    }
    if (blocks) for (const bl of this.blocks) { bl.off.copy(bl.offT); bl.rot.copy(bl.rotT); }
  }

  snapAll() {
    const L = this.L;
    L.cpos.copy(L.pos); L.crot.copy(L.rot); L.cscale = L.scale; L.cfloat = L.float; L.cvis = L.vis;
    for (const b of this.blocks) { b.off.copy(b.offT); b.rot.copy(b.rotT); }
    for (const m of this.logoMat) m.snap();
    const c = this.cam;
    c.cpos.copy(c.pos); c.clook.copy(c.look); c.cfov = c.fov; c.croll = c.roll;
    const u = this.bgU, b = this.bgT;
    u.uBase.value.copy(b.base); u.uCA.value.copy(b.ca); u.uCB.value.copy(b.cb);
    u.uPA.value.copy(b.pa); u.uPB.value.copy(b.pb);
    u.uIA.value = b.ia; u.uIB.value = b.ib; u.uSlant.value = b.slant; u.uField.value = b.field;
    Object.assign(this.postC, this.post);
    Object.assign(this.lightC, this.lightT);
  }

  // -------------------------------------------------------------------------
  update(dt, time, vel) {
    const L = this.L;
    const k = dampK(L.lambda, dt);
    L.cpos.lerp(L.pos, k);
    L.crot.lerp(L.rot, k);
    L.cscale = lerp(L.cscale, L.scale, k);
    L.cfloat = lerp(L.cfloat, L.float, k);
    L.cvis = lerp(L.cvis, L.vis, dampK(6, dt));

    // zero-gravity drift layered over the chapter pose
    const f = L.cfloat;
    const t = time * 0.001;
    this.logo.position.set(
      L.cpos.x + drift(t * 0.35, 1, 1.9, 3.1) * 0.08 * f,
      L.cpos.y + drift(t * 0.42 + 4, 1.1, 1.7, 2.6) * 0.11 * f,
      L.cpos.z + drift(t * 0.3 + 9) * 0.1 * f
    );
    this.logoSpin.rotation.set(
      L.crot.x + drift(t * 0.27 + 2) * 0.16 * f,
      L.crot.y + drift(t * 0.21 + 7) * 0.22 * f,
      L.crot.z + drift(t * 0.33 + 1) * 0.07 * f,
      'YXZ'
    );
    const s = L.cscale * (0.0001 + L.cvis);
    this.logo.scale.setScalar(s);
    this.logo.visible = s > 0.002;

    const kb = dampK(5, dt);
    for (const b of this.blocks) {
      b.off.lerp(b.offT, kb);
      b.rot.lerp(b.rotT, kb);
      b.mesh.position.copy(b.home).add(b.off);
      b.mesh.rotation.set(b.rot.x, b.rot.y, b.rot.z);
    }
    const km = dampK(4, dt);
    for (const m of this.logoMat) m.step(km);

    // camera
    const c = this.cam;
    const kc = dampK(c.lambda, dt);
    c.cpos.lerp(c.pos, kc);
    c.clook.lerp(c.look, kc);
    c.cfov = lerp(c.cfov, c.fov, kc);
    c.croll = lerp(c.croll, c.roll, kc);
    c.kick *= Math.exp(-dt * 7);
    const shake = clamp(Math.abs(vel) * 0.6, 0, 1);
    this.camera.position.copy(c.cpos);
    this.camera.position.x += Math.sin(t * 13.1) * 0.004 * shake;
    this.camera.position.y += Math.cos(t * 11.7) * 0.004 * shake;
    this.camera.lookAt(c.clook);
    this.camera.rotateZ(c.croll);
    this.camera.fov = c.cfov - c.kick;
    this.camera.updateProjectionMatrix();

    // background
    const u = this.bgU, b = this.bgT;
    const kg = dampK(3.2, dt);
    u.uBase.value.lerp(b.base, kg);
    u.uCA.value.lerp(b.ca, kg);
    u.uCB.value.lerp(b.cb, kg);
    u.uPA.value.lerp(b.pa, kg);
    u.uPB.value.lerp(b.pb, kg);
    u.uIA.value = lerp(u.uIA.value, b.ia, kg);
    u.uIB.value = lerp(u.uIB.value, b.ib, kg);
    u.uSlant.value = lerp(u.uSlant.value, b.slant, kg);
    u.uField.value = lerp(u.uField.value, b.field, dampK(4, dt));
    u.uTime.value = t;
    u.uSlantPhase.value += vel * dt * 6;
    if (this.sweepT != null) {
      this.sweepT += dt * 2.6;
      u.uSweep.value = lerp(1.2, -1.2, this.sweepT);
      if (this.sweepT > 1) { this.sweepT = null; u.uSweep.value = -9; }
    }

    // lights
    const lc = this.lightC, lt = this.lightT;
    const kl = dampK(3, dt);
    lc.sweep = lerp(lc.sweep, lt.sweep, kl);
    lc.signal = lerp(lc.signal, lt.signal, kl);
    const sa = t * 0.45 + (lt.sweepAngle || 0);
    this.sweep.intensity = lc.sweep;
    this.sweep.position.set(Math.cos(sa) * 6, 2.5 + Math.sin(sa * 0.7) * 2, 4 + Math.sin(sa) * 2);
    this.signalLight.intensity = lc.signal;
    this.signalLight.position.set(-4 + Math.sin(t * 0.3) * 1.5, -2, 3);

    // post
    const pc = this.postC, pt = this.post;
    const kp = dampK(4, dt);
    pc.bloom = lerp(pc.bloom, pt.bloom, kp);
    pc.vig = lerp(pc.vig, pt.vig, kp);
    pc.grain = lerp(pc.grain, pt.grain, kp);
    pc.envInt = lerp(pc.envInt, pt.envInt, kp);
    pc.envRot = lerp(pc.envRot, pt.envRot, kp);
    pc.exposure = lerp(pc.exposure, pt.exposure, kp);
    const velCA = clamp(Math.abs(vel) * 0.012, 0, 0.018);
    pc.ca = lerp(pc.ca, pt.ca + velCA, dampK(6, dt));
    pc.line *= Math.exp(-dt * 9);
    pc.flash = lerp(pc.flash, pt.flash, dampK(10, dt));
    this.bloom.strength = pc.bloom;
    const fu = this.final.uniforms;
    fu.uCA.value = pc.ca;
    fu.uVig.value = pc.vig;
    fu.uGrain.value = pc.grain;
    fu.uTime.value = t;
    fu.uFlash.value = pc.flash;
    fu.uLine.value = pc.line;
    fu.uLineY.value = this.lineY ?? 0.5;
    fu.uFlashCol.value.copy(this.flashCol);
    this.scene.environmentIntensity = pc.envInt;
    this.scene.environmentRotation.set(0, pc.envRot + t * 0.05, 0);
    this.renderer.toneMappingExposure = pc.exposure;
  }

  render() { this.composer.render(); }

  // Compile every shader variant up front so no chapter stutters on first sight.
  async prewarm(groups) {
    const r = this.renderer;
    const vis = groups.map((g) => g.visible);
    groups.forEach((g) => (g.visible = true));
    const saved = this.logoMat.map((m) => m.m.transparent);
    try {
      for (const tr of [false, true]) {
        this.logoMat.forEach((m) => { m.m.transparent = tr; m.m.needsUpdate = true; });
        if (r.compileAsync) await r.compileAsync(this.scene, this.camera);
        else r.compile(this.scene, this.camera);
      }
      this.composer.render();
    } catch (e) { console.warn('prewarm', e); }
    this.logoMat.forEach((m, i) => { m.m.transparent = saved[i]; m.m.needsUpdate = true; });
    groups.forEach((g, i) => (g.visible = vis[i]));
  }

  // world point -> screen px; returns null if behind camera
  project(v, out = { x: 0, y: 0, z: 0 }) {
    const p = _v.copy(v).project(this.camera);
    out.x = (p.x * 0.5 + 0.5) * this.w;
    out.y = (-p.y * 0.5 + 0.5) * this.h;
    out.z = p.z;
    return out;
  }
  projectUV(v, out) {
    const p = _v.copy(v).project(this.camera);
    out.set(p.x * 0.5 + 0.5, p.y * 0.5 + 0.5);
    return out;
  }
}
const _v = new Vector3();
export { Euler, MathUtils };
