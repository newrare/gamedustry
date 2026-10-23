#!/usr/bin/env node
/* Shoot games/foldiers' web build in a headless Chrome: start a level (or the
 * title screen), skip the round's entrance, let it run, and write PNG frames —
 * plus every console error the page raised. A development aid for the paper
 * map, the pieces and the table; nothing here ships.
 *
 *   node tools/build/build.mjs --target=web --game=foldiers
 *   node tools/lab/shoot-foldiers.mjs 1 7 30          # levels 1, 7 and 30
 *   node tools/lab/shoot-foldiers.mjs --title          # the title screen
 *   node tools/lab/shoot-foldiers.mjs --village        # ...and the village it opens on
 *   node tools/lab/shoot-foldiers.mjs --playable       # the single-file playable, intro and round
 *   node tools/lab/shoot-foldiers.mjs 1 --js "…"       # run a snippet before the shot
 *   node tools/lab/shoot-foldiers.mjs 1 --do drag:360,700,520,420 shot:a tap:400,600 wait:2000 shot:b
 *                                                      # gestures in design px, a shot after each "shot:"
 *   node tools/lab/shoot-foldiers.mjs 1 --do down:360,700 move:520,420 wait:500 move:430,300 shot:ring up:430,300
 *                                                      # a gesture held between steps (the order ring)
 *   node tools/lab/shoot-foldiers.mjs 1 --query hud=0  # extra url parameters (hud=0: the bare map)
 *
 * Frames land in dist/lab/foldiers/. Serves dist/web over HTTP on its own,
 * because the split build loads its assets by XHR (file:// breaks it).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { reap, sweep, reportSweep } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const WEB = path.join(ROOT, "dist/web");
const OUT = path.join(ROOT, "dist/lab/foldiers");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const VW = 390, VH = 844, DPR = 2;

const argv = process.argv.slice(2);
const levels = argv.filter((a, i) => /^\d+$/.test(a) && argv[i - 1] !== "--wait").map(Number);
const title = argv.includes("--title");
const jsAt = argv.indexOf("--js");
const snippet = jsAt >= 0 ? argv[jsAt + 1] : "";
const waitMs = +(argv[argv.indexOf("--wait") + 1] || 2500) || 2500;
const doAt = argv.indexOf("--do");
const queryAt = argv.indexOf("--query");
const query = queryAt >= 0 ? "&" + argv[queryAt + 1] : "";
const steps = doAt >= 0 ? argv.slice(doAt + 1).filter((a) => /^[a-z]+:/.test(a)) : [];
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".png": "image/png", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".json": "application/json", ".jpg": "image/jpeg" };

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(WEB, decodeURIComponent(req.url.split("?")[0]));
      if (!p.startsWith(WEB) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, "127.0.0.1", () => res(srv));
  });
}

async function launch(profileDir) {
  const child = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profileDir,
    "--hide-scrollbars", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--no-first-run",
    "--window-size=" + VW + "," + VH, "about:blank"], { stdio: "ignore" });
  reap(child, { label: "shoot-foldiers", deadlineMs: 10 * 60 * 1000 });
  const portFile = path.join(profileDir, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {
    if (fs.existsSync(portFile)) { const t = fs.readFileSync(portFile, "utf8").split("\n"); if (t[0]) return parseInt(t[0], 10); }
    await sleep(100);
  }
  throw new Error("Chrome did not open a debugging port");
}

async function cdp(port) {
  const info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 1; const pending = new Map(); let onEvent = null;
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result); }
    else if (msg.method && onEvent) onEvent(msg);
  };
  return { send: (method, params, sessionId) => { const i = id++; ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId })); return new Promise((res, rej) => pending.set(i, { res, rej })); },
    set on(fn) { onEvent = fn; }, close: () => ws.close() };
}

reportSweep(sweep("shoot-foldiers-"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-foldiers-"));
const srv = await serve();
const port = await launch(tmp);
const c = await cdp(port);
const t = await c.send("Target.createTarget", { url: "about:blank" });
const sid = (await c.send("Target.attachToTarget", { targetId: t.targetId, flatten: true })).sessionId;
const errors = [];
c.on = (msg) => {
  if (msg.method === "Page.screencastFrame") c.send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }, sid).catch(() => {});
  if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : msg.params.exceptionDetails.text);
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") errors.push(msg.params.args.map((a) => a.value || a.description).join(" "));
};
await c.send("Page.enable", {}, sid);
await c.send("Runtime.enable", {}, sid);
await c.send("Emulation.setDeviceMetricsOverride", { width: VW, height: VH, deviceScaleFactor: DPR, mobile: true }, sid);
await c.send("Page.startScreencast", { format: "jpeg", quality: 5, maxWidth: 100, maxHeight: 200, everyNthFrame: 1 }, sid);
const base = "http://127.0.0.1:" + srv.address().port + "/foldiers/index.html?first=0&force=1&lang=en" + query;
const ev = async (expr) => { const r = await c.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, sid); return r.result && r.result.value; };
// design px → the page's css px: the 720x1280 frame is letterboxed into the viewport.
async function mouse(type, x, y, buttons) {
  const k = Math.min(VW / 720, VH / 1280), ox = (VW - 720 * k) / 2, oy = (VH - 1280 * k) / 2;
  await c.send("Input.dispatchMouseEvent", { type, x: ox + x * k, y: oy + y * k, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 }, sid);
}
async function shot(name) {
  const r = await c.send("Page.captureScreenshot", { format: "png" }, sid);
  fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(r.data, "base64"));
  console.log("  " + path.relative(ROOT, path.join(OUT, name + ".png")));
}

if (argv.includes("--playable")) {
  // the single-file playable over file://: start it as a player would, let the entrance land
  await c.send("Page.navigate", { url: "file://" + path.join(ROOT, "games/foldiers/index.html") }, sid);
  for (let i = 0; i < 60; i++) { if (await ev("!!document.querySelector('#screen-intro:not(.hidden)')")) break; await sleep(250); }
  await shot("playable-intro");
  await ev("document.getElementById('btn-start').click(), true");
  await sleep(waitMs + 3000);
  await shot("playable");
  if (errors.length) { console.log("ERRORS:"); errors.slice(0, 20).forEach((e) => console.log("  " + String(e).split("\n").slice(0, 4).join(" | "))); }
  else console.log("no page error");
  c.close(); srv.close(); process.exit(0);
}
await c.send("Page.navigate", { url: base }, sid);
for (let i = 0; i < 80; i++) { if (await ev("!!(window.__LEVELS__ && window.__WEB__)")) break; await sleep(250); }
await sleep(1200);
if (title || !levels.length) await shot("title");
if (argv.includes("--village")) { await sleep(4500); await shot("village"); }
for (const n of levels) {
  const t0 = Date.now();
  await ev("window.__LEVELS__.play(" + n + "); true");
  await sleep(400);
  await ev("(window.__WEB__.Enter && window.__WEB__.Enter.skip && window.__WEB__.Enter.skip()), true");
  console.log("level " + n + " started in " + (Date.now() - t0) + " ms");
  await sleep(waitMs);
  if (snippet) { console.log("  js →", JSON.stringify(await ev(snippet))); await sleep(900); }
  await shot("level-" + n);
  let last = [360, 640];
  for (const st of steps) {
    const [kind, arg] = st.split(":"), v = (arg || "").split(",").map(Number);
    if (kind === "shot") await shot("level-" + n + "-" + arg);
    else if (kind === "wait") await sleep(v[0]);
    else if (kind === "tap") { await mouse("mousePressed", v[0], v[1]); await sleep(60); await mouse("mouseReleased", v[0], v[1]); await sleep(350); }
    else if (kind === "down") { last = v; await mouse("mousePressed", v[0], v[1]); }
    else if (kind === "move") {
      for (let k = 1; k <= 12; k++) { await mouse("mouseMoved", last[0] + (v[0] - last[0]) * k / 12, last[1] + (v[1] - last[1]) * k / 12, 1); await sleep(30); }
      last = v;
    }
    else if (kind === "up") { await mouse("mouseReleased", v[0], v[1]); await sleep(400); }
    else if (kind === "drag") {
      await mouse("mousePressed", v[0], v[1]);
      for (let k = 1; k <= 12; k++) { await mouse("mouseMoved", v[0] + (v[2] - v[0]) * k / 12, v[1] + (v[3] - v[1]) * k / 12, 1); await sleep(30); }
      await mouse("mouseReleased", v[2], v[3]); await sleep(400);
    }
  }
}
if (errors.length) { console.log("ERRORS:"); errors.slice(0, 20).forEach((e) => console.log("  " + String(e).split("\n").slice(0, 4).join(" | "))); }
else console.log("no page error");
c.close(); srv.close();
process.exit(0);
