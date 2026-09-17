/**
 * groot.js
 * Game 4: Groot - Root Weaver
 * Core Mechanic: Freeform Branch Drawing & Physics Deflection / Funneling.
 * Draw living Flora Colossus root branches to channel blue energy cells into Rocket's reactor hopper
 * while bouncing destructive scrap bombs into disposal chutes.
 */

class GrootGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'groot';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.health = 100; // Rocket's workbench integrity
    this.maxHealth = 100;
    this.batteryCharge = 0; // 0 to 100% (Win condition)
    this.winTarget = 100;

    this.sapMeter = 100; // 0 to 100 (drawing resource)
    this.maxSap = 100;

    this.currentBranch = null;
    this.branches = []; // array of { points: [{x,y}], life: 4.0, maxLife: 4.0 }

    this.fallingObjects = [];
    this.particles = [];
    this.spawnTimer = 0;

    // Rocket Hopper zone at bottom center
    this.hopper = {
      x: 320,
      y: 520,
      w: 160,
      h: 70
    };

    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.round(this.health),
      stage: `${Math.min(100, Math.round(this.batteryCharge))}%`
    });
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    if (this.sapMeter < 10) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.currentBranch = {
      points: [{ x, y }],
      life: 4.5,
      maxLife: 4.5
    };
  }

  onPointerMove(e) {
    if (!this.currentBranch || this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lastPt = this.currentBranch.points[this.currentBranch.points.length - 1];
    const dist = Math.hypot(x - lastPt.x, y - lastPt.y);

    if (dist > 15 && this.sapMeter > 2) {
      this.currentBranch.points.push({ x, y });
      this.sapMeter = Math.max(0, this.sapMeter - 3);
    }
  }

  onPointerUp(e) {
    if (!this.currentBranch) return;
    if (this.currentBranch.points.length > 1) {
      this.branches.push(this.currentBranch);
      this.playSound('click');
    }
    this.currentBranch = null;
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Regenerate sap
    this.sapMeter = Math.min(this.maxSap, this.sapMeter + 25 * dt);

    // Update branches
    for (let i = this.branches.length - 1; i >= 0; i--) {
      const b = this.branches[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.branches.splice(i, 1);
      }
    }

    // Spawning falling items (Blue cells or Red bombs)
    this.spawnTimer += dt;
    const interval = Math.max(0.7, 1.8 - (this.batteryCharge / 100) * 0.9);
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnFallingObject();
    }

    // Update falling objects physics
    for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
      const obj = this.fallingObjects[i];
      obj.vy += 220 * dt; // gravity
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;

      // Bounce against canvas walls (left/right chutes)
      if (obj.x < 15) {
        obj.x = 15;
        obj.vx = Math.abs(obj.vx) * 0.8;
      } else if (obj.x > 785) {
        obj.x = 785;
        obj.vx = -Math.abs(obj.vx) * 0.8;
      }

      // Check collision with living root branches
      for (const b of this.branches) {
        for (let p = 0; p < b.points.length - 1; p++) {
          const p1 = b.points[p];
          const p2 = b.points[p + 1];

          if (this.lineCircleIntersect(p1.x, p1.y, p2.x, p2.y, obj.x, obj.y, obj.r + 8)) {
            // Calculate normal vector of line segment
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy);
            if (len === 0) continue;

            const nx = -dy / len;
            const ny = dx / len;

            // Reflect velocity with slight restitution
            const dot = obj.vx * nx + obj.vy * ny;
            obj.vx = (obj.vx - 2 * dot * nx) * 0.85;
            obj.vy = (obj.vy - 2 * dot * ny) * 0.85;

            // Nudge out of branch
            obj.x += nx * 6;
            obj.y += ny * 6;

            this.createSparks(obj.x, obj.y, obj.type === 'CELL' ? '#38bdf8' : '#ef4444', 4);
            this.playSound('laser');
            break;
          }
        }
      }

      // Check collision with Rocket's Reactor Hopper (Center)
      if (obj.y > this.hopper.y && obj.x >= this.hopper.x && obj.x <= this.hopper.x + this.hopper.w) {
        if (obj.type === 'CELL') {
          // Success! Powered reactor!
          this.batteryCharge = Math.min(100, this.batteryCharge + 8);
          this.score += 200;
          this.createSparks(obj.x, obj.y, '#38bdf8', 14);
          this.playSound('powerup');
        } else {
          // Bomb hit reactor!
          this.health -= 20;
          this.shakeCamera(8, 0.3);
          this.createSparks(obj.x, obj.y, '#ef4444', 16);
          this.playSound('explosion');

          if (this.health <= 0) {
            this.triggerGameOver("Rocket's workbench was destroyed by bombs!");
            return;
          }
        }
        this.fallingObjects.splice(i, 1);
        continue;
      }

      // Fallen into left/right side scrap chutes
      if (obj.y > 580) {
        if (obj.type === 'BOMB') {
          // Successfully deflected bomb into side chutes!
          this.score += 100;
          this.createSparks(obj.x, obj.y, '#10b981', 8);
        } else {
          // Lost a power cell
          this.score = Math.max(0, this.score - 30);
        }
        this.fallingObjects.splice(i, 1);
      }
    }

    // Update particles
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
    if (this.batteryCharge >= this.winTarget) {
      this.triggerVictory('ANION BATTERY 100% CHARGED! "WE ARE GROOT!"');
    }

    this.updateHUDValues();
  }

  lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(cx - x1, cy - y1) <= r;

    let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.hypot(cx - projX, cy - projY) <= r;
  }

  spawnFallingObject() {
    const isBomb = Math.random() < 0.42;
    this.fallingObjects.push({
      type: isBomb ? 'BOMB' : 'CELL',
      x: 80 + Math.random() * 640,
      y: -20,
      vx: (Math.random() - 0.5) * 60,
      vy: 60 + Math.random() * 80,
      r: isBomb ? 16 : 14
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

    // Deep Space / Milano workshop interior
    const bg = ctx.createLinearGradient(0, 0, 0, 600);
    bg.addColorStop(0, '#064e3b'); // Bio-organic emerald dark
    bg.addColorStop(0.6, '#0f172a');
    bg.addColorStop(1, '#022c22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 600);

    // Living Root Branches drawn by player
    for (const b of this.branches) {
      const alpha = Math.min(1, b.life / 1.5);
      ctx.strokeStyle = `rgba(180, 83, 9, ${alpha})`; // Rich bark brown
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(b.points[0].x, b.points[0].y);
      for (let p = 1; p < b.points.length; p++) {
        ctx.lineTo(b.points[p].x, b.points[p].y);
      }
      ctx.stroke();

      // Green mossy leaves on root
      ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Branch currently being drawn
    if (this.currentBranch && this.currentBranch.points.length > 0) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.currentBranch.points[0].x, this.currentBranch.points[0].y);
      for (let p = 1; p < this.currentBranch.points.length; p++) {
        ctx.lineTo(this.currentBranch.points[p].x, this.currentBranch.points[p].y);
      }
      ctx.stroke();
    }

    // Falling objects
    for (const obj of this.fallingObjects) {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      if (obj.type === 'CELL') {
        // Glowing Anion Battery Cell (Blue)
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, obj.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, obj.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Destructive Spike Bomb (Red)
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, obj.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Spikes
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 3;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * obj.r, Math.sin(a) * obj.r);
          ctx.lineTo(Math.cos(a) * (obj.r + 6), Math.sin(a) * (obj.r + 6));
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Side Scrap Chutes (Left & Right)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fillRect(0, 520, 100, 80);
    ctx.fillRect(700, 520, 100, 80);
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillText('DISPOSAL', 20, 560);
    ctx.fillText('DISPOSAL', 720, 560);

    // Rocket Hopper (Center Hopper)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.hopper.x, this.hopper.y, this.hopper.w, this.hopper.h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(this.hopper.x, this.hopper.y, this.hopper.w, this.hopper.h);

    // Battery meter inside hopper
    const fillW = (this.batteryCharge / 100) * (this.hopper.w - 12);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(this.hopper.x + 6, this.hopper.y + 35, fillW, 25);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('ROCKET REACTOR HOPPER', this.hopper.x + 10, this.hopper.y + 24);

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sap Meter Top Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(20, 20, 200, 20);
    ctx.strokeStyle = '#22c55e';
    ctx.strokeRect(20, 20, 200, 20);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(22, 22, (this.sapMeter / this.maxSap) * 196, 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillText(`SAP RESOURCE: ${Math.round(this.sapMeter)}%`, 28, 34);

    // Groot Face Silhouette Avatar (Top Right)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(750, 40, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(745, 26, 7, 0, Math.PI * 2);
    ctx.arc(756, 24, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.GrootGame = GrootGame;
