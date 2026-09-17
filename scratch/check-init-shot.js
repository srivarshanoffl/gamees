const { spawn } = require('child_process');
const fs = require('fs');

async function checkInit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\scratch\\chrome-test-profile';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9228',
    `--user-data-dir=${profileDir}`,
    'http://localhost:8090/games/thor-hammer.html'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  try {
    const res = await fetch('http://localhost:9228/json');
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

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\thor_initial_page_load.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved thor_initial_page_load.png');

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

checkInit();
