#!/usr/bin/env node
/*
  bench-raster — measure, from this desk, the cost a phone actually pays.

  WHY THIS EXISTS. A phone stutters where a desktop does not, and the reason is
  almost never the game's JavaScript: it is the RASTERIZATION of the layers the
  DOM puts on screen — a callout's stroked, shadowed word, a masked gradient
  decor, a blurred full-frame vignette. That work happens off the main thread,
  so it is invisible to a JS profiler, and it is proportional to pixels and to
  the paint operations per pixel. Those two things do not change between a
  laptop and a phone: what changes is how fast the rasterizer chews through
  them. So a gain measured here in raster milliseconds is a gain there — the
  ABSOLUTE numbers do not transfer, the RATIOS do. Read this tool as "this
  change removed 60% of the raster work", never as "this will cost 4 ms on a
  Pixel".

  WHY THE EARLIER ATTEMPTS WERE NOISE, and what is different here:

    * The game loop is STOPPED. A round redrawing its canvas 60 times a second
      swamped the thing being measured. The round is started (so the board is
      full and the layout is real) and then the loop is stopped: nothing paints
      but what the tool fires.
    * The sample is LARGE. Sixty callouts per measurement instead of six. The
      spread between two identical runs is reported on every table, so a
      difference smaller than the spread can be dismissed on sight.
    * A BASELINE of the same duration is measured and subtracted, so what is
      reported is the cost of the callouts and not of the page existing.
    * Rasterization is SOFTWARE (--disable-gpu), which is deterministic and
      proportional to the work. A GPU would hide small differences behind
      scheduling.
    * The viewport is the phone's, so the DOM raster scale is the phone's:
      390x844 at DPR 3 gives 1.625 device px per design px, exactly what the
      device rasterizes at.

  TWO MODES, AND WHY BOTH ARE NEEDED. This tool measured the halftone-dot decor
  at 92% of a `bonus` callout's raster and the blurred text shadows at ~0%.
  The same callout bisected on a real phone said the opposite: dropping the
  blurs took the worst frame from 90 ms to 50, dropping the decor only to 70.
  Neither measurement is wrong — they are different rasterizers. A CPU
  rasterizer pays per pixel, so a 0.3 Mpx gradient dominates; a GPU fills that
  area almost for free and pays for BLUR PASSES and draw calls instead. So:

    default (--cpu-raster)  software rasterization, deterministic, tiny
                            variance. Good for "did this change remove work?"
                            on area-bound things. NOT predictive of a phone.
    --gpu                   a real window, real vsync, real frame intervals.
                            A REGRESSION GUARD, not a measurement: this Mac
                            held 120 fps with a flat 8.3 ms p50 at DPR 5 with
                            four callouts live, so it cannot be saturated into
                            behaving like a phone. What it proves is the
                            negative — a change that makes THIS drop a frame is
                            catastrophic on a device. It opens a window for a
                            few seconds.

  AND THE MEASUREMENT THAT ACTUALLY TRANSFERS IS NOT HERE. Reading the GPU
  process's own trace was tried and thrown out: GPU work is asynchronous, the
  process's task totals double-count nested tasks (9 s of "work" inside a 5 s
  window) and the idle floor moved more than the signal. Chrome exposes no
  per-layer GPU timing. So the phone measures itself: open a game with
  `?perf=bench` and it runs the same variant sweep on the device and prints the
  table. That is the number to trust for anything blur- or draw-call-bound;
  this file is for area-bound work and for the guard above.

  USAGE
    node tools/lab/bench-raster.mjs                      # every hot callout
    node tools/lab/bench-raster.mjs vipera --kinds=score,bonus,ultra
    node tools/lab/bench-raster.mjs --variants=base,glow,face,decor
    node tools/lab/bench-raster.mjs --gpu --variants=base,glow,decor
    node tools/lab/bench-raster.mjs --gpu --dpr=4 --live=3      # amplified
    node tools/lab/bench-raster.mjs --n=90 --gap=180     # bigger sample

  The variants are the same switches the on-device probe exposes as
  `?perf=1&off=…` (see packages/shell/shell.js), so a number measured here and
  a reading taken on a phone are talking about the same layer.
*/

