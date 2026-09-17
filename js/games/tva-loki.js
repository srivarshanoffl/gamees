/**
 * tva-loki.js
 * Game 8: TVA / Loki - Chrono-Paradox Protocol
 * Mechanic: Time-rewind & recorded temporal ghost clone cooperation.
 * Record your actions holding security switches, then hit Rewind (R) so your
 * past variant re-enacts the steps while your active self advances to plant the Reset Charge.
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

    // Temporal Recording
    this.recording = [];
    this.playbackClones = [];
    this.timeInLoop = 0;
    this.maxLoopTime = 10; // seconds per loop

    this.player = {
      x: 60,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 16,
      isGrounded: false
    };

    this.gravity = 650;
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

    this.platforms = [
      { x: 0, y: 460, w: 960, h: 80 } // Main Floor
    ];

    if (st === 1) {
      // 1 switch holding 1 door
      this.switches = [
        { id: 'sw1', x: 260, y: 450, w: 40, h: 10, pressed: false }
      ];
      this.doors = [
        { id: 'd1', x: 480, y: 260, w: 24, h: 200, requires: 'sw1', open: false }
      ];
      this.chargePedestal = { x: 820, y: 410, radius: 24 };
    } else if (st === 2) {
      // 2 switches: Switch 1 opens Door 1; Switch 2 opens Door 2
      this.switches = [
        { id: 'sw1', x: 220, y: 450, w: 40, h: 10, pressed: false },
        { id: 'sw2', x: 500, y: 450, w: 40, h: 10, pressed: false }
      ];
      this.doors = [
        { id: 'd1', x: 380, y: 260, w: 24, h: 200, requires: 'sw1', open: false },
        { id: 'd2', x: 680, y: 260, w: 24, h: 200, requires: 'sw2', open: false }
      ];
      this.chargePedestal = { x: 860, y: 410, radius: 24 };
    } else {
      // Stage 3: Citadel Vault (Upper platform + 2 gates)
      this.platforms.push({ x: 200, y: 320, w: 180, h: 20 });
      this.switches = [
        { id: 'sw1', x: 280, y: 310, w: 40, h: 10, pressed: false },
        { id: 'sw2', x: 540, y: 450, w: 40, h: 10, pressed: false }
      ];
      this.doors = [
        { id: 'd1', x: 440, y: 260, w: 24, h: 200, requires: 'sw1', open: false },
        { id: 'd2', x: 720, y: 260, w: 24, h: 200, requires: 'sw2', open: false }
      ];
      this.chargePedestal = { x: 880, y: 410, radius: 24 };
    }

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'TVA TEMPAD VAULT' : st === 2 ? 'CHRONO RELAY GATES' : 'CITADEL AT END OF TIME'}`);
  }

  rewindLoop() {
    if (this.recording.length > 0) {
      // Save current recording as a new playback clone (up to 2 clones)
      if (this.playbackClones.length >= 2) this.playbackClones.shift();
      this.playbackClones.push([...this.recording]);
    }

    // Reset player position and record buffer
    this.player.x = 60;
    this.player.y = 400;
    this.player.vx = 0;
    this.player.vy = 0;
    this.recording = [];
    this.timeInLoop = 0;

    if (window.soundFX) window.soundFX.timeRewind();
    this.spawnComicText('TIME-SLIP!', this.player.x, this.player.y - 30, '#ffd200');
    this.shake(5, 0.2);
  }

  onKeyDown(e) {
    if (e.code === 'KeyR') {
      this.rewindLoop();
    }
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING') return;
    // Tap top area or rewind icon
    if (y < 120 && x > 700) {
      this.rewindLoop();
    }
  }

  update(dt) {
    this.timeInLoop += dt;

    // Movement
    let dir = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dir -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dir += 1;

    if (this.pointer.isDown && this.pointer.y > 150) {
      dir = this.pointer.x > this.player.x + 10 ? 1 : this.pointer.x < this.player.x - 10 ? -1 : 0;
    }

    this.player.vx = dir * 220;

    // Jump
    const wantsJump = this.keys['KeyW'] || this.keys['Space'] || this.keys['ArrowUp'];
    if (wantsJump && this.player.isGrounded) {
      this.player.vy = -380;
      this.player.isGrounded = false;
    }

    // Gravity
    this.player.vy += this.gravity * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Record player state
    this.recording.push({
      x: this.player.x,
      y: this.player.y,
      time: this.timeInLoop
    });

    // Platform Collisions for Player
    this.player.isGrounded = false;
    for (const p of this.platforms) {
      if (
        this.player.x + this.player.radius > p.x &&
        this.player.x - this.player.radius < p.x + p.w &&
        this.player.y + this.player.radius > p.y &&
        this.player.y - this.player.radius < p.y + p.h
      ) {
        if (this.player.vy > 0 && this.player.y < p.y + 15) {
          this.player.y = p.y - this.player.radius;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
      }
    }

    // Door Collisions for Player
    for (const d of this.doors) {
      if (!d.open) {
        if (
          this.player.x + this.player.radius > d.x &&
          this.player.x - this.player.radius < d.x + d.w &&
          this.player.y + this.player.radius > d.y &&
          this.player.y - this.player.radius < d.y + d.h
        ) {
          this.player.x = d.x - this.player.radius;
        }
      }
    }

    // Evaluate switches (Check both active player and playback clones)
    for (const s of this.switches) {
      let isPressed = false;
      // Check current player
      if (Math.abs(this.player.x - s.x) < 30 && Math.abs(this.player.y - s.y) < 30) {
        isPressed = true;
      }
      // Check playback clones
      for (const cloneTrack of this.playbackClones) {
        const frameIdx = Math.min(cloneTrack.length - 1, Math.floor(this.timeInLoop * 60));
        if (frameIdx >= 0 && cloneTrack[frameIdx]) {
          const clonePos = cloneTrack[frameIdx];
          if (Math.abs(clonePos.x - s.x) < 30 && Math.abs(clonePos.y - s.y) < 30) {
            isPressed = true;
          }
        }
      }
      s.pressed = isPressed;

      // Update corresponding doors
      for (const d of this.doors) {
        if (d.requires === s.id) {
          d.open = isPressed;
        }
      }
    }

    // Plant Reset Charge on Pedestal
    if (Math.hypot(this.player.x - this.chargePedestal.x, this.player.y - this.chargePedestal.y) < 35) {
      if (this.stage < this.maxStages) {
        this.score += 850;
        this.initStage(this.stage + 1);
        this.setHUD({ score: this.score });
      } else {
        this.score += 3000;
        this.triggerVictory('Loki detonated the Reset Charge and pruned the corrupted timeline!');
      }
    }

    // Auto-loop limit
    if (this.timeInLoop >= this.maxLoopTime) {
      this.rewindLoop();
    }
  }

  render(ctx) {
    // TVA Retro-Futuristic Amber Background
    ctx.fillStyle = '#1c150c';
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Timeline branch oscilloscope lines
    ctx.strokeStyle = 'rgba(255, 171, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < this.vWidth; x += 20) {
      const y = 80 + Math.sin(x * 0.02 + Date.now() * 0.002) * 25;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Render Platforms
    ctx.fillStyle = '#2d2114';
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    for (const p of this.platforms) {
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }

    // Render Switches
    for (const s of this.switches) {
      ctx.fillStyle = s.pressed ? '#00e676' : '#ffab00';
      ctx.fillRect(s.x - 20, s.y - 4, 40, 8);
      ctx.fillStyle = '#fff';
      ctx.font = "bold 11px 'Outfit'";
      ctx.textAlign = 'center';
      ctx.fillText(s.pressed ? 'ACTIVE' : 'SWITCH', s.x, s.y - 10);
    }

    // Render Doors
    for (const d of this.doors) {
      ctx.save();
      ctx.fillStyle = d.open ? 'rgba(0, 230, 118, 0.2)' : '#d50000';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = d.open ? '#00e676' : '#ff5252';
      ctx.lineWidth = 3;
      ctx.strokeRect(d.x, d.y, d.w, d.h);
      ctx.restore();
    }

    // Render Reset Charge Pedestal
    ctx.save();
    ctx.fillStyle = '#ffab00';
    ctx.shadowColor = '#ffab00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.chargePedestal.x, this.chargePedestal.y, this.chargePedestal.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = "bold 12px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText('RESET', this.chargePedestal.x, this.chargePedestal.y + 4);
    ctx.restore();

    // Render Playback Clones (Variants / Echoes)
    for (const cloneTrack of this.playbackClones) {
      const frameIdx = Math.min(cloneTrack.length - 1, Math.floor(this.timeInLoop * 60));
      if (frameIdx >= 0 && cloneTrack[frameIdx]) {
        const c = cloneTrack[frameIdx];
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#ffab00'; // Amber ghost
        ctx.beginPath();
        ctx.arc(c.x, c.y, this.player.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = "bold 10px 'Outfit'";
        ctx.textAlign = 'center';
        ctx.fillText('ECHO', c.x, c.y + 3);
        ctx.restore();
      }
    }

    // Render Active Loki
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // TVA Beige Jacket
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e7d32'; // Loki Green collar
    ctx.lineWidth = 3;
    ctx.stroke();

    // Loki Horns
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(-14, -22);
    ctx.lineTo(-6, -14);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.lineTo(14, -22);
    ctx.lineTo(6, -14);
    ctx.fill();

    ctx.restore();

    // Timeline Timer Bar at Top
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(20, 20, 260, 36);
    ctx.strokeStyle = '#ffab00';
    ctx.strokeRect(20, 20, 260, 36);

    const timePct = Math.max(0, (this.maxLoopTime - this.timeInLoop) / this.maxLoopTime);
    ctx.fillStyle = '#ffab00';
    ctx.fillRect(24, 24, 252 * timePct, 28);

    ctx.fillStyle = '#fff';
    ctx.font = "bold 14px 'Bangers', cursive";
    ctx.fillText(`CHRONO LOOP: ${(this.maxLoopTime - this.timeInLoop).toFixed(1)}s`, 35, 43);

    // Rewind Button
    ctx.fillStyle = '#ffab00';
    ctx.fillRect(800, 20, 140, 36);
    ctx.fillStyle = '#000';
    ctx.font = "bold 16px 'Bangers'";
    ctx.textAlign = 'center';
    ctx.fillText('REWIND [R]', 870, 44);
    ctx.restore();
  }
}

window.TVALokiGame = TVALokiGame;
