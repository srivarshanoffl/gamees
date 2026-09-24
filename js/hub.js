/**
 * hub.js — V2 OVERHAUL
 * Main Marvel Mini-Games Hub Controller.
 * Fixed: click event conflicts, modal visibility logic, card animations.
 * Added: animated background particles, loading screen, staggered card animations.
 */

const GAMES_CATALOG = [
  // PART A: CHARACTER MISSIONS
  {
    id: 'spiderman',
    title: 'Spider-Man: Web Sling Velocity',
    hero: 'Spider-Man',
    category: 'character',
    icon: '🕷️',
    mechanic: 'Pendulum Traversal',
    desc: 'Hold to anchor webs to construction cranes, build swinging speed, and fling across the Queens & Midtown skyline to stop the Oscorp heist.',
    controls: 'Hold Click / Tap to attach web; Release to slingshot forward.',
    className: 'SpiderManGame',
    pageUrl: 'games/spider-man.html',
    accentColor: '#e23636',
    bannerGradient: 'linear-gradient(135deg, #1a0505 0%, #3d0a0a 40%, #1e1428 100%)',
    badge: 'Physics'
  },
  {
    id: 'captainamerica',
    title: 'Captain America: Shield Ricochet',
    hero: 'Captain America',
    category: 'character',
    icon: '🛡️',
    mechanic: 'Geometry Ricochet',
    desc: 'Calculate precise reflection angles to bounce the Vibranium Shield around titanium blast doors, eliminating Hydra sentries.',
    controls: 'Drag mouse/touch to aim bounce line; Release to throw shield.',
    className: 'CaptainAmericaGame',
    pageUrl: 'games/captain-america.html',
    accentColor: '#1565c0',
    bannerGradient: 'linear-gradient(135deg, #05101a 0%, #0a2540 40%, #141828 100%)',
    badge: 'Puzzle'
  },
  {
    id: 'ironman',
    title: 'Iron Man vs Thanos: 2D Arcade Battle',
    hero: 'Iron Man vs Thanos',
    category: 'character',
    icon: '🥊',
    mechanic: '2D Arcade Fighting',
    desc: 'Face off against the Mad Titan in a fast-paced 2D arcade duel! Fire repulsors, unleash power punches, block cosmic attacks, and fire the cinematic Unibeam.',
    controls: '[A] Repulsor Blast • [S] Power Punch • [D] Unibeam • [SPACE] Block (or touch buttons)',
    className: 'IronManGame',
    pageUrl: 'games/iron-man.html',
    accentColor: '#d50000',
    bannerGradient: 'linear-gradient(135deg, #1f0707 0%, #4a0d18 40%, #1e1428 100%)',
    badge: 'Fighter'
  },
  {
    id: 'thor',
    title: 'Thor: Thunder Surge',
    hero: 'Thor Odinson',
    category: 'character',
    icon: '⚡',
    mechanic: 'Oscillating Charge Timing',
    desc: 'Channel atmospheric lightning into Mjolnir. Release at the exact sweet spot to strike Frost Giant waves with cascading chain electricity.',
    controls: 'Hold [Space] or Tap to charge; Release inside green crest.',
    className: 'ThorGame',
    pageUrl: 'games/thor.html',
    accentColor: '#00f0ff',
    bannerGradient: 'linear-gradient(135deg, #051a1a 0%, #0a3040 40%, #14182e 100%)',
    badge: 'Timing'
  },
  {
    id: 'thorhammer',
    title: 'Mjolnir Return',
    hero: 'Thor Odinson',
    category: 'character',
    icon: '🔨',
    mechanic: 'Physics & Pathing',
    desc: 'Throw Mjolnir through enemies and breakable obstacles. Control your power and aim to hit targets on both the outgoing and returning paths.',
    controls: 'Hold Click/Touch to charge power, drag to aim, release to throw.',
    className: 'ThorHammerGame',
    pageUrl: 'games/thor-hammer.html',
    accentColor: '#ffd200',
    bannerGradient: 'linear-gradient(135deg, #0a101a 0%, #1a3040 40%, #14182e 100%)',
    badge: 'Physics'
  },
  {
    id: 'antman',
    title: 'Ant-Man: Quantum Heist',
    hero: 'Ant-Man',
    category: 'character',
    icon: '🐜',
    mechanic: 'Dual-Scale Size & Mass',
    desc: 'Toggle between Micro (slip under lasers) and Giant (crush security bots) to breach Yellowjacket\'s vault.',
    controls: 'WASD/Arrows to walk & jump; [Q] / Tap Screen to switch scale.',
    className: 'AntManGame',
    pageUrl: 'games/ant-man.html',
    accentColor: '#d32f2f',
    bannerGradient: 'linear-gradient(135deg, #1a0808 0%, #3d1515 40%, #281414 100%)',
    badge: 'Platformer'
  },

  // PART B: MULTIVERSE MISSIONS
  {
    id: 'doctorstrange',
    title: 'Doctor Strange: Mirror Portals',
    hero: 'Doctor Strange',
    category: 'multiverse',
    icon: '🌀',
    mechanic: 'Spatial Portal Looping',
    desc: 'Place linked Orange and Blue sling ring portals to fling Strange across shattered Mirror Dimension voids.',
    controls: 'Click/Tap anywhere to place linked Orange and Blue portals.',
    className: 'DoctorStrangeGame',
    pageUrl: 'games/doctor-strange.html',
    accentColor: '#ff9100',
    bannerGradient: 'linear-gradient(135deg, #1a1005 0%, #402a0a 40%, #281e14 100%)',
    badge: 'Spatial'
  },
  {
    id: 'scarletwitch',
    title: 'Scarlet Witch: Hex Polarity',
    hero: 'Scarlet Witch',
    category: 'multiverse',
    icon: '🔮',
    mechanic: 'Binary Reality Swap',
    desc: 'Swap between Earth-616 (Red) and Hex Reality (Purple) mid-air to turn intangible obstacles into solid platforms.',
    controls: 'WASD/Arrows to run & jump; [F] or Tap right screen to swap polarity.',
    className: 'ScarletWitchGame',
    pageUrl: 'games/scarlet-witch.html',
    accentColor: '#d500f9',
    bannerGradient: 'linear-gradient(135deg, #1a051a 0%, #3d0a3d 40%, #28142e 100%)',
    badge: 'Phase Swap'
  },
  {
    id: 'tvaloki',
    title: 'TVA: Chrono-Paradox Protocol',
    hero: 'Loki / TVA',
    category: 'multiverse',
    icon: '⏳',
    mechanic: 'Time-Rewind Clone Puzzle',
    desc: 'Step on security plates, then rewind time so your recorded variant clone holds gates open while you advance.',
    controls: 'WASD/Arrows to move; Press [R] or Tap Rewind to time-slip.',
    className: 'TVALokiGame',
    pageUrl: 'games/tva-loki.html',
    accentColor: '#ffab00',
    bannerGradient: 'linear-gradient(135deg, #1a1505 0%, #3d2d0a 40%, #2e2814 100%)',
    badge: 'Time-Loop'
  },
  {
    id: 'watchernexus',
    title: "Watcher's Nexus: Anomaly Sieve",
    hero: 'The Watcher',
    category: 'multiverse',
    icon: '👁️',
    mechanic: 'Incursion Triage',
    desc: 'Inspect parallel timelines side-by-side. Spot and quarantine foreign multiverse incursions before collapse.',
    controls: 'Click/Tap directly on anomalous multiverse glitches in right panel.',
    className: 'WatcherNexusGame',
    pageUrl: 'games/watcher-nexus.html',
    accentColor: '#00e5ff',
    bannerGradient: 'linear-gradient(135deg, #051a1a 0%, #0a3535 40%, #141e2e 100%)',
    badge: 'Pattern'
  },
  {
    id: 'deadpool',
    title: 'Deadpool: Multiverse Demolition',
    hero: 'Deadpool',
    category: 'multiverse',
    icon: '💥',
    mechanic: 'Ballistic Physics Destruction',
    desc: 'Pull back Deadpool\'s slingshot cannon to launch explosive ordnance, toppling Kingpin\'s portal spires into the Void.',
    controls: 'Drag back on slingshot to adjust angle and force; Release to fire.',
    className: 'DeadpoolGame',
    pageUrl: 'games/deadpool.html',
    accentColor: '#ff1744',
    bannerGradient: 'linear-gradient(135deg, #1a0505 0%, #3d0a0a 40%, #281414 100%)',
    badge: 'Demolition'
  },

  // NEW CHARACTER MISSIONS
  {
    id: 'blackpanther',
    title: 'Black Panther: Kinetic Burst',
    hero: "Black Panther (T'Challa)",
    category: 'character',
    icon: '🐾',
    mechanic: 'Kinetic Absorption & Shockwaves',
    desc: 'Absorb plasma projectiles into the Vibranium weave suit, then discharge directional shockwave blasts to liberate the Wakandan Great Mound.',
    controls: 'Move to absorb blasts into suit; Drag / Tap to aim & unleash directional shockwave bursts.',
    className: 'BlackPantherGame',
    pageUrl: 'games/black-panther.html',
    accentColor: '#a855f7',
    bannerGradient: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 40%, #0f172a 100%)',
    badge: 'Vibranium'
  },
  {
    id: 'wolverine',
    title: 'Wolverine: Adamantium Rush',
    hero: 'Wolverine (Logan)',
    category: 'character',
    icon: '🐺',
    mechanic: 'Vector Claw Slashes & Rage',
    desc: 'Launch high-velocity Adamantium claw dashes through Sentinel drones, build Berserker Fury, and regenerate with mutant healing.',
    controls: 'Drag/Swipe or Click to dash & shred enemies; Avoid damage to trigger Healing Factor.',
    className: 'WolverineGame',
    pageUrl: 'games/wolverine.html',
    accentColor: '#eab308',
    bannerGradient: 'linear-gradient(135deg, #1e1b4b 0%, #854d0e 40%, #090d16 100%)',
    badge: 'Berserker'
  },
  {
    id: 'hawkeye',
    title: 'Hawkeye: Arrow Trace',
    hero: 'Hawkeye (Clint Barton)',
    category: 'character',
    icon: '🎯',
    mechanic: 'Ballistic Crosswind Archery',
    desc: 'Compensate for dynamic crosswind gusts from Manhattan rooftops and fire Standard, Explosive, or EMP trick arrows against Chitauri invaders.',
    controls: 'Click & Drag bow to aim/power; Keys 1-3 to swap Trick Arrows.',
    className: 'HawkeyeGame',
    pageUrl: 'games/hawkeye.html',
    accentColor: '#a855f7',
    bannerGradient: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 40%, #090d16 100%)',
    badge: 'Archery'
  },
  {
    id: 'groot',
    title: 'Groot: Root Weaver',
    hero: 'Groot & Rocket',
    category: 'character',
    icon: '🌳',
    mechanic: 'Branch Drawing & Deflection',
    desc: 'Draw living Flora Colossus root branches to channel blue energy cells into Rocket’s reactor hopper while bouncing bombs into waste chutes.',
    controls: 'Click & Drag to draw living branches; Funnel energy cells to center hopper.',
    className: 'GrootGame',
    pageUrl: 'games/groot.html',
    accentColor: '#22c55e',
    bannerGradient: 'linear-gradient(135deg, #064e3b 0%, #14532d 40%, #022c22 100%)',
    badge: 'Drawing'
  },

  // NEW MULTIVERSE / TIMELINE MISSIONS
  {
    id: 'chronobranch',
    title: 'Chrono-Branch Pruner',
    hero: 'TVA Hunter / Minutemen',
    category: 'multiverse',
    icon: '🌿',
    mechanic: 'Timeline Stream Pruning',
    desc: 'Jump between 3 parallel timeline strands to deploy TVA Reset Charges onto divergent nexus events before branches breach the fatal Red Line.',
    controls: 'Click strand or W/S/Arrows to shift; Click or Space to deploy Reset Charges.',
    className: 'ChronoBranchGame',
    pageUrl: 'games/chrono-branch.html',
    accentColor: '#f97316',
    bannerGradient: 'linear-gradient(135deg, #1c1917 0%, #7c2d12 40%, #172554 100%)',
    badge: 'Timeline'
  },
  {
    id: 'temporalecho',
    title: 'Temporal Echo: Dual Era',
    hero: 'Kang Citadel Variants',
    category: 'multiverse',
    icon: '⏳',
    mechanic: 'Split-Screen Cause & Effect',
    desc: 'Guide two temporal variants simultaneously in 1942 (Past) and 2099 (Future). Flipping switches in the past unlocks high-tech gates in the future.',
    controls: 'Mouse/Touch screen halves to steer; A/D or Arrow Keys to navigate both eras.',
    className: 'TemporalEchoGame',
    pageUrl: 'games/temporal-echo.html',
    accentColor: '#38bdf8',
    bannerGradient: 'linear-gradient(135deg, #292524 0%, #0369a1 50%, #090d16 100%)',
    badge: 'Dual-Era'
  },
  {
    id: 'canonstabilizer',
    title: 'Canon Stabilizer: Quantum Shutter',
    hero: "Spider-Man 2099 (Miguel O'Hara)",
    category: 'multiverse',
    icon: '🕸️',
    mechanic: 'Tri-State Reality Superposition',
    desc: 'Switch the Spider-Society Loom shutter between Alpha (Cyan), Beta (Pink), and Gamma (Gold) to stabilize convergent canon fragments and purge decoherence.',
    controls: 'Keys 1, 2, 3 or Click Pods to switch Frequency; Spacebar for Overdrive purge.',
    className: 'CanonStabilizerGame',
    pageUrl: 'games/canon-stabilizer.html',
    accentColor: '#ec4899',
    bannerGradient: 'linear-gradient(135deg, #1e1b4b 0%, #831843 40%, #020617 100%)',
    badge: 'Quantum'
  },
  {
    id: 'incursionpoint',
    title: 'Incursion Point: Orbital Collision',
    hero: 'Illuminati Planetary Defense',
    category: 'multiverse',
    icon: '🪐',
    mechanic: 'Orbital Graviton Deflection',
    desc: 'Earth-616 and Earth-1610 are collapsing into mutual incursion! Fire Graviton Repulsors and shoot down antimatter missiles to keep worlds outside the Roche Limit.',
    controls: 'Move mouse to position Satellite; Click/Tap to fire Graviton Repulsor pulses.',
    className: 'IncursionPointGame',
    pageUrl: 'games/incursion-point.html',
    accentColor: '#8b5cf6',
    bannerGradient: 'linear-gradient(135deg, #0c1a2e 0%, #450a0a 50%, #1e1138 100%)',
    badge: 'Incursion'
  },
  {
    id: 'lokitimelinehunt',
    title: 'Loki: Timeline Hunt',
    hero: 'Loki / God of Stories',
    category: 'multiverse',
    icon: '⏳',
    mechanic: 'Multi-Era Timeline Shifting',
    desc: 'Switch between Past, Present, and Future of TVA Sector 4 to observe timeline differences, trigger cross-temporal cause & effect, and stabilize reality.',
    controls: 'WASD/Arrows to move & jump; [E] to interact; [1, 2, 3] to jump timelines.',
    className: 'LokiTimelineHuntGame',
    pageUrl: 'games/loki-timeline-hunt.html',
    accentColor: '#22c55e',
    bannerGradient: 'linear-gradient(135deg, #064e3b 0%, #14532d 40%, #2e2814 100%)',
    badge: 'Timeline Hunt'
  },

  // NEW DOOMSDAY EVENTS
  {
    id: 'heraldsexodus',
    title: "Herald's Exodus: Galactus Devours",
    hero: 'Silver Surfer (Norrin Radd)',
    category: 'doomsday',
    icon: '🌌',
    mechanic: 'Gravity Slingshot Escort',
    desc: 'Galactus is consuming the star system from behind! Tether around celestial gravity wells for slingshot bursts and blast asteroids to escort refugee arks to safety.',
    controls: 'Click Moons to Tether/Slingshot; Click space to fire Cosmic Blasts; Mouse moves Surfer.',
    className: 'HeraldsExodusGame',
    pageUrl: 'games/heralds-exodus.html',
    accentColor: '#c084fc',
    bannerGradient: 'linear-gradient(135deg, #581c87 0%, #3b0764 40%, #020617 100%)',
    badge: 'Doomsday'
  },
  {
    id: 'beyondercore',
    title: 'Secret Wars: Beyonder Core',
    hero: 'God Emperor Doom',
    category: 'doomsday',
    icon: '👑',
    mechanic: 'Omniversal Conduit Routing',
    desc: 'Channel the omnipotent energy of the Beyonders across 4 Battleworld reactor quadrants. Vent thermal pressure and siphon cosmic sparks to avert reality meltdown.',
    controls: 'Keys Q, W, A, S or Click Pods to vent heat; Click Golden Sparks to siphon energy.',
    className: 'BeyonderCoreGame',
    pageUrl: 'games/beyonder-core.html',
    accentColor: '#10b981',
    bannerGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #0f172a 100%)',
    badge: 'Doomsday'
  },
  {
    id: 'lokithelasttimeline',
    title: 'Loki: The Last Timeline (Full 2.5D Saga)',
    hero: 'Loki & The Avengers',
    category: 'doomsday',
    icon: '⌛',
    mechanic: '2.5D Time-Shifting Campaign',
    desc: 'Doctor Doom is rewriting realities with the Chrono Forge! Team up with Thor, Captain America, Iron Man, and Doctor Strange across Past, Present, and Future eras to recover the 4 Nexus Cores.',
    controls: '[A][D] Move • [W] Jump • [Z] Scepter • [X] Magic • [C] Time Freeze • [V] Rewind • [E] Interact',
    pageUrl: 'loki-timeline-collapse/index.html',
    accentColor: '#10b981',
    bannerGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #1e1b4b 100%)',
    badge: 'Epic 5-Stage Saga'
  }
];

