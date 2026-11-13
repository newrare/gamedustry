#!/usr/bin/env node
/*
  itch-banners — the pictures an itch description alternates with its text.

    node tools/lab/itch-banners.mjs chainring
    node tools/lab/itch-banners.mjs                 # every game with an itch.page
    node tools/lab/itch-banners.mjs chainring --keep   # keep the HTML pages it shot

  A description that reads as a rulebook does not sell a game. The page is
  built as picture, a few lines, picture, a few lines — and the pictures are
  composed here out of what the game already owns, never drawn for it:

    <slug>-showcase.webp        three captures fanned out behind the
                                character, no word on it
    <slug>-section-<key>.webp   a section heading: a neon band in the game's
                                two accents, the title in the game's own
                                typeface, and two or three of its pieces (a
                                sticker, a decor object, a building) stuck on
                                it askew and bleeding off its edges

  What goes on each is declared in `itch.page` of games/<slug>/manifest.json:
  `art.showcase` names the captures (`assets/image/screen/<slug>-NN.jpg`), the
  piece in front and the extra pieces; `art.<key>` names the pieces of a
  section, by their role in assets/image/embed/ (`sticker16`, `decor-06`,
  `home06`, `character-happy`); the title is the section's `title` in
  `itch.page.en`, shouted the house way (accents off).

  Transparent WebP, shot at twice the 960 px it is shown at, into
  assets/image/itch/ beside the covers. tools/build/build-site.mjs serves them
  at newrare.app/image/itch/<slug>/, which is the URL the description points
  at (tools/publish/itch-page.mjs).
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { reap, sweep, reportSweep } from './chrome.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const EMBED = path.join(ROOT, 'assets', 'image', 'embed');
const SCREEN = path.join(ROOT, 'assets', 'image', 'screen');
const FONTS = path.join(ROOT, 'assets', 'motor', 'font');
const OUT = path.join(ROOT, 'assets', 'image', 'itch');
const W = 960, DSF = 2, Q = 88;

const argv = process.argv.slice(2);
const keep = argv.includes('--keep');
const only = argv.filter((a) => !a.startsWith('--'));

const slugs = fs.readdirSync(path.join(ROOT, 'games'))
  .filter((s) => fs.existsSync(path.join(ROOT, 'games', s, 'manifest.json')))
  .filter((s) => !only.length || only.includes(s))
  .filter((s) => { const m = manifestOf(s); return m.itch && m.itch.page; })
  .sort();
if (!slugs.length) { console.error('no game with an itch.page' + (only.length ? ': ' + only.join(' ') : '')); process.exit(1); }

function manifestOf(slug) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'games', slug, 'manifest.json'), 'utf8'));
}

function dataUri(file, mime) {
  return 'data:' + mime + ';base64,' + fs.readFileSync(file).toString('base64');
}

function piece(slug, role) {
  const f = path.join(EMBED, `${slug}-${role}.webp`);
  if (!fs.existsSync(f)) throw new Error(`${slug}: no ${path.relative(ROOT, f)} — a piece is a role of assets/image/embed/`);
  return dataUri(f, 'image/webp');
}

/* Capitals the house way: accents come off, a unit glued to a digit keeps its
   case (the motor's `upper`, packages/engine/engine.js, cut down to plain
   text). */
function upper(s) {
  const FROM = 'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŸ', TO = 'AAAAAACEEEEIIIINOOOOOOUUUUYY';
  return String(s).replace(/[a-zß-öø-ÿœ]+/g, (run, at, all) =>
    /\d/.test(all.charAt(at - 1) + all.charAt(at + run.length)) ? run : run.toUpperCase())
    .replace(/[À-Ÿ]/g, (c) => { const i = FROM.indexOf(c); return i < 0 ? c : TO[i]; })
    .replace(/Œ/g, 'OE').replace(/Æ/g, 'AE');
}

function fontOf(m) {
  const table = JSON.parse(fs.readFileSync(path.join(FONTS, 'fonts.json'), 'utf8'));
  const key = (m.web && m.web.font) || 'exo2';
  const f = table[key] || table.exo2;
  return { family: f.family, weight: f.heavy || 400, src: dataUri(path.join(FONTS, f.file), 'font/woff2') };
}

/* ── the two layouts ──────────────────────────────────────────────────────
   Both are one page: the stage is laid out in design px, the pieces placed by
   script once the face has loaded (a band's width is the title's), and
   `window.__done` says the frame is ready to shoot. */

