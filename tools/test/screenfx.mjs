#!/usr/bin/env node
/* screenfx — the contract of the full-screen effects, and every game still
 * playing with them, asserted against real builds.
 *
 * Same family as views.mjs: no runner, a headless Chrome over the DevTools
 * protocol, an assertion where a lab page would have a screenshot. Two parts.
 *
 * THE CONTRACT (one game, plus holepocalypse for an adopted frame):
 *   the layer stands in #frame right before #overlay, under the HUD, inert
 *   play() is up, then gone after in + hold + out
 *   hold() stays, release() takes it away, active() says which
 *   a frame the game adopted is painted; one it did not is its edge
 *   danger flashes exactly twice and is gone
 *   Overlay.vignette draws through ScreenFx.glow and keeps its contract
 *     (the alpha it is given, the .5 s ease, `ms` turning it off), and the
 *     old blurred node is never painted again
 *   a round that ends takes every effect with it
 *
 * THE SMOKE (every game): its playable build loads, a round starts, a blind
 * pilot taps and drags for a few seconds while every preset and a vignette
 * are fired over it, and NOT ONE exception is thrown. It is the regression
 * guard for a game's sources being moved onto ScreenFx: a call left half
 * rewritten throws here before anyone opens the game.
 *
 * Usage:
 *   node tools/test/screenfx.mjs              # contract + every game
 *   node tools/test/screenfx.mjs vipera pawko # contract + those games
 *   node tools/test/screenfx.mjs --contract   # the contract alone
 *
 * It tests the committed playables (games/<slug>/index.html): run
 * `node tools/update.mjs` first so they match their sources.
 */

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reap, sweep, reportSweep } from "../lab/chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const args = process.argv.slice(2);
const CONTRACT_ONLY = args.includes("--contract");
const ALL = fs.readdirSync(path.join(ROOT, "games")).filter((g) =>
  fs.existsSync(path.join(ROOT, "games", g, "index.html"))).sort();
const ONLY = args.filter((a) => !a.startsWith("--"));
const GAMES = ONLY.length ? ONLY : ALL;
const PLAY_MS = 4000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function ok(cond, msg) {
  if (cond) console.log("  ok    " + msg);
  else { failures++; console.log("  FAIL  " + msg); }
}

/* ---------- the page under test ------------------------------------------ */

const HOOK_JS = `
  window.__T = { startGame: startGame, Loop: Loop, Input: Input, Layout: Layout,
    Overlay: Overlay, ScreenFx: ScreenFx, Enter: Enter, endRound: endRound,
    CONFIG: CONFIG, state: function () { return State; } };
`;

function prepare(tmpDir, slug, file) {
  let src = fs.readFileSync(file || path.join(ROOT, "games", slug, "index.html"), "utf8");
  if (!src.includes("var ScreenFx")) throw new Error(slug + ": its build has no ScreenFx — run node tools/update.mjs");
  if (file) { const out = path.join(tmpDir, slug + ".html"); fs.writeFileSync(out, src); return out; }   // a web build: __WEB__ is the handle
  const close = src.lastIndexOf("})();");
  src = src.slice(0, close) + HOOK_JS + src.slice(close);
  const out = path.join(tmpDir, slug + ".html");
  fs.writeFileSync(out, src);
  return out;
}

/* ---------- CDP ---------------------------------------------------------- */

async function launchChrome(profileDir) {
  const child = spawn(CHROME, [
    "--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profileDir,
    "--disable-gpu", "--hide-scrollbars", "--mute-audio", "--allow-file-access-from-files",
    "--autoplay-policy=no-user-gesture-required", "--no-first-run",
    "--force-device-scale-factor=1", "--window-size=390,844", "about:blank"
  ], { stdio: "ignore" });
  reap(child, { label: "test-screenfx" });
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

async function cdp(port) {
  const info = await (await fetch("http://127.0.0.1:" + port + "/json/version")).json();
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 1; const pending = new Map(); let sid = null; const errors = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    } else if (msg.method === "Page.screencastFrame") {
      send("Page.screencastFrameAck", { sessionId: msg.params.sessionId }, sid).catch(() => {});
    } else if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      errors.push((d.exception && d.exception.description || d.text || "").split("\n").slice(0, 3).join(" | "));
    }
  };
  function send(method, params, session) {
    const i = id++;
    const msg = { id: i, method, params: params || {} };
    const on = session === undefined ? sid : session;
    if (on) msg.sessionId = on;
    ws.send(JSON.stringify(msg));
    return new Promise((res, rej) => pending.set(i, { res, rej }));
  }
  return { send, setSid: (s) => { sid = s; }, errors, close: () => ws.close() };
}

