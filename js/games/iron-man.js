/**
 * iron-man.js
 * IRON MAN VS THANOS — 2D ARCADE FIGHTING GAME
 * 
 * Inspired by classic 2D fighting games (Mortal Kombat arcade feel, simple mechanics).
 * Gameplay loop: Attack → Defend/React → Attack → Defeat.
 * 
 * Controls:
 *   [A] Repulsor Blast (Fast Ranged Attack)
 *   [S] Power Punch (Close-Range Heavy Dash Attack)
 *   [D] Unibeam (Ultimate Chest Beam - Requires Full Meter)
 *   [SPACE] Block (Reduces incoming damage by 80% & charges Ultimate)
 */

class IronManGame extends GameEngine {
  constructor() {
    super('gameCanvas');
    this.gameId = 'ironman';
    this.setupBattlefield();
    this.reset();
    this.bindControls();
  }

  setupBattlefield() {
    // Ambient battlefield debris & ruined futuristic city background elements
    this.bgDebris = [];
    for (let i = 0; i < 28; i++) {
      this.bgDebris.push({
        x: Math.random() * 960,
        y: Math.random() * 450,
        size: Math.random() * 3 + 1,
        speedY: -(Math.random() * 0.4 + 0.1),
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.4 ? '#ff5500' : (Math.random() > 0.5 ? '#ffd200' : '#888899')
      });
    }

    this.neonFlickers = [
      { x: 120, y: 180, w: 90, h: 22, text: 'STARK', color: '#00f0ff', phase: 0 },
      { x: 380, y: 140, w: 140, h: 28, text: 'AVENGERS', color: '#ff2244', phase: 1.5 },
      { x: 780, y: 200, w: 100, h: 20, text: 'CITADEL', color: '#ffd200', phase: 3.2 }
    ];

    this.lightningTimer = 0;
    this.lightningFlash = 0;
  }

  reset() {
    this.stage = 1; // Used for GameEngine compatibility
    this.score = 0;
    this.phase = 1; // 1: First Contact, 2: Rage Mode, 3: Final Phase

    this.groundY = 430;

    // Player (Iron Man)
    this.ironMan = {
      x: 180,
      baseX: 180,
      y: this.groundY,
      hp: 100,
      maxHp: 100,
      ultimate: 0,
      maxUltimate: 100,
      isBlocking: false,
      currentAction: null, // 'repulsor', 'punch', 'unibeam'
      actionTimer: 0,
      dashProgress: 0,
      hurtTimer: 0,
      hoverTime: 0,
      cooldowns: {
        repulsor: 0,
        punch: 0,
        unibeam: 0
      }
    };

    // Opponent (Thanos)
    this.thanos = {
      x: 780,
      baseX: 780,
      y: this.groundY,
      hp: 100,
      maxHp: 100,
      state: 'IDLE', // 'IDLE', 'TELEGRAPH', 'ATTACKING', 'RECOVERY', 'HURT', 'DEFEATED'
      stateTimer: 1.8, // Initial breather
      nextAttack: 'ENERGY_BLAST', // 'ENERGY_BLAST', 'TITAN_PUNCH', 'INFINITY_WAVE'
      telegraphDuration: 1.0,
      attackCooldown: 2.2,
      dashProgress: 0,
      hurtTimer: 0,
      auraPulse: 0
    };

    this.projectiles = [];
    this.shockwaves = [];
    this.particles = [];
    this.damageNumbers = [];
    this.screenShake = 0;
    this.screenFlash = 0;
    this.flashColor = '#ffffff';

    this.announcement = {
      text: 'ROUND 1: FIRST CONTACT',
      subtext: 'Attack • React • Defend',
      timer: 3.0,
      color: '#ffd200'
    };

    this.updateHUD();
  }