function pageOf(m, font, body, script) {
  const a = (m.theme && m.theme.accent) || '#4bf5ff';
  const b = (m.theme && m.theme.accent2) || a;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Game'; src: url(${font.src}) format('woff2'); font-weight: 100 900; }
html, body { margin: 0; background: transparent; }
#stage { position: relative; width: ${W}px; overflow: visible; --a: ${a}; --b: ${b}; }
.pc { position: absolute; display: block; filter: drop-shadow(0 10px 14px rgba(0,0,0,.6)); }
/* A section heading. */
.band { position: absolute; left: 50%; transform: translateX(-50%); height: 116px; padding: 0 128px;
  display: flex; align-items: center; justify-content: center; white-space: nowrap; border-radius: 58px;
  border: 4px solid transparent;
  background: linear-gradient(180deg, rgba(20,16,52,.96), rgba(6,6,22,.96)) padding-box,
              linear-gradient(90deg, var(--a), var(--b)) border-box;
  box-shadow: 0 0 34px color-mix(in srgb, var(--a) 55%, transparent), 0 16px 34px rgba(0,0,0,.6); }
.band span { font-family: 'Game'; font-weight: ${font.weight}; font-size: 60px; letter-spacing: .05em; line-height: 1;
  color: #fff; text-shadow: 0 0 22px color-mix(in srgb, var(--a) 80%, transparent), 0 3px 0 rgba(0,0,0,.45); }
/* The showcase. */
.shot { position: absolute; border-radius: 26px; border: 5px solid transparent; overflow: hidden;
  background: linear-gradient(#000,#000) padding-box, linear-gradient(160deg, var(--a), var(--b)) border-box;
  box-shadow: 0 0 40px color-mix(in srgb, var(--a) 40%, transparent), 0 22px 40px rgba(0,0,0,.65); }
.shot img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 21px; }
</style></head><body><div id="stage">${body}</div><script>
(async function () {
  await document.fonts.ready;
  await Promise.all([].map.call(document.images, function (i) { return i.decode().catch(function () {}); }));
  ${script}
  window.__done = true;
})();
</script></body></html>`;
}

/* A band at the bottom half of a 300 px stage, so the pieces stuck on its
   ends can rise above it. Three slots, used in order: left end, right end,
   above the right third. */
function sectionPage(m, font, title, pics) {
  const imgs = pics.map((src, i) => `<img class="pc" id="p${i}" src="${src}">`).join('');
  const body = `<div class="band" id="band" style="top:150px"><span>${upper(title)}</span></div>${imgs}`;
  const script = `
  var st = document.getElementById('stage'); st.style.height = '300px';
  /* The band never runs wider than the stage leaves room for its end pieces:
     a long title steps its size down rather than its pieces off the picture. */
  var bandEl = document.getElementById('band'), span = bandEl.firstChild, size = 60;
  while (bandEl.offsetWidth > ${W} - 150 && size > 36) { size -= 2; span.style.fontSize = size + 'px'; }
  var band = bandEl.getBoundingClientRect();
  function clampX(x, h) { return Math.max(h * 0.42, Math.min(${W} - h * 0.42, x)); }
  var SLOTS = [
    { x: clampX(band.left + 20, 196),  y: band.bottom + 18, h: 196, r: -11 },
    { x: clampX(band.right - 20, 196), y: band.bottom + 18, h: 196, r: 9 },
    { x: band.left + band.width * 0.72, y: band.top + 26, h: 120, r: 14 }
  ];
  for (var i = 0; i < SLOTS.length; i++) {
    var el = document.getElementById('p' + i); if (!el) break;
    var s = SLOTS[i], w = s.h * el.naturalWidth / el.naturalHeight;
    el.style.height = s.h + 'px';
    el.style.left = (s.x - w / 2) + 'px';
    el.style.top = (s.y - s.h) + 'px';
    el.style.transform = 'rotate(' + s.r + 'deg)';
  }`;
  return pageOf(m, font, body, script);
}

/* Three captures fanned out, the middle one raised, the character standing in
   front of the left one and a piece on the right. 560 px tall. */
function showcasePage(m, font, shots, front, pics) {
  const fan = [
    { x: 300, y: 62, w: 230, r: -9, z: 1 },
    { x: 480, y: 26, w: 262, r: 0, z: 2 },
    { x: 660, y: 62, w: 230, r: 9, z: 1 }
  ];
  let body = shots.map((src, i) => {
    const f = fan[i];
    const h = Math.round(f.w * 16 / 9);
    return `<div class="shot" style="left:${f.x - f.w / 2}px;top:${f.y}px;width:${f.w}px;height:${h}px;transform:rotate(${f.r}deg);z-index:${f.z}"><img src="${src}"></div>`;
  }).join('');
  if (front) body += `<img class="pc" id="front" src="${front}" style="z-index:3">`;
  body += pics.map((src, i) => `<img class="pc" id="p${i}" src="${src}" style="z-index:3">`).join('');
  const script = `
  var st = document.getElementById('stage'); st.style.height = '540px';
  function put(el, cx, bottom, h, r) {
    var w = h * el.naturalWidth / el.naturalHeight;
    el.style.height = h + 'px'; el.style.left = (cx - w / 2) + 'px';
    el.style.top = (bottom - h) + 'px'; el.style.transform = 'rotate(' + r + 'deg)';
  }
  var f = document.getElementById('front'); if (f) put(f, 150, 540, 400, 0);
  var p = document.getElementById('p0'); if (p) put(p, 815, 520, 190, 10);
  var q = document.getElementById('p1'); if (q) put(q, 835, 200, 130, -8);`;
  return pageOf(m, font, body, script);
}

// ── Chrome over the DevTools protocol ──────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(profileDir) {
  const child = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profileDir,
    '--disable-gpu', '--mute-audio', '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  for (let i = 0; i < 100; i++) {
    if (fs.existsSync(portFile)) {
      const line = fs.readFileSync(portFile, 'utf8').split('\n')[0];
      if (line) return { child, port: Number(line) };
    }
    await sleep(100);
  }
  child.kill('SIGKILL');
  throw new Error('Chrome opened no debugging port — is it at ' + CHROME + '?');
}

async function connect(port) {
  const info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let next = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    const p = msg.id && pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) p.rej(new Error(msg.error.message)); else p.res(msg.result);
  };
  const send = (method, params, sessionId) => new Promise((res, rej) => {
    const id = next++;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
  });
  return { send, close: () => ws.close() };
}

async function shoot(client, html, out, tmp) {
  const file = path.join(tmp, path.basename(out, '.webp') + '.html');
  fs.writeFileSync(file, html);
  const t = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: sid } = await client.send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  try {
    await client.send('Emulation.setDeviceMetricsOverride', { width: W, height: 800, deviceScaleFactor: DSF, mobile: false }, sid);
    await client.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }, sid);
    await client.send('Page.navigate', { url: 'file://' + file }, sid);
    for (let i = 0; i < 100; i++) {
      const r = await client.send('Runtime.evaluate', { expression: 'window.__done === true', returnByValue: true }, sid);
      if (r.result && r.result.value) break;
      await sleep(100);
    }
    const h = (await client.send('Runtime.evaluate', {
      expression: 'document.getElementById("stage").offsetHeight', returnByValue: true }, sid)).result.value;
    const shot = await client.send('Page.captureScreenshot', {
      format: 'webp', quality: Q, captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: W, height: h, scale: 1 }
    }, sid);
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    return { kb: Math.round(fs.statSync(out).size / 1024), h };
  } finally {
    await client.send('Target.closeTarget', { targetId: t.targetId });
  }
}

// ── run ────────────────────────────────────────────────────────────────────

const jobs = [];
for (const slug of slugs) {
  const m = manifestOf(slug);
  const page = m.itch.page;
  const art = page.art || {};
  const en = page.en || {};
  const font = fontOf(m);
  if (art.showcase) {
    const sc = art.showcase;
    const shots = (sc.shots || []).slice(0, 3).map((n) => {
      const f = path.join(SCREEN, `${slug}-${String(n).padStart(2, '0')}.jpg`);
      if (!fs.existsSync(f)) throw new Error(`${slug}: no ${path.relative(ROOT, f)}`);
      return dataUri(f, 'image/jpeg');
    });
    jobs.push({ out: path.join(OUT, `${slug}-showcase.webp`),
      html: showcasePage(m, font, shots, sc.front ? piece(slug, sc.front) : null, (sc.pieces || []).map((r) => piece(slug, r))) });
  }
  for (const s of en.sections || []) {
    if (!s.title) continue;
    jobs.push({ out: path.join(OUT, `${slug}-section-${s.key}.webp`),
      html: sectionPage(m, font, s.title, (art[s.key] || []).map((r) => piece(slug, r))) });
  }
}

reportSweep(sweep('itch-banners-'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'itch-banners-'));
const chrome = await launch(tmp);
const kill = reap(chrome.child, { label: 'itch-banners', deadlineMs: Math.max(5 * 60 * 1000, jobs.length * 20 * 1000) });
const client = await connect(chrome.port);
const pages = fs.mkdtempSync(path.join(os.tmpdir(), 'itch-banner-pages-'));
try {
  for (const job of jobs) {
    const r = await shoot(client, job.html, job.out, pages);
    console.log(`OK    ${path.relative(ROOT, job.out)}  (${W}x${r.h} shown, ${r.kb} KB)`);
  }
} finally {
  client.close();
  kill();
  await sleep(200);
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  if (keep) console.log('pages kept: ' + pages); else fs.rmSync(pages, { recursive: true, force: true });
}
