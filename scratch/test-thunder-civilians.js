const { spawn } = require('child_process');

async function test() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\scratch\\chrome-test-profile';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    `--user-data-dir=${profileDir}`,
    'http://localhost:8090/games/thor-hammer.html'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  try {
    const res = await fetch('http://localhost:9225/json');
    const tabs = await res.json();
    const gameTab = tabs.find(t => t.url.includes('thor-hammer.html'));
    console.log('Found game tab:', gameTab.title);

    const ws = new globalThis.WebSocket(gameTab.webSocketDebuggerUrl);
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
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', msg.params.exceptionDetails);
      }
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    await send('Runtime.enable');

    // Click "START MISSION" button
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("startMissionBtn").click()',
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 300));

    // 1. Verify Civilians on Level 1
    const civInfo = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        civCount: game.civilians.length,
        civ: game.civilians[0],
        hudCasualties: document.getElementById('hudCasualties').textContent,
        thunderBtnText: document.getElementById('thunderBtn').innerText
      })`,
      returnByValue: true
    });
    console.log('Initial setup check:', civInfo.result.value);

    // 2. Test Thunder Button Click
    console.log('Clicking Thunder Button...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('thunderBtn').click()`,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 100));

    const thunderCheck1 = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        thunderActiveTimer: game.thunderActiveTimer,
        thunderCooldown: game.thunderCooldown,
        btnDisabled: document.getElementById('thunderBtn').disabled
      })`,
      returnByValue: true
    });
    console.log('After Thunder Click:', thunderCheck1.result.value);

    // 3. Test Direct Hit on Civilian triggers casualty & Game Over
    console.log('Simulating Mjolnir collision with Civilian...');
    const casualtyResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Direct hammer position to civilian
          const civ = game.civilians[0];
          game.hammer.x = civ.x;
          game.hammer.y = civ.y;
          game.hammer.state = 'THROWN';
          game.checkCollisions(0.016);
          return JSON.stringify({
            state: game.state,
            casualties: game.civilianCasualties,
            gameOverOverlayHidden: document.getElementById('gameOverOverlay').classList.contains('hidden'),
            gameOverReason: document.getElementById('gameOverReason').textContent
          });
        })()
      `,
      returnByValue: true
    });
    console.log('Casualty check result:', casualtyResult.result.value);

    // 4. Test Reset & Clean Target Throw
    console.log('Testing level retry and clean target throw...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('retryMissionBtn').click();
        // Throw at target (720, 360)
        const t = game.targets[0];
        game.hammer.x = t.x;
        game.hammer.y = t.y;
        game.hammer.state = 'THROWN';
        game.checkCollisions(0.016);
      `,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 200));

    const winCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          game.hammer.state = 'IDLE';
          game.update(0.016);
          return JSON.stringify({
            state: game.state,
            targetsActive: game.targets.map(t => t.active),
            levelCompleteHidden: document.getElementById('levelCompleteOverlay').classList.contains('hidden')
          });
        })()
      `,
      returnByValue: true
    });
    console.log('Win check result:', winCheck.result.value);

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chrome.kill();
  }
}

test();
