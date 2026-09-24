/**
 * PuzzleSystem.js
 * Interactive modal puzzle engine for "Loki: The Last Timeline".
 * Supports:
 *  1. Rune/Symbol Match (Asgard)
 *  2. Component Assembly (Captain America 1940s)
 *  3. Quantum Frequency Alignment (Stark Future)
 *  4. Temporal Knot Matrix (Mystic Temple)
 */

class PuzzleSystem {
  constructor() {
    this.activePuzzle = null;
    this.onSolveCallback = null;
    this.createDomOverlay();
  }

  createDomOverlay() {
    let overlay = document.getElementById('puzzle-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'puzzle-modal';
      overlay.className = 'puzzle-modal hidden';
      overlay.innerHTML = `
        <div class="puzzle-card" id="puzzle-card">
          <div class="puzzle-header">
            <h3 id="puzzle-title">TEMPORAL MECHANISM</h3>
            <button class="puzzle-close" id="puzzle-close">✕</button>
          </div>
          <p class="puzzle-desc" id="puzzle-desc">Align the temporal components to restore flow.</p>
          <div class="puzzle-content" id="puzzle-content"></div>
          <div class="puzzle-footer">
            <span class="puzzle-hint" id="puzzle-hint">Hint: Look for clues in earlier eras.</span>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('puzzle-close').addEventListener('click', () => this.close());
    }
    this.overlay = overlay;
    this.titleEl = document.getElementById('puzzle-title');
    this.descEl = document.getElementById('puzzle-desc');
    this.contentEl = document.getElementById('puzzle-content');
    this.hintEl = document.getElementById('puzzle-hint');
  }

  isOpen() {
    return this.activePuzzle !== null;
  }

  open(puzzleType, onSolve) {
    this.activePuzzle = puzzleType;
    this.onSolveCallback = onSolve;
    this.overlay.classList.remove('hidden');

    switch (puzzleType) {
      case 'asgard_runes':
        this.renderRuneMatch();
        break;
      case 'cap_components':
        this.renderComponentAssembly();
        break;
      case 'stark_frequency':
        this.renderFrequencyAlign();
        break;
      case 'mystic_knot':
        this.renderMysticKnot();
        break;
      default:
        this.renderRuneMatch();
        break;
    }
  }

  close() {
    this.activePuzzle = null;
    this.overlay.classList.add('hidden');
    this.contentEl.innerHTML = '';
  }

  solve() {
    if (window.sound) window.sound.playPuzzleSuccess();
    const btn = document.createElement('div');
    btn.className = 'puzzle-success-banner';
    btn.innerHTML = '✨ MECHANISM ALIGNED & RESTORED!';
    this.contentEl.appendChild(btn);

    setTimeout(() => {
      if (typeof this.onSolveCallback === 'function') {
        this.onSolveCallback();
      }
      this.close();
    }, 1200);
  }

  // --- Puzzle 1: Asgard Rune Match ---
  renderRuneMatch() {
    this.titleEl.innerText = 'ASGARDIAN TEMPORAL RUNES';
    this.descEl.innerText = 'Select the three sacred runes in the order revealed in the Golden Age:';
    this.hintEl.innerText = 'Target sequence: ᚠ (Fehu / Wealth) → ᚦ (Thurisaz / Thunder) → ᛊ (Sowilo / Sun)';

    const runes = [
      { id: '1', symbol: 'ᚠ', name: 'Fehu' },
      { id: '2', symbol: 'ᚢ', name: 'Uruz' },
      { id: '3', symbol: 'ᚦ', name: 'Thurisaz' },
      { id: '4', symbol: 'ᚨ', name: 'Ansuz' },
      { id: '5', symbol: 'ᛊ', name: 'Sowilo' },
      { id: '6', symbol: 'ᛏ', name: 'Tiwaz' }
    ];

    const targetSeq = ['1', '3', '5'];
    let currentSeq = [];

    const container = document.createElement('div');
    container.className = 'rune-grid';

    runes.forEach(r => {
      const b = document.createElement('button');
      b.className = 'rune-btn';
      b.innerHTML = `<span class="rune-sym">${r.symbol}</span><span class="rune-name">${r.name}</span>`;
      b.onclick = () => {
        if (window.sound) window.sound.playClick();
        b.classList.add('active');
        currentSeq.push(r.id);

        if (currentSeq.length === targetSeq.length) {
          if (JSON.stringify(currentSeq) === JSON.stringify(targetSeq)) {
            this.solve();
          } else {
            if (window.sound) window.sound.playPuzzleError();
            b.classList.add('error');
            setTimeout(() => {
              currentSeq = [];
              container.querySelectorAll('.rune-btn').forEach(el => el.classList.remove('active', 'error'));
            }, 600);
          }
        }
      };
      container.appendChild(b);
    });

    this.contentEl.innerHTML = '';
    this.contentEl.appendChild(container);
  }

  // --- Puzzle 2: Cap 1940s Component Assembly ---
  renderComponentAssembly() {
    this.titleEl.innerText = '1940s SSR CHRONO REGULATOR';
    this.descEl.innerText = 'Assemble the 3 temporal components in the correct schematic slots:';
    this.hintEl.innerText = 'Slot 1: Gyro Matrix → Slot 2: Chrono Coil → Slot 3: Sub-Quantum Diode';

    const parts = [
      { id: 'c1', name: 'Chrono Coil', icon: '🌀' },
      { id: 'c2', name: 'Sub-Quantum Diode', icon: '💎' },
      { id: 'c3', name: 'Gyro Matrix', icon: '⚙️' }
    ];

    let installed = { slot1: null, slot2: null, slot3: null };
    const container = document.createElement('div');
    container.className = 'assembly-container';

    container.innerHTML = `
      <div class="slots-row">
        <div class="assembly-slot" data-slot="slot1"><span>[Slot 1]</span><div class="slot-target">Empty</div></div>
        <div class="assembly-slot" data-slot="slot2"><span>[Slot 2]</span><div class="slot-target">Empty</div></div>
        <div class="assembly-slot" data-slot="slot3"><span>[Slot 3]</span><div class="slot-target">Empty</div></div>
      </div>
      <div class="parts-palette" id="parts-row"></div>
    `;

    const partsRow = container.querySelector('#parts-row');
    parts.forEach(p => {
      const pBtn = document.createElement('button');
      pBtn.className = 'part-btn';
      pBtn.innerHTML = `<span>${p.icon}</span> <span>${p.name}</span>`;
      pBtn.onclick = () => {
        if (window.sound) window.sound.playClick();
        // find first empty slot
        for (let s of ['slot1', 'slot2', 'slot3']) {
          if (!installed[s]) {
            installed[s] = p.id;
            pBtn.style.display = 'none';
            const target = container.querySelector(`[data-slot="${s}"] .slot-target`);
            target.innerHTML = `${p.icon} ${p.name}`;
            target.classList.add('filled');
            break;
          }
        }

        // Check if all filled
        if (installed.slot1 && installed.slot2 && installed.slot3) {
          if (installed.slot1 === 'c3' && installed.slot2 === 'c1' && installed.slot3 === 'c2') {
            this.solve();
          } else {
            if (window.sound) window.sound.playPuzzleError();
            setTimeout(() => {
              installed = { slot1: null, slot2: null, slot3: null };
              container.querySelectorAll('.slot-target').forEach(el => {
                el.innerHTML = 'Empty';
                el.classList.remove('filled');
              });
              container.querySelectorAll('.part-btn').forEach(el => el.style.display = 'flex');
            }, 800);
          }
        }
      };
      partsRow.appendChild(pBtn);
    });

    this.contentEl.innerHTML = '';
    this.contentEl.appendChild(container);
  }

  // --- Puzzle 3: Stark Quantum Frequency ---
  renderFrequencyAlign() {
    this.titleEl.innerText = 'STARK ARC SECURITY OVERRIDE';
    this.descEl.innerText = 'Tune the 3 harmonic sliders until all waveforms sync to 100%:';
    this.hintEl.innerText = 'Align values close to: 45Hz / 80Hz / 120Hz';

    const container = document.createElement('div');
    container.className = 'frequency-container';

    container.innerHTML = `
      <div class="slider-group">
        <label>ALPHA WAVE: <span id="v1">10</span> Hz</label>
        <input type="range" id="sl1" min="0" max="150" value="10">
      </div>
      <div class="slider-group">
        <label>BETA WAVE: <span id="v2">20</span> Hz</label>
        <input type="range" id="sl2" min="0" max="150" value="20">
      </div>
      <div class="slider-group">
        <label>GAMMA WAVE: <span id="v3">30</span> Hz</label>
        <input type="range" id="sl3" min="0" max="150" value="30">
      </div>
      <div class="sync-meter-bar">
        <div class="sync-meter-fill" id="sync-fill" style="width: 20%;">20% SYNC</div>
      </div>
    `;

    const sl1 = container.querySelector('#sl1');
    const sl2 = container.querySelector('#sl2');
    const sl3 = container.querySelector('#sl3');
    const v1 = container.querySelector('#v1');
    const v2 = container.querySelector('#v2');
    const v3 = container.querySelector('#v3');
    const fill = container.querySelector('#sync-fill');

    const check = () => {
      v1.innerText = sl1.value;
      v2.innerText = sl2.value;
      v3.innerText = sl3.value;

      const d1 = Math.abs(sl1.value - 45);
      const d2 = Math.abs(sl2.value - 80);
      const d3 = Math.abs(sl3.value - 120);
      const totalDiff = d1 + d2 + d3;
      const score = Math.max(0, Math.min(100, Math.floor(100 - (totalDiff * 1.5))));

      fill.style.width = `${score}%`;
      fill.innerText = `${score}% SYNC`;

      if (score >= 95) {
        fill.style.background = '#10b981';
        this.solve();
      }
    };

    sl1.oninput = check;
    sl2.oninput = check;
    sl3.oninput = check;

    this.contentEl.innerHTML = '';
    this.contentEl.appendChild(container);
  }

  // --- Puzzle 4: Mystic Knot Loop ---
  renderMysticKnot() {
    this.titleEl.innerText = 'EYE OF AGAMOTTO: TEMPORAL LOOP';
    this.descEl.innerText = 'Unwind the infinite temporal loop: Click nodes in cycle sequence.';
    this.hintEl.innerText = 'Past (Gold) → Present (Green) → Future (Violet) → Nexus (White)';

    const nodes = [
      { id: 'past', label: 'PAST', color: '#f59e0b' },
      { id: 'pres', label: 'PRESENT', color: '#10b981' },
      { id: 'fut', label: 'FUTURE', color: '#8b5cf6' },
      { id: 'nex', label: 'NEXUS', color: '#ffffff' }
    ];

    let step = 0;
    const container = document.createElement('div');
    container.className = 'mystic-knot-container';

    nodes.forEach((n, idx) => {
      const btn = document.createElement('button');
      btn.className = 'mystic-node-btn';
      btn.style.borderColor = n.color;
      btn.style.color = n.color;
      btn.innerText = n.label;
      btn.onclick = () => {
        if (window.sound) window.sound.playClick();
        if (idx === step) {
          btn.classList.add('activated');
          step++;
          if (step === nodes.length) {
            this.solve();
          }
        } else {
          if (window.sound) window.sound.playPuzzleError();
          step = 0;
          container.querySelectorAll('.mystic-node-btn').forEach(el => el.classList.remove('activated'));
        }
      };
      container.appendChild(btn);
    });

    this.contentEl.innerHTML = '';
    this.contentEl.appendChild(container);
  }
}

window.puzzleSystem = new PuzzleSystem();
