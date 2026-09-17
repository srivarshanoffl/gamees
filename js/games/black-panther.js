/**
 * black-panther.js
 * Game 1: Black Panther - Kinetic Burst
 * Core Mechanic: Kinetic Energy Absorption & Directional Shockwave Redistribution.
 * Move T'Challa into enemy projectiles to absorb kinetic energy into the Vibranium weave.
 * Click & drag or tap to discharge devastating directional shockwave blasts.
 */

class BlackPantherGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'blackpanther';
    this.groundY = 440;
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.kineticCharge = 0; // 0 to 100
    this.maxKineticCharge = 100;
    this.defenseIntegrity = 0; // 0 to 100% (Win condition)
    this.winThreshold = 100;

    this.player = {
      x: 200,
      y: this.groundY - 30,
      targetX: 200,
      targetY: this.groundY - 30,
      r: 28,
      speed: 480,
      overloaded: false,
      overloadTimer: 0,
      facing: 1
    };

    this.aiming = false;
    this.aimAngle = 0;

    this.projectiles = [];
    this.enemies = [];
    this.shockwaves = [];
    this.spawnTimer = 0;
    this.gameTime = 0;
    this.bossSpawned = false;

    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: this.health,
      stage: `${Math.min(100, Math.round(this.defenseIntegrity))}%`
    });

    const stageEl = document.getElementById('hudStage');
    if (stageEl) stageEl.textContent = `${Math.min(100, Math.round(this.defenseIntegrity))}% BARRIER`;
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.gameTime += dt;
    this.defenseIntegrity = Math.min(100, this.defenseIntegrity + dt * 1.8);

    // Player Movement (smooth mouse/touch follower on ground plane)
    if (this.pointer && this.pointer.x > 0) {
      this.player.targetX = Math.max(80, Math.min(880, this.pointer.x));
    }
    const dx = this.player.targetX - this.player.x;
    this.player.x += dx * Math.min(1.0, dt * 14);
    if (Math.abs(dx) > 2) this.player.facing = dx > 0 ? 1 : -1;

    // Overload Recovery
    if (this.player.overloadTimer > 0) {
      this.player.overloadTimer -= dt;
      if (this.player.overloadTimer <= 0) this.player.overloaded = false;
    }

    // Shockwave Aim & Fire Input
    if (this.pointer.isDown && this.kineticCharge >= 20 && !this.player.overloaded) {
      this.aiming = true;
      const adx = this.pointer.x - this.player.x;
      const ady = this.pointer.y - this.player.y;
      this.aimAngle = Math.atan2(ady, adx);
    } else if (this.aiming && (this.pointer.justReleased || !this.pointer.isDown)) {
      this.aiming = false;
      this.fireKineticShockwave();
    }

    // Spawn Enemies & Projectiles based on continuous escalation curve
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.65, 2.2 - (this.defenseIntegrity / 100) * 1.4);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Final Challenge: Kree Heavy Dread-Walker at 75% defense
    if (this.defenseIntegrity >= 75 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.enemies.push({
        x: 940,
        y: this.groundY - 70,
        r: 50,
        hp: 12,
        maxHp: 12,
        isBoss: true,
        fireTimer: 0,
        name: 'KREE DREAD-WALKER'
      });
      this.showAlert("⚠️ KREE DREAD-WALKER DETECTED!", 2.0);
      if (window.soundFX) window.soundFX.alarm();
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isBoss) {
        if (e.x > 720) e.x -= dt * 35;
        e.fireTimer += dt;
        if (e.fireTimer >= 1.2) {
          e.fireTimer = 0;
          this.spawnHeavyBomb(e.x - 20, e.y);
        }
      } else {
        e.x -= dt * e.speed;
        e.fireTimer += dt;
        if (e.fireTimer >= e.fireInterval) {
          e.fireTimer = 0;
          this.spawnPlasma(e.x - 10, e.y, -260, (Math.random() - 0.5) * 40);
        }
        // Reached Wakandan Gate
        if (e.x < 40) {
          this.health -= 15;
          this.shake(8, 0.25);
          if (window.soundFX) window.soundFX.explosion();
          this.enemies.splice(i, 1);
          continue;
        }
      }
    }

    // Update Enemy Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Absorption Check: Did projectile hit Black Panther?
      const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
      if (dist < this.player.r + p.r) {
        // ABSORB KINETIC FORCE!
        this.kineticCharge = Math.min(this.maxKineticCharge, this.kineticCharge + p.chargeValue);
        this.score += 75;
        this.spawnComicText("ABSORBED!", this.player.x, this.player.y - 35, '#d500f9');
        if (window.soundFX) window.soundFX.shieldBounce();
        this.shake(3, 0.1);

        // Burst absorption particles
        for (let k = 0; k < 8; k++) {
          this.spawnParticle(p.x, p.y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, '#d500f9', 3, 0.3);
        }

        // Overload Check
        if (this.kineticCharge >= this.maxKineticCharge) {
          this.kineticCharge = 0;
          this.health -= 12;
          this.player.overloaded = true;
          this.player.overloadTimer = 1.2;
          this.shake(12, 0.35);
          this.showAlert("SUIT OVERLOAD! DISCHARGE KINETIC ENERGY!", 1.5);
          if (window.soundFX) window.soundFX.defeat();
        }

        this.projectiles.splice(i, 1);
        continue;
      }

      // Reached boundary or ground
      if (p.x < 0 || p.y > 540) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Active Kinetic Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.expandSpeed * dt;
      sw.life -= dt;

      // Collision with enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        const dist = Math.hypot(e.x - sw.x, e.y - sw.y);
        // Sector check
        const angleToEnemy = Math.atan2(e.y - sw.y, e.x - sw.x);
        const angleDiff = Math.abs(angleToEnemy - sw.angle);

        if (dist <= sw.radius && angleDiff <= sw.spread) {
          e.hp -= sw.damage;
          e.x += 45; // Knockback
          this.spawnParticle(e.x, e.y, Math.cos(sw.angle) * 200, Math.sin(sw.angle) * 200, '#e040fb', 4, 0.4);

          if (e.hp <= 0) {
            this.score += e.isBoss ? 1500 : 250;
            this.spawnScorePopup(e.isBoss ? "+1500 DREAD-WALKER SHATTERED!" : "+250 DESTROYED", e.x, e.y - 30, '#ffd200');
            this.spawnComicText("KABOOM!", e.x, e.y - 45, '#ffd200');
            if (window.soundFX) window.soundFX.explosion();
            this.shake(e.isBoss ? 14 : 6, 0.3);
            this.enemies.splice(j, 1);
          }
        }
      }

      if (sw.life <= 0) this.shockwaves.splice(i, 1);
    }

    this.updateHUDValues();

    // Check Win/Loss
    if (this.health <= 0) {
      this.triggerGameOver("The Vibranium Great Mound perimeter was overwhelmed!");
    } else if (this.defenseIntegrity >= 100 && (!this.bossSpawned || this.enemies.every(e => !e.isBoss))) {
      this.triggerVictory("WAKANDAN BARRIER RESTORED! Kree forces repelled!");
    }
  }

  fireKineticShockwave() {
    if (this.kineticCharge < 20) return;
    const powerRatio = this.kineticCharge / 100;
    const damage = Math.round(powerRatio * 8) + 2;

    this.shockwaves.push({
      x: this.player.x,
      y: this.player.y,
      angle: this.aimAngle,
      spread: 0.85,
      radius: 30,
      expandSpeed: 750 + powerRatio * 500,
      life: 0.45 + powerRatio * 0.25,
      damage: damage
    });

    this.shake(8 + powerRatio * 10, 0.25);
    this.spawnComicText("KINETIC BURST!", this.player.x, this.player.y - 45, '#e040fb');
    if (window.soundFX) window.soundFX.thunder();

    // Reset charge
    this.kineticCharge = 0;
  }

  spawnEnemy() {
    const isDrone = Math.random() > 0.4;
    this.enemies.push({
      x: 980,
      y: isDrone ? 180 + Math.random() * 180 : this.groundY - 30,
      r: isDrone ? 20 : 26,
      hp: isDrone ? 1 : 3,
      maxHp: isDrone ? 1 : 3,
      speed: isDrone ? 120 + Math.random() * 80 : 70,
      fireInterval: isDrone ? 2.0 : 1.4,
      fireTimer: Math.random() * 1.0,
      isBoss: false
    });
  }

  spawnPlasma(x, y, vx, vy) {
    this.projectiles.push({
      x, y, vx, vy,
      r: 8,
      chargeValue: 18,
      color: '#ff1744'
    });
  }

  spawnHeavyBomb(x, y) {
    this.projectiles.push({
      x, y,
      vx: -200,
      vy: 120,
      r: 16,
      chargeValue: 35,
      color: '#ff3d00'
    });
  }

  render(ctx) {
    // 1. Wakandan Sunset Ridge & City Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 540);
    bgGrad.addColorStop(0, '#100720');
    bgGrad.addColorStop(0.5, '#280c44');
    bgGrad.addColorStop(1, '#0c0418');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 960, 540);

    // Golden City Spire Silhouettes
    ctx.fillStyle = 'rgba(74, 20, 100, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, 440);
    ctx.lineTo(80, 260); ctx.lineTo(130, 440);
    ctx.lineTo(240, 220); ctx.lineTo(290, 440);
    ctx.lineTo(420, 190); ctx.lineTo(460, 440);
    ctx.lineTo(600, 240); ctx.lineTo(680, 440);
    ctx.lineTo(840, 210); ctx.lineTo(960, 440);
    ctx.closePath();
    ctx.fill();

    // Ground Ridge
    ctx.fillStyle = '#150924';
    ctx.fillRect(0, this.groundY, 960, 540 - this.groundY);
    ctx.strokeStyle = '#d500f9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(960, this.groundY);
    ctx.stroke();

    // 2. Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, sw.angle - sw.spread, sw.angle + sw.spread);
      ctx.strokeStyle = `rgba(224, 64, 251, ${sw.life})`;
      ctx.lineWidth = 14;
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Aiming Guide
    if (this.aiming && this.kineticCharge >= 20) {
      ctx.save();
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.player.x + Math.cos(this.aimAngle) * 260, this.player.y + Math.sin(this.aimAngle) * 260);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Draw Enemies
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.isBoss) {
        // Dread-Walker Walker Body
        ctx.fillStyle = '#263238';
        ctx.fillRect(-e.r, -e.r, e.r * 2, e.r * 1.5);
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 3;
        ctx.strokeRect(-e.r, -e.r, e.r * 2, e.r * 1.5);

        // Core Eye
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.arc(0, -10, 14, 0, Math.PI * 2);
        ctx.fill();

        // Boss HP
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-e.r, -e.r - 20, e.r * 2, 8);
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(-e.r, -e.r - 20, (e.r * 2) * (e.hp / e.maxHp), 8);
      } else {
        // Kree Scout Drone
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(0, 0, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Draw Black Panther
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Suit Kinetic Glow (Purple intensity based on kineticCharge)
    const chargeRatio = this.kineticCharge / 100;
    if (chargeRatio > 0.1) {
      ctx.shadowColor = '#d500f9';
      ctx.shadowBlur = chargeRatio * 28;
      ctx.strokeStyle = `rgba(213, 0, 249, ${chargeRatio})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -10, this.player.r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Vibranium Habit Body
    ctx.fillStyle = '#101014';
    ctx.fillRect(-14, -20, 28, 42);
    // Silver / Purple Accents
    ctx.strokeStyle = chargeRatio > 0.3 ? '#e040fb' : '#90a4ae';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, -15); ctx.lineTo(0, 0); ctx.lineTo(10, -15);
    ctx.stroke();

    // Panther Mask
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(0, -32, 14, 0, Math.PI * 2);
    ctx.fill();

    // Panther Ears
    ctx.beginPath();
    ctx.moveTo(-12, -42); ctx.lineTo(-7, -34); ctx.lineTo(-14, -34);
    ctx.moveTo(12, -42); ctx.lineTo(7, -34); ctx.lineTo(14, -34);
    ctx.fill();

    // Glowing Slit Eyes
    ctx.fillStyle = chargeRatio > 0.5 ? '#e040fb' : '#cfd8dc';
    ctx.fillRect(-6, -34, 4, 2);
    ctx.fillRect(2, -34, 4, 2);

    // Kinetic Charge Bar above head
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-22, -54, 44, 6);
    ctx.fillStyle = '#d500f9';
    ctx.fillRect(-22, -54, 44 * chargeRatio, 6);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-22, -54, 44, 6);

    ctx.restore();
  }
}

window.BlackPantherGame = BlackPantherGame;
