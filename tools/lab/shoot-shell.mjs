/*
  shoot-shell — film what the SHELL plays, so the sound page can loop each of
  its sounds over the screen it is heard on.

    called by serve-events.mjs (POST /api/shoot-shell, the Shoot button of the
    sound page's Shell entry); it needs that server's build to play.

  The shell's sounds — the round's live stars, the third star, the end screen
  (the score landing, its stars, its rows), the meta layer's coins and gifts,
  a missed objective — are played over the DOM: the star pill, the end screen,
  the gift boxes. The events bench's REC films the game's CANVAS, which holds
  none of it, and filming the screen from the page needs the browser's
  permission and a tab capture that has to be cut to the frame. So this does
  it from outside, the way every other shooting tool of the repo does: a
  headless Chrome (tools/lab/chrome.mjs) plays a SCENARIO in a game's own web
  build and the DevTools protocol's screencast films the whole page, DOM
  included, while every Sound.ui is logged with the stack that called it.

  The scenario, in one game, on a fresh profile:
    1. level 1, its objective climbed in four seconds (Game.levelProgress is
       stood in for): three live stars, then the third star's beat, then the
       end screen — score, stars, rows, the coin cascade — and the gift
       boxes of a first perfect round, the first one picked;
    2. level 2, nothing scored: the missed objective and its end screen.

  Each Sound.ui is matched to its shell line the way the bench's REC does it
  (the shared engine.<hash>.js / boot.<hash>.js hold each shell file whole:
  `shell` of /api/offset), and every line heard gets one clip: a second
  before its first firing and a second after, every other shell sound of
  that window riding along — the same shape as a REC capture, marked
  `screen` since its callouts are in the picture.
*/
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reap, sweep } from './chrome.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VW = 450, VH = 800;                  // the 720×1280 frame at 0.625
const PRE = 1, POST = 1;                   // seconds kept either side of a sound
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch(profile, { label = 'shoot-shell', minutes = 5 } = {}) {
  const child = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required',
    '--no-first-run', '--force-device-scale-factor=1', '--window-size=' + VW + ',' + VH, 'about:blank'
  ], { stdio: 'ignore' });
  reap(child, { label, deadlineMs: minutes * 60 * 1000 });
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100; i++) {
    if (fs.existsSync(portFile)) {
      const p = parseInt(fs.readFileSync(portFile, 'utf8').split('\n')[0], 10);
      if (p) return { child, port: p };
    }
    await sleep(100);
  }
  child.kill('SIGKILL');
  throw new Error('Chrome did not open a debugging port');
}

export async function cdp(port) {
  const info = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 1;
  const pending = new Map(), handlers = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    } else if (msg.method) handlers.forEach((h) => h(msg));
  };
  return {
    send(method, params, sessionId) {
      const i = id++;
      ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId }));
      return new Promise((res, rej) => pending.set(i, { res, rej }));
    },
    on(h) { handlers.push(h); },
    close() { ws.close(); }
  };
}

/* What is wrapped in the page once the build is up: every Sound.ui, logged
   with the wall-clock time the screencast stamps its frames with, and the
   stack that called it. */
const HOOK = `(() => {
  const W = window.__WEB__, S = W && W.Sound;
  if (!S || S.__shoot) return false;
  window.__shoot = [];
  const o = S.ui;
  S.ui = function (role) {
    window.__shoot.push({ role: String(role), t: performance.timeOrigin + performance.now(), stack: new Error().stack });
    return o.apply(this, arguments);
  };
  S.__shoot = true;
  return true;
})()`;

