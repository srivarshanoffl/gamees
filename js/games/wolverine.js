/**
 * wolverine.js
 * Game 2: Wolverine - Adamantium Rush
 * Core Mechanic: Vector Slash Trajectory & Berserker Combo Momentum.
 * Drag/swipe to aim and launch Logan in hyper-velocity Adamantium claw lunges.
 * Chain aerial bounces between Sentinel drones, shred blast shields, and survive with mutant Healing Factor.
 */

class WolverineGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'wolverine';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.berserkMeter = 0; // 0 to 100
    this.isBerserk = false;
    this.berserkTimer = 0;
    this.distance = 0; // 0 to 1000m
    this.targetDistance = 1000;
    this.combo = 0;
    this.comboTimer = 0;
    this.regenTimer = 0;

    this.player = {
      x: 150,
      y: 300,
      vx: 0,
      vy: 0,
      r: 24,
      slashing: false,
      slashTargetX: 0,
      slashTargetY: 0,
      slashSpeed: 950,
      trail: []
    };

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragCurrentX = 0;
    this.dragCurrentY = 0;

    this.enemies = [];
    this.projectiles = [];
    this.slashSlices = [];
    this.sparks = [];
    this.spawnTimer = 0;
    this.boss = null;
    this.bossSpawned = false;

    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.round(this.health),
      stage: `${Math.min(1000, Math.round(this.distance))}m / 1000m`
    });
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.isDragging = true;
    this.dragStartX = x;
    this.dragStartY = y;
    this.dragCurrentX = x;
    this.dragCurrentY = y;
  }

  onPointerMove(e) {
    if (!this.isDragging || this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    this.dragCurrentX = e.clientX - rect.left;
    this.dragCurrentY = e.clientY - rect.top;
  }

  onPointerUp(e) {
    if (!this.isDragging || this.state !== 'PLAYING') return;
    this.isDragging = false;

    const dx = this.dragCurrentX - this.dragStartX;
    const dy = this.dragCurrentY - this.dragStartY;
    const dist = Math.hypot(dx, dy);

    // If dragged at least 25px, launch slash in that vector direction!
    if (dist > 25) {
      const angle = Math.atan2(dy, dx);
      this.launchSlash(angle);
    } else {
      // Direct click-to-dash toward target point
      const angle = Math.atan2(this.dragCurrentY - this.player.y, this.dragCurrentX - this.player.x);
      this.launchSlash(angle);
    }
  }

  launchSlash(angle) {
    const speed = this.isBerserk ? 1200 : 850;
    this.player.vx = Math.cos(angle) * speed;
    this.player.vy = Math.sin(angle) * speed;
    this.player.slashing = true;
    this.playSound('laser');

    // Create claw slice visual
    this.slashSlices.push({
      x: this.player.x,
      y: this.player.y,
      angle: angle,
      life: 0.25,
      maxLife: 0.25
    });
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.distance += (this.player.slashing ? 80 : 25) * dt;

    // Healing factor: regens if not hit recently
    this.regenTimer += dt;
    if (this.regenTimer > 2.0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + 8 * dt);
    }

    // Berserker mode handling
    if (this.isBerserk) {
      this.berserkTimer -= dt;
      if (this.berserkTimer <= 0) {
        this.isBerserk = false;
        this.berserkMeter = 0;
      }
    } else if (this.berserkMeter >= 100) {
      this.isBerserk = true;
      this.berserkTimer = 5.0; // 5 seconds of berserker fury!
      this.shakeCamera(10, 0.4);
      this.playSound('explosion');
    }

    // Combo timer
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Update player position
    if (this.player.slashing) {
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;

      // Friction / deceleration
      this.player.vx *= Math.pow(0.15, dt);
      this.player.vy *= Math.pow(0.15, dt);

      // Trail
      this.player.trail.push({ x: this.player.x, y: this.player.y, life: 0.2 });

      if (Math.hypot(this.player.vx, this.player.vy) < 120) {
        this.player.slashing = false;
      }
    } else {
      // Drift back gently toward center left
      this.player.x += (180 - this.player.x) * 2.5 * dt;
      this.player.y += (300 - this.player.y) * 2.5 * dt;
    }

    // Clamp inside canvas
    this.player.x = Math.max(30, Math.min(770, this.player.x));
    this.player.y = Math.max(40, Math.min(560, this.player.y));

    // Update trails
    for (let i = this.player.trail.length - 1; i >= 0; i--) {
      this.player.trail[i].life -= dt;
      if (this.player.trail[i].life <= 0) {
        this.player.trail.splice(i, 1);
      }
    }

    // Spawning enemies based on distance
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.7, 1.8 - (this.distance / 1000) * 0.9);
    if (this.spawnTimer >= spawnInterval && !this.boss) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Check boss encounter
    if (this.distance >= 800 && !this.bossSpawned) {
      this.bossSpawned = true;
      this.boss = {
        x: 680,
        y: 280,
        r: 65,
        health: 220,
        maxHealth: 220,
        attackTimer: 0,
        vy: 120
      };
      this.shakeCamera(8, 0.5);
      this.playSound('explosion');
    }

    // Update Boss
    if (this.boss) {
      this.boss.y += this.boss.vy * dt;
      if (this.boss.y < 120 || this.boss.y > 480) {
        this.boss.vy *= -1;
      }

      this.boss.attackTimer += dt;
      if (this.boss.attackTimer > 1.2) {
        this.boss.attackTimer = 0;
        // Boss shoots cluster missile
        for (let a = -0.3; a <= 0.3; a += 0.3) {
          this.projectiles.push({
            x: this.boss.x - 40,
            y: this.boss.y,
            vx: -340 * Math.cos(a),
            vy: 340 * Math.sin(a),
            r: 8,
            color: '#ef4444'
          });
        }
      }

      // Wolverine collision with boss
      const distToBoss = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
      if (distToBoss < this.player.r + this.boss.r) {
        if (this.player.slashing || this.isBerserk) {
          const dmg = this.isBerserk ? 45 : 20;
          this.boss.health -= dmg;
          this.score += 250;
          this.shakeCamera(7, 0.2);
          this.playSound('hit');
          this.createSparks(this.player.x, this.player.y, 16);

          // Ricochet Wolverine back
          this.player.vx = -this.player.vx * 0.7;
          this.player.vy = -this.player.vy * 0.7;

          if (this.boss.health <= 0) {
            this.boss = null;
            this.triggerVictory('APEX SENTINEL ANNIHILATED! WEAPON X FACILITY LIBERATED!');
            return;
          }
        } else {
          this.takeDamage(15);
          this.player.x -= 50;
        }
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx * dt;
      e.y += Math.sin(this.distance * 0.02 + e.phase) * e.waveAmp * dt;

      // Shooting
      e.shootTimer += dt;
      if (e.shootTimer > e.shootInterval) {
        e.shootTimer = 0;
        this.projectiles.push({
          x: e.x - 15,
          y: e.y,
          vx: -260,
          vy: (this.player.y - e.y) * 0.5,
          r: 6,
          color: '#f87171'
        });
      }

      // Check collision with Wolverine
      const d = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (d < this.player.r + e.r) {
        if (this.player.slashing || this.isBerserk) {
          // Shred enemy!
          this.createSparks(e.x, e.y, 12);
          this.score += 150 * (1 + this.combo * 0.2);
          this.combo++;
          this.comboTimer = 2.5;
          this.berserkMeter = Math.min(100, this.berserkMeter + 20);
          this.playSound('hit');
          this.enemies.splice(i, 1);
          continue;
        } else {
          // Collided without slashing -> Wolverine takes damage
          this.takeDamage(12);
          this.enemies.splice(i, 1);
          continue;
        }
      }

      if (e.x < -50) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const d = Math.hypot(this.player.x - p.x, this.player.y - p.y);
      if (d < this.player.r + p.r) {
        if (this.player.slashing || this.isBerserk) {
          // Adamantium claws deflect projectile!
          this.createSparks(p.x, p.y, 6);
          this.score += 50;
          this.projectiles.splice(i, 1);
          continue;
        } else {
          this.takeDamage(10);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.x < -20 || p.x > 820 || p.y < -20 || p.y > 620) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update slash slices
    for (let i = this.slashSlices.length - 1; i >= 0; i--) {
      this.slashSlices[i].life -= dt;
      if (this.slashSlices[i].life <= 0) {
        this.slashSlices.splice(i, 1);
      }
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // Check Distance Victory if boss defeated or reached exit
    if (this.distance >= this.targetDistance && !this.boss) {
      this.triggerVictory('FACILITY PERIMETER BREACHED! ESCAPE SUCCESSFUL!');
    }

    this.updateHUDValues();
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.regenTimer = 0;
    this.shakeCamera(8, 0.25);
    this.playSound('hit');
    this.combo = 0;

    if (this.health <= 0) {
      this.triggerGameOver('Wolverine was overwhelmed by Weapon X forces.');
    }
  }

  spawnEnemy() {
    const types = ['sentinel_drone', 'reaver_guard'];
    const type = types[Math.floor(Math.random() * types.length)];
    const y = 80 + Math.random() * 440;

    this.enemies.push({
      type: type,
      x: 840,
      y: y,
      vx: -(160 + Math.random() * 90),
      r: type === 'sentinel_drone' ? 22 : 28,
      waveAmp: type === 'sentinel_drone' ? 80 : 20,
      phase: Math.random() * Math.PI * 2,
      shootTimer: Math.random() * 0.8,
      shootInterval: 1.6 + Math.random() * 0.8
    });
  }

  createSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 260;
      this.sparks.push({
        x: x,
        y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        color: Math.random() > 0.4 ? '#facc15' : '#ffffff',
        life: 0.2 + Math.random() * 0.3
      });
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 800, 600);

    // Cyberpunk corridor background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Scrolling high-tech corridor wall lines
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 2;
    const gridOffset = (this.distance * 3) % 80;
    for (let x = -gridOffset; x < 800; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(800, 100);
    ctx.moveTo(0, 500);
    ctx.lineTo(800, 500);
    ctx.stroke();

    // Claw trails
    for (const t of this.player.trail) {
      ctx.fillStyle = this.isBerserk ? 'rgba(239, 68, 68, 0.4)' : 'rgba(250, 204, 21, 0.35)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.player.r * (t.life / 0.2), 0, Math.PI * 2);
      ctx.fill();
    }

    // Aim drag line
    if (this.isDragging) {
      const dx = this.dragCurrentX - this.dragStartX;
      const dy = this.dragCurrentY - this.dragStartY;
      const len = Math.hypot(dx, dy);
      if (len > 15) {
        ctx.strokeStyle = this.isBerserk ? '#ef4444' : '#facc15';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(this.player.x, this.player.y);
        ctx.lineTo(this.player.x + (dx / len) * 160, this.player.y + (dy / len) * 160);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Slash Slices (Triple Adamantium Claw Marks)
    for (const s of this.slashSlices) {
      const alpha = s.life / s.maxLife;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.strokeStyle = this.isBerserk ? `rgba(239, 68, 68, ${alpha})` : `rgba(254, 240, 138, ${alpha})`;
      ctx.lineWidth = 4;
      for (let off = -12; off <= 12; off += 12) {
        ctx.beginPath();
        ctx.moveTo(-40, off);
        ctx.lineTo(60, off);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Enemies
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.type === 'sentinel_drone') {
        // Sentinel Drone body
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(0, 0, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Glowing red optic
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Reaver Guard
        ctx.fillStyle = '#475569';
        ctx.fillRect(-e.r, -e.r, e.r * 2, e.r * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.strokeRect(-e.r, -e.r, e.r * 2, e.r * 2);

        // Cyber visor
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-e.r + 4, -4, e.r * 1.5, 8);
      }
      ctx.restore();
    }

    // Render Boss
    if (this.boss) {
      ctx.save();
      ctx.translate(this.boss.x, this.boss.y);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, 0, this.boss.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Core eye
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      // Health bar above boss
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-50, -85, 100, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-50, -85, 100 * (this.boss.health / this.boss.maxHealth), 10);
      ctx.restore();
    }

    // Render Projectiles
    for (const p of this.projectiles) {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Render Sparks
    for (const s of this.sparks) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Wolverine
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Berserk Aura
    if (this.isBerserk) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.r + 8 + Math.sin(Date.now() * 0.02) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Logan Cowl / Yellow & Blue suit
    ctx.fillStyle = this.isBerserk ? '#b91c1c' : '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, this.player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e3a8a'; // Classic cowl blue outline
    ctx.lineWidth = 4;
    ctx.stroke();

    // Cowl mask fins
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(-10, -this.player.r);
    ctx.lineTo(-20, -this.player.r - 12);
    ctx.lineTo(0, -this.player.r + 4);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -this.player.r);
    ctx.lineTo(20, -this.player.r - 12);
    ctx.lineTo(0, -this.player.r + 4);
    ctx.fill();

    // Adamantium Claws extended
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    for (let c = -8; c <= 8; c += 8) {
      ctx.beginPath();
      ctx.moveTo(15, c);
      ctx.lineTo(38, c);
      ctx.stroke();
    }
    ctx.restore();

    // Top Berserker Meter Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(20, 20, 220, 22);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(20, 20, 220, 22);

    const bFill = this.isBerserk ? (this.berserkTimer / 5.0) * 216 : (this.berserkMeter / 100) * 216;
    ctx.fillStyle = this.isBerserk ? '#ef4444' : '#f59e0b';
    ctx.fillRect(22, 22, bFill, 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText(this.isBerserk ? 'BERSERKER FURY ACTIVE!' : `BERSERK: ${Math.round(this.berserkMeter)}%`, 30, 35);

    if (this.combo > 1) {
      ctx.fillStyle = '#facc15';
      ctx.font = '900 20px "Segoe UI", sans-serif';
      ctx.fillText(`${this.combo}x SLICE COMBO!`, 20, 70);
    }
  }
}

window.WolverineGame = WolverineGame;
