/**
 * LokiPlayer.js — 2.5D Loki Character Controller
 * Procedural pixel-art rendering with animated emerald cape, horned helmet, scepter, and sorcery.
 */

class LokiPlayer {
  constructor(engine, startX = 120, startY = 380) {
    this.engine = engine;
    this.x = startX;
    this.y = startY;
    this.w = 34;
    this.h = 58;

    this.vx = 0;
    this.vy = 0;
    this.speed = 280;
    this.jumpForce = 580;
    this.isGrounded = false;
    this.jumpsLeft = 2; // Double jump
    this.facing = 1; // 1: right, -1: left

    // Health
    this.hp = 100;
    this.maxHp = 100;
    this.invulnerableTimer = 0;

    // Combat & Abilities
    this.attackTimer = 0;
    this.attackDuration = 0.22;
    this.meleeCooldown = 0;

    this.magicCooldown = 0;
    this.magicCooldownMax = 0.6;
    this.projectiles = [];

    // Temporal Powers
    this.freezeCooldown = 0;
    this.freezeCooldownMax = 10.0;
    this.freezeActiveTimer = 0;

    this.rewindCooldown = 0;
    this.rewindCooldownMax = 12.0;
    this.history = []; // Position buffer for rewind

    // Visual animation states
    this.animTime = 0;
    this.state = 'IDLE'; // IDLE, RUN, JUMP, ATTACK, MAGIC
    this.capeWave = 0;
  }

