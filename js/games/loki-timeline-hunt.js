/**
 * loki-timeline-hunt.js — V2 OVERHAUL
 * LOKI: TIMELINE HUNT — Marvel Multiverse Mini-Game Prototype V2
 * 
 * V2 Visual & Audio Engine:
 * - Pixel-Art Loki with physics-simulated emerald cape, golden helmet gleam, and sorcery particles.
 * - Dynamic procedural environments with volumetric lighting, dust motes, oscilloscope CRT, and cosmic rifts.
 * - In-World Floating HUD (radial stability ring, orbiting belt inventory, floating holographic prompts).
 * - Cinematic TVA time-door portal tear transition with reality shattering and screen shake.
 * - Pixel-art collectible items with bezier flight trajectory arcs on pickup.
 * - Web Audio API procedural audio engine for timeline-specific ambient soundscapes and sci-fi SFX.
 * 
 * Puzzle Mechanics Preserved:
 * 1. Ancient TVA Keycard (PAST archival table)
 * 2. Hydraulic Crowbar (FUTURE blast door zone)
 *    -> Used in PAST to pry structural blast door brace
 *    -> Causes blast door in PRESENT to buckle open over decades!
 * 3. Temporal Core (PRESENT Engineering pedestal, unlocked with Keycard)
 * 4. Loom Component (FUTURE high catwalk, climbed via collapsed girder ramp)
 * 
 * Returning all 3 key artifacts to the PRESENT Stabilization Loom stabilizes the timeline!
 */

class TVAAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.currentEra = 'PRESENT';
    
    // Ambient sound nodes
    this.pastGain = null;
    this.presentGain = null;
    this.futureGain = null;
    this.masterAmbientGain = null;
    this.ambientRunning = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupAmbience();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterAmbientGain && this.ctx) {
      this.masterAmbientGain.gain.setValueAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime);
    }
    return this.muted;
  }

  setupAmbience() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Master ambient bus
    this.masterAmbientGain = this.ctx.createGain();
    this.masterAmbientGain.gain.setValueAtTime(this.muted ? 0 : 0.28, now);
    this.masterAmbientGain.connect(this.ctx.destination);

    // 1. PAST: Filtered warm airflow / gentle wind
    this.pastGain = this.ctx.createGain();
    this.pastGain.gain.setValueAtTime(0, now);
    this.pastGain.connect(this.masterAmbientGain);
    this.createWindGenerator(this.pastGain);

    // 2. PRESENT: 60Hz/120Hz power hum + rhythmic TVA clock ticking
    this.presentGain = this.ctx.createGain();
    this.presentGain.gain.setValueAtTime(1, now);
    this.presentGain.connect(this.masterAmbientGain);
    this.createTVAHum(this.presentGain);

    // 3. FUTURE: Dark void drone (42Hz) + cosmic frequency modulation
    this.futureGain = this.ctx.createGain();
    this.futureGain.gain.setValueAtTime(0, now);
    this.futureGain.connect(this.masterAmbientGain);
    this.createVoidDrone(this.futureGain);

    this.ambientRunning = true;
  }

  createWindGenerator(targetNode) {
    // Generate pink-filtered noise buffer for soft wind
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.15;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(targetNode);
    whiteNoise.start();
  }

  createTVAHum(targetNode) {
    // 60Hz fundamental + 120Hz harmonic for classic electrical power hum
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(120, this.ctx.currentTime);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    osc1.connect(targetNode);
    osc2.connect(osc2Gain);
    osc2Gain.connect(targetNode);

    osc1.start();
    osc2.start();
  }

  createVoidDrone(targetNode) {
    // 42Hz low drone with slow frequency sweep for eerie void feel
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(42, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);
    lfo.connect(filter.frequency);

    osc.connect(filter);
    filter.connect(targetNode);

    osc.start();
    lfo.start();
  }

  setEra(era) {
    if (!this.ctx || !this.ambientRunning) return;
    this.currentEra = era;
    const now = this.ctx.currentTime;
    const t = 0.6; // smooth crossfade duration

    if (this.pastGain) {
      this.pastGain.gain.cancelScheduledValues(now);
      this.pastGain.gain.setTargetAtTime(era === 'PAST' ? 1.0 : 0.0, now, t);
    }
    if (this.presentGain) {
      this.presentGain.gain.cancelScheduledValues(now);
      this.presentGain.gain.setTargetAtTime(era === 'PRESENT' ? 1.0 : 0.0, now, t);
    }
    if (this.futureGain) {
      this.futureGain.gain.cancelScheduledValues(now);
      this.futureGain.gain.setTargetAtTime(era === 'FUTURE' ? 1.0 : 0.0, now, t);
    }
  }

  // --- Procedural SFX ---
  playPortal() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Gliding whoosh oscillator
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.7);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(3, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  playCollect() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [554.37, 659.25, 830.61, 1108.73]; // C#5, E5, G#5, C#6 arpeggio

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.55);
    });
  }

  playPry() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Metallic groaning clank
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  playJump() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playDeny() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Dissonant double-beep
    [220, 233.08].forEach(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  playVictory() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Ascending glorious major 7th fanfare
    const chords = [
      [329.63, 415.30, 493.88], // E major
      [369.99, 440.00, 554.37], // F#m
      [415.30, 523.25, 622.25], // G#m
      [493.88, 622.25, 739.99, 987.77] // B major triumphant
    ];

    chords.forEach((chord, cIdx) => {
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + cIdx * 0.18);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now + cIdx * 0.18);
        gain.gain.linearRampToValueAtTime(0.18, now + cIdx * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + cIdx * 0.18 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + cIdx * 0.18);
        osc.stop(now + cIdx * 0.18 + 1.25);
      });
    });
  }

  playDefeat() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.82);
  }
}

class LokiTimelineHuntGame {
  constructor(canvasId = 'gameCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Logical dimensions
    this.width = 960;
    this.height = 540;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Audio Engine
    this.audioEngine = new TVAAudioEngine();

    // Game state: 'START', 'MISSION', 'PLAYING', 'VICTORY', 'GAMEOVER'
    this.state = 'START';
    this.stability = 100;
    this.jumpsCount = 0;
    this.startTime = 0;
    this.elapsedTime = 0;

    // Timelines: 'PAST', 'PRESENT', 'FUTURE'
    this.timeline = 'PRESENT';
    this.previousTimeline = 'PRESENT';
    this.transitionTimer = 0;
    this.transitionDuration = 0.75; // seconds for cinematic portal-tear
    this.screenShake = 0;

    // Cause & Effect Puzzle Flags
    this.flags = {
      hasKeycard: false,
      hasCrowbar: false,
      hasTemporalCore: false,
      hasLoomComponent: false,
      braceRemovedInPast: false, // Dislodged in Past -> Present blast door buckles open
      engineeringDoorUnlocked: false,
      timelineStabilized: false
    };

    // Loki Player Object with Pixel-Art Sprites & Physics Cape
    this.player = {
      x: 480,
      y: 400,
      w: 32,
      h: 58,
      vx: 0,
      vy: 0,
      speed: 260,
      jumpForce: -440,
      isGrounded: false,
      facing: 1, // 1 for right, -1 for left
      animTime: 0,
      state: 'IDLE', // 'IDLE', 'RUN', 'JUMP', 'FALL'
      // Verlet spring-chain cape (6 nodes)
      capeNodes: [
        { x: 480, y: 400 },
        { x: 480, y: 410 },
        { x: 480, y: 420 },
        { x: 480, y: 430 },
        { x: 480, y: 440 },
        { x: 480, y: 450 }
      ],
      magicCharge: 0, // Hand glow intensity
      gleamTimer: 0   // Helmet specular gleam sweep
    };

    this.gravity = 980;

    // Input state
    this.keys = {
      left: false,
      right: false,
      jump: false,
      interact: false
    };

    // Environmental particle systems
    this.dustParticles = [];       // Past dust motes
    this.chrononParticles = [];    // Present golden energy motes
    this.riftParticles = [];       // Future cosmic void debris
    this.activeParticles = [];     // Transient gameplay particles
    this.flightItems = [];         // Items arcing to Loki on collect
    this.activeInteractable = null;

    // Floating notifications
    this.notifications = [];

    // Initialize world geometry & interactive entities
    this.initWorld();
    this.initAtmosphereParticles();
    this.setupInputs();
    this.lastFrameTime = performance.now();

    // Start render/update loop
    this.running = true;
    this.animId = requestAnimationFrame((t) => this.loop(t));
    this.score = 0;
  }

