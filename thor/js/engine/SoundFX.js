/**
 * SoundFX.js
 * Zero-dependency procedural Web Audio API sound synthesizer for Marvel Mini-Games.
 * Delivers immediate retro/arcade audio feedback with zero external file requests.
 */

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.25, this.ctx.currentTime);
    }
    return this.muted;
  }

  play(name) {
    if (typeof this[name] === 'function') {
      try { this[name](); } catch (e) {}
    }
  }

  click() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }

  // Spider-Man Web Thwip
  thwip() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }

  // Captain America Shield Ricochet Clang
  shieldBounce() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [880, 1320, 1760].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq + (i * 40), t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.2);

        gain.gain.setValueAtTime(0.25 / (i + 1), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch (e) {}
  }

  // Iron Man Repulsor Blast
  repulsor() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(950, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.18);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  // Thor Thunder Strike
  thunder() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // White noise buffer for lightning crackle
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(t);
    } catch (e) {}
  }

  // Ant-Man Quantum Shift
  quantumShift(grow = false) {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      if (grow) {
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
      }

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  // Doctor Strange Portal Whoosh
  portal() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(660, t + 0.1);
      osc.frequency.linearRampToValueAtTime(330, t + 0.25);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.26);
    } catch (e) {}
  }

  // Scarlet Witch Reality Phase Swap
  realitySwap() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(550, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  // TVA / Loki Time Rewind Chirp
  timeRewind() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.15);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {}
  }

  // General Hit / Explosion
  hit() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (e) {}
  }

  // Victory Fanfare
  victory() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [440, 554, 659, 880];
      notes.forEach((f, idx) => {
        const t = this.ctx.currentTime + (idx * 0.1);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.26);
      });
    } catch (e) {}
  }

  // Defeat / Game Over Tone
  defeat() {
    this.gameOver();
  }

  gameOver() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [400, 350, 280, 200];
      notes.forEach((f, idx) => {
        const t = this.ctx.currentTime + (idx * 0.12);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch (e) {}
  }

  // Collectible pickup chime
  collect() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.06);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch (e) {}
  }

  // Combo streak ascending notes
  combo(level = 1) {
    if (this.muted || !this.ctx) return;
    try {
      const baseFreq = 600 + Math.min(level, 8) * 80;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  // Level Up / Stage Clear fanfare
  levelUp() {
    if (this.muted || !this.ctx) return;
    try {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, idx) => {
        const t = this.ctx.currentTime + (idx * 0.08);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch (e) {}
  }

  // Iron Man Unibeam - Powerful sustained energy beam
  unibeam() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // High energy laser charge and blast
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      osc.frequency.setValueAtTime(450, t + 0.2);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.9);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.setValueAtTime(0.5, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.9);
    } catch (e) {}
  }

  // Power Punch Heavy Impact
  heavyPunch() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.23);
    } catch (e) {}
  }

  // Thanos Cosmic Titan Blast
  titanBlast() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.35);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.4);
    } catch (e) {}
  }

  // Thanos Ground Shockwave / Infinity Wave
  cosmicWave() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.52);
    } catch (e) {}
  }

  // Attack Telegraph Warning Chime
  warningBeep() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(1100, t + 0.08);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  // Shield Block Deflect Clink
  blockDeflect() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1500, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {}
  }

  // Aliases for compatibility
  laser() { this.repulsor(); }
  explosion() { this.thunder(); }
  powerUp() { this.collect(); }

  // Deadpool Whistle Bomb
  deadpoolWhistle() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(250, t + 0.35);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.36);
    } catch (e) {}
  }

  // Cluster Bomb Mini Bursts
  clusterBurst() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450 - i * 60, t + offset);
        osc.frequency.exponentialRampToValueAtTime(80, t + offset + 0.08);

        gain.gain.setValueAtTime(0.3, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.09);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + offset);
        osc.stop(t + offset + 0.1);
      }
    } catch (e) {}
  }

  // Mystical Portal Swirl (Doctor Strange)
  portalWarp() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major chord shimmer
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.linearRampToValueAtTime(f * 1.25, t + 0.25);
        osc.frequency.exponentialRampToValueAtTime(f, t + 0.45);

        gain.gain.setValueAtTime(0.12 / (idx + 1), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + idx * 0.03);
        osc.stop(t + 0.48);
      });
    } catch (e) {}
  }

  // Reality Glitch / Polarity Swap (Scarlet Witch)
  realityGlitch() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(140, t + 0.06);
      osc.frequency.linearRampToValueAtTime(880, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.22);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.23);
    } catch (e) {}
  }

  // Chaos Magic Energy Beam (Scarlet Witch)
  chaosBlast() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.28);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {}
  }

  // Time Loop Rewind (TVA Loki)
  timeRewind() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.3);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.33);
    } catch (e) {}
  }

  // Procedural BGM Synthesizer (Marvel Heroic Pulse)
  initBGM() {
    this.bgmPlaying = false;
    this.bgmInterval = null;
    this.bgmStep = 0;
  }

  toggleBGM() {
    this.init();
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  startBGM() {
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Cinematic chord progression (D minor, Bb major, F major, C major)
    const chords = [
      [146.83, 220.00, 261.63], // Dm
      [116.54, 174.61, 233.08], // Bb
      [174.61, 220.00, 261.63], // F
      [130.81, 196.00, 261.63]  // C
    ];

    const pulseNotes = [146.83, 174.61, 220.00, 293.66];

    this.bgmInterval = setInterval(() => {
      if (this.muted || !this.bgmPlaying || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const chordIdx = Math.floor(this.bgmStep / 4) % chords.length;
        const chord = chords[chordIdx];
        const pulse = pulseNotes[this.bgmStep % pulseNotes.length];

        // Bass/Pad tone
        if (this.bgmStep % 4 === 0) {
          chord.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.005, t + 0.9);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.95);
          });
        }

        // Arpeggiated pulse
        const pulseOsc = this.ctx.createOscillator();
        const pulseGain = this.ctx.createGain();
        pulseOsc.type = 'sine';
        pulseOsc.frequency.setValueAtTime(pulse * 1.5, t);
        pulseGain.gain.setValueAtTime(0.03, t);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        pulseOsc.connect(pulseGain);
        pulseGain.connect(this.masterGain);
        pulseOsc.start(t);
        pulseOsc.stop(t + 0.22);

        this.bgmStep = (this.bgmStep + 1) % 16;
      } catch (e) {}
    }, 240); // ~125 BPM
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

window.soundFX = new SoundFX();


