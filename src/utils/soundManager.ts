import { useSettingsStore } from '../store/useSettingsStore';

export type SoundEffectType =
  | 'click'
  | 'tab'
  | 'coin'
  | 'purchase'
  | 'star'
  | 'gameWin'
  | 'correct'
  | 'incorrect'
  | 'step'
  | 'bump'
  | 'mascot'
  | 'equip'
  | 'unequip'
  | 'streak';

class SoundEffectManager {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isUnlocked = false;
  private lastSoundTimes: Partial<Record<SoundEffectType, number>> = {};

  constructor() {
    // Automatically attach unlock listeners
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      try {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);
        this.syncVolume();
      } catch (err) {
        console.warn('[SoundManager] Web Audio API init failed:', err);
        return null;
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public unlockAudio() {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (ctx) {
      this.isUnlocked = true;
    }
  }

  public syncVolume() {
    if (!this.masterGain || !this.audioCtx) return;
    try {
      const { soundEnabled, soundVolume } = useSettingsStore.getState();
      const targetGain = soundEnabled ? Math.max(0, Math.min(1, soundVolume ?? 0.7)) : 0;
      this.masterGain.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
    } catch {
      // Ignore audio sync issues
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    useSettingsStore.getState().setSoundVolume(clamped);
    this.syncVolume();
  }

  public toggleMute() {
    useSettingsStore.getState().toggleSound();
    this.syncVolume();
  }

  public setEnabled(enabled: boolean) {
    useSettingsStore.getState().setSoundEnabled(enabled);
    this.syncVolume();
  }

  public isMuted(): boolean {
    return !useSettingsStore.getState().soundEnabled;
  }

  public getVolume(): number {
    return useSettingsStore.getState().soundVolume ?? 0.7;
  }

  /**
   * Play a synthesized sound effect.
   * rateLimitMs prevents distortion if a trigger is hit repeatedly within milliseconds.
   */
  public play(type: SoundEffectType, force = false) {
    const { soundEnabled } = useSettingsStore.getState();
    if (!soundEnabled && !force) return;

    const now = Date.now();
    const lastPlayed = this.lastSoundTimes[type] || 0;
    // Throttle duplicate audio triggers (e.g. multiple coin calls in 50ms)
    const minGap = type === 'click' ? 40 : type === 'coin' ? 60 : 100;
    if (now - lastPlayed < minGap) return;
    this.lastSoundTimes[type] = now;

    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      this.syncVolume();

      switch (type) {
        case 'click':
          this.synthesizeClick(ctx, t);
          break;
        case 'tab':
          this.synthesizeTab(ctx, t);
          break;
        case 'coin':
          this.synthesizeCoin(ctx, t);
          break;
        case 'purchase':
          this.synthesizePurchase(ctx, t);
          break;
        case 'star':
          this.synthesizeStar(ctx, t);
          break;
        case 'gameWin':
          this.synthesizeWin(ctx, t);
          break;
        case 'correct':
          this.synthesizeCorrect(ctx, t);
          break;
        case 'incorrect':
          this.synthesizeIncorrect(ctx, t);
          break;
        case 'step':
          this.synthesizeStep(ctx, t);
          break;
        case 'bump':
          this.synthesizeBump(ctx, t);
          break;
        case 'mascot':
          this.synthesizeMascot(ctx, t);
          break;
        case 'equip':
          this.synthesizeEquip(ctx, t);
          break;
        case 'unequip':
          this.synthesizeUnequip(ctx, t);
          break;
        case 'streak':
          this.synthesizeStreak(ctx, t);
          break;
      }
    } catch (err) {
      // Audio execution silent fallback
    }
  }

  // --- Child-Friendly Web Audio Synthesizers ---

  /** Soft tactile bubble pop for UI clicks */
  private synthesizeClick(ctx: AudioContext, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.045);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  /** Subtle higher blip for tab switches */
  private synthesizeTab(ctx: AudioContext, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(840, t);
    osc.frequency.exponentialRampToValueAtTime(1050, t + 0.035);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  /** Cheerful retro coin pickup shimmer (Dual-tone with trailing chime) */
  private synthesizeCoin(ctx: AudioContext, t: number) {
    // Primary Tone: B5 (987.77 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, t);
    gain1.gain.setValueAtTime(0.18, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc1.connect(gain1);
    gain1.connect(this.masterGain!);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // Sparkle Secondary Tone: E6 (1318.51 Hz) ringing out
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, t + 0.07);
    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.setValueAtTime(0.2, t + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc2.connect(gain2);
    gain2.connect(this.masterGain!);
    osc2.start(t + 0.07);
    osc2.stop(t + 0.28);

    // Extra high overtone shimmer (B6: 1975.53 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1975.53, t + 0.09);
    gain3.gain.setValueAtTime(0.001, t);
    gain3.gain.setValueAtTime(0.06, t + 0.09);
    gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc3.connect(gain3);
    gain3.connect(this.masterGain!);
    osc3.start(t + 0.09);
    osc3.stop(t + 0.25);
  }

  /** Upbeat cash register / store bell chime */
  private synthesizePurchase(ctx: AudioContext, t: number) {
    const notes = [784.0, 1046.5, 1318.5]; // G5 -> C6 -> E6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  /** Twinkling star crystal arpeggio */
  private synthesizeStar(ctx: AudioContext, t: number) {
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = t + i * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.14, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteStart);
      osc.stop(noteStart + 0.24);
    });
  }

  /** Joyful, celebratory fanfare for game completions */
  private synthesizeWin(ctx: AudioContext, t: number) {
    // Fanfare melody notes: C5, E5, G5, high C6 (held)
    const melody = [
      { f: 523.25, start: 0, dur: 0.12 },
      { f: 659.25, start: 0.12, dur: 0.12 },
      { f: 783.99, start: 0.24, dur: 0.14 },
      { f: 1046.5, start: 0.38, dur: 0.45 },
    ];

    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + note.start;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, start);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + note.dur);
    });

    // Harmonizing triumphal major chord on final note (G5 + E6)
    const harmony = [783.99, 1318.51];
    harmony.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + 0.38;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  /** Warm, encouraging chime for correct answers */
  private synthesizeCorrect(ctx: AudioContext, t: number) {
    const notes = [
      { f: 523.25, start: 0, dur: 0.1 },     // C5
      { f: 659.25, start: 0.08, dur: 0.18 },  // E5
      { f: 783.99, start: 0.16, dur: 0.25 },  // G5
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + n.start;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, start);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + n.dur);
    });
  }

  /** Gentle friendly "boop-boop" for incorrect answers */
  private synthesizeIncorrect(ctx: AudioContext, t: number) {
    const notes = [
      { f: 293.66, start: 0, dur: 0.15 },    // D4
      { f: 246.94, start: 0.12, dur: 0.2 },  // B3
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + n.start;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, start);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + n.dur);
    });
  }

  /** Soft maze step tick */
  private synthesizeStep(ctx: AudioContext, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.035);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  /** Gentle wall bump thump */
  private synthesizeBump(ctx: AudioContext, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.07);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /** Playful companion mascot chirp / purr */
  private synthesizeMascot(ctx: AudioContext, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1150, t + 0.16);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /** Satisfying dress-up swoosh */
  private synthesizeEquip(ctx: AudioContext, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /** Soft pop when unequipping */
  private synthesizeUnequip(ctx: AudioContext, t: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /** Energetic streak burst */
  private synthesizeStreak(ctx: AudioContext, t: number) {
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.22);
    });
  }
}

export const soundManager = new SoundEffectManager();
