// One signature sound for the whole brand book: a soft two-note chime (Deep Indigo's A3
// and Ice Blue's F#4) that plays when the mark assembles. Off by default; the viewer turns it on.
class Sound {
  constructor() { this.ctx = null; this.on = false; }

  toggle() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    this.on = !this.on;
    if (this.on && this.ctx.state === 'suspended') this.ctx.resume();
    return this.on;
  }

  chime() {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + 0.02;
    [[220, 0], [369.99, 0.16]].forEach(([f, d]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = f * 2.01;
      const g = ctx.createGain();
      const g2 = ctx.createGain();
      g2.gain.value = 0.12;
      g.gain.setValueAtTime(0, t0 + d);
      g.gain.linearRampToValueAtTime(0.22, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 2.2);
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(this.master);
      o.start(t0 + d); o2.start(t0 + d);
      o.stop(t0 + d + 2.3); o2.stop(t0 + d + 2.3);
    });
  }
}

export const sound = new Sound();
