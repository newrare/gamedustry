#!/usr/bin/env node
/* bench-pop — what a callout actually costs, measured instead of guessed.
 *
 * A built game is opened in headless Chrome emulating a phone (390x844 at
 * DPR 3, touch), a scripted pilot keeps a round alive, and then one Pop style
 * (or one Overlay effect) is fired over and over while Chrome's own tracing
 * records the work it produced. Every duration is summed per name, in ms of
 * CPU time over the run.
 *
 * Read the `raster` column first. The frame cadence CANNOT be measured here:
 * headless drives requestAnimationFrame off the screencast, which clamps it to
 * 30 fps unthrottled and ~8 fps at CPU x4, so a rAF delta says nothing. Raster
 * is where a callout's cost lands anyway — it is off the main thread, it never
 * shows up in a profile of the game loop, and it is exactly what a phone runs
 * out of while a desktop absorbs it.
 *
 * This runs on a Mac with software rasterization, so the absolute numbers are
 * not a phone's. Ratios are what to read: 4 ms for a bare gameplay window
 * against 2575 ms for a callout is a mechanism, not a measurement error.
 *
 * Usage:
 *   node tools/lab/bench-pop.mjs                       # every style, vipera
 *   node tools/lab/bench-pop.mjs orbinity --styles=none,combo,ultra
 *   node tools/lab/bench-pop.mjs --styles=ribbon,ribbon --variants=base,flat
 *   node tools/lab/bench-pop.mjs --shot=ribbon --out=/tmp   # eyeball one
 *   node tools/lab/bench-pop.mjs --dprs=1,2,3               # the canvas sizing
 *
 * A style name may be repeated: the run-to-run spread is real (first-time
 * raster of a layer, font caches), so a finding worth acting on is one that
 * survives a repeat.
 *
 * `--variants` switches parts of the callout off through injected CSS, which
 * is how a cost is attributed to a layer rather than to a style: `nomove`
 * stops the scrolling decors, `noshadow` / `nostroke` / `noface` strip the
 * word's three glyph layers, `nodecor` removes the decor entirely, `flat` is
 * all of them. `none` as a style is the control: gameplay, no callout.
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
const STYLES = opt("styles", "none,score,alert,combo,streak,ribbon,perfect,ultra,manifest,danger,toast,banner").split(",");
const VARIANTS = opt("variants", "base").split(",");
const CPU = parseFloat(opt("cpu", "4"));
const MS = parseInt(opt("ms", "2600"), 10);
const EVERY = parseInt(opt("every", "650"), 10);
const DPR = parseFloat(opt("dpr", "3"));
const VW = parseInt(opt("vw", "390"), 10);
/* --dprs reports the canvas backing store the motor would allocate on a device
   with each of those pixel ratios, next to what such a screen can actually
   show. It deliberately reports SIZES and not timings: canvas 2D commands are
   recorded and rasterized later, so timing frameRender() in the page measures
   nothing, and the trace's raster figure for a canvas is too noisy in this
   harness to conclude anything from. The sizes are the point anyway — pixels
   drawn beyond what the display shows are waste whatever they cost. */
const DPRS = opt("dprs", null);
const VH = parseInt(opt("vh", "844"), 10);

