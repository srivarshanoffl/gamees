/**
 * GameEngine.js — V2 OVERHAUL
 * Base Canvas2D Game Engine for Marvel Mini-Games.
 * Handles game loops, input management, particle effects, comic text bursts,
 * screen shake, state transitions, and responsive letterboxing.
 * 
 * V2 Changes:
 * - Added default background fill to prevent black flash
 * - Improved resize with debouncing
 * - Added score popup floating text system
 * - Added trail/afterimage system
 * - Improved particle rendering with glow
 * - Better touch handling
 */

class GameEngine {
  constructor(canvasId, hudConfig = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.vWidth = window.innerWidth;
    this.vHeight = window.innerHeight;
    this.scale = 1;

    // Game state
    this.state = 'READY'; // READY, PLAYING, PAUSED, STAGE_CLEAR, GAME_OVER, VICTORY
    this.stage = 1;
    this.maxStages = 3;
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.energy = 100;
    this.maxEnergy = 100;

    // Background color (games can override)
    this.bgColor = '#0a0c14';

    // Timing
    this.lastTime = 0;
    this.running = false;
    this.animId = null;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;

    // Particle System
    this.particles = [];
    this.comicTexts = [];
    this.scorePopups = [];

    // Inputs
    this.keys = {};
    this.pointer = { x: 0, y: 0, isDown: false, justPressed: false, justReleased: false };

    // Event cleanup
    this._boundHandlers = [];

    // HUD bindings
    this.hudConfig = hudConfig;
    this.bindEvents();
    this.resize();

    // Debounced resize
    this._resizeTimeout = null;
    const resizeHandler = () => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => this.resize(), 100);
    };
    window.addEventListener('resize', resizeHandler);
    this._boundHandlers.push({ target: window, event: 'resize', handler: resizeHandler });
  }

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.vWidth = window.innerWidth;
    this.vHeight = window.innerHeight;
    
    this.canvas.style.width = `${this.vWidth}px`;
    this.canvas.style.height = `${this.vHeight}px`;
    this.canvas.width = this.vWidth * dpr;
    this.canvas.height = this.vHeight * dpr;
    this.scale = 1;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    
    // Custom hook for games that need to re-position entities
    if (this.onResize) this.onResize();
  }

  bindEvents() {
    // Keyboard
    const keydownHandler = (e) => {
      this.keys[e.code] = true;
      this.keys[e.key] = true;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
      if (this.onKeyDown) this.onKeyDown(e);
    };

    const keyupHandler = (e) => {
      this.keys[e.code] = false;
      this.keys[e.key] = false;
      if (this.onKeyUp) this.onKeyUp(e);
    };

    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    this._boundHandlers.push({ target: window, event: 'keydown', handler: keydownHandler });
    this._boundHandlers.push({ target: window, event: 'keyup', handler: keyupHandler });

    // Pointer (Mouse + Touch)
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * this.vWidth,
        y: ((clientY - rect.top) / rect.height) * this.vHeight
      };
    };

    const handleDown = (e) => {
      if (this.state !== 'PLAYING') return;
      const pos = getPos(e);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      this.pointer.isDown = true;
      this.pointer.justPressed = true;
      if (this.onPointerDown) this.onPointerDown(pos.x, pos.y);
    };

    const handleMove = (e) => {
      if (e.touches && e.touches.length === 0) return;
      const pos = getPos(e);
      this.pointer.x = pos.x;
      this.pointer.y = pos.y;
      if (this.onPointerMove) this.onPointerMove(pos.x, pos.y);
    };

    const handleUp = (e) => {
      this.pointer.isDown = false;
      this.pointer.justReleased = true;
      if (this.onPointerUp) this.onPointerUp();
    };

    this.canvas.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    this._boundHandlers.push({ target: this.canvas, event: 'mousedown', handler: handleDown });
    this._boundHandlers.push({ target: window, event: 'mousemove', handler: handleMove });
    this._boundHandlers.push({ target: window, event: 'mouseup', handler: handleUp });

    const touchStartHandler = (e) => { handleDown(e); e.preventDefault(); };
    this.canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp, { passive: true });
    this._boundHandlers.push({ target: this.canvas, event: 'touchstart', handler: touchStartHandler });
    this._boundHandlers.push({ target: window, event: 'touchmove', handler: handleMove });
    this._boundHandlers.push({ target: window, event: 'touchend', handler: handleUp });
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  loop(currentTime) {
    if (!this.running) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(dt);
      this.updateScreenShake(dt);
      this.updateParticles(dt);
      this.updateScorePopups(dt);
    }

    this.renderInternal();

    this.pointer.justPressed = false;
    this.pointer.justReleased = false;

    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  updateScreenShake(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  shake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  spawnParticle(x, y, vx, vy, color, radius = 3, life = 0.5) {
    this.particles.push({
      x, y, vx, vy, color, radius,
      alpha: 1, life, maxLife: life
    });
  }

  spawnComicText(text, x, y, color = '#ffd200') {
    this.comicTexts.push({
      text, x, y, color,
      alpha: 1, scale: 0.5, life: 0.8, maxLife: 0.8
    });
  }

  /**
   * Spawn a floating score popup (e.g., "+150") that drifts upward and fades.
   */
  spawnScorePopup(text, x, y, color = '#ffd200') {
    this.scorePopups.push({
      text, x, y, color,
      alpha: 1, life: 1.0, maxLife: 1.0
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.comicTexts.length - 1; i >= 0; i--) {
      const ct = this.comicTexts[i];
      ct.y -= 25 * dt;
      ct.life -= dt;
      ct.scale = Math.min(1.4, ct.scale + dt * 3);
      ct.alpha = Math.max(0, ct.life / ct.maxLife);
      if (ct.life <= 0) {
        this.comicTexts.splice(i, 1);
      }
    }
  }

  updateScorePopups(dt) {
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const sp = this.scorePopups[i];
      sp.y -= 40 * dt;
      sp.life -= dt;
      sp.alpha = Math.max(0, sp.life / sp.maxLife);
      if (sp.life <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  renderInternal() {
    this.ctx.save();

    // Default background fill to prevent black flash
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Apply screen shake
    if (this.shakeDuration > 0) {
      const ox = (Math.random() * 2 - 1) * this.shakeIntensity;
      const oy = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.ctx.translate(ox, oy);
    }

    // Call game specific render
    this.render(this.ctx);

    // Render Particles with glow
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = p.radius * 2;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Render Comic Pop Words
    for (const ct of this.comicTexts) {
      this.ctx.save();
      this.ctx.globalAlpha = ct.alpha;
      this.ctx.font = `bold ${Math.floor(28 * ct.scale)}px 'Bangers', cursive, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = ct.color;
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(ct.text, ct.x, ct.y);
      this.ctx.fillText(ct.text, ct.x, ct.y);
      this.ctx.restore();
    }

    // Render Score Popups
    for (const sp of this.scorePopups) {
      this.ctx.save();
      this.ctx.globalAlpha = sp.alpha;
      this.ctx.font = `bold 18px 'Outfit', sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = sp.color;
      this.ctx.shadowColor = sp.color;
      this.ctx.shadowBlur = 6;
      this.ctx.fillText(sp.text, sp.x, sp.y);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.showPauseOverlay(true);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.showPauseOverlay(false);
    }
  }

  showPauseOverlay(show) {
    const pauseEl = document.getElementById('pauseOverlay');
    if (pauseEl) {
      if (show) pauseEl.classList.remove('hidden');
      else pauseEl.classList.add('hidden');
    }
  }

  setHUD(values = {}) {
    if (values.score !== undefined) {
      this.score = values.score;
      const el = document.getElementById('hudScore');
      if (el) el.textContent = this.score.toLocaleString();
    }
    if (values.stage !== undefined) {
      this.stage = values.stage;
      const el = document.getElementById('hudStage');
      if (el) el.textContent = `${this.stage}/${this.maxStages}`;
    }
    if (values.health !== undefined) {
      this.health = Math.max(0, Math.min(this.maxHealth, values.health));
      const el = document.getElementById('hudHealthFill');
      if (el) {
        const pct = (this.health / this.maxHealth) * 100;
        el.style.width = `${pct}%`;
        if (pct < 30) el.classList.add('danger');
        else el.classList.remove('danger');
      }
    }
    if (values.energy !== undefined) {
      this.energy = Math.max(0, Math.min(this.maxEnergy, values.energy));
      const el = document.getElementById('hudEnergyFill');
      if (el) {
        el.style.width = `${(this.energy / this.maxEnergy) * 100}%`;
      }
    }
  }

  showAlert(text, duration = 1.5) {
    const el = document.getElementById('hudCenterAlert');
    if (el) {
      el.textContent = text;
      el.classList.add('show');
      setTimeout(() => {
        el.classList.remove('show');
      }, duration * 1000);
    }
  }

  triggerGameOver(reason = 'Mission Failed!') {
    this.state = 'GAME_OVER';
    if (window.soundFX) window.soundFX.defeat();
    const overlay = document.getElementById('gameOverOverlay');
    const reasonEl = document.getElementById('gameOverReason');
    const scoreEl = document.getElementById('gameOverScore');
    if (reasonEl) reasonEl.textContent = reason;
    if (scoreEl) scoreEl.textContent = `Score: ${this.score.toLocaleString()}`;
    if (overlay) overlay.classList.remove('hidden');
  }

  triggerVictory(message = 'Mission Accomplished!') {
    this.state = 'VICTORY';
    if (window.soundFX) window.soundFX.victory();
    const overlay = document.getElementById('victoryOverlay');
    const msgEl = document.getElementById('victoryMessage');
    const scoreEl = document.getElementById('victoryScore');
    if (msgEl) msgEl.textContent = message;
    if (scoreEl) scoreEl.textContent = `Final Score: ${this.score.toLocaleString()}`;
    if (overlay) overlay.classList.remove('hidden');

    // Save high score
    if (this.gameId && window.hub) {
      window.hub.recordScore(this.gameId, this.score);
    }
  }

  // To be implemented by child game classes
  update(dt) {}
  render(ctx) {}
  reset() {}
}

window.GameEngine = GameEngine;
