/**
 * Procedural Web Audio API soundscape for Waters of Srivijaya.
 * Zero external audio assets — all water lap, bronze gongs, bamboo flutes,
 * rope lashings, and coin chimes are synthesized cleanly on demand.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private waterGain: GainNode | null = null;
  private waterStarted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.waterGain && this.ctx) {
      this.waterGain.gain.setTargetAtTime(muted ? 0 : 0.045, this.ctx.currentTime, 0.15);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.waterStarted) {
      this.startAmbientRiver();
    }
  }

  private startAmbientRiver(): void {
    if (!this.ctx || this.waterStarted) return;
    this.waterStarted = true;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;

    const gain = this.ctx.createGain();
    gain.gain.value = this.muted ? 0 : 0.045;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    this.waterGain = gain;
  }

  public playGong(freq = 196): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const partials = [1, 1.52, 2.02, 2.95];
    partials.forEach((ratio, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * ratio, now);
      osc.frequency.exponentialRampToValueAtTime(freq * ratio * 0.992, now + 2.4);

      const amp = 0.12 / (idx + 1);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 2.4 - idx * 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.5);
    });
  }

  public playBambooChime(step = 0): void {
    if (this.muted || !this.ctx) return;
    // Nusantara slendro-inspired pentatonic frequencies
    const scale = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const freq = scale[step % scale.length];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playRopeSnap(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.09);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCoinTrade(): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.001, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.075, now + i * 0.07 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.07 + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.35);
    });
  }
}

export const audioEngine = new AudioEngine();
