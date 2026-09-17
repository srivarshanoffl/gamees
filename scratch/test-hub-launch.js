const { spawn } = require('child_process');

async function testHubLaunch() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\scratch\\chrome-test-profile';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9231',
    `--user-data-dir=${profileDir}`,
    'http://localhost:8090/index.html'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  try {
    const res = await fetch('http://localhost:9231/json');
    const tabs = await res.json();
    const gameTab = tabs.find(t => t.url.includes('index.html'));

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

    console.log('Testing index.html launching Thor...');
    const resLaunch = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Find Thor card and launch
          const btn = document.querySelector('[data-game-id="thorhammer"]');
          if (btn) btn.click();
          return JSON.stringify({
            hasThorHammerGame: typeof window.ThorHammerGame !== 'undefined',
            activeGame: window.hub ? (window.hub.activeGame ? window.hub.activeGame.constructor.name : null) : null
          });
        })()
      `,
      returnByValue: true
    });
    console.log('Hub launch result:', resLaunch.result.value);

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
  }
}

testHubLaunch();