const CSS = {
  base: "",
  noshadow: ".pop-ltr{text-shadow:none!important}",
  nostroke: ".pop-ltr{-webkit-text-stroke-width:0!important}",
  noface: ".pop-ltr::before{display:none!important}",
  nowc: ".pop-out,.pop-anim,.pop-word{will-change:auto!important}",
  nodecor: ".pop-d,.pop-d-dash,.pop-d-spark{display:none!important}",
  novig: "#ov-vignette{box-shadow:none!important}",
  /* Candidate replacements for the vignette's blurred inset shadow, which is
     repainted on every call because the colour is assigned per call. */
  viggrad: "#ov-vignette{box-shadow:none!important;" +
    "background:radial-gradient(ellipse at center,transparent 42%,var(--vig,rgba(0,229,255,.85)) 130%)!important}",
  vigsmall: "#ov-vignette{box-shadow:inset 0 0 60px 18px var(--vig,rgba(0,229,255,.85))!important}",
  nowc: ".pop-out,.pop-anim,.pop-word{will-change:auto!important}",
  nodecor: ".pop-d,.pop-d-dash,.pop-d-spark{display:none!important}",
  novig: "#ov-vignette{box-shadow:none!important}",
  /* Candidate replacements for the vignette's blurred inset shadow, which is
     repainted on every call because the colour is assigned per call. */
  viggrad: "#ov-vignette{box-shadow:none!important;" +
    "background:radial-gradient(ellipse at center,transparent 42%,var(--vig,rgba(0,229,255,.85)) 130%)!important}",
  vigsmall: "#ov-vignette{box-shadow:inset 0 0 60px 18px var(--vig,rgba(0,229,255,.85))!important}",
  oldlook: ".pop-d-lines::before,.pop-d-stripes::before,.pop-d-chevrons::before{display:none!important}" +
    ".pop-d-lines{background:repeating-linear-gradient(90deg,rgba(255,255,255,.20) 0 5px,transparent 5px 17px)!important}" +
    ".pop-d-stripes{background:repeating-linear-gradient(-45deg,#ffd400 0 30px,#141020 30px 60px)!important}" +
    ".pop-d-chevrons{background:repeating-linear-gradient(90deg,var(--burst) 0 22px,transparent 22px 52px)!important}",
  nomove: ".pop-d-lines,.pop-d-tape,.pop-d-stripes,.pop-d-chevrons{animation:none!important}",
  nosparks: ".pop-d-spark{display:none!important}",
  nomask: ".pop-d-rays,.pop-d-dots,.pop-d-lines{-webkit-mask-image:none!important;mask-image:none!important}",
  flat: ".pop-ltr{text-shadow:none!important;-webkit-text-stroke-width:0!important}" +
        ".pop-ltr::before{display:none!important}" +
        ".pop-d,.pop-d-dash,.pop-d-spark{display:none!important}",
};

/* ---------- injected page code ------------------------------------------ */

const SEED_JS = `<script>(function(){var s=1013904223;Math.random=function(){s=s*16807%2147483647;return (s-1)/2147483646;};})();</script>`;

const HOOK_JS = `
  window.__H = { startGame: startGame, Loop: Loop, Input: Input, Layout: Layout,
    CONFIG: CONFIG, Beat: Beat, Pop: Pop, Overlay: Overlay, Fx: Fx,
    HUD: HUD, Sound: Sound, ASSETS: ASSETS,
    endRound: endRound, state: function () { return State; } };
`;

