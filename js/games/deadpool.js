/**
 * deadpool.js
 * Game 10: Deadpool - Multiverse Demolition (Deluxe Arcade Edition)
 * Mechanics:
 * - Ballistic physics destruction with aiming trajectory prediction arc.
 * - 3 Selectable Ordnance Types:
 *     [1] Maximum Effort Cannonball (Crushes wood, high kinetic impact)
 *     [2] Chimichanga Cluster Bomb (Splits into 4 mini-explosives on contact)
 *     [3] Katana Rocket (Precision hyper-velocity armor piercer against steel)
 * - Procedural Comic Art: Expressive Deadpool with twin katanas, Kingpin with tuxedo & cigar smoke.
 * - Dynamic Debris & Particle FX, Screen Shake, and 4th-Wall Breaking Quips.
 */

class DeadpoolGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'deadpool';
    this.reset();
  }

  reset() {
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.totalShotsFired = 0;

    // Slingshot origin
    this.slingshot = { x: 155, y: 360 };

    // Ordnance types: 'HEAVY', 'CLUSTER', 'ROCKET'
    this.ordnanceTypes = [
      { id: 'HEAVY', name: 'MAX EFFORT CANNON', icon: '💣', color: '#ff1744', mass: 1.6, speedMult: 8.8, desc: 'Heavy kinetic punch' },
      { id: 'CLUSTER', name: 'CHIMICHANGA BOMB', icon: '🌯', color: '#ffd200', mass: 1.0, speedMult: 8.2, desc: 'Splits into 4 bomblets' },
      { id: 'ROCKET', name: 'KATANA ROCKET', icon: '🚀', color: '#00f0ff', mass: 1.2, speedMult: 11.5, desc: 'High-velocity steel piercer' }
    ];
    this.selectedOrdnanceIdx = 0;

    // Quips
    this.quips = [
      "Maximum effort, minimal planning!",
      "Did somebody order a chimichanga?",
      "Hey player! Don't embarrass me in 4K!",
      "Physics? Never heard of her!",
      "Aim for the big guy's expensive suit!",
      "I heal fast, but my pride doesn't!"
    ];
    this.currentQuip = this.quips[0];
    this.quipTimer = 4.0;

    // Particles & Debris
    this.particles = [];
    this.bomblets = [];
    this.smokeEmitters = [];

    this.initStage(this.stage);
    this.setHUD({ score: this.score, stage: this.stage, health: 100 });
  }

  initStage(st) {
    this.stage = st;
    this.shotsLeft = 3;
    this.projectile = null;
    this.isAiming = false;
    this.dragPos = { x: this.slingshot.x, y: this.slingshot.y };
    this.groundY = 460;
    this.bomblets = [];

    // Construct Destructible Tower Architecture
    this.blocks = [];
    const towerX = 660;

    if (st === 1) {
      // Stage 1: Wood & Brick Fortress
      this.blocks.push({ x: towerX - 35, y: 400, w: 22, h: 60, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX + 35, y: 400, w: 22, h: 60, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 55, y: 380, w: 130, h: 20, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });

      this.blocks.push({ x: towerX - 25, y: 320, w: 22, h: 60, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX + 25, y: 320, w: 22, h: 60, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 45, y: 300, w: 110, h: 20, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });

      // Target Pod: Kingpin
      this.targetPod = {
        x: towerX + 10,
        y: 250,
        radius: 28,
        vx: 0,
        vy: 0,
        hp: 100,
        toppled: false,
        angle: 0,
        vRot: 0
      };
    } else if (st === 2) {
      // Stage 2: Steel Beams & Volatile TNT Barrels
      this.blocks.push({ x: towerX - 45, y: 375, w: 26, h: 85, vx: 0, vy: 0, hp: 2, type: 'steel', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX + 45, y: 375, w: 26, h: 85, vx: 0, vy: 0, hp: 2, type: 'steel', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 12, y: 410, w: 24, h: 50, vx: 0, vy: 0, hp: 1, type: 'tnt', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 65, y: 355, w: 155, h: 20, vx: 0, vy: 0, hp: 2, type: 'steel', angle: 0, vRot: 0 });

      this.blocks.push({ x: towerX - 30, y: 275, w: 22, h: 80, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX + 30, y: 275, w: 22, h: 80, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 50, y: 255, w: 125, h: 20, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });

      this.targetPod = {
        x: towerX + 10,
        y: 210,
        radius: 28,
        vx: 0,
        vy: 0,
        hp: 150,
        toppled: false,
        angle: 0,
        vRot: 0
      };
    } else {
      // Stage 3: Master Multiverse Void Spire
      this.blocks.push({ x: towerX - 65, y: 355, w: 28, h: 105, vx: 0, vy: 0, hp: 3, type: 'steel', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX + 65, y: 355, w: 28, h: 105, vx: 0, vy: 0, hp: 3, type: 'steel', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 16, y: 405, w: 32, h: 55, vx: 0, vy: 0, hp: 1, type: 'tnt', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 85, y: 335, w: 195, h: 20, vx: 0, vy: 0, hp: 2, type: 'steel', angle: 0, vRot: 0 });

      this.blocks.push({ x: towerX - 45, y: 245, w: 24, h: 90, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX + 45, y: 245, w: 24, h: 90, vx: 0, vy: 0, hp: 1, type: 'wood', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 14, y: 280, w: 28, h: 55, vx: 0, vy: 0, hp: 1, type: 'tnt', angle: 0, vRot: 0 });
      this.blocks.push({ x: towerX - 60, y: 225, w: 145, h: 20, vx: 0, vy: 0, hp: 2, type: 'steel', angle: 0, vRot: 0 });

      this.targetPod = {
        x: towerX + 10,
        y: 175,
        radius: 30,
        vx: 0,
        vy: 0,
        hp: 200,
        toppled: false,
        angle: 0,
        vRot: 0
      };
    }

    this.currentQuip = `Stage ${st}! Let's knock Kingpin off his high horse!`;
    this.quipTimer = 3.5;
    this.showAlert(`STAGE ${st}: ${st === 1 ? 'WOODEN CITADEL' : st === 2 ? 'REINFORCED BUNKER' : 'MULTIVERSE VOID SPIRE'}`);
  }

  cycleOrdnance(direction = 1) {
    if (this.projectile || this.isAiming) return;
    this.selectedOrdnanceIdx = (this.selectedOrdnanceIdx + direction + this.ordnanceTypes.length) % this.ordnanceTypes.length;
    const ord = this.ordnanceTypes[this.selectedOrdnanceIdx];
    this.spawnComicText(ord.name, this.slingshot.x + 30, this.slingshot.y - 40, ord.color);
    if (window.soundFX) window.soundFX.shieldBounce();
  }

  onKeyDown(e) {
    if (e.code === 'Digit1' || e.code === 'KeyQ') {
      this.selectedOrdnanceIdx = 0;
      if (window.soundFX) window.soundFX.shieldBounce();
    } else if (e.code === 'Digit2' || e.code === 'KeyW') {
      this.selectedOrdnanceIdx = 1;
      if (window.soundFX) window.soundFX.shieldBounce();
    } else if (e.code === 'Digit3' || e.code === 'KeyE') {
      this.selectedOrdnanceIdx = 2;
      if (window.soundFX) window.soundFX.shieldBounce();
    } else if (e.code === 'KeyT') {
      this.cycleOrdnance(1);
    }
  }

  onPointerDown(x, y) {
    if (this.state !== 'PLAYING' || this.projectile || this.shotsLeft <= 0) return;

    // Check click on ammo selector icons in canvas
    if (y > 480 && x < 320) {
      if (x < 110) this.selectedOrdnanceIdx = 0;
      else if (x < 210) this.selectedOrdnanceIdx = 1;
      else this.selectedOrdnanceIdx = 2;
      if (window.soundFX) window.soundFX.shieldBounce();
      return;
    }

    // Slingshot grab zone
    if (Math.hypot(x - this.slingshot.x, y - this.slingshot.y) < 80) {
      this.isAiming = true;
      this.dragPos = { x, y };
      this.currentQuip = "Lock and load, baby!";
      this.quipTimer = 2.0;
    }
  }

  onPointerMove(x, y) {
    if (this.isAiming) {
      const dx = x - this.slingshot.x;
      const dy = y - this.slingshot.y;
      const dist = Math.min(105, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      this.dragPos = {
        x: this.slingshot.x + Math.cos(angle) * dist,
        y: this.slingshot.y + Math.sin(angle) * dist
      };
    }
  }

  onPointerUp() {
    if (this.isAiming) {
      this.isAiming = false;
      const dx = this.slingshot.x - this.dragPos.x;
      const dy = this.slingshot.y - this.dragPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 15) return; // Too short pull

      const ord = this.ordnanceTypes[this.selectedOrdnanceIdx];
      const speed = dist * ord.speedMult;

      this.projectile = {
        type: ord.id,
        x: this.slingshot.x,
        y: this.slingshot.y,
        vx: dx * ord.speedMult,
        vy: dy * ord.speedMult,
        radius: ord.id === 'HEAVY' ? 16 : ord.id === 'ROCKET' ? 12 : 14,
        mass: ord.mass,
        color: ord.color,
        angle: Math.atan2(dy, dx),
        trail: [],
        life: 0
      };

      this.shotsLeft--;
      this.totalShotsFired++;

      if (window.soundFX) {
        if (ord.id === 'ROCKET') window.soundFX.repulsor();
        else if (ord.id === 'CLUSTER') window.soundFX.deadpoolWhistle();
        else window.soundFX.thwip();
      }

      this.spawnComicText('MAXIMUM EFFORT!', this.slingshot.x, this.slingshot.y - 45, '#ff1744');
      this.shake(4, 0.2);

      // Quip on fire
      const fireQuips = ["Incoming delivery!", "Hold my chimichanga!", "Strike!", "Special delivery for Kingpin!"];
      this.currentQuip = fireQuips[Math.floor(Math.random() * fireQuips.length)];
      this.quipTimer = 2.5;
    }
  }

  update(dt) {
    const gravity = 620;

    // Quip update
    if (this.quipTimer > 0) {
      this.quipTimer -= dt;
    }

    // Kingpin cigar smoke
    if (this.targetPod && !this.targetPod.toppled && Math.random() < 0.2) {
      this.particles.push({
        x: this.targetPod.x + 14,
        y: this.targetPod.y - 10,
        vx: (Math.random() - 0.5) * 15,
        vy: -20 - Math.random() * 20,
        radius: 3 + Math.random() * 3,
        color: 'rgba(200, 200, 210, 0.6)',
        life: 1.2,
        maxLife: 1.2
      });
    }

    // Update Main Flying Projectile
    if (this.projectile) {
      this.projectile.life += dt;
      this.projectile.vy += gravity * dt;
      this.projectile.x += this.projectile.vx * dt;
      this.projectile.y += this.projectile.vy * dt;
      this.projectile.angle = Math.atan2(this.projectile.vy, this.projectile.vx);

      this.projectile.trail.unshift({ x: this.projectile.x, y: this.projectile.y });
      if (this.projectile.trail.length > 12) this.projectile.trail.pop();

      // Smoke / flame tail
      if (this.projectile.type === 'ROCKET' && Math.random() < 0.8) {
        this.particles.push({
          x: this.projectile.x - Math.cos(this.projectile.angle) * 15,
          y: this.projectile.y - Math.sin(this.projectile.angle) * 15,
          vx: -this.projectile.vx * 0.15 + (Math.random() - 0.5) * 30,
          vy: -this.projectile.vy * 0.15 + (Math.random() - 0.5) * 30,
          radius: 4 + Math.random() * 4,
          color: Math.random() < 0.5 ? '#ff9100' : '#ff1744',
          life: 0.4,
          maxLife: 0.4
        });
      }

      // Check hit with blocks
      for (const b of this.blocks) {
        if (b.hp <= 0) continue;
        if (
          this.projectile.x + this.projectile.radius > b.x &&
          this.projectile.x - this.projectile.radius < b.x + b.w &&
          this.projectile.y + this.projectile.radius > b.y &&
          this.projectile.y - this.projectile.radius < b.y + b.h
        ) {
          // Kinetic Impact
          const impact = Math.hypot(this.projectile.vx, this.projectile.vy);
          b.vx = this.projectile.vx * (this.projectile.mass * 0.35);
          b.vy = this.projectile.vy * (this.projectile.mass * 0.25);
          b.vRot = (Math.random() - 0.5) * 4;

          // Damage logic based on ordnance type
          if (this.projectile.type === 'ROCKET') {
            b.hp -= 3; // Shreds steel
            this.spawnDebris(b.x + b.w / 2, b.y + b.h / 2, 'steel', 10);
          } else if (this.projectile.type === 'HEAVY') {
            b.hp -= 2;
            this.spawnDebris(b.x + b.w / 2, b.y + b.h / 2, b.type, 8);
          } else {
            b.hp -= 1;
            this.spawnDebris(b.x + b.w / 2, b.y + b.h / 2, b.type, 5);
          }

          this.shake(7, 0.25);
          if (window.soundFX) window.soundFX.hit();

          if (b.type === 'tnt') {
            this.explodeTNT(b);
          } else {
            this.spawnComicText(this.projectile.type === 'ROCKET' ? 'SHRED!' : 'WHAM!', b.x, b.y - 10, '#ffd200');
          }

          // Cluster Bomb detonates into bomblets!
          if (this.projectile.type === 'CLUSTER') {
            this.detonateCluster(this.projectile.x, this.projectile.y);
            this.projectile = null;
            break;
          }

          // Slow down projectile after impact
          this.projectile.vx *= 0.35;
          this.projectile.vy *= 0.35;
          if (Math.hypot(this.projectile.vx, this.projectile.vy) < 80) {
            this.projectile = null;
          }
          break;
        }
      }

      // Check hit with Target Pod (Kingpin)
      if (this.projectile && Math.hypot(this.projectile.x - this.targetPod.x, this.projectile.y - this.targetPod.y) < this.projectile.radius + this.targetPod.radius) {
        const kineticFactor = this.projectile.mass * 0.75;
        this.targetPod.vx = this.projectile.vx * kineticFactor;
        this.targetPod.vy = this.projectile.vy * kineticFactor;
        this.targetPod.vRot = (this.projectile.vx > 0 ? 1 : -1) * 3.5;

        this.shake(12, 0.35);
        if (window.soundFX) window.soundFX.hit();

        if (this.projectile.type === 'CLUSTER') {
          this.detonateCluster(this.targetPod.x, this.targetPod.y);
          this.projectile = null;
        } else {
          this.spawnComicText('BAM!', this.targetPod.x, this.targetPod.y - 20, '#ff1744');
          this.projectile = null;
        }

        this.currentQuip = "Direct hit on Kingpin! Timberrrr!";
        this.quipTimer = 3.0;
      }

      // Ground or out-of-bounds check
      if (this.projectile && (this.projectile.y > this.groundY - 10 || this.projectile.x > this.vWidth + 60 || this.projectile.x < -40)) {
        if (this.projectile.type === 'CLUSTER') {
          this.detonateCluster(this.projectile.x, Math.min(this.groundY - 10, this.projectile.y));
        } else {
          this.spawnDebris(this.projectile.x, this.groundY - 5, 'ground', 6);
        }
        this.projectile = null;
      }
    }

    // Update Bomblets (Chimichanga Cluster)
    for (let i = this.bomblets.length - 1; i >= 0; i--) {
      const bl = this.bomblets[i];
      bl.vy += gravity * dt;
      bl.x += bl.vx * dt;
      bl.y += bl.vy * dt;
      bl.life -= dt;

      // Trail
      if (Math.random() < 0.4) {
        this.particles.push({
          x: bl.x,
          y: bl.y,
          vx: 0,
          vy: -10,
          radius: 3,
          color: '#ffd200',
          life: 0.3,
          maxLife: 0.3
        });
      }

      // Hit blocks
      for (const b of this.blocks) {
        if (b.hp <= 0) continue;
        if (bl.x > b.x && bl.x < b.x + b.w && bl.y > b.y && bl.y < b.y + b.h) {
          b.vx += bl.vx * 0.4;
          b.vy += bl.vy * 0.3;
          b.hp -= 1;
          this.explodeMini(bl.x, bl.y);
          bl.life = -1;
          break;
        }
      }

      // Hit Kingpin
      if (bl.life > 0 && Math.hypot(bl.x - this.targetPod.x, bl.y - this.targetPod.y) < bl.radius + this.targetPod.radius) {
        this.targetPod.vx += bl.vx * 0.5;
        this.targetPod.vy += bl.vy * 0.4;
        this.explodeMini(bl.x, bl.y);
        bl.life = -1;
      }

      if (bl.y >= this.groundY - 5 || bl.life <= 0) {
        if (bl.y >= this.groundY - 5) this.explodeMini(bl.x, this.groundY - 5);
        this.bomblets.splice(i, 1);
      }
    }

    // Update Blocks Physics
    for (const b of this.blocks) {
      if (b.hp <= 0) continue;
      b.vy += gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.vRot * dt;
      b.vx *= 0.96;
      b.vRot *= 0.95;

      if (b.y + b.h > this.groundY) {
        b.y = this.groundY - b.h;
        b.vy = 0;
        b.vx *= 0.85; // Ground friction
      }
    }

    // Update Target Pod (Kingpin) Physics
    this.targetPod.vy += gravity * dt;
    this.targetPod.x += this.targetPod.vx * dt;
    this.targetPod.y += this.targetPod.vy * dt;
    this.targetPod.angle += this.targetPod.vRot * dt;
    this.targetPod.vx *= 0.97;
    this.targetPod.vRot *= 0.96;

    if (this.targetPod.y + this.targetPod.radius > this.groundY) {
      this.targetPod.y = this.groundY - this.targetPod.radius;
      this.targetPod.vy = -this.targetPod.vy * 0.3; // bounce
      this.targetPod.toppled = true;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Check Win Condition: Kingpin toppled to floor
    if (this.targetPod.toppled) {
      if (this.stage < this.maxStages) {
        const bonus = 1000 + this.shotsLeft * 500;
        this.score += bonus;
        this.currentQuip = `Stage cleared! +${bonus} bonus!`;
        this.spawnComicText(`+${bonus} PTS`, 480, 200, '#00ff88');
        this.initStage(this.stage + 1);
        this.setHUD({ score: this.score });
      } else {
        this.score += 4000 + this.shotsLeft * 1000;
        this.triggerVictory('Deadpool demolished Kingpin’s Multiverse Spire into the Void!');
      }
      return;
    }

    // Check Loss Condition: Out of ammo & Kingpin still standing
    if (!this.projectile && this.bomblets.length === 0 && this.shotsLeft <= 0 && !this.targetPod.toppled) {
      this.triggerGameOver('Deadpool ran out of multiversal ordnance! Kingpin still stands.');
    }
  }

  detonateCluster(x, y) {
    if (window.soundFX) window.soundFX.clusterBurst();
    this.shake(9, 0.3);
    this.spawnComicText('CHIMICHANGA BURST!', x, y - 30, '#ffd200');

    // Spawn 4 mini-bomblets with radial scatter
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 240 + Math.random() * 120;
      this.bomblets.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120,
        radius: 8,
        life: 1.8
      });
    }

    this.spawnDebris(x, y, 'tnt', 14);
  }

  explodeMini(x, y) {
    this.shake(4, 0.15);
    if (window.soundFX) window.soundFX.hit();
    this.spawnDebris(x, y, 'fire', 8);
  }

  explodeTNT(tntBlock) {
    this.shake(16, 0.5);
    if (window.soundFX) {
      window.soundFX.thunder();
      if (window.soundFX.clusterBurst) window.soundFX.clusterBurst();
    }
    this.spawnComicText('KRAK-BOOM!', tntBlock.x, tntBlock.y - 20, '#ff1744');
    this.spawnDebris(tntBlock.x + tntBlock.w / 2, tntBlock.y + tntBlock.h / 2, 'fire', 25);

    // Blast all nearby blocks with radial force
    for (const b of this.blocks) {
      if (b === tntBlock || b.hp <= 0) continue;
      const dx = (b.x + b.w / 2) - (tntBlock.x + tntBlock.w / 2);
      const dy = (b.y + b.h / 2) - (tntBlock.y + tntBlock.h / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < 220) {
        const force = (1 - dist / 220) * 550;
        b.vx += (dx / dist) * force;
        b.vy += (dy / dist) * force - 150;
        b.vRot = (Math.random() - 0.5) * 8;
        b.hp -= 2;
      }
    }

    // Blast Target Pod
    const podDx = this.targetPod.x - (tntBlock.x + tntBlock.w / 2);
    const podDy = this.targetPod.y - (tntBlock.y + tntBlock.h / 2);
    const podDist = Math.hypot(podDx, podDy);
    if (podDist < 250) {
      const force = (1 - podDist / 250) * 600;
      this.targetPod.vx += (podDx / podDist) * force;
      this.targetPod.vy += (podDy / podDist) * force - 200;
      this.targetPod.vRot = 6;
    }

    tntBlock.hp = 0;
  }

  spawnDebris(x, y, type, count = 8) {
    for (let i = 0; i < count; i++) {
      let color = '#8d6e63';
      if (type === 'steel') color = Math.random() < 0.5 ? '#b0bec5' : '#78909c';
      else if (type === 'fire' || type === 'tnt') color = Math.random() < 0.5 ? '#ff5252' : '#ffd200';
      else if (type === 'ground') color = '#37283c';

      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 350,
        vy: -150 - Math.random() * 250,
        radius: 2 + Math.random() * 4,
        color: color,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4
      });
    }
  }

  render(ctx) {
    // Atmospheric Wasteland Void Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.vHeight);
    bgGrad.addColorStop(0, '#0d0714');
    bgGrad.addColorStop(0.6, '#180d24');
    bgGrad.addColorStop(1, '#251336');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Multiverse Void Portals & Shattered Skyscrapers in background
    ctx.save();
    ctx.fillStyle = 'rgba(255, 23, 68, 0.08)';
    ctx.beginPath();
    ctx.arc(700, 160, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1b1222';
    ctx.fillRect(440, 200, 65, 260);
    ctx.fillRect(520, 250, 50, 210);
    ctx.fillRect(790, 180, 80, 280);
    ctx.fillRect(890, 230, 60, 230);
    ctx.restore();

    // Ground Platform with comic trim
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, this.vHeight);
    groundGrad.addColorStop(0, '#2d1830');
    groundGrad.addColorStop(1, '#15091a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, this.vWidth, this.vHeight - this.groundY);

    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.vWidth, this.groundY);
    ctx.stroke();

    // Slingshot Platform
    ctx.fillStyle = '#4a283e';
    ctx.fillRect(100, 420, 110, 40);
    ctx.strokeStyle = '#2b1222';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 420, 110, 40);

    // Draw Destructible Tower Blocks
    for (const b of this.blocks) {
      if (b.hp <= 0) continue;
      ctx.save();
      ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
      ctx.rotate(b.angle);

      if (b.type === 'wood') {
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 2;
        ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
        // Wood planks texture
        ctx.beginPath();
        ctx.moveTo(-b.w / 2, 0);
        ctx.lineTo(b.w / 2, 0);
        ctx.stroke();
      } else if (b.type === 'steel') {
        ctx.fillStyle = '#90a4ae';
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
        // Steel rivets
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(-b.w / 2 + 5, -b.h / 2 + 5, 2, 0, Math.PI * 2);
        ctx.arc(b.w / 2 - 5, b.h / 2 - 5, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'tnt') {
        ctx.fillStyle = '#d50000';
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.strokeStyle = '#ffd200';
        ctx.lineWidth = 2;
        ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);

        ctx.fillStyle = '#ffd200';
        ctx.font = "bold 13px 'Bangers'";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 0, 0);
      }

      ctx.restore();
    }

    // Draw Target Pod: KINGPIN
    if (this.targetPod) {
      ctx.save();
      ctx.translate(this.targetPod.x, this.targetPod.y);
      ctx.rotate(this.targetPod.angle);

      // Kingpin Body: Imposing White Silk Tuxedo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.targetPod.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Purple Vest Lapels & Ascot
      ctx.fillStyle = '#4a148c';
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(10, -15);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();

      // Diamond Pin
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Bald Head & Brow
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(0, -14, 11, 0, Math.PI * 2);
      ctx.fill();

      // Sinister Brow & Eyes
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, -16);
      ctx.lineTo(-2, -14);
      ctx.moveTo(7, -16);
      ctx.lineTo(2, -14);
      ctx.stroke();

      // Glowing Cigar
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(3, -11, 8, 3);
      ctx.fillStyle = '#ff3d00';
      ctx.fillRect(10, -11, 2, 3);

      // Cane
      ctx.strokeStyle = '#ffd200';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(16, -10);
      ctx.lineTo(20, 20);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 11px 'Bangers'";
      ctx.textAlign = 'center';
      ctx.fillText('KINGPIN', 0, this.targetPod.radius + 14);

      ctx.restore();
    }

    // Draw Slingshot Mechanism
    ctx.save();
    // Heavy wooden Y-frame
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.slingshot.x, this.slingshot.y + 60);
    ctx.lineTo(this.slingshot.x, this.slingshot.y + 15);
    ctx.lineTo(this.slingshot.x - 16, this.slingshot.y - 12);
    ctx.moveTo(this.slingshot.x, this.slingshot.y + 15);
    ctx.lineTo(this.slingshot.x + 16, this.slingshot.y - 12);
    ctx.stroke();

    // Elastic bands
    const currentOrd = this.ordnanceTypes[this.selectedOrdnanceIdx];
    const pullX = this.isAiming ? this.dragPos.x : this.slingshot.x;
    const pullY = this.isAiming ? this.dragPos.y : this.slingshot.y;

    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.slingshot.x - 16, this.slingshot.y - 12);
    ctx.lineTo(pullX, pullY);
    ctx.lineTo(this.slingshot.x + 16, this.slingshot.y - 12);
    ctx.stroke();

    // Ordnance in pouch
    if (!this.projectile && this.shotsLeft > 0) {
      ctx.fillStyle = currentOrd.color;
      ctx.beginPath();
      ctx.arc(pullX, pullY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Predictive Ballistic Aiming Arc (Trajectory Guide)
    if (this.isAiming) {
      ctx.save();
      const dx = this.slingshot.x - this.dragPos.x;
      const dy = this.slingshot.y - this.dragPos.y;
      const vx = dx * currentOrd.speedMult;
      const vy = dy * currentOrd.speedMult;
      const gravity = 620;

      ctx.strokeStyle = currentOrd.color;
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let simX = this.slingshot.x;
      let simY = this.slingshot.y;
      ctx.moveTo(simX, simY);

      for (let t = 0.04; t < 1.4; t += 0.04) {
        const nextX = this.slingshot.x + vx * t;
        const nextY = this.slingshot.y + vy * t + 0.5 * gravity * t * t;
        if (nextY > this.groundY) break;
        ctx.lineTo(nextX, nextY);

        // Glowing dot
        ctx.fillStyle = currentOrd.color;
        ctx.beginPath();
        ctx.arc(nextX, nextY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
    }

    // Render Deadpool Character Standing by Slingshot
    ctx.save();
    const dpX = 95;
    const dpY = 385;

    // Dual Crossed Katanas on Back
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dpX - 16, dpY - 32);
    ctx.lineTo(dpX + 16, dpY + 10);
    ctx.moveTo(dpX + 16, dpY - 32);
    ctx.lineTo(dpX - 16, dpY + 10);
    ctx.stroke();

    // Katana Grips (Red wrap)
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(dpX - 18, dpY - 36);
    ctx.lineTo(dpX - 12, dpY - 26);
    ctx.moveTo(dpX + 18, dpY - 36);
    ctx.lineTo(dpX + 12, dpY - 26);
    ctx.stroke();

    // Body (Red Tactical Suit)
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.ellipse(dpX, dpY, 15, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black Tactical Side Harness Panels
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(dpX - 9, dpY, 5, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(dpX + 9, dpY, 5, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belt & Deadpool Buckle
    ctx.fillStyle = '#000000';
    ctx.fillRect(dpX - 12, dpY + 12, 24, 6);
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.arc(dpX, dpY + 15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(dpX - 4, dpY + 14, 2, 2);
    ctx.fillRect(dpX + 2, dpY + 14, 2, 2);

    // Deadpool Head
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.arc(dpX, dpY - 18, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Black Eye Patches
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(dpX - 5, dpY - 18, 4, 6, -0.2, 0, Math.PI * 2);
    ctx.ellipse(dpX + 5, dpY - 18, 4, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Expressive White Slit Eyes (Squint when aiming)
    ctx.fillStyle = '#ffffff';
    if (this.isAiming) {
      ctx.fillRect(dpX - 7, dpY - 18, 4, 2);
      ctx.fillRect(dpX + 3, dpY - 18, 4, 2);
    } else {
      ctx.beginPath();
      ctx.ellipse(dpX - 5, dpY - 18, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.ellipse(dpX + 5, dpY - 18, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Deadpool Speech Bubble
    if (this.quipTimer > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const bubbleW = Math.min(220, ctx.measureText(this.currentQuip).width + 24);
      const bubbleH = 34;
      const bX = dpX - 20;
      const bY = dpY - 70;

      ctx.beginPath();
      ctx.roundRect(bX, bY, bubbleW, bubbleH, 8);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(bX + 15, bY + bubbleH);
      ctx.lineTo(bX + 22, bY + bubbleH + 10);
      ctx.lineTo(bX + 30, bY + bubbleH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = "bold 11px 'Bangers', cursive";
      ctx.textAlign = 'left';
      ctx.fillText(this.currentQuip, bX + 8, bY + 21);
    }
    ctx.restore();

    // Render Flying Projectile
    if (this.projectile) {
      ctx.save();
      ctx.translate(this.projectile.x, this.projectile.y);
      ctx.rotate(this.projectile.angle);

      if (this.projectile.type === 'ROCKET') {
        // Sleek Katana Rocket
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-14, -6, 28, 12);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(14, -6);
        ctx.lineTo(24, 0);
        ctx.lineTo(14, 6);
        ctx.fill();
        // Fins
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(-14, -10, 6, 20);
      } else if (this.projectile.type === 'CLUSTER') {
        // Chimichanga Bomb
        ctx.fillStyle = '#ffd200';
        ctx.beginPath();
        ctx.arc(0, 0, this.projectile.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d50000';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = "bold 10px 'Bangers'";
        ctx.textAlign = 'center';
        ctx.fillText('BURST', 0, 4);
      } else {
        // Heavy Cannonball
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.arc(0, 0, this.projectile.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd200';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Bomblets
    for (const bl of this.bomblets) {
      ctx.save();
      ctx.fillStyle = '#ffd200';
      ctx.beginPath();
      ctx.arc(bl.x, bl.y, bl.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Render Particles & Debris
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // On-Screen Ordnance Selector Bar (Bottom Left)
    ctx.save();
    for (let i = 0; i < this.ordnanceTypes.length; i++) {
      const ord = this.ordnanceTypes[i];
      const isSelected = i === this.selectedOrdnanceIdx;
      const bX = 20 + i * 95;
      const bY = 485;
      const bW = 85;
      const bH = 42;

      ctx.fillStyle = isSelected ? 'rgba(255, 23, 68, 0.4)' : 'rgba(20, 15, 30, 0.7)';
      ctx.strokeStyle = isSelected ? ord.color : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? '#fff' : '#aaa';
      ctx.font = "bold 13px 'Bangers'";
      ctx.textAlign = 'center';
      ctx.fillText(`[${i + 1}] ${ord.icon}`, bX + bW / 2, bY + 18);

      ctx.font = "bold 9px 'Outfit'";
      ctx.fillStyle = isSelected ? ord.color : '#888';
      ctx.fillText(ord.id, bX + bW / 2, bY + 32);
    }

    // Shots Remaining Indicator
    ctx.fillStyle = '#ffd200';
    ctx.font = "bold 20px 'Bangers', cursive";
    ctx.textAlign = 'left';
    ctx.fillText(`ORDNANCE: ${this.shotsLeft} / 3`, 320, 515);

    ctx.font = "bold 12px 'Outfit'";
    ctx.fillStyle = '#aaa';
    ctx.fillText('DRAG BACK ON SLINGSHOT TO AIM & FIRE • [1-3] SELECT AMMO', 460, 515);
    ctx.restore();
  }
}

window.DeadpoolGame = DeadpoolGame;