import { spawn } from "node:child_process";
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
const KINDS = opt("kinds", "score,bonus,streak,ultra").split(",");
const VARIANTS = opt("variants", "base").split(",");
const N = parseInt(opt("n", "60"), 10);          // callouts per measurement
const GAP = parseInt(opt("gap", "220"), 10);     // ms between them
const REPEATS = parseInt(opt("repeats", "2"), 10);
const VW = parseInt(opt("vw", "390"), 10);
const VH = parseInt(opt("vh", "844"), 10);
const DPR = parseFloat(opt("dpr", "3"));
const GPU = argv.includes("--gpu");
const LIVE = parseInt(opt("live", "1"), 10);     // callouts fired per tick

/* The same rules the device probe injects, so the two agree by construction. */
const OFF_CSS = {
  base: "",
  glow: ".pop-ltr{text-shadow:0 5px 0 var(--ink),0 10px 0 var(--ink),0 15px 0 var(--ink2)!important}",
  shadow: ".pop-ltr{text-shadow:none!important}",
  stroke: ".pop-ltr{-webkit-text-stroke-width:0!important}",
  face: ".pop-ltr::before{display:none!important}",
  decor: ".pop-d,.pop-d-dash,.pop-d-spark{display:none!important}",
  word: ".pop-ltr{text-shadow:none!important;-webkit-text-stroke-width:0!important}" +
        ".pop-ltr::before{display:none!important}",
  sub: ".pop-sub{display:none!important}",
  bare: ".pop-ltr{text-shadow:none!important;-webkit-text-stroke-width:0!important}" +
        ".pop-ltr::before{display:none!important}" +
        ".pop-d,.pop-d-dash,.pop-d-spark{display:none!important}",
};

/* ---------------- injected page code ---------------------------------- */

const SEED_JS = `<script>(function(){var s=1013904223;Math.random=function(){s=s*16807%2147483647;return (s-1)/2147483646;};})();</script>`;

const HOOK_JS = `
  window.__H = { startGame: startGame, Loop: Loop, Input: Input, Layout: Layout,
    CONFIG: CONFIG, Pop: Pop, Overlay: Overlay, Fx: Fx,
    frameUpdate: frameUpdate, frameRender: frameRender,
    state: function () { return State; } };
`;

