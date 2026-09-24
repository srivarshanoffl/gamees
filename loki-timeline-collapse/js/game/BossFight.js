/**
 * BossFight.js — Sub-Bosses & Doctor Doom Combat System
 * Handles Asgard Guardian, Doom Super-Soldier, Stark Doom-Tech Armor,
 * Mystic Guardian, and Doctor Doom.
 */

class BossFight {
  constructor(engine) {
    this.engine = engine;
    this.active = false;
    this.boss = null;
    this.phase = 1;
    this.projectiles = [];
  }

  reset() {
    this.active = false;
    this.boss = null;
    this.phase = 1;
    this.projectiles = [];
    const bar = document.getElementById('bossHudBar');
    if (bar) bar.classList.remove('active');
  }

  spawnBoss(type = 'doom', x = 2400, y = 340) {
    this.active = true;
    this.phase = 1;

    const bossConfigs = {
      asgard_guardian: {
        name: 'DOOM ASGARDIAN GUARDIAN',
        hp: 220,
        color: '#f59e0b',
        w: 52, h: 72,
        attackCooldown: 1.8
      },
      doom_supersoldier: {
        name: 'DOOM SUPER-SOLDIER',
        hp: 240,
        color: '#ef4444',
        w: 48, h: 68,
        attackCooldown: 1.6
      },
      doom_armor: {
        name: 'DOOM-TECH ARMOR PROTOTYPE',
        hp: 260,
        color: '#f97316',
        w: 50, h: 70,
        attackCooldown: 1.5
      },
      mystic_guardian: {
        name: 'DOOM MYSTIC GUARDIAN',
        hp: 280,
        color: '#ec4899',
        w: 46, h: 66,
        attackCooldown: 1.7
      },
      doom: {
        name: 'DOCTOR DOOM — MASTER OF TIME',
        hp: 360,
        color: '#10b981',
        w: 48, h: 68,
        attackCooldown: 1.4
      }
    };

    const cfg = bossConfigs[type] || bossConfigs.doom;

    this.boss = {
      type,
      name: cfg.name,
      x, y,
      w: cfg.w,
      h: cfg.h,
      color: cfg.color,
      vx: 0, vy: 0,
      facing: -1,
      hp: cfg.hp,
      maxHp: cfg.hp,
      state: 'IDLE',
      timer: 1.5,
      attackCooldown: cfg.attackCooldown,
      shieldActive: false,
      hoverOffset: 0
    };

    const bar = document.getElementById('bossHudBar');
    const nameEl = document.getElementById('bossName');
    if (bar) bar.classList.add('active');
    if (nameEl) nameEl.textContent = this.boss.name;
    this.updateHUD();

    if (this.engine.audio) {
      this.engine.audio.playDoomTheme();
    }
  }

