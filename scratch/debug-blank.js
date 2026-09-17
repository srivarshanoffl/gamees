const { spawn } = require('child_process');

async function debug() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = 'C:\\Users\\sriva\\.gemini\\antigravity-ide\\brain\\75af6724-6798-466b-8a13-c265ae076096\\scratch\\chrome-test-profile';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    `--user-data-dir=${profileDir}`,
    'http://localhost:8090/games/thor-hammer.html'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  try {
    const res = await fetch('http://localhost:9227/json');
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
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
      }
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');

    const evalResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return JSON.stringify({
            gameDefined: typeof game !== 'undefined',
            gameState: typeof game !== 'undefined' ? game.state : null,
            canvasWidth: document.getElementById('gameCanvas') ? document.getElementById('gameCanvas').width : null,
            canvasHeight: document.getElementById('gameCanvas') ? document.getElementById('gameCanvas').height : null,
            bodyChildren: Array.from(document.body.children).map(c => ({ tag: c.tagName, id: c.id, className: c.className })),
            readyOverlayClass: document.getElementById('readyOverlay') ? document.getElementById('readyOverlay').className : null,
            readyOverlayDisplay: document.getElementById('readyOverlay') ? window.getComputedStyle(document.getElementById('readyOverlay')).display : null
          });
        })()
      `,
      returnByValue: true
    });
    console.log('Page Diagnostic:', evalResult.result.value);

    ws.close();
  } catch (err) {
    console.error('Debug script error:', err);
  } finally {
    chrome.kill();
  }
}

debug();
