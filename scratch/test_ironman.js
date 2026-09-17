const fs = require('fs');

const html = fs.readFileSync('games/iron-man.html', 'utf8');
const requiredIds = [
  'gameCanvas', 'ironManHealthFill', 'thanosHealthFill', 'unibeamMeterFill',
  'unibeamStatusText', 'hudScore', 'hudPhase', 'readyOverlay', 'victoryOverlay',
  'gameOverOverlay', 'btnActionRepulsor', 'btnActionPunch', 'btnActionUnibeam',
  'btnActionBlock', 'startMissionBtn', 'retryMissionBtn', 'victoryClaimBtn',
  'audioToggleBtn'
];

let missing = [];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error('Missing IDs in HTML:', missing);
  process.exit(1);
} else {
  console.log('PASS: All 18 required HTML IDs are present in games/iron-man.html!');
}

// Verify SoundFX methods required by iron-man.js
const soundCode = fs.readFileSync('js/engine/SoundFX.js', 'utf8');
const requiredSounds = ['repulsor', 'unibeam', 'heavyPunch', 'titanBlast', 'cosmicWave', 'warningBeep', 'blockDeflect', 'hit', 'victory', 'gameOver'];
let missingSounds = [];
for (const s of requiredSounds) {
  if (!soundCode.includes(`${s}(`)) {
    missingSounds.push(s);
  }
}

if (missingSounds.length > 0) {
  console.error('Missing sounds in SoundFX.js:', missingSounds);
  process.exit(1);
} else {
  console.log('PASS: All 10 required audio synthesis methods are present in SoundFX.js!');
}

// Verify IronManGame class definition
const gameCode = fs.readFileSync('js/games/iron-man.js', 'utf8');
if (!gameCode.includes('class IronManGame extends GameEngine')) {
  console.error('IronManGame class not defined!');
  process.exit(1);
} else {
  console.log('PASS: IronManGame class properly extends GameEngine!');
}

console.log('ALL VERIFICATION CHECKS PASSED!');