  initWorld() {
    this.floorY = 440;

    // High catwalk in upper-left (accessible via collapsed girder in FUTURE)
    this.catwalk = { x: 60, y: 270, w: 210, h: 16 };
    this.girderRamp = { x: 80, y: 440, x2: 230, y2: 286 };

    // Interactive Puzzle Objects
    this.interactables = [
      // 1. Ancient Keycard (PAST only — archival desk)
      {
        id: 'keycard',
        name: 'Ancient TVA Keycard',
        icon: '🔑',
        type: 'KEYCARD',
        timeline: 'PAST',
        x: 130,
        y: 416,
        w: 32,
        h: 24,
        checkActive: () => !this.flags.hasKeycard,
        onInteract: () => {
          this.flags.hasKeycard = true;
          this.spawnItemFlightArc(130, 416, 'KEYCARD', '#ffd200');
          this.audioEngine.playCollect();
          this.notify('COLLECTED: Ancient TVA Keycard!', '#ffd200');
          this.addSparkles(130, 416, '#ffd200', 30);
        }
      },

      // 2. Hydraulic Crowbar (FUTURE only — near collapsed blast door)
      {
        id: 'crowbar',
        name: 'Hydraulic Crowbar',
        icon: '🛠️',
        type: 'CROWBAR',
        timeline: 'FUTURE',
        x: 630,
        y: 420,
        w: 34,
        h: 20,
        checkActive: () => !this.flags.hasCrowbar,
        onInteract: () => {
          this.flags.hasCrowbar = true;
          this.spawnItemFlightArc(630, 420, 'CROWBAR', '#00f0ff');
          this.audioEngine.playCollect();
          this.notify('SALVAGED: Heavy Hydraulic Crowbar!', '#00f0ff');
          this.addSparkles(630, 420, '#00f0ff', 30);
        }
      },

      // 3. Structural Support Brace (PAST only — Cause & Effect Mechanism)
      {
        id: 'brace',
        name: 'Blast Door Support Brace',
        icon: '⚙️',
        type: 'BRACE',
        timeline: 'PAST',
        x: 670,
        y: 380,
        w: 40,
        h: 60,
        checkActive: () => !this.flags.braceRemovedInPast,
        getPrompt: () => {
          if (this.flags.hasCrowbar) {
            return '[E] / TAP: Dislodge support brace with Crowbar';
          }
          return 'Sturdy brace (Requires a pry tool from the Future)';
        },
        onInteract: () => {
          if (this.flags.hasCrowbar) {
            this.flags.braceRemovedInPast = true;
            this.audioEngine.playPry();
            this.screenShake = 12;
            this.notify('TIMELINE ALTERED: Brace dislodged decades ago!', '#a855f7');
            this.addSparkles(670, 400, '#a855f7', 40);
          } else {
            this.audioEngine.playDeny();
            this.notify('Locked tight! Requires a heavy crowbar to pry loose.', '#ef4444');
          }
        }
      },

      // 4. Temporal Core (PRESENT only — inside Engineering Chamber)
      {
        id: 'temporal_core',
        name: 'Temporal Core',
        icon: '⚡',
        type: 'CORE',
        timeline: 'PRESENT',
        x: 840,
        y: 390,
        w: 36,
        h: 50,
        checkActive: () => !this.flags.hasTemporalCore,
        getPrompt: () => {
          if (!this.flags.hasKeycard) {
            return 'Pedestal sealed! Ancient Keycard required.';
          }
          return '[E] / TAP: Swipe Keycard & retrieve Core';
        },
        onInteract: () => {
          if (!this.flags.hasKeycard) {
            this.audioEngine.playDeny();
            this.notify('Access Denied: Ancient TVA Keycard needed.', '#ef4444');
          } else {
            this.flags.hasTemporalCore = true;
            this.spawnItemFlightArc(840, 390, 'CORE', '#ffd200');
            this.audioEngine.playCollect();
            this.notify('ACQUIRED: Temporal Core!', '#ffd200');
            this.addSparkles(840, 390, '#ffd200', 45);
          }
        }
      },

      // 5. Loom Component (FUTURE only — on high catwalk)
      {
        id: 'loom_comp',
        name: 'Loom Component',
        icon: '🔧',
        type: 'LOOM_COMP',
        timeline: 'FUTURE',
        x: 100,
        y: 236,
        w: 34,
        h: 34,
        checkActive: () => !this.flags.hasLoomComponent,
        onInteract: () => {
          this.flags.hasLoomComponent = true;
          this.spawnItemFlightArc(100, 236, 'LOOM_COMP', '#00f0ff');
          this.audioEngine.playCollect();
          this.notify('SALVAGED: Loom Component from future rift!', '#00f0ff');
          this.addSparkles(100, 236, '#00f0ff', 35);
        }
      },

      // 6. Central Stabilization Loom Console (PRESENT only — Win Target)
      {
        id: 'stabilizer_loom',
        name: 'Stabilization Loom Console',
        icon: '⏳',
        type: 'LOOM',
        timeline: 'PRESENT',
        x: 470,
        y: 370,
        w: 64,
        h: 70,
        checkActive: () => true,
        getPrompt: () => {
          const count = (this.flags.hasKeycard ? 1 : 0) + 
                        (this.flags.hasTemporalCore ? 1 : 0) + 
                        (this.flags.hasLoomComponent ? 1 : 0);
          if (count === 3) {
            return '🌟 [E] / TAP: INSERT ARTIFACTS & STABILIZE TIMELINE!';
          }
          return `Stabilization Loom (${count}/3 Artifacts Gathered)`;
        },
        onInteract: () => {
          const count = (this.flags.hasKeycard ? 1 : 0) + 
                        (this.flags.hasTemporalCore ? 1 : 0) + 
                        (this.flags.hasLoomComponent ? 1 : 0);
          if (count === 3) {
            this.triggerVictory();
          } else {
            this.audioEngine.playDeny();
            this.notify(`Missing artifacts! Need all 3 to stabilize (${count}/3 held).`, '#ff9800');
          }
        }
      }
    ];
  }

