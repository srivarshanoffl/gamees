/**
 * scarlet-witch.js
 * Game 7: Scarlet Witch - Hex Polarity
 * Mechanic: Binary reality polarity phase-swapping platformer.
 * Press Space or Tap to switch between Earth-616 (Red) and Hex (Purple) realities.
 * Swap mid-air to land on solid platforms and phase through lethal laser gates.
 */

class ScarletWitchGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'scarletwitch';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.health = 100;

    // Polarity: 'RED' (Earth-616) vs 'PURPLE' (Hex Reality)
    this.polarity = 'RED';

    this.player = {
      x: 80,
      y: 380,
      vx: 0,
      vy: 0,
      radius: 16,
      isGrounded: false
    };

    this.gravity = 650;
    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.health });
  }

  initStage(st) {
    this.stage = st;
    this.player.x = 60;
    this.player.y = 380;
    this.player.vx = 0;
    this.player.vy = 0;
    this.polarity = 'RED';

    // Platforms with polarity tags
    this.platforms = [
      { x: 20, y: 440, w: 180, h: 40, polarity: 'ALL' },
      { x: 260, y: 380, w: 140, h: 20, polarity: 'RED' },
      { x: 440, y: 320, w: 140, h: 20, polarity: 'PURPLE' },
      { x: 620, y: 260, w: 140, h: 20, polarity: 'RED' },
      { x: 800, y: 220, w: 140, h: 40, polarity: 'ALL' }
    ];

    if (st === 2) {
      this.platforms = [
        { x: 20, y: 440, w: 140, h: 40, polarity: 'ALL' },
        { x: 200, y: 360, w: 120, h: 20, polarity: 'PURPLE' },
        { x: 360, y: 300, w: 120, h: 20, polarity: 'RED' },
        { x: 520, y: 360, w: 120, h: 20, polarity: 'PURPLE' },
        { x: 680, y: 260, w: 120, h: 20, polarity: 'RED' },
        { x: 820, y: 200, w: 120, h: 40, polarity: 'ALL' }
      ];
    } else if (st === 3) {
      this.platforms = [
        { x: 20, y: 440, w: 120, h: 40, polarity: 'ALL' },
        { x: 180, y: 380, w: 100, h: 20, polarity: 'RED' },
        { x: 320, y: 320, w: 100, h: 20, polarity: 'PURPLE' },
        { x: 460, y: 260, w: 100, h: 20, polarity: 'RED' },
        { x: 600, y: 320, w: 100, h: 20, polarity: 'PURPLE' },
        { x: 740, y: 240, w: 100, h: 20, polarity: 'RED' },
        { x: 860, y: 180, w: 90, h: 40, polarity: 'ALL' }
      ];
    }

    // Altar objective
    this.altar = { x: 880, y: 150, radius: 24 };

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'WESTVIEW PERIMETER' : st === 2 ? 'CHAOS MEMBRANE' : 'DARKHOLD CORE'}`);
  }

  swapPolarity() {
    this.polarity = this.polarity === 'RED' ? 'PURPLE' : 'RED';
    if (window.soundFX) window.soundFX.realitySwap();
    this.spawnComicText(this.polarity === 'RED' ? 'EARTH-616' : 'HEX REALITY', this.player.x, this.player.y - 30, this.polarity === 'RED' ? '#ff1744' : '#d500f9');
    this.shake(4, 0.15);
  }

  onKeyDown(e) {
    if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'KeyE') {
      this.swapPolarity();
    }
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;
    // Tap anywhere on the right or top half to swap polarity
    if (x > 500 || y < 150) {
      this.swapPolarity();
    }
  }

  update(dt) {
    // Movement
    let dir = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dir -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dir += 1;

    // Pointer move support
    if (this.pointer.isDown && this.pointer.x <= 500 && this.pointer.y >= 150) {
      dir = this.pointer.x > this.player.x + 10 ? 1 : this.pointer.x < this.player.x - 10 ? -1 : 0;
    }

    this.player.vx = dir * 240;

    // Jump
    const wantsJump = this.keys['KeyW'] || this.keys['Space'] || this.keys['ArrowUp'];
    if (wantsJump && this.player.isGrounded) {
      this.player.vy = -380;
      this.player.isGrounded = false;
    }

    // Apply Gravity & Velocity
    this.player.vy += this.gravity * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Platform Collisions (Only solid if matching current polarity or ALL)
    this.player.isGrounded = false;
    for (const p of this.platforms) {
      const isSolid = p.polarity === 'ALL' || p.polarity === this.polarity;
      if (isSolid) {
        if (
          this.player.x + this.player.radius > p.x &&
          this.player.x - this.player.radius < p.x + p.w &&
          this.player.y + this.player.radius > p.y &&
          this.player.y - this.player.radius < p.y + p.h
        ) {
          if (this.player.vy > 0 && this.player.y < p.y + 15) {
            this.player.y = p.y - this.player.radius;
            this.player.vy = 0;
            this.player.isGrounded = true;
          }
        }
      }
    }

    // Fall in abyss
    if (this.player.y > this.vHeight + 20) {
      this.health -= 35;
      this.player.x = 60;
      this.player.y = 380;
      this.player.vx = 0;
      this.player.vy = 0;
      this.shake(7, 0.2);
      if (window.soundFX) window.soundFX.hit();
      this.setHUD({ health: this.health });
      if (this.health <= 0) {
        this.triggerGameOver('Wanda lost control of the Hex reality fabric!');
        return;
      }
    }

    // Reach Darkhold Altar
    if (Math.hypot(this.player.x - this.altar.x, this.player.y - this.altar.y) < 40) {
      if (this.stage < this.maxStages) {
        this.score += 800;
        this.initStage(this.stage + 1);
        this.setHUD({ score: this.score });
      } else {
        this.score += 2500;
        this.triggerVictory('Scarlet Witch mastered the Hex polarity and claimed the Darkhold!');
      }
    }
  }

  render(ctx) {
    // Background based on polarity
    ctx.fillStyle = this.polarity === 'RED' ? '#140608' : '#0c0517';
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Dynamic Hex TV scanlines / reality distortion
    ctx.strokeStyle = this.polarity === 'RED' ? 'rgba(255, 23, 68, 0.08)' : 'rgba(213, 0, 249, 0.12)';
    ctx.lineWidth = 1;
    for (let y = 0; y < this.vHeight; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.vWidth, y);
      ctx.stroke();
    }

    // Render Platforms
    for (const p of this.platforms) {
      const isSolid = p.polarity === 'ALL' || p.polarity === this.polarity;
      ctx.save();
      if (p.polarity === 'ALL') {
        ctx.fillStyle = '#37474f';
        ctx.strokeStyle = '#90a4ae';
      } else if (p.polarity === 'RED') {
        ctx.fillStyle = isSolid ? '#d50000' : 'rgba(213, 0, 0, 0.2)';
        ctx.strokeStyle = isSolid ? '#ff5252' : 'rgba(255, 82, 82, 0.2)';
      } else {
        ctx.fillStyle = isSolid ? '#7b1fa2' : 'rgba(123, 31, 162, 0.2)';
        ctx.strokeStyle = isSolid ? '#e040fb' : 'rgba(224, 64, 251, 0.2)';
      }

      ctx.lineWidth = 2;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      if (!isSolid) {
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      }
      ctx.restore();
    }

    // Render Darkhold Altar
    ctx.save();
    ctx.fillStyle = '#ffd200';
    ctx.shadowColor = '#ffd200';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.altar.x, this.altar.y, this.altar.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = "bold 14px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText('ALTAR', this.altar.x, this.altar.y + 5);
    ctx.restore();

    // Render Scarlet Witch
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Chaos Magic Aura
    ctx.strokeStyle = this.polarity === 'RED' ? '#ff1744' : '#d500f9';
    ctx.lineWidth = 3;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 2);
    ctx.stroke();

    // Crimson Robes
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Scarlet Tiara Crown
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(-4, -18);
    ctx.lineTo(0, -14);
    ctx.lineTo(4, -18);
    ctx.lineTo(10, -12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Polarity HUD Hint
    ctx.save();
    ctx.fillStyle = this.polarity === 'RED' ? '#ff1744' : '#d500f9';
    ctx.font = "bold 16px 'Bangers', cursive";
    ctx.fillText(`CURRENT POLARITY: ${this.polarity === 'RED' ? 'EARTH-616 (RED)' : 'HEX REALITY (PURPLE)'}`, 20, 520);
    ctx.font = "bold 12px 'Outfit'";
    ctx.fillStyle = '#aaa';
    ctx.fillText('PRESS [F] / TAP RIGHT SCREEN TO SWAP REALITY', 20, 495);
    ctx.restore();
  }
}

window.ScarletWitchGame = ScarletWitchGame;