const DRIVER_JS = `<script>
(function () {
  /* Bring the board to a realistic state, then FREEZE it: the loop is what
     made every earlier measurement noise. */
  window.__ready = function () {
    var H = window.__H;
    if (!H || H.state() !== "intro") return false;
    H.startGame();
    H.Loop.stop();
    var i, DT = 1 / 60;
    for (i = 0; i < 240; i++) {                 // four seconds of simulation
      if (H.state() !== "playing") H.startGame();
      if (i % 30 === 0) { H.Input.at("down", H.Layout.cx, H.Layout.cy); H.Input.at("up", H.Layout.cx, H.Layout.cy); }
      H.frameUpdate(DT);
    }
    H.frameRender();
    H.Pop.clear(); H.Overlay.clear();
    return true;
  };

  /* GPU mode: the loop keeps running, callouts are fired on a cadence, and
     what is recorded is the FRAME INTERVAL — everything included, the same
     quantity the on-device probe reports. The main thread's share comes from
     the browser's own long-animation-frame report, so a slow frame can be
     attributed without a profiler. */
  window.__frames = function (kind, n, gap, live) {
    var H = window.__H, stamps = [], mainWorst = 0, obs = null;
    try {
      obs = new PerformanceObserver(function (l) {
        var e = l.getEntries();
        for (var i = 0; i < e.length; i++) if (e[i].duration > mainWorst) mainWorst = e[i].duration;
      });
      obs.observe({ type: "long-animation-frame", buffered: false });
    } catch (err) {}

    var running = true;
    function tick(t) { if (!running) return; stamps.push(t); requestAnimationFrame(tick); }
    requestAnimationFrame(tick);

    var fired = 0;
    return new Promise(function (res) {
      var iv = setInterval(function () {
        if (fired++ >= n) {
          clearInterval(iv);
          setTimeout(function () {
            running = false; if (obs) obs.disconnect();
            var d = [], i;
            for (i = 1; i < stamps.length; i++) d.push(stamps[i] - stamps[i - 1]);
            var sorted = d.slice().sort(function (a, b) { return a - b; });
            var over = 0, sum = 0;
            for (i = 0; i < d.length; i++) { sum += d[i]; if (d[i] > 32) over++; }
            function pct(p) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0; }
            res({
              frames: d.length,
              fps: d.length ? Math.round(1000 / (sum / d.length) * 10) / 10 : 0,
              p50: Math.round(pct(0.5) * 100) / 100,
              p95: Math.round(pct(0.95) * 100) / 100,
              worst: Math.round((sorted[sorted.length - 1] || 0) * 100) / 100,
              over: over,
              main: Math.round(mainWorst * 100) / 100
            });
          }, 500);
          return;
        }
        if (kind === "none") return;
        for (var k = 0; k < live; k++) {
          H.Pop.show(kind, { word: "COMBO X5", sub: "+120", silent: true });
        }
      }, gap);
    });
  };

  window.__css = function (text) {
    var el = document.getElementById("bench-css");
    if (!el) { el = document.createElement("style"); el.id = "bench-css"; document.head.appendChild(el); }
    el.textContent = text || "";
  };

  /* Fire N callouts on a fixed cadence. The kind "none" fires nothing, which
     is the baseline subtracted from every other row. */
  window.__fire = function (kind, n, gap) {
    var H = window.__H, i = 0;
    H.Pop.clear();
    return new Promise(function (res) {
      var iv = setInterval(function () {
        if (i++ >= n) { clearInterval(iv); setTimeout(function () { H.Pop.clear(); res(i); }, 260); return; }
        if (kind === "none") return;
        H.Pop.show(kind, { word: "COMBO X5", sub: "+120", silent: true });
      }, gap);
    });
  };
})();
</script>`;

/* ---------------- CDP ------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function reap(child) {
  let done = false;
  const kill = () => { if (!done) { done = true; try { child.kill("SIGKILL"); } catch (e) {} } };
  process.on("exit", kill);
  process.on("SIGINT", () => { kill(); process.exit(130); });
  process.on("SIGTERM", () => { kill(); process.exit(143); });
  process.on("uncaughtException", (e) => { kill(); console.error(e); process.exit(1); });
  process.on("unhandledRejection", (e) => { kill(); console.error(e); process.exit(1); });
}

async function launchChrome(profileDir) {
  /* Headless Chrome only advances animations while something consumes frames,
     and the screencast that does it clamps them to 30 fps — which is why the
     GPU mode uses a real window instead: vsync, the compositor and the GPU
     process all behave, and a frame interval means what it says. */
  const flags = GPU
    ? ["--remote-debugging-port=0", "--user-data-dir=" + profileDir,
       "--hide-scrollbars", "--mute-audio", "--autoplay-policy=no-user-gesture-required",
       "--no-first-run", "--no-default-browser-check", "--disable-extensions",
       "--force-device-scale-factor=1", "--window-size=" + (VW + 20) + "," + (VH + 90),
       "--window-position=0,0", "about:blank"]
    : ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profileDir,
       "--disable-gpu", "--hide-scrollbars", "--mute-audio",
       "--autoplay-policy=no-user-gesture-required", "--no-first-run",
       "--force-device-scale-factor=1", "--window-size=" + VW + "," + VH, "about:blank"];
  const child = spawn(CHROME, flags, { stdio: "ignore" });
  reap(child);
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

