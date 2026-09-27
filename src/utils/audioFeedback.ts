/**
 * Web Audio API synthesizer for realistic traffic signal chimes & emergency alert
 * Pure programmatic sound synthesis (zero external audio file dependencies)
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Pleasant pedestrian signal change chime (two-tone melodic ding)
   */
  public playSignalChange(enabled: boolean) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.08); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Ignore audio policy restrictions
    }
  }

  /**
   * Ambulance Hi-Lo alternating two-tone siren
   */
  public playAmbulanceSiren(enabled: boolean) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      // Cycle: High (960Hz) -> Low (770Hz) -> High (960Hz)
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.setValueAtTime(770, now + 0.25);
      osc.frequency.setValueAtTime(960, now + 0.5);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.65);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.76);
    } catch {
      // Ignore audio policy restrictions
    }
  }

  /**
   * Fire Brigade dual-tone siren sweep with pneumatic air horn resonance
   */
  public playFireBrigadeSiren(enabled: boolean) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Heavy siren sweep
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.7);

      gain1.gain.setValueAtTime(0.07, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.76);

      // Low air-horn undertone
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, now); // D4 deep horn
      gain2.gain.setValueAtTime(0.06, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.52);
    } catch {
      // Ignore audio policy restrictions
    }
  }

  /**
   * Emergency vehicle priority alarm chirp
   */
  public playEmergencyAlert(enabled: boolean) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.2);
      osc.frequency.linearRampToValueAtTime(700, now + 0.4);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch {
      // Ignore audio policy restrictions
    }
  }
}

export const soundFx = new SoundSynthesizer();