/* ========================================================================
   ANIMATED BACKGROUND PARTICLES
   ======================================================================== */
class BackgroundParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initParticles() {
    const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    const colors = ['#e23636', '#ffd200', '#8a2be2', '#00f0ff', '#0088ff', '#ff007f'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.8 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.1
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Subtle glow
      this.ctx.globalAlpha = p.alpha * 0.3;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    // Draw faint connection lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          this.ctx.save();
          this.ctx.globalAlpha = (1 - dist / 120) * 0.06;
          this.ctx.strokeStyle = '#fff';
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

/* ========================================================================
   MULTIVERSE ACHIEVEMENTS & TROPHIES DEFINITION
   ======================================================================== */
const TROPHIES = [
  { id: 'first_strike', name: 'First Strike', icon: '🛡️', desc: 'Deploy on your first Multiverse mission.', check: (scores, played) => played >= 1 },
  { id: 'titan_fall', name: 'Titan Fall', icon: '🥊', desc: 'Score 2,000+ PTS in Iron Man vs Thanos.', check: (scores) => (scores['ironman'] || 0) >= 2000 },
  { id: 'god_of_thunder', name: 'God of Thunder', icon: '⚡', desc: 'Score 1,500+ PTS in Mjolnir Return.', check: (scores) => (scores['thorhammer'] || 0) >= 1500 || (scores['thor'] || 0) >= 1500 },
  { id: 'master_of_mystic', name: 'Mystic Master', icon: '🌀', desc: 'Score 1,500+ PTS in Doctor Strange.', check: (scores) => (scores['doctorstrange'] || 0) >= 1500 },
  { id: 'maximum_effort', name: 'Maximum Effort', icon: '💥', desc: 'Score 2,000+ PTS in Deadpool Demolition.', check: (scores) => (scores['deadpool'] || 0) >= 2000 },
  { id: 'chaos_queen', name: 'Chaos Unleashed', icon: '🔮', desc: 'Score 1,500+ PTS in Scarlet Witch.', check: (scores) => (scores['scarletwitch'] || 0) >= 1500 },
  { id: 'god_of_stories', name: 'God of Stories', icon: '⏳', desc: 'Score 1,500+ PTS in TVA Loki or Timeline Hunt.', check: (scores) => (scores['tvaloki'] || 0) >= 1500 || (scores['lokitimelinehunt'] || 0) >= 1500 },
  { id: 'world_eater', name: "Herald's Flight", icon: '🪐', desc: 'Score 1,500+ PTS in Herald’s Exodus.', check: (scores) => (scores['heraldsexodus'] || 0) >= 1500 },
  { id: 'beyonder_core', name: 'Secret Wars Champion', icon: '🌌', desc: 'Score 1,500+ PTS in Beyonder Core.', check: (scores) => (scores['beyondercore'] || 0) >= 1500 },
  { id: 'multiverse_legend', name: 'Multiverse Legend', icon: '👑', desc: 'Deploy and score in at least 8 different missions.', check: (scores, played) => played >= 8 }
];

/* ========================================================================
   MARVEL HUB CONTROLLER
   ======================================================================== */
class MarvelHub {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.activeGame = null;
    this.activeGameMeta = null;
    this.init();
  }

  init() {
    this.renderCatalog();
    this.bindEvents();
    this.updateStats();
    this.updateTrophyUI();

    // Initialize background particles
    new BackgroundParticles('bgParticles');

    // Dismiss loading screen after content is ready
    requestAnimationFrame(() => {
      setTimeout(() => {
        const loader = document.getElementById('loadingScreen');
        if (loader) loader.classList.add('fade-out');
      }, 1200);
    });
  }

  getScores() {
    try {
      return JSON.parse(localStorage.getItem('marvel_mini_scores') || '{}');
    } catch (e) {
      return {};
    }
  }

  recordScore(gameId, score) {
    const scores = this.getScores();
    if (!scores[gameId] || score > scores[gameId]) {
      scores[gameId] = score;
      localStorage.setItem('marvel_mini_scores', JSON.stringify(scores));
      this.updateStats();
      this.updateTrophyUI();
      this.renderCatalog();
    }
  }

  getUnlockedTrophies() {
    const scores = this.getScores();
    const played = Object.keys(scores).length;
    return TROPHIES.filter(t => t.check(scores, played));
  }

  updateTrophyUI() {
    const unlocked = this.getUnlockedTrophies();
    const countEl = document.getElementById('trophyCount');
    if (countEl) countEl.textContent = `${unlocked.length}/${TROPHIES.length}`;
  }

  openTrophiesModal() {
    const modal = document.getElementById('trophyModal');
    const grid = document.getElementById('trophyGrid');
    if (!modal || !grid) return;

    const scores = this.getScores();
    const played = Object.keys(scores).length;

    grid.innerHTML = '';
    TROPHIES.forEach(t => {
      const isUnlocked = t.check(scores, played);
      const card = document.createElement('div');
      card.className = `trophy-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="trophy-icon">${isUnlocked ? t.icon : '🔒'}</div>
        <div class="trophy-info">
          <h4>${t.name} ${isUnlocked ? '✓' : ''}</h4>
          <p>${t.desc}</p>
        </div>
      `;
      grid.appendChild(card);
    });

    modal.classList.remove('hidden');
    if (window.soundFX) window.soundFX.shieldBounce();
  }

  closeTrophiesModal() {
    const modal = document.getElementById('trophyModal');
    if (modal) modal.classList.add('hidden');
  }

  triggerRandomMission() {
    if (window.soundFX) {
      window.soundFX.init();
      if (window.soundFX.clusterBurst) window.soundFX.clusterBurst();
      else window.soundFX.thwip();
    }

    // Pick random game
    const randomGame = GAMES_CATALOG[Math.floor(Math.random() * GAMES_CATALOG.length)];
    this.launchGame(randomGame.id);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      const btn = document.getElementById('fullscreenBtn');
      if (btn) btn.textContent = '✕ EXIT FULL';
    } else {
      document.exitFullscreen().catch(() => {});
      const btn = document.getElementById('fullscreenBtn');
      if (btn) btn.textContent = '⛶ FULLSCREEN';
    }
  }

