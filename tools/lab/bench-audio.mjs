#!/usr/bin/env node
/* bench-audio — does the audio graph grow while a game plays?
 *
 * Chrome's WebAudio domain reports every node the page creates and every node
 * it actually destroys. Play a round, count both, and read the render capacity
 * of the audio thread as it goes.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const argv = process.argv.slice(2);
const opt = (k, d) => { const a = argv.find((x) => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const slug = argv.find((a) => !a.startsWith("--")) || "vipera";
const SECONDS = parseInt(opt("s", "30"), 10);
/* --leak neutralizes the release() the motor now does, which is how the fix is
   verified rather than believed: the same run, the same counters, with the
   nodes left wired to the destination the way they used to be. */
const LEAK = argv.includes("--leak");
const VW = 390, VH = 844;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SEED_JS = `<script>(function(){var s=1013904223;Math.random=function(){s=s*16807%2147483647;return (s-1)/2147483646;};})();</script>`;
const HOOK_JS = `
  window.__H = { startGame: startGame, Loop: Loop, Input: Input, Layout: Layout,
    CONFIG: CONFIG, Beat: Beat, Pop: Pop, Overlay: Overlay, Fx: Fx, Sound: Sound,
    state: function () { return State; } };
`;
/* The pilot, plus in-page counters on the two factories the motor uses. */
const DRIVER_JS = `<script>
(function () {
  var C = window.AudioContext || window.webkitAudioContext;
  window.__audio = { gain: 0, src: 0, disconnected: 0, ended: 0 };
  var LEAK = %%LEAK%%;
  var cg = C.prototype.createGain, cb = C.prototype.createBufferSource;
  C.prototype.createGain = function () {
    window.__audio.gain++;
    var g = cg.call(this), d = g.disconnect;
    g.disconnect = function () { window.__audio.disconnected++; if (!LEAK) return d.apply(g, arguments); };
    return g;
  };
  C.prototype.createBufferSource = function () {
    window.__audio.src++;
    var s = cb.call(this), sd = s.disconnect;
    s.disconnect = function () { if (!LEAK) return sd.apply(s, arguments); };
    s.addEventListener("ended", function () { window.__audio.ended++; });
    return s;
  };

  var n = 0, side = 0, lastBeat = -1;
  function pilot() {
    var H = window.__H; if (!H) return;
    if (H.state() !== "playing") { H.startGame(); return; }
    var L = H.Layout, demo = (H.CONFIG.intro && H.CONFIG.intro.demo) || "tap";
    n++;
    if (demo === "swipe") { if (n % 36 === 0) H.Input.swipe(n % 72 === 0 ? 1 : -1); return; }
    if (demo === "hold") {
      if (n % 48 === 0) H.Input.at("down", (side++ % 2) ? L.left + L.w * .25 : L.right - L.w * .25, L.cy);
      else if (n % 48 === 30) H.Input.at("up", L.cx, L.cy);
      return;
    }
    if (demo === "drag" || demo === "aim") {
      var k = n % 42, ax = L.cx, ay = L.bottom - L.h * .12;
      var tx = L.left + L.w * (.2 + .6 * Math.abs(Math.sin(n * .07))), ty = L.top + L.h * .25;
      if (k === 0) H.Input.at("down", ax, ay);
      else if (k < 20) H.Input.at("move", ax + (tx - ax) * (k / 20), ay + (ty - ay) * (k / 20));
      else if (k === 20) H.Input.at("up", tx, ty);
      return;
    }
    var m = H.CONFIG.music;
    if (m && m.bpm > 0 && H.Beat) {
      var b = Math.floor(H.Beat.beats());
      if (b !== lastBeat) { lastBeat = b; H.Input.at("down", L.cx, L.cy); H.Input.at("up", L.cx, L.cy); }
      return;
    }
    if (n % 30 === 0) { H.Input.at("down", L.cx, L.cy); H.Input.at("up", L.cx, L.cy); }
  }
  window.__go = function () { var H = window.__H; H.Sound.unlock(); H.startGame(); setInterval(pilot, 1000 / 60); };
})();
</script>`;

function prepare(tmpDir) {
  let src = fs.readFileSync(path.join(ROOT, "games", slug, "index.html"), "utf8");
  const head = src.indexOf("<head>");
  src = src.slice(0, head + 6) + "\n" + SEED_JS + src.slice(head + 6);
  const close = src.lastIndexOf("})();");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);
  src = src.replace("</body>", DRIVER_JS.replace("%%LEAK%%", LEAK ? "true" : "false") + "\n</body>");
  const out = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(out, src);
  return out;
}

async function launchChrome(profileDir) {
  const child = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0",
    "--user-data-dir=" + profileDir, "--disable-gpu", "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required", "--no-first-run",
    "--force-device-scale-factor=1", "--window-size=" + VW + "," + VH, "about:blank"], { stdio: "ignore" });
  const portFile = path.join(profileDir, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {
    if (fs.existsSync(portFile)) {
      const t = fs.readFileSync(portFile, "utf8").split("\n");
      if (t[0]) return { child, port: parseInt(t[0], 10) };
    }
    await sleep(100);
  }
  throw new Error("no debugging port");
}

