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
    title: 'Iron Man: Reactor Overdrive',
    hero: 'Iron Man',
    category: 'character',
    icon: '🚀',
    mechanic: 'Resource Power Routing',
    desc: 'Route Arc Reactor power between Thrusters, Repulsors, and Shields in real-time to evade EMP missiles and defeat Ultron Prime.',
    controls: 'WASD/Arrows/Drag to fly; [1] Thrust, [2] Blast, [3] Shield.',
    className: 'IronManGame',
    pageUrl: 'games/iron-man.html',
    accentColor: '#ffd200',
    bannerGradient: 'linear-gradient(135deg, #1a1505 0%, #3d2d0a 40%, #1e1a14 100%)',
    badge: 'Defense'
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
   MARVEL HUB CONTROLLER
   ======================================================================== */
class MarvelHub {
  constructor() {
    this.currentFilter = 'all';
    this.activeGame = null;
    this.activeGameMeta = null;
    this.init();
  }

  init() {
    this.renderCatalog();
    this.bindEvents();
    this.updateStats();

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
      this.renderCatalog();
    }
  }

  updateStats() {
    const scores = this.getScores();
    const played = Object.keys(scores).length;
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    const playedEl = document.getElementById('statMissionsPlayed');
    const scoreEl = document.getElementById('statTotalScore');
    if (playedEl) playedEl.textContent = `${played}/10`;
    if (scoreEl) scoreEl.textContent = totalScore.toLocaleString();
  }

  renderCatalog() {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const scores = this.getScores();

    const filtered = GAMES_CATALOG.filter(g => {
      if (this.currentFilter === 'character') return g.category === 'character';
      if (this.currentFilter === 'multiverse') return g.category === 'multiverse';
      return true;
    });

    filtered.forEach((game, index) => {
      const card = document.createElement('div');
      card.className = `game-card ${game.category === 'multiverse' ? 'multiverse-card' : ''}`;
      card.style.setProperty('--accent-color', game.accentColor);
      card.style.setProperty('--card-index', index);

      const hiScore = scores[game.id] || 0;

      card.innerHTML = `
        <div class="card-banner" style="background: ${game.bannerGradient};">
          <div class="card-character-icon">${game.icon}</div>
          <div class="card-badge">${game.badge}</div>
          <div class="card-category-tag">${game.category === 'character' ? 'CHARACTER MISSION' : 'MULTIVERSE MISSION'}</div>
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

      // FIX: Properly separate click targets
      // The standalone link should navigate; the arena button launches modal;
      // clicking the card body (outside buttons) also launches the game
      const standaloneLink = card.querySelector('.standalone-btn');
      standaloneLink.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger card click
      });

      const arenaBtn = card.querySelector('.arena-launch-btn');
      arenaBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger card click
        this.launchGame(game.id);
      });

      // Card-level click — only fires if button/link wasn't the target
      card.addEventListener('click', (e) => {
        // Prevent double-launch if a button was clicked
        if (e.target.closest('.card-buttons')) return;
        this.launchGame(game.id);
      });

      grid.appendChild(card);
    });
  }

  bindEvents() {
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
          audioBtn.innerHTML = muted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
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

    // Keyboard shortcut: Escape closes game modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeGame && document.getElementById('gameModal').classList.contains('active')) {
        // Only close if not in an active game state
        if (this.activeGame.state === 'READY' || this.activeGame.state === 'GAME_OVER' || this.activeGame.state === 'VICTORY') {
          this.closeGame();
        }
      }
    });
  }

  launchGame(gameId) {
    if (window.soundFX) window.soundFX.init();

    const meta = GAMES_CATALOG.find(g => g.id === gameId);
    if (!meta) return;
    this.activeGameMeta = meta;

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
      this.activeGame.stop();
      this.activeGame = null;
    }

    // Instantiate new game
    const GameClass = window[meta.className];
    if (GameClass) {
      this.activeGame = new GameClass();
      this.activeGame.start();
    }
  }

  closeGame() {
    if (this.activeGame) {
      this.activeGame.stop();
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
  if (!window.hub) {
    window.hub = new MarvelHub();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHub);
} else {
  initHub();
}
