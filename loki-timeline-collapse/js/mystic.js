/**
 * mystic.js — Controller for Page 4: The Mystic Temple & The Twist
 * Manages Doctor Strange's dimension, the non-linear temple puzzle,
 * the Doom Mystic Guardian, and the dramatic Chrono Forge revelation.
 */

class MysticGame extends PlatformEngine {
  constructor() {
    super('gameCanvas');

    this.player = new LokiPlayer(this);
    this.companion = new Companion(this, 'strange');
    this.enemySystem = new EnemySystem(this);
    this.bossFight = new BossFight(this);

    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn && this.audio) {
      audioBtn.addEventListener('click', () => {
        this.audio.init();
        const muted = this.audio.toggleMute();
        audioBtn.innerText = muted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
      });
    }

    this.initLevel();
    this.playIntroDialogue();
  }

  initLevel() {
    this.levelWidth = 3000;
    this.player.x = 100;
    this.player.y = 380;
    this.companion.x = 50;
    this.companion.y = 380;

    // Mystic Platforms (floating temple stones)
    this.platforms = [
      { x: 0, y: 460, w: 750, h: 80, type: 'mystic' },
      { x: 850, y: 410, w: 500, h: 80, type: 'mystic' },
      { x: 1450, y: 360, w: 500, h: 80, type: 'mystic' },
      { x: 2050, y: 460, w: 950, h: 80, type: 'mystic' },
      // Elevated stepping stones
      { x: 350, y: 320, w: 180, h: 20, type: 'mystic' },
      { x: 1050, y: 270, w: 200, h: 20, type: 'mystic' },
      { x: 1650, y: 220, w: 200, h: 20, type: 'mystic' }
    ];

    // Interactive Objects — proper InteractiveObject instances
    const puzzleObj = new InteractiveObject({
      type: 'puzzle',
      puzzleId: 'mystic_knot',
      x: 1100,
      y: 350,
      width: 48,
      height: 60,
      label: 'TIME LOOP',
      memoryKey: 'mystic_loop_unwound'
    });

    const pedestalObj = new InteractiveObject({
      type: 'pedestal',
      x: 2750,
      y: 396,
      width: 60,
      height: 64,
      label: 'CLAIM MIND CORE',
      data: {
        onRecover: () => this.triggerTheTwist()
      }
    });

    this.interactiveObjects = [puzzleObj, pedestalObj];

    // Enemies
    this.enemySystem.reset();
    this.enemySystem.spawnEnemy('temporal_sentinel', 900, 350);
    this.enemySystem.spawnEnemy('doom_machine', 1600, 300);

    // Mini Boss: Doom Mystic Guardian
    this.bossFight.reset();
    this.bossFight.spawnBoss('mystic_guardian', 2400, 390);

    this.state = 'PLAYING';
  }

  playIntroDialogue() {
    this.dialogue.say([
      { speaker: 'strange', text: 'Loki. Walk carefully. In this sanctum, cause does not precede effect.' },
      { speaker: 'loki', text: 'I feel it. The timeline isn’t branching here—it is being pulled taut toward a single center.' },
      { speaker: 'strange', text: 'Doctor Doom has woven temporal anchors into the temple. Unwind the Eye of Agamotto loop to reveal the Mind Core.' },
      { speaker: 'loki', text: 'Once we claim this final core, we can seal the rifts permanently.' }
    ]);
  }

  triggerTheTwist() {
    localStorage.setItem('loki_core_mystic', 'true');

    if (this.audio) {
      this.audio.playDoomTheme();
    }
    this.shakeScreen(16, 1.2);

    // Dialogue sequence leading up to Doom's reveal
    this.dialogue.say([
      { speaker: 'loki', text: 'The Mind Core is secured! All four Nexus Cores are assembled!' },
      { speaker: 'strange', text: 'Wait... Loki, stop! Look at their resonant frequencies!' },
      { speaker: 'doom', text: 'Magnificent work, God of Stories.' },
      { speaker: 'loki', text: 'Doom?! Where are you speaking from?!' },
      { speaker: 'doom', text: 'From everywhere. You believed you were defying me. But only someone with your mastery of timelines could stabilize four unstable nexus cores.' },
      { speaker: 'doom', text: 'You did not save these worlds. You prepared them for compression. The Chrono Forge is now fully active!' },
      {
        speaker: 'strange',
        text: 'He tricked us! The Forge is collapsing all realities into one! We have to destroy the Forge directly!',
        onComplete: () => {
          // Reveal full dramatic overlay
          const curtain = document.getElementById('twistCurtain');
          if (curtain) curtain.classList.add('active');
        }
      }
    ]);
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

    if (this.player.hp <= 0) {
      this.player.reset();
      this.initLevel();
    }
  }

  renderWorld(ctx) {
    for (const obj of this.interactiveObjects) {
      obj.render(ctx, this.player);
    }
    this.enemySystem.render(ctx);
    if (this.bossFight.active) {
      this.bossFight.render(ctx);
    }
    this.companion.render(ctx);
    this.player.render(ctx);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.engine = new MysticGame();
  window.engine.start();
});
