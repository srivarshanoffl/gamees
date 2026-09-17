/**
 * temporal-echo.js
 * Game 6: Temporal Echo - Dual Era
 * Core Mechanic: Asymmetrical Split-Screen Cause-and-Effect Puzzle Navigation.
 * Control two temporal variants running simultaneously across Past (1942) and Future (2099).
 * Activating switches in the Past causes real-time terrain shifts, bridge creations, and gate shutdowns in the Future!
 */

class TemporalEchoGame extends GameEngine {
  constructor() {
    super('gameCanvas', {
      scoreId: 'hudScore',
      healthId: 'hudHealthFill',
      stageId: 'hudStage'
    });
    this.gameId = 'temporalecho';
    this.reset();
  }

  reset() {
    this.state = 'PLAYING';
    this.score = 0;
    this.stability = 100; // Paradox tolerance
    this.maxHealth = 100;
    this.distance = 0; // 0 to 800m
    this.targetDistance = 800;

    // Past Variant (Left Screen: X: 0 to 400)
    this.pastHero = {
      x: 200,
      y: 480,
      targetX: 200,
      speed: 320,
      r: 18
    };

    // Future Variant (Right Screen: X: 400 to 800)
    this.futureHero = {
      x: 600,
      y: 480,
      targetX: 600,
      speed: 320,
      r: 18
    };

    // Environmental elements flowing down (obstacles, switches, bridges)
    this.elements = [];
    this.particles = [];
    this.spawnTimer = 0;

    this.keys = { left: false, right: false, action: false };
    this.updateHUDValues();
  }

  updateHUDValues() {
    this.setHUD({
      score: Math.round(this.score),
      health: Math.max(0, Math.round(this.stability)),
      stage: `${Math.min(this.targetDistance, Math.round(this.distance))}m / ${this.targetDistance}m`
    });
  }

  onPointerDown(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    if (mx < 400) {
      // Steer past hero
      this.pastHero.targetX = Math.max(50, Math.min(350, mx));
    } else {
      // Steer future hero
      this.futureHero.targetX = Math.max(450, Math.min(750, mx));
    }
  }

  onPointerMove(e) {
    if (this.state !== 'PLAYING') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    if (mx < 400) {
      this.pastHero.targetX = Math.max(50, Math.min(350, mx));
    } else {
      this.futureHero.targetX = Math.max(450, Math.min(750, mx));
    }
  }

  onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.pastHero.targetX = Math.max(50, this.pastHero.targetX - 70);
      this.futureHero.targetX = Math.max(450, this.futureHero.targetX - 70);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.pastHero.targetX = Math.min(350, this.pastHero.targetX + 70);
      this.futureHero.targetX = Math.min(750, this.futureHero.targetX + 70);
    }
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.distance += 45 * dt;

    // Lerp heroes to targets
    this.pastHero.x += (this.pastHero.targetX - this.pastHero.x) * 10 * dt;
    this.futureHero.x += (this.futureHero.targetX - this.futureHero.x) * 10 * dt;

    // Spawning paired cause-and-effect rows
    this.spawnTimer += dt;
    if (this.spawnTimer >= 1.6) {
      this.spawnTimer = 0;
      this.spawnTemporalRow();
    }

    // Scroll elements downward
    const scrollSpeed = 160 + (this.distance / 800) * 80;
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const el = this.elements[i];
      el.y += scrollSpeed * dt;

      // Check Past switch hit
      if (el.era === 'PAST' && el.type === 'SWITCH' && !el.activated) {
        const d = Math.hypot(this.pastHero.x - el.x, this.pastHero.y - el.y);
        if (d < this.pastHero.r + el.r) {
          el.activated = true;
          this.score += 150;
          this.playSound('powerup');
          this.createSparks(el.x, el.y, '#f59e0b', 12);

          // Activate linked Future element!
          const linked = this.elements.find(other => other.linkId === el.linkId && other.era === 'FUTURE');
          if (linked) {
            linked.active = false; // Disarms laser barrier or opens energy bridge!
            this.createSparks(linked.x, linked.y, '#06b6d4', 16);
          }
        }
      }

      // Check collision with Past Obstacles
      if (el.era === 'PAST' && el.type === 'OBSTACLE') {
        const d = Math.hypot(this.pastHero.x - el.x, this.pastHero.y - el.y);
        if (d < this.pastHero.r + el.r) {
          this.triggerDamage(18);
          this.elements.splice(i, 1);
          continue;
        }
      }

      // Check collision with Future Obstacles / Barriers
      if (el.era === 'FUTURE' && el.type === 'BARRIER' && el.active) {
        if (this.futureHero.y > el.y - 15 && this.futureHero.y < el.y + 15 &&
            this.futureHero.x >= el.x1 && this.futureHero.x <= el.x2) {
          this.triggerDamage(22);
          this.elements.splice(i, 1);
          continue;
        }
      }

      if (el.y > 640) {
        this.elements.splice(i, 1);
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

    // Victory Check
    if (this.distance >= this.targetDistance) {
      this.triggerVictory('PARADOX RESOLVED! DUAL ERAS CONVERGED AT CITADEL APEX!');
    }

    this.updateHUDValues();
  }

  triggerDamage(dmg) {
    this.stability -= dmg;
    this.shakeCamera(8, 0.25);
    this.playSound('hit');

    if (this.stability <= 0) {
      this.triggerGameOver('TEMPORAL PARADOX COLLAPSE! TIMELINES FRACTURED!');
    }
  }

  spawnTemporalRow() {
    const linkId = Date.now() + Math.random();
    const switchLaneX = 100 + Math.random() * 200;

    // Past: Spawn Chrono-Switch
    this.elements.push({
      era: 'PAST',
      type: 'SWITCH',
      linkId: linkId,
      x: switchLaneX,
      y: -30,
      r: 20,
      activated: false
    });

    // Past: Add stray rubble obstacle
    this.elements.push({
      era: 'PAST',
      type: 'OBSTACLE',
      x: switchLaneX > 200 ? 110 : 290,
      y: -70,
      r: 22
    });

    // Future: Spawn high-tech Laser Barrier linked to that switch!
    this.elements.push({
      era: 'FUTURE',
      type: 'BARRIER',
      linkId: linkId,
      x1: 430,
      x2: 770,
      y: -30,
      active: true // Active until past switch is pressed!
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

    // LEFT HALF: PAST (1942 - Sepia / Vintage WW2 tones)
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 0, 400, 600);

    // Vintage stone road grid
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1.5;
    const gridY = (this.distance * 3) % 60;
    for (let y = gridY; y < 600; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(400, y);
      ctx.stroke();
    }

    // RIGHT HALF: FUTURE (2099 - Cyberpunk Hologram Neon)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(400, 0, 400, 600);

    // Neon digital grid
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    for (let y = gridY; y < 600; y += 60) {
      ctx.beginPath();
      ctx.moveTo(400, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // CENTRAL SPLIT TIME CHRONO-RIFT
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Era Labels
    ctx.fillStyle = '#d97706';
    ctx.font = '900 13px "Segoe UI", sans-serif';
    ctx.fillText('PAST ERA — 1942 (CAUSE)', 30, 35);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('FUTURE ERA — 2099 (EFFECT)', 430, 35);

    // Render Elements
    for (const el of this.elements) {
      if (el.era === 'PAST') {
        if (el.type === 'SWITCH') {
          // Ancient Chrono Lever
          ctx.fillStyle = el.activated ? '#10b981' : '#f59e0b';
          ctx.beginPath();
          ctx.arc(el.x, el.y, el.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('TIME KEY', el.x - 22, el.y + 4);
        } else {
          // Stone Obstacle
          ctx.fillStyle = '#78716c';
          ctx.beginPath();
          ctx.arc(el.x, el.y, el.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a8a29e';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        // Future Barrier
        if (el.type === 'BARRIER') {
          if (el.active) {
            // Lethal Laser Gate
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(el.x1, el.y);
            ctx.lineTo(el.x2, el.y);
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('LOCKED TEMPORAL GATE', el.x1 + 60, el.y - 8);
          } else {
            // Disabled / Safe Passage
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(el.x1, el.y);
            ctx.lineTo(el.x2, el.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    // Past Hero (1942 Trenchcoat Variant)
    ctx.save();
    ctx.translate(this.pastHero.x, this.pastHero.y);
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, this.pastHero.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Future Hero (2099 Cybernetic Variant)
    ctx.save();
    ctx.translate(this.futureHero.x, this.futureHero.y);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, this.futureHero.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Render particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

window.TemporalEchoGame = TemporalEchoGame;
