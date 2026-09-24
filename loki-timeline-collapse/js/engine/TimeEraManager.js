/**
 * TimeEraManager.js
 * Manages the Past, Present, and Future eras for "Loki: The Last Timeline".
 * Handles temporal state, object causality (Past actions affecting Present/Future),
 * era transitions, visual filters, and temporal clues.
 */
class TimeEraManager {
  constructor(engine, options = {}) {
    this.engine = engine;
    this.eras = ['PAST', 'PRESENT', 'FUTURE'];
    this.currentEra = options.initialEra || 'PAST';
    
    // Causality memory: { [key: string]: boolean | any }
    // e.g., 'asgard_conduit_fixed_past': true -> enables present power
    this.temporalMemory = {};
    
    // Observation clues: clues discovered in one era that can be used in another
    this.discoveredClues = new Set();
    
    // Transition effect state
    this.transitioning = false;
    this.transitionProgress = 0; // 0 -> 1
    this.transitionDuration = 0.8; // seconds
    this.targetEra = null;
    this.onEraChangeCallback = options.onEraChange || null;
    
    // Era visual themes
    this.eraThemes = {
      PAST: {
        name: 'THE PAST',
        color: '#f59e0b', // Amber/gold
        accent: '#fbbf24',
        skyTop: '#1e160a',
        skyBottom: '#3d2b0f',
        ambientAlpha: 0.12,
        ambientColor: '245, 158, 11',
        description: 'Golden age of memory and ancient architecture.'
      },
      PRESENT: {
        name: 'THE PRESENT',
        color: '#10b981', // Emerald / Loki Green
        accent: '#34d399',
        skyTop: '#061a12',
        skyBottom: '#0e3a29',
        ambientAlpha: 0.08,
        ambientColor: '16, 185, 129',
        description: 'Active battleground under temporal distortion.'
      },
      FUTURE: {
        name: 'THE FUTURE',
        color: '#8b5cf6', // Violet / Dystopian Doom
        accent: '#c084fc',
        skyTop: '#180728',
        skyBottom: '#32104d',
        ambientAlpha: 0.15,
        ambientColor: '139, 92, 246',
        description: 'A timeline compressed under Doctor Doom’s control.'
      }
    };
  }

  getCurrentEra() {
    return this.currentEra;
  }

  getEraTheme(era = this.currentEra) {
    return this.eraThemes[era] || this.eraThemes.PRESENT;
  }

  setMemory(key, value) {
    this.temporalMemory[key] = value;
    if (this.engine && this.engine.particles) {
      this.engine.particles.showPopupText("TIMELINE SHIFTED", 480, 200, '#34d399');
    }
  }

  getMemory(key, defaultValue = false) {
    return this.temporalMemory[key] !== undefined ? this.temporalMemory[key] : defaultValue;
  }

  discoverClue(clueId, clueName) {
    if (!this.discoveredClues.has(clueId)) {
      this.discoveredClues.add(clueId);
      if (this.engine && this.engine.audio) {
        this.engine.audio.playChime();
      }
      if (this.engine && this.engine.particles) {
        this.engine.particles.showPopupText(`CLUE FOUND: ${clueName}`, 480, 160, '#fbbf24');
      }
      return true;
    }
    return false;
  }

  hasClue(clueId) {
    return this.discoveredClues.has(clueId);
  }

  /**
   * Switches to another era with transition VFX and audio
   */
  switchEra(targetEra, force = false) {
    if (!this.eras.includes(targetEra)) return false;
    if (this.currentEra === targetEra && !force) return false;
    if (this.transitioning) return false;

    this.targetEra = targetEra;
    this.transitioning = true;
    this.transitionProgress = 0;

    if (this.engine) {
      if (this.engine.audio) {
        this.engine.audio.playEraShift();
      }
      if (this.engine.shakeScreen) {
        this.engine.shakeScreen(8, 0.4);
      }
    }

    return true;
  }

  update(dt) {
    if (this.transitioning) {
      this.transitionProgress += dt / this.transitionDuration;
      
      // Halfway through: actually switch data
      if (this.transitionProgress >= 0.5 && this.currentEra !== this.targetEra) {
        this.currentEra = this.targetEra;
        if (this.onEraChangeCallback) {
          this.onEraChangeCallback(this.currentEra);
        }
      }

      if (this.transitionProgress >= 1.0) {
        this.transitioning = false;
        this.transitionProgress = 0;
        this.targetEra = null;
      }
    }
  }

  /**
   * Renders era transition effects and ambient tint onto the game canvas
   */
  renderEffects(ctx, width, height) {
    const theme = this.getEraTheme();

    // 1. Subtle ambient era atmosphere
    ctx.save();
    ctx.fillStyle = `rgba(${theme.ambientColor}, ${theme.ambientAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // 2. Scanline / temporal distortion overlay
    const t = Date.now() * 0.003;
    ctx.strokeStyle = `rgba(${theme.ambientColor}, 0.04)`;
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 6) {
      const offsetX = Math.sin(t + y * 0.05) * 2;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(width + offsetX, y);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Era Transition Portal Tear
    if (this.transitioning) {
      ctx.save();
      const p = this.transitionProgress;
      // Portal expansion then contraction
      const factor = p < 0.5 ? p * 2 : (1 - p) * 2;
      
      // Whiteout / chromatic flash
      ctx.fillStyle = `rgba(255, 255, 255, ${factor * 0.75})`;
      ctx.fillRect(0, 0, width, height);

      // Rift in center
      const cx = width / 2;
      const cy = height / 2;
      const r = factor * Math.max(width, height) * 0.8;
      
      const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.3, theme.accent);
      grad.addColorStop(0.7, theme.color);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Temporal rune text in center
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = theme.color;
      ctx.shadowBlur = 15;
      ctx.fillText(`ENTERING ${this.targetEra || this.currentEra}`, cx, cy);
      ctx.restore();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimeEraManager;
}