/* The scenario, step by step, each one a page expression and a wait. */
function scenario(levels) {
  const climb = (to) => `(() => {
    const W = window.__WEB__; let v = 0; const t0 = performance.now();
    W.Game.levelProgress = () => v;
    const id = setInterval(() => { v = Math.round(${to} * Math.min(1, (performance.now() - t0) / 4000)); if (v >= ${to}) clearInterval(id); }, 50);
    return true;
  })()`;
  const steps = [
    { what: 'unlock', js: `(window.__WEB__.Sound.unlock(), true)`, wait: 300 },
    { what: 'level 1', js: `(window.__LEVELS__.play(1), true)`, wait: 900 },
    { what: 'skip the entrance', js: `(window.__WEB__.Enter && window.__WEB__.Enter.skip && window.__WEB__.Enter.skip(), true)`, wait: 600 },
    { what: 'climb to three stars', js: climb(1e7), wait: 6500 },
    // A game whose third star is a beat (levelMaxed) plays on: its round is ended here.
    // The level reads its stars off `levelScore` (levels.js, onResult): the climb's value, handed over.
    { what: 'end the round', js: `(window.__WEB__.state() === "playing" && window.__WEB__.endRound({ title: "Bench", score: 12500, levelScore: 1e7, stars: 3, rows: [{ label: "Combo", value: "x13" }] }), true)`, wait: 11000 },
    { what: 'pick a gift', js: `(() => { const b = document.querySelector(".mt-gift"); if (b) b.click(); return !!b; })()`, wait: 7000 }
  ];
  if (levels > 1) steps.push(
    { what: 'level 2', js: `(window.__LEVELS__.play(2), true)`, wait: 900 },
    { what: 'skip the entrance', js: `(window.__WEB__.Enter && window.__WEB__.Enter.skip && window.__WEB__.Enter.skip(), true)`, wait: 600 },
    { what: 'score nothing', js: `(window.__WEB__.Game.levelProgress = () => 0, true)`, wait: 1500 },
    { what: 'end the round, objective missed', js: `(window.__WEB__.state() === "playing" && window.__WEB__.endRound({ title: "Bench", score: 0, levelScore: 0, stars: 0, rows: [] }), true)`, wait: 6000 }
  );
  return steps;
}

// A frame of the shared scripts → the shell line it is, or null.
function lineOf(stack, shellMap, shell) {
  const frames = String(stack).split('\n').filter((l) => /:\d+:\d+\)?\s*$/.test(l));
  const m = /\/((?:engine|boot)\.[0-9a-f]+\.js):(\d+):\d+/.exec(frames[1] || '');
  if (!m) return null;
  const e = shellMap.find((x) => x.file === m[1] && Number(m[2]) >= x.from && Number(m[2]) < x.from + x.lines);
  if (!e) return null;
  const at = Number(m[2]) - e.from + 1;
  let best = null;
  for (const c of shell) {
    if (c.where !== e.where) continue;
    const d = Math.abs(c.line - at);
    if (d <= 2 && (!best || d < best.d)) best = { c, d };
  }
  return best && best.c;
}

// The frames of a window, as a webm: each frame held until the next one came.
function encode(frames, dir, name) {
  const list = [];
  frames.forEach((f, i) => {
    const file = path.join(dir, `${name}-${String(i).padStart(4, '0')}.jpg`);
    fs.writeFileSync(file, f.data);
    const next = frames[i + 1] ? frames[i + 1].t : f.t + 50;
    list.push(`file '${file}'`, `duration ${Math.max(0.001, (next - f.t) / 1000).toFixed(3)}`);
  });
  list.push(`file '${path.join(dir, `${name}-${String(frames.length - 1).padStart(4, '0')}.jpg`)}'`);
  const txt = path.join(dir, name + '.txt'), out = path.join(dir, name + '.webm');
  fs.writeFileSync(txt, list.join('\n') + '\n');
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', txt,
    '-vf', 'scale=360:640:force_original_aspect_ratio=increase,crop=360:640,fps=20', '-c:v', 'libvpx', '-b:v', '1M',
    '-pix_fmt', 'yuv420p', '-an', out]);
  if (r.status !== 0) throw new Error('ffmpeg: ' + String(r.stderr || '').trim());
  return fs.readFileSync(out);
}

/**
 * Film the shell's sounds in one game's web build.
 * @param {{ base: string, game: string, shell: Array, shellMap: Array, log?: Function }} o
 * @returns {Promise<{ clips: Array<{ webm: Buffer, dur: number, at: number, events: Array, claim: string[] }>, heard: string[], steps: string[] }>}
 */
