const fs = require('fs');
const assert = require('assert');

const files = [
  'index.html',
  'games/deadpool.html',
  'games/doctor-strange.html',
  'games/scarlet-witch.html',
  'games/tva-loki.html',
  'games/thor-hammer.html'
];

files.forEach(f => {
  assert(fs.existsSync(f), 'Missing file: ' + f);
  const content = fs.readFileSync(f, 'utf8');
  assert(content.includes('id="gameCanvas"'), f + ' missing gameCanvas');
  assert(content.includes('SoundFX.js'), f + ' missing SoundFX');
  assert(content.includes('GameEngine.js'), f + ' missing GameEngine');
  console.log('✓ File integrity passed:', f);
});

// Verify Hub includes all 21 games in catalog
const hubJs = fs.readFileSync('js/hub.js', 'utf8');
const expectedGames = [
  'spiderman', 'captainamerica', 'ironman', 'thor', 'thorhammer', 'antman',
  'blackpanther', 'wolverine', 'hawkeye', 'groot',
  'doctorstrange', 'scarletwitch', 'tvaloki', 'watchernexus', 'deadpool',
  'chronobranch', 'temporalecho', 'canonstabilizer', 'incursionpoint',
  'heraldsexodus', 'beyondercore'
];

expectedGames.forEach(id => {
  assert(hubJs.includes(`id: '${id}'`), 'Hub missing catalog entry: ' + id);
});
console.log('✓ Hub catalog contains all 21 games!');

// Verify TROPHIES in Hub
assert(hubJs.includes('const TROPHIES = ['), 'Hub missing TROPHIES');
assert(hubJs.includes('triggerRandomMission'), 'Hub missing triggerRandomMission');
assert(hubJs.includes('openTrophiesModal'), 'Hub missing openTrophiesModal');
assert(hubJs.includes('searchQuery'), 'Hub missing searchQuery');
console.log('✓ Hub features (Search, Roulette, Trophies, BGM) verified!');

console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
