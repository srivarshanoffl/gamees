/**
 * title.js — Controller for Page 1: "Loki: The Last Timeline"
 * Renders glowing timeline branches, the Chrono Forge distortion, and typewriter story.
 */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('titleCanvas');
  const ctx = canvas.getContext('2d');
  const storyTextEl = document.getElementById('storyText');
  const audioBtn = document.getElementById('audioToggleBtn');

  // Resize canvas to full window
  function resize() {
    canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }
  window.addEventListener('resize', resize);
  resize();

  // Audio button handler
  if (audioBtn && window.sound) {
    audioBtn.addEventListener('click', () => {
      window.sound.init();
      const muted = window.sound.toggleMute();
      audioBtn.innerText = muted ? '🔇 AUDIO: OFF' : '🔊 AUDIO: ON';
    });
  }

  // Typewriter story sequence
  const storyLines = [
    "As Guardian of the Multiverse, Loki discovers entire branches of reality are not being destroyed... they are being REWRITTEN.",
    "The green emblem of DOCTOR DOOM appears across every era. He has unearthed the ancient CHRONO FORGE.",
    "Four Nexus Cores are required to compress Past, Present, and Future into Doom's 'Perfect Timeline'.",
    "Doom cannot safely retrieve them himself. He knows Loki will try to save everyone... and bring each core directly to him.",
    "Step into the Nexus. Journey with Thor, Captain America, Iron Man, and Doctor Strange. Restore the timeline!"
  ];

  let currentLine = 0;
  let charIndex = 0;
  let isTyping = true;
  let waitTimer = 0;

  function updateStory(dt) {
    if (isTyping) {
      charIndex += dt * 38;
      const targetStr = storyLines[currentLine];
      if (charIndex >= targetStr.length) {
        charIndex = targetStr.length;
        isTyping = false;
        waitTimer = 3.5;
      }
      storyTextEl.innerHTML = targetStr.substring(0, Math.floor(charIndex));
    } else {
      waitTimer -= dt;
      if (waitTimer <= 0) {
        currentLine = (currentLine + 1) % storyLines.length;
        charIndex = 0;
        isTyping = true;
      }
    }
  }

  // Visuals: Timeline branches & particles
  const branches = [];
  const numBranches = 14;
  for (let i = 0; i < numBranches; i++) {
    branches.push({
      angle: (i / numBranches) * Math.PI * 2,
      length: 180 + Math.random() * 220,
      width: 2 + Math.random() * 3,
      speed: 0.2 + Math.random() * 0.4,
      hue: Math.random() > 0.4 ? 150 : 45, // Emerald green or Gold
      subBranches: Array.from({ length: 3 }, () => ({
        offsetAngle: (Math.random() - 0.5) * 0.8,
        length: 50 + Math.random() * 80
      }))
    });
  }

  const particles = [];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 20,
      vy: -15 - Math.random() * 25,
      r: 1.5 + Math.random() * 2.5,
      color: Math.random() > 0.5 ? '#10b981' : '#fbbf24',
      alpha: Math.random()
    });
  }

  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    updateStory(dt);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, w, h);

    // Cosmic Nebulas
    const t = now * 0.001;
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.6);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
    grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.08)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw central Yggdrasil trunk & timeline branches
    ctx.save();
    ctx.translate(cx, cy);

    for (let b of branches) {
      const curAngle = b.angle + Math.sin(t * b.speed) * 0.08;
      const endX = Math.cos(curAngle) * b.length;
      const endY = Math.sin(curAngle) * b.length;

      // Glow line
      ctx.strokeStyle = `hsla(${b.hue}, 85%, 60%, 0.35)`;
      ctx.lineWidth = b.width;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Sub-branches
      for (let sb of b.subBranches) {
        const sbAngle = curAngle + sb.offsetAngle;
        ctx.strokeStyle = `hsla(${b.hue}, 70%, 50%, 0.25)`;
        ctx.lineWidth = b.width * 0.6;
        ctx.beginPath();
        ctx.moveTo(endX * 0.6, endY * 0.6);
        ctx.lineTo(endX * 0.6 + Math.cos(sbAngle) * sb.length, endY * 0.6 + Math.sin(sbAngle) * sb.length);
        ctx.stroke();
      }

      // Leaf tip glow
      ctx.fillStyle = b.hue === 150 ? '#34d399' : '#fde047';
      ctx.beginPath();
      ctx.arc(endX, endY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Loki Core
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + Math.sin(t * 3) * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Floating particles
    for (let p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha += Math.sin(t * 2 + p.x) * 0.01;
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(0.8, p.alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