const BENCH_JS = `<script>
(function () {
  var stamps = [], loaf = [], rec = false, side = 0, lastBeat = -1, n = 0;

  try {
    new PerformanceObserver(function (l) {
      if (!rec) return;
      l.getEntries().forEach(function (e) {
        loaf.push({ d: e.duration, b: e.blockingDuration,
          sl: e.styleAndLayoutStart ? (e.startTime + e.duration - e.styleAndLayoutStart) : 0,
          rs: e.renderStart ? (e.startTime + e.duration - e.renderStart) : 0 });
      });
    }).observe({ type: "long-animation-frame", buffered: false });
  } catch (err) {}

  function tick(t) { if (rec) stamps.push(t); requestAnimationFrame(tick); }
  requestAnimationFrame(tick);

  /* Keep a round alive so the callouts land over real gameplay. */
  var paused = false;
  function pilot() {
    var H = window.__H; if (!H || paused) return;
    if (H.state() !== "playing") { H.startGame(); return; }
    var L = H.Layout, demo = (H.CONFIG.intro && H.CONFIG.intro.demo) || "tap";
    n++;
    if (demo === "swipe") { if (n % 36 === 0) H.Input.swipe(n % 72 === 0 ? 1 : -1); return; }
    if (demo === "hold") {
      if (n % 48 === 0) H.Input.at("down", (side++ % 2) ? L.left + L.w * 0.25 : L.right - L.w * 0.25, L.cy);
      else if (n % 48 === 30) H.Input.at("up", L.cx, L.cy);
      return;
    }
    if (demo === "drag" || demo === "aim") {
      var k = n % 42, ax = L.cx, ay = L.bottom - L.h * 0.12;
      var tx = L.left + L.w * (0.2 + 0.6 * Math.abs(Math.sin(n * 0.07))), ty = L.top + L.h * 0.25;
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
  setInterval(pilot, 1000 / 60);

  /* The pieces a game runs on a single pickup, one at a time, then together:
     that is the beat the player says feels heavy. */
  function fire(kind) {
    var H = window.__H;
    if (kind === "none") return;
    if (kind === "hudpunch") { H.HUD.punch("#ffffff"); return; }
    if (kind === "hudpill") { H.HUD.setLeft(String(n % 99), "LENGTH"); return; }
    if (kind === "hudscore") { H.HUD.setScore(n * 7); return; }
    if (kind === "sfx") {
      var keys = Object.keys(H.ASSETS.sounds || {});
      for (var i = 0; i < keys.length; i++) if (keys[i] !== "music") { H.Sound.clip(keys[i], .6, 1); return; }
      return;
    }
    if (kind === "event") {                       // the whole pickup beat
      var ks = Object.keys(H.ASSETS.sounds || {});
      for (var j = 0; j < ks.length; j++) if (ks[j] !== "music") { H.Sound.clip(ks[j], .6, 1); break; }
      H.HUD.setScore(n * 7); H.HUD.punch("#ffffff"); H.HUD.setLeft(String(n % 99), "LENGTH");
      H.Fx.burst(H.Layout.cx, H.Layout.cy, 10, "#ffffff");
      H.Pop.show("score", { word: "+" + (n * 7), at: { x: H.Layout.cx, y: H.Layout.cy - 60 } });
      return;
    }
    if (kind === "toast") { H.Overlay.toast("+120", 900); return; }
    if (kind === "vignette") {
      var col = n % 2 ? "rgba(255,60,60,.85)" : "rgba(60,140,255,.85)";
      document.documentElement.style.setProperty("--vig", col);   // for the variants
      H.Overlay.vignette(col, 1, 420); return;
    }
    if (kind === "pickup") {                      // vipera's own tier-up beat
      var c = n % 2 ? "rgba(141,255,191,.9)" : "rgba(255,212,59,.9)";
      document.documentElement.style.setProperty("--vig", c);
      H.Pop.show("bonus", { word: "ADDER", sub: "EVOLVED" });
      H.Overlay.vignette(c, 1, 620);
      H.Fx.flash(c, 0.22);
      H.Fx.ring(H.Layout.cx, H.Layout.cy, { from: 24, to: 210, color: c, width: 8, life: 0.5 });
      H.Fx.burst(H.Layout.cx, H.Layout.cy, { color: [c, "#ffffff"], count: 24, speed: 420, life: 0.55, size: 6 });
      return;
    }
    if (kind === "shake") { H.Fx.shake(12, 0.3); return; }
    if (kind === "flash") { H.Fx.flash("#ffffff", 0.5); return; }
    if (kind === "end") {
      paused = true;
      H.endRound({ title: "NICE RUN", variant: "win", score: 1234, stars: 3,
        rows: [{ label: "BEST", value: "2100" }, { label: "GEMS", value: "18" },
               { label: "COMBO", value: "x7" }] });
      return;
    }
    if (kind === "banner") { H.Overlay.banner("COMBO", "x5", 900); return; }
    H.Pop.show(kind, { word: "COMBO X5", sub: "+120" });
  }

  function pct(a, p) { return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : 0; }

  window.__bench = {
    ready: function () { return !!window.__H && window.__H.state() === "playing"; },
    start: function () { var H = window.__H; if (H.state() !== "playing") H.startGame(); },
    dpr: function (v) {
      var _ = v;
      try { Object.defineProperty(window, "devicePixelRatio", { value: v, configurable: true }); } catch (e) {}
      window.dispatchEvent(new Event("resize"));
      var c = document.getElementById("game");
      /* What the display shows is the canvas's CSS box (the frame is scaled
         and letterboxed, so it is NOT the viewport) times the device ratio. */
      var r = c.getBoundingClientRect();
      return JSON.stringify({ store: c.width + "x" + c.height,
        mpx: Math.round(c.width * c.height / 1e4) / 100,
        shown: Math.round(r.width * v) + "x" + Math.round(r.height * v),
        shownMpx: Math.round(r.width * v * r.height * v / 1e4) / 100 });
    },
    css: function (text) {
      var el = document.getElementById("bench-css");
      if (!el) { el = document.createElement("style"); el.id = "bench-css"; document.head.appendChild(el); }
      el.textContent = text || "";
    },
    run: function (kind, ms, every) {
      var H = window.__H;
      H.Pop.clear(); H.Overlay.clear();
      return new Promise(function (res) {
        setTimeout(function () {
          stamps = []; loaf = []; rec = true;
          var iv = setInterval(function () { fire(kind); }, every);
          fire(kind);
          setTimeout(function () {
            rec = false; clearInterval(iv);
            H.Pop.clear(); H.Overlay.clear();
            if (paused) { paused = false; H.startGame(); }
            var d = [], i;
            for (i = 1; i < stamps.length; i++) d.push(stamps[i] - stamps[i - 1]);
            var sorted = d.slice().sort(function (a, b) { return a - b; });
            var long = 0, huge = 0, blocking = 0, styleLayout = 0, render = 0;
            for (i = 0; i < d.length; i++) { if (d[i] > 32) long++; if (d[i] > 60) huge++; }
            for (i = 0; i < loaf.length; i++) {
              blocking += loaf[i].b; styleLayout += loaf[i].sl; render += loaf[i].rs;
            }
            res({
              kind: kind, frames: d.length,
              fps: d.length ? Math.round(1000 / (d.reduce(function (a, b) { return a + b; }, 0) / d.length) * 10) / 10 : 0,
              p50: Math.round(pct(sorted, 0.5) * 10) / 10,
              p95: Math.round(pct(sorted, 0.95) * 10) / 10,
              max: Math.round((sorted[sorted.length - 1] || 0) * 10) / 10,
              long: long, huge: huge,
              loaf: loaf.length,
              blocking: Math.round(blocking),
              render: Math.round(render),
              styleLayout: Math.round(styleLayout)
            });
          }, ms);
        }, 260);
      });
    }
  };
})();
</script>`;