reportSweep(sweep("test-screenfx-"));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-screenfx-"));
const chrome = await launchChrome(path.join(tmpDir, "profile"));
const client = await cdp(chrome.port);
const t = await client.send("Target.createTarget", { url: "about:blank" }, null);
const at = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true }, null);
client.setSid(at.sessionId);
await client.send("Page.enable");
await client.send("Runtime.enable");
await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
/* headless Chrome only advances animations while frames are consumed */
await client.send("Page.startScreencast", { format: "jpeg", quality: 5, maxWidth: 80, maxHeight: 160, everyNthFrame: 1 });

const ev = async (expr) => {
  const r = await client.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || ""));
  return r.result ? r.result.value : undefined;
};

/* load a game and bring it to a running round, its entrance skipped */
async function open(slug) {
  client.errors.length = 0;
  await client.send("Page.navigate", { url: "file://" + prepare(tmpDir, slug) + "?first=0" });
  for (let i = 0; i < 150; i++) {
    await sleep(100);
    if (await ev("!!(window.__T && window.__T.state() === 'intro')").catch(() => false)) break;
  }
  await ev("window.__T.startGame()");
  await sleep(300);
  await ev("window.__T.Enter.skip && window.__T.Enter.skip()");
  await sleep(200);
  return ev("window.__T.state()");
}

/* ---------- the contract -------------------------------------------------- */

const PRESETS = ["hit", "danger", "bonus", "heal", "shield", "power", "ice", "fire", "poison",
  "water", "mud", "wind", "knight-blue", "knight-red", "sunburst", "speed", "dark"];

console.log("\ncontract — vipera");
ok(await open("vipera") === "playing", "a round is running");
ok(JSON.stringify(await ev("window.__T.ScreenFx.presets()")) === JSON.stringify(PRESETS), "the 17 house presets");

await ev("window.__T.ScreenFx.play('hit')");
const lay = await ev(`(function () {
  var l = document.getElementById("sfx-layer"), hud = document.getElementById("hud");
  return l && { parent: l.parentNode.id, next: l.nextElementSibling && l.nextElementSibling.id,
    z: +getComputedStyle(l).zIndex, hudZ: +getComputedStyle(hud).zIndex,
    pe: getComputedStyle(l).pointerEvents, n: l.querySelectorAll('.sfx[data-fx=hit]').length };
})()`);
ok(lay && lay.parent === "frame" && lay.next === "overlay", "the layer is in #frame, right before #overlay");
ok(lay && lay.z < lay.hudZ, "the layer stands under the HUD (" + (lay && lay.z) + " < " + (lay && lay.hudZ) + ")");
ok(lay && lay.pe === "none", "the layer takes no tap");
ok(lay && lay.n === 1, "play('hit') is up");
await sleep(60 + 120 + 500 + 300);
ok(await ev("!document.querySelector('.sfx[data-fx=hit]')"), "play('hit') is gone after in + hold + out");

await ev("window.__T.ScreenFx.hold('shield')");
await sleep(1800);
ok(await ev("window.__T.ScreenFx.active('shield') && !!document.querySelector('.sfx[data-fx=shield]')"), "hold('shield') is still up after 1.8 s");
await ev("window.__T.ScreenFx.release('shield')");
ok(await ev("!window.__T.ScreenFx.active('shield')"), "release('shield') makes it inactive at once");
await sleep(600);
ok(await ev("!document.querySelector('.sfx[data-fx=shield]')"), "…and takes it off the layer after its out");

await ev("window.__T.ScreenFx.hold('ice')");
const ice = await ev("({ frame: !!document.querySelector('.sfx[data-fx=ice] .sfx-frame'), bands: document.querySelectorAll('.sfx[data-fx=ice] .sfx-band').length })");
ok(!ice.frame && ice.bands === 4, "a frame the game has not adopted is drawn as its edge (no frame, 4 bands)");
await ev("window.__T.ScreenFx.clear()");

await ev("window.__T.ScreenFx.play('danger')");
const dg = await ev("(function(){var a=document.querySelector('.sfx[data-fx=danger] .sfx-p').getAnimations()[0];var t=a.effect.getComputedTiming();return {name:a.animationName,it:t.iterations,dur:t.duration};})()");
ok(dg.name === "sfx-flash" && dg.it === 2, "danger flashes exactly twice (" + dg.name + " x" + dg.it + ", " + dg.dur + " ms)");
await sleep(Math.round(dg.dur * 2) + 10 + 100 + 250);
ok(await ev("!document.querySelector('.sfx[data-fx=danger]')"), "danger is gone after its two flashes");

