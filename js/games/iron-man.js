/**
 * iron-man.js
 * Game 3: Iron Man - Reactor Overdrive
 * Mechanic: 3-Way Arc Reactor power routing & vertical flight defense.
 * Switch power dynamically between Thrusters (Speed), Repulsors (Firepower),
 * and Shields (Damage Absorption) to survive Ultron swarms.
 */

class IronManGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'ironman';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.health = 100;
    this.energy = 100;

    // Power allocation mode: 'THRUST', 'BLAST', 'SHIELD'
    this.powerMode = 'BLAST';

    this.player = {
      x: 480,
      y: 420,
      vx: 0,
      vy: 0,
      radius: 20,
      overheat: 0
    };

    this.projectiles = [];
    this.enemies = [];
    this.spawnTimer = 0;
    this.fireTimer = 0;
    this.boss = null;

    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.health, energy: this.energy });
  }

  initStage(st) {
    this.stage = st;
    this.enemies = [];
    this.projectiles = [];
    this.spawnTimer = 0;
    this.enemiesRemaining = 12 + st * 8;

    if (st === 3) {
      this.boss = {
        x: 480,
        y: 120,
        vx: 120,
        radius: 45,
        hp: 30,
        maxHp: 30,
        attackTimer: 0
      };
    } else {
      this.boss = null;
    }

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'STARK TOWER DEFENSE' : st === 2 ? 'EMP DRONE SWARM' : 'ULTRON PRIME BATTLE'}`);
  }

  setPowerMode(mode) {
    this.powerMode = mode;
    this.spawnComicText(mode, this.player.x, this.player.y - 30, mode === 'THRUST' ? '#00f0ff' : mode === 'BLAST' ? '#ffd200' : '#00e676');
    if (window.soundFX) window.soundFX.repulsor();
  }

  onKeyDown(e) {
    if (e.code === 'Digit1' || e.code === 'KeyZ') this.setPowerMode('THRUST');
    if (e.code === 'Digit2' || e.code === 'KeyX') this.setPowerMode('BLAST');
    if (e.code === 'Digit3' || e.code === 'KeyC') this.setPowerMode('SHIELD');
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;
    // Check if clicked in lower HUD mode area or direct screen tap
    if (y > 480) {
      if (x < 320) this.setPowerMode('THRUST');
      else if (x < 640) this.setPowerMode('BLAST');
      else this.setPowerMode('SHIELD');
    }
  }

  update(dt) {
    // Mode-based stats
    const maxSpeed = this.powerMode === 'THRUST' ? 450 : 250;
    const rechargeRate = this.powerMode === 'SHIELD' ? 15 : 25;

    // Energy recovery
    this.energy = Math.min(100, this.energy + rechargeRate * dt);

    // Player Movement (WASD / Arrows / Pointer drag)
    let moveX = 0;
    let moveY = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;

    // Direct pointer following if dragging
    if (this.pointer.isDown && this.pointer.y < 480) {
      const dx = this.pointer.x - this.player.x;
      const dy = this.pointer.y - this.player.y;
      if (Math.hypot(dx, dy) > 10) {
        moveX = Math.sign(dx);
        moveY = Math.sign(dy);
      }
    }

    this.player.vx = moveX * maxSpeed;
    this.player.vy = moveY * maxSpeed;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Clamp to canvas boundaries
    this.player.x = Math.max(30, Math.min(this.vWidth - 30, this.player.x));
    this.player.y = Math.max(60, Math.min(460, this.player.y));

    // Thruster exhaust particles
    if (Math.random() < 0.6) {
      this.spawnParticle(
        this.player.x + (Math.random() * 8 - 4),
        this.player.y + 18,
        (Math.random() - 0.5) * 40,
        150 + Math.random() * 100,
        this.powerMode === 'THRUST' ? '#00f0ff' : '#ffd200',
        3, 0.3
      );
    }

    // Auto-fire Repulsors when in BLAST mode
    this.fireTimer += dt;
    const fireInterval = this.powerMode === 'BLAST' ? 0.18 : 0.45;
    if (this.fireTimer >= fireInterval && this.energy > 8) {
      this.fireTimer = 0;
      this.energy -= (this.powerMode === 'BLAST' ? 6 : 10);
      this.projectiles.push({
        x: this.player.x - 12,
        y: this.player.y - 15,
        vx: (Math.random() - 0.5) * 30,
        vy: -600,
        radius: 5,
        dmg: this.powerMode === 'BLAST' ? 2 : 1
      });
      this.projectiles.push({
        x: this.player.x + 12,
        y: this.player.y - 15,
        vx: (Math.random() - 0.5) * 30,
        vy: -600,
        radius: 5,
        dmg: this.powerMode === 'BLAST' ? 2 : 1
      });
      if (window.soundFX) window.soundFX.repulsor();
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Spawn regular enemies
    this.spawnTimer += dt;
    if (this.enemiesRemaining > 0 && this.spawnTimer > (1.2 - this.stage * 0.2)) {
      this.spawnTimer = 0;
      this.enemiesRemaining--;
      this.enemies.push({
        x: 80 + Math.random() * (this.vWidth - 160),
        y: -30,
        vx: (Math.random() - 0.5) * 100,
        vy: 90 + Math.random() * 60 + this.stage * 20,
        radius: 18,
        hp: 2 + this.stage
      });
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < 40 || e.x > this.vWidth - 40) e.vx = -e.vx;

      // Check hit with projectiles
      for (let j = this.projectiles.length - 1; j >= 0; j--) {
        const p = this.projectiles[j];
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
          e.hp -= p.dmg;
          this.projectiles.splice(j, 1);
          if (e.hp <= 0) break;
        }
      }

      // Check destroyed
      if (e.hp <= 0) {
        this.score += 150;
        this.shake(4, 0.15);
        if (window.soundFX) window.soundFX.hit();
        this.spawnComicText('ZAP!', e.x, e.y, '#ffd200');
        for (let p = 0; p < 8; p++) {
          this.spawnParticle(e.x, e.y, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150, '#ff4747', 4);
        }
        this.enemies.splice(i, 1);
        continue;
      }

      // Collision with player
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.radius + this.player.radius) {
        const dmg = this.powerMode === 'SHIELD' ? 8 : 25;
        this.health -= dmg;
        this.shake(8, 0.3);
        if (window.soundFX) window.soundFX.hit();
        this.spawnComicText(this.powerMode === 'SHIELD' ? 'DEFLECT!' : 'CRUNCH!', this.player.x, this.player.y, '#e23636');
        this.enemies.splice(i, 1);
        if (this.health <= 0) {
          this.triggerGameOver('Stark armor integrity compromised by Ultron sentries!');
          return;
        }
        continue;
      }

      if (e.y > this.vHeight + 30) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Boss (Stage 3)
    if (this.boss) {
      this.boss.x += this.boss.vx * dt;
      if (this.boss.x < 120 || this.boss.x > this.vWidth - 120) this.boss.vx = -this.boss.vx;

      // Boss projectile collisions
      for (let j = this.projectiles.length - 1; j >= 0; j--) {
        const p = this.projectiles[j];
        if (Math.hypot(this.boss.x - p.x, this.boss.y - p.y) < this.boss.radius + p.radius) {
          this.boss.hp -= p.dmg;
          this.projectiles.splice(j, 1);
        }
      }

      if (this.boss.hp <= 0) {
        this.score += 2500;
        this.triggerVictory('Iron Man neutralized Ultron Prime and restored Stark Tower security!');
        return;
      }
    }

    // Check Stage completion (Stages 1 and 2)
    if (!this.boss && this.enemiesRemaining <= 0 && this.enemies.length === 0) {
      this.score += 500;
      this.initStage(this.stage + 1);
    }

    this.setHUD({ score: this.score, stage: this.stage, health: this.health, energy: this.energy });
  }

  render(ctx) {
    // Sky gradient with speed lines
    const grad = ctx.createLinearGradient(0, 0, 0, this.vHeight);
    grad.addColorStop(0, '#040714');
    grad.addColorStop(1, '#0c162d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Speed lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const sx = (i * 130 + Date.now() * 0.2) % this.vWidth;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, this.vHeight);
      ctx.stroke();
    }

    // Render Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Enemies
    for (const e of this.enemies) {
      ctx.save();
      ctx.fillStyle = '#78909c';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(e.x, e.y - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Boss
    if (this.boss) {
      ctx.save();
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      ctx.arc(this.boss.x, this.boss.y, this.boss.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d50000';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Boss glowing red eyes
      ctx.fillStyle = '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 12;
      ctx.fillRect(this.boss.x - 18, this.boss.y - 8, 12, 6);
      ctx.fillRect(this.boss.x + 6, this.boss.y - 8, 12, 6);

      // Boss HP Bar
      const hpPct = this.boss.hp / this.boss.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(this.boss.x - 40, this.boss.y - 60, 80, 8);
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(this.boss.x - 40, this.boss.y - 60, 80 * hpPct, 8);
      ctx.restore();
    }

    // Render Iron Man
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Shield Aura if in SHIELD mode
    if (this.powerMode === 'SHIELD') {
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.7)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Armor Body (Red & Gold)
    ctx.fillStyle = '#d32f2f'; // Hot-rod Red
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gold faceplate
    ctx.fillStyle = '#ffd200';
    ctx.fillRect(-8, -12, 16, 14);

    // Glowing Cyan Eyes
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-6, -6, 4, 2);
    ctx.fillRect(2, -6, 4, 2);

    // Arc Reactor Core (Glowing Cyan)
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Mode Selector Overlay at bottom
    ctx.save();
    const modes = [
      { name: '1: THRUST', mode: 'THRUST', x: 200, color: '#00f0ff' },
      { name: '2: BLAST', mode: 'BLAST', x: 480, color: '#ffd200' },
      { name: '3: SHIELD', mode: 'SHIELD', x: 760, color: '#00e676' }
    ];

    for (const m of modes) {
      const active = this.powerMode === m.mode;
      ctx.fillStyle = active ? m.color : 'rgba(255,255,255,0.1)';
      ctx.fillRect(m.x - 90, 490, 180, 36);
      ctx.fillStyle = active ? '#000' : '#fff';
      ctx.font = "bold 16px 'Bangers', cursive";
      ctx.textAlign = 'center';
      ctx.fillText(m.name, m.x, 514);
    }
    ctx.restore();
  }
}

window.IronManGame = IronManGame;