  bindControls() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'PLAYING') return;

      const key = e.key.toLowerCase();
      if (key === 'a' || key === '1') {
        this.triggerRepulsor();
      } else if (key === 's' || key === '2') {
        this.triggerPowerPunch();
      } else if (key === 'd' || key === '3') {
        this.triggerUnibeam();
      } else if (key === ' ' || key === 'spacebar') {
        e.preventDefault();
        this.setBlock(true);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.state !== 'PLAYING') return;
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'spacebar') {
        this.setBlock(false);
      }
    });

    // Hook up external UI buttons if present
    this.setupHTMLControls();
  }

  setupHTMLControls() {
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('mousedown', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); }, { passive: false });
      if (onUp) {
        el.addEventListener('mouseup', (e) => { e.preventDefault(); onUp(); });
        el.addEventListener('mouseleave', (e) => { e.preventDefault(); onUp(); });
        el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
      }
    };

    bindBtn('btnActionRepulsor', () => this.triggerRepulsor());
    bindBtn('btnActionPunch', () => this.triggerPowerPunch());
    bindBtn('btnActionUnibeam', () => this.triggerUnibeam());
    bindBtn('btnActionBlock', () => this.setBlock(true), () => this.setBlock(false));
  }

  setBlock(isBlocking) {
    if (this.ironMan.currentAction === 'punch' || this.ironMan.currentAction === 'unibeam') {
      return; // Cannot block during heavy offensive commit
    }
    this.ironMan.isBlocking = isBlocking;
    const btn = document.getElementById('btnActionBlock');
    if (btn) {
      if (isBlocking) btn.classList.add('active-block');
      else btn.classList.remove('active-block');
    }
  }

  triggerRepulsor() {
    if (this.ironMan.cooldowns.repulsor > 0 || this.ironMan.currentAction !== null) return;
    if (window.soundFX) window.soundFX.repulsor();

    this.ironMan.currentAction = 'repulsor';
    this.ironMan.actionTimer = 0.25;
    this.ironMan.cooldowns.repulsor = 0.5; // Fast cooldown

    // Spawn Repulsor projectile
    this.projectiles.push({
      type: 'REPULSOR',
      owner: 'IRON_MAN',
      x: this.ironMan.x + 55,
      y: this.ironMan.y - 48,
      vx: 920,
      radius: 12,
      damage: 14,
      color: '#00f0ff'
    });

    // Muzzle flash particles
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.ironMan.x + 55,
        y: this.ironMan.y - 48,
        vx: Math.random() * 200 + 100,
        vy: (Math.random() - 0.5) * 150,
        size: Math.random() * 4 + 2,
        life: 0.2,
        maxLife: 0.2,
        color: '#00f0ff'
      });
    }

    this.updateActionButtons();
  }

  triggerPowerPunch() {
    if (this.ironMan.cooldowns.punch > 0 || this.ironMan.currentAction !== null) return;
    if (window.soundFX) window.soundFX.thwip();

    this.ironMan.currentAction = 'punch';
    this.ironMan.actionTimer = 0.65;
    this.ironMan.dashProgress = 0;
    this.ironMan.cooldowns.punch = 1.4; // Longer cooldown

    this.updateActionButtons();
  }

  triggerUnibeam() {
    if (this.ironMan.ultimate < this.ironMan.maxUltimate || this.ironMan.currentAction !== null) return;
    if (window.soundFX) window.soundFX.unibeam();

    this.ironMan.currentAction = 'unibeam';
    this.ironMan.actionTimer = 1.6;
    this.ironMan.ultimate = 0; // Consume full meter
    this.ironMan.cooldowns.unibeam = 3.0;

    this.screenShake = 16;
    this.screenFlash = 0.6;
    this.flashColor = '#00f0ff';

    this.announcement = {
      text: 'UNIBEAM MAXIMUM!',
      subtext: 'Arc Reactor Overcharge Discharged',
      timer: 1.5,
      color: '#00f0ff'
    };

    // Immediate massive beam damage check against Thanos
    this.applyDamageToThanos(55, true, 'UNIBEAM!');

    this.updateActionButtons();
    this.updateHUD();
  }

  applyDamageToThanos(amount, isCrit = false, label = '') {
    this.thanos.hp = Math.max(0, this.thanos.hp - amount);
    this.thanos.hurtTimer = 0.35;
    this.score += amount * 10;

    // Screen feedback
    this.screenShake = Math.max(this.screenShake, isCrit ? 18 : 8);
    this.screenFlash = isCrit ? 0.4 : 0.2;
    this.flashColor = isCrit ? '#ffd200' : '#ff3366';

    if (window.soundFX) {
      if (isCrit) window.soundFX.heavyPunch();
      else window.soundFX.hit();
    }

    // Damage Number
    this.damageNumbers.push({
      x: this.thanos.x + (Math.random() - 0.5) * 40,
      y: this.thanos.y - 70 - Math.random() * 20,
      text: label ? `${label} -${amount}` : `-${amount}`,
      color: isCrit ? '#ffd200' : '#ffffff',
      size: isCrit ? 32 : 22,
      life: 0.85,
      maxLife: 0.85,
      vy: -110
    });

    // Hit impact sparks
    for (let i = 0; i < (isCrit ? 22 : 12); i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 260 + 80;
      this.particles.push({
        x: this.thanos.x,
        y: this.thanos.y - 50,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: Math.random() * 5 + 2,
        life: 0.4,
        maxLife: 0.4,
        color: Math.random() > 0.5 ? '#ffd200' : '#ff0055'
      });
    }

    // Check Phase Transitions
    this.checkPhases();

    // Check Victory
    if (this.thanos.hp <= 0) {
      this.triggerVictory();
    }

    this.updateHUD();
  }

  applyDamageToIronMan(amount, attackName = '') {
    let finalAmount = amount;
    let wasBlocked = false;

    if (this.ironMan.isBlocking) {
      // 80% Damage reduction on block!
      finalAmount = Math.max(2, Math.round(amount * 0.2));
      wasBlocked = true;
      // Building Ultimate upon successful block
      this.ironMan.ultimate = Math.min(this.ironMan.maxUltimate, this.ironMan.ultimate + 20);
      if (window.soundFX) window.soundFX.blockDeflect();
    } else {
      if (window.soundFX) window.soundFX.hit();
      this.ironMan.hurtTimer = 0.3;
    }

    this.ironMan.hp = Math.max(0, this.ironMan.hp - finalAmount);
    this.screenShake = wasBlocked ? 5 : 14;

    // Damage number
    this.damageNumbers.push({
      x: this.ironMan.x + (Math.random() - 0.5) * 30,
      y: this.ironMan.y - 60,
      text: wasBlocked ? `BLOCKED! -${finalAmount}` : `-${finalAmount}`,
      color: wasBlocked ? '#00f0ff' : '#ff3344',
      size: wasBlocked ? 20 : 26,
      life: 0.8,
      maxLife: 0.8,
      vy: -90
    });

    // Sparks
    for (let i = 0; i < (wasBlocked ? 16 : 10); i++) {
      this.particles.push({
        x: this.ironMan.x + 20,
        y: this.ironMan.y - 45,
        vx: (Math.random() - 0.8) * 220,
        vy: (Math.random() - 0.5) * 180,
        size: Math.random() * 4 + 2,
        life: 0.3,
        maxLife: 0.3,
        color: wasBlocked ? '#00f0ff' : '#ffaa00'
      });
    }

    if (this.ironMan.hp <= 0) {
      this.triggerDefeat();
    }

    this.updateHUD();
  }

  checkPhases() {
    const hpPct = (this.thanos.hp / this.thanos.maxHp) * 100;

    if (this.phase === 1 && hpPct <= 60 && hpPct > 0) {
      this.phase = 2;
      this.thanos.telegraphDuration = 0.7;
      this.thanos.attackCooldown = 1.4;
      this.announcement = {
        text: 'THANOS — RAGE MODE',
        subtext: 'Attack Speed & Power Increased!',
        timer: 2.2,
        color: '#ff2255'
      };
      this.screenShake = 15;
      this.screenFlash = 0.5;
      this.flashColor = '#9900ff';
      if (window.soundFX) window.soundFX.titanBlast();
    } else if (this.phase === 2 && hpPct <= 25 && hpPct > 0) {
      this.phase = 3;
      this.thanos.telegraphDuration = 0.5;
      this.thanos.attackCooldown = 0.9;
      this.announcement = {
        text: 'FINAL PHASE: INFINITY SURGE',
        subtext: 'All Infinity Stones Unleashed!',
        timer: 2.4,
        color: '#ff00aa'
      };
      this.screenShake = 22;
      this.screenFlash = 0.7;
      this.flashColor = '#ffcc00';
      if (window.soundFX) window.soundFX.cosmicWave();
    }
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Background animations & atmosphere
    this.updateBattlefield(dt);

    // Update Iron Man
    this.updateIronMan(dt);

    // Update Thanos AI
    this.updateThanos(dt);

    // Update Combat Projectiles & Shockwaves
    this.updateProjectiles(dt);

    // Update Particles
    this.updateParticles(dt);

    // Update Damage Numbers
    this.updateDamageNumbers(dt);

    // Cooldown timers & Announcement timer
    if (this.announcement.timer > 0) {
      this.announcement.timer -= dt;
    }
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }
    if (this.screenFlash > 0) {
      this.screenFlash = Math.max(0, this.screenFlash - dt * 2.5);
    }

    this.updateActionButtons();
  }

  updateBattlefield(dt) {
    // Drifting smoke & burning embers
    this.bgDebris.forEach(p => {
      p.y += p.speedY * 60 * dt;
      p.x += p.speedX * 60 * dt;
      if (p.y < 50) {
        p.y = 450;
        p.x = Math.random() * 960;
      }
    });

    // Phase 3 Lightning flashes
    if (this.phase === 3) {
      this.lightningTimer += dt;
      if (this.lightningTimer > 3.0) {
        this.lightningTimer = 0;
        this.lightningFlash = 0.8;
      }
      if (this.lightningFlash > 0) {
        this.lightningFlash -= dt * 3.5;
      }
    }
  }

  updateIronMan(dt) {
    this.ironMan.hoverTime += dt * 3.5;

    // Reduce cooldowns
    for (const key in this.ironMan.cooldowns) {
      if (this.ironMan.cooldowns[key] > 0) {
        this.ironMan.cooldowns[key] = Math.max(0, this.ironMan.cooldowns[key] - dt);
      }
    }

    if (this.ironMan.hurtTimer > 0) {
      this.ironMan.hurtTimer -= dt;
    }

    // Action handling
    if (this.ironMan.currentAction === 'repulsor') {
      this.ironMan.actionTimer -= dt;
      if (this.ironMan.actionTimer <= 0) {
        this.ironMan.currentAction = null;
      }
    } else if (this.ironMan.currentAction === 'punch') {
      this.ironMan.actionTimer -= dt;
      const totalTime = 0.65;
      const progress = 1 - (this.ironMan.actionTimer / totalTime);

      // Dash towards Thanos, punch impact at midpoint, dash back
      if (progress < 0.45) {
        // Rocket dash forward
        const t = progress / 0.45;
        this.ironMan.x = this.ironMan.baseX + (this.thanos.x - this.ironMan.baseX - 85) * Math.sin(t * Math.PI / 2);
      } else if (progress < 0.55) {
        // Strike impact frame!
        if (!this.ironMan.punchLanded) {
          this.ironMan.punchLanded = true;
          this.applyDamageToThanos(26, true, 'CRITICAL PUNCH!');
          this.ironMan.ultimate = Math.min(this.ironMan.maxUltimate, this.ironMan.ultimate + 25);
        }
      } else {
        // Return to base position
        const t = (progress - 0.55) / 0.45;
        this.ironMan.x = (this.thanos.x - 85) + (this.ironMan.baseX - (this.thanos.x - 85)) * (1 - Math.cos(t * Math.PI / 2));
      }

      if (this.ironMan.actionTimer <= 0) {
        this.ironMan.currentAction = null;
        this.ironMan.punchLanded = false;
        this.ironMan.x = this.ironMan.baseX;
      }
    } else if (this.ironMan.currentAction === 'unibeam') {
      this.ironMan.actionTimer -= dt;
      this.screenShake = 10;
      // Laser particles pouring across
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.ironMan.x + 30 + Math.random() * (this.thanos.x - this.ironMan.x),
          y: this.ironMan.y - 48 + (Math.random() - 0.5) * 35,
          vx: Math.random() * 300 + 400,
          vy: (Math.random() - 0.5) * 120,
          size: Math.random() * 6 + 3,
          life: 0.25,
          maxLife: 0.25,
          color: Math.random() > 0.3 ? '#00f0ff' : '#ffffff'
        });
      }

      if (this.ironMan.actionTimer <= 0) {
        this.ironMan.currentAction = null;
      }
    }
  }

  updateThanos(dt) {
    if (this.thanos.hp <= 0) return;

    this.thanos.auraPulse += dt * 4;
    if (this.thanos.hurtTimer > 0) {
      this.thanos.hurtTimer -= dt;
    }

    if (this.thanos.state === 'IDLE') {
      this.thanos.stateTimer -= dt;
      if (this.thanos.stateTimer <= 0) {
        // Choose next attack randomly
        const attacks = ['ENERGY_BLAST', 'TITAN_PUNCH', 'INFINITY_WAVE'];
        this.thanos.nextAttack = attacks[Math.floor(Math.random() * attacks.length)];
        this.thanos.state = 'TELEGRAPH';
        this.thanos.stateTimer = this.thanos.telegraphDuration;

        if (window.soundFX) window.soundFX.warningBeep();
      }
    } else if (this.thanos.state === 'TELEGRAPH') {
      this.thanos.stateTimer -= dt;
      if (this.thanos.stateTimer <= 0) {
        // Launch attack!
        this.executeThanosAttack();
      }
    } else if (this.thanos.state === 'ATTACKING') {
      if (this.thanos.nextAttack === 'TITAN_PUNCH') {
        this.thanos.actionTimer -= dt;
        const total = 0.7;
        const progress = 1 - (this.thanos.actionTimer / total);

        if (progress < 0.45) {
          const t = progress / 0.45;
          this.thanos.x = this.thanos.baseX - (this.thanos.baseX - (this.ironMan.baseX + 90)) * Math.sin(t * Math.PI / 2);
        } else if (progress < 0.55) {
          if (!this.thanos.punchLanded) {
            this.thanos.punchLanded = true;
            this.applyDamageToIronMan(24, 'TITAN PUNCH');
          }
        } else {
          const t = (progress - 0.55) / 0.45;
          this.thanos.x = (this.ironMan.baseX + 90) + (this.thanos.baseX - (this.ironMan.baseX + 90)) * (1 - Math.cos(t * Math.PI / 2));
        }

        if (this.thanos.actionTimer <= 0) {
          this.thanos.x = this.thanos.baseX;
          this.thanos.punchLanded = false;
          this.thanos.state = 'RECOVERY';
          this.thanos.stateTimer = 0.5;
        }
      }
    } else if (this.thanos.state === 'RECOVERY') {
      this.thanos.stateTimer -= dt;
      if (this.thanos.stateTimer <= 0) {
        this.thanos.state = 'IDLE';
        this.thanos.stateTimer = this.thanos.attackCooldown;
      }
    }
  }

  executeThanosAttack() {
    this.thanos.state = 'ATTACKING';

    if (this.thanos.nextAttack === 'ENERGY_BLAST') {
      if (window.soundFX) window.soundFX.titanBlast();
      this.projectiles.push({
        type: 'THANOS_BLAST',
        owner: 'THANOS',
        x: this.thanos.x - 60,
        y: this.thanos.y - 65,
        vx: -580,
        radius: 18,
        damage: 18,
        color: '#b000ff'
      });
      this.thanos.state = 'RECOVERY';
      this.thanos.stateTimer = 0.5;
    } else if (this.thanos.nextAttack === 'TITAN_PUNCH') {
      this.thanos.actionTimer = 0.7;
      this.thanos.punchLanded = false;
    } else if (this.thanos.nextAttack === 'INFINITY_WAVE') {
      if (window.soundFX) window.soundFX.cosmicWave();
      this.screenShake = 12;
      this.shockwaves.push({
        x: this.thanos.x - 40,
        y: this.groundY + 10,
        vx: -620,
        w: 36,
        h: 60,
        damage: 28,
        color: '#ff00aa'
      });
      this.thanos.state = 'RECOVERY';
      this.thanos.stateTimer = 0.6;
    }
  }

  updateProjectiles(dt) {
    // Regular projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;

      // Iron Man projectile hitting Thanos
      if (p.owner === 'IRON_MAN' && p.x >= this.thanos.x - 45) {
        this.applyDamageToThanos(p.damage, false, 'REPULSOR');
        this.ironMan.ultimate = Math.min(this.ironMan.maxUltimate, this.ironMan.ultimate + 12);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Thanos projectile hitting Iron Man
      if (p.owner === 'THANOS' && p.x <= this.ironMan.x + 40) {
        this.applyDamageToIronMan(p.damage, 'ENERGY BLAST');
        this.projectiles.splice(i, 1);
        continue;
      }

      // Out of bounds
      if (p.x < -50 || p.x > 1010) {
        this.projectiles.splice(i, 1);
      }
    }

    // Ground shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.x += s.vx * dt;

      if (s.x <= this.ironMan.x + 40) {
        this.applyDamageToIronMan(s.damage, 'INFINITY WAVE');
        this.shockwaves.splice(i, 1);
        continue;
      }

      if (s.x < -60) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateDamageNumbers(dt) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y += dn.vy * dt;
      dn.life -= dt;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  triggerVictory() {
    this.state = 'VICTORY';
    if (window.soundFX) window.soundFX.victory();

    const victoryOverlay = document.getElementById('victoryOverlay');
    if (victoryOverlay) {
      document.getElementById('victoryScore').textContent = `Final Battle Score: ${this.score}`;
      victoryOverlay.classList.remove('hidden');
    }
  }

  triggerDefeat() {
    this.state = 'GAMEOVER';
    if (window.soundFX) window.soundFX.gameOver();

    const gameOverOverlay = document.getElementById('gameOverOverlay');
    if (gameOverOverlay) {
      document.getElementById('gameOverScore').textContent = `Battle Score: ${this.score}`;
      gameOverOverlay.classList.remove('hidden');
    }
  }

  updateHUD() {
    // Iron Man Health
    const imHealthEl = document.getElementById('ironManHealthFill');
    if (imHealthEl) {
      const pct = Math.max(0, (this.ironMan.hp / this.ironMan.maxHp) * 100);
      imHealthEl.style.width = `${pct}%`;
    }

    // Thanos Health
    const thanosHealthEl = document.getElementById('thanosHealthFill');
    if (thanosHealthEl) {
      const pct = Math.max(0, (this.thanos.hp / this.thanos.maxHp) * 100);
      thanosHealthEl.style.width = `${pct}%`;
    }

    // Ultimate Meter
    const ultFill = document.getElementById('unibeamMeterFill');
    const ultText = document.getElementById('unibeamStatusText');
    if (ultFill && ultText) {
      const pct = Math.min(100, Math.round((this.ironMan.ultimate / this.ironMan.maxUltimate) * 100));
      ultFill.style.width = `${pct}%`;
      if (pct >= 100) {
        ultText.textContent = 'UNIBEAM — READY [D]';
        ultText.className = 'meter-status ready-pulse';
      } else {
        ultText.textContent = `CHARGING... ${pct}%`;
        ultText.className = 'meter-status charging';
      }
    }

    // Overall Score & Phase Indicator
    const scoreEl = document.getElementById('hudScore');
    if (scoreEl) scoreEl.textContent = this.score;

    const phaseEl = document.getElementById('hudPhase');
    if (phaseEl) phaseEl.textContent = `PHASE ${this.phase}/3`;
  }

  updateActionButtons() {
    // Update button states & cooldown overlays
    const updateBtn = (btnId, cd, maxCd, disabled = false) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      if (disabled || cd > 0) {
        btn.classList.add('disabled');
        const overlay = btn.querySelector('.cd-overlay');
        if (overlay) {
          const pct = Math.min(100, (cd / maxCd) * 100);
          overlay.style.height = `${pct}%`;
        }
      } else {
        btn.classList.remove('disabled');
        const overlay = btn.querySelector('.cd-overlay');
        if (overlay) overlay.style.height = '0%';
      }
    };

    updateBtn('btnActionRepulsor', this.ironMan.cooldowns.repulsor, 0.5);
    updateBtn('btnActionPunch', this.ironMan.cooldowns.punch, 1.4);
    updateBtn('btnActionUnibeam', this.ironMan.cooldowns.unibeam, 3.0, this.ironMan.ultimate < 100);

    const ultBtn = document.getElementById('btnActionUnibeam');
    if (ultBtn) {
      if (this.ironMan.ultimate >= 100) {
        ultBtn.classList.add('unibeam-glow');
      } else {
        ultBtn.classList.remove('unibeam-glow');
      }
    }
  }

  // -------------------------------------------------------------
  // RENDERING PIPELINE
  // -------------------------------------------------------------
  draw() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake Offset
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Draw Battlefield Backdrop
    this.drawBattlefield(ctx);

    // 2. Draw Thanos (Opponent on Right)
    this.drawThanos(ctx);

    // 3. Draw Iron Man (Player on Left)
    this.drawIronMan(ctx);

    // 4. Draw Projectiles & Energy Effects
    this.drawProjectiles(ctx);

    // 5. Draw Particles
    this.drawParticles(ctx);

    // 6. Draw Damage Numbers & Banners
    this.drawDamageNumbers(ctx);

    // 7. Lightning and Screen Flash
    if (this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(220, 240, 255, ${this.lightningFlash * 0.4})`;
      ctx.fillRect(0, 0, 960, 540);
    }
    if (this.screenFlash > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = Math.min(0.6, this.screenFlash);
      ctx.fillRect(0, 0, 960, 540);
      ctx.globalAlpha = 1.0;
    }

    // 8. Visual Announcements
    this.drawAnnouncements(ctx);

    ctx.restore();
  }

  drawBattlefield(ctx) {
    // Dramatic Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 440);
    if (this.phase === 1) {
      sky.addColorStop(0, '#0a0814');
      sky.addColorStop(0.5, '#1e1026');
      sky.addColorStop(1, '#3b121e');
    } else if (this.phase === 2) {
      sky.addColorStop(0, '#150612');
      sky.addColorStop(0.5, '#3b0a20');
      sky.addColorStop(1, '#521010');
    } else {
      sky.addColorStop(0, '#050014');
      sky.addColorStop(0.4, '#2c043e');
      sky.addColorStop(1, '#660824');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 960, 540);

    // Distant Destroyed Skyline (Silhouette)
    ctx.fillStyle = '#08060c';
    ctx.beginPath();
    ctx.moveTo(0, 440);
    // Skyscraper silhouettes
    const buildings = [
      { x: 30, w: 70, h: 220 }, { x: 120, w: 90, h: 280 }, { x: 230, w: 80, h: 190 },
      { x: 330, w: 110, h: 320 }, { x: 460, w: 70, h: 210 }, { x: 550, w: 95, h: 290 },
      { x: 670, w: 85, h: 240 }, { x: 780, w: 100, h: 310 }, { x: 900, w: 70, h: 200 }
    ];
    buildings.forEach(b => {
      ctx.rect(b.x, 440 - b.h, b.w, b.h);
    });
    ctx.fill();

    // Damaged Stark Tower spire in distance
    ctx.fillStyle = '#120d1c';
    ctx.beginPath();
    ctx.moveTo(350, 440);
    ctx.lineTo(375, 90);
    ctx.lineTo(395, 120);
    ctx.lineTo(415, 440);
    ctx.fill();

    // Flickering Neon Signs on Buildings
    this.neonFlickers.forEach(n => {
      n.phase += 0.05;
      const flicker = Math.sin(n.phase * 6) > -0.3 ? 0.8 : 0.2;
      ctx.save();
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = n.color;
      ctx.globalAlpha = flicker;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 10;
      ctx.fillText(n.text, n.x, n.y);
      ctx.restore();
    });

    // Drifting Battlefield Embers & Smoke
    this.bgDebris.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Ground Floor: Cracked futuristic pavement with neon grid
    const floor = ctx.createLinearGradient(0, 430, 0, 540);
    floor.addColorStop(0, '#1c1c28');
    floor.addColorStop(0.2, '#12121c');
    floor.addColorStop(1, '#08080f');
    ctx.fillStyle = floor;
    ctx.fillRect(0, 430, 960, 110);

    // Floor highlight line & energy fissure
    ctx.strokeStyle = this.phase === 3 ? '#ff00aa' : '#ffd200';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 432);
    ctx.lineTo(960, 432);
    ctx.stroke();

    // Energy cracks in ground
    ctx.strokeStyle = this.phase === 3 ? 'rgba(255, 0, 150, 0.4)' : 'rgba(255, 210, 0, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(480, 432);
    ctx.lineTo(460, 470);
    ctx.lineTo(490, 500);
    ctx.lineTo(470, 535);
    ctx.moveTo(760, 432);
    ctx.lineTo(740, 465);
    ctx.stroke();
  }

  drawIronMan(ctx) {
    const im = this.ironMan;
    const hoverOffset = Math.sin(im.hoverTime) * 4;
    const px = im.x;
    const py = im.y + hoverOffset;

    ctx.save();
    ctx.translate(px, py);

    // Hurt red tint flash
    if (im.hurtTimer > 0) {
      ctx.fillStyle = 'rgba(255, 50, 50, 0.45)';
      ctx.beginPath();
      ctx.arc(0, -50, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow on Ground
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 430 - py, 35, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Jet Boot Thruster Glow & Flames
    ctx.save();
    const flameSize = 10 + Math.sin(im.hoverTime * 3) * 4;
    const bootGradient = ctx.createLinearGradient(0, -6, 0, flameSize);
    bootGradient.addColorStop(0, '#ffffff');
    bootGradient.addColorStop(0.3, '#00f0ff');
    bootGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = bootGradient;
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.lineTo(-10, -5 + flameSize);
    ctx.lineTo(-4, -5);
    ctx.moveTo(4, -5);
    ctx.lineTo(10, -5 + flameSize);
    ctx.lineTo(16, -5);
    ctx.fill();
    ctx.restore();

    // --- LEGS & BOOTS ---
    ctx.fillStyle = '#b71c1c'; // Crimson Armor
    // Left leg
    ctx.fillRect(-18, -35, 10, 30);
    // Right leg
    ctx.fillRect(8, -35, 10, 30);
    // Gold knee pads
    ctx.fillStyle = '#ffd200';
    ctx.fillRect(-19, -24, 12, 8);
    ctx.fillRect(7, -24, 12, 8);

    // --- TORSO ---
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.moveTo(-22, -75);
    ctx.lineTo(22, -75);
    ctx.lineTo(16, -35);
    ctx.lineTo(-16, -35);
    ctx.closePath();
    ctx.fill();

    // Gold Chest Inset & Abdomen Plates
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.moveTo(-12, -72);
    ctx.lineTo(12, -72);
    ctx.lineTo(8, -48);
    ctx.lineTo(-8, -48);
    ctx.closePath();
    ctx.fill();

    // --- ARC REACTOR ---
    const reactorPulse = 0.8 + Math.sin(im.hoverTime * 4) * 0.2;
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14 * reactorPulse;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(0, -60, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -60, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- SHOULDERS & ARMS ---
    // Shoulder pauldrons
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.arc(-24, -72, 10, 0, Math.PI * 2);
    ctx.arc(24, -72, 10, 0, Math.PI * 2);
    ctx.fill();

    // Arm Poses depending on action
    if (im.currentAction === 'repulsor') {
      // Right arm extended forward firing
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(18, -75, 34, 10);
      // Glowing repulsor palm
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(52, -70, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (im.currentAction === 'punch') {
      // Rocket punch forward pose
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(16, -72, 38, 14);
      // Fist with fiery kinetic energy
      ctx.fillStyle = '#ff3300';
      ctx.beginPath();
      ctx.arc(54, -65, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (im.isBlocking) {
      // Arms crossed defensively in front
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(-6, -75, 12, 30);
      ctx.fillRect(2, -75, 12, 30);

      // Hexagonal Hologram Nano-Shield
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(35, -95);
      ctx.lineTo(55, -70);
      ctx.lineTo(55, -30);
      ctx.lineTo(35, -5);
      ctx.lineTo(15, -30);
      ctx.lineTo(15, -70);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Energy shield ripple lines
      ctx.beginPath();
      ctx.arc(35, -50, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // Idle arms at ready
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(-28, -68, 9, 26);
      ctx.fillRect(19, -68, 9, 26);
      // Repulsor palm glows
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-27, -44, 7, 4);
      ctx.fillRect(20, -44, 7, 4);
    }

    // --- HELMET ---
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.roundRect(-16, -104, 32, 32, [8, 8, 4, 4]);
    ctx.fill();

    // Gold Faceplate
    ctx.fillStyle = '#ffd200';
    ctx.beginPath();
    ctx.moveTo(-11, -100);
    ctx.lineTo(11, -100);
    ctx.lineTo(10, -78);
    ctx.lineTo(0, -74);
    ctx.lineTo(-10, -78);
    ctx.closePath();
    ctx.fill();

    // Glowing Eyes
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(-8, -90, 6, 2.5);
    ctx.fillRect(2, -90, 6, 2.5);
    ctx.restore();

    ctx.restore();
  }

  drawThanos(ctx) {
    const th = this.thanos;
    const px = th.x;
    const py = th.y;

    ctx.save();
    ctx.translate(px, py);

    // Defeated Pose (Kneeling)
    const isFallen = th.hp <= 0;
    const kneelY = isFallen ? 25 : 0;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 50, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rage Mode / Final Phase Aura
    if (this.phase >= 2 && !isFallen) {
      ctx.save();
      const auraPulse = 0.5 + Math.sin(th.auraPulse) * 0.3;
      const auraColor = this.phase === 3 ? 'rgba(255, 0, 180, 0.35)' : 'rgba(150, 0, 255, 0.25)';
      ctx.shadowColor = this.phase === 3 ? '#ff00aa' : '#9900ff';
      ctx.shadowBlur = 24;
      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(0, -65 + kneelY, 65 + auraPulse * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Hurt Flash
    if (th.hurtTimer > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(0, -65 + kneelY, 55, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- LEGS & GOLDEN GREAVES ---
    ctx.fillStyle = '#4a235a'; // Deep Titan Purple
    ctx.fillRect(-28, -48 + kneelY, 18, 48 - kneelY);
    ctx.fillRect(10, -48 + kneelY, 18, 48 - kneelY);

    // Golden Armor Plates on Legs
    ctx.fillStyle = '#d4af37'; // Titan Gold
    ctx.fillRect(-29, -38 + kneelY, 20, 22);
    ctx.fillRect(9, -38 + kneelY, 20, 22);

    // --- MASSIVE CHEST / TORSO ---
    ctx.fillStyle = '#d4af37'; // Golden Chest Armor
    ctx.beginPath();
    ctx.moveTo(-36, -100 + kneelY);
    ctx.lineTo(36, -100 + kneelY);
    ctx.lineTo(24, -48 + kneelY);
    ctx.lineTo(-24, -48 + kneelY);
    ctx.closePath();
    ctx.fill();

    // Dark Armor Trim & Insets
    ctx.fillStyle = '#1f1530';
    ctx.fillRect(-16, -92 + kneelY, 32, 38);

    // Gold Chest Emblem Lines
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -95 + kneelY);
    ctx.lineTo(0, -56 + kneelY);
    ctx.stroke();

    // --- SHOULDERS & PAULDRONS ---
    ctx.fillStyle = '#d4af37';
    // Massive Titan Pauldrons
    ctx.beginPath();
    ctx.moveTo(-36, -100 + kneelY);
    ctx.lineTo(-58, -112 + kneelY);
    ctx.lineTo(-44, -80 + kneelY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(36, -100 + kneelY);
    ctx.lineTo(58, -112 + kneelY);
    ctx.lineTo(44, -80 + kneelY);
    ctx.closePath();
    ctx.fill();

    // --- HEAD (PURPLE SKIN & GOLD HELMET) ---
    ctx.fillStyle = '#6c3483'; // Purple Titan skin
    ctx.beginPath();
    ctx.arc(0, -115 + kneelY, 19, 0, Math.PI * 2);
    ctx.fill();

    // Chin Ridges
    ctx.strokeStyle = '#4a235a';
    ctx.lineWidth = 1.5;
    for (let r = -8; r <= 8; r += 4) {
      ctx.beginPath();
      ctx.moveTo(r, -108 + kneelY);
      ctx.lineTo(r, -99 + kneelY);
      ctx.stroke();
    }

    // Gold Helmet
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(-18, -118 + kneelY);
    ctx.lineTo(18, -118 + kneelY);
    ctx.lineTo(12, -134 + kneelY);
    ctx.lineTo(0, -138 + kneelY);
    ctx.lineTo(-12, -134 + kneelY);
    ctx.closePath();
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = this.phase >= 2 ? '#ff0055' : '#ffffff';
    ctx.fillRect(-9, -118 + kneelY, 5, 2.5);
    ctx.fillRect(4, -118 + kneelY, 5, 2.5);

    // --- INFINITY GAUNTLET (LEFT HAND - FACING IRON MAN) ---
    ctx.save();
    const gauntletX = -44;
    const gauntletY = -78 + kneelY;

    // Golden Arm / Gauntlet
    ctx.fillStyle = '#e5b824';
    ctx.fillRect(gauntletX - 10, gauntletY - 10, 22, 34);

    // 6 Infinity Stones
    if (!isFallen) {
      const stones = [
        { x: -5, y: -4, color: '#ff00aa', name: 'Power' },
        { x: 3, y: -4, color: '#00f0ff', name: 'Space' },
        { x: -5, y: 4, color: '#ff2200', name: 'Reality' },
        { x: 3, y: 4, color: '#ff8800', name: 'Soul' },
        { x: -1, y: 12, color: '#00ff66', name: 'Time' },
        { x: -1, y: 2, color: '#ffd200', name: 'Mind' } // Center back of hand
      ];

      stones.forEach(st => {
        ctx.save();
        ctx.fillStyle = st.color;
        ctx.shadowColor = st.color;
        ctx.shadowBlur = 8 + (this.phase === 3 ? 6 : 0);
        ctx.beginPath();
        ctx.arc(gauntletX + st.x, gauntletY + st.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
    ctx.restore();

    // Right Hand (Clenched Fist)
    ctx.fillStyle = '#6c3483';
    ctx.beginPath();
    ctx.arc(42, -70 + kneelY, 11, 0, Math.PI * 2);
    ctx.fill();

    // Visual Warning Banner over Thanos
    if (th.state === 'TELEGRAPH') {
      ctx.save();
      const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.15;
      ctx.scale(pulse, pulse);
      ctx.font = '900 16px "Arial Black", sans-serif';
      ctx.fillStyle = '#ff2244';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 12;
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ ATTACK INCOMING!', 0, -155 + kneelY);

      let attackName = 'ENERGY BLAST';
      if (th.nextAttack === 'TITAN_PUNCH') attackName = 'TITAN PUNCH';
      if (th.nextAttack === 'INFINITY_WAVE') attackName = 'INFINITY WAVE';

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ffd200';
      ctx.fillText(`[ ${attackName} ]`, 0, -138 + kneelY);
      ctx.restore();
    }

    ctx.restore();
  }

  drawProjectiles(ctx) {
    // Repulsor & Energy Blasts
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Energy core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Trail
      const trailLen = p.owner === 'IRON_MAN' ? -40 : 40;
      const grad = ctx.createLinearGradient(p.x, p.y, p.x + trailLen, p.y);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y - p.radius * 0.6, trailLen, p.radius * 1.2);
      ctx.restore();
    });

    // Unibeam Giant Laser Beam
    if (this.ironMan.currentAction === 'unibeam') {
      ctx.save();
      const beamY = this.ironMan.y - 60;
      const startX = this.ironMan.x + 10;
      const beamW = 960 - startX;

      // Outer Glow
      const beamGrad = ctx.createLinearGradient(0, beamY - 45, 0, beamY + 45);
      beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      beamGrad.addColorStop(0.3, 'rgba(0, 240, 255, 0.7)');
      beamGrad.addColorStop(0.5, '#ffffff');
      beamGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.7)');
      beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = beamGrad;
      ctx.fillRect(startX, beamY - 35, beamW, 70);

      // Core Laser
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 24;
      ctx.fillRect(startX, beamY - 10, beamW, 20);

      // Impact starburst at Thanos
      ctx.beginPath();
      ctx.arc(this.thanos.x, beamY, 45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
      ctx.restore();
    }

    // Ground Shockwaves
    this.shockwaves.forEach(s => {
      ctx.save();
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.w, s.h, 0, 0, Math.PI * 2);
      ctx.fill();

      // Energy rings
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.h * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  drawParticles(ctx) {
    this.particles.forEach(pt => {
      ctx.save();
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawDamageNumbers(ctx) {
    this.damageNumbers.forEach(dn => {
      ctx.save();
      ctx.font = `900 ${dn.size}px "Arial Black", sans-serif`;
      ctx.fillStyle = dn.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.globalAlpha = Math.max(0, dn.life / dn.maxLife);
      ctx.textAlign = 'center';
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    });
  }

  drawAnnouncements(ctx) {
    if (this.announcement.timer <= 0) return;

    ctx.save();
    const alpha = Math.min(1, this.announcement.timer * 2);
    ctx.globalAlpha = alpha;

    ctx.font = '900 36px "Arial Black", sans-serif';
    ctx.fillStyle = this.announcement.color;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 16;
    ctx.textAlign = 'center';
    ctx.fillText(this.announcement.text, 480, 160);

    if (this.announcement.subtext) {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.announcement.subtext, 480, 195);
    }

    ctx.restore();
  }
}

window.IronManGame = IronManGame;
