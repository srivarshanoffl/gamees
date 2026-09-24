/**
 * CompanionSystem.js
 * AI Hero Companions (Thor, Captain America, Iron Man, Doctor Strange)
 * that follow Loki, auto-assist in combat, and interact with dimension puzzles.
 */

class Companion {
  constructor(engine, type = 'thor') {
    this.engine = engine;
    this.type = type; // 'thor', 'cap', 'ironman', 'strange'
    this.x = 100;
    this.y = 300;
    this.vx = 0;
    this.vy = 0;
    this.width = 36;
    this.height = 54;
    this.facing = 1;
    this.isGrounded = false;
    
    // AI Follow parameters
    this.followDistance = 65;
    this.maxSpeed = 260;
    this.accel = 1000;
    
    // Combat parameters
    this.attackCooldown = 0;
    this.attackInterval = 1.4; // seconds between attacks
    this.attackRange = 220;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.targetEnemy = null;

    // Special projectile / shield
    this.projectile = null;

    this.initType();
  }

  initType() {
    switch (this.type) {
      case 'thor':
        this.name = 'THOR';
        this.color = '#38bdf8';
        this.capeColor = '#ef4444';
        this.attackInterval = 1.2;
        this.dialogueIcon = '⚡';
        break;
      case 'cap':
        this.name = 'CAPTAIN AMERICA';
        this.color = '#ef4444';
        this.shieldColor = '#3b82f6';
        this.attackInterval = 1.0;
        this.dialogueIcon = '⭐';
        break;
      case 'ironman':
        this.name = 'IRON MAN';
        this.color = '#e11d48';
        this.goldColor = '#fbbf24';
        this.attackInterval = 0.9;
        this.dialogueIcon = '🤖';
        break;
      case 'strange':
        this.name = 'DOCTOR STRANGE';
        this.color = '#8b5cf6';
        this.capeColor = '#dc2626';
        this.attackInterval = 1.3;
        this.dialogueIcon = '👁️';
        break;
    }
  }

