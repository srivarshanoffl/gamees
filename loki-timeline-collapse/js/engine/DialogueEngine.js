/**
 * DialogueEngine.js
 * In-game story presentation, speech bubbles, and cinematic dialogue overlay
 * for "Loki: The Last Timeline".
 */
class DialogueEngine {
  constructor(engine) {
    this.engine = engine;
    this.queue = [];
    this.currentDialogue = null;
    this.displayedText = '';
    this.charIndex = 0;
    this.typeTimer = 0;
    this.typeSpeed = 0.025; // seconds per char
    this.isComplete = false;
    this.autoAdvanceTimer = 0;
    this.autoAdvanceDelay = 3.5; // seconds after complete before auto-advancing if not clicked
    
    // Character profiles
    this.speakers = {
      loki: {
        name: 'LOKI',
        title: 'God of Stories',
        color: '#10b981',
        textColor: '#e6fffa',
        bg: 'rgba(6, 26, 18, 0.95)',
        border: '#34d399',
        icon: '👑'
      },
      thor: {
        name: 'THOR',
        title: 'God of Thunder',
        color: '#38bdf8',
        textColor: '#f0f9ff',
        bg: 'rgba(12, 30, 48, 0.95)',
        border: '#0284c7',
        icon: '⚡'
      },
      cap: {
        name: 'CAPTAIN AMERICA',
        title: 'First Avenger',
        color: '#ef4444',
        textColor: '#fef2f2',
        bg: 'rgba(40, 16, 16, 0.95)',
        border: '#f87171',
        icon: '⭐'
      },
      ironman: {
        name: 'IRON MAN',
        title: 'Armored Avenger',
        color: '#f59e0b',
        textColor: '#fffbeb',
        bg: 'rgba(38, 24, 10, 0.95)',
        border: '#fbbf24',
        icon: '🤖'
      },
      strange: {
        name: 'DOCTOR STRANGE',
        title: 'Master of the Mystic Arts',
        color: '#ec4899',
        textColor: '#fdf2f8',
        bg: 'rgba(38, 12, 32, 0.95)',
        border: '#f472b6',
        icon: '👁️'
      },
      doom: {
        name: 'DOCTOR DOOM',
        title: 'Master of Latveria',
        color: '#22c55e',
        textColor: '#f0fdf4',
        bg: 'rgba(10, 28, 14, 0.96)',
        border: '#4ade80',
        icon: '🎭'
      },
      system: {
        name: 'CHRONO ALERT',
        title: 'Nexus System',
        color: '#a855f7',
        textColor: '#faf5ff',
        bg: 'rgba(28, 12, 42, 0.95)',
        border: '#c084fc',
        icon: '⏳'
      }
    };

    // DOM Container for accessibility and sharp typography
    this.createDomOverlay();
  }

  createDomOverlay() {
    let overlay = document.getElementById('dialogue-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'dialogue-overlay';
      overlay.className = 'dialogue-overlay hidden';
      overlay.innerHTML = `
        <div class="dialogue-box" id="dialogue-box">
          <div class="dialogue-header">
            <span class="dialogue-avatar" id="dialogue-avatar">👑</span>
            <div class="dialogue-meta">
              <span class="dialogue-name" id="dialogue-name">LOKI</span>
              <span class="dialogue-title" id="dialogue-title">God of Stories</span>
            </div>
          </div>
          <div class="dialogue-body" id="dialogue-text"></div>
          <div class="dialogue-footer">
            <span class="dialogue-hint">Press [E] or Click to Continue</span>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Click to advance
      overlay.addEventListener('click', () => this.advance());
      window.addEventListener('keydown', (e) => {
        if ((e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') && this.isActive()) {
          this.advance();
        }
      });
    }
    this.domOverlay = overlay;
    this.domBox = document.getElementById('dialogue-box');
    this.domAvatar = document.getElementById('dialogue-avatar');
    this.domName = document.getElementById('dialogue-name');
    this.domTitle = document.getElementById('dialogue-title');
    this.domText = document.getElementById('dialogue-text');
  }

  isActive() {
    return this.currentDialogue !== null;
  }

  /**
   * Queue one or multiple dialogue entries
   * entry: { speaker: 'loki'|'thor'|..., text: string, onComplete?: function }
   */
  say(entries) {
    if (!Array.isArray(entries)) entries = [entries];
    for (const item of entries) {
      this.queue.push(item);
    }
    if (!this.currentDialogue) {
      this.showNext();
    }
  }

  showNext() {
    if (this.queue.length === 0) {
      this.currentDialogue = null;
      if (this.domOverlay) {
        this.domOverlay.classList.add('hidden');
      }
      return;
    }

    this.currentDialogue = this.queue.shift();
    this.displayedText = '';
    this.charIndex = 0;
    this.typeTimer = 0;
    this.isComplete = false;
    this.autoAdvanceTimer = 0;

    const speakerInfo = this.speakers[this.currentDialogue.speaker] || this.speakers.system;
    
    if (this.domOverlay) {
      this.domOverlay.classList.remove('hidden');
      this.domBox.style.borderColor = speakerInfo.border;
      this.domAvatar.innerText = speakerInfo.icon;
      this.domAvatar.style.background = `rgba(${this.hexToRgb(speakerInfo.color)}, 0.2)`;
      this.domAvatar.style.borderColor = speakerInfo.color;
      this.domName.innerText = speakerInfo.name;
      this.domName.style.color = speakerInfo.color;
      this.domTitle.innerText = speakerInfo.title;
      this.domText.innerText = '';
    }

    if (this.engine && this.engine.audio) {
      this.engine.audio.playClick();
    }
  }

  hexToRgb(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  advance() {
    if (!this.currentDialogue) return;

    if (!this.isComplete) {
      // Instant reveal
      this.displayedText = this.currentDialogue.text;
      this.charIndex = this.currentDialogue.text.length;
      this.isComplete = true;
      if (this.domText) this.domText.innerText = this.displayedText;
    } else {
      if (typeof this.currentDialogue.onComplete === 'function') {
        this.currentDialogue.onComplete();
      }
      this.showNext();
    }
  }

  update(dt) {
    if (!this.currentDialogue) return;

    if (!this.isComplete) {
      this.typeTimer += dt;
      if (this.typeTimer >= this.typeSpeed) {
        this.typeTimer = 0;
        if (this.charIndex < this.currentDialogue.text.length) {
          this.charIndex++;
          this.displayedText = this.currentDialogue.text.substring(0, this.charIndex);
          if (this.domText) this.domText.innerText = this.displayedText;
          
          // Sound blip on occasional characters
          if (this.charIndex % 3 === 0 && this.engine && this.engine.audio) {
            this.engine.audio.playDialogueBeep(this.currentDialogue.speaker);
          }
        } else {
          this.isComplete = true;
        }
      }
    } else {
      this.autoAdvanceTimer += dt;
      if (this.autoAdvanceTimer >= this.autoAdvanceDelay) {
        this.advance();
      }
    }
  }

  render(ctx) {
    // If DOM overlay is active, canvas render is optional or adds speech pointers
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DialogueEngine;
}
