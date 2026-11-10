#!/usr/bin/env node
/*
  bench-screenfx — what a full-screen effect costs, against what it replaces.

  The gate for moving the games onto ScreenFx (packages/shell/screenfx.js):
  the new layer must not cost more than what the games use today. Two of
  today's ways are measured beside it:

    vig        Overlay.vignette as it shipped: an inset box-shadow, 130 px of
               blur over the whole frame (the #ov-vignette node)
    canvas     what a game paints by hand for a held state — a full-frame
               tint and a painted frame drawn on the canvas EVERY frame
               (holepocalypse's freeze, parrynormal's)

  and the new ones:

    glow       ScreenFx.glow, what Overlay.vignette becomes: the same call,
               drawn as gradients on the blur's curve, no blur pass
    hit, bonus, sunburst, speed, ice, danger     the house presets

  `-mix` rows cycle four colours, so every call repaints (the worst case:
  a game whose glow changes colour per event); plain rows reuse one colour,
  which is what most games do.

  Same method as bench-raster.mjs, and read the same way (see its header):

    default    software raster, loop stopped, the phone's raster scale,
               RasterTask ms summed over N firings minus an idle baseline.
               "Did this remove or add work" on area-bound things.
    --gpu      a real window and GPU, the loop RUNNING: frame intervals.
               A regression guard — a row that drops frames here is a
               catastrophe on a phone — not a phone measurement. The `canvas`
               row only means something here, since it costs per frame.

  USAGE
    node tools/lab/bench-screenfx.mjs                   # vipera, CPU
    node tools/lab/bench-screenfx.mjs holepocalypse --gpu
    node tools/lab/bench-screenfx.mjs --kinds=vig,glow --n=60
*/

import { spawn } from "node:child_process";
import { reap, sweep, reportSweep } from "./chrome.mjs";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const argv = process.argv.slice(2);
const opt = (k, d) => {
  const a = argv.find((x) => x.startsWith("--" + k + "="));
  return a ? a.split("=").slice(1).join("=") : d;
};
const slug = argv.find((a) => !a.startsWith("--")) || "vipera";
const GPU = argv.includes("--gpu");
const KINDS = opt("kinds", GPU
  ? "vig-mix,glow-mix,canvas,ice,sunburst,speed"
  : "vig,glow,vig-mix,glow-mix,hit,danger,bonus,sunburst,speed,ice").split(",");
const N = parseInt(opt("n", "40"), 10);
const GAP = parseInt(opt("gap", "300"), 10);
const REPEATS = parseInt(opt("repeats", "2"), 10);
const VW = 390, VH = 844, DPR = parseFloat(opt("dpr", "3"));

/* ---------------- injected page code ---------------------------------- */

const SEED_JS = `<script>(function(){var s=1013904223;Math.random=function(){s=s*16807%2147483647;return (s-1)/2147483646;};})();</script>`;

const HOOK_JS = `
  window.__H = { startGame: startGame, Loop: Loop, Input: Input, Layout: Layout,
    Overlay: Overlay, ScreenFx: ScreenFx, Pop: Pop, ctx: ctx, view: view, Enter: Enter,
    frameUpdate: frameUpdate, frameRender: frameRender,
    state: function () { return State; } };
`;

/* The OLD Overlay.vignette, kept here verbatim so the comparison survives the
   migration: once the motor's vignette is ScreenFx.glow, this is the only
   place the box-shadow still exists. */