/* ---------- CDP ---------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchChrome(profileDir) {
  const child = spawn(CHROME, [
    "--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profileDir,
    "--disable-gpu", "--hide-scrollbars", "--mute-audio",
    "--autoplay-policy=no-user-gesture-required", "--no-first-run",
    "--force-device-scale-factor=1", "--window-size=" + VW + "," + VH, "about:blank",
  ], { stdio: "ignore" });
  const portFile = path.join(profileDir, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {
    if (fs.existsSync(portFile)) {
      const txt = fs.readFileSync(portFile, "utf8").split("\n");
      if (txt[0]) return { child, port: parseInt(txt[0], 10) };
    }
    await sleep(100);
  }
  child.kill();
  throw new Error("Chrome did not open a debugging port");
}

async function cdp(port) {
  const info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let nextId = 1; const pending = new Map(); let onEvent = null;
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    } else if (msg.method && onEvent) onEvent(msg);
  };
  return {
    send: (method, params, sessionId) => {
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
      return new Promise((res, rej) => pending.set(id, { res, rej }));
    },
    set on(fn) { onEvent = fn; },
    close: () => ws.close(),
  };
}

async function openPage(client) {
  const t = await client.send("Target.createTarget", { url: "about:blank" });
  const a = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
  const sid = a.sessionId;
  await client.send("Page.enable", {}, sid);
  await client.send("Runtime.enable", {}, sid);
  await client.send("Emulation.setDeviceMetricsOverride",
    { width: VW, height: VH, deviceScaleFactor: DPR, mobile: true }, sid);
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 }, sid);
  client.on = (msg) => {
    if (msg.method === "Page.screencastFrame")
      client.send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }, sid).catch(() => {});
    else if (msg.method === "Tracing.tracingComplete" && onTrace) onTrace(msg.params);
  };
  await client.send("Page.startScreencast",
    { format: "jpeg", quality: 5, maxWidth: 120, maxHeight: 220, everyNthFrame: 1 }, sid);
  return sid;
}

async function evaluate(client, sid, expression, awaitPromise) {
  const r = await client.send("Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: !!expression && !!awaitPromise }, sid);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + JSON.stringify(r.exceptionDetails.exception || {}));
  return r.result ? r.result.value : undefined;
}

/* ---------- tracing -----------------------------------------------------
   The frame cadence cannot be measured here: headless drives rAF off the
   screencast, which clamps it to 30 fps unthrottled and ~8 fps at CPU x4. So
   measure the WORK instead — every trace event with a duration, summed per
   name and per thread. Raster is what a phone GPU/CPU actually chokes on and
   it never shows up in a rAF delta. -------------------------------------- */

