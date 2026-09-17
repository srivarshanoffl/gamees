/**
 * beyonder-core.js
 * Game 10: Secret Wars - Beyonder Core
 * Core Mechanic: Multi-Quadrant Fluid Conduit Routing & Omniversal Thermal Triage.
 * Channel the raw omnipotent energy of the Beyonders across 4 Battleworld reactor quadrants:
 * [Q] Asgardian Cryo-Vent, [W] Vibranium Matrix, [A] Kree Antimatter Drain, [S] Gamma Chamber.
 * Rotate conduit valves and siphon cosmic flare sparks to prevent Battleworld reality meltdown!
 */

class BeyonderCoreGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'beyondercore';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.realityIntegrity = 100; // Shield / Health
    this.maxHealth = 100;
    this.cohesionPercent = 0; // 0 to 100% (Win condition)
    this.winTarget = 100;

    // 4 Quadrants:
    // 0: TOP-LEFT (Q) - Asgard Cryo
    // 1: TOP-RIGHT (W) - Vibranium Matrix
    // 2: BOTTOM-LEFT (A) - Kree Antimatter
    // 3: BOTTOM-RIGHT (S) - Gamma Chamber
    this.quadrants = [
      { id: 0, key: 'Q', name: 'ASGARD CRYO', cx: 200, cy: 150, pressure: 20, color: '#38bdf8', active: false },
      { id: 1, key: 'W', name: 'VIBRANIUM MATRIX', cx: 600, cy: 150, pressure: 30, color: '#c084fc', active: false },
      { id: 2, key: 'A', name: 'KREE ANTIMATTER', cx: 200, cy: 450, pressure: 25, color: '#f59e0b', active: false },
      { id: 3, key: 'S', name: 'GAMMA CHAMBER', cx: 600, cy: 450, pressure: 15, color: '#22c55e', active: false }
    ];

    this.activeQuadrant = 0; // The currently connected conduit
    this.core = {
      x: 400,
      y: 300,
      r: 50,
      pulse: 0
    };

    this.sparks = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.flareTimer = 0;

    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.max(0, Math.round(this.realityIntegrity)),
      stage: `${Math.min(100, Math.round(this.cohesionPercent))}%`
    });
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if clicked any quadrant to vent
    for (let i = 0; i < this.quadrants.length; i++) {
      const q = this.quadrants[i];
      if (Math.hypot(mx - q.cx, my - q.cy) < 70) {
        this.ventQuadrant(i);
        return;
      }
    }

    // Check if clicked cosmic spark
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      if (Math.hypot(mx - s.x, my - s.y) < s.r + 15) {
        this.score += 150;
        this.cohesionPercent = Math.min(100, this.cohesionPercent + 3);
        this.createShockwave(s.x, s.y, '#ffffff', 10);
        this.playSound('powerup');
        this.sparks.splice(i, 1);
        return;
      }
    }
  }

  onKeyDown(e) {
    if (this.state !== 'PLAYING') return;
    const k = e.key.toUpperCase();
    if (k === 'Q' || k === '1') this.ventQuadrant(0);
    else if (k === 'W' || k === '2') this.ventQuadrant(1);
    else if (k === 'A' || k === '3') this.ventQuadrant(2);
    else if (k === 'S' || k === '4') this.ventQuadrant(3);
  }

  ventQuadrant(idx) {
    this.activeQuadrant = idx;
    const q = this.quadrants[idx];
    if (q.pressure > 25) {
      this.score += Math.round(q.pressure * 2);
      this.cohesionPercent = Math.min(100, this.cohesionPercent + 4);
      this.createShockwave(q.cx, q.cy, q.color, 14);
      this.playSound('laser');
    }
    q.pressure = Math.max(0, q.pressure - 40);
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.cohesionPercent = Math.min(100, this.cohesionPercent + 1.2 * dt);

    // Quad pressure escalation
    const pressureRiseRate = 9 + (this.cohesionPercent / 100) * 12;
    for (const q of this.quadrants) {
      q.pressure += (pressureRiseRate + Math.random() * 4) * dt;

      // Check Meltdown
      if (q.pressure >= 100) {
        this.realityIntegrity -= 35 * dt;
        this.shakeCamera(6, 0.1);
        if (this.realityIntegrity <= 0) {
          this.triggerGameOver(`${q.name} OVERHEATED! BATTLEWORLD REALITY COLLAPSED!`);
          return;
        }
      }
    }

    // Core pulsing sparks
    this.flareTimer += dt;
    if (this.flareTimer >= 1.2) {
      this.flareTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const spd = 70 + Math.random() * 90;
      this.sparks.push({
        x: this.core.x,
        y: this.core.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        r: 12
      });
    }

    // Update Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (s.x < 50 || s.x > 750 || s.y < 50 || s.y > 550) {
        this.sparks.splice(i, 1);
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

    // Win check
    if (this.cohesionPercent >= this.winTarget) {
      this.triggerVictory('BATTLEWORLD STABILIZED! GOD EMPEROR DOOM WIELDS BEYONDER SUPREMACY!');
    }

    this.updateHUDValues();
  }

  createShockwave(x, y, color, count) {
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

    // Doom Castle / Battleworld Void Tech Interior
    const bg = ctx.createLinearGradient(0, 0, 0, 600);
    bg.addColorStop(0, '#022c22'); // Doom green / dark slate
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 600);

    // Large Conduit Pipes Connecting Core to the 4 Quadrants
    for (let i = 0; i < this.quadrants.length; i++) {
      const q = this.quadrants[i];
      const isActive = this.activeQuadrant === i;

      ctx.strokeStyle = isActive ? q.color : 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = isActive ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(this.core.x, this.core.y);
      ctx.lineTo(q.cx, q.cy);
      ctx.stroke();
    }

    // 4 Reactor Quadrant Pods
    for (const q of this.quadrants) {
      ctx.save();
      ctx.translate(q.cx, q.cy);

      // Pod Outer Plate
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 65, 0, Math.PI * 2);
      ctx.fill();

      // Pressure meter ring
      ctx.strokeStyle = q.pressure > 75 ? '#ef4444' : q.color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 65, -Math.PI * 0.5, -Math.PI * 0.5 + (q.pressure / 100) * Math.PI * 2);
      ctx.stroke();

      // Pod Label & Key
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(q.name, 0, -10);

      ctx.font = '900 18px "Segoe UI", sans-serif';
      ctx.fillStyle = q.pressure > 75 ? '#ef4444' : q.color;
      ctx.fillText(`[${q.key}]`, 0, 15);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${Math.round(q.pressure)}% HEAT`, 0, 32);
      ctx.restore();
    }

    // Central Omnipotent Beyonder Core
    ctx.save();
    ctx.translate(this.core.x, this.core.y);

    // Radiating Reality Halo
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 24;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, this.core.r + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing White Omniversal Orb
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, this.core.r, 0, Math.PI * 2);
    ctx.fill();

    // God Emperor Doom Mask Emblem in Center
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Beyonder Flare Sparks
    for (const s of this.sparks) {
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Prompt
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS [Q] [W] [A] [S] OR CLICK QUADRANTS TO PURGE HEAT | CLICK SPARKS TO SIPHON', 400, 35);
  }
}

window.BeyonderCoreGame = BeyonderCoreGame;