const DRIVER_JS = `<script>
(function () {
  var COLS = ["rgba(255,45,85,.9)", "rgba(255,212,59,.85)", "rgba(53,232,255,.8)", "rgba(166,255,61,.8)"];
  var oldEl = null, oldColor = null;
  function oldVignette(color, alpha, ms) {
    if (!oldEl) {
      oldEl = document.createElement("div");
      oldEl.style.cssText = "position:absolute;inset:0;opacity:0;transition:opacity .5s ease;pointer-events:none";
      document.getElementById("overlay").insertBefore(oldEl, document.getElementById("overlay").firstChild);
    }
    if (color && color !== oldColor) { oldColor = color; oldEl.style.boxShadow = "inset 0 0 130px 34px " + color; }
    oldEl.style.opacity = alpha == null ? 1 : alpha;
    if (ms) setTimeout(function () { oldEl.style.opacity = 0; }, ms);
  }

  /* the hand-made held state: a tint and a full-frame picture, every frame */
  var frameImg = new Image();
  frameImg.src = ${JSON.stringify("file://" + path.join(ROOT, "assets/image/master/game-frame-ice.png"))};
  var canvasOn = false;

  window.__ready = function () {
    var H = window.__H;
    if (!H || H.state() !== "intro") return false;
    H.startGame();
    if (!${GPU}) {
      H.Loop.stop();
      for (var i = 0; i < 240; i++) {
        if (H.state() !== "playing") H.startGame();
        if (i % 30 === 0) { H.Input.at("down", H.Layout.cx, H.Layout.cy); H.Input.at("up", H.Layout.cx, H.Layout.cy); }
        H.frameUpdate(1 / 60);
      }
      H.frameRender();
    } else {
      /* wrap the render: the canvas row paints its overlay after the game */
      var render = H.frameRender;
      H.Loop.stop();
      H.Loop.start(function (dt) { H.frameUpdate(dt); }, function () {
        render();
        if (canvasOn) {
          var c = H.ctx;
          c.fillStyle = "rgba(150,220,255,0.18)"; c.fillRect(0, 0, 720, 1280);
          if (frameImg.complete) c.drawImage(frameImg, 0, 0, 720, 1280);
        }
      });
    }
    H.Pop.clear(); H.Overlay.clear(); H.ScreenFx.clear();
    return true;
  };

  /* one firing of a kind; i is its index (the -mix rows cycle colours) */
  function fire(kind, i) {
    var H = window.__H, mix = /-mix$/.test(kind), base = kind.replace(/-mix$/, "");
    var col = mix ? COLS[i % 4] : COLS[0];
    if (base === "vig") oldVignette(col, 0.9, ${GAP} * 0.6);
    else if (base === "glow") H.ScreenFx.glow(col, 0.9, ${GAP} * 0.6);
    else if (base === "canvas") canvasOn = (i % 2 === 0);
    else if (base === "ice" || base === "speed" || base === "sunburst") {
      if (i % 2 === 0) H.ScreenFx.hold(base); else H.ScreenFx.release(base);
    }
    else H.ScreenFx.play(base);
  }

  window.__fire = function (kind, n, gap) {
    var i = 0;
    return new Promise(function (res) {
      var iv = setInterval(function () {
        if (i >= n) {
          clearInterval(iv);
          setTimeout(function () { canvasOn = false; window.__H.ScreenFx.clear(); if (oldEl) oldEl.style.opacity = 0; res(i); }, 900);
          return;
        }
        if (kind !== "none") fire(kind, i);
        i++;
      }, gap);
    });
  };

  window.__frames = function (kind, n, gap) {
    var stamps = [], running = true;
    function tick(t) { if (!running) return; stamps.push(t); requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
    return window.__fire(kind, n, gap).then(function () {
      running = false;
      var d = [], i;
      for (i = 1; i < stamps.length; i++) d.push(stamps[i] - stamps[i - 1]);
      var sorted = d.slice().sort(function (a, b) { return a - b; }), sum = 0, over = 0;
      for (i = 0; i < d.length; i++) { sum += d[i]; if (d[i] > 32) over++; }
      function pct(p) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0; }
      return { fps: Math.round(1000 / (sum / d.length) * 10) / 10, p50: Math.round(pct(0.5) * 100) / 100,
               p95: Math.round(pct(0.95) * 100) / 100, worst: Math.round(sorted[sorted.length - 1] * 100) / 100, over: over };
    });
  };
})();
</script>`;

/* ---------------- CDP (as bench-raster.mjs) ---------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome(profileDir) {
  const flags = GPU
    ? ["--remote-debugging-port=0", "--user-data-dir=" + profileDir, "--hide-scrollbars", "--mute-audio",
       "--autoplay-policy=no-user-gesture-required", "--no-first-run", "--no-default-browser-check",
       "--disable-extensions", "--allow-file-access-from-files", "--force-device-scale-factor=1",
       "--window-size=" + (VW + 20) + "," + (VH + 90), "--window-position=0,0", "about:blank"]
    : ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profileDir, "--disable-gpu",
       "--hide-scrollbars", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--no-first-run",
       "--allow-file-access-from-files", "--force-device-scale-factor=1", "--window-size=" + VW + "," + VH, "about:blank"];
  const child = spawn(CHROME, flags, { stdio: "ignore" });
  reap(child, { label: "bench-screenfx" });
  const portFile = path.join(profileDir, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {
    if (fs.existsSync(portFile)) {
      const t = fs.readFileSync(portFile, "utf8").split("\n");
      if (t[0]) return { child, port: parseInt(t[0], 10) };
    }
    await sleep(100);
  }
  throw new Error("Chrome did not open a debugging port");
}

let onTrace = null;
async function cdp(port) {
  const info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 1; const pending = new Map(); let sid = null;
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    } else if (msg.method === "Page.screencastFrame") {
      send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }, sid).catch(() => {});
    } else if (msg.method === "Tracing.tracingComplete" && onTrace) onTrace(msg.params);
  };
  function send(method, params, session) {
    const i = id++;
    ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId: session }));
    return new Promise((res, rej) => pending.set(i, { res, rej }));
  }
  return { send, setSid: (s) => { sid = s; }, close: () => ws.close() };
}

async function traceStart(client) {
  await client.send("Tracing.start", {
    transferMode: "ReturnAsStream",
    traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "cc"],
                   recordMode: "recordAsMuchAsPossible" },
  });
}
async function traceStop(client) {
  const done = new Promise((res) => { onTrace = res; });
  await client.send("Tracing.end");
  const { stream } = await done;
  onTrace = null;
  let text = "";
  for (;;) {
    const r = await client.send("IO.read", { handle: stream, size: 8 * 1024 * 1024 });
    text += r.base64Encoded ? Buffer.from(r.data, "base64").toString("utf8") : r.data;
    if (r.eof) break;
  }
  await client.send("IO.close", { handle: stream });
  const parsed = JSON.parse(text), events = parsed.traceEvents || parsed;
  let raster = 0, paint = 0;
  for (const e of events) {
    if (e.ph !== "X" || typeof e.dur !== "number") continue;
    if (e.name === "RasterTask") raster += e.dur;
    else if (e.name === "Paint") paint += e.dur;
  }
  return { raster: raster / 1000, paint: paint / 1000 };
}

/* ---------------- run ------------------------------------------------- */

