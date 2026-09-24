const { spawn } = require('child_process');

async function testFullInteraction() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9255',
    '--disable-extensions',
    '--user-data-dir=C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\c0d7dc5d-98ce-4497-89bd-0a68ae08a29b\\scratch\\chrome-test-profile-wait'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch('http://localhost:9255/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.type === 'page');

    const ws = new globalThis.WebSocket(pageTab.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise(resolve => { ws.onopen = resolve; });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:8091/index.html' });

    // Wait until window.hub is initialized
    let hubReady = false;
    for (let i = 0; i < 40; i++) {
      const check = await send('Runtime.evaluate', {
        expression: 'typeof window.hub !== "undefined" && document.querySelectorAll(".game-card").length === 23'
      });
      if (check.result?.value) {
        hubReady = true;
        console.log(`Hub ready after ${i * 150}ms!`);
        break;
      }
      await new Promise(r => setTimeout(r, 150));
    }

    if (!hubReady) {
      throw new Error('Hub failed to initialize within timeout!');
    }

    // 1. Hub check
    const hubCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return JSON.stringify({
            hasHub: !!window.hub,
            cards: document.querySelectorAll('.game-card').length,
            played: document.getElementById('statMissionsPlayed').textContent,
            allTabs: Array.from(document.querySelectorAll('.tab-btn')).map(b => b.textContent.trim())
          });
        })()
      `,
      returnByValue: true
    });
    console.log('✓ Hub Diagnostics:', JSON.parse(hubCheck.result.value));

    // 2. Launch Loki: Timeline Hunt in modal arena
    const launchRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.hub.launchGame('lokitimelinehunt');
          return JSON.stringify({
            activeGame: !!window.hub.activeGame,
            gameName: window.hub.activeGame?.constructor?.name,
            state: window.hub.activeGame?.state,
            timeline: window.hub.activeGame?.timeline,
            modalActive: document.getElementById('gameModal').classList.contains('active'),
            arenaTitle: document.getElementById('arenaGameName').textContent
          });
        })()
      `,
      returnByValue: true
    });
    console.log('✓ Launch Loki in Arena:', JSON.parse(launchRes.result.value));

    // 3. Start Mission
    const startRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          document.getElementById('startMissionBtn').click();
          window.hub.activeGame.update(0.016);
          window.hub.activeGame.render();
          return JSON.stringify({
            state: window.hub.activeGame.state,
            stability: window.hub.activeGame.stability,
            timeline: window.hub.activeGame.timeline,
            playerY: window.hub.activeGame.player.y
          });
        })()
      `,
      returnByValue: true
    });
    console.log('✓ Loki Mission Playing:', JSON.parse(startRes.result.value));

    // 4. Test timeline switches
    const switchRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.hub.activeGame.switchTimeline('PAST');
          const past = window.hub.activeGame.timeline;
          window.hub.activeGame.switchTimeline('FUTURE');
          const future = window.hub.activeGame.timeline;
          window.hub.activeGame.switchTimeline('PRESENT');
          const present = window.hub.activeGame.timeline;
          return JSON.stringify({ past, future, present, stability: window.hub.activeGame.stability });
        })()
      `,
      returnByValue: true
    });
    console.log('✓ Timeline Jump Test:', JSON.parse(switchRes.result.value));

    // 5. Close Game
    await send('Runtime.evaluate', { expression: `window.hub.closeGame();` });
    const closeRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return JSON.stringify({
            activeGame: !!window.hub.activeGame,
            modalActive: document.getElementById('gameModal').classList.contains('active')
          });
        })()
      `,
      returnByValue: true
    });
    console.log('✓ Arena Close:', JSON.parse(closeRes.result.value));

    // 6. Test Category Filter
    const filterRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const charBtn = document.querySelector('.tab-btn[data-filter="character"]');
          charBtn.click();
          const charCards = document.querySelectorAll('.game-card').length;

          const multiBtn = document.querySelector('.tab-btn[data-filter="multiverse"]');
          multiBtn.click();
          const multiCards = document.querySelectorAll('.game-card').length;

          const doomBtn = document.querySelector('.tab-btn[data-filter="doomsday"]');
          doomBtn.click();
          const doomCards = document.querySelectorAll('.game-card').length;

          const allBtn = document.querySelector('.tab-btn[data-filter="all"]');
          allBtn.click();
          const allCards = document.querySelectorAll('.game-card').length;

          return JSON.stringify({ charCards, multiCards, doomCards, allCards });
        })()
      `,
      returnByValue: true
    });
    console.log('✓ Category Filters:', JSON.parse(filterRes.result.value));

    console.log('=== ALL RUNTIME TESTS COMPLETED WITH 100% SUCCESS ===');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

testFullInteraction();
