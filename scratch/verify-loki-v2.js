/**
 * verify-loki-v2.js — Loki: The Last Timeline Deep Verification
 * Checks: syntax, method consistency, dimension configs, interactive object types
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'loki-timeline-collapse';
let errors = 0;
let passed = 0;

function check(condition, msg, failMsg) {
  if (condition) {
    console.log('✓', msg);
    passed++;
  } else {
    console.error('✗ FAIL:', failMsg || msg);
    errors++;
  }
}

// 1. Syntax check all JS files
const jsFiles = [
  'js/engine/AudioEngine.js',
  'js/engine/ParticleSystem.js',
  'js/engine/TimeEraManager.js',
  'js/engine/DialogueEngine.js',
  'js/engine/PlatformEngine.js',
  'js/game/LokiPlayer.js',
  'js/game/CompanionSystem.js',
  'js/game/InteractiveObjects.js',
  'js/game/PuzzleSystem.js',
  'js/game/EnemySystem.js',
  'js/game/BossFight.js',
  'js/game/DimensionConfigs.js',
  'js/missions.js',
  'js/mystic.js',
  'js/ending.js',
  'js/hub.js',
  'js/title.js'
];

console.log('--- SYNTAX CHECKS ---');
for (const f of jsFiles) {
  const fullPath = path.join(ROOT, f);
  try {
    const code = fs.readFileSync(fullPath, 'utf8');
    new Function(code); // syntax check
    check(true, `Syntax OK: ${f}`);
  } catch (e) {
    check(false, `Syntax ERROR: ${f}`, `${f}: ${e.message}`);
  }
}

// 2. Check DimensionConfigs has all 4 dimensions
console.log('\n--- DIMENSION CONFIG CHECKS ---');
const dimJs = fs.readFileSync(path.join(ROOT, 'js/game/DimensionConfigs.js'), 'utf8');
check(dimJs.includes("id: 'asgard'"), 'DimensionConfigs: asgard dimension present');
check(dimJs.includes("id: 'cap'"), 'DimensionConfigs: cap dimension present');
check(dimJs.includes("id: 'stark'"), 'DimensionConfigs: stark dimension present');
check(dimJs.includes("id: 'mystic'"), 'DimensionConfigs: mystic dimension present (was missing!)');
check(dimJs.includes("MIND CORE"), 'DimensionConfigs: mystic coreName MIND CORE defined');
check(dimJs.includes("companion: 'strange'"), 'DimensionConfigs: Strange is mystic companion');
check(dimJs.includes("mystic_guardian"), 'DimensionConfigs: mystic guardian boss defined');

// 3. Check LokiPlayer uses shakeScreen (not shake)
console.log('\n--- METHOD CONSISTENCY CHECKS ---');
const lokiJs = fs.readFileSync(path.join(ROOT, 'js/game/LokiPlayer.js'), 'utf8');
check(!lokiJs.includes('engine.shake('), 'LokiPlayer: no engine.shake() calls (all replaced)');
check(lokiJs.includes('engine.shakeScreen('), 'LokiPlayer: uses engine.shakeScreen() correctly');

// 4. Check ending.js uses InteractiveObject constructor
const endingJs = fs.readFileSync(path.join(ROOT, 'js/ending.js'), 'utf8');
check(endingJs.includes('new InteractiveObject('), 'ending.js: creates proper InteractiveObject instances');
check(!endingJs.includes("type: 'storm_switch',\n        x:"), 'ending.js: no raw object literals without InteractiveObject wrap');

// 5. Check mystic.js uses InteractiveObject constructor
const mysticJs = fs.readFileSync(path.join(ROOT, 'js/mystic.js'), 'utf8');
check(mysticJs.includes('new InteractiveObject('), 'mystic.js: creates proper InteractiveObject instances');
check(!mysticJs.includes("type: 'pedestal',\n        x:"), 'mystic.js: no raw object literals without InteractiveObject wrap');

// 6. Check TimeEraManager has correct shakeScreen argument order
const eraJs = fs.readFileSync(path.join(ROOT, 'js/engine/TimeEraManager.js'), 'utf8');
check(eraJs.includes('shakeScreen(8, 0.4)'), 'TimeEraManager: shakeScreen(8, 0.4) — correct arg order');
check(!eraJs.includes('shakeScreen(0.4, 8)'), 'TimeEraManager: old swapped args removed');

// 7. Check all 5 HTML pages exist with required scripts
console.log('\n--- HTML PAGE CHECKS ---');
const pages = ['index.html', 'hub.html', 'game.html', 'mystic.html', 'ending.html'];
for (const pg of pages) {
  const content = fs.readFileSync(path.join(ROOT, pg), 'utf8');
  check(fs.existsSync(path.join(ROOT, pg)), `Page exists: ${pg}`);
  check(content.includes('AudioEngine.js'), `${pg}: loads AudioEngine`);
}

// 8. Check mystic.html links to ending.html for the twist
const mysticHtml = fs.readFileSync(path.join(ROOT, 'mystic.html'), 'utf8');
check(mysticHtml.includes('ending.html'), 'mystic.html: has link to ending.html after Doom reveal');
check(mysticHtml.includes('twistCurtain'), 'mystic.html: twist curtain overlay present');

// 9. Hub.js checks progress tracking
const hubJs = fs.readFileSync(path.join(ROOT, 'js/hub.js'), 'utf8');
check(hubJs.includes("loki_core_asgard"), 'hub.js: tracks asgard core progress');
check(hubJs.includes("loki_core_cap"), 'hub.js: tracks cap core progress');
check(hubJs.includes("loki_core_stark"), 'hub.js: tracks stark core progress');
check(hubJs.includes("loki_core_mystic"), 'hub.js: tracks mystic core progress');
check(hubJs.includes('finalBattlePrompt'), 'hub.js: shows final battle prompt when all 4 cores collected');

// Summary
console.log(`\n============================================`);
console.log(`Results: ${passed} passed, ${errors} failed`);
if (errors === 0) {
  console.log('✅ ALL LOKI TIMELINE COLLAPSE CHECKS PASSED!');
} else {
  console.log(`❌ ${errors} issues found — please fix before shipping.`);
}