async function cdp(port) {
  const info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 1; const pending = new Map(); let onEvent = null;
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    } else if (msg.method && onEvent) onEvent(msg);
  };
  return { send: (method, params, sessionId) => { const i = id++;
      ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId }));
      return new Promise((res, rej) => pending.set(i, { res, rej })); },
    set on(fn) { onEvent = fn; }, close: () => ws.close() };
}

/* Chrome must die whatever happens next. SIGTERM is not enough — a headless
   browser survives it here — and an exception thrown mid-run used to skip the
   cleanup entirely, which is how a laptop ended up with thirty of these
   looping a game at 40% CPU each. So: SIGKILL, once, from a handler that runs
   on a normal exit, on a throw and on Ctrl-C alike. */
function reap(child) {
  var done = false;
  const kill = () => {
    if (done) return;
    done = true;
    try { child.kill("SIGKILL"); } catch (e) {}
  };
  process.on("exit", kill);
  process.on("SIGINT", () => { kill(); process.exit(130); });
  process.on("SIGTERM", () => { kill(); process.exit(143); });
  process.on("uncaughtException", (e) => { kill(); console.error(e); process.exit(1); });
  process.on("unhandledRejection", (e) => { kill(); console.error(e); process.exit(1); });
  return kill;
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-audio-"));
const chrome = await launchChrome(path.join(tmpDir, "profile"));
reap(chrome.child);
const client = await cdp(chrome.port);
const t = await client.send("Target.createTarget", { url: "about:blank" });
const a = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
const sid = a.sessionId;
await client.send("Page.enable", {}, sid);
await client.send("Runtime.enable", {}, sid);
await client.send("Emulation.setDeviceMetricsOverride", { width: VW, height: VH, deviceScaleFactor: 3, mobile: true }, sid);
await client.send("WebAudio.enable", {}, sid);

const nodes = { created: 0, destroyed: 0, byType: new Map() };
let ctxId = null;
client.on = (msg) => {
  if (msg.method === "Page.screencastFrame")
    client.send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }, sid).catch(() => {});
  else if (msg.method === "WebAudio.audioNodeCreated") {
    nodes.created++;
    const k = msg.params.node.nodeType;
    nodes.byType.set(k, (nodes.byType.get(k) || 0) + 1);
  } else if (msg.method === "WebAudio.audioNodeWillBeDestroyed") nodes.destroyed++;
  else if (msg.method === "WebAudio.contextCreated") ctxId = msg.params.context.contextId;
};
await client.send("Page.startScreencast", { format: "jpeg", quality: 5, maxWidth: 120, maxHeight: 220, everyNthFrame: 1 }, sid);

const file = prepare(tmpDir);
await client.send("Page.navigate", { url: "file://" + file }, sid);
const ev = async (e) => (await client.send("Runtime.evaluate", { expression: e, returnByValue: true }, sid)).result?.value;
for (let i = 0; i < 200; i++) { await sleep(100); if (await ev("!!window.__go && !!window.__H")) break; }
await ev("window.__go()");

console.log(`${slug} — one round, ${SECONDS}s, nodes reported by Chrome's WebAudio domain\n`);
console.log("  t   created  destroyed  live   createGain  createBufferSource  disconnect()  ended");
for (let s = 5; s <= SECONDS; s += 5) {
  await sleep(5000);
  const c = await ev("JSON.stringify(window.__audio)");
  const j = JSON.parse(c);
  console.log(String(s).padStart(3) + "s" +
    String(nodes.created).padStart(9) + String(nodes.destroyed).padStart(11) +
    String(nodes.created - nodes.destroyed).padStart(6) +
    String(j.gain).padStart(13) + String(j.src).padStart(20) +
    String(j.disconnected).padStart(14) + String(j.ended).padStart(7));
}
/* A disconnected node is out of the graph immediately but is only *reported*
   destroyed when it is collected, so the count means nothing until a GC has
   run. Force one: after the fix the whole backlog goes away, and with --leak
   nothing does, because a node still wired to the destination is reachable. */
await client.send("HeapProfiler.enable", {}, sid);
await client.send("HeapProfiler.collectGarbage", {}, sid);
await sleep(1500);
console.log("\nafter a forced GC: created " + nodes.created + ", destroyed " + nodes.destroyed +
  ", still live " + (nodes.created - nodes.destroyed));
console.log("node types created: " + [...nodes.byType.entries()].map(([k, v]) => k + ":" + v).join(" "));
try {
  const rt = await client.send("WebAudio.getRealtimeData", { contextId: ctxId }, sid);
  console.log("audio thread: " + JSON.stringify(rt.realtimeData));
} catch (e) { console.log("audio thread: unavailable (" + e.message + ")"); }
client.close(); chrome.child.kill("SIGKILL");
