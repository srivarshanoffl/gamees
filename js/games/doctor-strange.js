/**
 * doctor-strange.js
 * Game 6: Doctor Strange - Mirror Portals (Deluxe Arcade Edition)
 * Mechanics:
 * - Dual linked Sling Ring portal placement with kinetic momentum conservation & catapult physics.
 * - Procedural Sorcerer Supreme: Cloak of Levitation cloth physics, glowing Eye of Agamotto, Tao Mandalas.
 * - Dynamic Eldritch Portals with rotating spark embers and dimensional vortex suction.
 * - Mystical Relic Pages of Cagliostro, Sanctum Gate, and Mirror Dimension fractured reality shards.
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
      radius: 18,
      facing: 1
    };

    this.gravity = 520;
    this.portalOrange = null;
    this.portalBlue = null;
    this.nextPortalColor = 'ORANGE';
    this.cooldown = 0;
    this.particles = [];

    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.health });
  }

  initStage(st) {
    this.stage = st;
    this.player.x = 80;
    this.player.y = 120;
    this.player.vx = 170;
    this.player.vy = 0;
    this.portalOrange = null;
    this.portalBlue = null;
    this.nextPortalColor = 'ORANGE';
    this.cooldown = 0;
    this.particles = [];

    // Stage Platforms
    if (st === 1) {
      this.platforms = [
        { x: 30, y: 160, w: 150, h: 22 },
        { x: 320, y: 260, w: 140, h: 22 },
        { x: 620, y: 380, w: 140, h: 22 },
        { x: 790, y: 180, w: 140, h: 22 }
      ];
    } else if (st === 2) {
      this.platforms = [
        { x: 30, y: 160, w: 140, h: 22 },
        { x: 220, y: 440, w: 130, h: 22 },
        { x: 520, y: 150, w: 110, h: 22 },
        { x: 790, y: 180, w: 140, h: 22 }
      ];
    } else {
      this.platforms = [
        { x: 30, y: 160, w: 130, h: 22 },
        { x: 420, y: 470, w: 170, h: 22 },
        { x: 790, y: 180, w: 140, h: 22 }
      ];
    }

    // Ancient Relic Pages of Cagliostro
    this.pages = [
      { x: 390, y: 215, collected: false, rune: 'ᚲ' },
      { x: 690, y: 335, collected: false, rune: 'ᛗ' },
      { x: 860, y: 135, collected: false, rune: 'ᛋ' }
    ];

    // Sanctum Sanctorum Gateway
    this.sanctumGate = { x: 870, y: 105, radius: 32, open: false };

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'SHATTERED SANCTUM' : st === 2 ? 'VERTICAL ABYSS' : 'MIRROR CORE FOLD'}`);
  }

  onKeyDown(e) {
    if (e.code === 'KeyQ' || e.code === 'Digit1') {
      this.nextPortalColor = 'ORANGE';
      if (window.soundFX) window.soundFX.shieldBounce();
    } else if (e.code === 'KeyE' || e.code === 'Digit2') {
      this.nextPortalColor = 'BLUE';
      if (window.soundFX) window.soundFX.shieldBounce();
    } else if (e.code === 'KeyR') {
      this.portalOrange = null;
      this.portalBlue = null;
      this.nextPortalColor = 'ORANGE';
      this.spawnComicText('PORTALS CLEARED!', this.player.x, this.player.y - 30, '#ffd200');
      if (window.soundFX) window.soundFX.shieldBounce();
    }
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;

    if (this.nextPortalColor === 'ORANGE') {
      this.portalOrange = { x, y, radius: 30, angle: 0 };
      this.nextPortalColor = 'BLUE';
      this.spawnPortalFX(x, y, '#ff9100');
    } else {
      this.portalBlue = { x, y, radius: 30, angle: 0 };
      this.nextPortalColor = 'ORANGE';
      this.spawnPortalFX(x, y, '#00e5ff');
    }

    if (window.soundFX) {
      if (window.soundFX.portalWarp) window.soundFX.portalWarp();
      else window.soundFX.portal();
    }

    this.spawnComicText('SLING RING!', x, y - 25, this.nextPortalColor === 'BLUE' ? '#ff9100' : '#00e5ff');
    this.shake(4, 0.12);
  }

  spawnPortalFX(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      this.particles.push({
        x: x + Math.cos(angle) * 28,
        y: y + Math.sin(angle) * 28,
        vx: Math.cos(angle + Math.PI / 2) * 80 + (Math.random() - 0.5) * 40,
        vy: Math.sin(angle + Math.PI / 2) * 80 + (Math.random() - 0.5) * 40,
        radius: 2 + Math.random() * 2.5,
        color: color,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0
      });
    }
  }

  update(dt) {
    // Air drift controls
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.player.vx -= 450 * dt;
      this.player.facing = -1;
    }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.player.vx += 450 * dt;
      this.player.facing = 1;
    }

    this.player.vy += this.gravity * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Platform Collisions
    for (const p of this.platforms) {
      if (
        this.player.x + this.player.radius > p.x &&
        this.player.x - this.player.radius < p.x + p.w &&
        this.player.y + this.player.radius > p.y &&
        this.player.y - this.player.radius < p.y + p.h
      ) {
        if (this.player.vy > 0 && this.player.y < p.y + 16) {
          this.player.y = p.y - this.player.radius;
          this.player.vy = -170; // Springy levitation bounce
          if (window.soundFX) window.soundFX.shieldBounce();
        }
      }
    }

    // Portal Momentum Teleportation Physics
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    } else if (this.portalOrange && this.portalBlue) {
      const dOrange = Math.hypot(this.player.x - this.portalOrange.x, this.player.y - this.portalOrange.y);
      const dBlue = Math.hypot(this.player.x - this.portalBlue.x, this.player.y - this.portalBlue.y);

      if (dOrange < this.portalOrange.radius + this.player.radius) {
        // Teleport from Orange to Blue with kinetic catapult boost!
        this.player.x = this.portalBlue.x;
        this.player.y = this.portalBlue.y - 35;
        const currentSpeed = Math.hypot(this.player.vx, this.player.vy);
        const catapultSpeed = Math.max(480, currentSpeed * 1.25);
        this.player.vy = -catapultSpeed;
        this.cooldown = 0.45;

        if (window.soundFX) {
          if (window.soundFX.portalWarp) window.soundFX.portalWarp();
          else window.soundFX.portal();
        }
        this.spawnPortalFX(this.portalBlue.x, this.portalBlue.y, '#00e5ff');
        this.spawnComicText('MIND WARP!', this.player.x, this.player.y - 30, '#00e5ff');
        this.shake(8, 0.25);
      } else if (dBlue < this.portalBlue.radius + this.player.radius) {
        // Teleport from Blue to Orange with kinetic catapult boost!
        this.player.x = this.portalOrange.x;
        this.player.y = this.portalOrange.y - 35;
        const currentSpeed = Math.hypot(this.player.vx, this.player.vy);
        const catapultSpeed = Math.max(480, currentSpeed * 1.25);
        this.player.vy = -catapultSpeed;
        this.cooldown = 0.45;

        if (window.soundFX) {
          if (window.soundFX.portalWarp) window.soundFX.portalWarp();
          else window.soundFX.portal();
        }
        this.spawnPortalFX(this.portalOrange.x, this.portalOrange.y, '#ff9100');
        this.spawnComicText('BY THE VISHANTI!', this.player.x, this.player.y - 30, '#ff9100');
        this.shake(8, 0.25);
      }
    }

    // Collect Relic Pages
    for (const pg of this.pages) {
      if (!pg.collected && Math.hypot(this.player.x - pg.x, this.player.y - pg.y) < 36) {
        pg.collected = true;
        this.score += 350;
        this.setHUD({ score: this.score });
        if (window.soundFX) window.soundFX.collect();
        this.spawnComicText('+350 RELIC', pg.x, pg.y - 20, '#ffd200');
        this.spawnPortalFX(pg.x, pg.y, '#ffd200');
      }
    }

    // Gate opens when all pages collected
    const allCollected = this.pages.every(p => p.collected);
    if (allCollected && !this.sanctumGate.open) {
      this.sanctumGate.open = true;
      this.spawnComicText('SANCTUM UNLOCKED!', this.sanctumGate.x, this.sanctumGate.y - 40, '#00e676');
      if (window.soundFX) window.soundFX.powerUp();
    }

    // Falling into the Abyss
    if (this.player.y > this.vHeight + 25) {
      this.health -= 35;
      this.player.x = 80;
      this.player.y = 120;
      this.player.vx = 170;
      this.player.vy = 0;
      this.shake(9, 0.3);
      if (window.soundFX) window.soundFX.hit();
      this.setHUD({ health: this.health });
      if (this.health <= 0) {
        this.triggerGameOver('Doctor Strange was consumed by the Mirror Dimension abyss!');
        return;
      }
    }

    // Enter Sanctum Gate to complete stage
    if (this.sanctumGate.open && Math.hypot(this.player.x - this.sanctumGate.x, this.player.y - this.sanctumGate.y) < 45) {
      if (this.stage < this.maxStages) {
        this.score += 1000;
        this.initStage(this.stage + 1);
      } else {
        this.score += 3500;
        this.triggerVictory('Doctor Strange retrieved the Book of Cagliostro and sealed the Mirror Rift!');
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    // Mirror Dimension Fractured Space Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.vHeight);
    bgGrad.addColorStop(0, '#070914');
    bgGrad.addColorStop(0.5, '#120f26');
    bgGrad.addColorStop(1, '#1b1236');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Fractured Mirror Prisms in Background
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 145, 0, 0.12)';
    ctx.lineWidth = 1.5;
    const t = Date.now() * 0.001;
    for (let i = 0; i < 12; i++) {
      const ox = (i * 90) % this.vWidth;
      const oy = 80 + Math.sin(t + i) * 30;
      ctx.beginPath();
      ctx.moveTo(ox, 0);
      ctx.lineTo(ox + 80, this.vHeight);
      ctx.lineTo(ox - 40, this.vHeight);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // Platforms (Shattered Sanctorum Masonry)
    for (const p of this.platforms) {
      ctx.save();
      const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      pGrad.addColorStop(0, '#2d3752');
      pGrad.addColorStop(1, '#1a2133');
      ctx.fillStyle = pGrad;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Gold filigree edge trim
      ctx.strokeStyle = 'rgba(255, 210, 0, 0.4)';
      ctx.beginPath();
      ctx.moveTo(p.x + 8, p.y + 5);
      ctx.lineTo(p.x + p.w - 8, p.y + 5);
      ctx.stroke();
      ctx.restore();
    }

    // Ancient Relic Pages of Cagliostro
    for (const pg of this.pages) {
      if (!pg.collected) {
        ctx.save();
        const floatY = pg.y + Math.sin(Date.now() * 0.004 + pg.x) * 6;

        // Golden mystic rune glow
        ctx.fillStyle = 'rgba(255, 210, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(pg.x, floatY, 24, 0, Math.PI * 2);
        ctx.fill();

        // Parchment Page
        ctx.fillStyle = '#fff9c4';
        ctx.strokeStyle = '#f57f17';
        ctx.lineWidth = 2;
        ctx.fillRect(pg.x - 12, floatY - 16, 24, 32);
        ctx.strokeRect(pg.x - 12, floatY - 16, 24, 32);

        // Ancient Rune
        ctx.fillStyle = '#b71c1c';
        ctx.font = "bold 16px 'Cinzel', serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pg.rune, pg.x, floatY);
        ctx.restore();
      }
    }

    // Sanctum Sanctorum Gateway (Window of the Worlds)
    ctx.save();
    const g = this.sanctumGate;
    const gateColor = g.open ? '#00e676' : '#757575';
    ctx.strokeStyle = gateColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = gateColor;
    ctx.shadowBlur = g.open ? 20 : 5;

    ctx.beginPath();
    ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Sanctorum Seal Emblem (Interlocking Curves)
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(g.x - 8, g.y, 14, 0, Math.PI * 2);
    ctx.arc(g.x + 8, g.y, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 11px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText(g.open ? 'ENTER GATE' : 'SEALED', g.x, g.y + g.radius + 16);
    ctx.restore();

    // Draw Dynamic Eldritch Portals
    const drawPortal = (portal, color, label) => {
      if (!portal) return;
      ctx.save();
      const pTime = Date.now() * 0.006;

      // Swirling portal vortex interior
      const vGrad = ctx.createRadialGradient(portal.x, portal.y, 4, portal.x, portal.y, portal.radius);
      vGrad.addColorStop(0, '#ffffff');
      vGrad.addColorStop(0.4, color);
      vGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.ellipse(portal.x, portal.y, portal.radius * 0.7, portal.radius * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Fiery Spark Ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(portal.x, portal.y, portal.radius * 0.7, portal.radius * 1.1, pTime, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting Spark Embers
      for (let i = 0; i < 8; i++) {
        const a = pTime * 2 + (i / 8) * Math.PI * 2;
        const rx = portal.x + Math.cos(a) * portal.radius * 0.8;
        const ry = portal.y + Math.sin(a) * portal.radius * 1.15;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = color;
      ctx.font = "bold 11px 'Bangers'";
      ctx.textAlign = 'center';
      ctx.fillText(label, portal.x, portal.y - portal.radius - 8);
      ctx.restore();
    };

    drawPortal(this.portalOrange, '#ff9100', 'ORANGE PORTAL');
    drawPortal(this.portalBlue, '#00e5ff', 'BLUE PORTAL');

    // Render Procedural Doctor Strange Character
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Cloak of Levitation (Fluttering Cape Physics)
    const capeSwing = Math.sin(Date.now() * 0.008) * 6 - (this.player.vx * 0.06);
    ctx.fillStyle = '#b71c1c';
    ctx.strokeStyle = '#d50000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(10, -10);
    ctx.quadraticCurveTo(24 + capeSwing, 12, 18 + capeSwing, 30);
    ctx.lineTo(-18 + capeSwing, 30);
    ctx.quadraticCurveTo(-24 + capeSwing, 12, -10, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High Popped Collar
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(-15, -24);
    ctx.lineTo(-6, -14);
    ctx.lineTo(6, -14);
    ctx.lineTo(15, -24);
    ctx.lineTo(10, -10);
    ctx.fill();

    // Sorcerer Robes (Blue Tunic)
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.ellipse(0, 4, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Sash Belts
    ctx.strokeStyle = '#ffd200';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.lineTo(10, 8);
    ctx.moveTo(-10, 8);
    ctx.lineTo(10, 14);
    ctx.stroke();

    // Eye of Agamotto Medallion (Chest)
    ctx.fillStyle = '#ffd200';
    ctx.shadowColor = '#ffd200';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, -2, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00e676'; // Time stone pupil
    ctx.beginPath();
    ctx.arc(0, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Strange Head
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Dark Hair with Silver Streaks
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(0, -18, 9.5, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfd8dc'; // White streaks
    ctx.fillRect(-8, -18, 3, 4);
    ctx.fillRect(5, -18, 3, 4);

    // Tao Mandala Spark Ring around Hands
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.player.facing * 14, 0, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Portal Status & Hotkeys HUD
    ctx.save();
    ctx.fillStyle = this.nextPortalColor === 'ORANGE' ? '#ff9100' : '#00e5ff';
    ctx.font = "bold 18px 'Bangers', cursive";
    ctx.textAlign = 'left';
    ctx.fillText(`NEXT PORTAL: ${this.nextPortalColor}`, 30, 520);

    ctx.font = "bold 12px 'Outfit'";
    ctx.fillStyle = '#aaa';
    ctx.fillText('CLICK/TAP: PLACE PORTAL • [1/Q]: ORANGE • [2/E]: BLUE • [R]: CLEAR • ARROWS: STEER', 240, 520);
    ctx.restore();
  }
}

window.DoctorStrangeGame = DoctorStrangeGame;