  updateStats() {
    const scores = this.getScores();
    const played = Object.keys(scores).length;
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    const playedEl = document.getElementById('statMissionsPlayed');
    const scoreEl = document.getElementById('statTotalScore');
    if (playedEl) playedEl.textContent = `${played}/${GAMES_CATALOG.length}`;
    if (scoreEl) scoreEl.textContent = totalScore.toLocaleString();
  }

  renderCatalog() {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const scores = this.getScores();
    const q = this.searchQuery.toLowerCase().trim();

    const filtered = GAMES_CATALOG.filter(g => {
      // Category filter
      if (this.currentFilter === 'character' && g.category !== 'character') return false;
      if (this.currentFilter === 'multiverse' && g.category !== 'multiverse') return false;
      if (this.currentFilter === 'doomsday' && g.category !== 'doomsday') return false;

      // Search query filter
      if (q) {
        const match = g.title.toLowerCase().includes(q) ||
                      g.hero.toLowerCase().includes(q) ||
                      g.mechanic.toLowerCase().includes(q) ||
                      g.desc.toLowerCase().includes(q) ||
                      g.badge.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; color: #9ba1b0;">
          <div style="font-size: 42px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-family: var(--comic-font); font-size: 24px; color: #ffd200;">NO MISSIONS MATCHED</h3>
          <p style="font-size: 14px;">Try searching for another hero (e.g. Iron Man, Thor, Spider-Man, Deadpool) or reset your filter.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((game, index) => {
      const card = document.createElement('div');
      const isDoomsday = game.category === 'doomsday';
      const isMultiverse = game.category === 'multiverse';
      card.className = `game-card ${isDoomsday ? 'doomsday-card' : (isMultiverse ? 'multiverse-card' : '')}`;
      card.style.setProperty('--accent-color', game.accentColor);
      card.style.setProperty('--card-index', index);

      const hiScore = scores[game.id] || 0;
      const categoryTag = game.category === 'character' ? 'CHARACTER MISSION' : (game.category === 'doomsday' ? 'DOOMSDAY EVENT' : 'MULTIVERSE MISSION');

      card.innerHTML = `
        <div class="card-banner" style="background: ${game.bannerGradient};">
          <div class="card-character-icon">${game.icon}</div>
          <div class="card-badge">${game.badge}</div>
          <div class="card-category-tag">${categoryTag}</div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${game.title}</h3>
          <span class="card-mechanic-tag">${game.mechanic}</span>
          <p class="card-desc">${game.desc}</p>
          <div class="card-footer">
            <span class="card-score">BEST: <b>${hiScore.toLocaleString()}</b></span>
            <div class="card-buttons">
              <a href="${game.pageUrl}" class="play-btn standalone-btn" target="_blank" rel="noopener">🌐 SOLO</a>
              <button class="play-btn arena-launch-btn" data-game-id="${game.id}">▶ PLAY</button>
            </div>
          </div>
        </div>
      `;

      const standaloneLink = card.querySelector('.standalone-btn');
      standaloneLink.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      const arenaBtn = card.querySelector('.arena-launch-btn');
      arenaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.launchGame(game.id);
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-buttons')) return;
        this.launchGame(game.id);
      });

      grid.appendChild(card);
    });
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('gameSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderCatalog();
      });
    }

