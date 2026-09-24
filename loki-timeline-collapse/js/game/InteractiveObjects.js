/**
 * InteractiveObjects.js
 * Environmental interactive entities: Era Portals, Rewindable Bridges,
 * Storm Mechanisms, Shield Switches, Tech Terminals, and Nexus Core Pedestals.
 */

class InteractiveObject {
  constructor(config) {
    this.id = config.id || Math.random().toString(36).substr(2, 9);
    this.type = config.type; // 'portal', 'rewindable', 'storm_switch', 'shield_switch', 'terminal', 'pedestal', 'puzzle'
    this.x = config.x;
    this.y = config.y;
    this.width = config.width || 48;
    this.height = config.height || 64;
    this.activated = config.activated || false;
    this.label = config.label || '';
    this.targetEra = config.targetEra || null; // for portals
    this.memoryKey = config.memoryKey || null; // for temporal causality
    this.requiredCompanion = config.requiredCompanion || null;
    this.puzzleId = config.puzzleId || null;
    this.data = config.data || {};
  }

  isNear(player, radius = 70) {
    if (!player) return false;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    return Math.hypot(player.x - cx, player.y - cy) < radius;
  }

  interact(engine, player, companion) {
    if (this.activated && this.type !== 'portal') return false;

    // Check companion requirement
    if (this.requiredCompanion && (!companion || companion.type !== this.requiredCompanion)) {
      if (engine.dialogue) {
        const names = { thor: 'Thor', cap: 'Captain America', ironman: 'Iron Man', strange: 'Doctor Strange' };
        engine.dialogue.say({
          speaker: 'loki',
          text: `I need ${names[this.requiredCompanion] || 'my ally'} to activate this mechanism.`
        });
      }
      if (engine.audio) engine.audio.playPuzzleError();
      return false;
    }

    // Execute interaction based on type
    switch (this.type) {
      case 'portal':
        if (this.targetEra && engine.timeEra) {
          engine.timeEra.switchEra(this.targetEra);
          return true;
        }
        break;

      case 'rewindable':
        this.activated = true;
        if (this.memoryKey && engine.timeEra) {
          engine.timeEra.setMemory(this.memoryKey, true);
        }
        if (engine.audio) engine.audio.playRewind();
        if (engine.particles) {
          engine.particles.createSparkBurst(this.x + this.width / 2, this.y + this.height / 2, '#34d399', 25);
          engine.particles.showPopupText('RESTORED!', this.x, this.y - 20, '#34d399');
        }
        return true;

      case 'storm_switch':
        this.activated = true;
        if (this.memoryKey && engine.timeEra) {
          engine.timeEra.setMemory(this.memoryKey, true);
        }
        if (companion && companion.type === 'thor') {
          companion.executeAttack({ x: this.x + this.width / 2, y: this.y + this.height / 2, alive: false, takeDamage: () => {} });
        }
        if (engine.audio) engine.audio.playThorLightning();
        if (engine.particles) {
          engine.particles.createLightning(this.x + this.width / 2, this.y - 80, this.x + this.width / 2, this.y);
          engine.particles.showPopupText('OVERCHARGED!', this.x, this.y - 20, '#38bdf8');
        }
        return true;

      case 'shield_switch':
        this.activated = true;
        if (this.memoryKey && engine.timeEra) {
          engine.timeEra.setMemory(this.memoryKey, true);
        }
        if (companion && companion.type === 'cap') {
          companion.executeAttack({ x: this.x + this.width / 2, y: this.y + this.height / 2, alive: false, takeDamage: () => {} });
        }
        if (engine.audio) engine.audio.playCapShield();
        if (engine.particles) {
          engine.particles.showPopupText('UNLOCKED!', this.x, this.y - 20, '#ef4444');
        }
        return true;

      case 'terminal':
        this.activated = true;
        if (this.memoryKey && engine.timeEra) {
          engine.timeEra.setMemory(this.memoryKey, true);
        }
        if (companion && companion.type === 'ironman') {
          companion.executeAttack({ x: this.x + this.width / 2, y: this.y + this.height / 2, alive: false, takeDamage: () => {} });
        }
        if (engine.audio) engine.audio.playChime();
        if (engine.particles) {
          engine.particles.showPopupText('BYPASS COMPLETE!', this.x, this.y - 20, '#fbbf24');
        }
        return true;

      case 'puzzle':
        if (window.puzzleSystem) {
          window.puzzleSystem.open(this.puzzleId, () => {
            this.activated = true;
            if (this.memoryKey && engine.timeEra) {
              engine.timeEra.setMemory(this.memoryKey, true);
            }
          });
          return true;
        }
        break;

      case 'pedestal':
        this.activated = true;
        if (engine.audio) engine.audio.playCoreRecovered();
        if (engine.particles) {
          engine.particles.createSparkBurst(this.x + this.width / 2, this.y, '#10b981', 40);
          engine.particles.showPopupText('NEXUS CORE RETRIEVED!', this.x - 40, this.y - 40, '#34d399');
        }
        if (typeof this.data.onRecover === 'function') {
          this.data.onRecover();
        }
        return true;
    }

    return false;
  }

