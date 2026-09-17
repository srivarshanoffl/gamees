/**
 * doctor-strange.js
 * Game 6: Doctor Strange - Mirror Portals
 * Mechanic: Dual linked Sling Ring portal placement & velocity preservation.
 * Place Orange and Blue portals to redirect Strange's falling momentum,
 * bypassing fractured reality gaps to collect ancient relic pages.
 */

class DoctorStrangeGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'doctorstrange';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.health = 100;

    this.player = {
      x: 100,
      y: 120,
      vx: 180,
      vy: 0,
      radius: 16
    };

    this.gravity = 500;

    // Portals
    this.portalOrange = null; // { x, y, dir: 'UP'|'RIGHT'|'DOWN'|'LEFT' }
    this.portalBlue = null;
    this.nextPortalColor = 'ORANGE'; // Alternates on click
    this.cooldown = 0;

    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.health });
  }

  initStage(st) {
    this.stage = st;
    this.player.x = 80;
    this.player.y = 120;
    this.player.vx = 160;
    this.player.vy = 0;
    this.portalOrange = null;
    this.portalBlue = null;

    this.platforms = [
      { x: 40, y: 160, w: 140, h: 20 },
      { x: 300, y: 260, w: 140, h: 20 },
      { x: 600, y: 380, w: 140, h: 20 },
      { x: 780, y: 180, w: 140, h: 20 }
    ];

    if (st === 2) {
      this.platforms.push({ x: 200, y: 440, w: 120, h: 20 });
      this.platforms.push({ x: 500, y: 140, w: 100, h: 20 });
    } else if (st === 3) {
      this.platforms.push({ x: 400, y: 480, w: 180, h: 20 });
    }

    // Book Pages
    this.pages = [
      { x: 370, y: 220, collected: false },
      { x: 670, y: 340, collected: false },
      { x: 850, y: 140, collected: false }
    ];

    this.sanctumGate = { x: 860, y: 110, open: false };

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'SHATTERED SANCTUM' : st === 2 ? 'VERTICAL ABYSS' : 'MIRROR CORE FOLD'}`);
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;

    if (this.nextPortalColor === 'ORANGE') {
      this.portalOrange = { x, y, radius: 26 };
      this.nextPortalColor = 'BLUE';
    } else {
      this.portalBlue = { x, y, radius: 26 };
      this.nextPortalColor = 'ORANGE';
    }

    if (window.soundFX) window.soundFX.portal();
    this.spawnComicText('PORTAL!', x, y - 20, '#ff9100');
    this.shake(3, 0.1);
  }

  update(dt) {
    // Air control (A/D or Arrows)
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.player.vx -= 400 * dt;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.player.vx += 400 * dt;

    // Gravity
    this.player.vy += this.gravity * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Platform collisions
    for (const p of this.platforms) {
      if (
        this.player.x + this.player.radius > p.x &&
        this.player.x - this.player.radius < p.x + p.w &&
        this.player.y + this.player.radius > p.y &&
        this.player.y - this.player.radius < p.y + p.h
      ) {
        if (this.player.vy > 0 && this.player.y < p.y + 15) {
          this.player.y = p.y - this.player.radius;
          this.player.vy = -180; // bounce lightly
        }
      }
    }

    // Portal Teleportation
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    } else if (this.portalOrange && this.portalBlue) {
      const dOrange = Math.hypot(this.player.x - this.portalOrange.x, this.player.y - this.portalOrange.y);
      const dBlue = Math.hypot(this.player.x - this.portalBlue.x, this.player.y - this.portalBlue.y);

      if (dOrange < this.portalOrange.radius + this.player.radius) {
        // Teleport Orange -> Blue with upward momentum boost
        this.player.x = this.portalBlue.x;
        this.player.y = this.portalBlue.y - 30;
        this.player.vy = -Math.abs(this.player.vy) - 150;
        this.cooldown = 0.4;
        if (window.soundFX) window.soundFX.portal();
        this.spawnComicText('TELEPORT!', this.player.x, this.player.y - 20, '#00f0ff');
      } else if (dBlue < this.portalBlue.radius + this.player.radius) {
        // Teleport Blue -> Orange
        this.player.x = this.portalOrange.x;
        this.player.y = this.portalOrange.y - 30;
        this.player.vy = -Math.abs(this.player.vy) - 150;
        this.cooldown = 0.4;
        if (window.soundFX) window.soundFX.portal();
        this.spawnComicText('TELEPORT!', this.player.x, this.player.y - 20, '#ff9100');
      }
    }

    // Collect Book Pages
    for (const pg of this.pages) {
      if (!pg.collected && Math.hypot(this.player.x - pg.x, this.player.y - pg.y) < 30) {
        pg.collected = true;
        this.score += 250;
        this.setHUD({ score: this.score });
        if (window.soundFX) window.soundFX.thwip();
      }
    }

    // Check all pages collected
    const allCollected = this.pages.every(p => p.collected);
    if (allCollected) {
      this.sanctumGate.open = true;
    }

    // Fall out of bounds / Abyss check
    if (this.player.y > this.vHeight + 20) {
      this.health -= 35;
      this.player.x = 80;
      this.player.y = 120;
      this.player.vx = 160;
      this.player.vy = 0;
      this.shake(8, 0.25);
      if (window.soundFX) window.soundFX.hit();
      this.setHUD({ health: this.health });
      if (this.health <= 0) {
        this.triggerGameOver('Doctor Strange was consumed by the Mirror Dimension abyss!');
        return;
      }
    }

    // Win Stage Check
    if (this.sanctumGate.open && Math.hypot(this.player.x - this.sanctumGate.x, this.player.y - this.sanctumGate.y) < 40) {
      if (this.stage < this.maxStages) {
        this.score += 750;
        this.initStage(this.stage + 1);
      } else {
        this.score += 2500;
        this.triggerVictory('Doctor Strange retrieved the Book of Cagliostro and sealed the rift!');
      }
    }
  }

  render(ctx) {
    // Kaleidoscopic Shattered Background
    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Shattered mirror triangles
    ctx.strokeStyle = 'rgba(155, 81, 224, 0.15)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      const x = (i * 95) % this.vWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 100, this.vHeight);
      ctx.lineTo(x - 50, this.vHeight);
      ctx.closePath();
      ctx.stroke();
    }

    // Render Platforms
    ctx.fillStyle = '#1c2438';
    for (const p of this.platforms) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#394b73';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // Render Book Pages
    for (const pg of this.pages) {
      if (!pg.collected) {
        ctx.save();
        ctx.fillStyle = '#ffd200';
        ctx.shadowColor = '#ffd200';
        ctx.shadowBlur = 10;
        ctx.fillRect(pg.x - 10, pg.y - 14, 20, 28);
        ctx.fillStyle = '#000';
        ctx.font = "bold 12px 'Bangers'";
        ctx.fillText('📖', pg.x - 7, pg.y + 6);
        ctx.restore();
      }
    }

    // Render Sanctum Gate
    ctx.save();
    ctx.strokeStyle = this.sanctumGate.open ? '#00e676' : '#757575';
    ctx.lineWidth = 4;
    ctx.shadowColor = this.sanctumGate.open ? '#00e676' : 'transparent';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.sanctumGate.x, this.sanctumGate.y, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = "bold 12px 'Bangers'";
    ctx.fillText(this.sanctumGate.open ? 'EXIT' : 'LOCKED', this.sanctumGate.x - 14, this.sanctumGate.y + 4);
    ctx.restore();

    // Render Portals
    if (this.portalOrange) {
      ctx.save();
      ctx.strokeStyle = '#ff9100';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff9100';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(this.portalOrange.x, this.portalOrange.y, 16, 26, Date.now() * 0.005, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.portalBlue) {
      ctx.save();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(this.portalBlue.x, this.portalBlue.y, 16, 26, -Date.now() * 0.005, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Doctor Strange
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Crimson Cloak of Levitation
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(12, -8);
    ctx.lineTo(18, 22);
    ctx.lineTo(-18, 22);
    ctx.closePath();
    ctx.fill();

    // Blue Robes
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye of Agamotto amulet
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.arc(0, 4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Current Portal Placer Hint
    ctx.save();
    ctx.fillStyle = this.nextPortalColor === 'ORANGE' ? '#ff9100' : '#00e5ff';
    ctx.font = "bold 14px 'Bangers', cursive";
    ctx.fillText(`CLICK/TAP TO PLACE: ${this.nextPortalColor} PORTAL`, 20, 520);
    ctx.restore();
  }
}

window.DoctorStrangeGame = DoctorStrangeGame;
