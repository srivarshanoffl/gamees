/**
 * spider-man.js
 * Game 1: Spider-Man - Web Sling Velocity
 * Mechanic: Pendulum tension rope physics traversal.
 * Hold Click/Tap to attach web to overhead anchor; release to slingshot forward.
 */

class SpiderManGame extends GameEngine {
  constructor() {
    super('gameCanvas', { hasEnergy: true });
    this.gameId = 'spiderman';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.health = 100;
    this.cameraX = 0;

    // Player physics
    this.player = {
      x: 100,
      y: 260,
      vx: 240,
      vy: 0,
      radius: 16,
      attachedAnchor: null,
      webLength: 0,
      angle: 0,
      angularVel: 0
    };

    this.gravity = 550;
    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: this.health });
  }

  initStage(st) {
    this.stage = st;
    this.player.x = 100;
    this.player.y = 250;
    this.player.vx = 220;
    this.player.vy = 0;
    this.player.attachedAnchor = null;
    this.cameraX = 0;

    const length = 3200 + st * 1000;
    this.finishLineX = length;

    // Generate anchor points
    this.anchors = [];
    let curX = 220;
    while (curX < length) {
      this.anchors.push({
        x: curX,
        y: 60 + Math.sin(curX * 0.01) * 35,
        moving: st >= 2 && Math.random() > 0.5,
        baseY: 60 + Math.sin(curX * 0.01) * 35,
        time: Math.random() * 10
      });
      curX += 180 + Math.random() * 80;
    }

    // Collectibles (Web tokens)
    this.tokens = [];
    for (let x = 300; x < length - 200; x += 160) {
      this.tokens.push({
        x: x,
        y: 200 + Math.sin(x * 0.03) * 120,
        collected: false
      });
    }

    // Obstacles (Glider Drones / Laser Beams)
    this.drones = [];
    if (st >= 2) {
      for (let x = 600; x < length - 300; x += 380 - (st * 30)) {
        this.drones.push({
          x: x,
          y: 180 + Math.sin(x) * 100,
          vy: 60,
          minY: 100,
          maxY: 360,
          radius: 18
        });
      }
    }

    this.showAlert(`STAGE ${st}: ${st === 1 ? 'QUEENS SKYLINE' : st === 2 ? 'MIDTOWN CRANES' : 'OSCORP TOWER SPIRE'}`);
  }

  findBestAnchor() {
    let best = null;
    let minD = 350;
    for (const a of this.anchors) {
      // Must be ahead and above player
      const dx = a.x - this.player.x;
      const dy = a.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dx > -30 && dx < 280 && a.y < this.player.y + 20 && dist < minD) {
        minD = dist;
        best = a;
      }
    }
    return best;
  }

  onPointerDown() {
    if (this.state !== 'PLAYING') return;
    const target = this.findBestAnchor();
    if (target) {
      this.player.attachedAnchor = target;
      const dx = this.player.x - target.x;
      const dy = this.player.y - target.y;
      this.player.webLength = Math.max(80, Math.hypot(dx, dy));
      this.player.angle = Math.atan2(dy, dx);
      // Tangential velocity to angular velocity
      const speed = Math.hypot(this.player.vx, this.player.vy);
      this.player.angularVel = (speed / this.player.webLength) * (this.player.vx > 0 ? 1 : -1);

      if (window.soundFX) window.soundFX.thwip();
      this.spawnComicText('THWIP!', this.player.x - this.cameraX, this.player.y - 30, '#ff4747');
      this.shake(2, 0.1);
    }
  }

  onPointerUp() {
    if (this.player.attachedAnchor) {
      // Convert angular motion to linear release velocity
      const tangentX = -Math.sin(this.player.angle);
      const tangentY = Math.cos(this.player.angle);
      const speed = Math.abs(this.player.angularVel) * this.player.webLength;

      this.player.vx = tangentX * speed * 1.15 + 100;
      this.player.vy = tangentY * speed * 1.15;

      this.player.attachedAnchor = null;
      for (let i = 0; i < 6; i++) {
        this.spawnParticle(this.player.x - this.cameraX, this.player.y, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150, '#ffffff');
      }
    }
  }

  update(dt) {
    // Update moving anchors
    for (const a of this.anchors) {
      if (a.moving) {
        a.time += dt;
        a.y = a.baseY + Math.sin(a.time * 2) * 50;
      }
    }

    // Update Drones
    for (const d of this.drones) {
      d.y += d.vy * dt;
      if (d.y > d.maxY || d.y < d.minY) d.vy = -d.vy;

      // Check collision with player
      const dist = Math.hypot(d.x - this.player.x, d.y - this.player.y);
      if (dist < d.radius + this.player.radius) {
        this.player.vx = Math.max(100, this.player.vx * 0.5);
        this.health -= 25;
        this.shake(8, 0.3);
        if (window.soundFX) window.soundFX.hit();
        this.spawnComicText('ZAP!', this.player.x - this.cameraX, this.player.y, '#ffd200');
        this.setHUD({ health: this.health });
        d.x -= 200; // Knock drone away
        if (this.health <= 0) {
          this.triggerGameOver('Spider-Man was knocked out by Oscorp drones!');
          return;
        }
      }
    }

    // Physics update
    if (this.player.attachedAnchor) {
      const a = this.player.attachedAnchor;
      // Pendulum physics with gravity torque
      const angularAccel = (-this.gravity / this.player.webLength) * Math.sin(this.player.angle - Math.PI / 2);
      this.player.angularVel += angularAccel * dt;
      this.player.angularVel *= 0.994; // slight damping
      this.player.angle += this.player.angularVel * dt;

      this.player.x = a.x + Math.cos(this.player.angle) * this.player.webLength;
      this.player.y = a.y + Math.sin(this.player.angle) * this.player.webLength;
    } else {
      // Free flight with gravity
      this.player.vy += this.gravity * dt;
      this.player.x += this.player.vx * dt;
      this.player.y += this.player.vy * dt;
      this.player.vx *= 0.998; // air drag
    }

    // Camera follow player smoothly
    this.cameraX += (this.player.x - 200 - this.cameraX) * 0.1;

    // Token collection
    for (const t of this.tokens) {
      if (!t.collected) {
        const d = Math.hypot(t.x - this.player.x, t.y - this.player.y);
        if (d < 30) {
          t.collected = true;
          this.score += 150;
          this.setHUD({ score: this.score });
          if (window.soundFX) window.soundFX.thwip();
          for (let i = 0; i < 8; i++) {
            this.spawnParticle(t.x - this.cameraX, t.y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, '#ffd200', 4);
          }
        }
      }
    }

    // Ground or out of bounds check
    if (this.player.y > this.vHeight - 30) {
      this.health -= 35;
      this.player.y = this.vHeight - 40;
      this.player.vy = -350;
      this.shake(7, 0.25);
      if (window.soundFX) window.soundFX.hit();
      this.spawnComicText('CRASH!', this.player.x - this.cameraX, this.player.y, '#e23636');
      this.setHUD({ health: this.health });
      if (this.health <= 0) {
        this.triggerGameOver('Spider-Man hit the pavement! Keep your webs attached!');
        return;
      }
    }

    // Ceiling clamp
    if (this.player.y < 30) {
      this.player.y = 30;
      this.player.vy = 50;
    }

    // Stage Clear / Win check
    if (this.player.x >= this.finishLineX) {
      if (this.stage < this.maxStages) {
        this.score += 500;
        this.initStage(this.stage + 1);
        this.setHUD({ score: this.score });
      } else {
        this.score += 1500;
        this.triggerVictory('Spider-Man intercepted the Oscorp heist on the rooftop helipad!');
      }
    }
  }

  render(ctx) {
    // Parallax City Skyline Background
    const bg1 = (this.cameraX * 0.15) % 180;
    const bg2 = (this.cameraX * 0.4) % 240;

    // Deep distant buildings
    ctx.fillStyle = '#0f121d';
    for (let x = -200; x < this.vWidth + 200; x += 90) {
      const bx = x - bg1;
      ctx.fillRect(bx, 180 + Math.sin(x) * 40, 70, 360);
    }

    // Midground buildings with window lights
    ctx.fillStyle = '#171c2b';
    for (let x = -200; x < this.vWidth + 200; x += 130) {
      const bx = x - bg2;
      ctx.fillRect(bx, 240 + Math.cos(x) * 50, 95, 300);
      // Yellow glowing windows
      ctx.fillStyle = 'rgba(255, 210, 0, 0.4)';
      for (let wy = 270; wy < 480; wy += 35) {
        ctx.fillRect(bx + 15, wy, 15, 12);
        ctx.fillRect(bx + 45, wy, 15, 12);
      }
      ctx.fillStyle = '#171c2b';
    }

    // Render Finish Line Beacon
    const finScreenX = this.finishLineX - this.cameraX;
    if (finScreenX > -50 && finScreenX < this.vWidth + 100) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.fillRect(finScreenX - 30, 0, 60, this.vHeight);
      ctx.fillStyle = '#00f0ff';
      ctx.font = "bold 24px 'Bangers', cursive";
      ctx.fillText('FINISH ROOFTOP', finScreenX - 60, 80);
      ctx.restore();
    }

    // Render Anchors (Cranes / Gargoyles)
    for (const a of this.anchors) {
      const sx = a.x - this.cameraX;
      if (sx > -60 && sx < this.vWidth + 60) {
        ctx.save();
        ctx.fillStyle = '#ffd200';
        ctx.beginPath();
        ctx.arc(sx, a.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsing target halo if nearest
        const best = this.findBestAnchor();
        if (best === a && !this.player.attachedAnchor) {
          ctx.strokeStyle = 'rgba(255, 210, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(sx, a.y, 16 + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Render Web Line
    if (this.player.attachedAnchor) {
      const ax = this.player.attachedAnchor.x - this.cameraX;
      const ay = this.player.attachedAnchor.y;
      const px = this.player.x - this.cameraX;
      const py = this.player.y;

      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.restore();
    }

    // Render Tokens
    for (const t of this.tokens) {
      if (!t.collected) {
        const sx = t.x - this.cameraX;
        if (sx > -40 && sx < this.vWidth + 40) {
          ctx.save();
          ctx.fillStyle = '#ff0055';
          ctx.beginPath();
          ctx.arc(sx, t.y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = "bold 12px 'Outfit'";
          ctx.textAlign = 'center';
          ctx.fillText('🕷', sx, t.y + 4);
          ctx.restore();
        }
      }
    }

    // Render Drones
    for (const d of this.drones) {
      const sx = d.x - this.cameraX;
      if (sx > -60 && sx < this.vWidth + 60) {
        ctx.save();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(sx, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(sx - 12, d.y - 3, 24, 6);
        ctx.restore();
      }
    }

    // Render Spider-Man
    const px = this.player.x - this.cameraX;
    const py = this.player.y;
    ctx.save();
    ctx.translate(px, py);

    // Tilt based on velocity or swing angle
    const rot = this.player.attachedAnchor ? (this.player.angle + Math.PI / 2) : (this.player.vy * 0.001);
    ctx.rotate(rot);

    // Torso / Body (Red & Blue)
    ctx.fillStyle = '#d32f2f'; // Marvel Red
    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Blue suit accents
    ctx.fillStyle = '#1976d2';
    ctx.beginPath();
    ctx.arc(0, 4, 10, 0, Math.PI);
    ctx.fill();

    // White Spider eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-6, -4, 4, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(6, -4, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

window.SpiderManGame = SpiderManGame;
