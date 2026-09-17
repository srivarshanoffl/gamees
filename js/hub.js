/**
 * hub.js
 * Main Marvel Mini-Games Hub Controller.
 * Manages game catalogs, category filters, localStorage scores,
 * modal launching/closing, and links to dedicated standalone websites.
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
    badge: 'Physics'
  },
  {
    id: 'captainamerica',
    title: 'Captain America: Shield Ricochet',
    hero: 'Captain America',
    category: 'character',
    icon: '🛡️',
    mechanic: 'Geometry Ricochet',
    desc: 'Calculate precise reflection angles to bounce the Vibranium Shield around titanium blast doors, eliminating Hydra sentries and shattering the Tesseract.',
    controls: 'Drag mouse/touch to aim bounce line; Release to throw shield.',
    className: 'CaptainAmericaGame',
    pageUrl: 'games/captain-america.html',
    accentColor: '#1565c0',
    badge: 'Puzzle'
  },
  {
    id: 'ironman',
    title: 'Iron Man: Reactor Overdrive',
    hero: 'Iron Man',
    category: 'character',
    icon: '🚀',
    mechanic: 'Resource Power Routing',
    desc: 'Route Arc Reactor power between Thrusters, Repulsors, and Shields in real-time to evade EMP missiles and defeat Ultron Prime over Stark Tower.',
    controls: 'WASD/Arrows/Drag to fly; [1] Thrust, [2] Blast, [3] Shield.',
    className: 'IronManGame',
    pageUrl: 'games/iron-man.html',
    accentColor: '#ffd200',
    badge: 'Defense'
  },
  {
    id: 'thor',
    title: 'Thor: Thunder Surge',
    hero: 'Thor Odinson',
    category: 'character',
    icon: '⚡',
    mechanic: 'Oscillating Charge Timing',
    desc: 'Channel atmospheric lightning into Mjolnir. Release at the exact green sweet spot to strike Frost Giant waves with cascading chain electricity.',
    controls: 'Hold [Space] or Tap to charge; Release inside green crest.',
    className: 'ThorGame',
    pageUrl: 'games/thor.html',
    accentColor: '#00f0ff',
    badge: 'Timing'
  },
  {
    id: 'antman',
    title: 'Ant-Man: Quantum Heist',
    hero: 'Ant-Man',
    category: 'character',
    icon: '🐜',
    mechanic: 'Dual-Scale Size & Mass',
    desc: 'Instantly toggle between Micro (slip under lasers & through vents) and Giant (crush security bots & press heavy switches) to breach Yellowjacket’s vault.',
    controls: 'WASD/Arrows to walk & jump; [Q] / Tap Screen to switch scale.',
    className: 'AntManGame',
    pageUrl: 'games/ant-man.html',
    accentColor: '#d32f2f',
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
    desc: 'Place linked Orange and Blue sling ring portals to fling Strange across shattered Mirror Dimension voids, recovering pages of the Darkhold.',
    controls: 'Click/Tap anywhere to place linked Orange and Blue portals.',
    className: 'DoctorStrangeGame',
    pageUrl: 'games/doctor-strange.html',
    accentColor: '#ff9100',
    badge: 'Spatial'
  },
  {
    id: 'scarletwitch',
    title: 'Scarlet Witch: Hex Polarity',
    hero: 'Scarlet Witch',
    category: 'multiverse',
    icon: '🔮',
    mechanic: 'Binary Reality Swap',
    desc: 'Swap between Earth-616 (Red) and Hex Reality (Purple) mid-air to turn intangible obstacles into solid platforms and reach the Darkhold altar.',
    controls: 'WASD/Arrows to run & jump; [F] or Tap right screen to swap polarity.',
    className: 'ScarletWitchGame',
    pageUrl: 'games/scarlet-witch.html',
    accentColor: '#d500f9',
    badge: 'Phase Swap'
  },
  {
    id: 'tvaloki',
    title: 'TVA: Chrono-Paradox Protocol',
    hero: 'Loki / TVA',
    category: 'multiverse',
    icon: '⏳',
    mechanic: 'Time-Rewind Clone Puzzle',
    desc: 'Step on security pressure plates, then rewind time with your TemPad so your recorded variant clone holds the gates open while you advance.',
    controls: 'WASD/Arrows to move; Press [R] or Tap Rewind to time-slip.',
    className: 'TVALokiGame',
    pageUrl: 'games/tva-loki.html',
    accentColor: '#ffab00',
    badge: 'Time-Loop'
  },
  {
    id: 'watchernexus',
    title: "Watcher's Nexus: Anomaly Sieve",
    hero: 'The Watcher',
    category: 'multiverse',
    icon: '👁️',
    mechanic: 'Incursion Triage',
    desc: 'Inspect parallel timelines side-by-side. Spot and quarantine foreign multiverse incursions before the universe collapse countdown hits zero.',
    controls: 'Click/Tap directly on anomalous multiverse glitches in right panel.',
    className: 'WatcherNexusGame',
    pageUrl: 'games/watcher-nexus.html',
    accentColor: '#00e5ff',
    badge: 'Pattern'
  },
  {
    id: 'deadpool',
    title: 'Deadpool: Multiverse Demolition',
    hero: 'Deadpool',
    category: 'multiverse',
    icon: '💥',
    mechanic: 'Ballistic Physics Destruction',
    desc: 'Pull back Deadpool’s multiversal slingshot cannon to launch chaotic explosive ordnance, toppling Kingpin’s dimensional portal spires into the Void.',
    controls: 'Drag back on slingshot to adjust angle and force; Release to fire.',
    className: 'DeadpoolGame',
    pageUrl: 'games/deadpool.html',
    accentColor: '#ff1744',
    badge: 'Demolition'
  }
];

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

    filtered.forEach(game => {
      const card = document.createElement('div');
      card.className = `game-card ${game.category === 'multiverse' ? 'multiverse-card' : ''}`;
      card.style.setProperty('--accent-color', game.accentColor);

      const hiScore = scores[game.id] || 0;

      card.innerHTML = `
        <div class="card-banner">
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
            <div style="display:flex; gap:8px;">
              <a href="${game.pageUrl}" class="play-btn" style="background:#222634; text-decoration:none; padding:6px 12px; font-size:14px;" target="_blank">🌐 STANDALONE</a>
              <button class="play-btn arena-launch-btn" data-game-id="${game.id}">PLAY ARENA</button>
            </div>
          </div>
        </div>
      `;

      card.querySelector('.arena-launch-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.launchGame(game.id);
      });

      card.addEventListener('click', () => this.launchGame(game.id));
      grid.appendChild(card);
    });
  }

  bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderCatalog();
      });
    });

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

    const closeBtn = document.getElementById('closeArenaBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeGame());
    }

    const startBtn = document.getElementById('startMissionBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        document.getElementById('readyOverlay').classList.add('hidden');
        if (this.activeGame) {
          this.activeGame.state = 'PLAYING';
        }
      });
    }

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

    const victoryClaimBtn = document.getElementById('victoryClaimBtn');
    if (victoryClaimBtn) {
      victoryClaimBtn.addEventListener('click', () => {
        document.getElementById('victoryOverlay').classList.add('hidden');
        this.closeGame();
      });
    }

    const resumeBtn = document.getElementById('resumeGameBtn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        if (this.activeGame) this.activeGame.togglePause();
      });
    }
  }

  launchGame(gameId) {
    if (window.soundFX) window.soundFX.init();

    const meta = GAMES_CATALOG.find(g => g.id === gameId);
    if (!meta) return;
    this.activeGameMeta = meta;

    const nameEl = document.getElementById('arenaGameName');
    const heroEl = document.getElementById('arenaHeroBadge');
    const controlsEl = document.getElementById('arenaControlsHint');
    if (nameEl) nameEl.textContent = meta.title;
    if (heroEl) heroEl.textContent = meta.hero;
    if (controlsEl) controlsEl.textContent = meta.controls;

    const readyTitle = document.getElementById('readyTitle');
    const readyDesc = document.getElementById('readyInstructions');
    const readyControls = document.getElementById('readyControls');
    if (readyTitle) readyTitle.textContent = meta.title;
    if (readyDesc) readyDesc.textContent = meta.desc;
    if (readyControls) readyControls.innerHTML = `<span>🎮 CONTROLS:</span> ${meta.controls}`;

    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('victoryOverlay').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');
    document.getElementById('readyOverlay').classList.remove('hidden');

    const modal = document.getElementById('gameModal');
    if (modal) modal.classList.add('active');

    if (this.activeGame) {
      this.activeGame.stop();
      this.activeGame = null;
    }

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
    this.renderCatalog();
    this.updateStats();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.hub = new MarvelHub();
});
