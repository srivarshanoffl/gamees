/**
 * scarlet-witch.js
 * Game 7: Scarlet Witch - Hex Polarity (Deluxe Arcade Edition)
 * Mechanics:
 * - Binary reality polarity phase-swapping platformer (Earth-616 Red vs. Hex Reality Purple).
 * - Full Procedural Comic Art: Scarlet Witch with horned tiara, flowing hair, and crackling chaos orbs.
 * - Screen-wide chromatic reality ripple shockwave on polarity switch.
 * - Chaos Magic Hex Bolt (`[E]`, `[X]`, or on-screen button) to vaporize SWORD sentinel drones.
 * - Dynamic reality aesthetics: Real-world skyline vs. CRT TV scanline glitch hex dimension.
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
      radius: 18,
      facing: 1,
      isGrounded: false
    };

    this.gravity = 650;
    this.hexBolts = [];
    this.drones = [];
    this.shockwaves = [];
    this.particles = [];

    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.health });
  }

  initStage(st) {
    this.stage = st;
    this.player.x = 70;
    this.player.y = 380;
    this.player.vx = 0;
    this.player.vy = 0;
    this.polarity = 'RED';
    this.hexBolts = [];
    this.particles = [];
    this.shockwaves = [];

    // Stage Platforms with Polarity
    if (st === 1) {
      this.platforms = [
        { x: 20, y: 440, w: 180, h: 36, polarity: 'ALL' },
        { x: 250, y: 380, w: 130, h: 22, polarity: 'RED' },
        { x: 430, y: 320, w: 130, h: 22, polarity: 'PURPLE' },
        { x: 610, y: 260, w: 130, h: 22, polarity: 'RED' },
        { x: 800, y: 210, w: 140, h: 36, polarity: 'ALL' }
      ];
      this.drones = [
        { x: 380, y: 260, minX: 350, maxX: 450, speed: 70, dir: 1, radius: 14, hp: 1 }
      ];
    } else if (st === 2) {
      this.platforms = [
        { x: 20, y: 440, w: 140, h: 36, polarity: 'ALL' },
        { x: 190, y: 360, w: 110, h: 22, polarity: 'PURPLE' },
        { x: 340, y: 300, w: 110, h: 22, polarity: 'RED' },
        { x: 490, y: 360, w: 110, h: 22, polarity: 'PURPLE' },
        { x: 640, y: 260, w: 110, h: 22, polarity: 'RED' },
        { x: 810, y: 200, w: 130, h: 36, polarity: 'ALL' }
      ];
      this.drones = [
        { x: 270, y: 220, minX: 250, maxX: 350, speed: 90, dir: 1, radius: 14, hp: 1 },
        { x: 570, y: 280, minX: 540, maxX: 650, speed: 100, dir: -1, radius: 14, hp: 1 }
      ];
    } else {
      this.platforms = [
        { x: 20, y: 440, w: 120, h: 36, polarity: 'ALL' },
        { x: 180, y: 380, w: 100, h: 22, polarity: 'RED' },
        { x: 320, y: 310, w: 100, h: 22, polarity: 'PURPLE' },
        { x: 460, y: 250, w: 100, h: 22, polarity: 'RED' },
        { x: 600, y: 310, w: 100, h: 22, polarity: 'PURPLE' },
        { x: 740, y: 230, w: 100, h: 22, polarity: 'RED' },
        { x: 860, y: 170, w: 90, h: 36, polarity: 'ALL' }
      ];
      this.drones = [
        { x: 250, y: 270, minX: 230, maxX: 330, speed: 110, dir: 1, radius: 14, hp: 1 },
        { x: 530, y: 210, minX: 500, maxX: 610, speed: 120, dir: -1, radius: 14, hp: 1 },
        { x: 680, y: 180, minX: 660, maxX: 750, speed: 130, dir: 1, radius: 14, hp: 1 }
      ];
    }

    // Altar of the Darkhold Core
    this.altar = {
      x: st === 3 ? 905 : 865,
      y: st === 3 ? 130 : 160,
      radius: 28
    };

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'WESTVIEW PERIMETER' : st === 2 ? 'CHAOS MEMBRANE' : 'DARKHOLD CORE'}`);
  }

  swapPolarity() {
    this.polarity = this.polarity === 'RED' ? 'PURPLE' : 'RED';
    if (window.soundFX) {
      if (window.soundFX.realityGlitch) window.soundFX.realityGlitch();
      else window.soundFX.realitySwap();
    }

    // Spawn expanding shockwave ripple
    this.shockwaves.push({
      x: this.player.x,
      y: this.player.y,
      radius: 10,
      maxRadius: 550,
      color: this.polarity === 'RED' ? '#ff1744' : '#d500f9',
      life: 0.45,
      maxLife: 0.45
    });

    this.spawnComicText(this.polarity === 'RED' ? 'EARTH-616' : 'HEX REALITY', this.player.x, this.player.y - 35, this.polarity === 'RED' ? '#ff1744' : '#e040fb');
    this.shake(5, 0.18);
  }

  castChaosBlast() {
    if (window.soundFX) {
      if (window.soundFX.chaosBlast) window.soundFX.chaosBlast();
      else window.soundFX.repulsor();
    }

    this.hexBolts.push({
      x: this.player.x + this.player.facing * 20,
      y: this.player.y,
      vx: this.player.facing * 550,
      vy: 0,
      radius: 10,
      color: this.polarity === 'RED' ? '#ff1744' : '#d500f9',
      life: 1.2
    });

    this.spawnComicText('CHAOS BOLT!', this.player.x + this.player.facing * 30, this.player.y - 25, '#ff1744');
    this.shake(3, 0.1);
  }

  onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'ShiftLeft') {
      e.preventDefault();
      this.swapPolarity();
    } else if (e.code === 'KeyE' || e.code === 'KeyX' || e.code === 'KeyC') {
      this.castChaosBlast();
    }
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;

    // Check click on action HUD buttons
    if (y > 480 && x < 150) {
      this.swapPolarity();
      return;
    }
    if (y > 480 && x >= 150 && x < 300) {
      this.castChaosBlast();
      return;
    }

    // Tap on screen: Top or Right half swaps polarity; left half jumps
    if (x > 500 || y < 140) {
      this.swapPolarity();
    } else if (y >= 140 && this.player.isGrounded) {
      this.player.vy = -380;
      this.player.isGrounded = false;
      if (window.soundFX) window.soundFX.thwip();
    }
  }

  update(dt) {
    // Horizontal Movement
    const speed = 260;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      this.player.vx = -speed;
      this.player.facing = -1;
    } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      this.player.vx = speed;
      this.player.facing = 1;
    } else {
      this.player.vx *= 0.85;
    }

    // Jump
    if ((this.keys['KeyW'] || this.keys['ArrowUp']) && this.player.isGrounded) {
      this.player.vy = -390;
      this.player.isGrounded = false;
      if (window.soundFX) window.soundFX.thwip();
    }

    this.player.vy += this.gravity * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    this.player.isGrounded = false;

    // Left screen bound
    if (this.player.x < 30) this.player.x = 30;

    // Platform Collisions (Respect Polarity)
    for (const p of this.platforms) {
      const isSolid = p.polarity === 'ALL' || p.polarity === this.polarity;
      if (!isSolid) continue;

      if (
        this.player.x + this.player.radius > p.x &&
        this.player.x - this.player.radius < p.x + p.w &&
        this.player.y + this.player.radius > p.y &&
        this.player.y - this.player.radius < p.y + p.h
      ) {
        if (this.player.vy > 0 && this.player.y < p.y + 16) {
          this.player.y = p.y - this.player.radius;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
      }
    }

    // Update SWORD Sentry Drones
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const dr = this.drones[i];
      dr.x += dr.speed * dr.dir * dt;
      if (dr.x < dr.minX) { dr.x = dr.minX; dr.dir = 1; }
      if (dr.x > dr.maxX) { dr.x = dr.maxX; dr.dir = -1; }

      // Drone collision with Wanda
      if (Math.hypot(this.player.x - dr.x, this.player.y - dr.y) < this.player.radius + dr.radius) {
        this.health -= 25;
        this.player.vy = -200;
        this.player.vx = -this.player.facing * 200;
        this.shake(8, 0.25);
        if (window.soundFX) window.soundFX.hit();
        this.setHUD({ health: this.health });
        this.spawnComicText('ZAP!', this.player.x, this.player.y - 20, '#ff1744');
        if (this.health <= 0) {
          this.triggerGameOver('Wanda was neutralized by SWORD sentry drones!');
          return;
        }
      }
    }

    // Update Chaos Bolts
    for (let i = this.hexBolts.length - 1; i >= 0; i--) {
      const b = this.hexBolts[i];
      b.x += b.vx * dt;
      b.life -= dt;

      // Check hit with drones
      for (let j = this.drones.length - 1; j >= 0; j--) {
        const dr = this.drones[j];
        if (Math.hypot(b.x - dr.x, b.y - dr.y) < b.radius + dr.radius) {
          this.drones.splice(j, 1);
          b.life = -1;
          this.score += 400;
          this.setHUD({ score: this.score });
          this.shake(6, 0.2);
          if (window.soundFX) window.soundFX.thunder();
          this.spawnComicText('VAPORIZED! +400', dr.x, dr.y - 20, '#ffd200');
          this.spawnHexBurst(dr.x, dr.y, b.color, 12);
          break;
        }
      }

      if (b.life <= 0 || b.x < 0 || b.x > this.vWidth) {
        this.hexBolts.splice(i, 1);
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      sw.radius += (sw.maxRadius - sw.radius) * 8 * dt;
      if (sw.life <= 0) this.shockwaves.splice(i, 1);
    }

    // Falling into the void
    if (this.player.y > this.vHeight + 25) {
      this.health -= 35;
      this.player.x = 70;
      this.player.y = 380;
      this.player.vx = 0;
      this.player.vy = 0;
      this.shake(8, 0.25);
      if (window.soundFX) window.soundFX.hit();
      this.setHUD({ health: this.health });
      if (this.health <= 0) {
        this.triggerGameOver('Wanda was lost in the collapsed reality void!');
        return;
      }
    }

    // Reach Darkhold Altar
    if (Math.hypot(this.player.x - this.altar.x, this.player.y - this.altar.y) < 45) {
      if (this.stage < this.maxStages) {
        this.score += 1200;
        this.initStage(this.stage + 1);
      } else {
        this.score += 4000;
        this.triggerVictory('Scarlet Witch unified Earth-616 and the Hex Reality with the Darkhold!');
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnHexBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * 160 + (Math.random() - 0.5) * 50,
        vy: Math.sin(angle) * 160 + (Math.random() - 0.5) * 50,
        radius: 3 + Math.random() * 2,
        color,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8
      });
    }
  }

  render(ctx) {
    // Dynamic Reality Backdrop
    if (this.polarity === 'RED') {
      // Earth-616 Reality: Midnight Red Mist
      const bgGrad = ctx.createLinearGradient(0, 0, 0, this.vHeight);
      bgGrad.addColorStop(0, '#100508');
      bgGrad.addColorStop(0.6, '#200a12');
      bgGrad.addColorStop(1, '#2d0c18');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.vWidth, this.vHeight);

      // Night skyline silhouette
      ctx.fillStyle = '#15060b';
      ctx.fillRect(120, 240, 70, 220);
      ctx.fillRect(350, 190, 85, 270);
      ctx.fillRect(560, 210, 65, 250);
      ctx.fillRect(720, 170, 95, 290);
    } else {
      // Hex Reality: Neon Synthwave & CRT Scanlines
      const hexGrad = ctx.createLinearGradient(0, 0, 0, this.vHeight);
      hexGrad.addColorStop(0, '#0c0517');
      hexGrad.addColorStop(0.6, '#1a0930');
      hexGrad.addColorStop(1, '#2c0d4a');
      ctx.fillStyle = hexGrad;
      ctx.fillRect(0, 0, this.vWidth, this.vHeight);

      // Warped Hex Grid in background
      ctx.save();
      ctx.strokeStyle = 'rgba(213, 0, 249, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < this.vWidth; x += 40) {
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
      ctx.restore();
    }

    // Draw Shockwave Chromatic Distortion Rings
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 4 * (sw.life / sw.maxLife);
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Platforms
    for (const p of this.platforms) {
      ctx.save();
      const isSolid = p.polarity === 'ALL' || p.polarity === this.polarity;

      if (p.polarity === 'ALL') {
        ctx.fillStyle = '#37474f';
        ctx.strokeStyle = '#ffd200';
      } else if (p.polarity === 'RED') {
        ctx.fillStyle = isSolid ? '#b71c1c' : 'rgba(183, 28, 28, 0.2)';
        ctx.strokeStyle = isSolid ? '#ff5252' : 'rgba(255, 82, 82, 0.2)';
      } else {
        ctx.fillStyle = isSolid ? '#6a1b9a' : 'rgba(106, 27, 154, 0.2)';
        ctx.strokeStyle = isSolid ? '#e040fb' : 'rgba(224, 64, 251, 0.2)';
      }

      ctx.lineWidth = isSolid ? 2.5 : 1;
      if (!isSolid) ctx.setLineDash([4, 4]);

      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Polarity Icon / Label
      ctx.fillStyle = isSolid ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
      ctx.font = "bold 11px 'Bangers'";
      ctx.textAlign = 'center';
      const label = p.polarity === 'ALL' ? 'SHARED' : p.polarity === 'RED' ? 'EARTH-616' : 'HEX REALITY';
      ctx.fillText(label, p.x + p.w / 2, p.y + p.h / 2 + 4);
      ctx.restore();
    }

    // Draw SWORD Sentry Drones
    for (const dr of this.drones) {
      ctx.save();
      ctx.fillStyle = '#37474f';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dr.x, dr.y, dr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red laser scanner eye
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(dr.x, dr.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Rotors
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(dr.x - 18, dr.y - 10);
      ctx.lineTo(dr.x + 18, dr.y - 10);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Chaos Magic Hex Bolts
    for (const b of this.hexBolts) {
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Hexagon energy trail
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Darkhold Altar Core
    ctx.save();
    const aTime = Date.now() * 0.005;
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(this.altar.x, this.altar.y, this.altar.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Hovering Chaos Runes
    for (let i = 0; i < 4; i++) {
      const a = aTime + (i / 4) * Math.PI * 2;
      const rx = this.altar.x + Math.cos(a) * 22;
      const ry = this.altar.y + Math.sin(a) * 22;
      ctx.fillStyle = '#ffd200';
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 11px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText('DARKHOLD', this.altar.x, this.altar.y + 4);
    ctx.restore();

    // Render Procedural Scarlet Witch
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Billowing Dark Red Cape
    const capeWarp = Math.sin(Date.now() * 0.009) * 5;
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(10, -10);
    ctx.quadraticCurveTo(22 + capeWarp, 14, 16 + capeWarp, 28);
    ctx.lineTo(-16 + capeWarp, 28);
    ctx.quadraticCurveTo(-22 + capeWarp, 14, -10, -10);
    ctx.closePath();
    ctx.fill();

    // Long Auburn Hair flowing
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.ellipse(0, -14, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Scarlet Corset Suit)
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, -16, 8, 0, Math.PI * 2);
    ctx.fill();

    // Scarlet Witch Tiara / Horned Crown
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.moveTo(-12, -20);
    ctx.lineTo(-6, -16);
    ctx.lineTo(0, -24); // Center sharp peak
    ctx.lineTo(6, -16);
    ctx.lineTo(12, -20);
    ctx.lineTo(8, -14);
    ctx.lineTo(0, -17);
    ctx.lineTo(-8, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd200';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Crackling Chaos Magic Energy Orbs on Hands
    const orbColor = this.polarity === 'RED' ? '#ff1744' : '#d500f9';
    const orbTime = Date.now() * 0.01;
    ctx.fillStyle = orbColor;
    ctx.shadowColor = orbColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-14, 4 + Math.sin(orbTime) * 3, 5, 0, Math.PI * 2);
    ctx.arc(14, 4 + Math.cos(orbTime) * 3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Action HUD Buttons (Bottom Bar)
    ctx.save();
    // Swap Polarity Button
    ctx.fillStyle = this.polarity === 'RED' ? 'rgba(213, 0, 249, 0.3)' : 'rgba(255, 23, 68, 0.3)';
    ctx.strokeStyle = this.polarity === 'RED' ? '#d500f9' : '#ff1744';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 485, 125, 42, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 12px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText('⚡ SWAP REALITY', 82, 503);
    ctx.font = "bold 9px 'Outfit'";
    ctx.fillStyle = '#ffd200';
    ctx.fillText('[SPACE / TAP]', 82, 517);

    // Chaos Blast Button
    ctx.fillStyle = 'rgba(255, 23, 68, 0.3)';
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(160, 485, 125, 42, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 12px 'Bangers'";
    ctx.fillText('🔥 CHAOS BOLT', 222, 503);
    ctx.font = "bold 9px 'Outfit'";
    ctx.fillStyle = '#ffd200';
    ctx.fillText('[E / X / TAP]', 222, 517);

    // Status
    ctx.fillStyle = this.polarity === 'RED' ? '#ff1744' : '#e040fb';
    ctx.font = "bold 18px 'Bangers', cursive";
    ctx.textAlign = 'left';
    ctx.fillText(`CURRENT: ${this.polarity === 'RED' ? 'EARTH-616 (RED SOLID)' : 'HEX REALITY (PURPLE SOLID)'}`, 310, 514);
    ctx.restore();
  }
}

window.ScarletWitchGame = ScarletWitchGame;
