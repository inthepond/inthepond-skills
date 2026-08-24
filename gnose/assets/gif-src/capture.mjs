// node capture.mjs <html-path> <out-dir> <fps> <durationMs>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const [,, htmlPath, outDir, fpsArg, durArg] = process.argv;
const fps = Number(fpsArg), dur = Number(durArg), port = 9333;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = path.join(outDir, '..', 'profile-cdp');
fs.mkdirSync(outDir, { recursive: true });
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check',
  '--disable-extensions','--disable-background-networking',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,
  '--window-size=960,540','--force-device-scale-factor=1','about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(url, tries = 100) { for (let i = 0; i < tries; i++) { try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {} await sleep(150); } throw new Error('chrome did not come up'); }
try {
  const targets = await waitFor(`http://127.0.0.1:${port}/json`);
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) events.push(m); };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'file://' + path.resolve(htmlPath) + '?t=0' });
  // wait for load + fonts
  for (let i = 0; i < 100; i++) { if (events.some(e => e.method === 'Page.loadEventFired')) break; await sleep(50); }
  const fontsReady = await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>document.fonts.check("16px Fraunces")&&document.fonts.check("12px \\"JetBrains Mono\\""))', awaitPromise: true, returnByValue: true });
  console.log('fonts ready:', fontsReady.result?.result?.value);
  const n = Math.round(dur / 1000 * fps); const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = Math.round(i * 1000 / fps);
    await send('Runtime.evaluate', { expression: `render(${t})` });
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 960, height: 540, scale: 1 } });
    fs.writeFileSync(path.join(outDir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(shot.result.data, 'base64'));
  }
  console.log(`captured ${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  ws.close();
} finally { chrome.kill('SIGKILL'); }