export async function shootShell({ base, game, shell, shellMap, log = () => {} }) {
  sweep('shoot-shell-');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shoot-shell-'));
  const { child, port } = await launch(profile);
  let client = null;
  try {
    client = await cdp(port);
    const t = await client.send('Target.createTarget', { url: 'about:blank' });
    const sid = (await client.send('Target.attachToTarget', { targetId: t.targetId, flatten: true })).sessionId;
    await client.send('Page.enable', {}, sid);
    await client.send('Runtime.enable', {}, sid);
    await client.send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false }, sid);
    const ev = async (js) => {
      const r = await client.send('Runtime.evaluate', { expression: js, returnByValue: true, awaitPromise: true }, sid);
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      return r.result.value;
    };

    const frames = [];
    client.on((msg) => {
      if (msg.method !== 'Page.screencastFrame' || msg.sessionId !== sid) return;
      frames.push({ t: msg.params.metadata.timestamp * 1000, data: Buffer.from(msg.params.data, 'base64') });
      client.send('Page.screencastFrameAck', { sessionId: msg.params.sessionId }, sid).catch(() => {});
    });

    await client.send('Page.navigate', { url: `${base}/build/${game}/index.html?first=0&lang=en&force=1` }, sid);
    let up = false;
    for (let i = 0; i < 60 && !up; i++) { await sleep(250); up = await ev(`!!(window.__WEB__ && window.__LEVELS__ && window.__LEVELS__.active && window.__LEVELS__.active())`).catch(() => false); }
    if (!up) throw new Error(game + ' has no level map — the shell is shot in a game that has one');
    await sleep(2500);                      // the splash and the hub settle
    await ev(HOOK);
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 }, sid);
    await sleep(400);

    const done = [];
    const count = await ev(`window.__LEVELS__.count ? window.__LEVELS__.count() : 1`);
    for (const s of scenario(count)) {
      try {
        const ok = await ev(s.js);
        const st = await ev(`window.__WEB__.state() + (window.__WEB__.ending && window.__WEB__.ending() ? " (ending)" : "")`).catch(() => '?');
        done.push(s.what + (ok === false ? ' (nothing to do)' : '') + ' → ' + st);
        log('  ' + done[done.length - 1]);
      }
      catch (e) { done.push(s.what + ' (failed: ' + e.message + ')'); log('  ' + s.what + ' failed — ' + e.message); }
      await sleep(s.wait);
    }
    await client.send('Page.stopScreencast', {}, sid);
    const calls = await ev(`window.__shoot || []`);

    // Every Sound.ui, on its shell line; the frames, in order.
    const heard = calls.map((c) => ({ ...c, line: lineOf(c.stack, shellMap, shell) })).filter((c) => c.line);
    frames.sort((a, b) => a.t - b.t);
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'shoot-shell-frames-'));
    const clips = [], filed = new Set();
    try {
      // SHOOT_SHELL_DEBUG=<file.webm>: the whole session, to see what the scenario did.
      if (process.env.SHOOT_SHELL_DEBUG) fs.writeFileSync(process.env.SHOOT_SHELL_DEBUG, encode(frames, work, 'all'));
      for (const h of heard) {
        if (filed.has(h.line.checkId)) continue;
        const win = frames.filter((f) => f.t >= h.t - PRE * 1000 && f.t <= h.t + POST * 1000);
        if (win.length < 4) continue;
        const t0 = win[0].t, t1 = win[win.length - 1].t;
        const events = heard.filter((x) => x.t >= t0 && x.t <= t1)
          .map((x) => ({ id: x.line.checkId, name: 'Sound.ui', line: x.line.line, fn: x.line.fn || '', t: Math.round(x.t - t0) / 1000 }));
        const claim = [...new Set(events.map((e) => e.id))].filter((id) => !filed.has(id));
        claim.forEach((id) => filed.add(id));
        const webm = encode(win, work, 'c' + clips.length);
        clips.push({ webm, dur: (t1 - t0) / 1000 + 0.05, at: Math.round(h.t - t0) / 1000, events, claim });
      }
    } finally { fs.rmSync(work, { recursive: true, force: true }); }
    return { clips, heard: [...filed], steps: done, frames: frames.length };
  } finally {
    if (client) client.close();
    try { child.kill('SIGKILL'); } catch {}
    await sleep(300);
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  }
}