let onTrace = null;

const TRACE_CATEGORIES = [
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
  "blink",
  "cc",
];

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
  return parsed.traceEvents || parsed;
}

/* Sum the durations that matter, in milliseconds of CPU time. */
const WATCH = ["RasterTask", "Paint", "PrePaint", "UpdateLayoutTree", "Layout",
  "Layerize", "Commit", "ScheduledAction::execute", "FunctionCall", "TimerFire",
  "PaintOp", "ImageDecodeTask", "RunTask"];

function summarize(events) {
  const byName = new Map();
  const threadNames = new Map();
  for (const e of events) {
    if (e.ph === "M" && e.name === "thread_name") threadNames.set(e.tid, e.args.name);
  }
  const byThread = new Map();
  for (const e of events) {
    if (typeof e.dur !== "number" || e.ph !== "X") continue;
    byName.set(e.name, (byName.get(e.name) || 0) + e.dur);
    const th = threadNames.get(e.tid) || String(e.tid);
    if (e.name === "RunTask" || e.name === "RasterTask" || e.name === "ThreadControllerImpl::RunTask")
      byThread.set(th, (byThread.get(th) || 0) + e.dur);
  }
  /* Only the four reported below are trustworthy: a per-thread total of
     RunTask double-counts nested tasks, so it is kept out of the table and
     out of any conclusion. BENCH_DEBUG=1 prints the raw top names instead. */
  const out = { raster: 0, paint: 0, style: 0, layout: 0, commit: 0, main: 0, rasterThreads: 0 };
  const us = (n) => (byName.get(n) || 0);
  out.raster = us("RasterTask") / 1000;
  out.paint = (us("Paint") + us("PrePaint")) / 1000;
  out.style = us("UpdateLayoutTree") / 1000;
  out.layout = us("Layout") / 1000;
  out.commit = us("Commit") / 1000;
  for (const [th, v] of byThread) {
    if (/CrRendererMain/.test(th)) out.main += v / 1000;
    else if (/Raster|Compositor.?Tile/i.test(th)) out.rasterThreads += v / 1000;
  }
  out.top = [...byName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([n, v]) => n + ":" + Math.round(v / 1000));
  return out;
}