  update(dt, player) {
    if (!this.active || !this.boss) return;
    const b = this.boss;

    b.timer -= dt;
    b.hoverOffset = Math.sin(performance.now() * 0.004) * 8;
    b.facing = (player.x > b.x) ? 1 : -1;

    // Check Phase Transitions
    const hpPct = b.hp / b.maxHp;
    if (this.phase === 1 && hpPct <= 0.5) {
      this.phase = 2;
      this.triggerPhase2(player);
    } else if (this.phase === 2 && hpPct <= 0.15) {
      this.phase = 3;
      this.triggerPhase3();
    }

    // Boss AI Loop
    if (b.timer <= 0) {
      b.timer = b.attackCooldown;
      this.executeBossAction(b, player);
    }

    // Update Boss Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += (p.vy || 0) * dt;
      p.life -= dt;

      // Hit Player
      if (
        p.x > player.x &&
        p.x < player.x + player.w &&
        p.y > player.y &&
        p.y < player.y + player.h
      ) {
        player.takeDamage(p.damage || 16);
        if (this.engine.particles) {
          this.engine.particles.createSparkBurst(p.x, p.y, '#ef4444', 8);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Player attacks against Boss
    if (player.attackTimer > 0) {
      const slashX = player.facing === 1 ? player.x + player.w : player.x - 45;
      if (
        slashX + 50 > b.x &&
        slashX < b.x + b.w &&
        player.y + 10 + 40 > b.y &&
        player.y + 10 < b.y + b.h
      ) {
        this.damageBoss(25);
        player.attackTimer = 0;
      }
    }

    for (let i = player.projectiles.length - 1; i >= 0; i--) {
      const p = player.projectiles[i];
      if (
        p.x >= b.x && p.x <= b.x + b.w &&
        p.y >= b.y && p.y <= b.y + b.h
      ) {
        this.damageBoss(20);
        player.projectiles.splice(i, 1);
        break;
      }
    }

    this.updateHUD();
  }

  executeBossAction(b, player) {
    const attacks = ['ENERGY_WAVE', 'TITAN_SLAM', 'TELEPORT_STRIKE'];
    const chosen = attacks[Math.floor(Math.random() * attacks.length)];

    if (chosen === 'ENERGY_WAVE') {
      if (this.engine.audio) this.engine.audio.playMagic();
      if (this.engine.particles) {
        this.engine.particles.showPopupText('CHRONO BEAM!', b.x + b.w / 2, b.y - 15, b.color);
      }
      for (let i = -1; i <= 1; i++) {
        this.projectiles.push({
          x: b.facing === 1 ? b.x + b.w : b.x,
          y: b.y + 24 + i * 16,
          vx: b.facing * 440,
          vy: i * 60,
          damage: 16,
          color: b.color,
          life: 2.2
        });
      }
    } else if (chosen === 'TITAN_SLAM') {
      if (this.engine.audio) this.engine.audio.playExplosion();
      this.engine.shakeScreen(10, 0.4);
      if (this.engine.particles) {
        this.engine.particles.createShockwave(b.x + b.w / 2, b.y + b.h, b.color, 120, 0.4);
      }
      this.projectiles.push(
        { x: b.x, y: b.y + b.h - 10, vx: -320, vy: 0, damage: 18, color: b.color, life: 1.5 },
        { x: b.x, y: b.y + b.h - 10, vx: 320, vy: 0, damage: 18, color: b.color, life: 1.5 }
      );
    } else if (chosen === 'TELEPORT_STRIKE') {
      if (this.engine.particles) {
        this.engine.particles.createSparkBurst(b.x + b.w / 2, b.y + b.h / 2, b.color, 14);
      }
      b.x = player.x + (b.facing === 1 ? -120 : 120);
      if (this.engine.particles) {
        this.engine.particles.createSparkBurst(b.x + b.w / 2, b.y + b.h / 2, b.color, 14);
      }
      if (this.engine.audio) this.engine.audio.playMagic();
    }
  }

  triggerPhase2(player) {
    if (this.engine.audio) this.engine.audio.playDoomTheme();
    this.engine.shakeScreen(14, 0.8);
    if (this.engine.particles) {
      this.engine.particles.showPopupText('OVERDRIVE!', this.boss.x + this.boss.w / 2, this.boss.y - 30, '#ef4444');
    }
    for (let i = 0; i < 5; i++) {
      this.projectiles.push({
        x: player.x + (Math.random() - 0.5) * 500,
        y: 40,
        vx: (Math.random() - 0.5) * 60,
        vy: 360,
        damage: 16,
        color: this.boss.color,
        life: 2.0
      });
    }
  }

  triggerPhase3() {
    if (this.boss.type === 'doom') {
      if (this.onVictoryChoice) {
        this.onVictoryChoice();
      }
    }
  }

  damageBoss(amount) {
    if (!this.boss) return;
    this.boss.hp = Math.max(0, this.boss.hp - amount);
    if (this.engine.audio) this.engine.audio.playHit();
    if (this.engine.particles) {
      this.engine.particles.createSparkBurst(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, '#10b981', 10);
    }
    this.engine.shakeScreen(5, 0.2);

    if (this.boss.hp <= 0) {
      if (this.engine.audio) this.engine.audio.playExplosion();
      if (this.engine.particles) {
        this.engine.particles.createSparkBurst(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, '#fbbf24', 30);
        this.engine.particles.showPopupText('DEFEATED!', this.boss.x + this.boss.w / 2, this.boss.y - 20, '#34d399');
      }
      this.active = false;
      const bar = document.getElementById('bossHudBar');
      if (bar) bar.classList.remove('active');
      if (this.onBossDefeated) {
        this.onBossDefeated();
      }
    }
  }

  updateHUD() {
    if (!this.boss) return;
    const fill = document.getElementById('bossMeterFill');
    if (fill) {
      const pct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
      fill.style.width = `${pct}%`;
    }
  }

  render(ctx) {
    if (!this.active || !this.boss) return;
    const b = this.boss;

    ctx.save();
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h + 2, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const renderY = b.y + b.hoverOffset;

    // Outer Cape / Shell
    ctx.fillStyle = b.type === 'doom' ? '#166534' : b.color;
    ctx.fillRect(b.x + 4, renderY + 12, b.w - 8, b.h - 16);

    // Armor Plate
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(b.x + 10, renderY + 20, b.w - 20, 26);

    // Head / Mask
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, renderY + 12, 12, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(b.x + b.w / 2 - 6, renderY + 10, 4, 3);
    ctx.fillRect(b.x + b.w / 2 + 2, renderY + 10, 4, 3);

    // Hood or Helmet Trim
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, renderY + 10, 14, Math.PI, 0);
    ctx.stroke();

    ctx.restore();

    // Render Boss Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.BossFight = BossFight;
