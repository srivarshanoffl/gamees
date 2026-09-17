const { spawn } = require('child_process');
const fs = require('fs');

async function capture() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\scratch\\chrome-test-profile';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${profileDir}`,
    'http://localhost:8090/games/thor-hammer.html'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  try {
    const res = await fetch('http://localhost:9226/json');
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

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');

    // Click "START MISSION"
    await send('Runtime.evaluate', { expression: 'document.getElementById("startMissionBtn").click()' });
    await new Promise(r => setTimeout(r, 400));

    // 1. Capture screenshot in dark mode BEFORE thunder (civilians MUST be invisible!)
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\thor_dark_before_thunder.png', Buffer.from(shot1.data, 'base64'));

    // 2. Trigger Thunder button!
    await send('Runtime.evaluate', { expression: 'document.getElementById("thunderBtn").click()' });
    await new Promise(r => setTimeout(r, 250));

    // Capture screenshot during Thunder Flash illumination (civilians revealed!)
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\thor_during_thunder_revealed.png', Buffer.from(shot2.data, 'base64'));

    // 3. Wait for thunder effect to finish (2.5 seconds)
    console.log('Waiting for thunder effect to expire...');
    await new Promise(r => setTimeout(r, 2600));

    const checkTimer = await send('Runtime.evaluate', { expression: 'game.thunderActiveTimer' });
    console.log('Thunder active timer after expiry:', checkTimer.result.value);

    // Capture screenshot AFTER thunder effect (civilians MUST be invisible again!)
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\thor_dark_after_thunder_invisible.png', Buffer.from(shot3.data, 'base64'));

    console.log('All 3 screenshots saved successfully.');
    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

capture();