  update(dt, engine) {
    // If causality memory already marks this active, ensure state matches
    if (this.memoryKey && engine.timeEra && engine.timeEra.getMemory(this.memoryKey)) {
      this.activated = true;
    }
  }

  render(ctx, player) {
    const isPlayerNear = this.isNear(player);
    const t = Date.now() * 0.003;

    ctx.save();
    ctx.translate(this.x, this.y);

    switch (this.type) {
      case 'portal':
        this.renderPortal(ctx, t);
        break;
      case 'rewindable':
        this.renderRewindable(ctx, t);
        break;
      case 'storm_switch':
        this.renderStormSwitch(ctx, t);
        break;
      case 'shield_switch':
        this.renderShieldSwitch(ctx, t);
        break;
      case 'terminal':
        this.renderTerminal(ctx, t);
        break;
      case 'puzzle':
        this.renderPuzzleTerminal(ctx, t);
        break;
      case 'pedestal':
        this.renderPedestal(ctx, t);
        break;
      default:
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 0, this.width, this.height);
        break;
    }

    // Interactive prompt prompt [E]
    if (isPlayerNear && (!this.activated || this.type === 'portal')) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      
      const badgeY = -14 + Math.sin(t * 3) * 3;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(this.width / 2 - 32, badgeY - 14, 64, 18);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.width / 2 - 32, badgeY - 14, 64, 18);

      ctx.fillStyle = '#34d399';
      ctx.fillText(`[E] ${this.label || 'INTERACT'}`, this.width / 2, badgeY);
    }

    ctx.restore();
  }

  renderPortal(ctx, t) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const r = Math.min(this.width, this.height) / 2;

    const portalColors = {
      PAST: '#f59e0b',
      PRESENT: '#10b981',
      FUTURE: '#8b5cf6'
    };
    const c = portalColors[this.targetEra] || '#10b981';

    // Outer swirling vortex
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r + Math.sin(t * 4) * 4, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glowing core
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, c);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Floating rune icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏳', cx, cy);
  }

  renderRewindable(ctx, t) {
    if (this.activated) {
      // Intact bridge/conduit
      ctx.fillStyle = '#34d399';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, this.width, this.height);
    } else {
      // Broken/decayed structure
      ctx.fillStyle = 'rgba(75, 85, 99, 0.4)';
      ctx.fillRect(0, 0, this.width, this.height);
      
      // Flickering green rewind hologram
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + Math.sin(t * 5) * 0.3})`;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(0, 0, this.width, this.height);
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#10b981';
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', this.width / 2, this.height / 2 + 5);
    }
  }

  renderStormSwitch(ctx, t) {
    ctx.fillStyle = this.activated ? '#0284c7' : '#1e293b';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = this.activated ? '#38bdf8' : '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);

    ctx.fillStyle = this.activated ? '#e0f2fe' : '#94a3b8';
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', this.width / 2, this.height / 2 + 7);
  }

  renderShieldSwitch(ctx, t) {
    ctx.fillStyle = this.activated ? '#b91c1c' : '#1e293b';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = this.activated ? '#ef4444' : '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);

    ctx.fillStyle = this.activated ? '#fee2e2' : '#94a3b8';
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('⭐', this.width / 2, this.height / 2 + 6);
  }

  renderTerminal(ctx, t) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = this.activated ? '#fbbf24' : '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);

    // Screen
    ctx.fillStyle = this.activated ? '#22c55e' : '#f59e0b';
    ctx.fillRect(4, 4, this.width - 8, this.height / 2);
    ctx.fillStyle = '#000000';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.activated ? 'ONLINE' : 'LOCKED', this.width / 2, 16);
  }

  renderPuzzleTerminal(ctx, t) {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = this.activated ? '#10b981' : '#c084fc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);

    ctx.fillStyle = this.activated ? '#34d399' : '#e9d5ff';
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.activated ? '✓' : '?', this.width / 2, this.height / 2 + 7);
  }

  renderPedestal(ctx, t) {
    const cx = this.width / 2;
    // Stone base
    ctx.fillStyle = '#334155';
    ctx.fillRect(4, this.height - 24, this.width - 8, 24);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, this.height - 8, this.width, 8);

    if (!this.activated) {
      // Floating Nexus Core
      const coreY = this.height - 40 + Math.sin(t * 3) * 6;
      const grad = ctx.createRadialGradient(cx, coreY, 2, cx, coreY, 14);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#34d399');
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, coreY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Spinning diamond
      ctx.save();
      ctx.translate(cx, coreY);
      ctx.rotate(t * 2);
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();
    }
  }
}

window.InteractiveObject = InteractiveObject;
