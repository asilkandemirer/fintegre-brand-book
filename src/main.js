// Fintegre Brand Book — entry point.
// The page scroll is only a clock: scrollY → T (in chapter units). Every frame the
// current chapter turns its local progress into targets for the world, the text
// layer decides what should be on screen, and the world eases towards it all.
import { World, isLite } from './world.js';
import { FXManager, TextFX, reduceMotion } from './textfx.js';
import { Labels } from './labels.js';
import { sound } from './audio.js';
import { logoSVG } from './logo.js';
import { clamp, dampK } from './util.js';
import intro from './ch/c00_intro.js';
import promise from './ch/c01_promise.js';
import colour from './ch/c02_colour.js';
import slant from './ch/c03_slant.js';
import matter from './ch/c04_matter.js';
import type from './ch/c05_type.js';
import position from './ch/c06_position.js';
import ecosystem from './ch/c07_ecosystem.js';
import montage from './ch/c08_montage.js';
import voice from './ch/c09_voice.js';
import rollout from './ch/c10_rollout.js';
import outro from './ch/c11_outro.js';

const CH = [intro, promise, colour, slant, matter, type, position, ecosystem, montage, voice, rollout, outro];
let acc = 0;
for (const ch of CH) { ch.start = acc; acc += ch.len; }
const TOTAL = acc;

const $ = (id) => document.getElementById(id);
const VW = () => Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
const VH = () => Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
const QA = typeof location !== 'undefined' && /[?&]qa/.test(location.search);
const pad2 = (n) => String(n).padStart(2, '0');