function prepare(slug, tmpDir) {
  let src = fs.readFileSync(path.join(ROOT, "games", slug, "index.html"), "utf8");
  const head = src.indexOf("<head>");
  src = src.slice(0, head + 6) + "\n" + SEED_JS + src.slice(head + 6);
  const close = src.lastIndexOf("})();");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);
  src = src.replace("</body>", BENCH_JS + "\n</body>");
  const out = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(out, src);
  return out;
}

/* ---------- run ---------------------------------------------------------- */

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

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-pop-"));
const chrome = await launchChrome(path.join(tmpDir, "profile"));
reap(chrome.child);
const client = await cdp(chrome.port);
const sid = await openPage(client);
const file = prepare(slug, tmpDir);

await client.send("Page.navigate", { url: "file://" + file }, sid);
for (let i = 0; i < 200; i++) {
  await sleep(100);
  if (await evaluate(client, sid, "!!window.__bench && !!window.__H")) break;
}
await evaluate(client, sid, "window.__bench.start()");
await sleep(1200);
await client.send("Emulation.setCPUThrottlingRate", { rate: CPU }, sid);

const SHOT = opt("shot", null);
if (SHOT) {
  const outDir = opt("out", ".");
  for (const v of VARIANTS) {
    await evaluate(client, sid, `window.__bench.css(${JSON.stringify(CSS[v])})`);
    for (const st of SHOT.split(",")) {
      await evaluate(client, sid,
        `window.__H.Pop.clear();window.__H.Pop.show(${JSON.stringify(st)},{word:"COMBO X5",sub:"+120",hold:-1})`);
      await sleep(900);
      const res = await client.send("Page.captureScreenshot", { format: "png" }, sid);
      const f = path.join(outDir, `pop-${st}-${v}.png`);
      fs.writeFileSync(f, Buffer.from(res.data, "base64"));
      console.log(f);
    }
  }
  client.close(); chrome.child.kill("SIGKILL"); process.exit(0);
}

console.log(`${slug} — ${VW}x${VH} @DPR${DPR}, CPU x${CPU}, ${MS}ms per run, one callout every ${EVERY}ms`);
if (!DPRS) console.log("ms of CPU time over the run — raster is off the main thread, the other three are on it\n");
if (!DPRS) console.log("variant   style      raster   paint   style  layout");

const rows = [];
const n = (v) => String(Math.round(v)).padStart(7);

if (DPRS) {
  console.log(`canvas backing store on a ${VW}x${VH} viewport, by device pixel ratio\n`);
  console.log("dpr    backing store          shown by the screen      drawn / shown");
  for (const d of DPRS.split(",")) {
    const r = JSON.parse(await evaluate(client, sid, `window.__bench.dpr(${d})`));
    console.log(String(d).padEnd(7) + (r.store + " (" + r.mpx + " Mpx)").padEnd(23) +
      (r.shown + " (" + r.shownMpx + " Mpx)").padEnd(25) +
      Math.round(r.mpx / r.shownMpx * 100) + "%");
  }
  client.close(); chrome.child.kill("SIGKILL"); process.exit(0);
}

for (const v of VARIANTS) {
  if (CSS[v] == null) throw new Error("unknown variant: " + v);
  await evaluate(client, sid, `window.__bench.css(${JSON.stringify(CSS[v])})`);
  for (const st of STYLES) {
    await traceStart(client);
    const r = await evaluate(client, sid,
      `window.__bench.run(${JSON.stringify(st)}, ${MS}, ${EVERY})`, true);
    const t = summarize(await traceStop(client));
    r.variant = v; r.trace = t;
    rows.push(r);
    console.log(v.padEnd(9) + st.padEnd(10) +
      n(t.raster) + n(t.paint) + n(t.style) + n(t.layout));
    if (process.env.BENCH_DEBUG) console.log("          " + t.top.join(" "));
  }
}

fs.writeFileSync(path.join(tmpDir, "rows.json"), JSON.stringify(rows, null, 2));
console.log("\nrows: " + path.join(tmpDir, "rows.json"));
client.close();
chrome.child.kill("SIGKILL");
await sleep(400);
