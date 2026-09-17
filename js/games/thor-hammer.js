/**
 * thor-hammer.js
 * MJOLNIR RETURN — SHADOW REALM & DYNAMIC ILLUMINATION V4
 * 
 * New Gameplay & Visual Mechanic:
 * - Environment is shrouded in atmospheric pitch-black darkness.
 * - Sinister glowing eyes of Frost Giants pierce the shadows.
 * - When Mjolnir is hurled, divine lightning radiates from the hammer,
 *   dynamically illuminating the entire arena as it flies.
 * - Targets are completely static for clean, strategic precision aiming.
 * - Smashes targets on both the outgoing and returning paths.
 */

class ThorHammerGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'thorhammer';
    this.groundY = 460;
    this.bgColor = '#03050a'; // Deep mystical pitch darkness
    
    // Create light mask offscreen canvas for dynamic 2D illumination
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
    
    this.thunderCooldown = 0;
    this.thunderMaxCooldown = 5.0;
    this.thunderActiveTimer = 0;
    this.civilianCasualties = 0;
    this.maxCasualties = 1;
    this.civilians = [];
    
    this.reset();
  }

  playSound(name) {
    try {
      if (window.soundFX && typeof window.soundFX[name] === 'function') {
        window.soundFX[name]();
      }
    } catch (e) {}
  }

  triggerThunder() {
    if (this.state !== 'PLAYING') return;
    if (this.thunderCooldown > 0) return;

    this.thunderCooldown = this.thunderMaxCooldown;
    this.thunderActiveTimer = 2.4; // Illuminates darkness and exposes civilians for 2.4 seconds
    this.shake(12, 0.35);
    this.playSound('thunder');
    this.spawnComicText("KRAKK-THOOM!", 480, 140, '#ffd200');

    // Reveal innocent civilians briefly during thunder!
    for (const civ of this.civilians) {
      if (civ.active) {
        this.spawnComicText("HELP!", civ.x, civ.y - 45, '#00ff88');
      }
    }
    this.spawnScorePopup("INNOCENTS EXPOSED!", 480, 190, '#00ff88');

    // Spawn celestial sparks across the sky
    for (let i = 0; i < 35; i++) {
      this.spawnParticle(
        Math.random() * 960,
        Math.random() * 460,
        (Math.random() - 0.5) * 220,
        (Math.random() - 0.5) * 220,
        Math.random() > 0.4 ? '#00f0ff' : '#ffd200',
        Math.random() * 4 + 2,
        0.5
      );
    }
  }

  reset() {
    this.stage = 1;
    this.maxStages = 5;
    this.score = 0;
    
    this.setupLevel(this.stage);
  }

  setupLevel(levelIndex) {
    this.state = 'PLAYING';
    
    this.thor = {
      x: 120,
      y: this.groundY,
      handX: 145,
      handY: this.groundY - 72,
      hp: 100,
      maxHp: 100
    };

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
      radius: 20,
      rotation: 0
    };

    this.power = 0;
    this.isCharging = false;
    this.aimAngle = 0;

    this.targets = [];
    this.obstacles = [];
    this.runes = [];
    this.particles = [];
    this.civilians = [];
    this.civilianCasualties = 0;
    this.thunderActiveTimer = 0;
    this.thunderCooldown = 0;
    this.lightningTimer = 0;
    
    // LEVEL DESIGNS: TARGETS & INNOCENT CIVILIANS TO PROTECT (INVISIBLE UNTIL THUNDER)
    if (levelIndex === 1) {
      // Level 1: Solitary Frost Giant Sentinel + 1 innocent villager on the ground
      this.targets.push({ x: 720, y: 360, r: 32, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.runes.push({ x: 440, y: 370, r: 18, collected: false });
      this.civilians.push({ x: 460, y: 440, r: 20, active: true, name: 'Villager', revealed: false });

    } else if (levelIndex === 2) {
      // Level 2: Three static minions in defensive triangle + 1 Asgardian right in the middle
      this.targets.push({ x: 520, y: 240, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 680, y: 380, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 820, y: 180, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.runes.push({ x: 600, y: 180, r: 18, collected: false });
      this.civilians.push({ x: 630, y: 280, r: 20, active: true, name: 'Asgardian', revealed: false });

    } else if (levelIndex === 3) {
      // Level 3: Breakable Wall, backline targets, and 2 trapped civilians
      this.obstacles.push({ x: 460, y: 160, w: 36, h: 260, hp: 1, maxHp: 1, active: true });
      this.targets.push({ x: 660, y: 120, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 660, y: 400, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 840, y: 260, r: 30, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.runes.push({ x: 760, y: 140, r: 18, collected: false });
      this.civilians.push({ x: 560, y: 260, r: 20, active: true, name: 'Scholar', revealed: false });
      this.civilians.push({ x: 740, y: 390, r: 20, active: true, name: 'Villager', revealed: false });

    } else if (levelIndex === 4) {
      // Level 4: Four static frost giants with 2 innocents caught in the crossfire
      this.targets.push({ x: 480, y: 180, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 640, y: 350, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 750, y: 140, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 860, y: 300, r: 28, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.runes.push({ x: 570, y: 380, r: 18, collected: false });
      this.runes.push({ x: 760, y: 120, r: 18, collected: false });
      this.civilians.push({ x: 580, y: 190, r: 20, active: true, name: 'Elder', revealed: false });
      this.civilians.push({ x: 700, y: 260, r: 20, active: true, name: 'Priest', revealed: false });

    } else if (levelIndex === 5) {
      // Level 5: Throne Room — Frost Giant Lord, bodyguards, and 2 chained captives
      this.obstacles.push({ x: 420, y: 220, w: 32, h: 90, hp: 1, maxHp: 1, active: true });
      this.targets.push({ x: 560, y: 150, r: 24, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 560, y: 360, r: 24, type: 'minion', hp: 1, maxHp: 1, active: true, hitTimer: 0 });
      this.targets.push({ x: 800, y: 260, r: 52, type: 'boss', hp: 4, maxHp: 4, active: true, hitTimer: 0 });
      this.runes.push({ x: 700, y: 100, r: 18, collected: false });
      this.runes.push({ x: 700, y: 420, r: 18, collected: false });
      this.civilians.push({ x: 640, y: 260, r: 20, active: true, name: 'Captive', revealed: false });
      this.civilians.push({ x: 770, y: 140, r: 20, active: true, name: 'Captive', revealed: false });
    }

    // Default aim towards first target
    const firstTarget = this.targets[0];
    if (firstTarget) {
      const dx = firstTarget.x - this.thor.handX;
      const dy = firstTarget.y - this.thor.handY;
      this.aimAngle = Math.atan2(dy, dx);
    }

    this.updateHUD();
  }

  nextLevel() {
    this.stage++;
    if (this.stage > this.maxStages) {
      this.triggerVictory('SHADOW REALM PURIFIED');
    } else {
      this.setupLevel(this.stage);
    }
  }

  resetLevel() {
    this.setupLevel(this.stage);
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    if (this.thunderCooldown > 0) {
      this.thunderCooldown = Math.max(0, this.thunderCooldown - dt);
    }
    if (this.thunderActiveTimer > 0) {
      this.thunderActiveTimer = Math.max(0, this.thunderActiveTimer - dt);
    }

    this.updateInput(dt);
    this.updateHammer(dt);
    this.updateTargets(dt);
    this.checkCollisions(dt);
    this.updateHUD();
    
    // Check win condition
    if (this.hammer.state === 'IDLE' && this.targets.every(t => !t.active)) {
      this.state = 'STAGE_CLEAR';
      this.playSound('victory');
      
      const overlay = document.getElementById('levelCompleteOverlay');
      if (overlay) {
        document.getElementById('levelCompleteScore').textContent = `Score: ${this.score}`;
        if (this.stage === this.maxStages) {
          this.triggerVictory();
        } else {
          overlay.classList.remove('hidden');
        }
      }
    }
  }

  updateInput(dt) {
    const powerMeterEl = document.getElementById('powerMeterContainer');
    const powerFillEl = document.getElementById('powerMeterFill');

    // 1. DYNAMIC AIMING: Continuously track mouse or touch cursor
    if (this.pointer && (this.pointer.x > 0 || this.pointer.y > 0)) {
      const dx = Math.max(35, this.pointer.x - this.thor.handX);
      const dy = this.pointer.y - this.thor.handY;
      this.aimAngle = Math.atan2(dy, dx);
    }

    // 2. CHARGE & THROW LOGIC
    if (this.hammer.state === 'IDLE') {
      if (this.pointer.isDown) {
        this.isCharging = true;
        this.power = Math.min(1.0, this.power + dt * 2.0);
        
        if (powerMeterEl) powerMeterEl.classList.add('active');
        if (powerFillEl) powerFillEl.style.width = `${Math.round(this.power * 100)}%`;
        
      } else if (this.isCharging && (this.pointer.justReleased || !this.pointer.isDown)) {
        // EXECUTE THROW!
        this.isCharging = false;
        if (powerMeterEl) powerMeterEl.classList.remove('active');
        
        this.hammer.state = 'THROWN';
        this.hammer.prevX = this.hammer.x;
        this.hammer.prevY = this.hammer.y;
        this.hammer.distanceTraveled = 0;
        
        // Fast, high-impact throw speed
        const speed = 1050 + (this.power * 550);
        this.hammer.maxRange = 1300; // Across full arena
        
        this.hammer.vx = Math.cos(this.aimAngle) * speed;
        this.hammer.vy = Math.sin(this.aimAngle) * speed;
        
        this.shake(5, 0.18);
        this.playSound('thwip');
        
        // Thunder burst at Thor's hand
        for (let i = 0; i < 14; i++) {
          const ang = Math.random() * Math.PI * 2;
          this.spawnParticle(
            this.hammer.x, this.hammer.y,
            Math.cos(ang) * 150, Math.sin(ang) * 150,
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
      // Hover in Thor's ready hand
      this.lightningTimer += dt;
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
      this.hammer.rotation += dt * 28; // Spin
      
      // Ricochet off ceiling and ground
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
      
      // Radiant electric lightning particles
      this.spawnParticle(
        this.hammer.x + (Math.random() - 0.5) * 20, 
        this.hammer.y + (Math.random() - 0.5) * 20, 
        -this.hammer.vx * 0.08 + (Math.random() - 0.5) * 30, 
        -this.hammer.vy * 0.08 + (Math.random() - 0.5) * 30, 
        '#00f0ff', Math.random() * 4 + 2, 0.3
      );
      
      // Reached far screen boundary -> trigger return!
      if (this.hammer.x >= 930 || this.hammer.distanceTraveled >= this.hammer.maxRange) {
        this.startReturning();
      }
      
    } else if (this.hammer.state === 'RETURNING') {
      this.hammer.prevX = this.hammer.x;
      this.hammer.prevY = this.hammer.y;
      
      const dx = this.thor.handX - this.hammer.x;
      const dy = this.thor.handY - this.hammer.y;
      const dist = Math.hypot(dx, dy);
      
      this.hammer.rotation -= dt * 28; // Reverse spin
      
      const returnSpeed = 1150;
      const step = returnSpeed * dt;
      
      // Direct homing vector to Thor
      const targetVx = (dx / dist) * returnSpeed;
      const targetVy = (dy / dist) * returnSpeed;
      
      const blend = Math.min(1.0, dt * 16);
      this.hammer.vx += (targetVx - this.hammer.vx) * blend;
      this.hammer.vy += (targetVy - this.hammer.vy) * blend;
      
      this.hammer.x += this.hammer.vx * dt;
      this.hammer.y += this.hammer.vy * dt;
      
      // Catch Condition: Caught in Thor's hand
      if (dist < 42 || dist <= step * 1.5) {
        this.hammer.state = 'IDLE';
        this.hammer.x = this.thor.handX;
        this.hammer.y = this.thor.handY;
        this.hammer.prevX = this.thor.handX;
        this.hammer.prevY = this.thor.handY;
        this.hammer.vx = 0;
        this.hammer.vy = 0;
        this.shake(6, 0.2);
        this.playSound('heavyPunch');
        
        // Thunder burst upon catch
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
        // Golden lightning return trail
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
    
    // Apex burst particles
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      this.spawnParticle(
        this.hammer.x, this.hammer.y, 
        Math.cos(ang) * 120, Math.sin(ang) * 120, 
        '#ffffff', Math.random() * 3 + 2, 0.3
      );
    }
  }

  updateTargets(dt) {
    this.lightningTimer += dt;
    // Targets are static; only update their damage cooldowns
    for (const t of this.targets) {
      if (!t.active) continue;
      if (t.hitTimer > 0) t.hitTimer -= dt;
    }
  }

  // Point-to-Line-Segment Distance for Continuous Collision Detection (CCD)
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

  checkCollisions(dt) {
    if (this.hammer.state === 'IDLE') return;

    const x1 = this.hammer.prevX || this.hammer.x;
    const y1 = this.hammer.prevY || this.hammer.y;
    const x2 = this.hammer.x;
    const y2 = this.hammer.y;

    // 1. BREAKABLE OBSTACLES
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      
      const testX = Math.max(obs.x, Math.min(this.hammer.x, obs.x + obs.w));
      const testY = Math.max(obs.y, Math.min(this.hammer.y, obs.y + obs.h));
      const dist = Math.hypot(this.hammer.x - testX, this.hammer.y - testY);
      
      if (dist <= this.hammer.radius) {
        if (this.hammer.state === 'THROWN') {
          // Smash obstacle
          obs.hp--;
          this.shake(8, 0.2);
          this.playSound('thunder');
          
          // Rubble debris
          for (let i = 0; i < 14; i++) {
            this.spawnParticle(
              testX, testY, 
              (Math.random() - 0.5) * 240, (Math.random() - 0.5) * 240, 
              '#556677', Math.random() * 5 + 3, 0.4
            );
          }
          
          if (obs.hp <= 0) {
            obs.active = false;
            this.score += 200;
            this.spawnScorePopup("+200 WALL SMASH", testX, testY - 20, '#00f0ff');
            this.spawnComicText("CRUSH!", testX, testY - 40);
          }
        } else if (this.hammer.state === 'RETURNING') {
          if (Math.random() > 0.5) {
            this.spawnParticle(this.hammer.x, this.hammer.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, '#ffd200', 3, 0.2);
          }
        }
      }
    }

    // 2. BONUS LIGHTNING RUNES
    for (const rune of this.runes) {
      if (rune.collected) continue;
      const dist = this.distToSegment(rune.x, rune.y, x1, y1, x2, y2);
      
      if (dist < this.hammer.radius + rune.r) {
        rune.collected = true;
        this.score += 300;
        this.spawnScorePopup("+300 THUNDER RUNE", rune.x, rune.y - 20, '#ffd200');
        this.playSound('collect');
        
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          this.spawnParticle(
            rune.x, rune.y, 
            Math.cos(ang) * 140, Math.sin(ang) * 140, 
            '#ffd200', Math.random() * 4 + 2, 0.35
          );
        }
      }
    }

    // 3. STATIC TARGETS (Minions & Boss) — Smashed on both throw and return!
    for (const t of this.targets) {
      if (!t.active) continue;
      if (t.hitTimer > 0) continue; // 250ms cooldown prevents multi-hits on adjacent frames
      
      const dist = this.distToSegment(t.x, t.y, x1, y1, x2, y2);
      
      if (dist < this.hammer.radius + t.r) {
        // Strike target!
        t.hp--;
        t.hitTimer = 0.25;
        
        this.playSound('hit');
        this.shake(7, 0.18);
        
        const impactColor = t.type === 'boss' ? '#8800ff' : '#00f0ff';
        for (let i = 0; i < 24; i++) {
          this.spawnParticle(
            t.x, t.y, 
            (Math.random() - 0.5) * 320, (Math.random() - 0.5) * 320, 
            impactColor, Math.random() * 5 + 2, 0.45
          );
        }
        
        if (t.hp <= 0) {
          t.active = false;
          const pts = t.type === 'boss' ? 1200 : 150;
          this.score += pts;
          this.spawnScorePopup(`+${pts}`, t.x, t.y - 30, '#00f0ff');
          this.spawnComicText(t.type === 'boss' ? "KRAKKOOM!" : "SMASH!", t.x, t.y - 50);
          this.playSound('thunder');
        } else {
          // Boss damaged
          this.score += 75;
          this.spawnScorePopup("+75 HIT!", t.x, t.y - 30, '#ffd200');
          this.spawnComicText("THWACK!", t.x, t.y - 45);
        }
      }
    }

    // 4. INNOCENT CIVILIANS (Avoid hitting with Mjolnir!)
    for (const civ of this.civilians) {
      if (!civ.active) continue;
      const dist = this.distToSegment(civ.x, civ.y, x1, y1, x2, y2);

      if (dist < this.hammer.radius + civ.r) {
        civ.active = false;
        this.civilianCasualties++;
        this.score = Math.max(0, this.score - 500);
        this.shake(14, 0.4);
        this.playSound('defeat');
        this.spawnScorePopup("-500 CASUALTY", civ.x, civ.y - 30, '#ff1744');
        this.spawnComicText("CASUALTY!", civ.x, civ.y - 50, '#ff1744');

        // Distress particles
        for (let i = 0; i < 24; i++) {
          this.spawnParticle(
            civ.x, civ.y,
            (Math.random() - 0.5) * 260,
            (Math.random() - 0.5) * 260,
            '#ff1744', Math.random() * 4 + 2, 0.4
          );
        }

        if (this.civilianCasualties >= this.maxCasualties) {
          this.triggerGameOver("An innocent civilian was struck by Mjolnir!");
          return;
        }
      }
    }
  }

  updateHUD() {
    const scoreEl = document.getElementById('hudScore');
    const phaseEl = document.getElementById('hudPhase');
    const casualtiesEl = document.getElementById('hudCasualties');
    const civHealthFill = document.getElementById('civHealthFill');
    const thunderBtn = document.getElementById('thunderBtn');
    const thunderOverlay = document.getElementById('thunderCooldownOverlay');
    
    if (scoreEl) scoreEl.textContent = `${this.score} PTS`;
    if (phaseEl) phaseEl.textContent = `LEVEL ${this.stage}`;

    if (casualtiesEl) {
      if (this.civilianCasualties >= this.maxCasualties) {
        casualtiesEl.textContent = `CASUALTY (${this.civilianCasualties}/${this.maxCasualties})`;
        casualtiesEl.style.color = '#ff1744';
      } else {
        casualtiesEl.textContent = `SAFE (${this.civilianCasualties}/${this.maxCasualties})`;
        casualtiesEl.style.color = '#00ff88';
      }
    }

    if (civHealthFill) {
      const remaining = Math.max(0, this.maxCasualties - this.civilianCasualties);
      const pct = (remaining / this.maxCasualties) * 100;
      civHealthFill.style.width = `${pct}%`;
      if (pct <= 0) {
        civHealthFill.classList.add('danger');
      } else {
        civHealthFill.classList.remove('danger');
      }
    }

    if (thunderBtn && thunderOverlay) {
      if (this.thunderCooldown > 0) {
        thunderBtn.disabled = true;
        const pct = (this.thunderCooldown / this.thunderMaxCooldown) * 100;
        thunderOverlay.style.height = `${pct}%`;
      } else {
        thunderBtn.disabled = false;
        thunderOverlay.style.height = '0%';
      }
    }
  }

  render(ctx) {
    // ==========================================
    // 1. DRAW BASE AMBIENT SCENE (Atmospheric Dark Realm)
    // ==========================================
    
    // Distant cosmic Asgardian sky with misty nebulas
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 460);
    skyGrad.addColorStop(0, '#060914');
    skyGrad.addColorStop(0.5, '#0c1224');
    skyGrad.addColorStop(1, '#070a14');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 540);

    // Distant mountain & Jotunheim monolith silhouettes
    ctx.fillStyle = 'rgba(16, 24, 42, 0.65)';
    ctx.beginPath();
    ctx.moveTo(0, 460);
    ctx.lineTo(70, 370);
    ctx.lineTo(150, 410);
    ctx.lineTo(260, 330);
    ctx.lineTo(380, 420);
    ctx.lineTo(510, 340);
    ctx.lineTo(650, 410);
    ctx.lineTo(780, 320);
    ctx.lineTo(960, 380);
    ctx.lineTo(960, 460);
    ctx.closePath();
    ctx.fill();

    // Ancient Norse stone pillars in background
    ctx.fillStyle = 'rgba(22, 32, 54, 0.55)';
    ctx.fillRect(220, 300, 22, 160);
    ctx.fillRect(560, 320, 26, 140);
    ctx.fillRect(860, 290, 30, 170);

    // Draw Rocky Arena Ground with Inscribed Runes
    ctx.fillStyle = '#0a0f1c';
    ctx.fillRect(0, this.groundY, 960, 540 - this.groundY);
    ctx.strokeStyle = '#00a6ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(960, this.groundY);
    ctx.stroke();

    // Subtle Bifrost energy lines running along the stone ground
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let gx = 40; gx < 940; gx += 90) {
      ctx.strokeRect(gx, this.groundY + 12, 18, 8);
    }

    // Draw Breakable Obstacles
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      ctx.save();
      ctx.fillStyle = obs.hp === 1 ? '#2c3648' : '#1b2230';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      
      if (obs.hp === 1) {
        ctx.strokeStyle = '#ffd200';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obs.x + 5, obs.y + 20);
        ctx.lineTo(obs.x + obs.w - 8, obs.y + obs.h / 2);
        ctx.lineTo(obs.x + 10, obs.y + obs.h - 30);
        ctx.stroke();
      }
      
      ctx.strokeStyle = '#3e4d66';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      ctx.restore();
    }

    // Draw Lightning Runes (Bonus Collectibles)
    for (const rune of this.runes) {
      if (rune.collected) continue;
      ctx.save();
      ctx.translate(rune.x, rune.y);
      
      const pulse = Math.sin(this.lightningTimer * 5) * 4;
      ctx.fillStyle = 'rgba(255, 210, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, rune.r + pulse + 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffd200';
      ctx.beginPath();
      ctx.arc(0, 0, rune.r, 0, Math.PI * 2);
      ctx.fill();
      
      // Lightning bolt icon
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(-3, -10);
      ctx.lineTo(6, -2);
      ctx.lineTo(0, 0);
      ctx.lineTo(4, 10);
      ctx.lineTo(-5, 1);
      ctx.lineTo(-1, -1);
      ctx.fill();
      
      ctx.restore();
    }

    // Draw Static Targets (Frost Giants & Boss)
    for (const t of this.targets) {
      if (!t.active) continue;
      
      ctx.save();
      ctx.translate(t.x, t.y);
      
      if (t.type === 'minion') {
        // Frost Giant Minion Body
        ctx.fillStyle = '#0a3d62';
        ctx.beginPath();
        ctx.arc(0, 0, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#00a6ff';
        ctx.stroke();
        
        // Ice Spikes / Horns
        ctx.fillStyle = '#3c6382';
        ctx.beginPath();
        ctx.moveTo(-t.r + 5, -5);
        ctx.lineTo(-t.r - 8, -12);
        ctx.lineTo(-t.r + 8, -15);
        ctx.moveTo(t.r - 5, -5);
        ctx.lineTo(t.r + 8, -12);
        ctx.lineTo(t.r - 8, -15);
        ctx.fill();
        
      } else if (t.type === 'boss') {
        // Frost Giant Overlord Boss
        ctx.fillStyle = '#2c0b4d';
        ctx.beginPath();
        ctx.arc(0, 0, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#6a0dad';
        ctx.stroke();
        
        // Boss Crown
        ctx.fillStyle = '#ffd200';
        ctx.beginPath();
        ctx.moveTo(-24, -t.r + 5);
        ctx.lineTo(-36, -t.r - 22);
        ctx.lineTo(0, -t.r - 6);
        ctx.lineTo(36, -t.r - 22);
        ctx.lineTo(24, -t.r + 5);
        ctx.fill();
        
        // Boss HP Bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-t.r, -t.r - 32, t.r * 2, 8);
        ctx.fillStyle = '#ff2244';
        ctx.fillRect(-t.r, -t.r - 32, t.r * 2, 8);
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(-t.r, -t.r - 32, (t.r * 2) * (t.hp / t.maxHp), 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-t.r, -t.r - 32, t.r * 2, 8);
      }
      
      ctx.restore();
    }

    // Draw Innocent Civilians (ONLY VISIBLE DURING THUNDER EFFECT — INVISIBLE BEFORE & AFTER!)
    if (this.thunderActiveTimer > 0) {
      const civAlpha = Math.min(1.0, this.thunderActiveTimer / 0.4);
      for (const civ of this.civilians) {
        if (!civ.active) continue;

        ctx.save();
        ctx.globalAlpha = civAlpha;
        ctx.translate(civ.x, civ.y);

        // Villager body / robe
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(0, 4, civ.r - 4, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(0, -12, 9, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(0, -15, 9, Math.PI, Math.PI * 2);
        ctx.fill();

        // Glowing Golden Lantern held in hand
        const breath = Math.sin(this.lightningTimer * 6) * 2;
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(14, 2 + breath, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff8f00';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }
    }

    // Draw Thor
    ctx.save();
    ctx.translate(this.thor.x, this.thor.y);
    
    // Flowing Cape
    ctx.fillStyle = '#990000';
    ctx.beginPath();
    ctx.moveTo(-16, -72);
    ctx.lineTo(-40, -10 + Math.sin(this.lightningTimer * 6) * 5);
    ctx.lineTo(-14, 0);
    ctx.fill();
    
    // Armor
    ctx.fillStyle = '#1c212c';
    ctx.fillRect(-18, -72, 36, 72);
    // Silver Plates
    ctx.fillStyle = '#636e72';
    ctx.beginPath();
    ctx.arc(-7, -54, 6, 0, Math.PI * 2);
    ctx.arc(7, -54, 6, 0, Math.PI * 2);
    ctx.arc(-7, -34, 6, 0, Math.PI * 2);
    ctx.arc(7, -34, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Thor Head & Beard
    ctx.fillStyle = '#f5c6a5';
    ctx.beginPath();
    ctx.arc(0, -88, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d49b10';
    ctx.fillRect(-12, -88, 5, 20);
    ctx.fillRect(7, -88, 5, 20);
    ctx.fillRect(-8, -77, 16, 10);
    
    // Helmet
    ctx.fillStyle = '#b2bec3';
    ctx.beginPath();
    ctx.arc(0, -88, 16, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-14, -92); ctx.lineTo(-24, -108); ctx.lineTo(-10, -96);
    ctx.moveTo(14, -92); ctx.lineTo(24, -108); ctx.lineTo(10, -96);
    ctx.fill();
    
    // Outstretched arm if returning
    if (this.hammer.state === 'RETURNING') {
      ctx.strokeStyle = '#1c212c';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(10, -60);
      ctx.lineTo(26, -68);
      ctx.stroke();
    }
    ctx.restore();

    // =========================================================================
    // 2. DYNAMIC 2D LIGHTING & ILLUMINATION (DARK ENVIRONMENT + RADIANT GLOW)
    // =========================================================================
    if (this.lightCtx) {
      // Clear offscreen light mask
      this.lightCtx.globalCompositeOperation = 'source-over';
      // Dense mysterious darkness covering the realm (atmospherically deep)
      this.lightCtx.fillStyle = 'rgba(4, 7, 16, 0.84)';
      this.lightCtx.fillRect(0, 0, 960, 540);

      // Switch to cut-out mode (creates transparent glowing holes where light shines)
      this.lightCtx.globalCompositeOperation = 'destination-out';

      // (0) THUNDER FLASH ILLUMINATION (FLOODS THE ENTIRE REALM WITH RADIANT LIGHT)
      if (this.thunderActiveTimer > 0) {
        const flashAlpha = Math.min(1.0, this.thunderActiveTimer / 0.5);
        this.lightCtx.fillStyle = `rgba(0, 0, 0, ${flashAlpha})`;
        this.lightCtx.fillRect(0, 0, 960, 540);
      }

      // (A) Thor's personal aura (subtle divine glow around Thor)
      const thorGlow = this.lightCtx.createRadialGradient(
        this.thor.x, this.thor.y - 45, 10,
        this.thor.x, this.thor.y - 45, 95
      );
      thorGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
      thorGlow.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
      thorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.lightCtx.fillStyle = thorGlow;
      this.lightCtx.beginPath();
      this.lightCtx.arc(this.thor.x, this.thor.y - 45, 95, 0, Math.PI * 2);
      this.lightCtx.fill();

      // (B) Civilians' warm lantern glow (revealed ONLY during thunder effect)
      if (this.thunderActiveTimer > 0) {
        const glowAlpha = Math.min(1.0, this.thunderActiveTimer / 0.4);
        for (const civ of this.civilians) {
          if (!civ.active) continue;

          const civGlow = this.lightCtx.createRadialGradient(civ.x, civ.y, 5, civ.x, civ.y, 85);
          civGlow.addColorStop(0, `rgba(0, 0, 0, ${0.85 * glowAlpha})`);
          civGlow.addColorStop(0.6, `rgba(0, 0, 0, ${0.45 * glowAlpha})`);
          civGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.lightCtx.fillStyle = civGlow;
          this.lightCtx.beginPath();
          this.lightCtx.arc(civ.x, civ.y, 85, 0, Math.PI * 2);
          this.lightCtx.fill();
        }
      }

      // (C) Aiming Laser Beam of Light (piercing light line when ready to throw)
      if (this.hammer.state === 'IDLE') {
        const beamLen = 920;
        const endX = this.hammer.x + Math.cos(this.aimAngle) * beamLen;
        const endY = this.hammer.y + Math.sin(this.aimAngle) * beamLen;
        
        const beamThickness = this.isCharging ? (24 + this.power * 24) : 14;
        this.lightCtx.lineWidth = beamThickness;
        this.lightCtx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        this.lightCtx.beginPath();
        this.lightCtx.moveTo(this.hammer.x, this.hammer.y);
        this.lightCtx.lineTo(endX, endY);
        this.lightCtx.stroke();
        
        // Spotlight circle at the crosshair destination
        const spotGlow = this.lightCtx.createRadialGradient(endX, endY, 5, endX, endY, 60);
        spotGlow.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        spotGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.lightCtx.fillStyle = spotGlow;
        this.lightCtx.beginPath();
        this.lightCtx.arc(endX, endY, 60, 0, Math.PI * 2);
        this.lightCtx.fill();
      }

      // (D) ON THROW OF HAMMER: THE AREA GLOWS WITH COLOSSAL DIVINE LIGHT!
      if (this.hammer.state === 'THROWN' || this.hammer.state === 'RETURNING') {
        // Massive radial illumination sphere around Mjolnir (reveals targets & environment)
        const lightRadius = 310;
        const hammerGlow = this.lightCtx.createRadialGradient(
          this.hammer.x, this.hammer.y, 20,
          this.hammer.x, this.hammer.y, lightRadius
        );
        hammerGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
        hammerGlow.addColorStop(0.4, 'rgba(0, 0, 0, 0.9)');
        hammerGlow.addColorStop(0.75, 'rgba(0, 0, 0, 0.5)');
        hammerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.lightCtx.fillStyle = hammerGlow;
        this.lightCtx.beginPath();
        this.lightCtx.arc(this.hammer.x, this.hammer.y, lightRadius, 0, Math.PI * 2);
        this.lightCtx.fill();

        // Secondary forward illumination cone
        if (this.hammer.state === 'THROWN') {
          const forwardDist = 120;
          const fx = this.hammer.x + (this.hammer.vx / 1100) * forwardDist;
          const fy = this.hammer.y + (this.hammer.vy / 1100) * forwardDist;
          const fGlow = this.lightCtx.createRadialGradient(fx, fy, 10, fx, fy, 180);
          fGlow.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
          fGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          this.lightCtx.fillStyle = fGlow;
          this.lightCtx.beginPath();
          this.lightCtx.arc(fx, fy, 180, 0, Math.PI * 2);
          this.lightCtx.fill();
        }
      }

      // Blend the darkness layer over the world
      ctx.drawImage(this.lightCanvas, 0, 0);
    }

    // Sky Thunder Lightning Arc during Thunder Flash
    if (this.thunderActiveTimer > 1.8) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(350, 0);
      ctx.lineTo(390, 80);
      ctx.lineTo(360, 130);
      ctx.lineTo(430, 240);
      ctx.lineTo(400, 310);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(680, 0);
      ctx.lineTo(650, 90);
      ctx.lineTo(690, 150);
      ctx.lineTo(640, 260);
      ctx.stroke();
      ctx.restore();
    }

    // =========================================================================
    // 3. DRAW GLOWING ELEMENTS ON TOP (Pierces through the dark)
    // =========================================================================

    // (A) Distinct Protective Green Shield / Marker above Innocent Civilians (ONLY during thunder effect)
    if (this.thunderActiveTimer > 0) {
      const tagAlpha = Math.min(1.0, this.thunderActiveTimer / 0.4);
      for (const civ of this.civilians) {
        if (!civ.active) continue;

        ctx.save();
        ctx.globalAlpha = tagAlpha;
        ctx.translate(civ.x, civ.y);

        // Floating Shield Marker
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.fillText('🛡️ INNOCENT', 0, -civ.r - 10);

        // Lantern glow dot
        ctx.fillStyle = '#ffd54f';
        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(14, 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // (B) Sinister Glowing Eyes & Frost Silhouette of Frost Giants
    for (const t of this.targets) {
      if (!t.active) continue;
      ctx.save();
      ctx.translate(t.x, t.y);
      
      if (t.type === 'minion') {
        // Glowing Frost Silhouette Ring in the darkness
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, t.r, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing Crimson Eyes
        ctx.fillStyle = '#ff1133';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 10;
        ctx.fillRect(-10, -8, 7, 7);
        ctx.fillRect(4, -8, 7, 7);
      } else if (t.type === 'boss') {
        // Overlord Boss Astral Aura
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, t.r, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing Boss Eyes
        ctx.fillStyle = '#ff0077';
        ctx.shadowColor = '#ff0077';
        ctx.shadowBlur = 14;
        ctx.fillRect(-16, -14, 11, 11);
        ctx.fillRect(6, -14, 11, 11);
      }
      ctx.restore();
    }

    // (C) Glowing Nordic Runes in the dark (Bonus collectibles)
    for (const rune of this.runes) {
      if (rune.collected) continue;
      ctx.save();
      ctx.translate(rune.x, rune.y);
      ctx.strokeStyle = 'rgba(255, 210, 0, 0.7)';
      ctx.shadowColor = '#ffd200';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, rune.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // (B) Continuous Laser Trajectory Guide & Aiming Reticle
    if (this.hammer.state === 'IDLE') {
      ctx.save();
      const displayRange = 920;
      const endX = this.hammer.x + Math.cos(this.aimAngle) * displayRange;
      const endY = this.hammer.y + Math.sin(this.aimAngle) * displayRange;
      
      const alpha = this.isCharging ? (0.6 + this.power * 0.4) : 0.4;
      const lineWidth = this.isCharging ? (3 + this.power * 4) : 2;
      
      // Cyan Laser Guide Line
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = this.isCharging ? 12 : 6;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(this.hammer.x, this.hammer.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Impact Target Reticle
      const reticleRadius = this.isCharging ? (18 + this.power * 8) : 16;
      ctx.setLineDash([]);
      ctx.strokeStyle = this.isCharging ? '#ffd200' : '#00f0ff';
      ctx.shadowColor = this.isCharging ? '#ffd200' : '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(endX, endY, reticleRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(endX - 12, endY); ctx.lineTo(endX + 12, endY);
      ctx.moveTo(endX, endY - 12); ctx.lineTo(endX, endY + 12);
      ctx.stroke();
      ctx.restore();
    }

    // (C) Draw Radiant Mjolnir with Thunder Aura
    ctx.save();
    ctx.translate(this.hammer.x, this.hammer.y);
    ctx.rotate(this.hammer.rotation);
    
    // Radiant Lightning Halo
    if (this.hammer.state === 'THROWN' || this.hammer.state === 'RETURNING') {
      const haloColor = this.hammer.state === 'RETURNING' ? '#ffd200' : '#00f0ff';
      ctx.fillStyle = haloColor;
      ctx.shadowColor = haloColor;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(0, 0, this.hammer.radius + 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Idle hand lightning spark
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
    
    // Central Norse Rune (Glows bright cyan)
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(-4, -8, 8, 8);
    
    ctx.restore();
  }
}

window.ThorHammerGame = ThorHammerGame;