const TRACE_CATEGORIES = ["devtools.timeline", "disabled-by-default-devtools.timeline", "cc"];

async function traceStart(client) {
  await client.send("Tracing.start", {
    transferMode: "ReturnAsStream",
    traceConfig: { includedCategories: TRACE_CATEGORIES, recordMode: "recordAsMuchAsPossible" },
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
  const parsed = JSON.parse(text);
  const events = parsed.traceEvents || parsed;
  const threads = new Map();
  for (const e of events) if (e.ph === "M" && e.name === "thread_name") threads.set(e.pid + ":" + e.tid, e.args.name);
  let raster = 0, paint = 0, gpu = 0;
  const byName = new Map();
  for (const e of events) {
    if (e.ph !== "X" || typeof e.dur !== "number") continue;
    if (e.name === "RasterTask") raster += e.dur;
    else if (e.name === "Paint" || e.name === "PrePaint") paint += e.dur;
    const th = threads.get(e.pid + ":" + e.tid) || "";
    /* Everything the GPU process and the display compositor actually did. */
    if (/CrGpuMain|VizCompositor|GpuMemory/.test(th)) {
      gpu += e.dur;
      byName.set(e.name, (byName.get(e.name) || 0) + e.dur);
    }
  }
  const top = [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([n, v]) => n + ":" + Math.round(v / 1000));
  return { raster: raster / 1000, paint: paint / 1000, gpu: gpu / 1000, top };
}

/* ---------------- run ------------------------------------------------- */

function prepare(tmpDir) {
  let src = fs.readFileSync(path.join(ROOT, "games", slug, "index.html"), "utf8");
  const head = src.indexOf("<head>");
  if (head < 0) throw new Error(slug + ": no <head>");
  src = src.slice(0, head + 6) + "\n" + SEED_JS + src.slice(head + 6);
  const close = src.lastIndexOf("})();");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);
  src = src.replace("</body>", DRIVER_JS + "\n</body>");
  const out = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(out, src);
  return out;
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-raster-"));
const chrome = await launchChrome(path.join(tmpDir, "profile"));
const client = await cdp(chrome.port);
const t = await client.send("Target.createTarget", { url: "about:blank" });
const at = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
const sid = at.sessionId;
client.setSid(sid);
await client.send("Page.enable", {}, sid);
await client.send("Runtime.enable", {}, sid);
await client.send("Emulation.setDeviceMetricsOverride",
  { width: VW, height: VH, deviceScaleFactor: DPR, mobile: true }, sid);
await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 }, sid);
/* Only the headless mode needs the screencast to make frames happen at all;
   in GPU mode it would clamp them, which is the thing being measured. */
if (!GPU) {
  await client.send("Page.startScreencast",
    { format: "jpeg", quality: 5, maxWidth: 120, maxHeight: 220, everyNthFrame: 1 }, sid);
}

const ev = async (expr, awaitPromise) => {
  const r = await client.send("Runtime.evaluate",
    { expression: expr, returnByValue: true, awaitPromise: !!awaitPromise }, sid);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result ? r.result.value : undefined;
};

await client.send("Page.navigate", { url: "file://" + prepare(tmpDir) }, sid);
for (let i = 0; i < 200; i++) { await sleep(100); if (await ev("!!window.__fire && !!window.__H")) break; }
/* The CPU mode freezes the board; the GPU mode is measuring the real thing, so
   it starts a round and leaves the loop running. */
if (GPU) {
  for (let i = 0; i < 100; i++) {
    await sleep(100);
    if (await ev("(function(){var H=window.__H;if(!H||H.state()!=='intro')return H&&H.state()==='playing';H.startGame();return true})()")) break;
  }
  await sleep(1500);
} else {
  for (let i = 0; i < 100; i++) { await sleep(100); if (await ev("window.__ready()")) break; }
}