async function boot() {
  document.body.classList.add('locked');
  $('brand-mark').innerHTML = logoSVG({ h: 40, gradient: ['#3047EC', '#B7D7FF'] });

  // fonts are inlined; wait for them so measurements and canvas textures are right
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* ignore */ }

  let world = null;
  try { world = new World($('gl')); } catch (e) {
    console.warn('WebGL unavailable', e);
    document.documentElement.classList.add('no-gl');
  }

  const fxm = new FXManager();
  fxm.scan($('chapters'));
  const manual = (id, kind) => {
    const el = $(id);
    el.dataset.fx = kind;
    const fx = new TextFX(el);
    el.__fx = fx;
    fxm.items.push(fx);
    return fx;
  };
  const ctrFx = manual('ctr', 'label');
  manual('mont-word', 'big');
  manual('roll-name', 'label');

  const labels = world ? new Labels($('labels'), world, fxm) : null;
  const c = { w: world, labels, sound, fxm, t: performance.now(), dt: 0.016, vel: 0, T: 0, portrait: false, aspect: 1, halfW0: 1 };

  // ---- layout + scroll track
  const track = $('track');
  let unit = VH();
  let lastW = VW();
  const setLayout = () => {
    c.aspect = VW() / VH();
    c.portrait = c.aspect < 0.9;
    c.halfW0 = Math.tan((15 * Math.PI) / 180) * 9 * c.aspect;
  };
  const setTrack = () => { track.style.height = Math.round(TOTAL * unit + VH()) + 'px'; };
  setLayout();
  setTrack();

  if (world) {
    for (const ch of CH) ch.build?.(c);
    const groups = [];
    for (const ch of CH) for (const k of ['group', 'root', 'ring', 'lines']) if (ch[k]) groups.push(ch[k]);
    await world.prewarm(groups);
  }

  fxm.measureAll();

  // ---- chapter rail + index
  const rail = $('rail');
  const list = $('idx-list');
  CH.forEach((ch, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `${pad2(i)} ${ch.title}`);
    b.title = ch.title;
    b.addEventListener('click', () => jump(i));
    rail.appendChild(b);
    const li = document.createElement('li');
    li.innerHTML = `<button style="transition-delay:${i * 35}ms"><span class="n">${pad2(i)}</span><span class="t">${ch.title}</span><span class="k">${ch.cat}</span></button>`;
    li.querySelector('button').addEventListener('click', () => { closeIndex(); jump(i); });
    list.appendChild(li);
  });
  const railBtns = [...rail.children];
  const idxBtns = [...list.querySelectorAll('button')];
  const idx = $('index');
  const openIndex = () => {
    idx.hidden = false;
    requestAnimationFrame(() => idx.classList.add('open'));
    sound.click();
    $('idx-close').focus();
  };
  const closeIndex = () => { idx.classList.remove('open'); idx.hidden = true; };
  $('idx-btn').addEventListener('click', openIndex);
  $('idx-btn2').addEventListener('click', openIndex);
  $('idx-close').addEventListener('click', closeIndex);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !idx.hidden) closeIndex();
  });

  let teleport = false;
  function jump(i) {
    const T = CH[i].start + (i === 0 ? 0 : 0.015);
    teleport = true;
    window.scrollTo({ top: T * unit, behavior: 'instant' });
    sound.whoosh(0.5, 1.2);
  }
  $('replay').addEventListener('click', () => jump(0));

  // ---- sound UI
  const sndBtn = $('snd');
  const setSoundUI = (on) => {
    sndBtn.classList.toggle('snd-on', on);
    sndBtn.setAttribute('aria-pressed', String(on));
    $('snd-txt').textContent = on ? 'Sound on' : 'Sound off';
  };
  sndBtn.addEventListener('click', () => {
    if (!sound.ctx) sound.start();
    else sound.setOn(!sound.on);
    setSoundUI(sound.on);
    sound.click();
  });

  // ---- gate
  const gate = $('gate');
  let entered = false;
  const enter = (withSound) => {
    if (entered) return;
    entered = true;
    if (withSound) { sound.start(); setSoundUI(true); }
    gate.classList.add('out');
    document.body.classList.remove('locked');
    setTimeout(() => { gate.hidden = true; }, 800);
    if (world) world.punch(0.6);
    sound.whoosh(0.6, 1);
  };
  $('enter-snd').addEventListener('click', () => enter(true));
  $('enter-mute').addEventListener('click', () => enter(false));

  // ---- reveals (wordmark) + call-to-action
  const reveals = [...document.querySelectorAll('[data-rv]')].map((el) => ({ el, ch: +el.dataset.ch, a: +el.dataset.in, b: +el.dataset.out }));
  const cta = $('cta');
  const sections = CH.map((ch) => $('ch-' + ch.id));
  const prog = $('prog');

  // ---- resize
  let measureTimer = 0;
  window.addEventListener('resize', () => {
    const w = VW(), h = VH();
    const T = Number.isFinite(c.T) ? c.T : 0;
    if (w !== lastW || Math.abs(h - unit) > unit * 0.25 || unit < 50) {
      lastW = w;
      unit = h;
      setTrack();
      window.scrollTo({ top: T * unit, behavior: 'instant' });
    }
    setLayout();
    world?.resize();
    clearTimeout(measureTimer);
    measureTimer = setTimeout(() => { fxm.measureAll(); labels?.measure(); }, 180);
  });

  // ---- main loop
  let T = clamp(window.scrollY / unit, 0, TOTAL);
  let Tprev = T;
  let cur = -1;
  let last = performance.now();
  let perfAcc = 0, perfN = 0;
  let vel = 0;
  let isLightNow = false;

  const locate = (t) => {
    for (let i = 0; i < CH.length; i++) if (t < CH[i].start + CH[i].len) return i;
    return CH.length - 1;
  };

  function onChapter(i, prev) {
    cur = i;
    const ch = CH[i];
    railBtns.forEach((b, k) => b.classList.toggle('on', k === i));
    idxBtns.forEach((b, k) => b.classList.toggle('cur', k === i));
    ctrFx.replace(`${pad2(i)} / ${pad2(CH.length - 1)} <span class="ctr-name">— ${ch.title}</span>`);
    if (ctrFx.state === 'hidden') ctrFx.show(performance.now(), true);
    ch.enter?.(c, i > prev ? 1 : -1);
    if (prev !== -1) sound.whoosh(0.45, 0.6);
  }

  function frame(now) {
    const dt = Math.min(QA ? 0.5 : 0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    let Tt = clamp(window.scrollY / unit, 0, TOTAL);
    if (!Number.isFinite(Tt)) Tt = 0;
    if (!Number.isFinite(T)) { T = Tt; Tprev = Tt; vel = 0; teleport = true; }
    if (teleport || Math.abs(Tt - T) > 2.5) {
      T = Tt;
      teleport = false;
      const i = locate(T);
      CH[i].update(clamp((T - CH[i].start) / CH[i].len), { ...c, T });
      world?.snapAll();
      world?.punch(0.8);
      Tprev = T;
    } else {
      T += (Tt - T) * dampK(reduceMotion ? 14 : 6.5, dt);
      if (Math.abs(Tt - T) < 1e-5) T = Tt;
    }
    const v = (T - Tprev) / dt;
    vel += (v - vel) * 0.25;
    Tprev = T;

    c.t = now; c.dt = dt; c.vel = vel; c.T = T;
    const i = locate(T);
    if (i !== cur) onChapter(i, cur);
    {
      const ch = CH[i];
      const u = clamp((T - ch.start) / ch.len);
      const light = ch.isLight ? ch.isLight(u) : ch.theme === 'light';
      if (light !== isLightNow) { isLightNow = light; document.documentElement.classList.toggle('light', light); }
    }
    if (world) {
      const ch = CH[i];
      ch.update(clamp((T - ch.start) / ch.len), c);
      for (const k of CH) k.tick?.((T - k.start) / k.len, c);
      // a zero-sized first frame (hidden iframe) must never poison the eased state
      if (!Number.isFinite(world.L.cscale) || !Number.isFinite(world.cam.cpos.x) || !Number.isFinite(world.cam.cfov)) world.snapAll();
      world.update(dt, now, vel);
      labels.update(now);
    }
    fxm.sync((n) => (T - CH[n].start) / CH[n].len, now);
    for (const r of reveals) {
      const u = (T - CH[r.ch].start) / CH[r.ch].len;
      const on = u >= r.a && u < r.b;
      if (on !== r.el.classList.contains('rv-on')) r.el.classList.toggle('rv-on', on);
    }
    CH.forEach((k, n) => {
      const p = (T - k.start) / k.len;
      const on = p > -0.02 && p < 1.02;
      const el = sections[n];
      if (el && on !== el.classList.contains('on')) el.classList.toggle('on', on);
    });
    const uo = (T - outro.start) / outro.len;
    cta.classList.toggle('on', uo > 0.42);
    prog.style.transform = `scaleX(${(T / TOTAL).toFixed(4)})`;
    sound.motion(vel);

    if (world) {
      world.render();
      // adaptive resolution: if frames are slow, render fewer pixels
      perfAcc += dt; perfN++;
      if (perfAcc > 2.5) {
        const avg = perfAcc / perfN;
        if (avg > 0.03 && world.dpr > 1) { world.dpr = Math.max(1, world.dpr - 0.25); world.resize(); }
        perfAcc = 0; perfN = 0;
      }
    }
    requestAnimationFrame(frame);
  }
  onChapter(locate(T), -1);
  requestAnimationFrame(frame);

  // hooks for automated checks
  window.__fin = {
    CH, TOTAL,
    get T() { return T; },
    get unit() { return unit; },
    enter,
    seek(t) { teleport = true; window.scrollTo({ top: t * unit, behavior: 'instant' }); },
    world, isLite,
  };
  document.documentElement.classList.add('ready');
}

boot();
