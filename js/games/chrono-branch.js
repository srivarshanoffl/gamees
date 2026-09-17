/**
 * chrono-branch.js
 * Game 5: Chrono-Branch Pruner
 * Core Mechanic: Multi-Stream Timeline Navigation & Rapid Nexus Branch Pruning.
 * Jump between 3 parallel timeline streams to deploy TVA Reset Charges onto divergent nexus events
 * before branches cross the catastrophic Red Line threshold.
 */

class ChronoBranchGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'chronobranch';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.stability = 100; // 100% stability down to 0% (Game Over)
    this.maxHealth = 100;
    this.prunedCount = 0;
    this.winTarget = 32;

    // 3 Timeline Strands (Y-levels: 150, 300, 450)
    this.strands = [
      { id: 0, y: 150, label: 'EARTH-616 STREAM' },
      { id: 1, y: 300, label: 'SACRED CORE TRUNK' },
      { id: 2, y: 450, label: 'EARTH-838 STREAM' }
    ];

    this.currentStrandIdx = 1; // Start in center trunk
    this.player = {
      x: 180,
      y: 300,
      targetY: 300,
      chargeCooldown: 0
    };

    this.branches = []; // array of active divergent nexus branches
    this.resetCharges = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.redLineX = 720; // The threshold of no return

    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.max(0, Math.round(this.stability)),
      stage: `${Math.min(this.winTarget, this.prunedCount)} / ${this.winTarget}`
    });
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;

    // Determine clicked strand
    if (y < 225) this.currentStrandIdx = 0;
    else if (y < 375) this.currentStrandIdx = 1;
    else this.currentStrandIdx = 2;

    this.player.targetY = this.strands[this.currentStrandIdx].y;

    // Deploy reset charge toward target
    this.deployResetCharge(x);
  }

  onKeyDown(e) {
    if (this.state !== 'PLAYING') return;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.currentStrandIdx = Math.max(0, this.currentStrandIdx - 1);
      this.player.targetY = this.strands[this.currentStrandIdx].y;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.currentStrandIdx = Math.min(2, this.currentStrandIdx + 1);
      this.player.targetY = this.strands[this.currentStrandIdx].y;
    } else if (e.key === ' ' || e.key === 'Enter') {
      this.deployResetCharge(this.player.x + 120);
    }
  }

  deployResetCharge(targetX) {
    if (this.player.chargeCooldown > 0) return;
    this.player.chargeCooldown = 0.28;

    this.resetCharges.push({
      strandIdx: this.currentStrandIdx,
      x: this.player.x,
      targetX: Math.max(this.player.x + 40, targetX),
      y: this.strands[this.currentStrandIdx].y,
      vx: 650,
      r: 14
    });
    this.playSound('laser');
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Smooth player movement between strands
    this.player.y += (this.player.targetY - this.player.y) * 12 * dt;
    if (this.player.chargeCooldown > 0) {
      this.player.chargeCooldown -= dt;
    }

    // Spawn divergent nexus events
    this.spawnTimer += dt;
    const interval = Math.max(0.65, 1.8 - (this.prunedCount / 32) * 1.0);
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnNexusBranch();
    }

    // Update Reset Charges
    for (let i = this.resetCharges.length - 1; i >= 0; i--) {
      const c = this.resetCharges[i];
      c.x += c.vx * dt;

      // Check collision with branches on same strand
      let detonated = false;
      for (let j = this.branches.length - 1; j >= 0; j--) {
        const b = this.branches[j];
        if (b.strandIdx === c.strandIdx && Math.abs(c.x - b.currentTipX) < 35) {
          detonated = true;
          this.pruneBranch(b, j);
          break;
        }
      }

      if (detonated || c.x > 780) {
        this.resetCharges.splice(i, 1);
      }
    }

    // Update divergent branches growing toward Red Line
    for (let i = this.branches.length - 1; i >= 0; i--) {
      const b = this.branches[i];
      b.currentTipX += b.growthSpeed * dt;

      // Breached Red Line!
      if (b.currentTipX >= this.redLineX) {
        this.stability -= 22;
        this.shakeCamera(9, 0.4);
        this.playSound('explosion');
        this.createShockwave(b.currentTipX, b.originY, '#ef4444');
        this.branches.splice(i, 1);

        if (this.stability <= 0) {
          this.triggerGameOver('NEXUS RED LINE BREACHED! TIMELINE DESTABILIZED INTO MULTIVERSAL WAR!');
          return;
        }
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

    // Check Victory
    if (this.prunedCount >= this.winTarget && this.branches.length === 0) {
      this.triggerVictory('SACRED TIMELINE RESTORED! TVA PROTOCOLS CONFIRMED.');
    }

    this.updateHUDValues();
  }

  pruneBranch(branch, idx) {
    this.prunedCount++;
    this.score += 200;
    this.createShockwave(branch.currentTipX, branch.originY, '#06b6d4');
    this.playSound('powerup');
    this.branches.splice(idx, 1);
  }

  spawnNexusBranch() {
    const strand = Math.floor(Math.random() * 3);
    const speed = 110 + (this.prunedCount / 32) * 90 + Math.random() * 40;

    this.branches.push({
      strandIdx: strand,
      originX: 260,
      originY: this.strands[strand].y,
      currentTipX: 270,
      growthSpeed: speed,
      color: strand === 1 ? '#eab308' : (strand === 0 ? '#38bdf8' : '#a855f7'),
      pulse: 0
    });
  }

  createShockwave(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 70 + Math.random() * 150;
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

    // Deep TVA Vintage Amber & Indigo Theme
    const bg = ctx.createLinearGradient(0, 0, 0, 600);
    bg.addColorStop(0, '#1c1917');
    bg.addColorStop(0.5, '#0c0a09');
    bg.addColorStop(1, '#172554');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 600);

    // Sacred Timeline Flow Background Streams
    this.strands.forEach((s, idx) => {
      // Glow aura
      ctx.strokeStyle = idx === 1 ? 'rgba(234, 179, 8, 0.25)' : 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.moveTo(0, s.y);
      ctx.lineTo(800, s.y);
      ctx.stroke();

      // Core timeline beam
      ctx.strokeStyle = idx === 1 ? '#eab308' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, s.y);
      ctx.lineTo(800, s.y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText(s.label, 20, s.y - 18);
    });

    // TVA RED LINE THRESHOLD
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(this.redLineX, 60);
    ctx.lineTo(this.redLineX, 540);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.font = '900 13px "Segoe UI", sans-serif';
    ctx.fillText('CRITICAL RED LINE', this.redLineX - 60, 50);

    // Growing Divergent Nexus Branches
    for (const b of this.branches) {
      // Branch jagged path
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(b.originX, b.originY);

      // Jagged jagged nexus spikes
      const step = 25;
      for (let px = b.originX; px <= b.currentTipX; px += step) {
        const offset = Math.sin(px * 0.08) * 14;
        ctx.lineTo(px, b.originY + offset);
      }
      ctx.stroke();

      // Glowing nexus tip
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.currentTipX, b.originY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // TVA Hunter Reset Charges in flight
    for (const c of this.resetCharges) {
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Charge spark trail
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x - 20, c.y);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
    }

    // TVA Pruning Hunter (Player)
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Hunter armor
    ctx.fillStyle = '#f97316'; // TVA Orange
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Time Stick Baton
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    ctx.restore();

    // Render Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Header Status Bar
    ctx.fillStyle = 'rgba(28, 25, 23, 0.8)';
    ctx.fillRect(20, 15, 240, 24);
    ctx.strokeStyle = '#f97316';
    ctx.strokeRect(20, 15, 240, 24);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText(`TVA PRUNING PROTOCOL: ${this.prunedCount}/${this.winTarget}`, 30, 31);
  }
}

window.ChronoBranchGame = ChronoBranchGame;
