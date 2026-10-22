// Synthesised sound design. No audio files: every sound is generated with Web Audio,
// so the page stays light and every tick can vary slightly like a real mechanism.

const now = () => performance.now();

class Sound {
  constructor() {
    this.ctx = null;
    this.on = false;
    this.last = { head: 0, body: 0, label: 0, whoosh: 0, haptic: 0 };
    this.vel = 0;
  }

  // Must be called from a user gesture.
  start() {
    if (this.ctx) {
      this.ctx.resume?.();
      this.setOn(true);
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    // One second of white noise, reused by every noisy voice.
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this.buildAmbient();
    this.setOn(true);
  }

  setOn(v) {
    this.on = v;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(v ? 0.8 : 0, t, 0.12);
  }

  buildAmbient() {
    const ctx = this.ctx;
    this.amb = ctx.createGain();
    this.amb.gain.value = 0.0;
    const lp = (this.ambLP = ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 0.6;
    lp.connect(this.amb).connect(this.master);
    const freqs = [55, 82.41, 110.3];
    for (const f of freqs) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = f === 55 ? 0.5 : 0.22;
      o.connect(g).connect(lp);
      o.start();
      // slow beating so the drone breathes
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + Math.random() * 0.07;
      const lg = ctx.createGain();
      lg.gain.value = 0.6;
      lfo.connect(lg).connect(o.detune);
      lfo.start();
    }
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    n.loop = true;
    const nb = ctx.createBiquadFilter();
    nb.type = 'bandpass';
    nb.frequency.value = 900;
    nb.Q.value = 0.4;
    const ng = (this.windGain = ctx.createGain());
    ng.gain.value = 0;
    n.connect(nb).connect(ng).connect(this.master);
    this.windBP = nb;
    n.start();
    const t = ctx.currentTime;
    this.amb.gain.setTargetAtTime(0.05, t, 1.5);
  }

  // Called every frame with scroll velocity (time units per second).
  motion(v) {
    if (!this.ctx || !this.on) return;
    const a = Math.min(1, Math.abs(v) * 1.6);
    this.vel += (a - this.vel) * 0.08;
    const t = this.ctx.currentTime;
    this.ambLP.frequency.setTargetAtTime(260 + this.vel * 1400, t, 0.12);
    this.amb.gain.setTargetAtTime(0.045 + this.vel * 0.05, t, 0.2);
    this.windGain.gain.setTargetAtTime(this.vel * 0.01, t, 0.2);
    this.windBP.frequency.setTargetAtTime(500 + this.vel * 1800, t, 0.2);
  }

  env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  noiseVoice(t, { freq, q = 1, peak = 0.3, attack = 0.001, decay = 0.03, type = 'bandpass', pan = 0 }) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, peak, attack, decay);
    let node = s.connect(f).connect(g);
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node = node.connect(p);
    }
    node.connect(this.master);
    s.start(t, Math.random() * 0.8);
    s.stop(t + attack + decay + 0.05);
  }

  toneVoice(t, { freq, to = null, peak = 0.2, attack = 0.002, decay = 0.08, type = 'sine', pan = 0 }) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
    const g = ctx.createGain();
    this.env(g, t, peak, attack, decay);
    let node = o.connect(g);
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node = node.connect(p);
    }
    node.connect(this.master);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  // A typewriter / haptic tick. kind: head | body | label. x: -1..1 stereo position.
  key(kind = 'body', x = 0) {
    if (!this.ctx || !this.on) return;
    const n = now();
    const gap = kind === 'head' ? 34 : kind === 'body' ? 26 : 30;
    if (n - this.last[kind] < gap) return;
    this.last[kind] = n;
    const t = this.ctx.currentTime + 0.003;
    const r = Math.random();
    const pan = Math.max(-0.7, Math.min(0.7, x * 0.7));
    if (kind === 'head') {
      this.noiseVoice(t, { freq: 1700 + r * 700, q: 1.4, peak: 0.08, decay: 0.03, pan });
      this.toneVoice(t, { freq: 150 + r * 40, to: 90, peak: 0.11, decay: 0.06, pan });
    } else if (kind === 'body') {
      this.noiseVoice(t, { freq: 3300 + r * 900, q: 1.8, peak: 0.035, decay: 0.02, pan });
      this.toneVoice(t, { freq: 240 + r * 40, to: 160, peak: 0.032, decay: 0.035, pan });
    } else {
      this.noiseVoice(t, { freq: 5200 + r * 900, q: 2.5, peak: 0.028, decay: 0.014, pan });
    }
    this.haptic(kind === 'head' ? 3 : 2);
  }

  // Wind sweeping from right to left (text exit).
  whoosh(dur = 0.42, strength = 1) {
    if (!this.ctx || !this.on) return;
    const n = now();
    if (n - this.last.whoosh < 90) return;
    this.last.whoosh = n;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.005;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(520, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055 * strength, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = s.connect(f).connect(g);
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.setValueAtTime(0.8, t);
      p.pan.linearRampToValueAtTime(-0.8, t + dur);
      node = node.connect(p);
    }
    node.connect(this.master);
    s.start(t, Math.random() * 0.4);
    s.stop(t + dur + 0.05);
  }

  // Heavy impact for zoom punches and the mark slamming together.
  thump(strength = 1) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + 0.003;
    this.toneVoice(t, { freq: 120, to: 36, peak: 0.55 * strength, attack: 0.004, decay: 0.34 });
    this.noiseVoice(t, { freq: 900, q: 0.7, type: 'lowpass', peak: 0.18 * strength, decay: 0.08 });
    this.haptic(18);
  }

  // Soft pitched bloom used when colour spheres are born or split.
  pop(freq = 440, pan = 0) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + 0.003;
    this.toneVoice(t, { freq: freq * 0.7, to: freq, peak: 0.12, attack: 0.01, decay: 0.5, type: 'sine', pan });
    this.toneVoice(t, { freq: freq * 2, peak: 0.03, attack: 0.005, decay: 0.7, type: 'triangle', pan });
    this.haptic(8);
  }

  glass() {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + 0.003;
    const base = [1318.5, 1975.5, 2637][Math.floor(Math.random() * 3)];
    this.toneVoice(t, { freq: base, peak: 0.05, attack: 0.002, decay: 1.4 });
    this.toneVoice(t, { freq: base * 1.5, peak: 0.025, attack: 0.002, decay: 1.0 });
  }

  // Short UI click.
  click() {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + 0.002;
    this.noiseVoice(t, { freq: 2600, q: 2, peak: 0.12, decay: 0.02 });
    this.toneVoice(t, { freq: 420, to: 300, peak: 0.08, decay: 0.05 });
  }

  haptic(ms) {
    if (!this.on || !navigator.vibrate) return;
    const n = now();
    if (n - this.last.haptic < 45) return;
    this.last.haptic = n;
    try { navigator.vibrate(ms); } catch (e) { /* not allowed in this frame */ }
  }
}

export const sound = new Sound();
