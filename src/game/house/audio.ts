// Tiny synthesised sound effects (no audio files). Created on the first user
// gesture, as browsers require.

export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try { this.ctx = new Ctor(); } catch { this.ctx = null; }
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(at: number, dur: number, freq: number, gain = 0.08) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + at;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const amp = ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start(t0);
  }

  pickup() { this.tone(880, 0, 0.12, 'triangle'); this.tone(1320, 0.07, 0.16, 'triangle'); }
  golden() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.07, 0.35, 'triangle', 0.1)); }
  door(open: boolean) { this.noise(0, 0.18, open ? 500 : 320, 0.06); this.tone(open ? 140 : 110, 0.02, 0.12, 'sine', 0.05); }
  window() { this.noise(0, 0.12, 1400, 0.04); }
  win() { [392, 523, 659, 784].forEach((f, i) => this.tone(f, i * 0.11, 0.5, 'triangle', 0.1)); this.tone(1047, 0.5, 0.8, 'sine', 0.08); }
  bump() { this.tone(90, 0, 0.08, 'sine', 0.05); }
}
