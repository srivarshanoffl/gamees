/**
 * hawkeye.js
 * Game 3: Hawkeye - Arrow Trace
 * Core Mechanic: Ballistic Archery with Dynamic Crosswind Simulation & Moving Target Prediction.
 * Draw and release trick arrows from Manhattan rooftops against Chitauri gliders.
 * Switch between Standard, Explosive, and EMP Disruptor arrows to down heavy targets.
 */

class HawkeyeGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'hawkeye';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.health = 100; // Rooftop defense shield
    this.maxHealth = 100;
    this.targetsDestroyed = 0;
    this.winTarget = 30;

    // Crosswind physics: vector in px/s^2
    this.windSpeed = 0; // -180 to +180
    this.windTimer = 0;
    this.nextWindChange = 4.0;

    // Bow mechanics
    this.bow = {
      x: 90,
      y: 420,
      isDrawing: false,
      drawPower: 0, // 0 to 1
      drawAngle: -0.4,
      arrowType: 'STANDARD' // 'STANDARD', 'EXPLOSIVE', 'EMP'
    };

    this.arrows = [];
    this.targets = [];
    this.explosions = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.leviathan = null;
    this.leviathanSpawned = false;

    this.changeWind();
    this.updateHUDValues();
  }

  changeWind() {
    this.windSpeed = (Math.random() - 0.5) * 280; // random wind force
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.round(this.health),
      stage: `${Math.min(this.winTarget, this.targetsDestroyed)} / ${this.winTarget}`
    });
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check Arrow type selector buttons clicked at bottom left
    if (my > 530 && mx < 240) {
      if (mx < 80) this.bow.arrowType = 'STANDARD';
      else if (mx < 160) this.bow.arrowType = 'EXPLOSIVE';
      else this.bow.arrowType = 'EMP';
      this.playSound('click');
      return;
    }

    this.bow.isDrawing = true;
    this.updateAim(mx, my);
  }

  onPointerMove(e) {
    if (!this.bow.isDrawing || this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    this.updateAim(mx, my);
  }

  onPointerUp(e) {
    if (!this.bow.isDrawing || this.state !== 'PLAYING') return;
    this.bow.isDrawing = false;
    this.releaseArrow();
  }

  onKeyDown(e) {
    if (e.key === '1') this.bow.arrowType = 'STANDARD';
    if (e.key === '2') this.bow.arrowType = 'EXPLOSIVE';
    if (e.key === '3') this.bow.arrowType = 'EMP';
  }

  updateAim(mx, my) {
    const dx = mx - this.bow.x;
    const dy = my - this.bow.y;
    this.bow.drawAngle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);
    this.bow.drawPower = Math.min(1.0, Math.max(0.2, dist / 220));
  }

  releaseArrow() {
    const speed = 450 + this.bow.drawPower * 550;
    this.arrows.push({
      x: this.bow.x,
      y: this.bow.y,
      vx: Math.cos(this.bow.drawAngle) * speed,
      vy: Math.sin(this.bow.drawAngle) * speed,
      type: this.bow.arrowType,
      trail: []
    });
    this.playSound('laser');
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Wind modulation
    this.windTimer += dt;
    if (this.windTimer >= this.nextWindChange) {
      this.windTimer = 0;
      this.changeWind();
    }

    // Update Arrows with gravity and crosswind
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arr = this.arrows[i];
      arr.vx += this.windSpeed * 0.5 * dt;
      arr.vy += 320 * dt; // Gravity

      arr.x += arr.vx * dt;
      arr.y += arr.vy * dt;

      arr.trail.push({ x: arr.x, y: arr.y, life: 0.15 });

      // Collision with Chitauri targets
      let arrowUsed = false;
      for (let j = this.targets.length - 1; j >= 0; j--) {
        const t = this.targets[j];
        const dist = Math.hypot(arr.x - t.x, arr.y - t.y);
        if (dist < t.r + 8) {
          arrowUsed = true;
          this.applyArrowHit(arr, t, j);
          break;
        }
      }

      // Collision with Leviathan boss
      if (!arrowUsed && this.leviathan) {
        const distL = Math.hypot(arr.x - this.leviathan.x, arr.y - this.leviathan.y);
        if (distL < this.leviathan.r) {
          arrowUsed = true;
          const dmg = arr.type === 'EXPLOSIVE' ? 40 : (arr.type === 'EMP' ? 30 : 15);
          this.leviathan.health -= dmg;
          this.createExplosion(arr.x, arr.y, arr.type === 'EXPLOSIVE' ? 45 : 25, arr.type);
          this.playSound('hit');

          if (this.leviathan.health <= 0) {
            this.leviathan = null;
            this.triggerVictory('LEVIATHAN DOWN! MANHATTAN AIRSPACE SECURED!');
            return;
          }
        }
      }

      if (arrowUsed || arr.x > 840 || arr.x < -40 || arr.y > 620) {
        this.arrows.splice(i, 1);
      }
    }

    // Update targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.x += t.vx * dt;
      t.y += Math.sin(t.x * 0.02 + t.phase) * t.waveAmp * dt;

      // Breaching defense perimeter
      if (t.x < 110) {
        this.health -= 15;
        this.shakeCamera(7, 0.25);
        this.playSound('explosion');
        this.targets.splice(i, 1);

        if (this.health <= 0) {
          this.triggerGameOver('Chitauri swarms overran the rooftop perimeter!');
          return;
        }
        continue;
      }
    }

    // Spawning Chitauri gliders
    this.spawnTimer += dt;
    const interval = Math.max(0.8, 2.2 - (this.targetsDestroyed / 30) * 1.2);
    if (this.spawnTimer >= interval && !this.leviathan) {
      this.spawnTimer = 0;
      this.spawnChitauri();
    }

    // Spawn Leviathan Boss at 20 kills
    if (this.targetsDestroyed >= 20 && !this.leviathanSpawned) {
      this.leviathanSpawned = true;
      this.leviathan = {
        x: 820,
        y: 240,
        targetX: 580,
        r: 60,
        health: 200,
        maxHealth: 200,
        shootTimer: 0
      };
      this.playSound('explosion');
      this.shakeCamera(8, 0.5);
    }

    // Update Leviathan
    if (this.leviathan) {
      this.leviathan.x += (this.leviathan.targetX - this.leviathan.x) * 1.2 * dt;
      this.leviathan.y = 240 + Math.sin(Date.now() * 0.002) * 50;
      this.leviathan.shootTimer += dt;
      if (this.leviathan.shootTimer > 2.0) {
        this.leviathan.shootTimer = 0;
        this.health -= 10;
        this.shakeCamera(5, 0.2);
        this.playSound('hit');
        if (this.health <= 0) {
          this.triggerGameOver('The Leviathan bombarded the perimeter!');
          return;
        }
      }
    }

    // Update Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.life -= dt;
      if (exp.life <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    // Check Victory
    if (this.targetsDestroyed >= this.winTarget && !this.leviathan) {
      this.triggerVictory('PERFECT SHOTS! CHITAURI GLIDERS ROUTED!');
    }

    this.updateHUDValues();
  }

  applyArrowHit(arr, target, targetIdx) {
    if (arr.type === 'EXPLOSIVE') {
      this.createExplosion(target.x, target.y, 65, 'EXPLOSIVE');
      this.playSound('explosion');
      // Splash damage nearby targets
      for (let k = this.targets.length - 1; k >= 0; k--) {
        const d = Math.hypot(this.targets[k].x - target.x, this.targets[k].y - target.y);
        if (d < 70) {
          this.targetsDestroyed++;
          this.score += 200;
          this.targets.splice(k, 1);
        }
      }
    } else if (arr.type === 'EMP') {
      this.createExplosion(target.x, target.y, 40, 'EMP');
      this.playSound('laser');
      this.targetsDestroyed++;
      this.score += 250;
      this.targets.splice(targetIdx, 1);
    } else {
      // Standard
      this.createExplosion(target.x, target.y, 25, 'STANDARD');
      this.playSound('hit');
      this.targetsDestroyed++;
      this.score += 150;
      this.targets.splice(targetIdx, 1);
    }
  }

  spawnChitauri() {
    const y = 80 + Math.random() * 320;
    this.targets.push({
      x: 840,
      y: y,
      vx: -(120 + Math.random() * 90),
      r: 22,
      waveAmp: 30 + Math.random() * 50,
      phase: Math.random() * Math.PI * 2
    });
  }

  createExplosion(x, y, radius, type) {
    this.explosions.push({
      x: x,
      y: y,
      r: radius,
      type: type,
      life: 0.35,
      maxLife: 0.35
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 800, 600);

    // Manhattan Twilight Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(0.5, '#431407');
    sky.addColorStop(1, '#090d16');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 800, 600);

    // City Skyline Silhouettes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 460, 800, 140);
    ctx.fillRect(140, 360, 80, 240);
    ctx.fillRect(260, 300, 90, 300);
    ctx.fillRect(400, 380, 110, 220);
    ctx.fillRect(560, 320, 100, 280);
    ctx.fillRect(700, 390, 80, 210);

    // Clint Barton's Chrysler Spire Perch
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(30, 600);
    ctx.lineTo(90, 430);
    ctx.lineTo(150, 600);
    ctx.fill();

    // Wind Indicator at Top
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(290, 15, 220, 38);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(290, 15, 220, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('CROSSWIND VECTOR', 345, 30);

    const windDir = this.windSpeed >= 0 ? '→' : '←';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText(`${windDir} ${Math.abs(Math.round(this.windSpeed / 10))} MPH GUST`, 355, 46);

    // Wind directional arrow bar
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(400, 42);
    ctx.lineTo(400 + (this.windSpeed / 280) * 80, 42);
    ctx.stroke();

    // Arrow Trajectory Trails
    for (const arr of this.arrows) {
      for (const t of arr.trail) {
        ctx.fillStyle = arr.type === 'EXPLOSIVE' ? 'rgba(239, 68, 68, 0.4)' : (arr.type === 'EMP' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(250, 204, 21, 0.4)');
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Arrow Body
      const angle = Math.atan2(arr.vy, arr.vx);
      ctx.save();
      ctx.translate(arr.x, arr.y);
      ctx.rotate(angle);
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();

      // Arrow head
      ctx.fillStyle = arr.type === 'EXPLOSIVE' ? '#ef4444' : (arr.type === 'EMP' ? '#0ea5e9' : '#a855f7');
      ctx.beginPath();
      ctx.moveTo(12, -4);
      ctx.lineTo(20, 0);
      ctx.lineTo(12, 4);
      ctx.fill();
      ctx.restore();
    }

    // Render Chitauri Targets
    for (const t of this.targets) {
      ctx.save();
      ctx.translate(t.x, t.y);

      // Chitauri chariot
      ctx.fillStyle = '#a1a1aa';
      ctx.beginPath();
      ctx.moveTo(-20, -10);
      ctx.lineTo(20, 0);
      ctx.lineTo(-20, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Energy thruster
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(15, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Leviathan Boss
    if (this.leviathan) {
      ctx.save();
      ctx.translate(this.leviathan.x, this.leviathan.y);
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 90, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Armor plating segments
      ctx.strokeStyle = '#3f3f46';
      for (let s = -60; s <= 60; s += 30) {
        ctx.beginPath();
        ctx.moveTo(s, -35);
        ctx.lineTo(s, 35);
        ctx.stroke();
      }

      // Health bar above Leviathan
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-60, -60, 120, 8);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-60, -60, 120 * (this.leviathan.health / this.leviathan.maxHealth), 8);
      ctx.restore();
    }

    // Render Explosions
    for (const exp of this.explosions) {
      const alpha = exp.life / exp.maxLife;
      ctx.save();
      ctx.translate(exp.x, exp.y);
      ctx.fillStyle = exp.type === 'EXPLOSIVE' ? `rgba(239, 68, 68, ${alpha})` : (exp.type === 'EMP' ? `rgba(56, 189, 248, ${alpha})` : `rgba(250, 204, 21, ${alpha})`);
      ctx.beginPath();
      ctx.arc(0, 0, exp.r * (1.2 - alpha * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Hawkeye (Clint Barton) on Spire
    ctx.save();
    ctx.translate(this.bow.x, this.bow.y);

    // Clint body
    ctx.fillStyle = '#7e22ce'; // Hawkeye purple suit
    ctx.beginPath();
    ctx.arc(0, -10, 14, 0, Math.PI * 2);
    ctx.fill();

    // Recurve Bow
    ctx.save();
    ctx.rotate(this.bow.drawAngle);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 26, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-Math.PI * 0.4) * 26, Math.sin(-Math.PI * 0.4) * 26);
    if (this.bow.isDrawing) {
      ctx.lineTo(-this.bow.drawPower * 20, 0);
    } else {
      ctx.lineTo(10, 0);
    }
    ctx.lineTo(Math.cos(Math.PI * 0.4) * 26, Math.sin(Math.PI * 0.4) * 26);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Trick Arrow Selectors (Bottom Left)
    const types = [
      { id: 'STANDARD', label: '[1] REG', col: '#a855f7' },
      { id: 'EXPLOSIVE', label: '[2] BOMB', col: '#ef4444' },
      { id: 'EMP', label: '[3] EMP', col: '#0ea5e9' }
    ];

    types.forEach((t, idx) => {
      const bx = 10 + idx * 75;
      const by = 545;
      const isSel = this.bow.arrowType === t.id;
      ctx.fillStyle = isSel ? t.col : 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(bx, by, 70, 32);
      ctx.strokeStyle = t.col;
      ctx.lineWidth = isSel ? 3 : 1;
      ctx.strokeRect(bx, by, 70, 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText(t.label, bx + 10, by + 20);
    });
  }
}

window.HawkeyeGame = HawkeyeGame;
