const { spawn } = require('child_process');
const fs = require('fs');

async function testThrow() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\scratch\\chrome-test-profile';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    `--user-data-dir=${profileDir}`,
    'http://localhost:8090/games/thor-hammer.html'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  try {
    const res = await fetch('http://localhost:9229/json');
    const tabs = await res.json();
    const gameTab = tabs.find(t => t.url.includes('thor-hammer.html'));

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

    let errors = [];
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
        errors.push(msg.params.exceptionDetails);
      }
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');

    // Click START MISSION
    await send('Runtime.evaluate', { expression: 'document.getElementById("startMissionBtn").click()' });
    await new Promise(r => setTimeout(r, 200));

    // Throw hammer!
    console.log('Throwing hammer...');
    await send('Runtime.evaluate', {
      expression: `
        game.hammer.state = 'THROWN';
        game.hammer.vx = 800;
        game.hammer.vy = -100;
      `
    });

    // Let it fly and return
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      const state = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ hammerState: game.hammer.state, x: Math.round(game.hammer.x), y: Math.round(game.hammer.y), state: game.state })'
      });
      // console.log('Step', i, state.result.value);
    }

    console.log('Errors caught:', errors.length);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\thor_after_throw.png', Buffer.from(shot.data, 'base64'));

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

testThrow();
