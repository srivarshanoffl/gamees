/**
 * thor-hammer.js
 * MJOLNIR RETURN — HIGH-FIDELITY WEB DEBUGGING GAMEPLAY
 * 
 * Correct Progression:
 *   SOLVE WEB BUG
 *        ↓
 *   UNLOCK THUNDER POWER
 *        ↓
 *   PRESS THUNDER BUTTON
 *        ↓
 *   REVEAL CIVILIANS AND CREATURES FOR 30 SECONDS
 *        ↓
 *   THROW MJOLNIR AT CREATURES
 *        ↓
 *   DEFEAT CREATURES
 *        ↓
 *   THUNDER REVEAL EXPIRES
 *        ↓
 *   PRESS THUNDER AGAIN WHEN READY
 */

class ThorHammerGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'thorhammer';
    this.groundY = 460;
    this.bgColor = '#03050a';

    // Offscreen illumination mask canvas for dynamic 2D lighting
    try {
      if (typeof document !== 'undefined' && document.createElement) {
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = 960;
        this.lightCanvas.height = 540;
        this.lightCtx = this.lightCanvas.getContext('2d');
      }
    } catch (e) {
      this.lightCanvas = null;
      this.lightCtx = null;
    }

    // Atmospheric stormy rain mist
    this.ambientStorm = [];
    for (let i = 0; i < 48; i++) {
      this.ambientStorm.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        speedX: -75 - Math.random() * 50,
        speedY: 190 + Math.random() * 110,
        len: Math.random() * 14 + 8,
        alpha: Math.random() * 0.35 + 0.15
      });
    }

    // Realistic Thor character image asset
    this.thorImg = new Image();
    const isSubdir = typeof window !== 'undefined' && window.location.pathname.includes('/games/');
    this.thorImg.src = isSubdir ? '../assets/thor.png' : 'assets/thor.png';

    this.activeStrikes = [];
    this.reset();
  }

  playSound(name) {
    try {
      if (window.soundFX && typeof window.soundFX[name] === 'function') {
        window.soundFX[name]();
      }
    } catch (e) {}
  }

  reset() {
    this.stage = 2;
    this.maxStages = 2;
    this.score = 0;
    this.setupLevel(2);
  }

  setupLevel(levelIndex = 2) {
    this.state = 'PLAYING';
    this.stage = 2;
    this.terminalOpen = false;

    // Thor character position & state
    this.thor = {
      x: 120,
      y: this.groundY,
      handX: 148,
      handY: this.groundY - 65,
      hp: 100,
      maxHp: 100
    };

    // Mjolnir hammer state
    this.hammer = {
      state: 'IDLE', // 'IDLE', 'THROWN', 'RETURNING'
      x: this.thor.handX,
      y: this.thor.handY,
      prevX: this.thor.handX,
      prevY: this.thor.handY,
      vx: 0,
      vy: 0,
      speed: 0,
      maxRange: 1300,
      distanceTraveled: 0,
      radius: 18,
      rotation: 0
    };

    this.power = 0;
    this.isCharging = false;
    this.aimAngle = 0;
    this.lightningTimer = 0;

    this.particles = [];
    this.activeStrikes = [];

    // =========================================================================
    // 1. WEB BUG & THUNDER UNLOCK STATE
    // =========================================================================
    this.bugSolved = false;         // Locked until CSS syntax error is patched
    this.thunderUnlocked = false;   // Unlocked exactly once when bug is solved

    // =========================================================================
    // 2. 30-SECOND REVEAL STATE
    // =========================================================================
    this.isRevealed = false;        // Civilians and creatures 100% invisible when false
    this.revealTimer = 0;           // Counts down from 30.0s to 0.0s
    this.revealDuration = 30.0;     // Exactly 30 seconds
    this.thunderActiveTimer = 0;    // Environmental flash duration on strike

    // =========================================================================
    // 3. PERSISTENT HOSTILE CREATURES
    // Invisibility does not remove them from the world; positions never regenerate
    // =========================================================================
    this.creatures = [
      { id: 'c1', name: 'Glitch Corruptor', x: 490, y: 220, r: 26, hp: 1, maxHp: 1, defeated: false, type: 'minion', hitTimer: 0, fade: 0 },
      { id: 'c2', name: 'Frost Bot Stalker', x: 670, y: 370, r: 28, hp: 1, maxHp: 1, defeated: false, type: 'minion', hitTimer: 0, fade: 0 },
      { id: 'c3', name: 'Cyber Void Drake', x: 820, y: 170, r: 28, hp: 1, maxHp: 1, defeated: false, type: 'minion', hitTimer: 0, fade: 0 },
      { id: 'c4', name: 'Glitch Titan Lord', x: 790, y: 380, r: 36, hp: 2, maxHp: 2, defeated: false, type: 'boss', hitTimer: 0, fade: 0 }
    ];

    // =========================================================================
    // 4. PERSISTENT INNOCENT CIVILIANS
    // Never attack targets! Zero damage, zero points, safe always
    // =========================================================================
    this.civilians = [
      { id: 'civ1', name: 'Lady Sigrid (Healer)', x: 390, y: 390, r: 22, tunicColor: '#1e824c', hairColor: '#5c3a21', fade: 0, shieldGlow: 0 },
      { id: 'civ2', name: 'Asgardian Scholar', x: 610, y: 190, r: 22, tunicColor: '#2980b9', hairColor: '#d35400', fade: 0, shieldGlow: 0 },
      { id: 'civ3', name: 'Realm Villager', x: 880, y: 280, r: 22, tunicColor: '#8e44ad', hairColor: '#f39c12', fade: 0, shieldGlow: 0 }
    ];

    // Bonus Collectible Rune
    this.runes = [
      { x: 540, y: 130, r: 18, collected: false }
    ];

    // Aim initially towards first creature
    if (this.creatures[0]) {
      const dx = this.creatures[0].x - this.thor.handX;
      const dy = this.creatures[0].y - this.thor.handY;
      this.aimAngle = Math.atan2(dy, dx);
    }

    this.updateHUD();
  }

  nextLevel() {
    this.triggerVictory('ALL CREATURES DEFEATED — ASGARD DEFENDED!');
  }

  resetLevel() {
    this.setupLevel(2);
  }

  // ===========================================================================
  // DEBUG TERMINAL INTERACTION
  // ===========================================================================
  openDebugTerminal() {
    this.terminalOpen = true;
    const overlay = document.getElementById('debugTerminalOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
    this.playSound('click');
  }

  closeDebugTerminal() {
    this.terminalOpen = false;
    const overlay = document.getElementById('debugTerminalOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Called when the player genuinely selects Line 4 and deploys 'display: flex;'
  solveCodingBug() {
    if (this.bugSolved) return;

    this.bugSolved = true;
    this.thunderUnlocked = true;

    // Award Bug Solving Score
    this.score += 500;
    this.playSound('powerup');
    this.shake(8, 0.25);
    this.spawnScorePopup("+500 CSS BUG FIXED!", 480, 180, '#00ff88');
    this.spawnComicText("THUNDER UNLOCKED!", 480, 140, '#ffd200');

    // Golden & Cyan celebration burst
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 200 + 40;
      this.spawnParticle(
        480, 160,
        Math.cos(ang) * spd, Math.sin(ang) * spd,
        Math.random() > 0.5 ? '#ffd200' : '#00f0ff',
        Math.random() * 4 + 2, 0.55
      );
    }

    this.updateHUD();
  }

  // ===========================================================================
  // THUNDER ACTIVATION — REVEALS ENTITIES FOR EXACTLY 30 SECONDS
  // ===========================================================================
  triggerThunder() {
    if (this.state !== 'PLAYING' || this.terminalOpen) return;

    // Rule 2: Thunder is unavailable before the bug is solved
    if (!this.thunderUnlocked) {
      this.playSound('hit');
      this.shake(5, 0.15);
      this.spawnComicText("LOCKED!", this.thor.x + 30, this.thor.y - 80, '#ff1744');
      this.openDebugTerminal();
      return;
    }

    // Rule 4: Prevent overlapping timers and duplicate reveal sequences
    if (this.isRevealed) {
      return;
    }

    // Activate 30-Second Reveal Window
    this.isRevealed = true;
    this.revealTimer = this.revealDuration; // Exactly 30 seconds
    this.thunderActiveTimer = 0.8;           // Brief intense environmental illumination flash
    this.shake(14, 0.35);
    this.playSound('thunder');

    // Spawn powerful blue-white procedural branched lightning strikes
    this.spawnLightningStrike(380, 240);
    this.spawnLightningStrike(660, 280);
    this.spawnLightningStrike(820, 220);

    this.spawnComicText("THUNDER REVEAL!", 480, 80, '#00f0ff');

    // Burst of lightning crackles around all revealed living creatures
    for (const c of this.creatures) {
      if (!c.defeated) {
        this.spawnImpactParticles(c.x, c.y, '#00f0ff', 10);
      }
    }
    // Protective green shimmer around innocent civilians
    for (const civ of this.civilians) {
      this.spawnImpactParticles(civ.x, civ.y, '#00ff88', 8);
    }

    this.updateHUD();
  }

  spawnLightningStrike(x, y) {
    const segments = [];
    const startX = x + (Math.random() - 0.5) * 60;
    const startY = -20;

    segments.push({ x: startX, y: startY });
    let currX = startX;
    let currY = startY;
    const steps = 10;
    const dy = (y - startY) / steps;

    for (let i = 1; i < steps; i++) {
      currY += dy;
      currX += (x - currX) * 0.25 + (Math.random() - 0.5) * 55;
      segments.push({ x: currX, y: currY });
    }
    segments.push({ x: x, y: y });

    // Procedural side branches
    const branches = [];
    for (let i = 2; i < steps - 1; i += 2) {
      const bSeg = [];
      let bx = segments[i].x;
      let by = segments[i].y;
      const branchDir = Math.random() > 0.5 ? 1 : -1;
      for (let j = 0; j < 3; j++) {
        bx += (Math.random() * 30 + 15) * branchDir;
        by += Math.random() * 25 + 12;
        bSeg.push({ x: bx, y: by });
      }
      branches.push({ from: segments[i], path: bSeg });
    }

    this.activeStrikes.push({
      x: x,
      y: y,
      segments: segments,
      branches: branches,
      timer: 0.35,
      maxTimer: 0.35
    });

    // Impact sparks on ground
    this.spawnImpactParticles(x, y, '#00f0ff', 14);
    this.spawnImpactParticles(x, y, '#ffffff', 8);
  }

  spawnImpactParticles(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 240 + 40;
      this.spawnParticle(
        x, y,
        Math.cos(ang) * spd, Math.sin(ang) * spd,
        color, Math.random() * 4 + 2, 0.4
      );
    }
  }

  // ===========================================================================
  // GAME UPDATE LOOP
  // ===========================================================================
  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.lightningTimer += dt;

    if (this.thunderActiveTimer > 0) {
      this.thunderActiveTimer = Math.max(0, this.thunderActiveTimer - dt);
    }

    // 30-Second Countdown logic
    if (this.isRevealed) {
      this.revealTimer = Math.max(0, this.revealTimer - dt);
      if (this.revealTimer <= 0) {
        // 30 seconds expired: Hide all entities again, preserve defeated creatures
        this.isRevealed = false;
        this.revealTimer = 0;
        this.playSound('shieldBounce');
        this.spawnComicText("REVEAL EXPIRED!", 480, 100, '#ff9900');
      }
    }

    // Smooth visibility fade transitions for creatures and civilians
    for (const c of this.creatures) {
      if (this.isRevealed && !c.defeated) {
        c.fade = Math.min(1.0, c.fade + dt * 4.0);
      } else {
        c.fade = Math.max(0.0, c.fade - dt * 4.0);
      }
      if (c.hitTimer > 0) c.hitTimer -= dt;
    }

    for (const civ of this.civilians) {
      if (this.isRevealed) {
        civ.fade = Math.min(1.0, civ.fade + dt * 4.0);
      } else {
        civ.fade = Math.max(0.0, civ.fade - dt * 4.0);
      }
      if (civ.shieldGlow > 0) {
        civ.shieldGlow = Math.max(0, civ.shieldGlow - dt * 2.5);
      }
    }

    // Ambient storm weather animation
    for (const drop of this.ambientStorm) {
      drop.x += drop.speedX * dt;
      drop.y += drop.speedY * dt;
      if (drop.y > 540) {
        drop.y = -10;
        drop.x = Math.random() * 960 + 100;
      }
      if (drop.x < 0) {
        drop.x = 960;
      }
    }

    // Active lightning strikes decay
    for (let i = this.activeStrikes.length - 1; i >= 0; i--) {
      this.activeStrikes[i].timer -= dt;
      if (this.activeStrikes[i].timer <= 0) {
        this.activeStrikes.splice(i, 1);
      }
    }

    // Input & Mjolnir update
    this.updateInput(dt);
    this.updateHammer(dt);
    this.checkCollisions(dt);
    this.updateHUD();

    // Check Victory Condition: All creatures defeated and hammer returned
    const allDefeated = this.creatures.every(c => c.defeated);
    if (allDefeated && this.hammer.state === 'IDLE' && !this.terminalOpen) {
      this.state = 'STAGE_CLEAR';
      this.playSound('victory');
      this.triggerVictory('ALL CREATURES DEFEATED — ASGARD DEFENDED!');
    }
  }

  updateInput(dt) {
    if (this.terminalOpen) return;

    const powerMeterEl = document.getElementById('powerMeterContainer');
    const powerFillEl = document.getElementById('powerMeterFill');

    // 1. Aiming angle calculation
    if (this.pointer && (this.pointer.x > 0 || this.pointer.y > 0)) {
      const dx = Math.max(35, this.pointer.x - this.thor.handX);
      const dy = this.pointer.y - this.thor.handY;
      this.aimAngle = Math.atan2(dy, dx);
    }

    // 2. Throw Mjolnir (Charge & Release)
    if (this.hammer.state === 'IDLE') {
      if (this.pointer.isDown) {
        this.isCharging = true;
        this.power = Math.min(1.0, this.power + dt * 1.6);

        if (powerMeterEl) powerMeterEl.classList.add('active');
        if (powerFillEl) powerFillEl.style.width = `${Math.round(this.power * 100)}%`;
      } else if (this.isCharging && (this.pointer.justReleased || !this.pointer.isDown)) {
        this.isCharging = false;
        if (powerMeterEl) powerMeterEl.classList.remove('active');

        this.hammer.state = 'THROWN';
        this.hammer.prevX = this.hammer.x;
        this.hammer.prevY = this.hammer.y;
        this.hammer.distanceTraveled = 0;

        const speed = 1100 + (this.power * 600);
        this.hammer.maxRange = 1300;

        this.hammer.vx = Math.cos(this.aimAngle) * speed;
        this.hammer.vy = Math.sin(this.aimAngle) * speed;

        this.shake(5, 0.18);
        this.playSound('thwip');

        for (let i = 0; i < 12; i++) {
          const ang = Math.random() * Math.PI * 2;
          this.spawnParticle(
            this.hammer.x, this.hammer.y,
            Math.cos(ang) * 140, Math.sin(ang) * 140,
            '#00f0ff', Math.random() * 3 + 2, 0.35
          );
        }

        this.power = 0;
      }
    } else {
      if (powerMeterEl) powerMeterEl.classList.remove('active');
    }
  }

  updateHammer(dt) {
    if (this.hammer.state === 'IDLE') {
      this.hammer.x = this.thor.handX;
      this.hammer.y = this.thor.handY + Math.sin(this.lightningTimer * 4) * 4;
      this.hammer.prevX = this.hammer.x;
      this.hammer.prevY = this.hammer.y;
      this.hammer.rotation = 0;

    } else if (this.hammer.state === 'THROWN') {
      const stepDist = Math.hypot(this.hammer.vx, this.hammer.vy) * dt;
      this.hammer.prevX = this.hammer.x;
      this.hammer.prevY = this.hammer.y;

      this.hammer.x += this.hammer.vx * dt;
      this.hammer.y += this.hammer.vy * dt;
      this.hammer.distanceTraveled += stepDist;
      this.hammer.rotation += dt * 30;

      // Arena boundary bounces
      if (this.hammer.y <= 25 && this.hammer.vy < 0) {
        this.hammer.y = 25;
        this.hammer.vy = -this.hammer.vy;
        this.shake(3, 0.1);
        this.playSound('shieldBounce');
      } else if (this.hammer.y >= 445 && this.hammer.vy > 0) {
        this.hammer.y = 445;
        this.hammer.vy = -this.hammer.vy;
        this.shake(3, 0.1);
        this.playSound('hit');
      }

      // Electric spark trail
      this.spawnParticle(
        this.hammer.x + (Math.random() - 0.5) * 16,
        this.hammer.y + (Math.random() - 0.5) * 16,
        -this.hammer.vx * 0.08 + (Math.random() - 0.5) * 30,
        -this.hammer.vy * 0.08 + (Math.random() - 0.5) * 30,
        '#00f0ff', Math.random() * 4 + 2, 0.3
      );

      if (this.hammer.x >= 930 || this.hammer.distanceTraveled >= this.hammer.maxRange) {
        this.startReturning();
      }

    } else if (this.hammer.state === 'RETURNING') {
      this.hammer.prevX = this.hammer.x;
      this.hammer.prevY = this.hammer.y;

      const dx = this.thor.handX - this.hammer.x;
      const dy = this.thor.handY - this.hammer.y;
      const dist = Math.hypot(dx, dy);

      this.hammer.rotation -= dt * 30;

      const returnSpeed = 1200;
      const step = returnSpeed * dt;

      const targetVx = (dx / dist) * returnSpeed;
      const targetVy = (dy / dist) * returnSpeed;

      const blend = Math.min(1.0, dt * 18);
      this.hammer.vx += (targetVx - this.hammer.vx) * blend;
      this.hammer.vy += (targetVy - this.hammer.vy) * blend;

      this.hammer.x += this.hammer.vx * dt;
      this.hammer.y += this.hammer.vy * dt;

      // Catch Condition
      if (dist < 42 || dist <= step * 1.5) {
        this.hammer.state = 'IDLE';
        this.hammer.x = this.thor.handX;
        this.hammer.y = this.thor.handY;
        this.hammer.prevX = this.thor.handX;
        this.hammer.prevY = this.thor.handY;
        this.hammer.vx = 0;
        this.hammer.vy = 0;
        this.shake(6, 0.2);
        this.playSound('thunder');

        for (let i = 0; i < 20; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = Math.random() * 160 + 60;
          this.spawnParticle(
            this.hammer.x, this.hammer.y,
            Math.cos(ang) * spd, Math.sin(ang) * spd,
            '#ffd200', Math.random() * 4 + 2, 0.35
          );
        }
      } else {
        this.spawnParticle(
          this.hammer.x + (Math.random() - 0.5) * 16,
          this.hammer.y + (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20,
          '#ffd200', Math.random() * 4 + 2, 0.25
        );
      }
    }
  }

  startReturning() {
    if (this.hammer.state === 'RETURNING') return;
    this.hammer.state = 'RETURNING';
    this.shake(4, 0.15);
    this.playSound('thunder');
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  // ===========================================================================
  // COMBAT & COLLISION HANDLING
  // ===========================================================================
  checkCollisions(dt) {
    if (this.hammer.state === 'IDLE') return;

    const x1 = this.hammer.prevX || this.hammer.x;
    const y1 = this.hammer.prevY || this.hammer.y;
    const x2 = this.hammer.x;
    const y2 = this.hammer.y;

    // 1. Bonus Asgardian Runes
    for (const rune of this.runes) {
      if (rune.collected) continue;
      const dist = this.distToSegment(rune.x, rune.y, x1, y1, x2, y2);
      if (dist < this.hammer.radius + rune.r) {
        rune.collected = true;
        this.score += 300;
        this.spawnScorePopup("+300 THUNDER RUNE", rune.x, rune.y - 20, '#ffd200');
        this.playSound('collect');
      }
    }

    // 2. CIVILIANS (Rule 6: Civilians must NEVER be attack targets)
    // Civilians take zero damage, award zero defeat points, and are protected!
    for (const civ of this.civilians) {
      const dist = this.distToSegment(civ.x, civ.y, x1, y1, x2, y2);
      if (dist < this.hammer.radius + civ.r + 10) {
        civ.shieldGlow = 1.0;
        // Hammer passes harmlessly by the civilian without hurting them
      }
    }

    // 3. HOSTILE CREATURES (Only attackable when revealed by Thunder!)
    if (this.isRevealed) {
      for (const c of this.creatures) {
        if (c.defeated) continue;
        if (c.hitTimer > 0) continue;

        const dist = this.distToSegment(c.x, c.y, x1, y1, x2, y2);
        if (dist < this.hammer.radius + c.r) {
          // Genuine hit detected on targeted creature!
          c.hp -= 1;
          c.hitTimer = 0.25;

          this.playSound('hit');
          this.shake(8, 0.22);
          this.spawnImpactParticles(c.x, c.y, c.type === 'boss' ? '#ff0055' : '#00f0ff', 20);

          if (c.hp <= 0) {
            c.defeated = true;
            const pts = c.type === 'boss' ? 1000 : 350;
            this.score += pts;
            this.spawnScorePopup(`+${pts} ${c.name.toUpperCase()} DEFEATED!`, c.x, c.y - 30, '#ffd200');
            this.spawnComicText("CRUSHED!", c.x, c.y - 55, '#ffd200');

            // Explosion sparks
            for (let i = 0; i < 24; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = Math.random() * 220 + 50;
              this.spawnParticle(
                c.x, c.y,
                Math.cos(ang) * spd, Math.sin(ang) * spd,
                c.type === 'boss' ? '#ff0055' : '#00f0ff',
                Math.random() * 4 + 2, 0.45
              );
            }
          } else {
            this.spawnComicText("STRIKE!", c.x, c.y - 35, '#00f0ff');
          }

          // Hammer rebounds and returns
          this.startReturning();
          break;
        }
      }
    }
  }

  // ===========================================================================
  // HUD UPDATES
  // ===========================================================================
  updateHUD() {
    const scoreEl = document.getElementById('hudScore');
    const phaseEl = document.getElementById('hudPhase');
    const bugBadgeEl = document.getElementById('hudBugBadge');
    const thunderBtn = document.getElementById('thunderBtn');
    const thunderBtnIcon = document.getElementById('thunderBtnIcon');
    const thunderBtnLabel = document.getElementById('thunderBtnLabel');
    const thunderBtnHint = document.getElementById('thunderBtnHint');
    const thunderOverlay = document.getElementById('thunderCooldownOverlay');
    const revealTimerBox = document.getElementById('revealTimerBox');
    const revealTimerNum = document.getElementById('revealTimerNum');
    const revealTimerFill = document.getElementById('revealTimerFill');
    const creaturesCountEl = document.getElementById('hudCreaturesCount');
    const creaturesBarFill = document.getElementById('creaturesBarFill');
    const civiliansStatusEl = document.getElementById('hudCiviliansStatus');

    if (scoreEl) scoreEl.textContent = `${this.score.toLocaleString()} PTS`;
    if (phaseEl) phaseEl.textContent = `GLITCH PURGE`;

    // Web Bug Indicator
    if (bugBadgeEl) {
      if (this.bugSolved) {
        bugBadgeEl.textContent = '✓ CSS BUG RESOLVED';
        bugBadgeEl.className = 'hud-bug-badge success';
      } else {
        bugBadgeEl.textContent = '🔒 CSS BUG: bifrost-ward.css';
        bugBadgeEl.className = 'hud-bug-badge error';
      }
    }

    // Hostile Creatures Counter & Health Track
    const livingCreatures = this.creatures.filter(c => !c.defeated);
    if (creaturesCountEl) {
      creaturesCountEl.textContent = `${livingCreatures.length} / ${this.creatures.length} ALIVE`;
      creaturesCountEl.style.color = livingCreatures.length === 0 ? '#00ff88' : '#ff1744';
    }
    if (creaturesBarFill) {
      const pct = (livingCreatures.length / this.creatures.length) * 100;
      creaturesBarFill.style.width = `${pct}%`;
    }

    // Civilians status
    if (civiliansStatusEl) {
      civiliansStatusEl.textContent = `🛡️ ASGARDIAN CIVILIANS: ${this.civilians.length} IN SECTOR (SAFE)`;
    }

    // 30-Second Reveal Timer Display in HUD
    if (revealTimerBox && revealTimerNum && revealTimerFill) {
      if (this.isRevealed) {
        revealTimerBox.classList.remove('hidden');
        revealTimerNum.textContent = `${this.revealTimer.toFixed(1)}s`;
        const pct = (this.revealTimer / this.revealDuration) * 100;
        revealTimerFill.style.width = `${pct}%`;
        if (this.revealTimer <= 5) {
          revealTimerBox.classList.add('urgent');
        } else {
          revealTimerBox.classList.remove('urgent');
        }
      } else {
        revealTimerBox.classList.add('hidden');
        revealTimerBox.classList.remove('urgent');
      }
    }

    // Thunder Button States: Locked vs Ready vs Active
    if (thunderBtn) {
      thunderBtn.classList.remove('locked', 'ready', 'active');

      if (!this.thunderUnlocked) {
        // STATE 1: LOCKED BEFORE WEB BUG IS SOLVED
        thunderBtn.classList.add('locked');
        thunderBtn.disabled = false; // Enabled to click so it informs & opens terminal
        if (thunderBtnIcon) thunderBtnIcon.textContent = '🔒';
        if (thunderBtnLabel) thunderBtnLabel.textContent = 'THUNDER LOCKED';
        if (thunderBtnHint) thunderBtnHint.textContent = 'SOLVE BUG';
        if (thunderOverlay) thunderOverlay.style.height = '100%';

      } else if (this.isRevealed) {
        // STATE 2: ACTIVE 30-SECOND REVEAL IN PROGRESS
        thunderBtn.classList.add('active');
        thunderBtn.disabled = true;
        const remainingSec = Math.ceil(this.revealTimer);
        if (thunderBtnIcon) thunderBtnIcon.textContent = '⚡';
        if (thunderBtnLabel) thunderBtnLabel.textContent = `REVEAL ACTIVE (${remainingSec}s)`;
        if (thunderBtnHint) thunderBtnHint.textContent = `${remainingSec}s`;
        if (thunderOverlay) {
          const drainPct = ((this.revealDuration - this.revealTimer) / this.revealDuration) * 100;
          thunderOverlay.style.height = `${drainPct}%`;
        }

      } else {
        // STATE 3: READY TO TRIGGER 30-SECOND REVEAL
        thunderBtn.classList.add('ready');
        thunderBtn.disabled = false;
        if (thunderBtnIcon) thunderBtnIcon.textContent = '⚡';
        if (thunderBtnLabel) thunderBtnLabel.textContent = 'THUNDER REVEAL';
        if (thunderBtnHint) thunderBtnHint.textContent = 'SPACE';
        if (thunderOverlay) thunderOverlay.style.height = '0%';
      }
    }
  }

  // ===========================================================================
  // CINEMATIC GRAPHICS RENDERING
  // ===========================================================================
  render(ctx) {
    // 1. SKY & DISTANT MOUNTAINS
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 460);
    skyGrad.addColorStop(0, '#040714');
    skyGrad.addColorStop(0.4, '#081226');
    skyGrad.addColorStop(1, '#050a18');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 540);

    // Rolling stormy cloud banks
    ctx.save();
    ctx.fillStyle = 'rgba(16, 28, 54, 0.45)';
    ctx.beginPath();
    ctx.arc(280, 80, 160, 0, Math.PI * 2);
    ctx.arc(620, 110, 200, 0, Math.PI * 2);
    ctx.arc(840, 70, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Distant Jotunheim mountain peaks
    ctx.fillStyle = 'rgba(12, 18, 34, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, 460);
    ctx.lineTo(80, 360);
    ctx.lineTo(170, 410);
    ctx.lineTo(290, 320);
    ctx.lineTo(410, 420);
    ctx.lineTo(540, 310);
    ctx.lineTo(670, 400);
    ctx.lineTo(810, 300);
    ctx.lineTo(960, 370);
    ctx.lineTo(960, 460);
    ctx.closePath();
    ctx.fill();

    // Background Norse stone pillars with glowing ancient runes
    this.drawStonePillar(ctx, 210, 280, 32, 180, 'ᚦ');
    this.drawStonePillar(ctx, 890, 270, 40, 190, 'ᚱ');

    // Rocky arena ground
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, 540);
    groundGrad.addColorStop(0, '#0c1322');
    groundGrad.addColorStop(1, '#060a12');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, 960, 540 - this.groundY);

    // Glowing Bifrost circuitry on arena ground
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(960, this.groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.5;
    for (let gx = 35; gx < 940; gx += 80) {
      ctx.strokeRect(gx, this.groundY + 14, 24, 10);
      ctx.beginPath();
      ctx.moveTo(gx + 12, this.groundY + 24);
      ctx.lineTo(gx + 12, this.groundY + 44);
      ctx.stroke();
    }

    // 2. AMBIENT STORM WEATHER
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.25)';
    ctx.lineWidth = 1;
    for (const drop of this.ambientStorm) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + (drop.speedX * 0.04), drop.y + (drop.speedY * 0.04));
      ctx.stroke();
    }
    ctx.restore();

    // 3. BONUS RUNES
    for (const rune of this.runes) {
      if (rune.collected) continue;
      this.drawBonusRune(ctx, rune);
    }

    // 4. DYNAMIC 2D LIGHTING & STORM ATMOSPHERE
    this.renderDynamicLighting(ctx);

    // 5. DRAW THOR
    this.drawThor(ctx);

    // 6. DRAW CIVILIANS (Rule 3: 100% invisible during normal play; revealed ONLY when fade > 0)
    this.drawCivilians(ctx);

    // 7. DRAW CREATURES (Rule 3: 100% invisible during normal play; revealed ONLY when fade > 0)
    this.drawCreatures(ctx);

    // 8. ACTIVE LIGHTNING STRIKES
    this.renderLightningStrikes(ctx);

    // 9. AIMING RETICLE & TARGET LOCK
    this.renderTargetingHUD(ctx);

    // 10. MJOLNIR HAMMER
    this.drawMjolnir(ctx);
  }

  // Stone Pillar Helper
  drawStonePillar(ctx, x, y, w, h, runeChar) {
    ctx.save();
    ctx.fillStyle = '#11192b';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#1d2a45';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillText(runeChar, x + w / 2, y + 45);
    ctx.restore();
  }

  // Bonus Rune Helper
  drawBonusRune(ctx, rune) {
    ctx.save();
    ctx.translate(rune.x, rune.y);
    const pulse = Math.sin(this.lightningTimer * 5) * 4;

    ctx.fillStyle = 'rgba(255, 210, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, rune.r + pulse + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd200';
    ctx.shadowColor = '#ffd200';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, rune.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(-3, -10); ctx.lineTo(6, -2); ctx.lineTo(0, 0);
    ctx.lineTo(4, 10); ctx.lineTo(-5, 1); ctx.lineTo(-1, -1);
    ctx.fill();
    ctx.restore();
  }

  // ===========================================================================
  // CIVILIANS RENDERING
  // Rule 3: 100% invisible during normal play! Only rendered when fade > 0
  // Rule 6: Visually distinct from hostiles, warm protective green/golden aura
  // ===========================================================================
  drawCivilians(ctx) {
    for (const civ of this.civilians) {
      if (civ.fade <= 0) continue;

      ctx.save();
      ctx.translate(civ.x, civ.y);
      ctx.globalAlpha = civ.fade;

      // Warm protective emerald/golden halo
      const haloPulse = Math.sin(this.lightningTimer * 4) * 4;
      const haloGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, civ.r + 24 + haloPulse);
      haloGrad.addColorStop(0, 'rgba(0, 255, 136, 0.35)');
      haloGrad.addColorStop(0.6, 'rgba(255, 210, 0, 0.2)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(0, 0, civ.r + 24 + haloPulse, 0, Math.PI * 2);
      ctx.fill();

      // Protective runic orbit ring
      ctx.strokeStyle = civ.shieldGlow > 0 ? '#00ff88' : 'rgba(0, 255, 136, 0.85)';
      ctx.lineWidth = civ.shieldGlow > 0 ? 3.5 : 2;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = civ.shieldGlow > 0 ? 18 : 10;
      ctx.beginPath();
      ctx.arc(0, 0, civ.r + 8, 0, Math.PI * 2);
      ctx.stroke();

      const bob = Math.sin(this.lightningTimer * 5) * 2;

      // Cloak & Tunic
      ctx.fillStyle = civ.tunicColor;
      ctx.beginPath();
      ctx.moveTo(-12, 14 + bob);
      ctx.lineTo(-16, -10 + bob);
      ctx.lineTo(16, -10 + bob);
      ctx.lineTo(12, 14 + bob);
      ctx.closePath();
      ctx.fill();

      // Golden Belt
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(-10, 2 + bob, 20, 3);

      // Cheering raised arms
      ctx.strokeStyle = '#ffe0b2';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-12, -6 + bob);
      ctx.lineTo(-20, -22 + bob);
      ctx.moveTo(12, -6 + bob);
      ctx.lineTo(20, -22 + bob);
      ctx.stroke();

      // Head
      ctx.fillStyle = '#ffe0b2';
      ctx.beginPath();
      ctx.arc(0, -18 + bob, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = civ.hairColor;
      ctx.beginPath();
      ctx.arc(0, -21 + bob, 10, Math.PI, Math.PI * 2);
      ctx.fill();

      // Friendly face
      ctx.fillStyle = '#333';
      ctx.fillRect(-4, -19 + bob, 2, 2);
      ctx.fillRect(2, -19 + bob, 2, 2);
      ctx.beginPath();
      ctx.arc(0, -15 + bob, 4, 0, Math.PI);
      ctx.stroke();

      // Floating protective lantern
      ctx.fillStyle = '#ffd54f';
      ctx.shadowColor = '#ffd54f';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(22, -14 + bob, 5, 0, Math.PI * 2);
      ctx.fill();

      // Clear Innocent Civilian Label
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.fillText(`🛡️ ${civ.name.toUpperCase()}`, 0, -civ.r - 18 + bob);
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#ffd200';
      ctx.fillText(`(CIVILIAN - INNOCENT)`, 0, -civ.r - 8 + bob);

      ctx.restore();
    }
  }

  // ===========================================================================
  // HOSTILE CREATURES RENDERING
  // Rule 3: 100% invisible during normal play! Only rendered when fade > 0
  // Rule 5: Threat styling with sinister crimson/cyan glitch border and eyes
  // ===========================================================================
  drawCreatures(ctx) {
    for (const c of this.creatures) {
      if (c.defeated || c.fade <= 0) continue;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.globalAlpha = c.fade;

      const isHit = c.hitTimer > 0;

      if (c.type === 'boss') {
        // OVERLORD TITAN BOSS
        const pulse = Math.sin(this.lightningTimer * 6) * 4;

        // Corrupted Magenta/Cyan Energy Aura
        ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, c.r + 10 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Dark armored body
        ctx.fillStyle = isHit ? '#ffffff' : '#140c1e';
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, Math.PI * 2);
        ctx.fill();

        // Spiked Crown / Horns
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.moveTo(-24, -20); ctx.lineTo(-34, -48); ctx.lineTo(-14, -30);
        ctx.lineTo(0, -52); ctx.lineTo(14, -30); ctx.lineTo(34, -48); ctx.lineTo(24, -20);
        ctx.fill();

        // Pulsing corrupted border
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Glowing red laser eye visor
        ctx.fillStyle = '#ff1133';
        ctx.shadowColor = '#ff1133';
        ctx.shadowBlur = 14;
        ctx.fillRect(-16, -8, 32, 6);

        // Core runic glyph
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.fillText('ᚲ', 0, 16);

        // Health Bar above boss
        const hpBarW = 54;
        const hpBarH = 6;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(-hpBarW / 2, -c.r - 20, hpBarW, hpBarH);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(-hpBarW / 2, -c.r - 20, (c.hp / c.maxHp) * hpBarW, hpBarH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-hpBarW / 2, -c.r - 20, hpBarW, hpBarH);

        // Hostile Boss Label
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.fillText(`👾 ${c.name.toUpperCase()} (BOSS)`, 0, -c.r - 26);

      } else {
        // CORRUPTED MINION ROBOT / CREATURE
        const pulse = Math.sin(this.lightningTimer * 8 + c.x) * 3;

        // Dark metallic body
        ctx.fillStyle = isHit ? '#ffffff' : '#08172c';
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, Math.PI * 2);
        ctx.fill();

        // Cyber Glitch outline
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Ice Spikes / Antenna
        ctx.fillStyle = '#1e3a5f';
        ctx.beginPath();
        ctx.moveTo(-c.r + 4, -4); ctx.lineTo(-c.r - 8, -16); ctx.lineTo(-c.r + 10, -12);
        ctx.moveTo(c.r - 4, -4); ctx.lineTo(c.r + 8, -16); ctx.lineTo(c.r - 10, -12);
        ctx.fill();

        // Menacing crimson dual eyes
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 10;
        ctx.fillRect(-9, -6, 6, 6);
        ctx.fillRect(3, -6, 6, 6);

        // Glitch line
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, 8); ctx.lineTo(10, 8);
        ctx.stroke();

        // Hostile Creature Label
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 6;
        ctx.fillText(`👾 ${c.name.toUpperCase()}`, 0, -c.r - 10);
      }

      ctx.restore();
    }
  }

  // ===========================================================================
  // REALISTIC ASGARDIAN THOR RENDERING
  // ===========================================================================
  drawThor(ctx) {
    ctx.save();
    ctx.translate(this.thor.x, this.thor.y);

    const bob = Math.sin(this.lightningTimer * 3.5) * 2;

    if (this.thorImg && this.thorImg.complete && this.thorImg.naturalWidth > 0) {
      const drawW = 126;
      const drawH = 142;
      const drawX = -drawW / 2;
      const drawY = -drawH + bob;

      // Ground contact shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 42, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Atmospheric lightning aura when charging or calling thunder
      if (this.isCharging || this.thunderActiveTimer > 0) {
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 22;
        ctx.drawImage(this.thorImg, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Cyan electric arcs crackling around Thor's armor
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        const arcY = drawY + drawH * 0.42;
        ctx.beginPath();
        ctx.moveTo(-16 + (Math.random() - 0.5) * 12, arcY);
        ctx.lineTo(16 + (Math.random() - 0.5) * 12, arcY + (Math.random() - 0.5) * 14);
        ctx.stroke();
      } else {
        ctx.drawImage(this.thorImg, drawX, drawY, drawW, drawH);
      }

      // Glowing electric blue eyes
      const eyeY = drawY + drawH * 0.13;
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(-4, eyeY, 3, 2.5);
      ctx.fillRect(4, eyeY, 3, 2.5);

      // Arm reaching out when catching returning hammer
      if (this.hammer.state === 'RETURNING') {
        ctx.strokeStyle = '#f6c7a7';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(22, drawY + drawH * 0.48);
        ctx.lineTo(38, drawY + drawH * 0.45);
        ctx.stroke();
      }

    } else {
      // Fallback procedural Thor rendering
      const flutter = Math.sin(this.lightningTimer * 6) * 6;
      const capeGrad = ctx.createLinearGradient(-30, -75, -55, 0);
      capeGrad.addColorStop(0, '#880000');
      capeGrad.addColorStop(0.6, '#b80d0d');
      capeGrad.addColorStop(1, '#550000');
      ctx.fillStyle = capeGrad;
      ctx.beginPath();
      ctx.moveTo(-14, -74);
      ctx.lineTo(-44 + flutter, -15);
      ctx.lineTo(-32 + flutter * 0.5, 0);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1c2436';
      ctx.fillRect(-14, -28, 11, 28);
      ctx.fillRect(3, -28, 11, 28);
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(-14, -14, 11, 3);
      ctx.fillRect(3, -14, 11, 3);

      const armorGrad = ctx.createLinearGradient(-18, -74, 18, -28);
      armorGrad.addColorStop(0, '#222d3d');
      armorGrad.addColorStop(0.5, '#34455e');
      armorGrad.addColorStop(1, '#1a2230');
      ctx.fillStyle = armorGrad;
      ctx.fillRect(-18, -74, 36, 46);

      ctx.fillStyle = '#f6c7a7';
      ctx.beginPath();
      ctx.arc(0, -88, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ===========================================================================
  // DYNAMIC 2D ILLUMINATION MASK
  // ===========================================================================
  renderDynamicLighting(ctx) {
    if (!this.lightCtx) return;

    this.lightCtx.globalCompositeOperation = 'source-over';
    this.lightCtx.fillStyle = 'rgba(3, 5, 14, 0.45)';
    this.lightCtx.fillRect(0, 0, 960, 540);

    this.lightCtx.globalCompositeOperation = 'destination-out';

    // (A) THUNDER FLASH FLOOD
    if (this.thunderActiveTimer > 0) {
      const flashAlpha = Math.min(1.0, this.thunderActiveTimer / 0.3);
      this.lightCtx.fillStyle = `rgba(0, 0, 0, ${flashAlpha})`;
      this.lightCtx.fillRect(0, 0, 960, 540);
    }

    // (B) Thor's personal aura
    const thorGlow = this.lightCtx.createRadialGradient(
      this.thor.x, this.thor.y - 45, 10,
      this.thor.x, this.thor.y - 45, 120
    );
    thorGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
    thorGlow.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
    thorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.lightCtx.fillStyle = thorGlow;
    this.lightCtx.beginPath();
    this.lightCtx.arc(this.thor.x, this.thor.y - 45, 120, 0, Math.PI * 2);
    this.lightCtx.fill();

    // (C) Light around revealed civilians
    for (const civ of this.civilians) {
      if (civ.fade > 0) {
        const civGlow = this.lightCtx.createRadialGradient(
          civ.x, civ.y, 10,
          civ.x, civ.y, 110
        );
        civGlow.addColorStop(0, `rgba(0, 0, 0, ${civ.fade})`);
        civGlow.addColorStop(0.6, `rgba(0, 0, 0, ${civ.fade * 0.6})`);
        civGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.lightCtx.fillStyle = civGlow;
        this.lightCtx.beginPath();
        this.lightCtx.arc(civ.x, civ.y, 110, 0, Math.PI * 2);
        this.lightCtx.fill();
      }
    }

    // (D) Light around revealed creatures
    for (const c of this.creatures) {
      if (!c.defeated && c.fade > 0) {
        const cGlow = this.lightCtx.createRadialGradient(
          c.x, c.y, 10,
          c.x, c.y, 120
        );
        cGlow.addColorStop(0, `rgba(0, 0, 0, ${c.fade})`);
        cGlow.addColorStop(0.6, `rgba(0, 0, 0, ${c.fade * 0.5})`);
        cGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.lightCtx.fillStyle = cGlow;
        this.lightCtx.beginPath();
        this.lightCtx.arc(c.x, c.y, 120, 0, Math.PI * 2);
        this.lightCtx.fill();
      }
    }

    // (E) Light around flying/returning Mjolnir
    if (this.hammer.state === 'THROWN' || this.hammer.state === 'RETURNING') {
      const hGlow = this.lightCtx.createRadialGradient(
        this.hammer.x, this.hammer.y, 20,
        this.hammer.x, this.hammer.y, 260
      );
      hGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
      hGlow.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
      hGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.lightCtx.fillStyle = hGlow;
      this.lightCtx.beginPath();
      this.lightCtx.arc(this.hammer.x, this.hammer.y, 260, 0, Math.PI * 2);
      this.lightCtx.fill();
    }

    // (F) Light around active lightning strikes
    for (const strike of this.activeStrikes) {
      const sGlow = this.lightCtx.createRadialGradient(strike.x, strike.y, 20, strike.x, strike.y, 350);
      sGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
      sGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.lightCtx.fillStyle = sGlow;
      this.lightCtx.beginPath();
      this.lightCtx.arc(strike.x, strike.y, 350, 0, Math.PI * 2);
      this.lightCtx.fill();
    }

    // Blend darkness onto main game arena
    ctx.drawImage(this.lightCanvas, 0, 0);
  }

  // ===========================================================================
  // LIGHTNING STRIKES RENDERING
  // ===========================================================================
  renderLightningStrikes(ctx) {
    if (this.activeStrikes.length === 0) return;

    ctx.save();
    for (const strike of this.activeStrikes) {
      const alpha = strike.timer / strike.maxTimer;
      ctx.globalAlpha = alpha;

      // Outer cyan glow
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 9;
      this.strokeBoltPath(ctx, strike.segments);

      // Inner white hot core
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      this.strokeBoltPath(ctx, strike.segments);

      // Sub-branches
      ctx.strokeStyle = '#80d8ff';
      ctx.lineWidth = 2.5;
      for (const branch of strike.branches) {
        ctx.beginPath();
        ctx.moveTo(branch.from.x, branch.from.y);
        for (const pt of branch.path) {
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Ground impact shockwave ring
      const ringR = (1.0 - alpha) * 80 + 15;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(strike.x, strike.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  strokeBoltPath(ctx, segments) {
    if (!segments || segments.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) {
      ctx.lineTo(segments[i].x, segments[i].y);
    }
    ctx.stroke();
  }

  // ===========================================================================
  // TARGETING HUD & AIMING RETICLE
  // Distinguishes hostile creatures from civilians
  // ===========================================================================
  renderTargetingHUD(ctx) {
    if (this.hammer.state === 'IDLE' && !this.terminalOpen) {
      ctx.save();
      const displayRange = 920;
      const endX = this.hammer.x + Math.cos(this.aimAngle) * displayRange;
      const endY = this.hammer.y + Math.sin(this.aimAngle) * displayRange;

      const alpha = this.isCharging ? (0.7 + this.power * 0.3) : 0.45;
      const lineWidth = this.isCharging ? (3 + this.power * 4) : 2;

      // Laser Trajectory Guide
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = this.isCharging ? 14 : 6;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(this.hammer.x, this.hammer.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Check lock-on on revealed hostile creature
      let lockedTarget = null;
      if (this.isRevealed) {
        for (const c of this.creatures) {
          if (c.defeated) continue;
          const distToLine = this.distToSegment(c.x, c.y, this.hammer.x, this.hammer.y, endX, endY);
          const distToReticle = Math.hypot(this.pointer.x - c.x, this.pointer.y - c.y);
          if (distToLine < c.r + 15 || distToReticle < c.r + 25) {
            lockedTarget = c;
            break;
          }
        }
      }

      // Check near civilian warning
      let nearCivilian = null;
      if (this.isRevealed) {
        for (const civ of this.civilians) {
          const distToLine = this.distToSegment(civ.x, civ.y, this.hammer.x, this.hammer.y, endX, endY);
          if (distToLine < civ.r + 15) {
            nearCivilian = civ;
            break;
          }
        }
      }

      if (lockedTarget) {
        // Red Lock-On combat crosshairs on creature
        ctx.strokeStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(lockedTarget.x, lockedTarget.y, lockedTarget.r + 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff1744';
        ctx.fillText('⚡ TARGET LOCKED', lockedTarget.x, lockedTarget.y + lockedTarget.r + 18);

      } else if (nearCivilian) {
        // Green innocent warning
        ctx.strokeStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(nearCivilian.x, nearCivilian.y, nearCivilian.r + 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('🛡️ CIVILIAN (SAFE)', nearCivilian.x, nearCivilian.y + nearCivilian.r + 16);
      }

      // Cursor Aim Reticle
      ctx.strokeStyle = this.isCharging ? '#ffd200' : '#00f0ff';
      ctx.shadowColor = this.isCharging ? '#ffd200' : '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(endX, endY, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endX - 10, endY); ctx.lineTo(endX + 10, endY);
      ctx.moveTo(endX, endY - 10); ctx.lineTo(endX, endY + 10);
      ctx.stroke();

      ctx.restore();
    }
  }

  // ===========================================================================
  // MJOLNIR HAMMER RENDERING
  // ===========================================================================
  drawMjolnir(ctx) {
    ctx.save();
    ctx.translate(this.hammer.x, this.hammer.y);
    ctx.rotate(this.hammer.rotation);

    if (this.hammer.state === 'THROWN' || this.hammer.state === 'RETURNING') {
      const haloColor = this.hammer.state === 'RETURNING' ? '#ffd200' : '#00f0ff';
      ctx.fillStyle = haloColor;
      ctx.shadowColor = haloColor;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(0, 0, this.hammer.radius + 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
    }

    // Wooden Handle & Leather Wrapping
    ctx.fillStyle = '#4a2e18';
    ctx.fillRect(-4, -4, 8, 28);
    ctx.strokeStyle = '#c8a064';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, 4); ctx.lineTo(4, 8);
    ctx.moveTo(-4, 12); ctx.lineTo(4, 16);
    ctx.moveTo(-4, 20); ctx.lineTo(4, 24);
    ctx.stroke();

    // Pommel
    ctx.fillStyle = '#888';
    ctx.fillRect(-5, 24, 10, 4);

    // Uru Metal Hammer Head
    ctx.fillStyle = '#8395a7';
    ctx.fillRect(-15, -14, 30, 20);
    ctx.fillStyle = '#a4b0be';
    ctx.fillRect(-13, -12, 26, 8);

    // Central Norse Rune
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(-4, -8, 8, 8);

    ctx.restore();
  }
}

window.ThorHammerGame = ThorHammerGame;
