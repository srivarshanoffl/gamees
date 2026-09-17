/**
 * watcher-nexus.js
 * Game 9: Watcher's Nexus - Anomaly Sieve
 * Mechanic: Split-screen multiverse incursion pattern recognition & triage.
 * Compare the Prime Timeline against the Incursion Timeline to spot and quarantine
 * dimensional anomalies before the universe collapse countdown reaches zero.
 */

class WatcherNexusGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'watchernexus';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.timer = 20; // 20-second collapse timer
    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: 100 });
  }

  initStage(st) {
    this.stage = st;
    this.timer = 20 - st * 2;
    this.anomalies = [];

    // Panel dimensions
    this.panelW = 430;
    this.panelH = 420;
    this.panelLeftX = 35;
    this.panelRightX = 495;
    this.panelY = 60;

    // Generate anomalies in Right Panel (x between 530 and 880, y between 100 and 420)
    const anomalyTypes = [
      { name: 'SYMBIOTE GOO', icon: '🦠', color: '#000' },
      { name: 'GOBLIN BOMB', icon: '💣', color: '#ff9100' },
      { name: 'INFINITY STONE', icon: '💎', color: '#00e5ff' },
      { name: 'KANG TEMPAD', icon: '⏳', color: '#76ff03' },
      { name: 'GLITCH SHARD', icon: '⚡', color: '#d500f9' }
    ];

    const count = 3 + (st >= 2 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const type = anomalyTypes[i % anomalyTypes.length];
      this.anomalies.push({
        x: this.panelRightX + 60 + (i * 90) % (this.panelW - 120),
        y: this.panelY + 60 + ((i * 110) % (this.panelH - 120)),
        radius: 22,
        type: type.name,
        icon: type.icon,
        quarantined: false
      });
    }

    this.showAlert(`STAGE ${st}: SPOT & QUARANTINE ${this.anomalies.length} INCURSIONS!`);
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;

    let hit = false;
    for (const an of this.anomalies) {
      if (!an.quarantined && Math.hypot(x - an.x, y - an.y) < an.radius + 10) {
        an.quarantined = true;
        hit = true;
        this.score += 350;
        this.shake(4, 0.15);
        if (window.soundFX) window.soundFX.shieldBounce();
        this.spawnComicText('QUARANTINED!', an.x, an.y - 20, '#00e676');
        for (let p = 0; p < 10; p++) {
          this.spawnParticle(an.x, an.y, (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 140, '#00e676', 4);
        }
        break;
      }
    }

    if (!hit && x > this.panelRightX && x < this.panelRightX + this.panelW && y > this.panelY && y < this.panelY + this.panelH) {
      // False alarm penalty
      this.timer -= 1.5;
      if (window.soundFX) window.soundFX.hit();
      this.spawnComicText('NO ANOMALY!', x, y, '#e23636');
    }

    this.setHUD({ score: this.score });
  }

  update(dt) {
    this.timer -= dt;
    this.setHUD({ health: Math.max(0, (this.timer / 20) * 100) });

    if (this.timer <= 0) {
      this.triggerGameOver('Timeline collapse! The multiverse incursion wiped out the sector.');
      return;
    }

    // Check if all anomalies are quarantined
    if (this.anomalies.every(a => a.quarantined)) {
      if (this.stage < this.maxStages) {
        this.score += 1000 + Math.floor(this.timer * 50);
        this.initStage(this.stage + 1);
        this.setHUD({ score: this.score });
      } else {
        this.score += 3000;
        this.triggerVictory('The Watcher contained all multiversal incursions!');
      }
    }
  }

  render(ctx) {
    // Cosmic Nebula Background
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Watcher Omniscient Eyes in background
    ctx.save();
    ctx.fillStyle = 'rgba(255, 210, 0, 0.08)';
    ctx.beginPath();
    ctx.arc(480, 26, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Render Left Panel (Earth-616 Sacred Timeline)
    ctx.save();
    ctx.fillStyle = '#101422';
    ctx.fillRect(this.panelLeftX, this.panelY, this.panelW, this.panelH);
    ctx.strokeStyle = '#29b6f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.panelLeftX, this.panelY, this.panelW, this.panelH);

    ctx.fillStyle = '#29b6f6';
    ctx.font = "bold 16px 'Bangers', cursive";
    ctx.fillText('PRIME TIMELINE (EARTH-616)', this.panelLeftX + 16, this.panelY + 28);

    // Draw baseline scenery (Avengers Tower silhouette + moon + clean sky)
    ctx.fillStyle = '#1e2638';
    ctx.fillRect(this.panelLeftX + 60, this.panelY + 180, 80, 240); // Skyscraper
    ctx.fillRect(this.panelLeftX + 220, this.panelY + 120, 100, 300); // Tower
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.arc(this.panelLeftX + 350, this.panelY + 90, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Render Right Panel (Incursion Corrupted Timeline)
    ctx.save();
    ctx.fillStyle = '#160d1f';
    ctx.fillRect(this.panelRightX, this.panelY, this.panelW, this.panelH);
    ctx.strokeStyle = '#d500f9';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.panelRightX, this.panelY, this.panelW, this.panelH);

    ctx.fillStyle = '#d500f9';
    ctx.font = "bold 16px 'Bangers', cursive";
    ctx.fillText('INCURSION TIMELINE (CORRUPTED)', this.panelRightX + 16, this.panelY + 28);

    // Identical baseline scenery
    ctx.fillStyle = '#231530';
    ctx.fillRect(this.panelRightX + 60, this.panelY + 180, 80, 240);
    ctx.fillRect(this.panelRightX + 220, this.panelY + 120, 100, 300);
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.arc(this.panelRightX + 350, this.panelY + 90, 24, 0, Math.PI * 2);
    ctx.fill();

    // Draw Anomaly Glitches
    for (const an of this.anomalies) {
      if (!an.quarantined) {
        // Glowing Anomaly
        ctx.fillStyle = 'rgba(213, 0, 249, 0.4)';
        ctx.beginPath();
        ctx.arc(an.x, an.y, an.radius + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = "24px 'Outfit'";
        ctx.textAlign = 'center';
        ctx.fillText(an.icon, an.x, an.y + 8);
      } else {
        // Quarantined indicator
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(an.x, an.y, an.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00e676';
        ctx.font = "bold 12px 'Bangers'";
        ctx.textAlign = 'center';
        ctx.fillText('SEALED', an.x, an.y + 4);
      }
    }
    ctx.restore();

    // Timer & Status at Bottom
    ctx.save();
    ctx.fillStyle = '#ffd200';
    ctx.font = "bold 18px 'Bangers', cursive";
    ctx.fillText(`COLLAPSE COUNTDOWN: ${Math.max(0, this.timer).toFixed(1)}s`, 40, 515);
    ctx.font = "bold 14px 'Outfit'";
    ctx.fillStyle = '#aaa';
    ctx.fillText('CLICK THE FOREIGN ANOMALIES IN THE RIGHT PANEL TO QUARANTINE', 360, 515);
    ctx.restore();
  }
}

window.WatcherNexusGame = WatcherNexusGame;
