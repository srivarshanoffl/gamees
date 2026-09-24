/**
 * hub.js — Controller for Page 2: Nexus Core Hub
 * Tracks recovered Nexus Cores across dimensions and unlocks progressive gateways.
 */

window.addEventListener('DOMContentLoaded', () => {
  const audioBtn = document.getElementById('audioToggleBtn');
  if (audioBtn && window.sound) {
    audioBtn.addEventListener('click', () => {
      window.sound.init();
      const muted = window.sound.toggleMute();
      audioBtn.innerText = muted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
    });
  }

  // Load progress from localStorage
  const cores = {
    asgard: localStorage.getItem('loki_core_asgard') === 'true',
    cap: localStorage.getItem('loki_core_cap') === 'true',
    stark: localStorage.getItem('loki_core_stark') === 'true',
    mystic: localStorage.getItem('loki_core_mystic') === 'true'
  };

  let count = 0;
  for (let key in cores) {
    if (cores[key]) count++;
  }

  // Update Core count display
  const countEl = document.getElementById('coresCount');
  if (countEl) countEl.innerText = count;

  // Update Pills and Card Status
  for (let key of ['asgard', 'cap', 'stark', 'mystic']) {
    const pill = document.getElementById(`core-pill-${key}`);
    const status = document.getElementById(`status-${key}`);
    const btn = document.getElementById(`btn-${key}`);

    if (cores[key]) {
      if (pill) pill.classList.add('recovered');
      if (status) {
        status.innerText = 'CORE SECURED ✓';
        status.style.color = '#34d399';
      }
      if (btn) {
        btn.innerText = 'REPLAY MISSION ↺';
        btn.style.borderColor = '#10b981';
      }
    }
  }

  // Unlock Mystic Temple if at least 3 cores are retrieved
  const mysticCard = document.getElementById('card-mystic');
  const mysticStatus = document.getElementById('status-mystic');
  const mysticBtn = document.getElementById('btn-mystic');

  if (count >= 3) {
    if (mysticCard) mysticCard.classList.remove('locked');
    if (mysticStatus && !cores.mystic) {
      mysticStatus.innerText = 'TEMPLE UNSEALED!';
      mysticStatus.style.color = '#ec4899';
    }
    if (mysticBtn && !cores.mystic) {
      mysticBtn.innerText = 'ENTER TEMPLE ➔';
      mysticBtn.style.background = '#ec4899';
      mysticBtn.style.color = '#fff';
      mysticBtn.href = 'mystic.html';
    }
  }

  // If all 4 cores recovered, show Final Battle gateway to ending.html
  if (count === 4) {
    const finalPrompt = document.getElementById('finalBattlePrompt');
    if (finalPrompt) finalPrompt.style.display = 'block';
  }
});
