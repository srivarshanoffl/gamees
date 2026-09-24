/**
 * EnemySystem.js — Multiverse Enemy Variants & AI Logic
 * Handles Doom Machines, Corrupted Guards, Doom Soldiers, and Temporal Sentinels.
 */

class EnemySystem {
  constructor(engine) {
    this.engine = engine;
    this.enemies = [];
    this.projectiles = [];
  }

  reset() {
    this.enemies = [];
    this.projectiles = [];
  }

  spawnEnemy(type, x, y) {
    const config = {
      type,
      x, y,
      w: 38, h: 54,
      vx: 0, vy: 0,
      facing: -1,
      hp: 35, maxHp: 35,
      speed: 120,
      attackCooldown: 1.5,
      attackTimer: Math.random() * 1.5,
      isGrounded: false,
      state: 'PATROL',
      patrolStartX: x,
      patrolRange: 160,
      alive: true
    };

    if (type === 'doom_machine' || type === 'drone') {
      config.hp = 30;
      config.maxHp = 30;
      config.color = '#10b981';
      config.speed = 140;
    } else if (type === 'corrupted_guard' || type === 'einherjar') {
      config.hp = 55;
      config.maxHp = 55;
      config.color = '#f59e0b';
      config.speed = 95;
    } else if (type === 'doom_soldier' || type === 'hydra') {
      config.hp = 40;
      config.maxHp = 40;
      config.color = '#ef4444';
      config.speed = 135;
    } else if (type === 'temporal_sentinel' || type === 'doom_variant') {
      config.hp = 80;
      config.maxHp = 80;
      config.color = '#8b5cf6';
      config.w = 44;
      config.h = 60;
      config.speed = 150;
    }

    // Attach takeDamage method for companion compatibility
    config.takeDamage = (amount, knockbackDir = -1) => {
      this.damageEnemy(config, amount, this.enemies.indexOf(config), knockbackDir);
    };

    this.enemies.push(config);
    return config;
  }

  update(dt, player) {
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) continue;

      e.attackTimer -= dt;

      const distToPlayer = Math.abs((player.x + player.w / 2) - (e.x + e.w / 2));
      const inAggroRange = distToPlayer < 380;

      // AI State Machine
      if (inAggroRange) {
        e.facing = (player.x > e.x) ? 1 : -1;
        e.vx = e.facing * e.speed;

        if (e.attackTimer <= 0) {
          e.attackTimer = e.attackCooldown;
          this.triggerEnemyAttack(e, player);
        }
      } else {
        if (e.x > e.patrolStartX + e.patrolRange) e.facing = -1;
        else if (e.x < e.patrolStartX - e.patrolRange) e.facing = 1;
        e.vx = e.facing * (e.speed * 0.5);
      }

      // Physics & Platforms
      e.vy += this.engine.gravity * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      e.isGrounded = false;
      for (const plat of this.engine.platforms) {
        if (
          e.x + e.w > plat.x &&
          e.x < plat.x + plat.w &&
          e.y + e.h >= plat.y &&
          e.y + e.h <= plat.y + 24 &&
          e.vy >= 0
        ) {
          e.y = plat.y - e.h;
          e.vy = 0;
          e.isGrounded = true;
        }
      }

      // Check collision with player
      if (
        player.x + player.w > e.x &&
        player.x < e.x + e.w &&
        player.y + player.h > e.y &&
        player.y < e.y + e.h
      ) {
        player.takeDamage(12);
      }
    }

    // Update enemy projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.life -= dt;

      // Hit player
      if (
        p.x > player.x &&
        p.x < player.x + player.w &&
        p.y > player.y &&
        p.y < player.y + player.h
      ) {
        player.takeDamage(p.damage || 14);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  triggerEnemyAttack(e, player) {
    if (e.type === 'doom_soldier' || e.type === 'doom_machine') {
      this.projectiles.push({
        x: e.facing === 1 ? e.x + e.w : e.x,
        y: e.y + 22,
        vx: e.facing * 340,
        damage: 12,
        color: e.color,
        life: 1.5
      });
      this.engine.particles.spawnBurst(e.x + (e.facing === 1 ? e.w : 0), e.y + 22, e.color, 4, 60);
    } else if (e.type === 'temporal_sentinel') {
      this.projectiles.push(
        { x: e.x + e.w / 2, y: e.y + 16, vx: e.facing * 400, damage: 16, color: '#8b5cf6', life: 1.8 },
        { x: e.x + e.w / 2, y: e.y + 36, vx: e.facing * 400, damage: 16, color: '#10b981', life: 1.8 }
      );
      this.engine.audio.playMagic();
    } else {
      this.engine.particles.spawnShockwave(
        e.x + (e.facing === 1 ? e.w + 15 : -15),
        e.y + 24,
        e.color,
        28,
        0.2
      );
    }
  }

  checkPlayerAttacks(player) {
    player.onMeleeSlash = (hitbox) => {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (!e.alive) continue;
        if (
          hitbox.x + hitbox.w > e.x &&
          hitbox.x < e.x + e.w &&
          hitbox.y + hitbox.h > e.y &&
          hitbox.y < e.y + e.h
        ) {
          this.damageEnemy(e, 25, i, player.facing);
        }
      }
    };

    for (let pIdx = player.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = player.projectiles[pIdx];
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (!e.alive) continue;
        if (
          p.x >= e.x && p.x <= e.x + e.w &&
          p.y >= e.y && p.y <= e.y + e.h
        ) {
          this.damageEnemy(e, 20, i, Math.sign(p.vx));
          player.projectiles.splice(pIdx, 1);
          break;
        }
      }
    }
  }

  damageEnemy(e, damage, index, knockbackDir = -1) {
    if (!e || !e.alive) return;
    e.hp -= damage;
    this.engine.audio.playHit();
    this.engine.particles.spawnComicText('POW!', e.x + e.w / 2, e.y - 12, '#ffd200');
    this.engine.particles.spawnBurst(e.x + e.w / 2, e.y + e.h / 2, e.color, 8, 90);
    e.x += knockbackDir * 14;

    if (e.hp <= 0) {
      e.alive = false;
      this.engine.audio.playExplosion();
      this.engine.particles.spawnBurst(e.x + e.w / 2, e.y + e.h / 2, '#ffd200', 20, 160);
      this.engine.particles.spawnComicText('CRUSH!', e.x + e.w / 2, e.y - 20, '#00ff88');

      if (index >= 0) {
        this.enemies.splice(index, 1);
      }
    }
  }

  render(ctx) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      ctx.save();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, e.y + e.h + 2, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x + 6, e.y + 12, e.w - 12, e.h - 18);

      // Head / Helmet
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(e.x + e.w / 2, e.y + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      // Visor / Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.facing === 1 ? e.x + e.w / 2 + 1 : e.x + e.w / 2 - 5, e.y + 6, 4, 3);

      // Weapon / Blaster
      ctx.fillStyle = '#64748b';
      const gunX = e.facing === 1 ? e.x + e.w - 2 : e.x - 8;
      ctx.fillRect(gunX, e.y + 22, 10, 5);

      // Mini Health Bar above head
      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(e.x, e.y - 12, e.w, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.x, e.y - 12, e.w * hpPct, 4);

      ctx.restore();
    }

    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.EnemySystem = EnemySystem;
