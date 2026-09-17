/**
 * tva-loki.js
 * Game 8: TVA / Loki - Chrono-Paradox Protocol (Deluxe Arcade Edition)
 * Mechanics:
 * - Time-rewind temporal ghost clone cooperation (record actions, rewind, solve co-op puzzles with past self).
 * - Full Procedural Comic Art: God of Stories Loki with golden horned helmet & emerald cape.
 * - Miss Minutes Hologram mascot warnings & live Sacred Timeline branch wave monitor.
 * - Glowing Orange TVA Time Doors, laser security gates, and TVA Reset Charge pedestals.
 */

class TVALokiGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'tvaloki';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.health = 100;
    this.recording = [];
    this.playbackClones = [];
    this.timeInLoop = 0;
    this.maxLoopTime = 12;

    this.player = {
      x: 60,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 18,
      facing: 1,
      isGrounded: false
    };

    this.gravity = 650;
    this.particles = [];
    this.rewindFlash = 0;

    // Miss Minutes mascot speech
    this.missMinutesQuotes = [
      "Hey y'all! Don't let the timeline branch!",
      "Time's tickin'! Hit [R] to loop back!",
      "Teamwork makes the Sacred Timeline work!",
      "Careful now, that's a nexus event!"
    ];
    this.currentQuote = this.missMinutesQuotes[0];
    this.quoteTimer = 4.0;

    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.health });
  }

  initStage(st) {
    this.stage = st;
    this.player.x = 60;
    this.player.y = 400;
    this.player.vx = 0;
    this.player.vy = 0;
    this.recording = [];
    this.playbackClones = [];
    this.timeInLoop = 0;
    this.particles = [];
    this.rewindFlash = 0;

    this.platforms = [
      { x: 0, y: 460, w: 960, h: 80 } // Main Floor
    ];

    if (st === 1) {
      this.switches = [
        { id: 'sw1', x: 280, y: 450, w: 45, h: 12, pressed: false }
      ];
      this.doors = [
        { id: 'd1', x: 480, y: 260, w: 26, h: 200, requires: 'sw1', open: false }
      ];
      this.chargePedestal = { x: 840, y: 410, radius: 26 };
    } else if (st === 2) {
      this.switches = [
        { id: 'sw1', x: 230, y: 450, w: 45, h: 12, pressed: false },
        { id: 'sw2', x: 520, y: 450, w: 45, h: 12, pressed: false }
      ];
      this.doors = [
        { id: 'd1', x: 380, y: 260, w: 26, h: 200, requires: 'sw1', open: false },
        { id: 'd2', x: 690, y: 260, w: 26, h: 200, requires: 'sw2', open: false }
      ];
      this.chargePedestal = { x: 870, y: 410, radius: 26 };
    } else {
      this.platforms.push({ x: 190, y: 320, w: 200, h: 22 });
      this.switches = [
        { id: 'sw1', x: 280, y: 308, w: 45, h: 12, pressed: false },
        { id: 'sw2', x: 550, y: 450, w: 45, h: 12, pressed: false }
      ];
      this.doors = [
        { id: 'd1', x: 440, y: 260, w: 26, h: 200, requires: 'sw1', open: false },
        { id: 'd2', x: 730, y: 260, w: 26, h: 200, requires: 'sw2', open: false }
      ];
      this.chargePedestal = { x: 890, y: 410, radius: 26 };
    }

    this.currentQuote = `Sector ${st}! Cooperate with your past self!`;
    this.quoteTimer = 3.5;
    this.showAlert(`STAGE ${st}: ${st === 1 ? 'TVA TEMPAD VAULT' : st === 2 ? 'CHRONO RELAY GATES' : 'CITADEL AT END OF TIME'}`);
  }

  rewindLoop() {
    if (this.recording.length > 0) {
      if (this.playbackClones.length >= 2) this.playbackClones.shift();
      this.playbackClones.push([...this.recording]);
    }

    this.player.x = 60;
    this.player.y = 400;
    this.player.vx = 0;
    this.player.vy = 0;
    this.recording = [];
    this.timeInLoop = 0;
    this.rewindFlash = 0.4;

    if (window.soundFX) {
      if (window.soundFX.timeRewind) window.soundFX.timeRewind();
      else window.soundFX.portal();
    }

    this.spawnComicText('CHRONO REWIND!', this.player.x + 40, this.player.y - 30, '#00e676');
    this.shake(6, 0.25);

    // Particle shower at spawn
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: 60 + (Math.random() - 0.5) * 30,
        y: 400 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 120,
        vy: -80 - Math.random() * 80,
        radius: 3,
        color: '#00e676',
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  onKeyDown(e) {
    if (e.code === 'KeyR') {
      this.rewindLoop();
    }
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;

    // Check Rewind Button in HUD
    if (y > 480 && x < 180) {
      this.rewindLoop();
      return;
    }

    // Tap Jump
    if (y < 460 && this.player.isGrounded) {
      this.player.vy = -390;
      this.player.isGrounded = false;
      if (window.soundFX) window.soundFX.thwip();
    }
  }

  update(dt) {
    // Rewind flash decay
    if (this.rewindFlash > 0) this.rewindFlash -= dt;

    // Quote timer
    if (this.quoteTimer > 0) {
      this.quoteTimer -= dt;
      if (this.quoteTimer <= 0) {
        this.currentQuote = this.missMinutesQuotes[Math.floor(Math.random() * this.missMinutesQuotes.length)];
        this.quoteTimer = 6.0;
      }
    }

    // Horizontal Movement
    const speed = 250;
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
    if ((this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space']) && this.player.isGrounded) {
      this.player.vy = -390;
      this.player.isGrounded = false;
      if (window.soundFX) window.soundFX.thwip();
    }

    this.player.vy += this.gravity * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    this.player.isGrounded = false;

    // Boundary Clamp
    if (this.player.x < 25) this.player.x = 25;
    if (this.player.x > this.vWidth - 25) this.player.x = this.vWidth - 25;

    // Platform Collisions
    for (const p of this.platforms) {
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

    // Door Collisions
    for (const d of this.doors) {
      if (!d.open) {
        if (
          this.player.x + this.player.radius > d.x &&
          this.player.x - this.player.radius < d.x + d.w &&
          this.player.y + this.player.radius > d.y &&
          this.player.y - this.player.radius < d.y + d.h
        ) {
          // Push player out of closed door
          if (this.player.vx > 0) {
            this.player.x = d.x - this.player.radius;
          } else if (this.player.vx < 0) {
            this.player.x = d.x + d.w + this.player.radius;
          }
          this.player.vx = 0;
        }
      }
    }

    // Record Current Frame
    this.timeInLoop += dt;
    this.recording.push({
      x: this.player.x,
      y: this.player.y,
      facing: this.player.facing,
      isGrounded: this.player.isGrounded,
      time: this.timeInLoop
    });

    // Auto-loop if exceeding max loop time
    if (this.timeInLoop >= this.maxLoopTime) {
      this.rewindLoop();
    }

    // Reset switches pressed state
    for (const sw of this.switches) sw.pressed = false;

    // Active Player Switch Trigger
    for (const sw of this.switches) {
      if (
        this.player.x > sw.x - 5 &&
        this.player.x < sw.x + sw.w + 5 &&
        Math.abs(this.player.y + this.player.radius - sw.y) < 14
      ) {
        sw.pressed = true;
      }
    }

    // Clones Switch Trigger & Motion
    const frameIdx = Math.floor(this.timeInLoop * 60);
    for (const clone of this.playbackClones) {
      if (frameIdx < clone.length) {
        const snap = clone[frameIdx];
        for (const sw of this.switches) {
          if (
            snap.x > sw.x - 5 &&
            snap.x < sw.x + sw.w + 5 &&
            Math.abs(snap.y + this.player.radius - sw.y) < 14
          ) {
            sw.pressed = true;
          }
        }
      }
    }

    // Update Door States Based on Switches
    for (const d of this.doors) {
      const sw = this.switches.find(s => s.id === d.requires);
      d.open = sw ? sw.pressed : false;
    }

    // Reach TVA Reset Charge Pedestal
    if (Math.hypot(this.player.x - this.chargePedestal.x, this.player.y - this.chargePedestal.y) < 45) {
      if (this.stage < this.maxStages) {
        this.score += 1200;
        this.initStage(this.stage + 1);
      } else {
        this.score += 4000;
        this.triggerVictory('Loki restored the Sacred Timeline and ascended to God of Stories!');
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

  render(ctx) {
    // TVA Architectural Office / Citadel Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.vHeight);
    bgGrad.addColorStop(0, '#120d08');
    bgGrad.addColorStop(0.5, '#1e140d');
    bgGrad.addColorStop(1, '#2c1e13');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Sacred Timeline Oscillating Waveform Monitor (Top Bar)
    ctx.save();
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const t = Date.now() * 0.003;
    for (let x = 0; x < this.vWidth; x += 10) {
      const y = 35 + Math.sin(t + x * 0.02) * 12 + Math.cos(t * 1.5 + x * 0.01) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#ff9800';
    ctx.font = "bold 11px 'Bangers'";
    ctx.fillText('SACRED TIMELINE MONITOR: SYNCHRONIZED', 30, 22);
    ctx.restore();

    // TVA Brutalist Columns in Background
    ctx.fillStyle = '#18110b';
    ctx.fillRect(140, 60, 45, 400);
    ctx.fillRect(360, 60, 45, 400);
    ctx.fillRect(640, 60, 45, 400);

    // Platforms
    for (const p of this.platforms) {
      ctx.save();
      const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      pGrad.addColorStop(0, '#3e2723');
      pGrad.addColorStop(1, '#1b0000');
      ctx.fillStyle = pGrad;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.restore();
    }

    // Switches (Chrono Pressure Plates)
    for (const sw of this.switches) {
      ctx.save();
      ctx.fillStyle = sw.pressed ? '#00e676' : '#ff9800';
      ctx.shadowColor = sw.pressed ? '#00e676' : '#ff9800';
      ctx.shadowBlur = 10;
      ctx.fillRect(sw.x, sw.pressed ? sw.y + 4 : sw.y, sw.w, sw.pressed ? sw.h - 4 : sw.h);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sw.x, sw.pressed ? sw.y + 4 : sw.y, sw.w, sw.pressed ? sw.h - 4 : sw.h);

      ctx.fillStyle = '#000';
      ctx.font = "bold 9px 'Bangers'";
      ctx.textAlign = 'center';
      ctx.fillText(sw.pressed ? 'ACTIVE' : 'STAND', sw.x + sw.w / 2, sw.y + 9);
      ctx.restore();
    }

    // TVA Security Laser Doors
    for (const d of this.doors) {
      ctx.save();
      if (!d.open) {
        // Laser Gate Active
        ctx.fillStyle = 'rgba(255, 109, 0, 0.25)';
        ctx.fillRect(d.x, d.y, d.w, d.h);

        ctx.strokeStyle = '#ff3d00';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff3d00';
        ctx.shadowBlur = 14;
        ctx.strokeRect(d.x, d.y, d.w, d.h);

        // Laser grid lines
        for (let ly = d.y + 20; ly < d.y + d.h; ly += 24) {
          ctx.beginPath();
          ctx.moveTo(d.x, ly);
          ctx.lineTo(d.x + d.w, ly);
          ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.font = "bold 10px 'Bangers'";
        ctx.textAlign = 'center';
        ctx.fillText('LOCKED', d.x + d.w / 2, d.y + d.h / 2);
      } else {
        // Retracted / Open Gate Frame
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.w, 15);
        ctx.strokeRect(d.x, d.y + d.h - 15, d.w, 15);

        ctx.fillStyle = '#00e676';
        ctx.font = "bold 10px 'Bangers'";
        ctx.textAlign = 'center';
        ctx.fillText('OPEN', d.x + d.w / 2, d.y + d.h / 2);
      }
      ctx.restore();
    }

    // TVA Reset Charge Pedestal (Objective)
    ctx.save();
    const cPed = this.chargePedestal;
    ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
    ctx.beginPath();
    ctx.arc(cPed.x, cPed.y, cPed.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cPed.x, cPed.y, cPed.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing Orange Reset Charge Cube
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(cPed.x - 10, cPed.y - 10, 20, 20);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cPed.x - 10, cPed.y - 10, 20, 20);

    ctx.fillStyle = '#fff';
    ctx.font = "bold 11px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText('RESET CHARGE', cPed.x, cPed.y + cPed.radius + 16);
    ctx.restore();

    // Render Playback Clones (Holographic Green Variants)
    const frameIdx = Math.floor(this.timeInLoop * 60);
    for (let cIdx = 0; cIdx < this.playbackClones.length; cIdx++) {
      const clone = this.playbackClones[cIdx];
      if (frameIdx < clone.length) {
        const snap = clone[frameIdx];
        this.renderLoki(ctx, snap.x, snap.y, snap.facing, true, cIdx);
      }
    }

    // Render Active Player (God of Stories Loki)
    this.renderLoki(ctx, this.player.x, this.player.y, this.player.facing, false);

    // Miss Minutes Mascot Hologram (Top Right)
    ctx.save();
    const mmX = 890;
    const mmY = 55;

    // Orange Clock Body
    ctx.fillStyle = '#ff6d00';
    ctx.beginPath();
    ctx.arc(mmX, mmY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd180';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Cartoon Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(mmX - 6, mmY - 4, 5, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(mmX + 6, mmY - 4, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(mmX - 5, mmY - 3, 3, 0, Math.PI * 2);
    ctx.arc(mmX + 7, mmY - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Big Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mmX, mmY + 6, 8, 0, Math.PI);
    ctx.stroke();

    // Miss Minutes Speech Bubble
    if (this.quoteTimer > 0) {
      ctx.fillStyle = 'rgba(255, 243, 224, 0.96)';
      ctx.strokeStyle = '#ff6d00';
      ctx.lineWidth = 1.5;
      const bW = 190;
      const bH = 34;
      const bX = mmX - bW - 28;
      const bY = mmY - 14;

      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#bf360c';
      ctx.font = "bold 10px 'Outfit', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(this.currentQuote, bX + 8, bY + 20);
    }
    ctx.restore();

    // Rewind Flash Effect
    if (this.rewindFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 230, 118, ${this.rewindFlash * 0.8})`;
      ctx.fillRect(0, 0, this.vWidth, this.vHeight);
      ctx.restore();
    }

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

    // Action HUD & Chrono Dial (Bottom Bar)
    ctx.save();
    // Rewind Button
    ctx.fillStyle = 'rgba(0, 230, 118, 0.3)';
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 485, 140, 42, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 13px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText('⏳ REWIND LOOP', 90, 503);
    ctx.font = "bold 9px 'Outfit'";
    ctx.fillStyle = '#00e676';
    ctx.fillText('[PRESS R / TAP]', 90, 517);

    // Loop Time Gauge
    const timeRatio = Math.min(1, this.timeInLoop / this.maxLoopTime);
    ctx.fillStyle = '#ff9800';
    ctx.font = "bold 18px 'Bangers', cursive";
    ctx.textAlign = 'left';
    ctx.fillText(`CHRONO BUFFER: ${(this.maxLoopTime - this.timeInLoop).toFixed(1)}s`, 180, 514);

    // Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(340, 500, 180, 12);
    ctx.fillStyle = timeRatio > 0.8 ? '#ff1744' : '#00e676';
    ctx.fillRect(340, 500, 180 * (1 - timeRatio), 12);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(340, 500, 180, 12);

    ctx.font = "bold 12px 'Outfit'";
    ctx.fillStyle = '#aaa';
    ctx.fillText('ACTIVE CLONES: ' + this.playbackClones.length + ' / 2', 540, 513);
    ctx.restore();
  }

  renderLoki(ctx, x, y, facing, isGhost = false, cloneIdx = 0) {
    ctx.save();
    ctx.translate(x, y);

    if (isGhost) {
      ctx.globalAlpha = 0.55;
      // Holographic scanlines
      ctx.shadowColor = cloneIdx === 0 ? '#00e676' : '#00f0ff';
      ctx.shadowBlur = 12;
    }

    // Emerald Green Flowing Cape
    ctx.fillStyle = isGhost ? '#00e676' : '#1b5e20';
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.lineTo(14, 26);
    ctx.lineTo(-14, 26);
    ctx.closePath();
    ctx.fill();

    // Body (TVA Suit / Asgardian Tunic)
    ctx.fillStyle = isGhost ? '#81c784' : '#4e342e';
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = isGhost ? '#a5d6a7' : '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, -16, 8, 0, Math.PI * 2);
    ctx.fill();

    // Golden Horned Helmet
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.arc(0, -18, 9, Math.PI, Math.PI * 2);
    ctx.fill();

    // Curved Horns
    ctx.strokeStyle = '#ffd200';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.quadraticCurveTo(-18, -32, -14, -38);
    ctx.moveTo(6, -20);
    ctx.quadraticCurveTo(18, -32, 14, -38);
    ctx.stroke();

    // Time Baton / Timeline Thread
    ctx.strokeStyle = isGhost ? '#00e676' : '#ff9800';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(facing * 10, -5);
    ctx.lineTo(facing * 18, 15);
    ctx.stroke();

    ctx.restore();
  }
}

window.TVALokiGame = TVALokiGame;
