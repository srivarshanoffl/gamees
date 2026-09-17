/**
 * heralds-exodus.js
 * Game 9: Herald's Exodus - Galactus Devours
 * Core Mechanic: Cosmic Gravitational Slingshot & Convoy Escort Ahead of an Advancing Doom Wall.
 * Pilot the Silver Surfer to tether and slingshot around celestial bodies, clear asteroid fields with Cosmic Blasts,
 * and guide refugee evacuation arks to the Hyper-Jump Warp Gate ahead of Galactus's consumption wave.
 */

class HeraldsExodusGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'heraldsexodus';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.health = 100; // Power Cosmic Shield
    this.maxHealth = 100;
    this.distance = 0; // 0 to 1200 Parsecs
    this.targetDistance = 1200;
    this.arksRemaining = 3;

    // Player (Silver Surfer)
    this.player = {
      x: 320,
      y: 300,
      vx: 0,
      vy: 0,
      r: 20,
      targetY: 300,
      tetheredBody: null
    };

    // Advancing Doom Wall (Galactus Antimatter Front)
    this.doomWallX = 40;
    this.doomSpeed = 65;

    // Evacuation Arks following Surfer
    this.arks = [
      { id: 1, x: 240, y: 260, r: 16, alive: true },
      { id: 2, x: 210, y: 300, r: 16, alive: true },
      { id: 3, x: 240, y: 340, r: 16, alive: true }
    ];

    // Celestial Gravity Wells (Moons / Neutron Stars)
    this.gravityWells = [];
    this.asteroids = [];
    this.cosmicBlasts = [];
    this.particles = [];
    this.spawnTimer = 0;

    this.spawnCelestial();
    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.max(0, Math.round(this.health)),
      stage: `${Math.min(this.targetDistance, Math.round(this.distance))} / ${this.targetDistance} PARSECS`
    });
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if clicked near a celestial gravity well to tether!
    let hitched = false;
    for (const well of this.gravityWells) {
      const d = Math.hypot(mx - well.x, my - well.y);
      if (d < well.r + 50) {
        this.player.tetheredBody = well;
        hitched = true;
        this.playSound('laser');
        break;
      }
    }

    // Otherwise, fire Cosmic Beam blast to destroy asteroid obstacles!
    if (!hitched) {
      this.fireCosmicBlast(mx, my);
    }
  }

  onPointerMove(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    this.player.targetY = e.clientY - rect.top;
  }

  onPointerUp(e) {
    // Release tether for slingshot burst!
    if (this.player.tetheredBody) {
      this.player.tetheredBody = null;
      this.player.vx += 320; // Slingshot forward surge!
      this.playSound('powerup');
      this.createSparks(this.player.x, this.player.y, '#38bdf8', 14);
    }
  }

  fireCosmicBlast(targetX, targetY) {
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    this.cosmicBlasts.push({
      x: this.player.x + 20,
      y: this.player.y,
      vx: Math.cos(angle) * 750,
      vy: Math.sin(angle) * 750,
      r: 8
    });
    this.playSound('laser');
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Travel distance increases with Surfer speed
    const forwardSpeed = 160 + this.player.vx;
    this.distance += (forwardSpeed / 8) * dt;

    // Surfer forward inertia decay
    this.player.vx *= Math.pow(0.5, dt);

    // Surfer vertical smooth tracking
    if (!this.player.tetheredBody) {
      this.player.y += (this.player.targetY - this.player.y) * 8 * dt;
    } else {
      // Slingshot orbit around tethered celestial well
      const well = this.player.tetheredBody;
      const angle = Math.atan2(this.player.y - well.y, this.player.x - well.x) + 4.5 * dt;
      const radius = 95;
      this.player.x = well.x + Math.cos(angle) * radius;
      this.player.y = well.y + Math.sin(angle) * radius;
    }

    // Keep Surfer in horizontal bound
    this.player.x += (340 - this.player.x) * 4 * dt;
    this.player.y = Math.max(40, Math.min(560, this.player.y));

    // Doom Wall advances rightwards if Surfer slows down
    this.doomWallX += (this.doomSpeed - (forwardSpeed * 0.15)) * dt;
    this.doomWallX = Math.max(30, Math.min(260, this.doomWallX));

    // Check if Doom Wall consumes Surfer
    if (this.player.x <= this.doomWallX + 15) {
      this.health -= 35 * dt;
      this.shakeCamera(6, 0.1);
      if (this.health <= 0) {
        this.triggerGameOver('Galactus devoured the Silver Surfer and the Zenn-La fleet!');
        return;
      }
    }

    // Update Evacuation Arks following Surfer
    let activeArks = 0;
    this.arks.forEach((ark, idx) => {
      if (!ark.alive) return;
      activeArks++;

      const targetX = this.player.x - 90 - (idx * 30);
      const targetY = this.player.y + (idx - 1) * 35;
      ark.x += (targetX - ark.x) * 3.5 * dt;
      ark.y += (targetY - ark.y) * 3.5 * dt;

      // Check if Ark consumed by Doom Wall
      if (ark.x <= this.doomWallX + 10) {
        ark.alive = false;
        this.shakeCamera(8, 0.3);
        this.playSound('explosion');
        this.createSparks(ark.x, ark.y, '#ef4444', 16);
      }
    });

    this.arksRemaining = activeArks;
    if (this.arksRemaining <= 0) {
      this.triggerGameOver('All refugee evacuation arks were destroyed by Galactus!');
      return;
    }

    // Scroll celestial gravity wells & asteroids
    const scroll = forwardSpeed * dt;
    for (let i = this.gravityWells.length - 1; i >= 0; i--) {
      const well = this.gravityWells[i];
      well.x -= scroll;
      if (well.x < -80) {
        this.gravityWells.splice(i, 1);
      }
    }

    // Spawning celestial wells & asteroids
    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.4) {
      this.spawnTimer = 0;
      this.spawnCelestial();
    }

    // Update Asteroid obstacles
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.x -= (scroll + ast.vx);
      ast.y += ast.vy * dt;

      // Collision with Cosmic Blasts
      let destroyed = false;
      for (let j = this.cosmicBlasts.length - 1; j >= 0; j--) {
        const b = this.cosmicBlasts[j];
        if (Math.hypot(ast.x - b.x, ast.y - b.y) < ast.r + b.r) {
          destroyed = true;
          this.score += 150;
          this.createSparks(ast.x, ast.y, '#facc15', 12);
          this.playSound('explosion');
          this.cosmicBlasts.splice(j, 1);
          break;
        }
      }
      if (destroyed) {
        this.asteroids.splice(i, 1);
        continue;
      }

      // Collision with Surfer
      if (Math.hypot(this.player.x - ast.x, this.player.y - ast.y) < this.player.r + ast.r) {
        this.health -= 18;
        this.shakeCamera(7, 0.2);
        this.createSparks(ast.x, ast.y, '#38bdf8', 10);
        this.playSound('hit');
        this.asteroids.splice(i, 1);
        continue;
      }

      // Collision with Arks
      for (const ark of this.arks) {
        if (ark.alive && Math.hypot(ark.x - ast.x, ark.y - ast.y) < ark.r + ast.r) {
          ark.alive = false;
          this.shakeCamera(8, 0.3);
          this.playSound('explosion');
          this.createSparks(ark.x, ark.y, '#ef4444', 16);
          this.asteroids.splice(i, 1);
          break;
        }
      }

      if (ast.x < -60) {
        this.asteroids.splice(i, 1);
      }
    }

    // Update Cosmic Blasts
    for (let i = this.cosmicBlasts.length - 1; i >= 0; i--) {
      const b = this.cosmicBlasts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x > 840 || b.y < -20 || b.y > 620) {
        this.cosmicBlasts.splice(i, 1);
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

    // Win condition: Warp Gate reached!
    if (this.distance >= this.targetDistance) {
      this.triggerVictory(`HYPER-JUMP GATE REACHED! ${this.arksRemaining} ARKS SAVED FROM GALACTUS!`);
    }

    this.updateHUDValues();
  }

  spawnCelestial() {
    // Spawn a gravity well moon or neutron star
    if (Math.random() < 0.6) {
      this.gravityWells.push({
        x: 880,
        y: 100 + Math.random() * 400,
        r: 30 + Math.random() * 20,
        color: Math.random() > 0.5 ? '#818cf8' : '#38bdf8'
      });
    }

    // Spawn 1-2 space asteroids
    this.asteroids.push({
      x: 900,
      y: 60 + Math.random() * 480,
      vx: 40 + Math.random() * 60,
      vy: (Math.random() - 0.5) * 40,
      r: 18 + Math.random() * 12
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

    // Deep Space Cosmic Nebula Background
    const bg = ctx.createLinearGradient(0, 0, 800, 0);
    bg.addColorStop(0, '#581c87'); // Galactus consumption violet
    bg.addColorStop(0.3, '#1e1b4b');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 600);

    // Distant Stars parallax
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 37 - this.distance * 1.5) % 800;
      const sy = (i * 73) % 600;
      ctx.fillRect(sx < 0 ? sx + 800 : sx, sy, 2, 2);
    }

    // GALACTUS ADVANCING DOOM WALL (Left Screen)
    const doomGrad = ctx.createLinearGradient(0, 0, this.doomWallX, 0);
    doomGrad.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
    doomGrad.addColorStop(0.8, 'rgba(126, 34, 206, 0.7)');
    doomGrad.addColorStop(1, 'rgba(192, 132, 252, 0)');
    ctx.fillStyle = doomGrad;
    ctx.fillRect(0, 0, this.doomWallX + 30, 600);

    // Galactus Giant Silhouette Eyes in Doom Wall
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(this.doomWallX * 0.4, 240, 16, 0, Math.PI * 2);
    ctx.arc(this.doomWallX * 0.4, 340, 16, 0, Math.PI * 2);
    ctx.fill();

    // Gravity Well Celestial Moons
    for (const well of this.gravityWells) {
      ctx.save();
      ctx.translate(well.x, well.y);
      ctx.fillStyle = well.color;
      ctx.shadowColor = well.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, well.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Orbit Gravity Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, well.r + 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Power Cosmic Tether Line to Well
    if (this.player.tetheredBody) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.player.tetheredBody.x, this.player.tetheredBody.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Space Asteroids
    for (const ast of this.asteroids) {
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.arc(ast.x, ast.y, ast.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Cosmic Blasts
    for (const b of this.cosmicBlasts) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Evacuation Arks
    this.arks.forEach(ark => {
      if (!ark.alive) return;
      ctx.save();
      ctx.translate(ark.x, ark.y);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-14, -10);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-14, 10);
      ctx.closePath();
      ctx.fill();

      // Thruster trail
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-14, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Silver Surfer (Norrin Radd)
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Cosmic Surfboard
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(0, 10, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Surfer Body (Chrome Silver)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(4, -6, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Arks Remaining Indicator
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(20, 15, 230, 28);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(20, 15, 230, 28);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText(`EVACUATION ARKS: ${this.arksRemaining} / 3 INTACT`, 30, 33);
  }
}

window.HeraldsExodusGame = HeraldsExodusGame;
