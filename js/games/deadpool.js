/**
 * deadpool.js
 * Game 10: Deadpool - Multiverse Demolition
 * Mechanic: 2D ballistic physics projectile destruction puzzle.
 * Pull back Deadpool's slingshot cannon to launch chaotic multiversal ordnance,
 * toppling Kingpin's dimensional harvest towers in 3 shots or fewer.
 */

class DeadpoolGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'deadpool';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.shotsLeft = 3;

    // Slingshot origin
    this.slingshot = { x: 140, y: 380 };

    // Projectile state
    this.projectile = null;
    this.isAiming = false;
    this.dragPos = { x: 140, y: 380 };

    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: 100 });
  }

  initStage(st) {
    this.stage = st;
    this.shotsLeft = 3;
    this.projectile = null;
    this.isAiming = false;
    this.dragPos = { x: 140, y: 380 };

    // Ground Floor
    this.groundY = 460;

    // Construct the Tower
    this.blocks = [];
    const towerX = 640;

    if (st === 1) {
      // 2 tiers of wood blocks + Kingpin pod
      this.blocks.push({ x: towerX - 30, y: 400, w: 20, h: 60, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX + 30, y: 400, w: 20, h: 60, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX - 45, y: 380, w: 110, h: 20, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX - 20, y: 320, w: 20, h: 60, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX + 20, y: 320, w: 20, h: 60, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX - 35, y: 300, w: 90, h: 20, vx: 0, vy: 0, type: 'wood' });

      // Target Pod (Kingpin)
      this.targetPod = { x: towerX + 10, y: 260, radius: 22, vx: 0, vy: 0, toppled: false };
    } else if (st === 2) {
      // Reinforced steel columns + explosive TNT barrel
      this.blocks.push({ x: towerX - 40, y: 380, w: 25, h: 80, vx: 0, vy: 0, type: 'steel' });
      this.blocks.push({ x: towerX + 40, y: 380, w: 25, h: 80, vx: 0, vy: 0, type: 'steel' });
      this.blocks.push({ x: towerX - 10, y: 410, w: 25, h: 50, vx: 0, vy: 0, type: 'tnt' });
      this.blocks.push({ x: towerX - 55, y: 360, w: 135, h: 20, vx: 0, vy: 0, type: 'steel' });
      this.blocks.push({ x: towerX - 25, y: 280, w: 25, h: 80, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX + 25, y: 280, w: 25, h: 80, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX - 40, y: 260, w: 105, h: 20, vx: 0, vy: 0, type: 'wood' });

      this.targetPod = { x: towerX + 10, y: 220, radius: 24, vx: 0, vy: 0, toppled: false };
    } else {
      // Stage 3: Master Portal Spire
      this.blocks.push({ x: towerX - 60, y: 360, w: 25, h: 100, vx: 0, vy: 0, type: 'steel' });
      this.blocks.push({ x: towerX + 60, y: 360, w: 25, h: 100, vx: 0, vy: 0, type: 'steel' });
      this.blocks.push({ x: towerX - 12, y: 410, w: 24, h: 50, vx: 0, vy: 0, type: 'tnt' });
      this.blocks.push({ x: towerX - 75, y: 340, w: 175, h: 20, vx: 0, vy: 0, type: 'steel' });
      this.blocks.push({ x: towerX - 40, y: 250, w: 25, h: 90, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX + 40, y: 250, w: 25, h: 90, vx: 0, vy: 0, type: 'wood' });
      this.blocks.push({ x: towerX - 50, y: 230, w: 125, h: 20, vx: 0, vy: 0, type: 'steel' });

      this.targetPod = { x: towerX + 10, y: 190, radius: 26, vx: 0, vy: 0, toppled: false };
    }

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'WOODEN SCAFFOLD' : st === 2 ? 'REINFORCED BUNKER' : 'MULTIVERSE SPIRE'}`);
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING' || this.projectile || this.shotsLeft <= 0) return;
    if (Math.hypot(x - this.slingshot.x, y - this.slingshot.y) < 70) {
      this.isAiming = true;
      this.dragPos = { x, y };
    }
  }

  onPointerMove(x, y) {
    if (this.isAiming) {
      // Clamp slingshot drag
      const dx = x - this.slingshot.x;
      const dy = y - this.slingshot.y;
      const dist = Math.min(90, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      this.dragPos = {
        x: this.slingshot.x + Math.cos(angle) * dist,
        y: this.slingshot.y + Math.sin(angle) * dist
      };
    }
  }

  onPointerUp() {
    if (this.isAiming) {
      this.isAiming = false;
      const dx = this.slingshot.x - this.dragPos.x;
      const dy = this.slingshot.y - this.dragPos.y;
      const speed = Math.hypot(dx, dy) * 8.5;

      this.projectile = {
        x: this.slingshot.x,
        y: this.slingshot.y,
        vx: dx * 8.5,
        vy: dy * 8.5,
        radius: 14,
        trail: []
      };

      this.shotsLeft--;
      if (window.soundFX) window.soundFX.thwip();
      this.spawnComicText('MAXIMUM EFFORT!', this.slingshot.x, this.slingshot.y - 30, '#ff1744');
      this.shake(3, 0.15);
    }
  }

  update(dt) {
    const gravity = 600;

    // Update Projectile
    if (this.projectile) {
      this.projectile.vy += gravity * dt;
      this.projectile.x += this.projectile.vx * dt;
      this.projectile.y += this.projectile.vy * dt;

      this.projectile.trail.unshift({ x: this.projectile.x, y: this.projectile.y });
      if (this.projectile.trail.length > 8) this.projectile.trail.pop();

      // Check hit with blocks
      for (const b of this.blocks) {
        if (
          this.projectile.x + this.projectile.radius > b.x &&
          this.projectile.x - this.projectile.radius < b.x + b.w &&
          this.projectile.y + this.projectile.radius > b.y &&
          this.projectile.y - this.projectile.radius < b.y + b.h
        ) {
          // Transfer kinetic energy
          b.vx = this.projectile.vx * 0.4;
          b.vy = this.projectile.vy * 0.3;
          this.projectile.vx *= 0.3;

          this.shake(6, 0.2);
          if (window.soundFX) window.soundFX.hit();

          if (b.type === 'tnt') {
            // Explode TNT!
            this.explodeTNT(b);
          } else {
            this.spawnComicText('WHAM!', b.x, b.y, '#ffd200');
          }
          break;
        }
      }

      // Check hit with Target Pod
      if (Math.hypot(this.projectile.x - this.targetPod.x, this.projectile.y - this.targetPod.y) < this.projectile.radius + this.targetPod.radius) {
        this.targetPod.vx = this.projectile.vx * 0.7;
        this.targetPod.vy = this.projectile.vy * 0.5;
        this.shake(8, 0.3);
        if (window.soundFX) window.soundFX.hit();
        this.spawnComicText('BAM!', this.targetPod.x, this.targetPod.y, '#e23636');
      }

      // Stop projectile if it hits ground or leaves screen
      if (this.projectile.y > this.groundY - 10 || this.projectile.x > this.vWidth + 50) {
        this.projectile = null;
      }
    }

    // Update Blocks Physics
    for (const b of this.blocks) {
      b.vy += gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= 0.96; // friction

      if (b.y + b.h > this.groundY) {
        b.y = this.groundY - b.h;
        b.vy = 0;
      }
    }

    // Update Target Pod Physics
    this.targetPod.vy += gravity * dt;
    this.targetPod.x += this.targetPod.vx * dt;
    this.targetPod.y += this.targetPod.vy * dt;
    this.targetPod.vx *= 0.98;

    if (this.targetPod.y + this.targetPod.radius > this.groundY) {
      this.targetPod.y = this.groundY - this.targetPod.radius;
      this.targetPod.toppled = true;
    }

    // Win condition check: Kingpin pod toppled to ground
    if (this.targetPod.toppled) {
      if (this.stage < this.maxStages) {
        this.score += 1000 + this.shotsLeft * 400;
        this.initStage(this.stage + 1);
        this.setHUD({ score: this.score });
      } else {
        this.score += 3500;
        this.triggerVictory('Deadpool toppled Kingpin’s Multiverse Spire into the Void!');
      }
      return;
    }

    // Loss condition: No shots left and pod still standing
    if (!this.projectile && this.shotsLeft <= 0 && !this.targetPod.toppled) {
      this.triggerGameOver('Out of multiversal ordnance! Kingpin’s Spire still stands.');
    }
  }

  explodeTNT(tntBlock) {
    this.shake(12, 0.4);
    if (window.soundFX) window.soundFX.thunder();
    this.spawnComicText('KRAK-BOOM!', tntBlock.x, tntBlock.y, '#ff1744');

    // Blow adjacent blocks away
    for (const b of this.blocks) {
      const dx = (b.x + b.w / 2) - (tntBlock.x + tntBlock.w / 2);
      const dy = (b.y + b.h / 2) - (tntBlock.y + tntBlock.h / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < 180 && b !== tntBlock) {
        b.vx += (dx / dist) * 450;
        b.vy += (dy / dist) * 450;
      }
    }

    // Also blast target pod
    const podDist = Math.hypot(this.targetPod.x - tntBlock.x, this.targetPod.y - tntBlock.y);
    if (podDist < 200) {
      this.targetPod.vx += 350;
      this.targetPod.vy -= 250;
    }

    tntBlock.y = 9999; // Remove TNT
  }

  render(ctx) {
    // Void wasteland background
    ctx.fillStyle = '#110c14';
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Cosmic ruins in backdrop
    ctx.fillStyle = '#1f1524';
    ctx.fillRect(520, 220, 70, 240);
    ctx.fillRect(780, 260, 90, 200);

    // Ground Platform
    ctx.fillStyle = '#2d1b28';
    ctx.fillRect(0, this.groundY, this.vWidth, this.vHeight - this.groundY);
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, this.groundY, this.vWidth, this.vHeight - this.groundY);

    // Render Blocks
    for (const b of this.blocks) {
      if (b.y > 1000) continue;
      ctx.save();
      if (b.type === 'wood') {
        ctx.fillStyle = '#8d6e63';
        ctx.strokeStyle = '#5d4037';
      } else if (b.type === 'steel') {
        ctx.fillStyle = '#78909c';
        ctx.strokeStyle = '#37474f';
      } else if (b.type === 'tnt') {
        ctx.fillStyle = '#d50000';
        ctx.strokeStyle = '#ffd200';
      }
      ctx.lineWidth = 2;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      if (b.type === 'tnt') {
        ctx.fillStyle = '#ffd200';
        ctx.font = "bold 10px 'Bangers'";
        ctx.fillText('TNT', b.x + 3, b.y + 25);
      }
      ctx.restore();
    }

    // Render Target Pod (Multiversal Kingpin)
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.targetPod.x, this.targetPod.y, this.targetPod.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d50000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = "bold 11px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText('KINGPIN', this.targetPod.x, this.targetPod.y + 4);
    ctx.restore();

    // Render Slingshot bands & Deadpool
    ctx.save();
    // Slingshot frame
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.slingshot.x - 12, this.slingshot.y);
    ctx.lineTo(this.slingshot.x - 12, this.slingshot.y + 50);
    ctx.moveTo(this.slingshot.x + 12, this.slingshot.y);
    ctx.lineTo(this.slingshot.x + 12, this.slingshot.y + 50);
    ctx.stroke();

    // Elastic rubber bands
    if (this.isAiming) {
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.slingshot.x - 12, this.slingshot.y);
      ctx.lineTo(this.dragPos.x, this.dragPos.y);
      ctx.lineTo(this.slingshot.x + 12, this.slingshot.y);
      ctx.stroke();

      // Projectile in pocket
      ctx.fillStyle = '#d50000';
      ctx.beginPath();
      ctx.arc(this.dragPos.x, this.dragPos.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Deadpool silhouette standing by slingshot
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.arc(90, 420, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(80, 412, 8, 4);
    ctx.fillRect(92, 412, 8, 4);
    ctx.restore();

    // Render Flying Projectile
    if (this.projectile) {
      ctx.save();
      ctx.fillStyle = '#d50000';
      ctx.beginPath();
      ctx.arc(this.projectile.x, this.projectile.y, this.projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Shots Remaining Indicator
    ctx.save();
    ctx.fillStyle = '#ffd200';
    ctx.font = "bold 18px 'Bangers', cursive";
    ctx.fillText(`ORDNANCE SHOTS: ${this.shotsLeft}`, 30, 520);
    ctx.font = "bold 12px 'Outfit'";
    ctx.fillStyle = '#aaa';
    ctx.fillText('DRAG BACK ON SLINGSHOT TO AIM & FIRE', 200, 520);
    ctx.restore();
  }
}

window.DeadpoolGame = DeadpoolGame;