  reset(x = 120, y = 380) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = 100;
    this.invulnerableTimer = 0;
    this.projectiles = [];
    this.history = [];
    this.freezeActiveTimer = 0;
  }

  update(dt) {
    this.animTime += dt;
    this.capeWave += dt * 6;

    // Cooldown timers
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.meleeCooldown > 0) this.meleeCooldown -= dt;
    if (this.magicCooldown > 0) this.magicCooldown -= dt;
    if (this.freezeCooldown > 0) this.freezeCooldown -= dt;
    if (this.rewindCooldown > 0) this.rewindCooldown -= dt;

    if (this.attackTimer > 0) this.attackTimer -= dt;

    // Handle Time Freeze duration
    if (this.freezeActiveTimer > 0) {
      this.freezeActiveTimer -= dt;
      if (this.freezeActiveTimer <= 0) {
        this.engine.timeScale = 1.0;
      }
    }

    // Save history for Rewind power (at 10Hz)
    if (Math.random() < 0.2) {
      this.history.push({ x: this.x, y: this.y, hp: this.hp });
      if (this.history.length > 30) this.history.shift();
    }

    // Input Handling
    const k = this.engine.keys;
    const t = this.engine.touchInputs;

    const moveLeft = k['ArrowLeft'] || k['KeyA'] || t.left;
    const moveRight = k['ArrowRight'] || k['KeyD'] || t.right;
    const jumpPressed = k['ArrowUp'] || k['KeyW'] || k['Space'] || t.jump;
    const attackPressed = k['KeyZ'] || t.attack;
    const magicPressed = k['KeyX'] || t.magic;
    const freezePressed = k['KeyC'] || t.freeze;
    const rewindPressed = k['KeyV'] || t.rewind;
    const interactPressed = k['KeyE'] || t.interact;

    // Interaction handling
    if (interactPressed && !this.prevInteractPressed) {
      if (this.engine.interactiveObjects) {
        for (const obj of this.engine.interactiveObjects) {
          if (obj.isNear(this)) {
            obj.interact(this.engine, this, this.engine.companion);
            break;
          }
        }
      }
    }
    this.prevInteractPressed = interactPressed;

    // Horizontal Movement
    if (moveLeft) {
      this.vx = -this.speed;
      this.facing = -1;
      this.state = 'RUN';
    } else if (moveRight) {
      this.vx = this.speed;
      this.facing = 1;
      this.state = 'RUN';
    } else {
      this.vx *= 0.8;
      this.state = 'IDLE';
    }

    // Jump / Double Jump
    if (jumpPressed && !this.prevJumpPressed) {
      if (this.isGrounded) {
        this.vy = -this.jumpForce;
        this.isGrounded = false;
        this.jumpsLeft = 1;
        this.engine.audio.playJump();
        this.engine.particles.spawnBurst(this.x + this.w / 2, this.y + this.h, '#00ff88', 6, 80);
      } else if (this.jumpsLeft > 0) {
        this.vy = -this.jumpForce * 0.9;
        this.jumpsLeft = 0;
        this.engine.audio.playJump();
        this.engine.particles.spawnBurst(this.x + this.w / 2, this.y + this.h, '#ffd200', 10, 100);
      }
    }
    this.prevJumpPressed = jumpPressed;

    if (!this.isGrounded) {
      this.state = 'JUMP';
    }

    // Combat: Melee Scepter Attack
    if (attackPressed && this.meleeCooldown <= 0) {
      this.attackTimer = this.attackDuration;
      this.meleeCooldown = 0.35;
      this.engine.audio.playAttack();
      this.engine.shakeScreen(4, 0.15);

      // Melee hitbox
      const slashX = this.facing === 1 ? this.x + this.w : this.x - 45;
      const slashY = this.y + 10;
      this.engine.particles.spawnShockwave(slashX + 22, slashY + 20, '#00ff88', 45, 0.2);

      if (this.onMeleeSlash) {
        this.onMeleeSlash({ x: slashX, y: slashY, w: 50, h: 40 });
      }
    }

    // Combat: Ranged Magic Bolt
    if (magicPressed && this.magicCooldown <= 0) {
      this.magicCooldown = this.magicCooldownMax;
      this.engine.audio.playMagic();
      const spawnX = this.facing === 1 ? this.x + this.w + 6 : this.x - 12;
      const spawnY = this.y + 22;

      this.projectiles.push({
        x: spawnX,
        y: spawnY,
        vx: this.facing * 520,
        radius: 7,
        life: 1.8,
        color: '#00ff88'
      });
      this.engine.particles.spawnMagicWisps(spawnX, spawnY, '#00ff88', 6);
    }

    // Temporal Power: Time Freeze
    if (freezePressed && this.freezeCooldown <= 0) {
      this.freezeCooldown = this.freezeCooldownMax;
      this.freezeActiveTimer = 3.0;
      this.engine.timeScale = 0.25; // 75% slowdown
      this.engine.audio.playTimeFreeze();
      this.engine.shakeScreen(8, 0.3);
      this.engine.particles.spawnComicText('TIME FREEZE!', this.x + this.w / 2, this.y - 20, '#00ff88');
      this.engine.particles.spawnShockwave(this.x + this.w / 2, this.y + this.h / 2, '#00ff88', 180, 0.5);
    }

    // Temporal Power: Rewind
    if (rewindPressed && this.rewindCooldown <= 0 && this.history.length > 5) {
      this.rewindCooldown = this.rewindCooldownMax;
      const target = this.history[0];
      this.engine.audio.playRewind();
      this.engine.shakeScreen(6, 0.25);
      this.engine.particles.spawnComicText('REWIND!', this.x + this.w / 2, this.y - 20, '#ffd200');
      this.x = target.x;
      this.y = target.y;
      this.vy = 0;
      this.hp = Math.min(this.maxHp, this.hp + 15);
      this.engine.particles.spawnBurst(this.x + this.w / 2, this.y + this.h / 2, '#ffd200', 16, 140);
    }

    // Apply Gravity & Physics
    this.vy += this.engine.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Platform Collisions
    this.isGrounded = false;
    for (const plat of this.engine.platforms) {
      if (
        this.x + this.w > plat.x &&
        this.x < plat.x + plat.w &&
        this.y + this.h >= plat.y &&
        this.y + this.h <= plat.y + 24 &&
        this.vy >= 0
      ) {
        this.y = plat.y - this.h;
        this.vy = 0;
        this.isGrounded = true;
        this.jumpsLeft = 2;
      }
    }

    // Level Boundary checks
    this.x = Math.max(0, Math.min(this.x, this.engine.levelWidth - this.w));

    // Bottom pit safety reset
    if (this.y > 620) {
      this.takeDamage(20);
      this.y = 200;
      this.vy = 0;
    }

    // Update magic projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.life -= dt;
      this.engine.particles.spawnParticle(p.x, p.y, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, '#00ff88', 2.5, 0.2);
      if (p.life <= 0 || p.x < 0 || p.x > this.engine.levelWidth) {
        this.projectiles.splice(i, 1);
      }
    }

    this.updateHUD();
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 0.8;
    this.engine.shakeScreen(8, 0.2);
    this.engine.audio.playHit();
    this.engine.particles.spawnBurst(this.x + this.w / 2, this.y + this.h / 2, '#ef4444', 12, 120);

    if (this.hp <= 0 && this.onDeath) {
      this.onDeath();
    }
  }

  updateHUD() {
    const healthFill = document.getElementById('playerHealthFill');
    if (healthFill) {
      const pct = (this.hp / this.maxHp) * 100;
      healthFill.style.width = `${pct}%`;
      if (pct < 30) healthFill.classList.add('low');
      else healthFill.classList.remove('low');
    }

    const freezeOverlay = document.getElementById('freezeCooldownOverlay');
    if (freezeOverlay) {
      const pct = Math.max(0, (this.freezeCooldown / this.freezeCooldownMax) * 100);
      freezeOverlay.style.height = `${pct}%`;
    }
  }

  render(ctx) {
    ctx.save();

    // Invulnerability flashing
    if (this.invulnerableTimer > 0 && Math.floor(this.animTime * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // 2.5D Drop Shadow under Loki
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.w / 2, this.y + this.h + 2, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const facingRight = this.facing === 1;

    // --- Dynamic Flowing Emerald Cape ---
    ctx.fillStyle = '#05542b';
    ctx.beginPath();
    const capeAnchorX = facingRight ? this.x + 8 : this.x + this.w - 8;
    const capeAnchorY = this.y + 18;
    const waveOffset = Math.sin(this.capeWave) * 10 - (this.vx * 0.05);

    ctx.moveTo(capeAnchorX, capeAnchorY);
    ctx.quadraticCurveTo(
      capeAnchorX - this.facing * (16 + waveOffset),
      this.y + 36,
      capeAnchorX - this.facing * (24 + waveOffset),
      this.y + this.h - 4
    );
    ctx.lineTo(capeAnchorX, this.y + this.h - 10);
    ctx.closePath();
    ctx.fill();

    // --- Body / Emerald TVA Coat ---
    ctx.fillStyle = '#0a7d43';
    ctx.fillRect(this.x + 8, this.y + 16, this.w - 16, 28);

    // Gold trim lapels
    ctx.fillStyle = '#ffd200';
    ctx.fillRect(this.x + 13, this.y + 16, 3, 22);
    ctx.fillRect(this.x + 18, this.y + 16, 3, 22);

    // Dark Trousers
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.x + 10, this.y + 44, 6, 14);
    ctx.fillRect(this.x + 18, this.y + 44, 6, 14);

    // Boots
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(this.x + 9, this.y + 54, 7, 4);
    ctx.fillRect(this.x + 18, this.y + 54, 7, 4);

    // Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(this.x + this.w / 2, this.y + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Iconic Curved Golden Horned Helmet
    ctx.strokeStyle = '#ffd200';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Left Horn
    ctx.moveTo(this.x + this.w / 2 - 4, this.y + 6);
    ctx.quadraticCurveTo(this.x - 10, this.y - 12, this.x - 6, this.y - 18);
    // Right Horn
    ctx.moveTo(this.x + this.w / 2 + 4, this.y + 6);
    ctx.quadraticCurveTo(this.x + this.w + 10, this.y - 12, this.x + this.w + 6, this.y - 18);
    ctx.stroke();

    // Scepter Staff
    const scepterX = facingRight ? this.x + this.w + 2 : this.x - 6;
    ctx.strokeStyle = '#ffd200';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(scepterX, this.y + 48);
    ctx.lineTo(scepterX, this.y + 8);
    ctx.stroke();

    // Scepter Glowing Emerald/Tesseract Crystal Tip
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(scepterX, this.y + 8, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Render Projectiles
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.LokiPlayer = LokiPlayer;
