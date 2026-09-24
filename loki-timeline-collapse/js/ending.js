/**
 * ending.js — Controller for Page 5: The Final Collision & Epilogue
 * Manages the 3-phase final battle against Doctor Doom and the Chrono Forge,
 * ending cinematic, and "Loki Will Return" epilogue.
 */

class EndingGame extends PlatformEngine {
  constructor() {
    super('gameCanvas');

    this.battlePhase = 1; // 1: Forge Engines, 2: Doom Direct, 3: Era Assault
    this.enginesDestroyed = { asgard: false, cap: false, stark: false, mystic: false };

    this.player = new LokiPlayer(this);
    this.bossFight = new BossFight(this);
    this.enemySystem = new EnemySystem(this);

    // Companions united
    this.companions = [
      new Companion(this, 'thor'),
      new Companion(this, 'cap'),
      new Companion(this, 'ironman'),
      new Companion(this, 'strange')
    ];

    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn && this.audio) {
      audioBtn.addEventListener('click', () => {
        this.audio.init();
        const muted = this.audio.toggleMute();
        audioBtn.innerText = muted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
      });
    }

    this.initPhase1();
    this.playIntroDialogue();
  }

  playIntroDialogue() {
    this.dialogue.say([
      { speaker: 'doom', text: 'Behold the culmination of your labor, Loki! The Chrono Forge has bound Past, Present, and Future into Latverian order!' },
      { speaker: 'loki', text: 'You made one fatal miscalculation, Doom. You brought the greatest heroes of four dimensions to the exact same place.' },
      { speaker: 'thor', text: 'For Midgard and the Timelines! Shatter the Forge engines!' },
      { speaker: 'cap', text: 'Avengers... and God of Stories: Assemble!' }
    ]);
  }

  initPhase1() {
    this.levelWidth = 2400;
    this.player.x = 200;
    this.player.y = 380;

    // Arena Platforms
    this.platforms = [
      { x: 0, y: 460, w: 2400, h: 80, type: 'doom' },
      { x: 300, y: 340, w: 260, h: 20, type: 'doom' },
      { x: 750, y: 260, w: 300, h: 20, type: 'doom' },
      { x: 1350, y: 260, w: 300, h: 20, type: 'doom' },
      { x: 1850, y: 340, w: 260, h: 20, type: 'doom' }
    ];

    // Position united companions along the platforms
    this.companions[0].x = 350; this.companions[0].y = 280; // Thor
    this.companions[1].x = 850; this.companions[1].y = 200; // Cap
    this.companions[2].x = 1450; this.companions[2].y = 200; // Iron Man
    this.companions[3].x = 1950; this.companions[3].y = 280; // Strange

    // 4 Forge Engines as proper InteractiveObject instances
    const engineConfigs = [
      { type: 'storm_switch',  x: 420,  y: 280, width: 48, height: 56, label: 'THOR ENGINE [E]',    data: { engineKey: 'asgard' } },
      { type: 'shield_switch', x: 950,  y: 200, width: 48, height: 56, label: 'CAP ENGINE [E]',     data: { engineKey: 'cap' } },
      { type: 'terminal',      x: 1550, y: 200, width: 48, height: 56, label: 'STARK ENGINE [E]',   data: { engineKey: 'stark' } },
      { type: 'puzzle', puzzleId: 'mystic_knot', x: 2050, y: 280, width: 48, height: 56, label: 'STRANGE ENGINE [E]', data: { engineKey: 'mystic' } }
    ];

    this.interactiveObjects = engineConfigs.map(cfg => {
      const obj = new InteractiveObject(cfg);
      // Patch onActivate callback to track Forge engine destruction
      const origInteract = obj.interact.bind(obj);
      obj.interact = (eng, plr, cmp) => {
        const res = origInteract(eng, plr, cmp);
        if (cfg.data && cfg.data.engineKey) {
          this.destroyEngine(cfg.data.engineKey);
        }
        return res;
      };
      return obj;
    });

    this.state = 'PLAYING';
  }

  destroyEngine(key) {
    if (this.enginesDestroyed[key]) return;
    this.enginesDestroyed[key] = true;

    const pill = document.getElementById(`engine-${key}`);
    if (pill) {
      pill.classList.add('recovered');
      pill.innerText += ' [OFFLINE]';
    }

    this.shakeScreen(10, 0.4);
    if (this.particles) {
      this.particles.showPopupText(`${key.toUpperCase()} ENGINE OVERLOADED!`, this.player.x, this.player.y - 40, '#ef4444');
    }

    // Check if all 4 are destroyed
    if (
      this.enginesDestroyed.asgard &&
      this.enginesDestroyed.cap &&
      this.enginesDestroyed.stark &&
      this.enginesDestroyed.mystic
    ) {
      this.transitionToPhase2();
    }
  }

  transitionToPhase2() {
    this.battlePhase = 2;
    const hudPhase = document.getElementById('hudPhaseText');
    if (hudPhase) hudPhase.innerText = 'PHASE 2: DOCTOR DOOM DIRECT';

    this.dialogue.say([
      { speaker: 'doom', text: 'Insolent worms! You think destroying the containment conduits saves you? I AM THE FORGE!' },
      { speaker: 'loki', text: 'His armor is exposed. Strike together!' }
    ]);

    // Spawn Doctor Doom in center arena
    this.bossFight.spawnBoss('doom', 1200, 340);
    this.bossFight.onBossDefeated = () => this.transitionToPhase3();
  }

  transitionToPhase3() {
    this.battlePhase = 3;
    const hudPhase = document.getElementById('hudPhaseText');
    if (hudPhase) hudPhase.innerText = 'PHASE 3: ERA TRAVEL ASSAULT';

    this.dialogue.say([
      { speaker: 'doom', text: 'Impossible... my temporal anchors are slipping!' },
      { speaker: 'strange', text: 'Loki! The Forge exists in all three times! You must shift between eras and shatter its core simultaneously!' },
      {
        speaker: 'loki',
        text: 'Past, Present, and Future... I will rewrite this ending!',
        onComplete: () => {
          this.executeFinalShatter();
        }
      }
    ]);
  }

  executeFinalShatter() {
    // Massive Screen-Wide VFX & Sound
    this.shakeScreen(25, 3.5);
    if (this.audio) {
      this.audio.playExplosion();
      this.audio.playCoreRecovered();
    }

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (this.particles) {
          const rx = Math.random() * 960;
          const ry = Math.random() * 540;
          this.particles.createSparkBurst(rx, ry, i % 2 === 0 ? '#10b981' : '#fbbf24', 40);
          this.particles.showPopupText('CHRONO SHATTER!', rx, ry, '#34d399');
        }
      }, i * 350);
    }

    // Transition to Epilogue Section after dramatic explosion
    setTimeout(() => {
      const arena = document.getElementById('arenaContainer');
      const epilogue = document.getElementById('epilogueSection');
      if (arena) arena.style.display = 'none';
      if (epilogue) epilogue.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3200);
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.player.update(dt);

    for (const c of this.companions) {
      c.update(dt, this.player, this.enemySystem.enemies);
    }

    for (const obj of this.interactiveObjects) {
      obj.update(dt, this);
    }

    if (this.bossFight.active) {
      this.bossFight.update(dt, this.player);
    }

    if (this.player.hp <= 0) {
      this.player.reset();
      this.initPhase1();
    }
  }

  renderWorld(ctx) {
    for (const obj of this.interactiveObjects) {
      obj.render(ctx, this.player);
    }

    if (this.bossFight.active) {
      this.bossFight.render(ctx);
    }

    for (const c of this.companions) {
      c.render(ctx);
    }

    this.player.render(ctx);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.engine = new EndingGame();
  window.engine.start();
});
