/**
 * captain-america.js
 * Game 2: Captain America - Shield Ricochet
 * Mechanic: Angular bounce ray-tracing puzzle shooter.
 * Aim the dotted trajectory line and release to ricochet the vibranium shield
 * off titanium walls to neutralize Hydra guards and consoles.
 */

class CaptainAmericaGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'captainamerica';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.throwsLeft = 3;
    this.shield = {
      x: 120,
      y: 270,
      vx: 0,
      vy: 0,
      radius: 14,
      isFlying: false,
      bounces: 0,
      maxBounces: 5,
      trail: []
    };
    this.aimAngle = 0;
    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: 100 });
  }

  initStage(st) {
    this.stage = st;
    this.throwsLeft = 3 + (st === 1 ? 2 : 0);
    this.shield.x = 100;
    this.shield.y = 270;
    this.shield.vx = 0;
    this.shield.vy = 0;
    this.shield.isFlying = false;
    this.shield.bounces = 0;
    this.shield.trail = [];

    // Walls and obstacles
    this.walls = [
      // Outer boundary
      { x: 20, y: 20, w: 920, h: 16 },
      { x: 20, y: 504, w: 920, h: 16 },
      { x: 20, y: 20, w: 16, h: 500 },
      { x: 924, y: 20, w: 16, h: 500 }
    ];

    // Internal obstacles based on stage
    if (st === 1) {
      this.walls.push({ x: 420, y: 120, w: 24, h: 300 });
      this.targets = [
        { x: 650, y: 150, radius: 20, hp: 1, type: 'guard' },
        { x: 780, y: 380, radius: 20, hp: 1, type: 'guard' },
        { x: 820, y: 180, radius: 24, hp: 1, type: 'console' }
      ];
    } else if (st === 2) {
      this.walls.push({ x: 340, y: 40, w: 24, h: 220 });
      this.walls.push({ x: 580, y: 280, w: 24, h: 220 });
      this.targets = [
        { x: 460, y: 100, radius: 20, hp: 1, type: 'guard' },
        { x: 460, y: 440, radius: 20, hp: 1, type: 'guard' },
        { x: 740, y: 200, radius: 20, hp: 1, type: 'guard' },
        { x: 840, y: 400, radius: 26, hp: 2, type: 'console' }
      ];
    } else {
      // Stage 3 - Red Skull's Inner Sanctum
      this.walls.push({ x: 300, y: 160, w: 20, h: 220 });
      this.walls.push({ x: 620, y: 160, w: 20, h: 220 });
      this.walls.push({ x: 450, y: 260, w: 40, h: 40, rotating: true, angle: 0 });
      this.targets = [
        { x: 470, y: 100, radius: 20, hp: 1, type: 'guard' },
        { x: 470, y: 440, radius: 20, hp: 1, type: 'guard' },
        { x: 760, y: 140, radius: 20, hp: 1, type: 'guard' },
        { x: 760, y: 400, radius: 20, hp: 1, type: 'guard' },
        { x: 850, y: 270, radius: 30, hp: 3, type: 'tesseract' }
      ];
    }

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'HYDRA BUNKER' : st === 2 ? 'LASER LAB' : 'TESSERACT SANCTUM'}`);
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING' || this.shield.isFlying) return;
    this.aimAngle = Math.atan2(y - this.shield.y, x - this.shield.x);
  }

  onPointerMove(x, y) {
    if (this.state !== 'PLAYING' || this.shield.isFlying) return;
    this.aimAngle = Math.atan2(y - this.shield.y, x - this.shield.x);
  }

  onPointerUp() {
    if (this.state !== 'PLAYING' || this.shield.isFlying || this.throwsLeft <= 0) return;

    // Throw shield
    const speed = 720;
    this.shield.vx = Math.cos(this.aimAngle) * speed;
    this.shield.vy = Math.sin(this.aimAngle) * speed;
    this.shield.isFlying = true;
    this.shield.bounces = 0;
    this.throwsLeft--;

    if (window.soundFX) window.soundFX.shieldBounce();
    this.spawnComicText('THWACK!', this.shield.x, this.shield.y - 20, '#ffd200');
    this.shake(3, 0.15);
  }

  calculateTrajectory() {
    let px = this.shield.x;
    let py = this.shield.y;
    let vx = Math.cos(this.aimAngle) * 20;
    let vy = Math.sin(this.aimAngle) * 20;
    const points = [{ x: px, y: py }];

    for (let step = 0; step < 40; step++) {
      px += vx;
      py += vy;

      // Check wall bounce
      for (const w of this.walls) {
        if (px >= w.x && px <= w.x + w.w && py >= w.y && py <= w.y + w.h) {
          // Horizontal or vertical face
          const fromLeft = Math.abs(px - w.x);
          const fromRight = Math.abs(px - (w.x + w.w));
          const fromTop = Math.abs(py - w.y);
          const fromBottom = Math.abs(py - (w.y + w.h));
          const minH = Math.min(fromLeft, fromRight);
          const minV = Math.min(fromTop, fromBottom);

          if (minH < minV) vx = -vx;
          else vy = -vy;

          points.push({ x: px, y: py });
          break;
        }
      }
      if (points.length > 5) break;
    }
    points.push({ x: px, y: py });
    return points;
  }

  update(dt) {
    if (this.shield.isFlying) {
      // Store trail
      this.shield.trail.unshift({ x: this.shield.x, y: this.shield.y });
      if (this.shield.trail.length > 12) this.shield.trail.pop();

      this.shield.x += this.shield.vx * dt;
      this.shield.y += this.shield.vy * dt;

      // Check wall collisions
      for (const w of this.walls) {
        if (
          this.shield.x + this.shield.radius >= w.x &&
          this.shield.x - this.shield.radius <= w.x + w.w &&
          this.shield.y + this.shield.radius >= w.y &&
          this.shield.y - this.shield.radius <= w.y + w.h
        ) {
          const fromLeft = Math.abs((this.shield.x + this.shield.radius) - w.x);
          const fromRight = Math.abs((this.shield.x - this.shield.radius) - (w.x + w.w));
          const fromTop = Math.abs((this.shield.y + this.shield.radius) - w.y);
          const fromBottom = Math.abs((this.shield.y - this.shield.radius) - (w.y + w.h));
          const minH = Math.min(fromLeft, fromRight);
          const minV = Math.min(fromTop, fromBottom);

          if (minH < minV) {
            this.shield.vx = -this.shield.vx;
          } else {
            this.shield.vy = -this.shield.vy;
          }

          this.shield.bounces++;
          if (window.soundFX) window.soundFX.shieldBounce();
          this.shake(3, 0.1);
          this.spawnComicText('CLANG!', this.shield.x, this.shield.y, '#ffffff');

          for (let i = 0; i < 6; i++) {
            this.spawnParticle(this.shield.x, this.shield.y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, '#ffd200', 3);
          }
          break;
        }
      }

      // Check target hits
      for (let i = this.targets.length - 1; i >= 0; i--) {
        const tg = this.targets[i];
        const dist = Math.hypot(tg.x - this.shield.x, tg.y - this.shield.y);
        if (dist < tg.radius + this.shield.radius) {
          tg.hp--;
          this.shake(6, 0.2);
          if (window.soundFX) window.soundFX.hit();

          if (tg.hp <= 0) {
            this.score += (tg.type === 'tesseract' ? 1000 : tg.type === 'console' ? 500 : 250);
            this.spawnComicText('KRAK!', tg.x, tg.y, '#e23636');
            for (let p = 0; p < 12; p++) {
              this.spawnParticle(tg.x, tg.y, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, tg.type === 'tesseract' ? '#00f0ff' : '#ffd200', 4);
            }
            this.targets.splice(i, 1);
          } else {
            this.spawnComicText('HIT!', tg.x, tg.y, '#ffd200');
          }
          this.setHUD({ score: this.score });
        }
      }

      // Return or stop after max bounces
      if (this.shield.bounces >= this.shield.maxBounces) {
        this.shield.isFlying = false;
        this.shield.x = 100;
        this.shield.y = 270;
        this.shield.trail = [];
      }
    }

    // Win condition for stage
    if (this.targets.length === 0) {
      if (this.stage < this.maxStages) {
        this.score += 500 + this.throwsLeft * 200;
        this.initStage(this.stage + 1);
        this.setHUD({ score: this.score });
      } else {
        this.score += 2000;
        this.triggerVictory('Captain America shattered the Tesseract and dismantled Hydra!');
      }
      return;
    }

    // Fail condition: ran out of throws
    if (!this.shield.isFlying && this.throwsLeft <= 0 && this.targets.length > 0) {
      this.triggerGameOver('Hydra operatives secured the base! Out of shield throws.');
    }
  }

  render(ctx) {
    // Room background
    ctx.fillStyle = '#0e111a';
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.vWidth; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.vHeight);
      ctx.stroke();
    }
    for (let y = 0; y < this.vHeight; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.vWidth, y);
      ctx.stroke();
    }

    // Render Walls
    ctx.fillStyle = '#252d42';
    ctx.strokeStyle = '#3e4b6d';
    ctx.lineWidth = 2;
    for (const w of this.walls) {
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }

    // Render Targets
    for (const tg of this.targets) {
      ctx.save();
      if (tg.type === 'guard') {
        // Hydra Soldier
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(tg.x, tg.y, tg.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd200';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffd200';
        ctx.font = "bold 12px 'Outfit'";
        ctx.textAlign = 'center';
        ctx.fillText('H', tg.x, tg.y + 4);
      } else if (tg.type === 'console') {
        // Security Console
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(tg.x - tg.radius, tg.y - tg.radius, tg.radius * 2, tg.radius * 2);
        ctx.strokeStyle = '#ff5252';
        ctx.lineWidth = 3;
        ctx.strokeRect(tg.x - tg.radius, tg.y - tg.radius, tg.radius * 2, tg.radius * 2);
      } else if (tg.type === 'tesseract') {
        // Glowing Tesseract Core
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.fillRect(tg.x - tg.radius, tg.y - tg.radius, tg.radius * 2, tg.radius * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(tg.x - tg.radius, tg.y - tg.radius, tg.radius * 2, tg.radius * 2);
      }
      ctx.restore();
    }

    // Render Aim Trajectory
    if (!this.shield.isFlying && this.throwsLeft > 0) {
      const traj = this.calculateTrajectory();
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 210, 0, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(traj[0].x, traj[0].y);
      for (let i = 1; i < traj.length; i++) {
        ctx.lineTo(traj[i].x, traj[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Render Captain America Silhouette
    ctx.save();
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.arc(80, 270, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = "bold 14px 'Outfit'";
    ctx.textAlign = 'center';
    ctx.fillText('CAP', 80, 275);
    ctx.restore();

    // Render Shield Trail
    for (let i = 0; i < this.shield.trail.length; i++) {
      const pt = this.shield.trail[i];
      const alpha = (1 - i / this.shield.trail.length) * 0.4;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e23636';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, this.shield.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Vibranium Shield
    ctx.save();
    ctx.translate(this.shield.x, this.shield.y);
    if (this.shield.isFlying) {
      ctx.rotate(Date.now() * 0.02);
    }

    // Outer Red Ring
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(0, 0, this.shield.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // White Ring
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.shield.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Inner Red Ring
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(0, 0, this.shield.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Blue Center
    ctx.fillStyle = '#1976d2';
    ctx.beginPath();
    ctx.arc(0, 0, this.shield.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // White Star
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', 0, 3);

    ctx.restore();

    // Throws Left Display
    ctx.save();
    ctx.fillStyle = '#ffd200';
    ctx.font = "bold 18px 'Bangers', cursive";
    ctx.fillText(`THROWS: ${this.throwsLeft}`, 40, 485);
    ctx.restore();
  }
}

window.CaptainAmericaGame = CaptainAmericaGame;
