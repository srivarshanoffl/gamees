/**
 * thor-hammer.js
 * MJÖLNIR RETURN — CLEAN CINEMATIC SUPERHERO GAMEPLAY
 * 
 * Progression:
 *   TRAITORS HOLD CIVILIANS AS SHIELDS (Stage 1: SHIELDS_ACTIVE)
 *        ↓
 *   SOLVE BUG VIA DISCREET CONTROL (Stage 2: REPAIRING)
 *        ↓
 *   CELESTIAL THUNDER EVACUATES CIVILIANS (Stage 3: THUNDER_SEQUENCE)
 *        ↓
 *   TRAITORS EXPOSED & TARGET-LOCKED (Stage 4: TRAITORS_EXPOSED)
 *        ↓
 *   THOR UNLEASHES MJÖLNIR (Stage 5: COMBAT)
 *        ↓
 *   ALL TRAITORS PURGED → REALM SECURED (Stage 6: VICTORY)
 */

class ThorHammerGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'thorhammer';
    this.bgColor = '#03050a';

    // Offscreen illumination mask canvas for dynamic 2D lighting
    try {
      if (typeof document !== 'undefined' && document.createElement) {
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = window.innerWidth;
        this.lightCanvas.height = window.innerHeight;
        this.lightCtx = this.lightCanvas.getContext('2d');
      }
    } catch (e) {
      this.lightCanvas = null;
      this.lightCtx = null;
    }

    // Atmospheric stormy rain mist
    this.ambientStorm = [];
    for (let i = 0; i < 40; i++) {
      this.ambientStorm.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speedX: -60 - Math.random() * 30,
        speedY: 160 + Math.random() * 80,
        len: Math.random() * 14 + 6,
        alpha: Math.random() * 0.25 + 0.1
      });
    }

    // Cinematic Asgardian Battlefield Background Image
    this.bgImg = new Image();
    this.bgImg.src = 'assets/asgard_battlefield.jpg';

    // Realistic Thor character image asset
    this.thorImg = new Image();
    this.thorImg.src = 'assets/thor.png';

    // Generated High-Fidelity Villain Character Assets
    this.traitorImages = [
      new Image(),
      new Image(),
      new Image()
    ];
    this.traitorImages[0].src = 'assets/traitor1.png';
    this.traitorImages[1].src = 'assets/traitor2.png';
    this.traitorImages[2].src = 'assets/traitor3.png';

    this.activeStrikes = [];
    this.groundY = window.innerHeight * 0.82;

    this.reset();
  }

  onResize() {
    if (this.lightCanvas) {
      this.lightCanvas.width = this.vWidth;
      this.lightCanvas.height = this.vHeight;
    }
    this.groundY = this.vHeight * 0.82;

    // Reposition Thor if initialized
    if (this.thor) {
      this.thor.x = this.vWidth * 0.16;
      this.thor.y = this.groundY;
      this.thor.handX = this.thor.x + 50;
      this.thor.handY = this.groundY - 110;
    }

    if (this.hammer && this.hammer.state === 'IDLE' && this.thor) {
      this.hammer.x = this.thor.handX;
      this.hammer.y = this.thor.handY;
      this.hammer.prevX = this.thor.handX;
      this.hammer.prevY = this.thor.handY;
    }

    // Reposition Traitors and Civilians proportionally
    if (this.traitors) {
      const tPositions = [0.50, 0.69, 0.86];
      this.traitors.forEach((t, i) => {
        t.x = this.vWidth * tPositions[i];
        t.y = this.groundY;
      });
    }

    if (this.civilians) {
      const tPositions = [0.50, 0.69, 0.86];
      this.civilians.forEach((civ, i) => {
        civ.x = this.vWidth * tPositions[i];
        if (!civ.rescued && !civ.evacuating) {
          civ.y = this.groundY - 20;
        }
      });
    }
  }

  playSound(name) {
    try {
      if (window.soundFX && typeof window.soundFX[name] === 'function') {
        window.soundFX[name]();
      }
    } catch (e) {}
  }

  showToast(message, duration = 1400) {
    const toast = document.getElementById('cinematicToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // ===========================================================================
  // GAME INITIALIZATION & DETERMINISTIC RESTART
  // ===========================================================================
  reset() {
    this.state = 'PLAYING';
    this.powerLocked = true;
    this.powerUnlocked = false;
    this.civiliansRescued = false;
    this.intrudersDefeated = false;
    this.progressionState = 'powerLocked';
    this.missionState = 'SHIELDS_ACTIVE';
    this.terminalOpen = false;
    this.bugSolved = false;

    this.groundY = this.vHeight * 0.82;

    // 1. DOMINANT, ENLARGED THOR (1.65× Scale)
    this.thor = {
      x: this.vWidth * 0.16,
      y: this.groundY,
      width: 210,
      height: 240,
      handX: this.vWidth * 0.16 + 50,
      handY: this.groundY - 110,
      hp: 100,
      maxHp: 100
    };

    // 2. MJÖLNIR HAMMER (Locked until Stage 4/5)
    this.hammer = {
      state: 'IDLE',
      x: this.thor.handX,
      y: this.thor.handY,
      prevX: this.thor.handX,
      prevY: this.thor.handY,
      vx: 0,
      vy: 0,
      speed: 0,
      maxRange: this.vWidth * 1.2,
      distanceTraveled: 0,
      radius: 20,
      rotation: 0
    };

    this.power = 0;
    this.isCharging = false;
    this.aimAngle = 0;
    this.lightningTimer = 0;
    this.thunderTimer = 0;

    this.particles = [];
    this.activeStrikes = [];

    // 3. DISTINCT ASGARDIAN TRAITORS
    this.traitors = [
      {
        id: 't1',
        name: 'Cyber Vanguard',
        x: this.vWidth * 0.50,
        y: this.groundY,
        w: 140,
        h: 175,
        r: 38,
        hp: 1,
        maxHp: 1,
        eliminated: false,
        imgIdx: 0,
        shieldCivId: 'civ1',
        vulnerable: false,
        fade: 1.0,
        hitTimer: 0
      },
      {
        id: 't2',
        name: 'Shadow Operative',
        x: this.vWidth * 0.69,
        y: this.groundY,
        w: 140,
        h: 175,
        r: 38,
        hp: 1,
        maxHp: 1,
        eliminated: false,
        imgIdx: 1,
        shieldCivId: 'civ2',
        vulnerable: false,
        fade: 1.0,
        hitTimer: 0
      },
      {
        id: 't3',
        name: 'Dread Warlord',
        x: this.vWidth * 0.86,
        y: this.groundY,
        w: 155,
        h: 185,
        r: 44,
        hp: 1,
        maxHp: 1,
        eliminated: false,
        imgIdx: 2,
        shieldCivId: 'civ3',
        vulnerable: false,
        fade: 1.0,
        hitTimer: 0
      }
    ];

    // 4. CAPTURED CIVILIANS HELD DIRECTLY IN FRONT AS HUMAN SHIELDS
    this.civilians = [
      {
        id: 'civ1',
        name: 'Lady Sigrid',
        x: this.vWidth * 0.50,
        y: this.groundY - 20,
        r: 25,
        tunicColor: '#1e824c',
        hairColor: '#5c3a21',
        fade: 1.0,
        rescued: false,
        heldByTraitorId: 't1',
        evacuating: false,
        evacProgress: 0
      },
      {
        id: 'civ2',
        name: 'Sage Harek',
        x: this.vWidth * 0.69,
        y: this.groundY - 20,
        r: 25,
        tunicColor: '#2980b9',
        hairColor: '#d35400',
        fade: 1.0,
        rescued: false,
        heldByTraitorId: 't2',
        evacuating: false,
        evacProgress: 0
      },
      {
        id: 'civ3',
        name: 'Villager Bryn',
        x: this.vWidth * 0.86,
        y: this.groundY - 20,
        r: 25,
        tunicColor: '#8e44ad',
        hairColor: '#f39c12',
        fade: 1.0,
        rescued: false,
        heldByTraitorId: 't3',
        evacuating: false,
        evacProgress: 0
      }
    ];

    // Initial aim towards first enemy position
    const dx = this.traitors[0].x - this.thor.handX;
    const dy = this.traitors[0].y - 80 - this.thor.handY;
    this.aimAngle = Math.atan2(dy, dx);

    this.updateHUD();
  }

  // ===========================================================================
  // DEBUG TERMINAL INTERACTION
  // ===========================================================================
  openDebugTerminal() {
    if (this.missionState !== 'SHIELDS_ACTIVE') return;
    this.terminalOpen = true;
    const overlay = document.getElementById('debugTerminalOverlay');
    if (overlay) overlay.classList.remove('hidden');
    this.playSound('click');
  }

  closeDebugTerminal() {
    this.terminalOpen = false;
    const overlay = document.getElementById('debugTerminalOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ===========================================================================
  // STAGE 2 — SOLVE THE BUG & UNLOCK THUNDER
  // ===========================================================================
  solveCodingBug() {
    if (this.bugSolved) return;

    this.bugSolved = true;
    this.powerLocked = false;
    this.powerUnlocked = true;
    this.progressionState = 'powerUnlocked';
    this.missionState = 'REPAIRING';

    this.playSound('powerup');
    this.shake(12, 0.35);
    this.showToast('⚡ THUNDER UNLOCKED');

    // Cinematic burst of electricity around Thor
    this.spawnLightningStrike(this.thor.x, this.thor.y - 120);
    this.spawnImpactParticles(this.thor.x, this.thor.y - 80, '#00f0ff', 24);
    this.spawnImpactParticles(this.thor.x, this.thor.y - 80, '#ffd200', 20);

    // Golden & Cyan celebration burst
    for (let i = 0; i < 32; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 220 + 60;
      this.spawnParticle(
        this.thor.x, this.thor.y - 80,
        Math.cos(ang) * spd, Math.sin(ang) * spd,
        Math.random() > 0.5 ? '#ffd200' : '#00f0ff',
        Math.random() * 4 + 2, 0.6
      );
    }

    this.updateHUD();

    // Automatically initiate the civilian rescue thunder sequence after power restoration burst
    setTimeout(() => {
      this.startThunderSequence();
    }, 750);
  }

  // ===========================================================================
  // STAGE 3 — CELESTIAL THUNDER & CIVILIAN EVACUATION
  // ===========================================================================
  startThunderSequence() {
    if (this.civiliansRescued) return;

    this.missionState = 'THUNDER_SEQUENCE';
    this.thunderTimer = 0;
    this.playSound('thunder');
    this.shake(16, 0.5);
    this.showToast('⚡ RESCUING CIVILIANS...');

    // Initial massive lightning strikes over captured civilians
    this.civilians.forEach(civ => {
      this.spawnLightningStrike(civ.x, civ.y);
      civ.evacuating = true;
    });

    this.spawnLightningStrike(this.thor.x, this.thor.y - 100);
    this.updateHUD();
  }

  // ===========================================================================
  // STAGE 4 — CIVILIANS RESCUED & INTRUDERS EXPOSED
  // ===========================================================================
  startTraitorExposure() {
    this.civiliansRescued = true;
    this.progressionState = 'civiliansRescued';
    this.missionState = 'TRAITORS_EXPOSED';
    this.playSound('powerup');
    this.shake(8, 0.25);
    this.showToast('CIVILIANS SAFE! SMASH INTRUDERS!');

    this.traitors.forEach(t => {
      t.vulnerable = true;
    });

    this.updateHUD();

    // Unlock combat after short exposure lock-on transition
    setTimeout(() => {
      if (this.missionState === 'TRAITORS_EXPOSED') {
        this.missionState = 'COMBAT';
        this.updateHUD();
      }
    }, 700);
  }

  // ===========================================================================
  // LIGHTNING GENERATION
  // ===========================================================================
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
      timer: 0.4,
      maxTimer: 0.4
    });

    // Impact sparks on ground
    this.spawnImpactParticles(x, y, '#00f0ff', 16);
    this.spawnImpactParticles(x, y, '#ffffff', 10);
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

    // Atmospheric mist animation
    for (const drop of this.ambientStorm) {
      drop.x += drop.speedX * dt;
      drop.y += drop.speedY * dt;
      if (drop.y > this.vHeight) {
        drop.y = -10;
        drop.x = Math.random() * this.vWidth + 100;
      }
      if (drop.x < 0) {
        drop.x = this.vWidth;
      }
    }

    // Active lightning strikes decay
    for (let i = this.activeStrikes.length - 1; i >= 0; i--) {
      this.activeStrikes[i].timer -= dt;
      if (this.activeStrikes[i].timer <= 0) {
        this.activeStrikes.splice(i, 1);
      }
    }

    // Traitors hit feedback decay
    for (const t of this.traitors) {
      if (t.hitTimer > 0) t.hitTimer -= dt;
      if (t.eliminated && t.fade > 0) {
        t.fade = Math.max(0, t.fade - dt * 2.5);
      }
    }

    // =========================================================================
    // THUNDER & EVACUATION UPDATE
    // =========================================================================
    if (this.missionState === 'THUNDER_SEQUENCE') {
      this.thunderTimer += dt;

      // Intermittent lightning strikes during evacuation
      if (Math.random() < dt * 4.5) {
        const randX = this.vWidth * (0.35 + Math.random() * 0.55);
        this.spawnLightningStrike(randX, this.groundY);
        this.shake(5, 0.15);
      }

      // Evacuate civilians
      let allEvacuated = true;
      for (const civ of this.civilians) {
        if (!civ.rescued) {
          allEvacuated = false;
          civ.evacProgress = Math.min(1.0, civ.evacProgress + dt * 0.85);

          // Float upward into teleportation vortex
          civ.y -= dt * 45;
          civ.fade = Math.max(0, 1.0 - civ.evacProgress);

          // Ascending lightning & teleportation particles
          if (Math.random() < 0.6) {
            this.spawnParticle(
              civ.x + (Math.random() - 0.5) * 30,
              civ.y + (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 40,
              -Math.random() * 120 - 40,
              Math.random() > 0.4 ? '#00f0ff' : '#00ff88',
              Math.random() * 3 + 2,
              0.5
            );
          }

          if (civ.evacProgress >= 1.0) {
            civ.rescued = true;
            civ.fade = 0;
            this.spawnImpactParticles(civ.x, civ.y, '#00ff88', 20);
            this.spawnImpactParticles(civ.x, civ.y, '#00f0ff', 15);
            this.playSound('collect');
            this.updateHUD();
          }
        }
      }

      // Once all civilians are safely evacuated and thunder duration satisfied
      if (allEvacuated && this.thunderTimer >= 2.0) {
        this.startTraitorExposure();
      }
    }

    // Input & Mjölnir combat
    this.updateInput(dt);
    this.updateHammer(dt);
    this.checkCombatCollisions(dt);
    this.updateHUD();

    // Check Victory Condition: All intruders eliminated and hammer caught
    const allEliminated = this.traitors.every(t => t.eliminated);
    if (allEliminated && this.hammer.state === 'IDLE' && (this.missionState === 'COMBAT' || this.progressionState === 'civiliansRescued')) {
      this.intrudersDefeated = true;
      this.progressionState = 'intrudersDefeated';
      this.missionState = 'VICTORY';
      this.playSound('victory');
      this.triggerVictory('All intruders defeated with divine thunder! All civilians rescued.');
    }
  }

  // ===========================================================================
  // INPUT & ATTACK HANDLING
  // Strictly locked until Stage 4 (civiliansRescued & COMBAT)
  // ===========================================================================
  updateInput(dt) {
    if (this.terminalOpen) return;

    // 1. Aim Angle Calculation
    if (this.pointer && (this.pointer.x > 0 || this.pointer.y > 0)) {
      const dx = Math.max(40, this.pointer.x - this.thor.handX);
      const dy = this.pointer.y - this.thor.handY;
      this.aimAngle = Math.atan2(dy, dx);
    }

    // 2. Reject Hammer Attack if civilians not rescued or not in COMBAT stage
    if (!this.civiliansRescued || this.missionState !== 'COMBAT') {
      this.isCharging = false;
      this.power = 0;
      return;
    }

    // 3. Hammer Combat Throw (Charge & Release)
    if (this.hammer.state === 'IDLE') {
      if (this.pointer.isDown) {
        this.isCharging = true;
        this.power = Math.min(1.0, this.power + dt * 1.8);
      } else if (this.isCharging && (this.pointer.justReleased || !this.pointer.isDown)) {
        this.throwHammerAtTarget();
      }
    }
  }

  throwHammerAtTarget() {
    if (this.hammer.state !== 'IDLE' || !this.civiliansRescued || this.missionState !== 'COMBAT') return;

    this.isCharging = false;
    this.hammer.state = 'THROWN';
    this.hammer.prevX = this.hammer.x;
    this.hammer.prevY = this.hammer.y;
    this.hammer.distanceTraveled = 0;

    const speed = 1200 + (this.power * 500);
    this.hammer.maxRange = 1400;

    this.hammer.vx = Math.cos(this.aimAngle) * speed;
    this.hammer.vy = Math.sin(this.aimAngle) * speed;

    this.shake(5, 0.18);
    this.playSound('thwip');

    // Electric burst on throw
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      this.spawnParticle(
        this.hammer.x, this.hammer.y,
        Math.cos(ang) * 140, Math.sin(ang) * 140,
        '#00f0ff', Math.random() * 3 + 2, 0.35
      );
    }

    this.power = 0;
  }

  // ===========================================================================
  // MJÖLNIR FLIGHT & RETURN
  // ===========================================================================
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
      this.hammer.rotation += dt * 32;

      // Arena boundary bounces
      if (this.hammer.y <= 30 && this.hammer.vy < 0) {
        this.hammer.y = 30;
        this.hammer.vy = -this.hammer.vy;
        this.shake(3, 0.1);
        this.playSound('shieldBounce');
      } else if (this.hammer.y >= this.groundY - 10 && this.hammer.vy > 0) {
        this.hammer.y = this.groundY - 10;
        this.hammer.vy = -this.hammer.vy;
        this.shake(3, 0.1);
        this.playSound('hit');
      }

      // Electric spark trail
      this.spawnParticle(
        this.hammer.x + (Math.random() - 0.5) * 14,
        this.hammer.y + (Math.random() - 0.5) * 14,
        -this.hammer.vx * 0.08 + (Math.random() - 0.5) * 30,
        -this.hammer.vy * 0.08 + (Math.random() - 0.5) * 30,
        '#00f0ff', Math.random() * 4 + 2, 0.3
      );

      if (this.hammer.x >= this.vWidth - 20 || this.hammer.x <= 0 || this.hammer.distanceTraveled >= this.hammer.maxRange) {
        this.startReturning();
      }

    } else if (this.hammer.state === 'RETURNING') {
      this.hammer.prevX = this.hammer.x;
      this.hammer.prevY = this.hammer.y;

      const dx = this.thor.handX - this.hammer.x;
      const dy = this.thor.handY - this.hammer.y;
      const dist = Math.hypot(dx, dy);

      this.hammer.rotation -= dt * 32;

      const returnSpeed = 1300;
      const step = returnSpeed * dt;

      const targetVx = (dx / dist) * returnSpeed;
      const targetVy = (dy / dist) * returnSpeed;

      const blend = Math.min(1.0, dt * 18);
      this.hammer.vx += (targetVx - this.hammer.vx) * blend;
      this.hammer.vy += (targetVy - this.hammer.vy) * blend;

      this.hammer.x += this.hammer.vx * dt;
      this.hammer.y += this.hammer.vy * dt;

      // Catch Condition
      if (dist < 46 || dist <= step * 1.5) {
        this.hammer.state = 'IDLE';
        this.hammer.x = this.thor.handX;
        this.hammer.y = this.thor.handY;
        this.hammer.prevX = this.thor.handX;
        this.hammer.prevY = this.thor.handY;
        this.hammer.vx = 0;
        this.hammer.vy = 0;
        this.shake(6, 0.2);
        this.playSound('thunder');

        for (let i = 0; i < 22; i++) {
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
          this.hammer.x + (Math.random() - 0.5) * 14,
          this.hammer.y + (Math.random() - 0.5) * 14,
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
  // COMBAT COLLISION HANDLING
  // ===========================================================================
  checkCombatCollisions(dt) {
    if (this.hammer.state === 'IDLE' || this.missionState !== 'COMBAT') return;

    const x1 = this.hammer.prevX || this.hammer.x;
    const y1 = this.hammer.prevY || this.hammer.y;
    const x2 = this.hammer.x;
    const y2 = this.hammer.y;

    for (const t of this.traitors) {
      if (t.eliminated || t.hitTimer > 0) continue;

      const traitorCenterY = t.y - t.h * 0.5;
      const dist = this.distToSegment(t.x, traitorCenterY, x1, y1, x2, y2);

      if (dist < this.hammer.radius + t.r) {
        t.hp -= 1;
        t.hitTimer = 0.3;

        this.playSound('hit');
        this.shake(10, 0.25);
        this.spawnImpactParticles(t.x, traitorCenterY, '#ff1744', 24);
        this.spawnImpactParticles(t.x, traitorCenterY, '#00f0ff', 18);

        if (t.hp <= 0) {
          t.eliminated = true;

          // Ground lightning impact on elimination
          this.spawnLightningStrike(t.x, this.groundY);

          // Disintegration particle blast
          for (let i = 0; i < 30; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 240 + 60;
            this.spawnParticle(
              t.x, traitorCenterY,
              Math.cos(ang) * spd, Math.sin(ang) * spd,
              Math.random() > 0.5 ? '#ff1744' : '#00f0ff',
              Math.random() * 4 + 2, 0.55
            );
          }
        }

        this.startReturning();
        this.updateHUD();
        break;
      }
    }
  }

  // ===========================================================================
  // HUD UPDATES — DISCREET MINIMAL CONTROLS
  // ===========================================================================
  updateHUD() {
    const primaryBtn = document.getElementById('primaryActionBtn');

    if (primaryBtn) {
      if (this.progressionState === 'powerLocked' || this.missionState === 'SHIELDS_ACTIVE') {
        primaryBtn.className = 'cinematic-action-btn solve-mode';
        primaryBtn.disabled = false;
        primaryBtn.innerHTML = '<span>🛠️ DEBUG CODE</span>';

      } else if (this.progressionState === 'powerUnlocked' && this.missionState === 'REPAIRING') {
        primaryBtn.className = 'cinematic-action-btn solve-mode';
        primaryBtn.disabled = false;
        primaryBtn.innerHTML = '<span>⚡ CALL THUNDER</span>';

      } else if (this.missionState === 'THUNDER_SEQUENCE') {
        primaryBtn.className = 'cinematic-action-btn';
        primaryBtn.disabled = true;
        primaryBtn.innerHTML = '<span>⚡ EVACUATING...</span>';

      } else if (this.missionState === 'TRAITORS_EXPOSED') {
        primaryBtn.className = 'cinematic-action-btn combat-mode';
        primaryBtn.disabled = true;
        primaryBtn.innerHTML = '<span>🎯 TARGETING...</span>';

      } else if (this.progressionState === 'civiliansRescued' || this.missionState === 'COMBAT') {
        primaryBtn.className = 'cinematic-action-btn combat-mode';
        primaryBtn.disabled = false;
        primaryBtn.innerHTML = '<span>🔨 THROW MJÖLNIR</span>';

      } else if (this.progressionState === 'intrudersDefeated' || this.missionState === 'VICTORY') {
        primaryBtn.className = 'cinematic-action-btn';
        primaryBtn.disabled = true;
        primaryBtn.innerHTML = '<span>✓ REALM SECURED</span>';
      }
    }
  }

  // ===========================================================================
  // CINEMATIC GRAPHICS RENDERING
  // ===========================================================================
  render(ctx) {
    // 1. ASGARDIAN BATTLEFIELD BACKGROUND
    if (this.bgImg && this.bgImg.complete && this.bgImg.naturalWidth > 0) {
      const imgAspect = this.bgImg.naturalWidth / this.bgImg.naturalHeight;
      const canvasAspect = this.vWidth / this.vHeight;
      let drawW = this.vWidth;
      let drawH = this.vHeight;
      let drawX = 0;
      let drawY = 0;

      if (canvasAspect > imgAspect) {
        drawH = this.vWidth / imgAspect;
        drawY = (this.vHeight - drawH) / 2;
      } else {
        drawW = this.vHeight * imgAspect;
        drawX = (this.vWidth - drawW) / 2;
      }

      ctx.drawImage(this.bgImg, drawX, drawY, drawW, drawH);

      // Subtle atmospheric vignette & ground depth
      const groundFog = ctx.createLinearGradient(0, this.groundY - 140, 0, this.vHeight);
      groundFog.addColorStop(0, 'rgba(4, 7, 16, 0)');
      groundFog.addColorStop(0.5, 'rgba(4, 7, 16, 0.45)');
      groundFog.addColorStop(1, 'rgba(3, 5, 12, 0.85)');
      ctx.fillStyle = groundFog;
      ctx.fillRect(0, this.groundY - 140, this.vWidth, this.vHeight - (this.groundY - 140));

    } else {
      // Fallback procedural sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
      skyGrad.addColorStop(0, '#020409');
      skyGrad.addColorStop(0.5, '#060d1d');
      skyGrad.addColorStop(1, '#040816');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.vWidth, this.vHeight);
    }

    // Glowing subtle Bifrost ground fissures
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(this.vWidth * 0.1, this.groundY + 12);
    ctx.lineTo(this.vWidth * 0.38, this.groundY + 18);
    ctx.lineTo(this.vWidth * 0.45, this.groundY + 10);
    ctx.lineTo(this.vWidth * 0.72, this.groundY + 22);
    ctx.lineTo(this.vWidth * 0.95, this.groundY + 14);
    ctx.stroke();
    ctx.restore();

    // 2. AMBIENT STORM WEATHER
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.22)';
    ctx.lineWidth = 1;
    for (const drop of this.ambientStorm) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + (drop.speedX * 0.04), drop.y + (drop.speedY * 0.04));
      ctx.stroke();
    }
    ctx.restore();

    // 3. DYNAMIC 2D LIGHTING & STORM ATMOSPHERE
    this.renderDynamicLighting(ctx);

    // 4. DRAW DOMINANT THOR (1.65× scale)
    this.drawThor(ctx);

    // 5. DRAW ASGARDIAN TRAITORS (Seamlessly blended, zero square border boxes)
    this.drawTraitors(ctx);

    // 6. DRAW CAPTURED CIVILIANS (In front as shields, zero text clutter)
    this.drawCivilians(ctx);

    // 7. ACTIVE LIGHTNING STRIKES
    this.renderLightningStrikes(ctx);

    // 8. AIMING RETICLE & TARGET LOCK HUD
    this.renderTargetingHUD(ctx);

    // 9. MJÖLNIR HAMMER
    this.drawMjolnir(ctx);
  }

  // ===========================================================================
  // THOR HERO RENDERING (1.65× Former Size — Strong Dominant Presence)
  // ===========================================================================
  drawThor(ctx) {
    ctx.save();
    ctx.translate(this.thor.x, this.thor.y);

    const bob = Math.sin(this.lightningTimer * 3.5) * 2;
    const drawW = this.thor.width;
    const drawH = this.thor.height;
    const drawX = -drawW / 2;
    const drawY = -drawH + 12 + bob;

    // Ground contact shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 70, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.thorImg && this.thorImg.complete && this.thorImg.naturalWidth > 0) {
      // Atmospheric lightning aura when charging or calling thunder
      if (this.isCharging || this.missionState === 'THUNDER_SEQUENCE') {
        ctx.save();
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 28;
        ctx.drawImage(this.thorImg, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Cyan electric arcs crackling around Thor's armor
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        const arcY = drawY + drawH * 0.42;
        ctx.beginPath();
        ctx.moveTo(-20 + (Math.random() - 0.5) * 16, arcY);
        ctx.lineTo(20 + (Math.random() - 0.5) * 16, arcY + (Math.random() - 0.5) * 16);
        ctx.stroke();
      } else {
        ctx.drawImage(this.thorImg, drawX, drawY, drawW, drawH);
      }

      // Glowing electric blue eyes
      const eyeY = drawY + drawH * 0.13;
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(-6, eyeY, 4, 3);
      ctx.fillRect(6, eyeY, 4, 3);

    } else {
      ctx.fillStyle = '#b80d0d';
      ctx.fillRect(-35, drawY + 30, 70, 160);
      ctx.fillStyle = '#34455e';
      ctx.fillRect(-28, drawY + 20, 56, 120);
      ctx.fillStyle = '#ffe0b2';
      ctx.beginPath();
      ctx.arc(0, drawY + 20, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Helper to remove black image background so traitor artwork blends seamlessly as transparent sprites
  getFeatheredTraitor(img, w, h) {
    if (!img || !img.complete || img.naturalWidth === 0) return null;
    // Transparent PNG cutouts are drawn directly with full fidelity
    if (img.src && img.src.includes('.png')) {
      return img;
    }
    if (!img._featheredCanvas) {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0);

      // Chroma-key black removal to eliminate rectangular borders
      try {
        const imgData = cx.getImageData(0, 0, c.width, c.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const maxVal = Math.max(r, g, b);
          if (maxVal < 15) {
            data[i + 3] = 0;
          } else if (maxVal < 45) {
            data[i + 3] = Math.floor(255 * ((maxVal - 15) / 30));
          }
        }
        cx.putImageData(imgData, 0, 0);
      } catch (e) {}

      img._featheredCanvas = c;
    }
    return img._featheredCanvas || img;
  }

  // ===========================================================================
  // ASGARDIAN TRAITORS RENDERING (SEAMLESSLY BLENDED, ZERO TEXT)
  // ===========================================================================
  drawTraitors(ctx) {
    for (const t of this.traitors) {
      if (t.fade <= 0) continue;

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.globalAlpha = t.fade;

      const isHit = t.hitTimer > 0;
      const bob = Math.sin(this.lightningTimer * 3 + t.x) * 2;
      const drawX = -t.w / 2;
      const drawY = -t.h + bob;

      // Realistic soft ground contact shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 50, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Subtle Crimson Vulnerability Aura when exposed in COMBAT
      if (t.vulnerable && !t.eliminated) {
        ctx.save();
        const pulse = Math.sin(this.lightningTimer * 6) * 4;
        ctx.strokeStyle = 'rgba(255, 23, 68, 0.7)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 14 + pulse;
        // Corner bracket reticle instead of a solid box
        const cornerLen = 16;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(drawX - 2, drawY - 2 + cornerLen);
        ctx.lineTo(drawX - 2, drawY - 2);
        ctx.lineTo(drawX - 2 + cornerLen, drawY - 2);
        // Top-right
        ctx.moveTo(drawX + t.w + 2 - cornerLen, drawY - 2);
        ctx.lineTo(drawX + t.w + 2, drawY - 2);
        ctx.lineTo(drawX + t.w + 2, drawY - 2 + cornerLen);
        // Bottom-left
        ctx.moveTo(drawX - 2, drawY + t.h + 2 - cornerLen);
        ctx.lineTo(drawX - 2, drawY + t.h + 2);
        ctx.lineTo(drawX - 2 + cornerLen, drawY + t.h + 2);
        // Bottom-right
        ctx.moveTo(drawX + t.w + 2 - cornerLen, drawY + t.h + 2);
        ctx.lineTo(drawX + t.w + 2, drawY + t.h + 2);
        ctx.lineTo(drawX + t.w + 2, drawY + t.h + 2 - cornerLen);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Traitor Character Artwork (Transparent cutout, zero rectangular border)
      const rawImg = this.traitorImages[t.imgIdx];
      const featheredSprite = this.getFeatheredTraitor(rawImg, t.w, t.h);

      if (featheredSprite) {
        if (isHit) {
          ctx.save();
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 24;
          ctx.drawImage(featheredSprite, drawX, drawY, t.w, t.h);
          ctx.restore();
        } else {
          ctx.drawImage(featheredSprite, drawX, drawY, t.w, t.h);
        }
      } else {
        ctx.fillStyle = isHit ? '#ffffff' : '#111827';
        ctx.fillRect(drawX, drawY, t.w, t.h);
      }

      // Menacing Crimson Optic Glow
      ctx.fillStyle = '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 10;
      ctx.fillRect(-10, drawY + t.h * 0.18, 6, 4);
      ctx.fillRect(4, drawY + t.h * 0.18, 6, 4);

      ctx.restore();
    }
  }

  // ===========================================================================
  // CAPTURED CIVILIANS RENDERING (IN FRONT AS SHIELDS, ZERO TEXT)
  // ===========================================================================
  drawCivilians(ctx) {
    for (const civ of this.civilians) {
      if (civ.fade <= 0) continue;

      ctx.save();
      ctx.translate(civ.x, civ.y);
      ctx.globalAlpha = civ.fade;

      const bob = Math.sin(this.lightningTimer * 4 + civ.x) * 2;

      // Soft ground shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 32, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Protective emerald captive aura
      const pulse = Math.sin(this.lightningTimer * 5) * 3;
      const haloGrad = ctx.createRadialGradient(0, -20, 10, 0, -20, civ.r + 26 + pulse);
      haloGrad.addColorStop(0, 'rgba(0, 255, 136, 0.35)');
      haloGrad.addColorStop(0.6, 'rgba(255, 210, 0, 0.2)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(0, -20, civ.r + 26 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Captive energy bond rings
      ctx.strokeStyle = civ.evacuating ? '#00f0ff' : 'rgba(255, 23, 68, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = civ.evacuating ? '#00f0ff' : '#ff1744';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, -22 + bob, civ.r + 10, 14, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Civilian Body (Tunic)
      ctx.fillStyle = civ.tunicColor;
      ctx.beginPath();
      ctx.moveTo(-16, 8 + bob);
      ctx.lineTo(-20, -24 + bob);
      ctx.lineTo(20, -24 + bob);
      ctx.lineTo(16, 8 + bob);
      ctx.closePath();
      ctx.fill();

      // Golden Belt
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(-12, -8 + bob, 24, 4);

      // Head
      ctx.fillStyle = '#ffe0b2';
      ctx.beginPath();
      ctx.arc(0, -36 + bob, 14, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = civ.hairColor;
      ctx.beginPath();
      ctx.arc(0, -40 + bob, 14, Math.PI, Math.PI * 2);
      ctx.fill();

      // Gentle face
      ctx.fillStyle = '#334155';
      ctx.fillRect(-5, -38 + bob, 3, 3);
      ctx.fillRect(2, -38 + bob, 3, 3);

      // (NO IN-CANVAS TEXT DISPLAYED — CLEAN CINEMATIC LOOK)

      ctx.restore();
    }
  }

  // ===========================================================================
  // DYNAMIC 2D ILLUMINATION MASK
  // ===========================================================================
  // ===========================================================================
  // DYNAMIC 2D ILLUMINATION & CELESTIAL ATMOSPHERE
  // ===========================================================================
  renderDynamicLighting(ctx) {
    // 1. Celestial Thunder Flash during evacuation sequence
    if (this.missionState === 'THUNDER_SEQUENCE') {
      const flashAlpha = 0.18 + Math.sin(this.lightningTimer * 16) * 0.14;
      ctx.save();
      ctx.fillStyle = `rgba(180, 230, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, this.vWidth, this.vHeight);
      ctx.restore();
    } else if (this.activeStrikes.length > 0) {
      // Flash on active strikes
      ctx.save();
      ctx.fillStyle = 'rgba(180, 230, 255, 0.12)';
      ctx.fillRect(0, 0, this.vWidth, this.vHeight);
      ctx.restore();
    }

    // 2. Subtle celestial cyan ground-level atmosphere
    ctx.save();
    const groundAtmosphere = ctx.createLinearGradient(0, this.groundY - 60, 0, this.vHeight);
    groundAtmosphere.addColorStop(0, 'rgba(0, 240, 255, 0)');
    groundAtmosphere.addColorStop(0.7, 'rgba(0, 240, 255, 0.05)');
    groundAtmosphere.addColorStop(1, 'rgba(0, 240, 255, 0.12)');
    ctx.fillStyle = groundAtmosphere;
    ctx.fillRect(0, this.groundY - 60, this.vWidth, this.vHeight - (this.groundY - 60));
    ctx.restore();
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
      ctx.lineWidth = 10;
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

      // Ground shockwave ring
      const ringR = (1.0 - alpha) * 90 + 15;
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
  // TARGETING HUD & AIMING RETICLE (CLEAN, NO TEXT)
  // ===========================================================================
  renderTargetingHUD(ctx) {
    if (this.missionState !== 'COMBAT' || this.hammer.state !== 'IDLE' || this.terminalOpen) return;

    ctx.save();
    const displayRange = 980;
    const endX = this.hammer.x + Math.cos(this.aimAngle) * displayRange;
    const endY = this.hammer.y + Math.sin(this.aimAngle) * displayRange;

    const alpha = this.isCharging ? (0.75 + this.power * 0.25) : 0.45;
    const lineWidth = this.isCharging ? (3 + this.power * 4) : 2;

    // Laser Trajectory Guide
    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = this.isCharging ? 16 : 6;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(this.hammer.x, this.hammer.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Check lock-on on living exposed traitor
    let lockedTarget = null;
    for (const t of this.traitors) {
      if (t.eliminated) continue;
      const traitorCenterY = t.y - t.h * 0.5;
      const distToLine = this.distToSegment(t.x, traitorCenterY, this.hammer.x, this.hammer.y, endX, endY);
      const distToReticle = Math.hypot(this.pointer.x - t.x, this.pointer.y - traitorCenterY);
      if (distToLine < t.r + 20 || distToReticle < t.r + 35) {
        lockedTarget = t;
        break;
      }
    }

    if (lockedTarget) {
      const tY = lockedTarget.y - lockedTarget.h * 0.5;
      // Red Lock-On combat crosshairs on traitor
      ctx.strokeStyle = '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lockedTarget.x, tY, lockedTarget.r + 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cursor Aim Reticle
    ctx.strokeStyle = this.isCharging ? '#ffd200' : '#00f0ff';
    ctx.shadowColor = this.isCharging ? '#ffd200' : '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(endX, endY, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endX - 12, endY); ctx.lineTo(endX + 12, endY);
    ctx.moveTo(endX, endY - 12); ctx.lineTo(endX, endY + 12);
    ctx.stroke();

    ctx.restore();
  }

  // ===========================================================================
  // MJÖLNIR HAMMER RENDERING
  // ===========================================================================
  drawMjolnir(ctx) {
    ctx.save();
    ctx.translate(this.hammer.x, this.hammer.y);
    ctx.rotate(this.hammer.rotation);

    if (this.hammer.state === 'THROWN' || this.hammer.state === 'RETURNING') {
      const haloColor = this.hammer.state === 'RETURNING' ? '#ffd200' : '#00f0ff';
      ctx.fillStyle = haloColor;
      ctx.shadowColor = haloColor;
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.arc(0, 0, this.hammer.radius + 14, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
    }

    // Wooden Handle & Leather Wrapping
    ctx.fillStyle = '#4a2e18';
    ctx.fillRect(-5, -5, 10, 32);
    ctx.strokeStyle = '#c8a064';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 4); ctx.lineTo(5, 8);
    ctx.moveTo(-5, 14); ctx.lineTo(5, 18);
    ctx.moveTo(-5, 24); ctx.lineTo(5, 28);
    ctx.stroke();

    // Pommel
    ctx.fillStyle = '#888';
    ctx.fillRect(-6, 27, 12, 5);

    // Uru Metal Hammer Head
    ctx.fillStyle = '#8395a7';
    ctx.fillRect(-18, -16, 36, 24);
    ctx.fillStyle = '#a4b0be';
    ctx.fillRect(-15, -13, 30, 10);

    // Central Norse Rune
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(-5, -9, 10, 10);

    ctx.restore();
  }

  // ===========================================================================
  // OVERRIDE VICTORY & GAME OVER
  // ===========================================================================
  triggerVictory(message = 'Mission Complete!') {
    this.state = 'VICTORY';
    this.intrudersDefeated = true;
    this.progressionState = 'intrudersDefeated';
    this.missionState = 'VICTORY';
    if (window.soundFX) window.soundFX.victory();
    const overlay = document.getElementById('victoryOverlay');
    const msgEl = document.getElementById('victoryMessage');
    const safeValEl = document.getElementById('vSafeVal');
    const traitorValEl = document.getElementById('vTraitorVal');

    if (msgEl) msgEl.textContent = message;
    if (safeValEl) safeValEl.textContent = this.civilians.filter(c => c.rescued).length;
    if (traitorValEl) traitorValEl.textContent = this.traitors.filter(t => t.eliminated).length;
    if (overlay) overlay.classList.remove('hidden');
  }

  triggerGameOver(reason = 'Mission Failed!') {
    this.state = 'GAME_OVER';
    if (window.soundFX) window.soundFX.defeat();
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.remove('hidden');
  }
}

window.ThorHammerGame = ThorHammerGame;