    // Random mission roulette button
    const rouletteBtn = document.getElementById('randomMissionBtn');
    if (rouletteBtn) {
      rouletteBtn.addEventListener('click', () => this.triggerRandomMission());
    }

    // Trophy Room Modal Open/Close
    const trophyBtn = document.getElementById('trophyBtn');
    if (trophyBtn) {
      trophyBtn.addEventListener('click', () => this.openTrophiesModal());
    }
    const closeTrophyBtn = document.getElementById('closeTrophyModalBtn');
    if (closeTrophyBtn) {
      closeTrophyBtn.addEventListener('click', () => this.closeTrophiesModal());
    }
    const trophyModal = document.getElementById('trophyModal');
    if (trophyModal) {
      trophyModal.addEventListener('click', (e) => {
        if (e.target === trophyModal) this.closeTrophiesModal();
      });
    }

    // Procedural BGM Synthesizer Toggle
    const bgmBtn = document.getElementById('bgmToggleBtn');
    if (bgmBtn) {
      bgmBtn.addEventListener('click', () => {
        if (window.soundFX) {
          const isPlaying = window.soundFX.toggleBGM();
          bgmBtn.textContent = isPlaying ? '🎵 BGM: ON' : '🎵 BGM: OFF';
          bgmBtn.classList.toggle('active', isPlaying);
        }
      });
    }

