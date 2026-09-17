/**
 * thor.js
 * Game 4: Thor - Thunder Surge
 * Mechanic: Precision oscillating charge-and-release timing striker.
 * Hold to channel storm energy into Mjolnir; release at the crest to unleash
 * chain lightning on Frost Giants marching down the Bifrost.
 */

class ThorGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'thor';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.gateHealth = 100;

    // Charge mechanic
    this.charge = 0; // 0 to 100
    this.chargeSpeed = 140;
    this.isCharging = false;
    this.isStunned = false;
    this.stunTimer = 0;

    // Sweet spot target window (oscillates or shifts with stage)
    this.sweetSpotMin = 65;
    this.sweetSpotMax = 85;

    this.enemies = [];
    this.spawnTimer = 0;
    this.enemiesLeft = 14;
    this.boss = null;
    this.lightningArcs = [];

    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.gateHealth });
  }

  initStage(st) {
    this.stage = st;
    this.enemies = [];
    this.enemiesLeft = 12 + st * 6;
    this.spawnTimer = 0;
    this.sweetSpotMin = 70 - st * 4;
    this.sweetSpotMax = 85 - st * 2;

    if (st === 3) {
      this.boss = {
        x: 880,
        y: 280,
        vx: -25,
        radius: 40,
        hp: 18,
        maxHp: 18,
        name: 'KURSED BEAST'
      };
    } else {
      this.boss = null;
    }

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'FROST GIANT INVASION' : st === 2 ? 'DUAL-FLANK BERSERKERS' : 'KURSED BEAST SIEGE'}`);
  }

  onKeyDown(e) {
    if (e.code === 'Space' && !this.isStunned && !this.isCharging) {
      this.startCharge();
    }
  }

  onKeyUp(e) {
    if (e.code === 'Space' && this.isCharging) {
      this.releaseStrike();
    }
  }

  onPointerDown() {
    if (this.state === 'PLAYING' && !this.isStunned && !this.isCharging) {
      this.startCharge();
    }
  }

  onPointerUp() {
    if (this.state === 'PLAYING' && this.isCharging) {
      this.releaseStrike();
    }
  }

  startCharge() {
    this.isCharging = true;
    this.charge = 0;
  }

  releaseStrike() {
    this.isCharging = false;

    // Check hit quality
    if (this.charge >= this.sweetSpotMin && this.charge <= this.sweetSpotMax) {
      // PERFECT CREST: CHAIN LIGHTNING
      this.strikeLightning(true);
      this.spawnComicText('KRAK-BOOM!', 480, 200, '#00f0ff');
      this.shake(8, 0.4);
      if (window.soundFX) window.soundFX.thunder();
    } else if (this.charge < this.sweetSpotMin) {
      // WEAK SPARK
      this.strikeLightning(false);
      this.spawnComicText('ZAP!', 480, 230, '#ffd200');
      this.shake(2, 0.1);
      if (window.soundFX) window.soundFX.hit();
    } else {
      // OVERCHARGED: STUN THOR
      this.isStunned = true;
      this.stunTimer = 1.2;
      this.spawnComicText('OVERLOAD!', 480, 220, '#e23636');
      this.shake(5, 0.25);
      if (window.soundFX) window.soundFX.hit();
    }
    this.charge = 0;
  }

  strikeLightning(isFullPower) {
    const range = isFullPower ? 460 : 180;
    const damage = isFullPower ? 5 : 2;

    // Damage enemies on Bifrost
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dist = Math.abs(e.x - 480);
      if (dist < range) {
        e.hp -= damage;
        // Generate lightning arc visual
        this.lightningArcs.push({
          x1: 480,
          y1: 230,
          x2: e.x,
          y2: e.y,
          life: 0.25,
          color: isFullPower ? '#00f0ff' : '#ffd200'
        });

        if (e.hp <= 0) {
          this.score += 200;
          for (let p = 0; p < 8; p++) {
            this.spawnParticle(e.x, e.y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, '#00f0ff', 3);
          }
          this.enemies.splice(i, 1);
        }
      }
    }

    // Damage boss if present
    if (this.boss) {
      const dist = Math.abs(this.boss.x - 480);
      if (dist < range) {
        this.boss.hp -= damage;
        this.lightningArcs.push({
          x1: 480,
          y1: 230,
          x2: this.boss.x,
          y2: this.boss.y,
          life: 0.3,
          color: '#00f0ff'
        });
        if (this.boss.hp <= 0) {
          this.score += 3000;
          this.triggerVictory('Thor shattered the Kursed Beast and secured the Bifrost!');
          return;
        }
      }
    }

    this.setHUD({ score: this.score });
  }

  update(dt) {
    // Handle Stun
    if (this.isStunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
    }

    // Handle Charge meter
    if (this.isCharging) {
      this.charge += this.chargeSpeed * dt;
      if (this.charge > 110) {
        // Automatically trigger overload
        this.releaseStrike();
      }
    }

    // Update Lightning Arcs
    for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
      const arc = this.lightningArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) this.lightningArcs.splice(i, 1);
    }

    // Spawn regular enemies
    this.spawnTimer += dt;
    if (this.enemiesLeft > 0 && this.spawnTimer > (1.6 - this.stage * 0.3)) {
      this.spawnTimer = 0;
      this.enemiesLeft--;

      // Spawn from left or right
      const fromLeft = this.stage >= 2 && Math.random() < 0.5;
      this.enemies.push({
        x: fromLeft ? 40 : 920,
        y: 280,
        vx: fromLeft ? (40 + this.stage * 15) : (-40 - this.stage * 15),
        radius: 16,
        hp: 2 + this.stage,
        type: 'frost_giant'
      });
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx * dt;

      // Check reaching Thor/Gate center
      if (Math.abs(e.x - 480) < 30) {
        this.gateHealth -= 15;
        this.shake(6, 0.2);
        if (window.soundFX) window.soundFX.hit();
        this.spawnComicText('SMASH!', 480, 270, '#e23636');
        this.enemies.splice(i, 1);
        this.setHUD({ health: this.gateHealth });
        if (this.gateHealth <= 0) {
          this.triggerGameOver('The Asgardian Gate was breached by the Frost Giants!');
          return;
        }
      }
    }

    // Update Boss
    if (this.boss) {
      this.boss.x += this.boss.vx * dt;
      if (Math.abs(this.boss.x - 480) < 50) {
        this.gateHealth -= 35;
        this.shake(10, 0.35);
        this.setHUD({ health: this.gateHealth });
        if (this.gateHealth <= 0) {
          this.triggerGameOver('The Kursed Beast trampled Asgard!');
          return;
        }
      }
    }

    // Check Stage Clear (Stages 1 and 2)
    if (!this.boss && this.enemiesLeft <= 0 && this.enemies.length === 0) {
      this.score += 800;
      this.initStage(this.stage + 1);
      this.setHUD({ score: this.score });
    }
  }

  render(ctx) {
    // Cosmic Bifrost Background (Starry deep space)
    ctx.fillStyle = '#060814';
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 27) % this.vWidth;
      const sy = (i * 19) % (this.vHeight - 120);
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Rainbow Bridge (Bifrost road)
    const bridgeGrad = ctx.createLinearGradient(0, 270, 0, 350);
    bridgeGrad.addColorStop(0, '#ff1744');
    bridgeGrad.addColorStop(0.25, '#ffd200');
    bridgeGrad.addColorStop(0.5, '#00e676');
    bridgeGrad.addColorStop(0.75, '#00f0ff');
    bridgeGrad.addColorStop(1, '#d500f9');

    ctx.fillStyle = bridgeGrad;
    ctx.fillRect(0, 290, this.vWidth, 50);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 290, this.vWidth, 50);

    // Asgard Gate Spire behind Thor
    ctx.fillStyle = '#ffd200';
    ctx.fillRect(450, 160, 60, 130);
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.moveTo(440, 160);
    ctx.lineTo(480, 110);
    ctx.lineTo(520, 160);
    ctx.fill();

    // Render Enemies (Frost Giants)
    for (const e of this.enemies) {
      ctx.save();
      ctx.fillStyle = '#4fc3f7'; // Ice Blue
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0288d1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing ice eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(e.x - 5, e.y - 4, 3, 3);
      ctx.fillRect(e.x + 2, e.y - 4, 3, 3);
      ctx.restore();
    }

    // Render Boss (Kursed Beast)
    if (this.boss) {
      ctx.save();
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.arc(this.boss.x, this.boss.y, this.boss.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Boss HP
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(this.boss.x - 30, this.boss.y - 55, 60, 8);
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(this.boss.x - 30, this.boss.y - 55, 60 * (this.boss.hp / this.boss.maxHp), 8);
      ctx.restore();
    }

    // Render Lightning Arcs
    for (const arc of this.lightningArcs) {
      ctx.save();
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 4;
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);

      // Jagged zig-zag arc
      const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 40;
      const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 40;
      ctx.lineTo(midX, midY);
      ctx.lineTo(arc.x2, arc.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Thor
    ctx.save();
    ctx.translate(480, 265);

    // Red Cape
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(-18, -10, 36, 35);

    // Silver Armor
    ctx.fillStyle = '#90a4ae';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Winged Helm / Blond Hair
    ctx.fillStyle = '#ffd200';
    ctx.fillRect(-10, -16, 20, 8);

    // Mjolnir (Held up or sparking)
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(14, -26, 16, 12);
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(20, -14, 4, 16);

    // Sparks around hammer if charging
    if (this.isCharging) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ox = 22 + (Math.random() - 0.5) * 20;
        const oy = -20 + (Math.random() - 0.5) * 20;
        ctx.strokeRect(ox, oy, 2, 2);
      }
    }

    ctx.restore();

    // Render Charge Gauge Bar at Bottom
    ctx.save();
    const barW = 400;
    const barH = 26;
    const bx = (this.vWidth - barW) / 2;
    const by = 470;

    // Background container
    ctx.fillStyle = '#151821';
    ctx.fillRect(bx, by, barW, barH);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, barW, barH);

    // Green Sweet Spot Zone
    const sweetX1 = bx + (this.sweetSpotMin / 100) * barW;
    const sweetX2 = bx + (this.sweetSpotMax / 100) * barW;
    ctx.fillStyle = 'rgba(0, 230, 118, 0.45)';
    ctx.fillRect(sweetX1, by, sweetX2 - sweetX1, barH);

    // Sweet spot border
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 2;
    ctx.strokeRect(sweetX1, by, sweetX2 - sweetX1, barH);

    // Fill current charge
    if (this.isCharging) {
      const fillW = Math.min(barW, (this.charge / 100) * barW);
      const isSweet = this.charge >= this.sweetSpotMin && this.charge <= this.sweetSpotMax;
      ctx.fillStyle = isSweet ? '#00e676' : this.charge > this.sweetSpotMax ? '#ff1744' : '#00f0ff';
      ctx.fillRect(bx, by, fillW, barH);
    }

    // Guide Text
    ctx.fillStyle = '#fff';
    ctx.font = "bold 15px 'Bangers', cursive";
    ctx.textAlign = 'center';
    ctx.fillText(
      this.isStunned ? 'OVERHEATED! STUNNED...' : this.isCharging ? 'RELEASE IN GREEN SWEET SPOT!' : 'HOLD [SPACE] / TAP TO CHARGE THUNDER',
      480, by - 10
    );
    ctx.restore();
  }
}

window.ThorGame = ThorGame;