function prepare(tmpDir) {
  let src = fs.readFileSync(path.join(ROOT, "games", slug, "index.html"), "utf8");
  if (!src.includes("var ScreenFx")) throw new Error(slug + ": this build has no ScreenFx — rebuild it");
  const head = src.indexOf("<head>");
  src = src.slice(0, head + 6) + "\n" + SEED_JS + src.slice(head + 6);
  const close = src.lastIndexOf("})();");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);
  src = src.replace("</body>", DRIVER_JS + "\n</body>");
  const out = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(out, src);
  return out;
}

reportSweep(sweep("bench-screenfx-"));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-screenfx-"));
const chrome = await launchChrome(path.join(tmpDir, "profile"));
const client = await cdp(chrome.port);
const t = await client.send("Target.createTarget", { url: "about:blank" });
const at = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
const sid = at.sessionId;
client.setSid(sid);
await client.send("Page.enable", {}, sid);
await client.send("Runtime.enable", {}, sid);
await client.send("Emulation.setDeviceMetricsOverride", { width: VW, height: VH, deviceScaleFactor: DPR, mobile: true }, sid);
if (!GPU) await client.send("Page.startScreencast", { format: "jpeg", quality: 5, maxWidth: 120, maxHeight: 220, everyNthFrame: 1 }, sid);

const ev = async (expr, awaitPromise) => {
  const r = await client.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: !!awaitPromise }, sid);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + JSON.stringify(r.exceptionDetails.exception || ""));
  return r.result ? r.result.value : undefined;
};

await client.send("Page.navigate", { url: "file://" + prepare(tmpDir) + "?first=0" }, sid);
for (let i = 0; i < 200; i++) { await sleep(100); if (await ev("!!window.__fire && !!window.__H")) break; }
for (let i = 0; i < 100; i++) { await sleep(100); if (await ev("window.__ready()")) break; }
await ev("window.__H.Enter && window.__H.Enter.skip && window.__H.Enter.skip()").catch(() => {});
await sleep(1500);

if (GPU) {
  console.log(`${slug} — frame intervals, real window and GPU, ${VW}x${VH} @DPR${DPR}, loop running`);
  console.log(`${N} firings ${GAP} ms apart (held kinds toggle on/off). A regression guard, not a phone.\n`);
  console.log("kind          fps     p50     p95   worst  >32ms");
  for (const kind of ["none"].concat(KINDS)) {
    let best = null;
    for (let i = 0; i < REPEATS; i++) {
      const r = await ev(`window.__frames(${JSON.stringify(kind)}, ${N}, ${GAP})`, true);
      if (!best || r.worst < best.worst) best = r;
    }
    console.log(kind.padEnd(12) + String(best.fps).padStart(5) + String(best.p50).padStart(8) +
      String(best.p95).padStart(8) + String(best.worst).padStart(8) + String(best.over).padStart(7));
  }
} else {
  const measure = async (kind) => { await traceStart(client); await ev(`window.__fire(${JSON.stringify(kind)}, ${N}, ${GAP})`, true); return traceStop(client); };
  const base = [];
  for (let i = 0; i < REPEATS; i++) base.push((await measure("none")).raster);
  const floor = Math.min(...base), spread = Math.max(...base) - floor;
  console.log(`${slug} — raster cost of a full-screen effect, software rasterization, ${VW}x${VH} @DPR${DPR}`);
  console.log(`${N} firings per row, ${GAP} ms apart, loop stopped`);
  console.log(`idle floor ${floor.toFixed(0)} ms, run-to-run spread ${spread.toFixed(0)} ms\n`);
  console.log("kind          raster/firing    total");
  for (const kind of KINDS) {
    const got = [];
    for (let i = 0; i < REPEATS; i++) got.push((await measure(kind)).raster);
    const total = Math.min(...got) - floor;
    console.log(kind.padEnd(12) + ((total / N).toFixed(2) + " ms").padStart(13) + (Math.round(total) + " ms").padStart(9));
  }
}
client.close();
chrome.child.kill("SIGKILL");
process.exit(0);