    // Fullscreen Toggle
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // Category filter tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderCatalog();

        // Smooth scroll to grid
        const grid = document.getElementById('gamesGrid');
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Audio Toggle
    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        if (window.soundFX) {
          window.soundFX.init();
          const muted = window.soundFX.toggleMute();
          audioBtn.innerHTML = muted ? '🔇 SFX: OFF' : '🔊 SFX: ON';
        }
      });
    }

    // Close Arena
    const closeBtn = document.getElementById('closeArenaBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeGame());
    }

    // Start Mission
    const startBtn = document.getElementById('startMissionBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (window.soundFX) window.soundFX.init();
        document.getElementById('readyOverlay').classList.add('hidden');
        if (this.activeGame) {
          this.activeGame.state = 'PLAYING';
        }
      });
    }

    // Retry
    const retryBtn = document.getElementById('retryMissionBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        document.getElementById('gameOverOverlay').classList.add('hidden');
        if (this.activeGame) {
          this.activeGame.reset();
          this.activeGame.state = 'PLAYING';
        }
      });
    }

    // Victory Claim
    const victoryClaimBtn = document.getElementById('victoryClaimBtn');
    if (victoryClaimBtn) {
      victoryClaimBtn.addEventListener('click', () => {
        document.getElementById('victoryOverlay').classList.add('hidden');
        this.closeGame();
      });
    }

    // Resume from pause
    const resumeBtn = document.getElementById('resumeGameBtn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        if (this.activeGame) this.activeGame.togglePause();
      });
    }

    // Thunder button inside hub modal
    const thunderBtn = document.getElementById('thunderBtn');
    if (thunderBtn) {
      thunderBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.soundFX) window.soundFX.init();
        if (this.activeGame && typeof this.activeGame.triggerThunder === 'function') {
          this.activeGame.triggerThunder();
        }
      });
    }

    // Keyboard shortcut: Space for Thunder, Escape closes game modal or trophy modal
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.activeGame && typeof this.activeGame.triggerThunder === 'function') {
        const modal = document.getElementById('gameModal');
        if (modal && modal.classList.contains('active') && this.activeGame.state === 'PLAYING') {
          e.preventDefault();
          if (window.soundFX) window.soundFX.init();
          this.activeGame.triggerThunder();
        }
      }

      if (e.key === 'Escape') {
        this.closeTrophiesModal();
        if (this.activeGame && document.getElementById('gameModal').classList.contains('active')) {
          if (this.activeGame.state === 'READY' || this.activeGame.state === 'GAME_OVER' || this.activeGame.state === 'VICTORY') {
            this.closeGame();
          }
        }
      }
    });
  }

  launchGame(gameId) {
    if (window.soundFX) window.soundFX.init();

    const meta = GAMES_CATALOG.find(g => g.id === gameId);
    if (!meta) return;
    this.activeGameMeta = meta;

    // Direct launch for standalone campaign sagas (e.g. Loki 2.5D Saga)
    if (!meta.className && meta.pageUrl) {
      window.location.href = meta.pageUrl;
      return;
    }

    // Set arena header info
    const nameEl = document.getElementById('arenaGameName');
    const heroEl = document.getElementById('arenaHeroBadge');
    const controlsEl = document.getElementById('arenaControlsHint');
    if (nameEl) nameEl.textContent = meta.title;
    if (heroEl) heroEl.textContent = meta.hero;
    if (controlsEl) controlsEl.textContent = meta.controls;

    // Set briefing overlay
    const readyTitle = document.getElementById('readyTitle');
    const readyDesc = document.getElementById('readyInstructions');
    const readyControls = document.getElementById('readyControls');
    if (readyTitle) readyTitle.textContent = meta.title;
    if (readyDesc) readyDesc.textContent = meta.desc;
    if (readyControls) readyControls.innerHTML = `<span>🎮 CONTROLS:</span> ${meta.controls}`;

    // Reset all overlays
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('victoryOverlay').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');
    document.getElementById('readyOverlay').classList.remove('hidden');

    // FIX: Show modal using visibility/opacity (not display toggle)
    const modal = document.getElementById('gameModal');
    if (modal) modal.classList.add('active');

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Stop previous game
    if (this.activeGame) {
      if (typeof this.activeGame.stop === 'function') this.activeGame.stop();
      this.activeGame = null;
    }

    // Instantiate new game
    const GameClass = window[meta.className];
    if (GameClass) {
      this.activeGame = new GameClass();
      if (typeof this.activeGame.start === 'function') {
        this.activeGame.start();
      }
    }
  }

  closeGame() {
    if (this.activeGame) {
      if (typeof this.activeGame.stop === 'function') this.activeGame.stop();
      this.activeGame = null;
    }
    const modal = document.getElementById('gameModal');
    if (modal) modal.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';

    this.renderCatalog();
    this.updateStats();
  }
}

/* ========================================================================
   INITIALIZATION
   ======================================================================== */
function initHub() {
  if (!window.hub && document.getElementById('gamesGrid')) {
    window.hub = new MarvelHub();
  }
}

if (document.getElementById('gamesGrid')) {
  initHub();
} else if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHub);
} else {
  initHub();
}
