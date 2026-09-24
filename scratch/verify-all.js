const fs = require('fs');
const path = require('path');

console.log('--- MARVEL MINI-GAMES SUITE VERIFICATION ---');

// 1. Verify index.html scripts
const indexHtml = fs.readFileSync('index.html', 'utf8');
const hubGames = fs.readdirSync('js/games').filter(f => f.endsWith('.js'));
console.log(`Checking ${hubGames.length} game scripts in js/games...`);
let missingFromIndex = 0;
hubGames.forEach(f => {
  if (!indexHtml.includes(f)) {
    console.warn(`[WARN] ${f} is NOT included in index.html`);
    missingFromIndex++;
  }
});
if (missingFromIndex === 0) {
  console.log('✓ All js/games scripts included in index.html');
}

// 2. Verify all game HTML files in games/
const gameHtmlFiles = fs.readdirSync('games').filter(f => f.endsWith('.html'));
console.log(`Checking ${gameHtmlFiles.length} standalone game HTML files...`);
let htmlIssues = 0;
gameHtmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join('games', file), 'utf8');
  // Check canvas
  if (!content.includes('id="gameCanvas"')) {
    console.error(`[ERROR] ${file} is missing id="gameCanvas"`);
    htmlIssues++;
  }
  // Check script tags
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http')) continue;
    const resolved = path.resolve('games', src);
    if (!fs.existsSync(resolved)) {
      console.error(`[ERROR] ${file} references missing script: ${src} (resolved: ${resolved})`);
      htmlIssues++;
    }
  }
});

if (htmlIssues === 0) {
  console.log(`✓ All ${gameHtmlFiles.length} standalone game HTML files have valid canvas & script tags.`);
}

// 3. Verify loki-timeline-collapse
const lokiPages = ['index.html', 'hub.html', 'game.html', 'mystic.html', 'ending.html'];
let lokiIssues = 0;
lokiPages.forEach(p => {
  const target = path.join('loki-timeline-collapse', p);
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Missing loki saga page: ${p}`);
    lokiIssues++;
  } else {
    const content = fs.readFileSync(target, 'utf8');
    const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      const src = match[1];
      if (src.startsWith('http')) continue;
      const resolved = path.resolve('loki-timeline-collapse', src);
      if (!fs.existsSync(resolved)) {
        console.error(`[ERROR] ${p} references missing script: ${src}`);
        lokiIssues++;
      }
    }
  }
});
if (lokiIssues === 0) {
  console.log('✓ All loki-timeline-collapse saga pages and scripts verified.');
}

console.log('--- VERIFICATION SCRIPT FINISHED ---');
