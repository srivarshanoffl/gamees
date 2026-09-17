// Setup full mock DOM
const canvas = {
  getContext: () => {
    const grad = { addColorStop: () => {} };
    const ctx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      rect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fill: () => {},
      stroke: () => {},
      fillText: () => {},
      strokeText: () => {},
      createLinearGradient: () => grad,
      setTransform: () => {},
      roundRect: undefined // test fallback!
    };
    return ctx;
  },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
  addEventListener: () => {},
  width: 960,
  height: 540
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  devicePixelRatio: 1,
  soundFX: {
    init: () => {},
    toggleMute: () => false,
    repulsor: () => {},
    unibeam: () => {},
    heavyPunch: () => {},
    titanBlast: () => {},
    cosmicWave: () => {},
    warningBeep: () => {},
    blockDeflect: () => {},
    hit: () => {},
    victory: () => {},
    gameOver: () => {}
  }
};

global.document = {
  getElementById: (id) => {
    if (id === 'gameCanvas') return canvas;
    return {
      style: {},
      classList: { add: () => {}, remove: () => {} },
      addEventListener: () => {},
      querySelector: () => ({ style: {} })
    };
  },
  addEventListener: () => {}
};

// Evaluate GameEngine.js
const fs = require('fs');
eval(fs.readFileSync('js/engine/GameEngine.js', 'utf8'));
global.GameEngine = window.GameEngine;

// Evaluate iron-man.js
eval(fs.readFileSync('js/games/iron-man.js', 'utf8'));
global.IronManGame = window.IronManGame;

console.log('Evaluating game instance...');
const game = new IronManGame();
console.log('IronManGame instantiated! Testing methods...');
console.log('Does render method exist?', typeof game.render);
console.log('Does draw method exist?', typeof game.draw);

if (typeof game.render !== 'function') {
  console.error('ERROR: game.render is NOT a function! GameEngine requires render(ctx)!');
} else {
  console.log('PASS: game.render exists!');
}
