/**
 * incursion-point.js
 * Game 8: Incursion Point - Orbital Collision
 * Core Mechanic: Orbital Gravitational Repulsor Physics & Roche Limit Collision Deflection.
 * Two parallel Earths are being drawn together at the universal Incursion Point.
 * Fire Illuminati Graviton Repulsors and intercept antimatter missiles to avert total mutual planetary annihilation.
 */

class IncursionPointGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'incursionpoint';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.planetaryShields = 100;
    this.maxHealth = 100;
    this.survivalTime = 0;
    this.winTargetTime = 50; // 50 seconds to complete separation protocol

    // Earth-616 (Left)
    this.earth1 = {
      x: 140,
      y: 300,
      vx: 0,
      r: 90,
      targetX: 120,
      color: '#0284c7'
    };

    // Earth-1610 (Right)
    this.earth2 = {
      x: 660,
      y: 300,
      vx: 0,
      r: 90,
      targetX: 680,
      color: '#7c3aed'
    };

    // Satellite (Player)
    this.satellite = {
      x: 400,
      y: 300,
      targetX: 400,
      targetY: 300,
      r: 16,
      angle: 0,
      energy: 100
    };

    this.repulsors = [];
    this.missiles = [];
    this.particles = [];
    this.spawnTimer = 0;

    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.max(0, Math.round(this.planetaryShields)),
      stage: `${Math.min(this.winTargetTime, Math.round(this.survivalTime))}s / ${this.winTargetTime}s`
    });
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    this.satellite.targetX = mx;
    this.satellite.targetY = my;
    this.fireRepulsor(mx, my);
  }

  onPointerMove(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    this.satellite.targetX = e.clientX - rect.left;
    this.satellite.targetY = e.clientY - rect.top;
  }

  fireRepulsor(targetX, targetY) {
    if (this.satellite.energy < 12) return;
    this.satellite.energy -= 12;

    // Fire dual repulsor wave toward both planets or clicked point
    const angleToTarget = Math.atan2(targetY - this.satellite.y, targetX - this.satellite.x);

    // Blast wave
    this.repulsors.push({
      x: this.satellite.x,
      y: this.satellite.y,
      vx: Math.cos(angleToTarget) * 450,
      vy: Math.sin(angleToTarget) * 450,
      r: 26,
      life: 1.2
    });

    // Also fire opposite stabilizing blast
    this.repulsors.push({
      x: this.satellite.x,
      y: this.satellite.y,
      vx: -Math.cos(angleToTarget) * 450,
      vy: -Math.sin(angleToTarget) * 450,
      r: 26,
      life: 1.2
    });

    this.playSound('laser');
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.survivalTime += dt;
    this.satellite.energy = Math.min(100, this.satellite.energy + 28 * dt);

    // Follow cursor smoothly
    this.satellite.x += (this.satellite.targetX - this.satellite.x) * 8 * dt;
    this.satellite.y += (this.satellite.targetY - this.satellite.y) * 8 * dt;

    // Natural Incursion Gravitational attraction pulling planets together!
    // Gravity increases with time
    const gravityPull = 22 + (this.survivalTime / 50) * 42;
    this.earth1.x += gravityPull * dt;
    this.earth2.x -= gravityPull * dt;

    // Roche Limit Distance: Minimum safe gap between planet centers is 220px
    const planetDistance = this.earth2.x - this.earth1.x;
    if (planetDistance < 190) {
      // Catastrophic collision!
      this.planetaryShields = 0;
      this.shakeCamera(14, 0.6);
      this.playSound('explosion');
      this.triggerGameOver('INCURSION COLLISION! BOTH UNIVERSES CRUSHED OUT OF EXISTENCE!');
      return;
    }

    // Update Repulsor Waves
    for (let i = this.repulsors.length - 1; i >= 0; i--) {
      const rep = this.repulsors[i];
      rep.x += rep.vx * dt;
      rep.y += rep.vy * dt;
      rep.life -= dt;

      // Nudge Earth-616 leftwards
      const d1 = Math.hypot(rep.x - this.earth1.x, rep.y - this.earth1.y);
      if (d1 < this.earth1.r + rep.r) {
        this.earth1.x = Math.max(90, this.earth1.x - 32);
        this.score += 80;
        this.createSparks(rep.x, rep.y, '#38bdf8', 8);
        this.repulsors.splice(i, 1);
        continue;
      }

      // Nudge Earth-1610 rightwards
      const d2 = Math.hypot(rep.x - this.earth2.x, rep.y - this.earth2.y);
      if (d2 < this.earth2.r + rep.r) {
        this.earth2.x = Math.min(710, this.earth2.x + 32);
        this.score += 80;
        this.createSparks(rep.x, rep.y, '#c084fc', 8);
        this.repulsors.splice(i, 1);
        continue;
      }

      if (rep.life <= 0 || rep.x < 0 || rep.x > 800) {
        this.repulsors.splice(i, 1);
      }
    }

    // Spawning Incursion Antimatter Missiles / Debris
    this.spawnTimer += dt;
    const interval = Math.max(0.7, 1.8 - (this.survivalTime / 50) * 0.9);
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnMissile();
    }

    // Update Missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Check hit by repulsor
      let shotDown = false;
      for (let j = this.repulsors.length - 1; j >= 0; j--) {
        const r = this.repulsors[j];
        if (Math.hypot(m.x - r.x, m.y - r.y) < m.r + r.r) {
          shotDown = true;
          this.score += 150;
          this.createSparks(m.x, m.y, '#f59e0b', 12);
          this.playSound('explosion');
          this.missiles.splice(i, 1);
          break;
        }
      }
      if (shotDown) continue;

      // Check impact on Earth-616
      if (Math.hypot(m.x - this.earth1.x, m.y - this.earth1.y) < this.earth1.r) {
        this.planetaryShields -= 18;
        this.shakeCamera(7, 0.25);
        this.createSparks(m.x, m.y, '#ef4444', 14);
        this.playSound('hit');
        this.missiles.splice(i, 1);
        if (this.planetaryShields <= 0) {
          this.triggerGameOver('Earth-616 planetary shields failed!');
          return;
        }
        continue;
      }

      // Check impact on Earth-1610
      if (Math.hypot(m.x - this.earth2.x, m.y - this.earth2.y) < this.earth2.r) {
        this.planetaryShields -= 18;
        this.shakeCamera(7, 0.25);
        this.createSparks(m.x, m.y, '#ef4444', 14);
        this.playSound('hit');
        this.missiles.splice(i, 1);
        if (this.planetaryShields <= 0) {
          this.triggerGameOver('Earth-1610 planetary shields failed!');
          return;
        }
        continue;
      }

      if (m.y < -30 || m.y > 630) {
        this.missiles.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Win condition check
    if (this.survivalTime >= this.winTargetTime) {
      this.triggerVictory('INCURSION HORIZON REPELLED! PLANETARY ORBITS STABILIZED!');
    }

    this.updateHUDValues();
  }

  spawnMissile() {
    const isTargetingLeft = Math.random() < 0.5;
    const target = isTargetingLeft ? this.earth1 : this.earth2;
    const startY = Math.random() < 0.5 ? -20 : 620;
    const startX = 300 + Math.random() * 200;

    const angle = Math.atan2(target.y - startY, target.x - startX);
    const spd = 160 + Math.random() * 80;

    this.missiles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      r: 12
    });
  }

  createSparks(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        color: color,
        life: 0.35
      });
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 800, 600);

    // Deep Void Incursion Sky
    const bg = ctx.createLinearGradient(0, 0, 800, 0);
    bg.addColorStop(0, '#0c1a2e');
    bg.addColorStop(0.5, '#450a0a'); // Red warning rift
    bg.addColorStop(1, '#1e1138');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 600);

    // Central Incursion Rift Distortion Line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    ctx.setLineDash([]);

    // Roche Limit Danger Zones
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.earth1.x, this.earth1.y, this.earth1.r + 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.earth2.x, this.earth2.y, this.earth2.r + 30, 0, Math.PI * 2);
    ctx.stroke();

    // EARTH-616 (Blue World)
    ctx.save();
    ctx.translate(this.earth1.x, this.earth1.y);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, this.earth1.r, 0, Math.PI * 2);
    ctx.fill();

    // Continents
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(-20, -15, 30, 0, Math.PI * 2);
    ctx.arc(20, 20, 35, 0, Math.PI * 2);
    ctx.fill();

    // Atmosphere Glow
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, this.earth1.r + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('EARTH-616', -35, 5);
    ctx.restore();

    // EARTH-1610 (Ultimate Violet World)
    ctx.save();
    ctx.translate(this.earth2.x, this.earth2.y);
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(0, 0, this.earth2.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(-15, 20, 28, 0, Math.PI * 2);
    ctx.arc(25, -15, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, this.earth2.r + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('EARTH-1610', -38, 5);
    ctx.restore();

    // Repulsor Blast Waves
    for (const r of this.repulsors) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Antimatter Missiles
    for (const m of this.missiles) {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Satellite (Player)
    ctx.save();
    ctx.translate(this.satellite.x, this.satellite.y);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(-10, -10, 20, 20);

    // Solar Wings
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-32, -6, 20, 12);
    ctx.fillRect(12, -6, 20, 12);
    ctx.restore();

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Warning Separation Distance Meter
    const dist = Math.round(this.earth2.x - this.earth1.x);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(290, 15, 220, 32);
    ctx.strokeStyle = dist < 250 ? '#ef4444' : '#38bdf8';
    ctx.strokeRect(290, 15, 220, 32);

    ctx.fillStyle = dist < 250 ? '#ef4444' : '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText(`SEPARATION GAP: ${dist} KM`, 330, 35);
  }
}

window.IncursionPointGame = IncursionPointGame;
