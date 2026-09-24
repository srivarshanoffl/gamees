/**
 * ParticleSystem.js — Advanced VFX & Comic Bursts for Loki 2.5D
 * Supports glowing magic sparks, dimensional rifts, comic hit words, shockwaves,
 * lightning arcs, energy beams, and eldritch mandalas.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.comicTexts = [];
    this.shockwaves = [];
    this.lines = []; // for lightning and beams
  }

  reset() {
    this.particles = [];
    this.comicTexts = [];
    this.shockwaves = [];
    this.lines = [];
  }

  spawnParticle(x, y, vx, vy, color, radius = 3, life = 0.6, glow = true) {
    this.particles.push({
      x, y, vx, vy,
      color,
      radius,
      life,
      maxLife: life,
      glow,
      alpha: 1
    });
  }

  spawnBurst(x, y, color = '#00ff88', count = 12, speed = 140) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.8 + 0.3) * speed;
      this.spawnParticle(
        x, y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        color,
        Math.random() * 3 + 2,
        Math.random() * 0.4 + 0.3
      );
    }
  }

  createSparkBurst(x, y, color = '#00ff88', count = 12, speed = 140) {
    this.spawnBurst(x, y, color, count, speed);
  }

  spawnMagicWisps(x, y, color = '#00ff88', count = 4) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 60;
      const vy = -(Math.random() * 80 + 30);
      this.spawnParticle(x, y, vx, vy, color, Math.random() * 2.5 + 1.5, 0.5);
    }
  }

  spawnShockwave(x, y, color = '#00ff88', maxRadius = 60, duration = 0.35) {
    this.shockwaves.push({
      x, y, color,
      radius: 5,
      maxRadius,
      life: duration,
      maxLife: duration
    });
  }

  createShockwave(x, y, color = '#00ff88', maxRadius = 60, duration = 0.35) {
    this.spawnShockwave(x, y, color, maxRadius, duration);
  }

  spawnComicText(text, x, y, color = '#ffd200') {
    this.comicTexts.push({
      text, x, y,
      color,
      scale: 0.6,
      alpha: 1,
      life: 0.75,
      maxLife: 0.75
    });
  }

  showPopupText(text, x, y, color = '#ffd200') {
    this.spawnComicText(text, x, y, color);
  }

  createLightning(x1, y1, x2, y2, color = '#38bdf8') {
    const points = [{ x: x1, y: y1 }];
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      points.push({
        x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 35,
        y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 35
      });
    }
    points.push({ x: x2, y: y2 });

    this.lines.push({
      type: 'lightning',
      points,
      color,
      life: 0.2,
      maxLife: 0.2
    });
  }

  createBeam(x1, y1, x2, y2, color = '#fbbf24', width = 6) {
    this.lines.push({
      type: 'beam',
      x1, y1, x2, y2,
      color,
      width,
      life: 0.25,
      maxLife: 0.25
    });
  }

  createEldritchGlyph(x, y, color = '#ec4899') {
    this.shockwaves.push({
      x, y, color,
      radius: 10,
      maxRadius: 50,
      life: 0.4,
      maxLife: 0.4
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      const progress = 1 - (sw.life / sw.maxLife);
      sw.radius = 5 + progress * (sw.maxRadius - 5);
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.comicTexts.length - 1; i >= 0; i--) {
      const ct = this.comicTexts[i];
      ct.y -= 30 * dt;
      ct.life -= dt;
      ct.scale = Math.min(1.3, ct.scale + dt * 2.5);
      ct.alpha = Math.max(0, ct.life / ct.maxLife);
      if (ct.life <= 0) {
        this.comicTexts.splice(i, 1);
      }
    }

    for (let i = this.lines.length - 1; i >= 0; i--) {
      const l = this.lines[i];
      l.life -= dt;
      if (l.life <= 0) {
        this.lines.splice(i, 1);
      }
    }
  }

  render(ctx, cameraX = 0) {
    ctx.save();
    ctx.translate(-cameraX, 0);

    // Beams and Lightning Lines
    for (const l of this.lines) {
      const alpha = Math.max(0, l.life / l.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = l.color;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 12;

      if (l.type === 'lightning') {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l.points[0].x, l.points[0].y);
        for (let i = 1; i < l.points.length; i++) {
          ctx.lineTo(l.points[i].x, l.points[i].y);
        }
        ctx.stroke();
      } else if (l.type === 'beam') {
        ctx.lineWidth = l.width;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Shockwaves
    for (const sw of this.shockwaves) {
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 2.5;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Comic texts
    for (const ct of this.comicTexts) {
      ctx.save();
      ctx.globalAlpha = ct.alpha;
      ctx.font = `bold ${Math.floor(26 * ct.scale)}px 'Bangers', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ct.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.shadowColor = ct.color;
      ctx.shadowBlur = 8;
      ctx.strokeText(ct.text, ct.x, ct.y);
      ctx.fillText(ct.text, ct.x, ct.y);
      ctx.restore();
    }

    ctx.restore();
  }
}

window.ParticleSystem = ParticleSystem;
