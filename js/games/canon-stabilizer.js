/**
 * canon-stabilizer.js
 * Game 7: Canon Stabilizer - Quantum Shutter
 * Core Mechanic: Tri-State Reality Superposition & Phase Matching.
 * Switch Spider-Society Quantum Shutter between Cyan (Alpha), Magenta (Beta), and Amber (Gamma)
 * to stabilize convergent canon fragments and purge Multiverse glitch decoherence.
 */

class CanonStabilizerGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'canonstabilizer';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.canonIntegrity = 100; // Shield / Health
    this.maxHealth = 100;
    this.stabilizedCount = 0;
    this.winTarget = 36;

    // 3 Quantum Phases:
    // 0: ALPHA (Cyan - #06b6d4)
    // 1: BETA (Magenta - #ec4899)
    // 2: GAMMA (Amber - #f59e0b)
    this.phases = [
      { id: 'ALPHA', name: 'ALPHA FREQUENCY', color: '#06b6d4' },
      { id: 'BETA', name: 'BETA FREQUENCY', color: '#ec4899' },
      { id: 'GAMMA', name: 'GAMMA FREQUENCY', color: '#f59e0b' }
    ];
    this.activePhaseIdx = 0;

    this.overdrive = 0; // 0 to 100
    this.maxOverdrive = 100;

    this.core = {
      x: 400,
      y: 280,
      r: 45
    };

    this.fragments = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.spotAnomaly = null;
    this.spotSpawned = false;

    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.max(0, Math.round(this.canonIntegrity)),
      stage: `${Math.min(this.winTarget, this.stabilizedCount)} / ${this.winTarget}`
    });
  }

  setPhase(idx) {
    if (idx >= 0 && idx < 3) {
      this.activePhaseIdx = idx;
      this.playSound('click');
      this.createShockwave(this.core.x, this.core.y, this.phases[idx].color, 8);
    }
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Bottom Phase Pod buttons:
    // Alpha: [230 to 330, 520 to 575]
    // Beta:  [350 to 450, 520 to 575]
    // Gamma: [470 to 570, 520 to 575]
    if (my >= 515 && my <= 585) {
      if (mx >= 220 && mx <= 330) this.setPhase(0);
      else if (mx >= 340 && mx <= 450) this.setPhase(1);
      else if (mx >= 460 && mx <= 570) this.setPhase(2);
      return;
    }

    // Tap core for Overdrive if ready
    const distToCore = Math.hypot(mx - this.core.x, my - this.core.y);
    if (distToCore < 60 && this.overdrive >= 100) {
      this.triggerOverdrive();
    }
  }

  onKeyDown(e) {
    if (this.state !== 'PLAYING') return;
    if (e.key === '1') this.setPhase(0);
    if (e.key === '2') this.setPhase(1);
    if (e.key === '3') this.setPhase(2);
    if (e.key === ' ' && this.overdrive >= 100) this.triggerOverdrive();
  }

  triggerOverdrive() {
    this.overdrive = 0;
    this.shakeCamera(10, 0.4);
    this.playSound('explosion');

    // Purge and stabilize all current fragments on screen!
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      this.createShockwave(f.x, f.y, '#ffffff', 14);
      this.stabilizedCount++;
      this.score += 200;
      this.fragments.splice(i, 1);
    }

    if (this.spotAnomaly) {
      this.spotAnomaly.health -= 60;
      if (this.spotAnomaly.health <= 0) {
        this.spotAnomaly = null;
        this.triggerVictory('SPOT ANOMALY PURGED! SPIDER-VERSE LOOM HARMONIZED!');
        return;
      }
    }
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Overdrive slow recharge
    this.overdrive = Math.min(100, this.overdrive + 6 * dt);

    // Spawning convergent fragments
    this.spawnTimer += dt;
    const interval = Math.max(0.6, 1.6 - (this.stabilizedCount / 36) * 0.9);
    if (this.spawnTimer >= interval && !this.spotAnomaly) {
      this.spawnTimer = 0;
      this.spawnFragment();
    }

    // Spot Anomaly Boss Spawn at 22 fragments
    if (this.stabilizedCount >= 22 && !this.spotSpawned) {
      this.spotSpawned = true;
      this.spotAnomaly = {
        x: 400,
        y: 110,
        targetX: 400,
        r: 38,
        health: 120,
        maxHealth: 120,
        phaseIdx: 1,
        switchTimer: 0,
        spawnTimer: 0
      };
      this.playSound('powerup');
      this.shakeCamera(8, 0.4);
    }

    // Update Spot Anomaly
    if (this.spotAnomaly) {
      this.spotAnomaly.switchTimer += dt;
      if (this.spotAnomaly.switchTimer > 3.0) {
        this.spotAnomaly.switchTimer = 0;
        this.spotAnomaly.phaseIdx = (this.spotAnomaly.phaseIdx + 1) % 3;
      }

      this.spotAnomaly.spawnTimer += dt;
      if (this.spotAnomaly.spawnTimer > 1.2) {
        this.spotAnomaly.spawnTimer = 0;
        // Launch fragment toward core
        const angle = Math.atan2(this.core.y - this.spotAnomaly.y, this.core.x - this.spotAnomaly.x);
        this.fragments.push({
          x: this.spotAnomaly.x,
          y: this.spotAnomaly.y,
          vx: Math.cos(angle) * 160,
          vy: Math.sin(angle) * 160,
          phaseIdx: this.spotAnomaly.phaseIdx,
          r: 16
        });
      }
    }

    // Update Fragments moving toward Loom Core
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // Distance to Core
      const d = Math.hypot(f.x - this.core.x, f.y - this.core.y);
      if (d < this.core.r + f.r) {
        // Shutter Match Check!
        if (f.phaseIdx === this.activePhaseIdx) {
          // Success! Stabilized!
          this.stabilizedCount++;
          this.score += 150;
          this.overdrive = Math.min(100, this.overdrive + 12);
          this.createShockwave(f.x, f.y, this.phases[f.phaseIdx].color, 12);
          this.playSound('powerup');
        } else {
          // Mismatch! Decoherence damage!
          this.canonIntegrity -= 18;
          this.shakeCamera(8, 0.3);
          this.createShockwave(f.x, f.y, '#ef4444', 16);
          this.playSound('hit');

          if (this.canonIntegrity <= 0) {
            this.triggerGameOver('CANON EVENT UNRAVELLED! MULTIVERSE LOOM SHATTERED!');
            return;
          }
        }
        this.fragments.splice(i, 1);
        continue;
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
    if (this.stabilizedCount >= this.winTarget && !this.spotAnomaly) {
      this.triggerVictory('CANON EVENTS SYNCHRONIZED! SPIDER-VERSE STABILIZED!');
    }

    this.updateHUDValues();
  }

  spawnFragment() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 380;
    const sx = this.core.x + Math.cos(angle) * dist;
    const sy = this.core.y + Math.sin(angle) * dist;

    const speed = 110 + (this.stabilizedCount / 36) * 70;
    const toCore = Math.atan2(this.core.y - sy, this.core.x - sx);

    this.fragments.push({
      x: sx,
      y: sy,
      vx: Math.cos(toCore) * speed,
      vy: Math.sin(toCore) * speed,
      phaseIdx: Math.floor(Math.random() * 3),
      r: 15
    });
  }

  createShockwave(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 140;
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

    // Spider-Society Loom Quantum Web Background
    const bg = ctx.createRadialGradient(400, 280, 50, 400, 280, 450);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(0.7, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 600);

    // Radial Quantum Loom Web Strings
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(this.core.x, this.core.y);
      ctx.lineTo(this.core.x + Math.cos(a) * 450, this.core.y + Math.sin(a) * 450);
      ctx.stroke();
    }
    for (let r = 80; r < 400; r += 70) {
      ctx.beginPath();
      ctx.arc(this.core.x, this.core.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Spot Anomaly Boss
    if (this.spotAnomaly) {
      ctx.save();
      ctx.translate(this.spotAnomaly.x, this.spotAnomaly.y);

      // Dark portal body
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, this.spotAnomaly.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.phases[this.spotAnomaly.phaseIdx].color;
      ctx.lineWidth = 5;
      ctx.stroke();

      // Spot spots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-10, -6, 6, 0, Math.PI * 2);
      ctx.arc(12, 8, 7, 0, Math.PI * 2);
      ctx.fill();

      // Health bar above
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-45, -55, 90, 8);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-45, -55, 90 * (this.spotAnomaly.health / this.spotAnomaly.maxHealth), 8);
      ctx.restore();
    }

    // Convergent Fragments
    for (const f of this.fragments) {
      const col = this.phases[f.phaseIdx].color;
      ctx.save();
      ctx.translate(f.x, f.y);

      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hexagonal canon lattice
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-f.r * 0.5, -f.r * 0.5, f.r, f.r);
      ctx.restore();
    }

    // Central Loom Core (Active Quantum Shutter)
    const activeColor = this.phases[this.activePhaseIdx].color;
    ctx.save();
    ctx.translate(this.core.x, this.core.y);

    // Outer Shutter Shield Ring
    ctx.strokeStyle = activeColor;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, this.core.r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Core Center Orb
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, this.core.r, 0, Math.PI * 2);
    ctx.fill();

    // Spider-Society 2099 Geometric Symbol in center
    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(16, 12);
    ctx.lineTo(0, 6);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom Tri-State Quantum Pod Buttons
    const podBtns = [
      { idx: 0, x: 230, label: '[1] ALPHA (CYAN)' },
      { idx: 1, x: 350, label: '[2] BETA (PINK)' },
      { idx: 2, x: 470, label: '[3] GAMMA (GOLD)' }
    ];

    podBtns.forEach(p => {
      const isSel = this.activePhaseIdx === p.idx;
      const col = this.phases[p.idx].color;
      ctx.fillStyle = isSel ? col : 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(p.x, 525, 100, 42);
      ctx.strokeStyle = col;
      ctx.lineWidth = isSel ? 4 : 1.5;
      ctx.strokeRect(p.x, 525, 100, 42);

      ctx.fillStyle = isSel ? '#000000' : '#ffffff';
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.fillText(p.label, p.x + 8, 550);
    });

    // Overdrive meter prompt
    if (this.overdrive >= 100) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 14px "Segoe UI", sans-serif';
      ctx.fillText('⚡ OVERDRIVE READY! [SPACEBAR] OR TAP CORE TO PURGE GLITCHES', 150, 495);
    }
  }
}

window.CanonStabilizerGame = CanonStabilizerGame;