  initAtmosphereParticles() {
    // 1. Past: Dust motes
    for (let i = 0; i < 40; i++) {
      this.dustParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.floorY,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 10 - 4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        seed: Math.random() * 100
      });
    }

    // 2. Present: Chronon energy motes
    for (let i = 0; i < 30; i++) {
      this.chrononParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.floorY,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 18 - 8,
        size: Math.random() * 2.5 + 1.2,
        alpha: Math.random() * 0.6 + 0.3,
        pulse: Math.random() * Math.PI * 2
      });
    }

    // 3. Future: Floating void debris chunks
    for (let i = 0; i < 24; i++) {
      this.riftParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.floorY,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 12,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 6 + 3,
        color: Math.random() > 0.5 ? '#a855f7' : '#00f0ff'
      });
    }
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'PLAYING') return;

      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') this.keys.left = true;
      if (key === 'd' || key === 'arrowright') this.keys.right = true;
      if (key === 'w' || key === 'arrowup' || key === ' ') {
        this.keys.jump = true;
        this.attemptJump();
      }
      if (key === 'e') {
        this.keys.interact = true;
        this.attemptInteract();
      }

      // Timeline quick switcher keys
      if (e.key === '1') this.switchTimeline('PAST');
      if (e.key === '2') this.switchTimeline('PRESENT');
      if (e.key === '3') this.switchTimeline('FUTURE');
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') this.keys.left = false;
      if (key === 'd' || key === 'arrowright') this.keys.right = false;
      if (key === 'w' || key === 'arrowup' || key === ' ') this.keys.jump = false;
      if (key === 'e') this.keys.interact = false;
    });

    // Touch / Mobile On-Screen Controls
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        onDown();
      });
      el.addEventListener('pointerup', (e) => {
        e.preventDefault();
        if (onUp) onUp();
      });
      el.addEventListener('pointerleave', (e) => {
        if (onUp) onUp();
      });
    };

    bindBtn('touchBtnLeft', () => { this.keys.left = true; }, () => { this.keys.left = false; });
    bindBtn('touchBtnRight', () => { this.keys.right = true; }, () => { this.keys.right = false; });
    bindBtn('touchBtnJump', () => { this.attemptJump(); }, null);
    bindBtn('touchBtnAction', () => { this.attemptInteract(); }, null);

    // Floating Timeline Selector Pill Tabs
    const setupTimelineBtn = (id, era) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.state === 'PLAYING') {
            this.switchTimeline(era);
          }
        });
      }
    };
    setupTimelineBtn('timelinePastBtn', 'PAST');
    setupTimelineBtn('timelinePresentBtn', 'PRESENT');
    setupTimelineBtn('timelineFutureBtn', 'FUTURE');
  }

  switchTimeline(targetEra) {
    if (this.timeline === targetEra) return;
    this.previousTimeline = this.timeline;
    this.timeline = targetEra;
    this.jumpsCount++;
    this.transitionTimer = this.transitionDuration;
    this.screenShake = 16;

    // Temporal friction penalty
    this.stability = Math.max(0, this.stability - 5);

    // Sound FX & ambient crossfade
    this.audioEngine.playPortal();
    this.audioEngine.setEra(targetEra);

    // Spawn timeline shift burst particles
    this.addTimelineShiftBurst();

    // Check game over
    if (this.stability <= 0) {
      this.triggerGameOver();
      return;
    }

    this.notify(`ERA SHIFT: ${targetEra}`, this.getTimelineColor(targetEra));
    this.updateSelectorPill();
  }

  getTimelineColor(era) {
    if (era === 'PAST') return '#ffab40';
    if (era === 'PRESENT') return '#ffd200';
    return '#c084fc';
  }

  attemptJump() {
    if (this.player.isGrounded) {
      this.player.vy = this.player.jumpForce;
      this.player.isGrounded = false;
      this.audioEngine.playJump();
      this.addSparkles(this.player.x + this.player.w / 2, this.player.y + this.player.h, '#22c55e', 12);
    }
  }

  attemptInteract() {
    if (this.activeInteractable) {
      this.activeInteractable.onInteract();
    }
  }

  startMission() {
    this.state = 'PLAYING';
    this.startTime = performance.now();
    this.stability = 100;
    this.jumpsCount = 0;
    this.timeline = 'PRESENT';
    this.player.x = 480;
    this.player.y = 380;
    this.player.vx = 0;
    this.player.vy = 0;
    this.audioEngine.setEra('PRESENT');
    this.updateSelectorPill();
  }

  reset() {
    this.flags = {
      hasKeycard: false,
      hasCrowbar: false,
      hasTemporalCore: false,
      hasLoomComponent: false,
      braceRemovedInPast: false,
      engineeringDoorUnlocked: false,
      timelineStabilized: false
    };
    this.flightItems = [];
    this.startMission();
  }

  start() {
    this.running = true;
    this.lastFrameTime = performance.now();
    if (!this.animId) {
      this.animId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  stop() {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.audioEngine && this.audioEngine.masterAmbientGain && this.audioEngine.ctx) {
      try {
        this.audioEngine.masterAmbientGain.gain.setValueAtTime(0, this.audioEngine.ctx.currentTime);
      } catch (e) {}
    }
  }

  triggerVictory() {
    this.state = 'VICTORY';
    this.flags.timelineStabilized = true;
    this.elapsedTime = Math.floor((performance.now() - this.startTime) / 1000);
    this.audioEngine.playVictory();
    this.screenShake = 20;

    const overlay = document.getElementById('victoryOverlay');
    if (overlay) overlay.classList.remove('hidden');

    const stabEl = document.getElementById('statStability');
    const shiftsEl = document.getElementById('statShifts');
    const timeEl = document.getElementById('statTime');
    if (stabEl) stabEl.textContent = `${this.stability}%`;
    if (shiftsEl) shiftsEl.textContent = this.jumpsCount;
    if (timeEl) timeEl.textContent = `${this.elapsedTime}s`;

    const finalScore = Math.max(500, Math.round(this.stability * 20 + Math.max(0, 1000 - this.elapsedTime * 10)));
    this.score = finalScore;
    if (typeof window !== 'undefined' && window.hub && typeof window.hub.recordScore === 'function') {
      window.hub.recordScore('lokitimelinehunt', finalScore);
    }
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    this.audioEngine.playDefeat();
    this.screenShake = 24;
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  notify(msg, color = '#ffd200') {
    this.notifications.push({
      text: msg,
      color: color,
      alpha: 1.0,
      y: 200,
      vy: -25
    });
  }

  addSparkles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 110 + 30;
      this.activeParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: Math.random() * 4 + 2,
        color: color
      });
    }
  }

  addTimelineShiftBurst() {
    const col = this.getTimelineColor(this.timeline);
    for (let i = 0; i < 45; i++) {
      this.activeParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 450,
        vy: (Math.random() - 0.5) * 300,
        life: 0.5 + Math.random() * 0.35,
        maxLife: 0.85,
        size: Math.random() * 5 + 2,
        color: col
      });
    }
  }

  spawnItemFlightArc(startX, startY, type, color) {
    this.flightItems.push({
      startX: startX,
      startY: startY,
      x: startX,
      y: startY,
      type: type,
      color: color,
      progress: 0,
      duration: 0.65, // seconds
      arcHeight: 90
    });
  }

  updateSelectorPill() {
    const pastBtn = document.getElementById('timelinePastBtn');
    const presBtn = document.getElementById('timelinePresentBtn');
    const futBtn = document.getElementById('timelineFutureBtn');

    if (pastBtn) pastBtn.classList.toggle('active', this.timeline === 'PAST');
    if (presBtn) presBtn.classList.toggle('active', this.timeline === 'PRESENT');
    if (futBtn) futBtn.classList.toggle('active', this.timeline === 'FUTURE');
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 28);
    }

    // Decay timeline transition timer
    if (this.transitionTimer > 0) {
      this.transitionTimer = Math.max(0, this.transitionTimer - dt);
    }

    // Player Horizontal Velocity
    this.player.vx = 0;
    if (this.keys.left) {
      this.player.vx = -this.player.speed;
      this.player.facing = -1;
    }
    if (this.keys.right) {
      this.player.vx = this.player.speed;
      this.player.facing = 1;
    }

    // Player Gravity & Vertical Motion
    this.player.vy += this.gravity * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Animation state machine
    if (!this.player.isGrounded) {
      this.player.state = this.player.vy < 0 ? 'JUMP' : 'FALL';
      this.player.animTime += dt * 4;
    } else if (Math.abs(this.player.vx) > 10) {
      this.player.state = 'RUN';
      this.player.animTime += dt * 11;
    } else {
      this.player.state = 'IDLE';
      this.player.animTime += dt * 3;
    }

    // Specular gleam on helmet horns
    this.player.gleamTimer = (this.player.gleamTimer + dt * 1.5) % 4.0;

    // Boundary Collisions
    if (this.player.x < 30) this.player.x = 30;
    if (this.player.x + this.player.w > this.width - 30) {
      this.player.x = this.width - 30 - this.player.w;
    }

    // Update Verlet Cape Physics
    this.updateCapePhysics(dt);

    // Blast Door Obstacle Collision (at x: 670)
    // PAST: open door frame (can pass)
    // PRESENT: blocked unless brace removed in Past
    // FUTURE: crushed rubble blocks passage
    if (this.timeline === 'PRESENT') {
      const doorOpen = this.flags.braceRemovedInPast;
      if (!doorOpen) {
        const doorX = 670;
        const doorW = 28;
        if (this.player.x + this.player.w > doorX && this.player.x < doorX + doorW) {
          if (this.player.facing === 1) {
            this.player.x = doorX - this.player.w;
          } else {
            this.player.x = doorX + doorW;
          }
        }
      }
    } else if (this.timeline === 'FUTURE') {
      const rubbleX = 660;
      const rubbleW = 40;
      if (this.player.x + this.player.w > rubbleX && this.player.x < rubbleX + rubbleW) {
        if (this.player.facing === 1) {
          this.player.x = rubbleX - this.player.w;
        } else {
          this.player.x = rubbleX + rubbleW;
        }
      }
    }

    // Base Floor Collision
    this.player.isGrounded = false;
    if (this.player.y + this.player.h >= this.floorY) {
      this.player.y = this.floorY - this.player.h;
      this.player.vy = 0;
      this.player.isGrounded = true;
    }

    // Future Collapsed Girder Ramp Collision (x: 80..230)
    if (this.timeline === 'FUTURE') {
      if (this.player.x >= 80 && this.player.x <= 230) {
        const rampProgress = (this.player.x - 80) / 150;
        const rampY = 440 - (rampProgress * 154);
        if (this.player.y + this.player.h >= rampY && this.player.vy >= 0 && this.player.y + this.player.h <= rampY + 28) {
          this.player.y = rampY - this.player.h;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
      }
    }

    // High Catwalk Flat Top Collision (x: 60..270, y: 270)
    if (this.player.x + this.player.w > this.catwalk.x && this.player.x < this.catwalk.x + this.catwalk.w) {
      if (this.player.y + this.player.h >= this.catwalk.y && 
          this.player.y + this.player.h <= this.catwalk.y + 22 && 
          this.player.vy >= 0) {
        this.player.y = this.catwalk.y - this.player.h;
        this.player.vy = 0;
        this.player.isGrounded = true;
      }
    }

    // Update Atmospheric Particles
    this.updateAtmosphere(dt);

    // Update Active Particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
      }
    }

    // Update Flight Arcs (Items Flying to Loki)
    const targetX = this.player.x + this.player.w / 2;
    const targetY = this.player.y + 26; // belt height
    for (let i = this.flightItems.length - 1; i >= 0; i--) {
      const f = this.flightItems[i];
      f.progress += dt / f.duration;
      const t = Math.min(1, f.progress);

      // Parabolic bezier arc
      const mx = (f.startX + targetX) / 2;
      const my = Math.min(f.startY, targetY) - f.arcHeight;
      const inv = 1 - t;
      f.x = inv * inv * f.startX + 2 * inv * t * mx + t * t * targetX;
      f.y = inv * inv * f.startY + 2 * inv * t * my + t * t * targetY;

      // Trail sparkles
      if (Math.random() < 0.6) {
        this.activeParticles.push({
          x: f.x,
          y: f.y,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          life: 0.3,
          maxLife: 0.3,
          size: Math.random() * 3 + 1,
          color: f.color
        });
      }

      if (f.progress >= 1) {
        // Arrived at Loki's belt!
        this.addSparkles(targetX, targetY, f.color, 18);
        this.flightItems.splice(i, 1);
      }
    }

    // Update Notifications
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const n = this.notifications[i];
      n.y += n.vy * dt;
      n.alpha -= dt * 0.5;
      if (n.alpha <= 0) {
        this.notifications.splice(i, 1);
      }
    }

    // Find Active Interactable in proximity
    this.activeInteractable = null;
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;

    for (const item of this.interactables) {
      if (item.timeline !== this.timeline) continue;
      if (!item.checkActive()) continue;

      const ix = item.x + item.w / 2;
      const iy = item.y + item.h / 2;
      const dist = Math.hypot(px - ix, py - iy);

      if (dist < 64) {
        this.activeInteractable = item;
        break;
      }
    }
  }

  updateCapePhysics(dt) {
    const nodes = this.player.capeNodes;
    // Anchor first node to Loki's shoulder
    const anchorX = this.player.x + (this.player.facing === 1 ? 6 : this.player.w - 6);
    const anchorY = this.player.y + 16;
    nodes[0].x = anchorX;
    nodes[0].y = anchorY;

    // Movement lag + gravity + wind draft
    const wind = Math.sin(this.player.animTime * 2) * 12;
    const dragX = -this.player.vx * 0.12 * this.player.facing;

    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const cur = nodes[i];

      // Gravity & wind forces
      cur.y += 280 * dt;
      cur.x += (wind - this.player.facing * 35 + dragX) * dt;

      // Constrain distance to segment length
      const segLen = 7;
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const dist = Math.hypot(dx, dy) || 1;
      const diff = (dist - segLen) / dist;

      cur.x -= dx * 0.5 * diff;
      cur.y -= dy * 0.5 * diff;
    }
  }

  updateAtmosphere(dt) {
    // 1. Past dust motes
    for (const d of this.dustParticles) {
      d.x += (d.vx + Math.sin(d.seed + performance.now() * 0.001) * 6) * dt;
      d.y += d.vy * dt;
      if (d.y < 0) d.y = this.floorY;
      if (d.x < 0) d.x = this.width;
      if (d.x > this.width) d.x = 0;
    }

    // 2. Present chronons
    for (const c of this.chrononParticles) {
      c.y += c.vy * dt;
      c.x += c.vx * dt;
      c.pulse += dt * 3;
      if (c.y < 40) {
        c.y = this.floorY - 10;
        c.x = Math.random() * this.width;
      }
    }

    // 3. Future floating debris
    for (const r of this.riftParticles) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.angle += r.vRot * dt;
      if (r.y < 0 || r.y > this.floorY) r.vy *= -1;
      if (r.x < 0 || r.x > this.width) r.vx *= -1;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Screen Shake Offset
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Dynamic Procedural Environment & Lighting
    this.renderEnvironment(ctx);

    // 2. Structures, Obstacles & Interactive World Objects
    this.renderWorldObjects(ctx);

    // 3. Pixel-Art Loki Character
    this.renderLoki(ctx);

    // 4. Arcing Items on Pickup Trajectory
    this.renderFlightItems(ctx);

    // 5. Environmental & Action Particles
    this.renderParticles(ctx);

    // 6. In-World Canvas-Rendered HUD
    this.renderInWorldHUD(ctx);

    // 7. Cinematic TVA Portal-Tear Timeline Transition
    if (this.transitionTimer > 0) {
      this.renderTimelineTransition(ctx);
    }

    // 8. In-Game Floating Notifications
    this.renderNotifications(ctx);

    ctx.restore();
  }

  // ==========================================
  // PHASE 1: ENVIRONMENT & PROCEDURAL WORLDS
  // ==========================================
  renderEnvironment(ctx) {
    const era = this.timeline;

    if (era === 'PAST') {
      // --- PAST: TVA Genesis (Warm Sepia, Vintage Scaffolding, Volumetric Bulbs) ---
      const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      bgGrad.addColorStop(0, '#1a1109');
      bgGrad.addColorStop(0.6, '#281a0e');
      bgGrad.addColorStop(1, '#3b2514');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Blueprint Wall Grid (Archival Blue)
      ctx.save();
      ctx.fillStyle = 'rgba(25, 45, 75, 0.45)';
      ctx.fillRect(90, 130, 140, 95);
      ctx.fillRect(340, 110, 160, 110);
      ctx.strokeStyle = 'rgba(100, 170, 240, 0.25)';
      ctx.lineWidth = 1;
      for (let x = 90; x <= 230; x += 14) {
        ctx.beginPath(); ctx.moveTo(x, 130); ctx.lineTo(x, 225); ctx.stroke();
      }
      for (let y = 130; y <= 225; y += 14) {
        ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(230, y); ctx.stroke();
      }
      ctx.strokeRect(90, 130, 140, 95);
      ctx.strokeRect(340, 110, 160, 110);

      // Blueprint schematic text
      ctx.fillStyle = 'rgba(180, 220, 255, 0.7)';
      ctx.font = '9px monospace';
      ctx.fillText('SEC-4 CHRONO-LOOM DRAFT v0.1', 98, 145);
      ctx.fillText('TIMELINE ANCHOR SPEC', 348, 126);
      ctx.restore();

      // Heavy Timber Scaffolding & Cross-Beams
      ctx.save();
      ctx.strokeStyle = '#4a301a';
      ctx.lineWidth = 6;
      for (let x = 70; x < this.width; x += 150) {
        // Vertical pillars
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, this.floorY);
        ctx.stroke();

        // Cross-braces
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(80, 50, 25, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x, 120);
        ctx.lineTo(x + 150, 260);
        ctx.moveTo(x + 150, 120);
        ctx.lineTo(x, 260);
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#4a301a';
      }
      ctx.restore();

      // Industrial Hanging Filament Lamps with Volumetric Light Cones
      [200, 500, 800].forEach(lx => {
        // Wire & bulb cage
        ctx.strokeStyle = '#1e140a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, 100);
        ctx.stroke();

        // Volumetric Light Cone
        const coneGrad = ctx.createRadialGradient(lx, 105, 10, lx, 320, 260);
        coneGrad.addColorStop(0, 'rgba(255, 180, 60, 0.35)');
        coneGrad.addColorStop(0.5, 'rgba(255, 160, 40, 0.12)');
        coneGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(lx - 12, 105);
        ctx.lineTo(lx - 160, this.floorY);
        ctx.lineTo(lx + 160, this.floorY);
        ctx.lineTo(lx + 12, 105);
        ctx.closePath();
        ctx.fill();

        // Glowing incandescent filament
        ctx.fillStyle = '#ffaa33';
        ctx.beginPath();
        ctx.arc(lx, 105, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Distant Archival Drafting Table in background (x: 110..180)
      ctx.fillStyle = '#3e2412';
      ctx.fillRect(110, 410, 60, 30);
      ctx.strokeStyle = '#28170b';
      ctx.strokeRect(110, 410, 60, 30);
      ctx.fillStyle = '#654321';
      ctx.fillRect(115, 414, 50, 4);

    } else if (era === 'PRESENT') {
      // --- PRESENT: Active TVA Sector 4 (Mid-Century Modern Walnut & Amber Glow) ---
      const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      bgGrad.addColorStop(0, '#0c0a08');
      bgGrad.addColorStop(0.6, '#18120b');
      bgGrad.addColorStop(1, '#241a10');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Polished Walnut Wall Panels with Brass Inlay
      ctx.save();
      for (let x = 60; x < this.width; x += 130) {
        ctx.fillStyle = '#1e140b';
        ctx.fillRect(x, 40, 115, 280);
        ctx.strokeStyle = 'rgba(255, 190, 0, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, 40, 115, 280);

        // Brass horizontal dividing line
        ctx.strokeStyle = 'rgba(255, 210, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x, 180);
        ctx.lineTo(x + 115, 180);
        ctx.stroke();
      }
      ctx.restore();

      // Glowing Amber Sacred Timeline Oscilloscope Monitor
      ctx.save();
      const monX = 350, monY = 90, monW = 260, monH = 120;
      ctx.fillStyle = '#060504';
      ctx.fillRect(monX, monY, monW, monH);
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 3;
      ctx.strokeRect(monX, monY, monW, monH);

      // CRT phosphor wave & grid
      ctx.strokeStyle = 'rgba(255, 171, 0, 0.15)';
      ctx.lineWidth = 1;
      for (let x = monX + 10; x < monX + monW; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, monY); ctx.lineTo(x, monY + monH); ctx.stroke();
      }
      for (let y = monY + 10; y < monY + monH; y += 20) {
        ctx.beginPath(); ctx.moveTo(monX, y); ctx.lineTo(monX + monW, y); ctx.stroke();
      }

      // Animated Sine Wave Sacred Timeline
      ctx.shadowColor = '#ffd200';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const time = performance.now() * 0.003;
      for (let mx = monX + 4; mx < monX + monW - 4; mx += 3) {
        const my = monY + monH / 2 + Math.sin((mx * 0.035) + time) * 26 + Math.cos(mx * 0.07 + time * 1.5) * 8;
        if (mx === monX + 4) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.stroke();
      ctx.restore();

      // Monitor Status Header Text
      ctx.fillStyle = '#ffd200';
      ctx.font = '10px monospace';
      ctx.fillText('SACRED TIMELINE // FREQUENCY STABLE', monX + 14, monY - 8);

      // Overhead Architectural Ceiling Lighting Strip
      const ceilGlow = ctx.createLinearGradient(0, 0, 0, 80);
      ceilGlow.addColorStop(0, 'rgba(255, 210, 0, 0.25)');
      ceilGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = ceilGlow;
      ctx.fillRect(0, 0, this.width, 80);

    } else {
      // --- FUTURE: Timeline Incursion Collapse (Cosmic Void, Jagged Rifts, Emergency Light) ---
      const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      bgGrad.addColorStop(0, '#07030e');
      bgGrad.addColorStop(0.6, '#11091e');
      bgGrad.addColorStop(1, '#1b0d30');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Cosmic Fracture Rifts with Branching Electric Lightning
      ctx.save();
      ctx.strokeStyle = '#c084fc';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(170, 0);
      ctx.lineTo(230, 130);
      ctx.lineTo(190, 220);
      ctx.lineTo(310, 340);
      ctx.lineTo(270, this.height);
      ctx.stroke();

      // Secondary rift branch
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(230, 130);
      ctx.lineTo(390, 180);
      ctx.lineTo(460, 280);
      ctx.lineTo(580, 310);
      ctx.stroke();

      // Periodic random lightning strikes along rift
      if (Math.random() < 0.15) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(190, 220);
        ctx.lineTo(240 + (Math.random() - 0.5) * 40, 260);
        ctx.lineTo(310, 340);
        ctx.stroke();
      }
      ctx.restore();

      // Pulsing Red Emergency Beacon Light
      const beaconPulse = (Math.sin(performance.now() * 0.006) + 1) * 0.5;
      const beaconGrad = ctx.createRadialGradient(820, 70, 20, 820, 70, 380);
      beaconGrad.addColorStop(0, `rgba(239, 68, 68, ${0.45 * beaconPulse})`);
      beaconGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = beaconGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Emergency Light Lamp Fixture
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(820, 70, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floor Base Rendering (Consistent across timelines, varying material)
    ctx.save();
    if (era === 'PAST') {
      ctx.fillStyle = '#3a2313'; // Heavy aged wood planks
    } else if (era === 'PRESENT') {
      ctx.fillStyle = '#1c150e'; // Polished terrazzo
    } else {
      ctx.fillStyle = '#100a1c'; // Broken void stone
    }
    ctx.fillRect(0, this.floorY, this.width, this.height - this.floorY);

    // Floor Border Trim
    ctx.fillStyle = era === 'PAST' ? '#54361e' : (era === 'PRESENT' ? '#ffd200' : '#7e22ce');
    ctx.fillRect(0, this.floorY, this.width, 4);

    // Floor Tile Grooves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, this.floorY);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    // Present Terrazzo Floor Mirror Reflection of Ambient Lighting
    if (era === 'PRESENT') {
      const floorReflect = ctx.createLinearGradient(0, this.floorY, 0, this.height);
      floorReflect.addColorStop(0, 'rgba(255, 210, 0, 0.12)');
      floorReflect.addColorStop(1, 'transparent');
      ctx.fillStyle = floorReflect;
      ctx.fillRect(0, this.floorY, this.width, 40);
    }
    ctx.restore();
  }

  // ==========================================
  // PHASE 6: WORLD STRUCTURES & OBJECTS
  // ==========================================
  renderWorldObjects(ctx) {
    const era = this.timeline;

    // 1. High Catwalk (Left Zone: x: 60..270, y: 270)
    ctx.save();
    if (era === 'PAST') {
      // Wood plank platform under construction
      ctx.fillStyle = '#5c3d24';
      ctx.fillRect(this.catwalk.x, this.catwalk.y, this.catwalk.w, this.catwalk.h);
      ctx.strokeStyle = '#382211';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.catwalk.x, this.catwalk.y, this.catwalk.w, this.catwalk.h);

      // Warning Banner
      ctx.fillStyle = '#ffd200';
      ctx.font = '9px monospace';
      ctx.fillText('🚧 LADDER UNFINISHED - SECTOR ACCESS PENDING', 68, 260);

    } else if (era === 'PRESENT') {
      // Active TVA Security Catwalk with Laser Barrier
      ctx.fillStyle = '#1e1c18';
      ctx.fillRect(this.catwalk.x, this.catwalk.y, this.catwalk.w, this.catwalk.h);
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.catwalk.x, this.catwalk.y, this.catwalk.w, this.catwalk.h);

      // Pulsing Red Laser Security Grid
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, 268);
      ctx.lineTo(270, 268);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = '9px monospace';
      ctx.fillText('⚡ HIGH VOLTAGE CONTAINMENT FIELD', 70, 256);

    } else {
      // FUTURE: Laser grid dead! Collapsed steel girder forms climbable ramp
      ctx.fillStyle = '#181124';
      ctx.fillRect(this.catwalk.x, this.catwalk.y, this.catwalk.w, this.catwalk.h);
      ctx.strokeStyle = '#9333ea';
      ctx.strokeRect(this.catwalk.x, this.catwalk.y, this.catwalk.w, this.catwalk.h);

      // Collapsed Steel Girder Ramp (x:80, y:440 to x:230, y:286)
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(80, 440);
      ctx.lineTo(230, 286);
      ctx.stroke();

      // Glowing Cyan Welded Footholds
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        const rx = 100 + i * 22;
        const ry = 420 - i * 22;
        ctx.beginPath();
        ctx.moveTo(rx - 8, ry - 6);
        ctx.lineTo(rx + 8, ry + 6);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Blast Door Obstacle (Right Zone: at x: 670)
    ctx.save();
    const doorX = 670;
    const doorW = 28;

    if (era === 'PAST') {
      // Under-construction door frame with Structural Support Brace
      ctx.fillStyle = '#3c2816';
      ctx.fillRect(doorX, 200, doorW, 240);

      if (!this.flags.braceRemovedInPast) {
        // Heavy Structural Brace
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(doorX - 6, 360, 40, 80);
        ctx.strokeStyle = '#ffd200';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(doorX - 6, 360, 40, 80);

        // Animated Pry Glow if Player has Crowbar
        if (this.flags.hasCrowbar) {
          const glow = (Math.sin(performance.now() * 0.008) + 1) * 0.5;
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.5 + glow * 0.5})`;
          ctx.lineWidth = 4;
          ctx.strokeRect(doorX - 8, 358, 44, 84);
        }

        ctx.fillStyle = '#ffd200';
        ctx.font = '10px monospace';
        ctx.fillText('BRACE [E]', doorX - 6, 405);
      } else {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
        ctx.font = '10px monospace';
        ctx.fillText('(REMOVED)', doorX - 8, 415);
      }

    } else if (era === 'PRESENT') {
      const doorOpen = this.flags.braceRemovedInPast;
      if (!doorOpen) {
        // Sealed Titanium Blast Door
        ctx.fillStyle = '#334155';
        ctx.fillRect(doorX, 200, doorW, 240);
        ctx.strokeStyle = '#ffd200';
        ctx.lineWidth = 3;
        ctx.strokeRect(doorX, 200, doorW, 240);

        // Rotating Warning Light
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(doorX + 14, 230, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffd200';
        ctx.font = '10px monospace';
        ctx.fillText('LOCKED', doorX - 8, 260);
      } else {
        // Door buckled and jammed open high over decades!
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(doorX, 170, doorW, 80);
        ctx.strokeStyle = '#22c55e';
        ctx.strokeRect(doorX, 170, doorW, 80);

        // Open passage green aura
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.fillRect(doorX, 250, doorW, 190);

        ctx.fillStyle = '#22c55e';
        ctx.font = '10px monospace';
        ctx.fillText('CLEAR', doorX + 2, 240);
      }
    } else {
      // FUTURE: Completely crushed rubble
      ctx.fillStyle = '#1f132b';
      ctx.fillRect(doorX - 12, 380, 52, 60);
      ctx.fillStyle = '#ef4444';
      ctx.font = '9px monospace';
      ctx.fillText('CRUSHED', doorX - 10, 370);
    }
    ctx.restore();

    // 3. Central Stabilization Loom Console (at x: 470, y: 370)
    ctx.save();
    const loomX = 470, loomY = 370;

    if (era === 'PRESENT') {
      // Main Active TVA Temporal Loom
      ctx.fillStyle = '#14120e';
      ctx.fillRect(loomX, loomY, 64, 70);
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 3;
      ctx.strokeRect(loomX, loomY, 64, 70);

      // Count collected artifacts
      const collectedCount = (this.flags.hasKeycard ? 1 : 0) + 
                             (this.flags.hasTemporalCore ? 1 : 0) + 
                             (this.flags.hasLoomComponent ? 1 : 0);

      // Rotating Hologram Containment Rings
      const rotTime = performance.now() * 0.002;
      ctx.save();
      ctx.translate(loomX + 32, loomY + 30);
      ctx.rotate(rotTime);
      ctx.strokeStyle = 'rgba(255, 210, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(Math.PI / 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Glowing Centerpiece Hourglass
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏳', loomX + 32, loomY + 38);

      // Progressive 3 Artifact Sockets
      const socketColors = ['#ffd200', '#00f0ff', '#22c55e'];
      const socketAcquired = [this.flags.hasKeycard, this.flags.hasTemporalCore, this.flags.hasLoomComponent];
      for (let s = 0; s < 3; s++) {
        const sx = loomX + 16 + s * 16;
        const sy = loomY + 58;
        ctx.fillStyle = socketAcquired[s] ? socketColors[s] : '#2b261d';
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
      }

      ctx.fillStyle = '#ffd200';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`TEMPORAL LOOM [${collectedCount}/3]`, loomX + 32, loomY - 12);

    } else {
      // Offline Chassis in Past & Future
      ctx.fillStyle = '#1c1710';
      ctx.fillRect(loomX, loomY, 64, 70);
      ctx.strokeStyle = '#554';
      ctx.strokeRect(loomX, loomY, 64, 70);
      ctx.fillStyle = '#776';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('(INACTIVE ERA)', loomX + 32, loomY - 8);
    }
    ctx.restore();

    // 4. Render Active Collectible Items (Pixel-Art with Aura)
    for (const item of this.interactables) {
      if (item.timeline !== era) continue;
      if (!item.checkActive()) continue;

      this.renderPixelItem(ctx, item);
    }
  }

  // ==========================================
  // PHASE 5: PIXEL-ART COLLECTIBLE ITEMS
  // ==========================================
  renderPixelItem(ctx, item) {
    const time = performance.now() * 0.005;
    const bounce = Math.sin(time + item.x) * 4;
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2 + bounce;

    ctx.save();
    // Glowing aura
    const glow = ctx.createRadialGradient(cx, cy, 3, cx, cy, 26);
    glow.addColorStop(0, item.type === 'CROWBAR' || item.type === 'LOOM_COMP' ? 'rgba(0, 240, 255, 0.65)' : 'rgba(255, 210, 0, 0.7)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();

    if (item.type === 'KEYCARD') {
      // Golden TVA Access Card
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(cx - 10, cy - 7, 20, 14);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - 8, cy - 5, 6, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx + 1, cy - 5, 7, 2);
    } else if (item.type === 'CROWBAR') {
      // Heavy Industrial Crowbar
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 8);
      ctx.lineTo(cx + 8, cy - 8);
      ctx.lineTo(cx + 12, cy - 4);
      ctx.stroke();
    } else if (item.type === 'CORE') {
      // Blazing Temporal Core Orb with Gyro Ring
      ctx.fillStyle = '#ffd200';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 5, time * 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.type === 'LOOM_COMP') {
      // Golden Clockwork Gear
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name Label Above
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffd200';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(item.name, cx, cy - 18);

    ctx.restore();
  }

  // ==========================================
  // PHASE 2: PIXEL-ART LOKI CHARACTER
  // ==========================================
  renderLoki(ctx) {
    const p = this.player;
    const px = p.x;
    const py = p.y;
    const facing = p.facing;

    ctx.save();
    ctx.translate(px + p.w / 2, py + p.h / 2);
    ctx.scale(facing, 1);

    // 1. Physics-Simulated Emerald Green Cape (behind body)
    this.renderCape(ctx);

    // 2. Legs & Boots with Animated Walk Stride
    const walkCycle = Math.sin(p.animTime) * (p.state === 'RUN' ? 7 : 0);
    ctx.fillStyle = '#1c1917'; // Dark leather boots
    // Left leg
    ctx.fillRect(-8, 14, 6, 15 + walkCycle);
    // Right leg
    ctx.fillRect(2, 14, 6, 15 - walkCycle);

    // 3. Tunic / Body (TVA Forest Green + Gold Armor Details)
    ctx.fillStyle = '#15803d'; // Rich Loki Green
    ctx.fillRect(-10, -12, 20, 26);

    // TVA Chevron & Gold Belt
    ctx.fillStyle = '#ffd200';
    ctx.fillRect(-10, 8, 20, 4); // belt
    ctx.strokeStyle = '#ffd200';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, -12);
    ctx.lineTo(0, 4);
    ctx.lineTo(7, -12);
    ctx.stroke();

    // 4. Head & Face
    ctx.fillStyle = '#fde68a'; // Face tone
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fill();

    // Emerald Sorcerer Eyes
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(4, -19, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Flowing Dark Asgardian Hair
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-9, -20, 4, 12);

    // 5. Iconic Horned Asgardian Golden Helmet
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.arc(0, -21, 9.5, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Curved Sweeping Golden Horns
    ctx.strokeStyle = '#ffd200';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Front sweeping horn
    ctx.moveTo(3, -24);
    ctx.quadraticCurveTo(18, -40, 10, -48);
    // Back horn
    ctx.moveTo(-4, -24);
    ctx.quadraticCurveTo(-14, -40, -6, -46);
    ctx.stroke();

    // Specular Gleam Sweep across Horns
    if (p.gleamTimer < 1.0) {
      const gPos = p.gleamTimer;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(3 + gPos * 7, -24 - gPos * 24, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Magic Sorcery Embers dancing from hands
    ctx.fillStyle = 'rgba(34, 197, 94, 0.75)';
    ctx.beginPath();
    ctx.arc(12, 4 + Math.sin(p.animTime * 2) * 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderCape(ctx) {
    const nodes = this.player.capeNodes;
    if (!nodes || nodes.length < 2) return;

    ctx.save();
    // Convert world nodes to local coordinates
    ctx.fillStyle = '#0f5132';
    ctx.beginPath();
    ctx.moveTo(0, -10);

    for (let i = 0; i < nodes.length; i++) {
      const lx = (nodes[i].x - (this.player.x + this.player.w / 2)) * this.player.facing;
      const ly = nodes[i].y - (this.player.y + this.player.h / 2);
      ctx.lineTo(lx - 6, ly);
    }
    for (let i = nodes.length - 1; i >= 0; i--) {
      const lx = (nodes[i].x - (this.player.x + this.player.w / 2)) * this.player.facing;
      const ly = nodes[i].y - (this.player.y + this.player.h / 2);
      ctx.lineTo(lx + 4, ly);
    }
    ctx.closePath();
    ctx.fill();

    // Golden hem trim
    ctx.strokeStyle = '#ffd200';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // ==========================================
  // PHASE 4: IN-WORLD CANVAS HUD
  // ==========================================
  renderInWorldHUD(ctx) {
    const p = this.player;
    const px = p.x + p.w / 2;
    const py = p.y;

    ctx.save();

    // 1. Stability Ring Orbiting Loki's Feet
    const ringRadius = 22;
    const ringAngle = (this.stability / 100) * (Math.PI * 2);
    let ringColor = '#22c55e';
    if (this.stability < 30) ringColor = '#ef4444';
    else if (this.stability < 60) ringColor = '#ff9800';

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, p.y + p.h, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(px, p.y + p.h, ringRadius, -Math.PI / 2, -Math.PI / 2 + ringAngle);
    ctx.stroke();

    // 2. Belt Inventory Floating Miniature Icons
    const items = [
      { id: 'keycard', icon: '🔑', has: this.flags.hasKeycard, col: '#ffd200' },
      { id: 'crowbar', icon: '🛠️', has: this.flags.hasCrowbar, col: '#00f0ff' },
      { id: 'core', icon: '⚡', has: this.flags.hasTemporalCore, col: '#ffd200' },
      { id: 'loom', icon: '🔧', has: this.flags.hasLoomComponent, col: '#00f0ff' }
    ];

    const beltY = py - 18;
    items.forEach((item, idx) => {
      const ix = px - 30 + idx * 20;
      if (item.has) {
        ctx.shadowColor = item.col;
        ctx.shadowBlur = 6;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon, ix, beltY);
      } else {
        // Holographic wireframe dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(ix, beltY - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 3. Floating In-World Interaction Tooltip near Active Object
    if (this.activeInteractable) {
      const obj = this.activeInteractable;
      const tx = obj.x + obj.w / 2;
      const ty = obj.y - 16;
      const text = obj.getPrompt ? obj.getPrompt() : `[E] / TAP: Pick up ${obj.name}`;

      ctx.font = '11px monospace';
      const textW = ctx.measureText(text).width;
      const padX = 12, padY = 6;

      ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(tx - textW / 2 - padX, ty - 18, textW + padX * 2, 24, 6);
      } else {
        ctx.rect(tx - textW / 2 - padX, ty - 18, textW + padX * 2, 24);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText(text, tx, ty - 2);
    }

    ctx.restore();
  }

  // ==========================================
  // PHASE 3: CINEMATIC PORTAL-TEAR TRANSITION
  // ==========================================
  renderTimelineTransition(ctx) {
    const progress = 1 - (this.transitionTimer / this.transitionDuration);
    ctx.save();

    const cx = this.player.x + this.player.w / 2;
    const cy = this.player.y + this.player.h / 2;

    if (progress < 0.4) {
      // Phase A: Expanding Orange TVA Time-Door Tear
      const doorW = (progress / 0.4) * this.width * 1.2;
      const doorH = (progress / 0.4) * this.height * 1.2;
      ctx.fillStyle = 'rgba(255, 152, 0, 0.45)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ff9800';
      ctx.shadowBlur = 30;
      ctx.strokeRect(cx - doorW / 2, cy - doorH / 2, doorW, doorH);

    } else if (progress < 0.75) {
      // Phase B: Shattered Reality Shards
      const shardProgress = (progress - 0.4) / 0.35;
      const numShards = 12;
      for (let i = 0; i < numShards; i++) {
        const angle = (i / numShards) * Math.PI * 2;
        const dist = shardProgress * 320;
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist;

        ctx.fillStyle = this.getTimelineColor(this.previousTimeline);
        ctx.globalAlpha = 1 - shardProgress;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 35, sy + 20);
        ctx.lineTo(sx + 10, sy + 45);
        ctx.closePath();
        ctx.fill();
      }

    } else {
      // Phase C: Energy Wavefront Settle
      const settleProgress = (progress - 0.75) / 0.25;
      ctx.strokeStyle = this.getTimelineColor(this.timeline);
      ctx.lineWidth = 10 * (1 - settleProgress);
      ctx.globalAlpha = 1 - settleProgress;
      ctx.strokeRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }

  renderFlightItems(ctx) {
    for (const f of this.flightItems) {
      ctx.save();
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderParticles(ctx) {
    // 1. Atmosphere particles according to timeline
    ctx.save();
    if (this.timeline === 'PAST') {
      for (const d of this.dustParticles) {
        ctx.fillStyle = `rgba(255, 190, 80, ${d.alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.timeline === 'PRESENT') {
      for (const c of this.chrononParticles) {
        ctx.fillStyle = `rgba(255, 210, 0, ${c.alpha * (0.6 + Math.sin(c.pulse) * 0.4)})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      for (const r of this.riftParticles) {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.angle);
        ctx.fillStyle = r.color;
        ctx.fillRect(-r.size / 2, -r.size / 2, r.size, r.size);
        ctx.restore();
      }
    }

    // 2. Transient Action Particles
    for (const p of this.activeParticles) {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderNotifications(ctx) {
    for (const n of this.notifications) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, n.alpha);
      ctx.font = '16px monospace';
      ctx.fontWeight = 'bold';
      ctx.textAlign = 'center';
      ctx.fillStyle = n.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 10;
      ctx.fillText(n.text, this.width / 2, n.y);
      ctx.restore();
    }
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = timestamp;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame((t) => this.loop(t));
  }
}

if (typeof window !== 'undefined') {
  window.LokiTimelineHuntGame = LokiTimelineHuntGame;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LokiTimelineHuntGame };
}