async function measure(kind, css) {
  await ev(`window.__css(${JSON.stringify(css)})`);
  await sleep(150);
  await traceStart(client);
  await ev(`window.__fire(${JSON.stringify(kind)}, ${N}, ${GAP})`, true);
  return traceStop(client);
}

if (GPU) {
  const run = async (kind, css) => {
    await ev(`window.__css(${JSON.stringify(css)})`);
    await sleep(400);
    return ev(`window.__frames(${JSON.stringify(kind)}, ${N}, ${GAP}, ${LIVE})`, true);
  };

  console.log(`${slug} — frame intervals, real window and real GPU, ${VW}x${VH} @DPR${DPR}` +
    (LIVE > 1 ? `, ${LIVE} callouts per tick` : ""));
  console.log(`${N} ticks ${GAP}ms apart, loop running. This is a regression guard:` +
    ` this desk\ncannot be saturated into a phone's budget (see the header).\n`);
  console.log("kind        variant       fps     p50     p95   worst  >32ms    main");
  for (const kind of KINDS) {
    for (const v of VARIANTS) {
      if (OFF_CSS[v] == null) throw new Error("unknown variant: " + v);
      let best = null;
      for (let i = 0; i < REPEATS; i++) {
        const r = await run(kind, OFF_CSS[v]);
        if (!best || r.worst < best.worst) best = r;      // the calmest run
      }
      console.log(kind.padEnd(12) + v.padEnd(12) +
        String(best.fps).padStart(7) + String(best.p50).padStart(8) +
        String(best.p95).padStart(8) + String(best.worst).padStart(8) +
        String(best.over).padStart(7) + String(best.main).padStart(8));
    }
  }
  console.log("\nA flat table here means nothing was made worse. It does NOT mean" +
    "\na change helped: measure that on the device with ?perf=bench.");

  client.close();
  chrome.child.kill("SIGKILL");
  process.exit(0);
}

/* The baseline is the same window with nothing fired: the page, the frozen
   canvas and the screencast still cost something, and it is not the callout's. */
const base = [];
for (let i = 0; i < REPEATS; i++) base.push((await measure("none", "")).raster);
const floor = Math.min.apply(null, base);
const spread = Math.max.apply(null, base) - floor;

console.log(`${slug} — raster cost of one callout, software rasterization`);
console.log(`${VW}x${VH} @DPR${DPR} (${(Math.round(Math.min(VW / 720, VH / 1280) * DPR * 1000) / 1000)} device px per design px, the phone's own scale)`);
console.log(`${N} callouts per measurement, ${GAP}ms apart, loop stopped`);
console.log(`idle floor ${floor.toFixed(0)} ms over the window, run-to-run spread ${spread.toFixed(0)} ms\n`);
console.log("kind        variant     raster/callout    total   vs base");

const rows = [];
for (const kind of KINDS) {
  let ref = null;
  for (const v of VARIANTS) {
    if (OFF_CSS[v] == null) throw new Error("unknown variant: " + v);
    const got = [];
    for (let i = 0; i < REPEATS; i++) got.push((await measure(kind, OFF_CSS[v])).raster);
    const total = Math.min.apply(null, got) - floor;
    const per = total / N;
    if (v === VARIANTS[0]) ref = per;
    rows.push({ kind, variant: v, per, total });
    console.log(kind.padEnd(12) + v.padEnd(12) +
      (per.toFixed(2) + " ms").padStart(12) +
      (Math.round(total) + " ms").padStart(9) +
      (ref && v !== VARIANTS[0] ? ("  " + (per / ref * 100 - 100).toFixed(0) + "%").padStart(9) : ""));
  }
}

fs.writeFileSync(path.join(tmpDir, "rows.json"), JSON.stringify(rows, null, 2));
console.log("\nrows: " + path.join(tmpDir, "rows.json"));
client.close();
chrome.child.kill("SIGKILL");
process.exit(0);
