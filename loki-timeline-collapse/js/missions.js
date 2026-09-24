/**
 * missions.js — Mission Controller for Page 3: "Loki: The Last Timeline"
 * Manages dimension loading, era shifts, companion AI, interactive objects,
 * combat cycles, and Nexus Core recovery.
 */

class MissionGame extends PlatformEngine {
  constructor(dimKey = 'asgard') {
    super('gameCanvas');
    this.dimKey = dimKey;
    this.dimConfig = DIMENSION_CONFIGS[dimKey] || DIMENSION_CONFIGS.asgard;

    // Components
    this.player = new LokiPlayer(this);
    this.companion = new Companion(this, this.dimConfig.companion);
    this.enemySystem = new EnemySystem(this);
    this.bossFight = new BossFight(this);

    // Audio toggle
    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn && this.audio) {
      audioBtn.addEventListener('click', () => {
        this.audio.init();
        const muted = this.audio.toggleMute();
        audioBtn.innerText = muted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
      });
    }

    this.initHUD();
    this.setupEraListener();
    this.loadEra('PAST');
    this.playIntroDialogue();
  }

  initHUD() {
    const iconEl = document.getElementById('missionIcon');
    const titleEl = document.getElementById('missionTitle');
    const compAvatar = document.getElementById('companionAvatar');
    const compName = document.getElementById('companionName');

    const companionIcons = { thor: '⚡', cap: '⭐', ironman: '🤖', strange: '👁️' };
    const companionNames = { thor: 'THOR', cap: 'CAPTAIN AMERICA', ironman: 'IRON MAN', strange: 'DOCTOR STRANGE' };

    if (iconEl) iconEl.innerText = companionIcons[this.dimConfig.companion] || '👑';
    if (titleEl) titleEl.innerText = this.dimConfig.name;
    if (compAvatar) compAvatar.innerText = companionIcons[this.dimConfig.companion] || '⚡';
    if (compName) compName.innerText = companionNames[this.dimConfig.companion] || 'HERO';
  }

  setupEraListener() {
    this.timeEra.onEraChangeCallback = (newEra) => {
      this.loadEra(newEra);
    };
  }

  loadEra(eraName) {
    const eraConfig = this.dimConfig.eras[eraName];
    if (!eraConfig) return;

    // Update HUD
    const hudEra = document.getElementById('hudEraText');
    if (hudEra) {
      hudEra.innerText = eraName === 'PAST' ? 'THE PAST' : (eraName === 'PRESENT' ? 'THE PRESENT' : 'THE FUTURE');
      const theme = this.timeEra.getEraTheme(eraName);
      hudEra.style.color = theme.accent;
    }

    this.levelWidth = eraConfig.levelWidth || 2800;

    // Reset Platforms
    this.platforms = eraConfig.platforms || [];

    // Position Player and Companion
    if (eraConfig.playerStart) {
      this.player.x = eraConfig.playerStart.x;
      this.player.y = eraConfig.playerStart.y;
      this.player.vx = 0;
      this.player.vy = 0;
    }
    this.companion.x = this.player.x - 50;
    this.companion.y = this.player.y;
    this.companion.vx = 0;
    this.companion.vy = 0;

    // Interactive Objects
    this.interactiveObjects = [];
    if (eraConfig.interactiveObjects) {
      for (const objCfg of eraConfig.interactiveObjects) {
        const obj = new InteractiveObject(objCfg);
        if (obj.type === 'pedestal') {
          obj.data.onRecover = () => this.handleCoreRecovery();
        }
        this.interactiveObjects.push(obj);
      }
    }

    // Enemies
    this.enemySystem.reset();
    if (eraConfig.enemies) {
      for (const e of eraConfig.enemies) {
        this.enemySystem.spawnEnemy(e.type, e.x, e.y);
      }
    }

    // Boss Fight (Future Era)
    this.bossFight.reset();
    if (eraConfig.boss) {
      this.bossFight.spawnBoss(eraConfig.boss.type, eraConfig.boss.x, eraConfig.boss.y);
      this.bossFight.onBossDefeated = () => {
        this.particles.showPopupText('CHAMBER OPENED!', this.bossFight.boss.x, this.bossFight.boss.y - 40, '#34d399');
      };
    }

    this.state = 'PLAYING';
  }

  playIntroDialogue() {
    if (this.dimConfig.dialogues && this.dimConfig.dialogues.intro) {
      this.dialogue.say(this.dimConfig.dialogues.intro);
    }
  }

  handleCoreRecovery() {
    localStorage.setItem(`loki_core_${this.dimKey}`, 'true');

    if (this.dimConfig.dialogues && this.dimConfig.dialogues.coreRecovered) {
      this.dialogue.say(this.dimConfig.dialogues.coreRecovered);
    }

    this.particles.showPopupText(`${this.dimConfig.coreName} SECURED!`, this.player.x, this.player.y - 60, '#34d399');

    // Return to Hub after victory
    setTimeout(() => {
      window.location.href = 'hub.html';
    }, 3800);
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.player.update(dt);
    this.companion.update(dt, this.player, this.enemySystem.enemies);
    this.enemySystem.update(dt, this.player);
    this.enemySystem.checkPlayerAttacks(this.player);

    for (const obj of this.interactiveObjects) {
      obj.update(dt, this);
    }

    if (this.bossFight.active) {
      this.bossFight.update(dt, this.player);
    }

    // Death / Defeat condition
    if (this.player.hp <= 0) {
      this.state = 'GAME_OVER';
      this.dialogue.say({
        speaker: 'loki',
        text: 'The timeline... is unraveling. I must gather my strength and rewind.'
      });
      setTimeout(() => {
        this.player.reset();
        this.loadEra(this.timeEra.getCurrentEra());
      }, 2500);
    }
  }

  renderWorld(ctx) {
    // 1. Interactive Objects
    for (const obj of this.interactiveObjects) {
      obj.render(ctx, this.player);
    }

    // 2. Enemies
    this.enemySystem.render(ctx);

    // 3. Boss
    if (this.bossFight.active) {
      this.bossFight.render(ctx);
    }

    // 4. Companion
    this.companion.render(ctx);

    // 5. Player (Loki)
    this.player.render(ctx);
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dim = urlParams.get('dim') || 'asgard';
  window.engine = new MissionGame(dim);
  window.engine.start();
});