  update(dt, player, enemies = []) {
    if (!player) return;

    // 1. Follow Loki
    const targetX = player.x - (player.facing * this.followDistance);
    const distToTarget = targetX - this.x;

    if (Math.abs(distToTarget) > 16) {
      this.facing = distToTarget > 0 ? 1 : -1;
      this.vx = Math.sign(distToTarget) * Math.min(Math.abs(distToTarget) * 4, this.maxSpeed);
    } else {
      this.vx *= 0.7;
    }

    // Teleport catch-up if too far (e.g. falling behind or stuck)
    if (Math.hypot(player.x - this.x, player.y - this.y) > 650) {
      this.x = player.x - player.facing * 40;
      this.y = player.y;
      this.vx = 0;
      this.vy = 0;
      if (this.engine.particles) {
        this.engine.particles.createSparkBurst(this.x, this.y, this.color, 15);
      }
    }

    // Jump if player is high above or ledge is in front
    if (this.isGrounded && player.y < this.y - 45 && Math.random() < 0.08) {
      this.vy = -540;
      this.isGrounded = false;
    }

    // Physics
    this.vy += this.engine.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Platform collision
    this.isGrounded = false;
    for (const plat of this.engine.platforms) {
      if (
        this.x + this.width / 2 > plat.x &&
        this.x - this.width / 2 < plat.x + plat.w &&
        this.y + this.height / 2 >= plat.y &&
        this.y + this.height / 2 <= plat.y + 24 &&
        this.vy >= 0
      ) {
        this.y = plat.y - this.height / 2;
        this.vy = 0;
        this.isGrounded = true;
        break;
      }
    }

    // 2. Auto-combat AI
    this.attackCooldown -= dt;
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) this.isAttacking = false;
    }

    if (this.attackCooldown <= 0 && enemies && enemies.length > 0) {
      // Find closest alive enemy in front
      let closest = null;
      let minDist = this.attackRange;

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (d < minDist) {
          minDist = d;
          closest = enemy;
        }
      }

      if (closest) {
        this.executeAttack(closest);
      }
    }

    // Update active projectile (e.g. Cap's shield or Iron Man's missile)
    if (this.projectile) {
      this.updateProjectile(dt, enemies);
    }
  }

  executeAttack(target) {
    this.attackCooldown = this.attackInterval;
    this.isAttacking = true;
    this.attackTimer = 0.35;
    this.facing = target.x > this.x ? 1 : -1;
    this.targetEnemy = target;

    const audio = this.engine.audio;
    const particles = this.engine.particles;

    switch (this.type) {
      case 'thor':
        if (audio) audio.playThorLightning();
        if (particles) {
          particles.createLightning(target.x, target.y - 120, target.x, target.y);
          particles.showPopupText('THUNDER!', target.x, target.y - 40, '#38bdf8');
        }
        target.takeDamage(35, this.facing);
        break;

      case 'cap':
        if (audio) audio.playCapShield();
        // Shield ricochet projectile
        this.projectile = {
          x: this.x,
          y: this.y - 10,
          targetX: target.x,
          targetY: target.y,
          speed: 600,
          returning: false,
          damage: 30
        };
        if (particles) {
          particles.showPopupText('CLANG!', target.x, target.y - 40, '#ef4444');
        }
        break;

      case 'ironman':
        if (audio) audio.playRepulsor();
        if (particles) {
          particles.createBeam(this.x, this.y - 10, target.x, target.y, '#fbbf24', 6);
          particles.showPopupText('BLAST!', target.x, target.y - 40, '#f59e0b');
        }
        target.takeDamage(28, this.facing);
        break;

      case 'strange':
        if (audio) audio.playStrangePortal();
        if (particles) {
          particles.createEldritchGlyph(target.x, target.y, '#ec4899');
          particles.showPopupText('MIRROR!', target.x, target.y - 40, '#ec4899');
        }
        target.takeDamage(32, this.facing);
        break;
    }
  }

  updateProjectile(dt, enemies) {
    const p = this.projectile;
    if (!p) return;

    if (!p.returning) {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 20) {
        p.returning = true;
        // Hit target
        if (this.targetEnemy && this.targetEnemy.alive) {
          this.targetEnemy.takeDamage(p.damage, this.facing);
        }
      } else {
        p.x += (dx / dist) * p.speed * dt;
        p.y += (dy / dist) * p.speed * dt;
      }
    } else {
      const dx = this.x - p.x;
      const dy = (this.y - 10) - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 25) {
        this.projectile = null;
      } else {
        p.x += (dx / dist) * p.speed * dt;
        p.y += (dy / dist) * p.speed * dt;
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(Math.floor(this.x), Math.floor(this.y));
    ctx.scale(this.facing, 1);

    // Procedural Rendering matching 2.5D Sprite Style
    switch (this.type) {
      case 'thor':
        this.renderThor(ctx);
        break;
      case 'cap':
        this.renderCap(ctx);
        break;
      case 'ironman':
        this.renderIronMan(ctx);
        break;
      case 'strange':
        this.renderStrange(ctx);
        break;
    }

    ctx.restore();

    // Render flying shield projectile if active
    if (this.projectile) {
      this.renderShield(ctx, this.projectile.x, this.projectile.y);
    }
  }

  renderThor(ctx) {
    // Red Cape
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-10, -15);
    ctx.lineTo(-24 - (this.vx * 0.04), 22);
    ctx.lineTo(-4, 22);
    ctx.closePath();
    ctx.fill();

    // Body / Asgardian Armor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, -18, 20, 36);

    // Silver armor plates
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(-4, -8, 4, 0, Math.PI * 2);
    ctx.arc(4, -8, 4, 0, Math.PI * 2);
    ctx.arc(-4, 4, 4, 0, Math.PI * 2);
    ctx.arc(4, 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Arms & Mjolnir
    ctx.fillStyle = '#64748b';
    ctx.fillRect(8, -8, 8, 16);
    // Hammer handle + head
    ctx.fillStyle = '#78350f';
    ctx.fillRect(12, -22, 4, 22);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(8, -26, 12, 10);
    // Lightning aura on hammer if attacking
    if (this.isAttacking) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, -28, 16, 14);
    }

    // Head & Winged Helmet
    ctx.fillStyle = '#fbcfe8'; // Face
    ctx.fillRect(-6, -26, 12, 10);
    ctx.fillStyle = '#e2e8f0'; // Helmet
    ctx.fillRect(-8, -32, 16, 8);
    // Helmet wings
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-8, -32);
    ctx.lineTo(-15, -40);
    ctx.lineTo(-8, -36);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -32);
    ctx.lineTo(15, -40);
    ctx.lineTo(8, -36);
    ctx.fill();
  }

  renderCap(ctx) {
    // Body / Blue Suit
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(-10, -18, 20, 36);

    // White Star on Chest
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -12, 6, 6);

    // Red & White stripes on abdomen
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-8, -2, 16, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, 4, 16, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-8, 10, 16, 4);

    // Head / Cowl
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(-7, -30, 14, 14);
    ctx.fillStyle = '#fbcfe8'; // Face cutout
    ctx.fillRect(-5, -24, 10, 7);
    ctx.fillStyle = '#ffffff'; // 'A' on forehead
    ctx.fillRect(-2, -29, 4, 3);

    // Shield on back or arm
    if (!this.projectile) {
      this.renderShield(ctx, 12, -4);
    }
  }

  renderShield(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // Outer red
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    // White ring
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    // Inner red ring
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // Blue center + star
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderIronMan(ctx) {
    // Red Armor body
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-10, -18, 20, 36);

    // Gold thigh and shoulder accents
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-12, -16, 4, 10);
    ctx.fillRect(8, -16, 4, 10);
    ctx.fillRect(-8, 8, 4, 8);
    ctx.fillRect(4, 8, 4, 8);

    // Arc Reactor glow on chest
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Helmet (Red + Gold faceplate)
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-7, -30, 14, 14);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-5, -26, 10, 9);
    // Glowing cyan slit eyes
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-4, -24, 3, 2);
    ctx.fillRect(1, -24, 3, 2);

    // Repulsor hand glow if attacking
    if (this.isAttacking) {
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(14, -6, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderStrange(ctx) {
    // Cloak of Levitation (High red collar + floating cape)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.lineTo(-24 - (this.vx * 0.05), 24);
    ctx.lineTo(-2, 24);
    ctx.closePath();
    ctx.fill();
    // High collar
    ctx.beginPath();
    ctx.moveTo(-9, -24);
    ctx.lineTo(-14, -34);
    ctx.lineTo(-6, -26);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -24);
    ctx.lineTo(14, -34);
    ctx.lineTo(6, -26);
    ctx.fill();

    // Blue Mystic Robes
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-10, -18, 20, 36);

    // Eye of Agamotto talisman on chest
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Head & Grey-streaked hair
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(-6, -26, 12, 10);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7, -31, 14, 6);
    ctx.fillStyle = '#cbd5e1'; // Silver temples
    ctx.fillRect(-8, -28, 2, 4);
    ctx.fillRect(6, -28, 2, 4);

    // Eldritch Mandalas when attacking
    if (this.isAttacking) {
      ctx.save();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(14, -6, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeRect(8, -12, 12, 12);
      ctx.restore();
    }
  }
}

window.Companion = Companion;