await ev("window.__T.Overlay.vignette('rgba(255,45,85,.9)', 0.8, 400)");
await sleep(700);
const vg = await ev(`(function(){var g=document.querySelector('#sfx-layer .sfx-glow');var old=document.getElementById('ov-vignette');
  return { glow: !!g, bands: g ? g.querySelectorAll('.sfx-band').length : 0, op: g ? +getComputedStyle(g).opacity : -1,
    tr: g ? getComputedStyle(g).transitionDuration : '', old: old ? old.style.boxShadow : '' };})()`);
ok(vg.glow && vg.bands === 4, "Overlay.vignette draws through ScreenFx.glow (4 bands)");
ok(vg.tr === "0.5s", "the glow eases over .5 s as #ov-vignette did");
ok(!vg.old, "the old blurred #ov-vignette is never painted");
await ev("window.__T.Overlay.vignette('rgba(255,45,85,.9)', 0.8)");
await sleep(700);
ok(Math.abs(await ev("+getComputedStyle(document.querySelector('#sfx-layer .sfx-glow')).opacity") - 0.8) < 0.02, "a vignette with no ms holds the alpha it was given");

await ev("window.__T.ScreenFx.hold('speed'); window.__T.ScreenFx.hold('ice')");
await ev("window.__T.endRound({ title: 'Test', score: 0, stars: 0, rows: [] })");
await sleep(1500);
ok(await ev("document.querySelectorAll('#sfx-layer .sfx:not(.sfx-glow)').length === 0 && +getComputedStyle(document.querySelector('#sfx-layer .sfx-glow')).opacity === 0"),
   "a round that ends takes every effect and the glow with it");
ok(client.errors.length === 0, "no exception in the contract run" + (client.errors.length ? ": " + client.errors[0] : ""));

/* A shared frame is web-only art (a playable strips it, tools/build/build.mjs
   WEB_ONLY_HOLE), so the adopted frame is checked in holepocalypse's
   self-contained web build. */
console.log("\ncontract — holepocalypse web build (frame-ice adopted)");
execFileSync("node", ["tools/build/build.mjs", "--target=web", "--dest=itch", "--game=holepocalypse"], { cwd: ROOT, stdio: "ignore" });
client.errors.length = 0;
await client.send("Page.navigate", { url: "file://" + prepare(tmpDir, "holepocalypse-web",
  path.join(ROOT, "dist/itch/holepocalypse/index.html")) + "?first=0" });
for (let i = 0; i < 150; i++) { await sleep(100); if (await ev("!!(window.__WEB__ && window.__WEB__.ScreenFx)").catch(() => false)) break; }
await ev("window.__WEB__.ScreenFx.hold('ice')");
ok(await ev("(function(){var f=document.querySelector('.sfx[data-fx=ice] .sfx-frame');return !!f && /url\\(/.test(f.style.backgroundImage);})()"),
   "an adopted frame is painted (CONFIG.art.frameIce)");
await ev("window.__WEB__.ScreenFx.clear()");

/* ---------- the smoke ----------------------------------------------------- */

if (!CONTRACT_ONLY) {
  console.log("\nsmoke — every game plays " + PLAY_MS / 1000 + " s under every effect, without an exception");
  for (const slug of GAMES) {
    let state;
    try { state = await open(slug); } catch (e) { ok(false, slug + ": did not load (" + e.message + ")"); continue; }
    await ev(`(function () {
      var T = window.__T, P = ${JSON.stringify(PRESETS)}, i = 0, L = T.Layout;
      window.__pilot = setInterval(function () {
        var x = L.left + Math.random() * (L.right - L.left), y = L.top + Math.random() * (L.bottom - L.top);
        try {
          T.Input.at("down", x, y);
          T.Input.at("move", x + (Math.random() - .5) * 160, y + (Math.random() - .5) * 160);
          T.Input.at("up", x, y);
        } catch (e) { setTimeout(function () { throw e; }); }
        if (i < P.length) T.ScreenFx.play(P[i]);
        if (i % 5 === 0) T.Overlay.vignette(i % 2 ? "#ff2d55" : "rgba(53,232,255,.8)", 0.7, 300);
        i++;
      }, 180);
    })()`);
    await sleep(PLAY_MS);
    await ev("clearInterval(window.__pilot)");
    const errs = client.errors.slice();
    ok(errs.length === 0, slug.padEnd(14) + (state === "playing" ? "" : "(state " + state + ") ") +
       (errs.length ? errs.length + " exception(s): " + errs[0] : "clean"));
  }
}

client.close();
chrome.child.kill("SIGKILL");
console.log(failures ? `\n${failures} failure(s)` : "\nall passed");
process.exit(failures ? 1 : 0);
