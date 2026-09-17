/**
 * ant-man.js
 * Game 5: Ant-Man - Quantum Heist
 * Mechanic: Instantaneous dual-scale size & mass switching stealth puzzle.
 * Toggle between Micro-Size (fits into vents, dodges lasers) and Giant-Man
 * (smashes barriers, depresses heavy floor switches) to breach Yellowjacket's vault.
 */

class AntManGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'antman';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.health = 100;
    this.currentScale = 'NORMAL';

    this.player = {
      x: 80,
      y: 400,
      vx: 0,
      vy: 0,
      isGrounded: false
    };

    this.gravity = 650;
    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.health });
  }

  initStage(st) {
    this.stage = st;
    this.player.x = 60;
    this.player.y = 400;
    this.player.vx = 0;
    this.player.vy = 0;
    this.currentScale = 'NORMAL';

    // Clean reset of all arrays
    this.platforms = [
      { x: 0, y: 460, w: 960, h: 80 } // Floor
    ];
    this.lasers = [];
    this.fans = [];
    this.switches = [];
    this.breakables = [];

    if (st === 1) {
      this.platforms.push({ x: 260, y: 340, w: 20, h: 120 });
      this.breakables.push({ x: 540, y: 360, w: 30, h: 100, hp: 1 });
      this.switches.push({ x: 740, y: 450, w: 40, h: 10, pressed: false, opens: 'vaultDoor' });
      this.vault = { x: 880, y: 360, w: 40, h: 100, open: false };
    } else if (st === 2) {
      this.platforms.push({ x: 200, y: 360, w: 160, h: 20 });
      this.lasers.push({ x: 420, y: 200, w: 8, h: 260, highOnly: true });
      this.fans.push({ x: 180, y: 400, w: 40, h: 60, blowX: 280 });
      this.breakables.push({ x: 640, y: 360, w: 30, h: 100, hp: 2 });
      this.switches.push({ x: 760, y: 450, w: 40, h: 10, pressed: false, opens: 'vaultDoor' });
      this.vault = { x: 890, y: 360, w: 40, h: 100, open: false };
    } else {
      this.lasers.push({ x: 280, y: 220, w: 8, h: 240, highOnly: true });
      this.lasers.push({ x: 560, y: 220, w: 8, h: 240, highOnly: true });
      this.breakables.push({ x: 400, y: 360, w: 30, h: 100, hp: 2 });
      this.breakables.push({ x: 700, y: 360, w: 30, h: 100, hp: 3 });
      this.switches.push({ x: 800, y: 450, w: 40, h: 10, pressed: false, opens: 'vaultDoor' });
      this.vault = { x: 900, y: 360, w: 40, h: 100, open: false };
    }

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'PYM LAB VENTS' : st === 2 ? 'LASER EXHAUST TUNNEL' : 'QUANTUM CORE VAULT'}`);
  }

  toggleScale() {
    if (this.currentScale === 'NORMAL') this.currentScale = 'MICRO';
    else if (this.currentScale === 'MICRO') this.currentScale = 'GIANT';
    else this.currentScale = 'NORMAL';

    const isGrow = this.currentScale === 'GIANT';
    if (window.soundFX) window.soundFX.quantumShift(isGrow);
    this.spawnComicText(this.currentScale, this.player.x, this.player.y - 30, isGrow ? '#ff1744' : '#00f0ff');
    this.shake(isGrow ? 5 : 2, 0.15);
  }

  onKeyDown(e) {
    if (e.code === 'KeyQ' || e.code === 'ShiftLeft' || e.code === 'KeyE') {
      this.toggleScale();
    }
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;
    if (y < 200 || x > 840) {
      this.toggleScale();
    }
  }

  getPlayerRadius() {
    return this.currentScale === 'MICRO' ? 7 : this.currentScale === 'GIANT' ? 34 : 16;
  }

  update(dt) {
    const r = this.getPlayerRadius();

    let moveDir = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir += 1;

    if (this.pointer.isDown && this.pointer.y >= 200 && this.pointer.x < 840) {
      moveDir = this.pointer.x > this.player.x + 10 ? 1 : this.pointer.x < this.player.x - 10 ? -1 : 0;
    }

    const moveSpeed = this.currentScale === 'MICRO' ? 300 : this.currentScale === 'GIANT' ? 140 : 220;
    this.player.vx = moveDir * moveSpeed;

    const wantsJump = this.keys['KeyW'] || this.keys['Space'] || this.keys['ArrowUp'];
    if (wantsJump && this.player.isGrounded) {
      this.player.vy = this.currentScale === 'MICRO' ? -380 : this.currentScale === 'GIANT' ? -280 : -340;
      this.player.isGrounded = false;
    }

    for (const f of this.fans) {
      if (Math.abs(this.player.y - f.y) < 50 && this.player.x >= f.x && this.player.x <= f.x + 220) {
        if (this.currentScale === 'MICRO') {
          this.player.vx += f.blowX;
        }
      }
    }

    this.player.vy += this.gravity * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    this.player.isGrounded = false;
    for (const p of this.platforms) {
      if (
        this.player.x + r > p.x &&
        this.player.x - r < p.x + p.w &&
        this.player.y + r > p.y &&
        this.player.y - r < p.y + p.h
      ) {
        if (this.player.vy > 0 && this.player.y < p.y + 20) {
          this.player.y = p.y - r;
          this.player.vy = 0;
          this.player.isGrounded = true;
        } else if (this.player.vx > 0) {
          this.player.x = p.x - r;
        } else if (this.player.vx < 0) {
          this.player.x = p.x + p.w + r;
        }
      }
    }

    for (let i = this.breakables.length - 1; i >= 0; i--) {
      const b = this.breakables[i];
      if (
        this.player.x + r > b.x &&
        this.player.x - r < b.x + b.w &&
        this.player.y + r > b.y &&
        this.player.y - r < b.y + b.h
      ) {
        if (this.currentScale === 'GIANT') {
          b.hp--;
          this.shake(8, 0.25);
          if (window.soundFX) window.soundFX.hit();
          this.spawnComicText('SMASH!', b.x, b.y, '#ffd200');
          for (let p = 0; p < 10; p++) {
            this.spawnParticle(b.x, b.y + 30, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160, '#78909c', 4);
          }
          if (b.hp <= 0) this.breakables.splice(i, 1);
        } else {
          this.player.x = (this.player.vx > 0) ? b.x - r : b.x + b.w + r;
        }
      }
    }

    for (const l of this.lasers) {
      if (Math.abs(this.player.x - l.x) < r + 4) {
        if (l.highOnly && this.currentScale === 'MICRO') {
          // Safe under laser
        } else {
          this.health -= 35;
          this.shake(8, 0.3);
          if (window.soundFX) window.soundFX.hit();
          this.spawnComicText('ZAP!', this.player.x, this.player.y, '#e23636');
          this.player.x -= 80;
          this.setHUD({ health: this.health });
          if (this.health <= 0) {
            this.triggerGameOver('Ant-Man tripped the security laser alarms!');
            return;
          }
        }
      }
    }

    for (const s of this.switches) {
      if (Math.abs(this.player.x - s.x) < 35 && Math.abs(this.player.y - s.y) < 40) {
        if (this.currentScale === 'GIANT') {
          s.pressed = true;
          this.vault.open = true;
          this.spawnComicText('UNLOCKED!', s.x, s.y - 20, '#00e676');
        }
      }
    }

    if (this.vault.open && this.player.x >= this.vault.x) {
      if (this.stage < this.maxStages) {
        this.score += 800;
        this.initStage(this.stage + 1);
        this.setHUD({ score: this.score });
      } else {
        this.score += 2500;
        this.triggerVictory('Ant-Man acquired the Quantum Core and vanished into the micro-realm!');
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#10141f';
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let x = 60; x < this.vWidth; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.vHeight);
      ctx.stroke();
    }

    ctx.fillStyle = '#21293d';
    for (const p of this.platforms) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#344263';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    for (const b of this.breakables) {
      ctx.fillStyle = '#546e7a';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#b0bec5';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      ctx.fillStyle = '#ffd200';
      ctx.font = "bold 12px 'Bangers', cursive";
      ctx.fillText('CRUSH', b.x - 2, b.y + 40);
    }

    for (const l of this.lasers) {
      ctx.save();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x, l.y + l.h);
      ctx.stroke();
      ctx.restore();
    }

    for (const s of this.switches) {
      ctx.fillStyle = s.pressed ? '#00e676' : '#ff9100';
      ctx.fillRect(s.x - 20, s.y - (s.pressed ? 2 : 10), 40, s.pressed ? 4 : 10);
      ctx.fillStyle = '#fff';
      ctx.font = "bold 11px 'Outfit'";
      ctx.textAlign = 'center';
      ctx.fillText(s.pressed ? 'ON' : 'HEAVY', s.x, s.y - 14);
    }

    ctx.save();
    ctx.fillStyle = this.vault.open ? 'rgba(0, 230, 118, 0.4)' : '#37474f';
    ctx.fillRect(this.vault.x, this.vault.y, this.vault.w, this.vault.h);
    ctx.strokeStyle = this.vault.open ? '#00e676' : '#78909c';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.vault.x, this.vault.y, this.vault.w, this.vault.h);
    ctx.fillStyle = '#fff';
    ctx.font = "bold 14px 'Bangers', cursive";
    ctx.fillText(this.vault.open ? 'OPEN' : 'LOCKED', this.vault.x - 2, this.vault.y + 50);
    ctx.restore();

    const r = this.getPlayerRadius();
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (r >= 14) {
      ctx.fillStyle = '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 6;
      ctx.fillRect(-r * 0.4, -r * 0.2, r * 0.3, r * 0.3);
      ctx.fillRect(r * 0.1, -r * 0.2, r * 0.3, r * 0.3);
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(720, 20, 220, 40);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(720, 20, 220, 40);
    ctx.fillStyle = '#ffd200';
    ctx.font = "bold 16px 'Bangers', cursive";
    ctx.fillText(`CURRENT SCALE: ${this.currentScale}`, 735, 45);
    ctx.font = "bold 11px 'Outfit'";
    ctx.fillStyle = '#aaa';
    ctx.fillText('PRESS [Q] / TAP SCREEN TO RESIZE', 735, 68);
    ctx.restore();
  }
}

window.AntManGame = AntManGame;
