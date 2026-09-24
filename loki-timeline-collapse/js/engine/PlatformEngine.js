/**
 * PlatformEngine.js — 2.5D Platformer Base Engine
 * Powers the 2.5D side-scrolling missions, time-shifting puzzles, and boss battles
 * in "Loki: The Last Timeline".
 */

class PlatformEngine {
  constructor(canvasId = 'gameCanvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.vWidth = 960;
    this.vHeight = 540;
    this.scale = 1;

    // Game state
    this.state = 'READY'; // READY, PLAYING, PAUSED, STAGE_CLEAR, GAME_OVER, VICTORY
    this.levelWidth = 3200; // virtual width of current level
    this.gravity = 1400; // px/s^2

    // Camera
    this.camera = { x: 0, y: 0, targetX: 0, lookAhead: 80 };

    // Effects
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.timeScale = 1.0; // Modified during time freeze

    // Systems
    this.particles = new ParticleSystem();
    this.audio = window.sound;
    this.timeEra = new TimeEraManager(this);
    this.dialogue = new DialogueEngine(this);

    // Input state
    this.keys = {};
    this.touchInputs = { 
      left: false, 
      right: false, 
      jump: false, 
      attack: false, 
      magic: false, 
      freeze: false,
      rewind: false,
      interact: false 
    };

    // Timing
    this.lastTime = 0;
    this.running = false;
    this.animId = null;

    // Environmental entities
    this.platforms = [];
    this.interactiveObjects = [];
    this.shards = [];
    this.bgLayers = [];
    this.companion = null;

    this.bindEvents();
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.vWidth * dpr;
    this.canvas.height = this.vHeight * dpr;
    this.scale = rect.width / this.vWidth;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.keys[e.key.toLowerCase()] = true;

      // Audio init on user gesture
      if (this.audio) this.audio.init();

      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mobile Virtual Touch Controller bindings
    this.bindTouchButton('touchLeft', 'left');
    this.bindTouchButton('touchRight', 'right');
    this.bindTouchButton('touchJump', 'jump');
    this.bindTouchButton('touchAttack', 'attack');
    this.bindTouchButton('touchMagic', 'magic');
    this.bindTouchButton('touchFreeze', 'freeze');
    this.bindTouchButton('touchRewind', 'rewind');
    this.bindTouchButton('touchInteract', 'interact');
  }

  bindTouchButton(elementId, actionKey) {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    const setAction = (state, e) => {
      e.preventDefault();
      if (this.audio) this.audio.init();
      this.touchInputs[actionKey] = state;
    };

    btn.addEventListener('touchstart', (e) => setAction(true, e), { passive: false });
    btn.addEventListener('touchend', (e) => setAction(false, e), { passive: false });
    btn.addEventListener('mousedown', (e) => setAction(true, e));
    btn.addEventListener('mouseup', (e) => setAction(false, e));
    btn.addEventListener('mouseleave', (e) => setAction(false, e));
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

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      const el = document.getElementById('pauseOverlay');
      if (el) el.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      const el = document.getElementById('pauseOverlay');
      if (el) el.classList.add('hidden');
    }
  }

  shakeScreen(intensity = 8, duration = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  updateScreenShake(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  loop(currentTime) {
    if (!this.running) return;

    const rawDt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    const dt = rawDt * this.timeScale;

    if (this.state === 'PLAYING') {
      this.update(dt);
      this.timeEra.update(rawDt);
      this.dialogue.update(rawDt);
      this.updateScreenShake(rawDt);
      this.particles.update(dt);
      this.updateCamera(dt);
    }

    this.renderInternal();
    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  updateCamera(dt) {
    if (!this.player) return;
    const target = this.player.x - this.vWidth * 0.35 + (this.player.facing === 1 ? this.camera.lookAhead : -this.camera.lookAhead);
    this.camera.targetX = Math.max(0, Math.min(target, this.levelWidth - this.vWidth));
    this.camera.x += (this.camera.targetX - this.camera.x) * (8 * dt);
  }

  renderInternal() {
    this.ctx.save();

    // 1. Base background
    const eraTheme = this.timeEra ? this.timeEra.getEraTheme() : { skyTop: '#05070c', skyBottom: '#10141f' };
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.vHeight);
    skyGrad.addColorStop(0, eraTheme.skyTop);
    skyGrad.addColorStop(1, eraTheme.skyBottom);
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // Apply Screen Shake
    if (this.shakeDuration > 0) {
      const ox = (Math.random() * 2 - 1) * this.shakeIntensity;
      const oy = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.ctx.translate(ox, oy);
    }

    // 2. Parallax background layers
    this.renderParallax(this.ctx);

    // 3. 2.5D World Layer (Camera translated)
    this.ctx.save();
    this.ctx.translate(-Math.floor(this.camera.x), 0);

    // Render Platforms
    this.renderPlatforms(this.ctx);

    // Game Specific Scene Render (Entities, Enemies, Player, Shards, Objects)
    this.renderWorld(this.ctx);

    this.ctx.restore();

    // 4. Render Particles (Handles its own camera translation)
    this.particles.render(this.ctx, Math.floor(this.camera.x));

    // 5. Era Post-Processing Overlay (Atmosphere, Scanlines, Portals)
    if (this.timeEra) {
      this.timeEra.renderEffects(this.ctx, this.vWidth, this.vHeight);
    }

    // 6. Time Freeze Tint
    if (this.timeScale < 1.0) {
      this.ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);
      this.ctx.strokeStyle = '#10b981';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(4, 4, this.vWidth - 8, this.vHeight - 8);
    }

    // 7. Dialogue In-Canvas Pass if needed
    if (this.dialogue) {
      this.dialogue.render(this.ctx);
    }

    this.ctx.restore();
  }

  renderParallax(ctx) {
    const camX = this.camera.x;
    for (const layer of this.bgLayers) {
      const offset = (camX * layer.speed) % this.vWidth;
      ctx.save();
      layer.draw(ctx, offset, this.vWidth, this.vHeight);
      ctx.restore();
    }
  }

  renderPlatforms(ctx) {
    for (const plat of this.platforms) {
      // 2.5D Platform Shadow plane
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(plat.x + 8, plat.y + plat.h, plat.w, 14);

      // 2.5D 3D-Extruded Platform Top & Front Face
      const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
      if (plat.type === 'asgard') {
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#78350f');
      } else if (plat.type === 'cap') {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#075985');
      } else if (plat.type === 'stark') {
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(1, '#7f1d1d');
      } else if (plat.type === 'mystic') {
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(1, '#831843');
      } else if (plat.type === 'doom') {
        grad.addColorStop(0, '#4ade80');
        grad.addColorStop(1, '#14532d');
      } else {
        grad.addColorStop(0, '#64748b');
        grad.addColorStop(1, '#1e293b');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

      // Glowing top rail
      ctx.fillStyle = plat.glowColor || 'rgba(16, 185, 129, 0.8)';
      ctx.fillRect(plat.x, plat.y, plat.w, 3);
    }
  }

  // To be implemented by child classes
  update(dt) {}
  renderWorld(ctx) {}
}

window.PlatformEngine = PlatformEngine;
