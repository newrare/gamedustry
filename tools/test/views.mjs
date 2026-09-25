#!/usr/bin/env node
/* views — the contract of the view system, asserted against a real build.
 *
 * There is no test runner in this repo and this is not one. It is the same
 * thing the lab pages are: a headless Chrome driving a game that was built by
 * the real builder, over the DevTools protocol, with assertions where a lab
 * page would have a screenshot. What it checks cannot be checked any other
 * way — a stack, a z-order and a key are what the DOM does, not what a
 * function returns — and every one of these assertions is a bug this shell has
 * actually had:
 *
 *   the album could not be reopened from the shop        (DOM order decided
 *                                                         which of two equal
 *                                                         z-indexes won)
 *   ESCAPE meant a different thing in four files
 *   a closed screen left live controls over the round
 *   the wallet was in four places and on none of the
 *     two screens in between
 *
 * Usage:
 *   node tools/test/views.mjs                # radiam, the one game with a
 *                                            # wallet, an album and a shop
 *   node tools/test/views.mjs vipera         # any other: the views it has
 *   node tools/test/views.mjs --keep         # leave the server up to poke at
 *
 * It BUILDS what it tests (`--target=web`), serves dist/web over HTTP — the
 * split build loads its assets by XHR, so file:// silently breaks it — and
 * exits non-zero on the first failure with the assertion that broke.
 */

import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reap, sweep, reportSweep } from "../lab/chrome.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const args = process.argv.slice(2);
const KEEP = args.includes("--keep");
const GAME = args.find((a) => !a.startsWith("--")) || "radiam";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- the server --------------------------------------------------- */

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webp": "image/webp", ".png": "image/png",
  ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".woff2": "font/woff2",
  ".svg": "image/svg+xml"
};

function serve(dir) {
  const srv = createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
    let file = path.join(dir, rel);
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) { res.writeHead(404).end("not found: " + rel); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok({ srv, port: srv.address().port })));
}

/* ---------- CDP ---------------------------------------------------------- */

async function launchChrome(profileDir) {
  const child = spawn(CHROME, [
    "--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profileDir,
    "--disable-gpu", "--hide-scrollbars", "--mute-audio",
    "--autoplay-policy=no-user-gesture-required", "--no-first-run",
    "--force-device-scale-factor=1", "--window-size=390,844", "about:blank"
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
  let nextId = 1; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    }
  };
  return {
    send: (method, params, sessionId) => {
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
      return new Promise((res, rej) => pending.set(id, { res, rej }));
    },
    close: () => ws.close()
  };
}

/* ---------- the harness -------------------------------------------------- */

let sid = null, client = null;
let passed = 0;
const failures = [];

async function evalJs(expr) {
  const r = await client.send("Runtime.evaluate", {
    expression: "(function(){" + expr + "})()",
    returnByValue: true, awaitPromise: true
  }, sid);
  if (r.exceptionDetails) {
    throw new Error("page threw: " + (r.exceptionDetails.exception?.description ||
                                      r.exceptionDetails.text));
  }
  return r.result.value;
}

/* A key, delivered the way a keyboard delivers it: the shell listens in
   capture on `window`, so a synthesized event has to be a real one. */
async function key(k) {
  const codes = { Escape: 27, " ": 32, Enter: 13 };
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown", key: k, code: k === " " ? "Space" : k,
    windowsVirtualKeyCode: codes[k] || 0, nativeVirtualKeyCode: codes[k] || 0
  }, sid);
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: k }, sid);
  await sleep(340);                      // the fade is 220 ms and then some
}

async function check(name, expr, want) {
  let got;
  try { got = await evalJs("return (" + expr + ");"); }
  catch (e) { got = "THREW: " + e.message; }
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { passed++; console.log("  ok   " + name); return true; }
  failures.push({ name, expr, want, got });
  console.log("  FAIL " + name + "\n       want " + JSON.stringify(want) +
              "\n       got  " + JSON.stringify(got));
  return false;
}

/* ---------- what is asserted --------------------------------------------- */

async function run(url) {
  await client.send("Page.navigate", { url }, sid);
  /* The shell mounts on DOMContentLoaded and the split build fetches its
     engine, so wait for the handle rather than for a timer. */
  for (let i = 0; i < 80; i++) {
    if (await evalJs("return !!(window.__VIEW__ && document.getElementById('web-menu'));")) break;
    await sleep(100);
  }

  console.log("\nthe floor — the title screen");
  await check("the view system is published", "!!window.__VIEW__", true);
  await check("the modal system is published", "!!window.__MODAL__", true);
  await check("nothing is stacked over the title", "__VIEW__.depth()", 0);
  await check("no card is open", "__MODAL__.count()", 0);
  /* THE CORNER IS THE ROUND'S ON THE TITLE SCREEN, VILLAGE OR NOT: a village
     is a VIEW now, reached from PLAY, and the title screen it is reached from
     is the stacked menu it always was. */
  await check("the corner is hidden on the title screen",
    "document.getElementById('web-ctls').hidden", true);
  await check("the band is down on the title screen",
    "!document.getElementById('web-hud') || document.getElementById('web-hud').hidden", true);

  const levelled = await evalJs("return !!(window.__LEVELS__ && __LEVELS__.active());");
  const metaed = await evalJs("return !!(window.__META__ && __META__.active());");
  const villaged = await evalJs("return !!window.__VILLAGE__;");
  /* THE FLOOR OF THE STACK. A village is a view the player lives on, so every
     screen opened from it stands one higher and `home` peels back TO it rather
     than to nothing. Every depth below is counted from here. */
  const FLOOR = villaged ? 1 : 0;

  /* THE VILLAGE — a view, and the one the rest of this front end points back
     at. `title -> village -> map -> round -> score -> village`: PLAY opens it,
     the band's house chip means it from everywhere, and a round clears it like
     any other view. Every assertion here is the chain, not the picture. */
  if (villaged) {
    /* THE TITLE SCREEN IS A SPLASH. A hub shows every door as a building, so
       the stacked menu in front of it was the same list twice: what is left is
       the logotype, the signature and two seconds of them, and then the front
       door opens itself (packages/webshell/menu.js, armSplash). The nodes are
       still there — `#btn-start` above all, which is what every binding this
       shell has rides on — which is why this asserts HIDDEN and not absent.

       Nothing above this line has waited: the timer is armed when the motor
       finishes preloading, well after the poll that let this run start. */
    console.log("\nthe title screen — a splash, and then it opens itself");
    await check("the menu is built and not shown",
      `(function () { var m = document.getElementById('web-menu'); return !!m && m.hidden; })()`, true);
    await check("...and the daily road is not a line of it",
      "!document.querySelector('#web-menu #dl-strip')", true);
    for (let i = 0; i < 60; i++) {
      if (await evalJs("return __VILLAGE__.isOpen();")) break;
      await sleep(100);
    }
    await check("the title screen walks into the village on its own",
      "__VILLAGE__.isOpen()", true);

    console.log("\nthe village — where the player lives");
    /* PLAY IS STILL THE WAY IN, and it has to be: `#btn-start` is the motor's
       own node and the village is bound to it, so the SPACE key and the audio
       unlock are the ones they have always been. Asking for a view that is
       already standing peels back to it rather than stacking a second one
       (View.go), which is what makes the splash and the button agree. */
    await check("PLAY opens the village, not the map",
      `(function () { document.getElementById('btn-start').click(); return __VILLAGE__.isOpen(); })()`, true);
    await check("...and it is the only thing on the stack", "__VIEW__.depth()", 1);
    await check("...carrying the band", "!document.getElementById('web-hud').hidden", true);
    await check("...and a door for every house it declares",
      `(function () {
        var houses = (__WEB__.CONFIG.web.village.houses || [])
          .filter(function (h) { return h.role !== 'decor'; }).length;
        return document.querySelectorAll('#web-village .vg-hit').length === houses;
      })()`, true);
    await check("...every one of them reachable by keyboard",
      `[].filter.call(document.querySelectorAll('#web-village .vg-hit'),
         function (b) { return b.tabIndex < 0 || !b.getAttribute('aria-label'); }).length`, 0);
    /* OPTIONS has no second way in — the band leads to the ranking, the shop,
       the collection and the map, and level 0 of that map opens the help — so
       it is a house or it is the corner, never neither and never both. */
    await check("options is reachable from the village, exactly once",
      `(function () {
        var built = (__WEB__.CONFIG.web.village.houses || [])
          .some(function (h) { return h.role === 'options'; });
        var bar = document.getElementById('web-ctls');
        var corner = !bar.hidden && [].some.call(bar.querySelectorAll('[data-ctl]'),
          function (b) { return !b.hidden && b.getAttribute('data-ctl') === 'options'; });
        return (built ? 1 : 0) + (corner ? 1 : 0);
      })()`, 1);
    await check("home means the village, from anywhere",
      `(function () { __VIEW__.home(); return __VILLAGE__.isOpen() && __VIEW__.depth() === 1; })()`, true);
    /* THE HOUSE CHIP IS GONE ON THE BARE VILLAGE, not greyed: it is the one
       chip that is only a door, and the door it is stands under it. A card
       over the village makes it a way out again, so it comes back. */
    if (metaed) {
      await check("the bare village carries no house chip",
        "getComputedStyle(document.querySelector('#web-hud .mt-band.full .mt-chip.home')).display", "none");
      await check("...and a card over it brings the chip back",
        `(function () {
          var m = __MODAL__.open({ kind: "test" });
          var d = getComputedStyle(document.querySelector('#web-hud .mt-band.full .mt-chip.home')).display;
          m.close();
          return d !== "none";
        })()`, true);
    }
    /* THE PLAY HOUSE STARTS A REAL LEVEL — the highest the board has opened —
       and never a free round nobody picked. The round is then thrown away the
       way the corner's way out throws it: no endRound, so no score is written
       and the board the rest of this run reads is still a fresh one — and the
       armed level is cleared, since the rounds below are free ones. */
    if (levelled) {
      const hasPlay = await evalJs("return !!document.querySelector('#web-village [data-role=play] .vg-hit');");
      if (hasPlay) {
        await evalJs("document.querySelector('#web-village [data-role=play] .vg-hit').click(); return 1;");
        await sleep(400);
        await check("the play house starts a round", "__WEB__.state()", "playing");
        await check("...on the highest level the board has opened",
          "__WEB__.CONFIG.level >= 1 && __WEB__.CONFIG.level === __LEVELS__.topOpen()", true);
        await evalJs("__WEB__.Loop.stop(); __WEB__.Round.stop(); __WEB__.Music.unduck();" +
                     " __WEB__.setState('intro'); __LEVELS__.clear(); __VIEW__.home(); return 1;");
        await sleep(400);
        await check("...and the village is back once it is thrown away", "__VILLAGE__.isOpen()", true);
      }
    }
  }

  if (levelled) {
    console.log("\nthe map — a view");
    await evalJs("__LEVELS__.open(); return 1;"); await sleep(260);
    await check("the map is the top view", "__VIEW__.top()", "map");
    await check("...and the only one", "__VIEW__.depth()", FLOOR + 1);
    await check("the map node carries `on`",
      "document.getElementById('lv-screen').classList.contains('on')", true);
    await check("its header carries no button where the band is the way home",
      "document.querySelectorAll('#lv-head button').length", metaed ? 0 : 1);
    await check("...and no longer writes the game's own name",
      "!document.getElementById('lv-title')", true);
    await check("the corner belongs to the round, not to a view",
      "document.getElementById('web-ctls').hidden", true);
    if (metaed) {
      await check("the band comes up with it",
        "document.getElementById('web-hud').className", "on hud-full");
      await check("the map header no longer holds a wallet",
        "!document.getElementById('lv-wallet')", true);
    }
  }

  if (metaed) {
    console.log("\nthe album and the shop — a stack, not an argument");
    await evalJs("__ALBUM__.open(); return 1;"); await sleep(260);
    await check("the album is on top", "__VIEW__.top()", "sticker");
    await check("...over the map", "__VIEW__.depth()", FLOOR + (levelled ? 2 : 1));
    await evalJs("__ALBUM__.openShop(); return 1;"); await sleep(260);
    await check("the shop is on top", "__VIEW__.top()", "shop");
    await check("...over the album", "__VIEW__.depth()", FLOOR + (levelled ? 3 : 2));
    /* THE BUG THIS SYSTEM EXISTS FOR. The two screens are doors both ways, so
       asking for the album from the shop must PEEL the shop rather than stack
       a second album under it — which is what DOM order used to decide, and
       decided wrong whenever the album had been built first. */
    await evalJs("__ALBUM__.open(); return 1;"); await sleep(260);
    await check("the album is reachable from the shop", "__VIEW__.top()", "sticker");
    await check("...by peeling, not by stacking", "__VIEW__.depth()", FLOOR + (levelled ? 2 : 1));
    await check("the shop is really gone",
      "document.getElementById('sh-screen').classList.contains('on')", false);

    console.log("\nthe wallet band — one node, over all three");
    await check("one band in the frame",
      "document.querySelectorAll('#web-hud').length", 1);
    await check("...and no second wallet in any header",
      "document.querySelectorAll('.mt-head-wallet').length", 0);
    await check("the band is up over the album",
      "document.getElementById('web-hud').className", "on hud-full");
    await check("...and the album stands in the one sheet every view wears",
      "!!document.querySelector('#al-screen.wv-screen .wv-sheet .wv-title')", true);
    await check("...the count being a chip of the band now",
      "!!document.querySelector('#web-hud .mt-chip.collection')", true);
    /* THE ORDER IS THE NAVIGATION, so it is what the test reads: level, coins,
       tickets, stars, left to right, on every screen that carries the band. */
    /* IT HAS TO FIT AT ITS WIDEST, and the widest is not what a fresh save
       shows: six chips with every number full, the level bar at its floor, is the
       case the paddings in view.css were measured against. A game's own face
       is what makes this worth asserting rather than eyeballing — Orbitron's
       digits are 24% wider than the system stack's. */
    await check("the band fits the frame with every number at its widest",
      "(function () {" +
      "  var b = document.querySelector('#web-hud .mt-band.full');" +
      "  var lv = b.querySelector('.mt-lv');" +
      "  var was = [b.querySelector('.mt-chip.collection b').textContent," +
      "             b.querySelector('.mt-chip.coins b').textContent," +
      "             b.querySelector('.mt-chip.tickets b').textContent," +
      "             b.querySelector('.mt-chip.stars b').textContent," +
      "             lv.querySelector('.lbl').textContent, lv.className];" +
      "  b.querySelector('.mt-chip.collection b').textContent = '20/20';" +
      "  b.querySelector('.mt-chip.coins b').textContent = '99 999';" +
      "  b.querySelector('.mt-chip.tickets b').textContent = '99';" +
      "  b.querySelector('.mt-chip.stars b').textContent = '90/90';" +
      "  lv.querySelector('.lbl').textContent = 'LV 99';" +
      "  var f = document.getElementById('frame').getBoundingClientRect();" +
      "  var r = b.getBoundingClientRect();" +
      "  var room = f.width - 52 * f.width / 720;" +   /* the band's own 26px gutters */
      "  var fits = r.width <= room + 0.5 && r.left >= f.left - 0.5;" +
      "  b.querySelector('.mt-chip.collection b').textContent = was[0];" +
      "  b.querySelector('.mt-chip.coins b').textContent = was[1];" +
      "  b.querySelector('.mt-chip.tickets b').textContent = was[2];" +
      "  b.querySelector('.mt-chip.stars b').textContent = was[3];" +
      "  lv.querySelector('.lbl').textContent = was[4];" +
      "  lv.className = was[5];" +
      "  return fits;" +
      "})()", true);

    await check("six chips, in that order",
      "[].map.call(document.querySelectorAll('#web-hud .mt-band.full .mt-lv," +
      " #web-hud .mt-band.full .mt-chip:not(.more)'), function (n) {" +
      "   return n.className.split(' ').filter(function (c) {" +
      "     return /^(collection|home|mt-lv|coins|tickets|stars)$/.test(c); })[0]; })",
      ["home", "mt-lv", "coins", "tickets", "collection", "stars"]);
    /* A door answers a pointer and an inert chip does not — which is the only
       thing on the row that says a tap will do nothing. The level chip used to
       fail this: it is a button and it opens a screen, and it looked like a
       label. */
    await check("every door answers a pointer, and only the inert one does not",
      "[].map.call(document.querySelectorAll('#web-hud .mt-band.full .mt-lv," +
      " #web-hud .mt-band.full .mt-chip'), function (n) {" +
      "   return getComputedStyle(n).cursor === 'pointer' ===" +
      "          !n.classList.contains('inert'); })" +
      " .every(function (v) { return v; })", true);
    /* TWO CHIPS LEAD TO THE COLLECTION — the tickets, which are spent there,
       and the count, which is of it — so standing on it greys both. Different
       numbers, same destination, and neither of them is a better door than the
       other. */
    await check("the chips of the screen we are standing on are inert",
      "!!document.querySelector('#web-hud .mt-chip.tickets.inert') &&" +
      " !!document.querySelector('#web-hud .mt-chip.collection.inert')", true);
    await check("...and the others are not",
      "document.querySelectorAll('#web-hud .mt-band.full .inert').length", 2);
    /* A SHEET CARRIES THE HOUSE IN ITS OWN BAR, bottom right, so the band's
       stands down over it — one way home, never two (view.js, `sheet`). */
    await check("over a sheet the band's house stands down",
      "getComputedStyle(document.querySelector('#web-hud .mt-band.full .mt-chip.home')).display", "none");
    await check("...and the sheet's bar carries it, first of home / help / options",
      "[].map.call(document.querySelectorAll('.wv-screen.on .wv-ctls [data-ctl]')," +
      " function (b) { return b.getAttribute('data-ctl'); }).join()", "home,help,options");
    /* The geometry is read where the house is up: the map, which is not a
       sheet. */
    if (levelled) { await evalJs("__LEVELS__.open(); return 1;"); await sleep(400); }
    /* THE ROW RUNS EDGE TO EDGE, and the level chip is the spring: the house
       against the left gutter, the counts against the right one, and the xp
       bar over everything between them — no empty band in front of the house. */
    if (levelled) await check("the house sits against the left gutter",
      "(function () {" +
      "  var f = document.getElementById('frame').getBoundingClientRect();" +
      "  var h = document.querySelector('#web-hud .mt-band.full .mt-chip.home').getBoundingClientRect();" +
      "  return Math.abs(h.left - f.left - 26 * f.width / 720) < 1;" +
      "})()", true);
    /* ...or up to the fold's chip, on a game that declares one: it stands
       between the level and the coins. */
    if (levelled) await check("...and the level chip fills the room up to the counts",
      "(function () {" +
      "  var b = document.querySelector('#web-hud .mt-band.full');" +
      "  var h = b.querySelector('.mt-chip.home').getBoundingClientRect();" +
      "  var lv = b.querySelector('.mt-lv').getBoundingClientRect();" +
      "  var m = b.querySelector('.mt-band-more');" +
      "  var c = (m && !m.hidden ? m : b.querySelector('.mt-band-chips')).getBoundingClientRect();" +
      "  var bar = b.querySelector('.mt-lv .bar').getBoundingClientRect();" +
      "  var k = document.getElementById('frame').getBoundingClientRect().width / 720;" +
      "  return lv.left - h.right < 12 * k && c.left - lv.right < 12 * k && bar.width > 40 * k;" +
      "})()", true);
  }

  if (metaed) {
    console.log("\nthe band IS the navigation — the same four doors everywhere");
    await evalJs("__VIEW__.home(); if (window.__LEVELS__ && __LEVELS__.active())" +
                 " __LEVELS__.open(); else __ALBUM__.open(); return 1;");
    await sleep(400);
    await evalJs("document.querySelector('#web-hud .mt-chip.coins').click(); return 1;");
    await sleep(400);
    await check("the coin chip opens the shop", "__VIEW__.top()", "shop");
    await evalJs("document.querySelector('#web-hud .mt-chip.tickets').click(); return 1;");
    await sleep(400);
    await check("the ticket chip opens the collection", "__VIEW__.top()", "sticker");
    if (levelled) {
      await evalJs("document.querySelector('#web-hud .mt-chip.stars').click(); return 1;");
      await sleep(400);
      await check("the star chip goes back to the map", "__VIEW__.top()", "map");
      await check("...by peeling, not by stacking a second one", "__VIEW__.depth()", FLOOR + 1);
      /* THE STACK OWNS THE Z-ORDER. Reached from the title the album is the
         only view open, so the map opens OVER it — and the three screens were
         written with three different z-indexes, which is how the map used to
         arrive underneath. */
      await evalJs("__VIEW__.home(); __ALBUM__.open(); return 1;"); await sleep(400);
      await evalJs("document.querySelector('#web-hud .mt-chip.stars').click(); return 1;");
      await sleep(400);
      await check("the map opens OVER the album it was reached from",
        "__VIEW__.top()", "map");
      await check("...and is really on top of it",
        "+getComputedStyle(document.getElementById('lv-screen')).zIndex >" +
        " +getComputedStyle(document.getElementById('al-screen')).zIndex", true);
    }
    await evalJs("document.querySelector('#web-hud .mt-band.full .mt-lv')" +
                 " .click(); return 1;");
    await sleep(400);
    await check("the level chip opens the ranking", "__VIEW__.top()", "ranking");
    await evalJs("document.querySelector('.wv-screen.on .wv-ctls .web-home').click(); return 1;");
    await sleep(400);
    await check("the sheet's house is the way home", "__VIEW__.depth()", FLOOR);
  }

  console.log("\nESCAPE — one order, top down");
  const deep = await evalJs("return __VIEW__.depth();");
  for (let i = deep; i > 0; i--) {
    await key("Escape");
    await check("escape peels one view (" + i + " → " + (i - 1) + ")", "__VIEW__.depth()", i - 1);
  }
  await check("and stops at the floor", "__VIEW__.top()", null);

  console.log("\noptions and help — cards, from anywhere");
  /* THE ENTRY IS STILL THE ENTRY where a splash hides the menu: the node is
     built either way (menu.js, splash) and a player reaches the same card from
     the village's own door or the corner control. What is asserted here is the
     CARD — one shape, opened from anywhere — and not the route, which the
     village block above and the corner block below each assert for themselves. */
  await evalJs("[].slice.call(document.querySelectorAll('.web-item'))" +
               " .filter(function(b){return /OPTION/i.test(b.textContent);})[0].click(); return 1;");
  await sleep(300);
  await check("the options card is open", "__MODAL__.top()", "web-card options");
  await check("...as a card and not a view", "__VIEW__.depth()", 0);
  /* Three switches, and a fourth where there is a village to name: the row
     that brings the buildings' words back is the one option that is about a
     screen the game may not own (menu.js, fillOptions). */
  await check("the switches are on it",
    "document.querySelectorAll('.wm-modal .web-sw').length", villaged ? 4 : 3);
  /* WHICH BUILD THIS IS, WHERE IT CAN BE READ. The title screen signs itself
     in the corner and is two seconds long; the card is the surface a player
     can stand on and read a version number off. */
  await check("the studio signature is at the foot of the card",
    "!!document.querySelector('.wm-modal .web-sig .brand-mark') &&" +
    " /^v\\d/.test((document.querySelector('.wm-modal .web-sig .brand-ver') || {}).textContent || '')",
    true);
  /* NO CROSS: every card ends on the line that says what the tap does, and
     a card with switches on it is closed by a tap AROUND it. */
  await check("the way out is the tap line, not a cross",
    "!!document.querySelector('.wm-modal .mt-card > .mt-tap') &&" +
    " !document.querySelector('.wm-modal .web-close, .wm-modal .web-back')", true);
  await key("Escape");
  await check("escape closes it", "__MODAL__.count()", 0);

  await evalJs("[].slice.call(document.querySelectorAll('.web-item'))" +
               " .filter(function(b){return /AIDE|HELP/i.test(b.textContent);})[0].click(); return 1;");
  await sleep(300);
  await check("the help card is open", "__MODAL__.top()", "web-card help");
  await check("the motor's demo stage was moved into it",
    "!!document.querySelector('.wm-modal #intro-demo')", true);
  await key("Escape");
  await check("escape closes it", "__MODAL__.count()", 0);
  await check("...and the demo stage went home",
    "!!document.querySelector('#web-demo-home #intro-demo')", true);

  console.log("\nthe language — a card is part of the screen it is over");
  await evalJs("[].slice.call(document.querySelectorAll('.web-item'))" +
               " .filter(function(b){return /OPTION/i.test(b.textContent);})[0].click(); return 1;");
  await sleep(300);
  /* A row label and not the title: OPTIONS is OPTIONS in both languages, so
     the title is the one string on this card that proves nothing. */
  var before = await evalJs("return document.querySelector('.wm-modal .web-row .lbl').textContent;");
  await evalJs("var c = document.querySelectorAll('.wm-modal .web-chip');" +
               " for (var i = 0; i < c.length; i++) if (!c[i].classList.contains('on'))" +
               "   { c[i].click(); break; } return 1;");
  await sleep(500);
  await check("the card is still open after the switch", "__MODAL__.count()", 1);
  await check("...rebuilt rather than left in the old language",
    "document.querySelector('.wm-modal .web-row .lbl').textContent !== " +
    JSON.stringify(before), true);
  await check("...and there is only one of it",
    "document.querySelectorAll('.wm-modal').length", 1);
  /* Back to where it was, so the rest of the run reads the same words. */
  await evalJs("var c = document.querySelectorAll('.wm-modal .web-chip');" +
               " for (var i = 0; i < c.length; i++) if (!c[i].classList.contains('on'))" +
               "   { c[i].click(); break; } return 1;");
  await sleep(500);
  await key("Escape");
  await check("escape still closes it", "__MODAL__.count()", 0);

  console.log("\na card over a view — the card answers first");
  if (levelled) {
    await evalJs("__LEVELS__.open(); return 1;"); await sleep(260);
    await evalJs("document.querySelector('#web-ctls [data-ctl=options]').click(); return 1;");
    await sleep(300);
    await check("the card is over the map", "__MODAL__.count()", 1);
    await check("...and the map is still under it", "__VIEW__.top()", "map");
    await key("Escape");
    await check("the first escape takes the card", "__MODAL__.count()", 0);
    await check("...and leaves the map", "__VIEW__.top()", "map");
    await key("Escape");
    /* Zero and not FLOOR: this map was opened straight from the title screen
       with `__LEVELS__.open()`, so there is no village under it to peel back
       to. What is asserted is that ESCAPE took exactly one view off. */
    await check("the second takes the map", "__VIEW__.depth()", 0);
  }

  console.log("\nthe ranking — a view of its own");
  await evalJs("[].slice.call(document.querySelectorAll('.web-item'))" +
               " .filter(function(b){return /CLASSEMENT|LEADERBOARD/i.test(b.textContent);})[0]" +
               " .click(); return 1;");
  await sleep(300);
  await check("the ranking is the top view", "__VIEW__.top()", "ranking");
  await check("it writes the best score",
    "!!document.querySelector('#web-rank .web-best')", true);
  await check("it stands in the same sheet as the album and the shop",
    "!!document.querySelector('#web-rank.wv-screen .wv-sheet .wv-title')", true);
  await key("Escape");
  /* Same as above: the ranking was opened from the title menu, not from the
     village, so peeling it leaves nothing. */
  await check("escape closes it", "__VIEW__.depth()", 0);

  console.log("\nthe round — the corner grows a way out");
  await evalJs("__WEB__.start(); return 1;"); await sleep(700);
  await check("the motor is playing", "__WEB__.state()", "playing");
  await check("nothing of the shell is in front of it", "__VIEW__.depth()", 0);
  await check("the corner is up", "document.getElementById('web-ctls').hidden", false);
  await check("...with the way out in front of the pair",
    "document.querySelectorAll('#web-ctls .web-ctl-extra .web-ctl').length", 1);
  await check("...and it is the way home, never the way to the map",
    "/village|menu/i.test(document.querySelector('#web-ctls .web-ctl-extra .web-ctl')" +
    ".getAttribute('aria-label'))", true);
  await check("the band is down over a round — the top is the game's",
    "!document.getElementById('web-hud') || document.getElementById('web-hud').hidden", true);

  await key("Escape");
  await check("escape over a round opens the options", "__MODAL__.top()", "web-card options");
  await check("...and the round is paused under it", "__WEB__.state()", "playing");
  await check("the card carries no wipe mid-round",
    "document.querySelectorAll('.wm-modal .web-danger').length", 0);
  await key("Escape");
  await check("a second escape resumes", "__MODAL__.count()", 0);

  await evalJs("document.querySelector('#web-ctls .web-ctl-extra .web-ctl').click(); return 1;");
  await sleep(300);
  await check("the way out asks first", "__MODAL__.top()", "web-card leave");
  await check("...with two answers and not one",
    "document.querySelectorAll('.wm-modal .web-btn').length", 2);
  await evalJs("document.querySelector('.wm-modal .web-btn.stop').click(); return 1;");
  await sleep(500);
  await check("leaving goes back to the shell", "__WEB__.state()", "intro");
  await check("...and to the village where there is one",
    "__VIEW__.top()", villaged ? "village" : null);
  if (villaged) { await key("Escape"); }

  if (metaed && villaged) {
    /* A VILLAGE HAS A BUILDING FOR IT, and that door opens the STRIP ITSELF
       as a card over the hub (`DL.openRoad()`, packages/webshell/daily.js) —
       the week, where the player is inside it, and what tomorrow pays, none
       of which a door straight to today's reward ever showed.

       What is asserted is the door, the road inside the card, and that
       NOTHING WAS NAVIGATED: the gift pays into the band this view already
       carries, so the hub is still the view the card is standing on. The
       stack is emptied through the modal layer rather than with ESCAPE,
       because the ceremony a day's tap opens answers to no key. */
    console.log("\nthe daily road — a house on the hub, not a strip in a menu");
    await evalJs("__VIEW__.home(); return 1;"); await sleep(300);
    await check("the title menu carries no strip",
      "!document.querySelector('#web-menu #dl-strip')", true);
    const dailyHouse = await evalJs(
      "return !!document.querySelector('#web-village [data-role=\"daily\"] .vg-hit');");
    if (dailyHouse) {
      await evalJs("document.querySelector('#web-village [data-role=\"daily\"] .vg-hit')" +
                   ".click(); return 1;");
      await sleep(900);
      await check("the door opens a card of the same system",
        "__MODAL__.count() > 0", true);
      await check("...carrying both class names",
        "!!document.querySelector('.wm-modal.mt-modal')", true);
      await check("...and the road is what is in it",
        "!!document.querySelector('.wm-card #dl-strip')", true);
      await check("...over the hub, which was never left",
        "__VIEW__.top()", "village");
      while (await evalJs("return __MODAL__.closeTop();")) { await sleep(200); }
      await check("the stack empties behind it", "__MODAL__.count()", 0);
    }
    await evalJs("__VIEW__.home(); return 1;"); await sleep(300);
  }

  if (metaed && !villaged) {
    console.log("\nthe daily road — a strip in the menu, a card on a tap");
    await evalJs("__VIEW__.home(); return 1;"); await sleep(300);
    await check("the strip is a line of the title menu",
      "!!document.querySelector('#web-menu #dl-strip')", true);
    /* A day AHEAD, not today's: tapping today pays, and paying opens the map
       under the card and a ceremony over it — a whole beat to unwind. What is
       asserted here is that a tap on the road opens a card of this system, and
       the last day of the strip says that as well as the first. */
    await evalJs("var c = document.querySelectorAll('#dl-strip .dl-cell');" +
                 " c[c.length - 1].click(); return 1;");
    await sleep(700);
    await check("a day opens a card of the same system", "__MODAL__.count()", 1);
    await check("...carrying both class names",
      "!!document.querySelector('.wm-modal.mt-modal')", true);
    await check("...and dismissed by a tap, since it asks nothing",
      "!!__MODAL__.top()", true);
    await key("Escape");
    await check("escape puts it away", "__MODAL__.count()", 0);
    await evalJs("__VIEW__.home(); return 1;"); await sleep(300);
  }

  console.log("\nthe score screen — the band only while it is being paid");
  await evalJs("__WEB__.start(); return 1;"); await sleep(700);
  await evalJs("__WEB__.endRound({ title: 'Test', score: 12000, stars: 2, rows: [] }); return 1;");
  await sleep(2600);
  await check("the motor is on the end screen", "__WEB__.state()", "end");
  await check("the corner stands down — the screen's own way on is the offer",
    "document.getElementById('web-ctls').hidden", true);
  if (metaed) {
    await check("the band is up, in its transient half",
      "document.getElementById('web-hud').className", "on hud-auto");
    await check("...and it is the same node as everywhere else",
      "document.querySelectorAll('#web-hud').length", 1);
    /* THREE AND NOT FOUR: a level, coins and tickets are what a round pays
       into — the stars are the end screen's own three, and nothing flies to
       them. The level one is the fix this pass made: xp was the one reward
       whose target was a bar and not a `.mt-chip`, so it had nowhere to go. */
    await check("the transient row carries the three a round can pay",
      "document.querySelectorAll('#web-hud .mt-band.transient .mt-lv," +
      " #web-hud .mt-band.transient .mt-chip').length", 3);
    /* The cascade lifts a chip and puts it back, so WHEN is not something to
       assert on a sleep: poll for the lift instead. */
    var lifted = false;
    for (var t = 0; t < 40 && !lifted; t++) {
      lifted = await evalJs("return !!document.querySelector(" +
        "'#web-hud .mt-band.transient .shown');");
      if (!lifted) await sleep(150);
    }
    await check("a chip comes out for what is being paid in", lifted, true);
  } else {
    await check("no band on a game with no wallet",
      "!document.getElementById('web-hud') || document.getElementById('web-hud').hidden", true);
  }
  await evalJs("__WEB__.setState('intro'); return 1;"); await sleep(500);
  await check("the band goes down with the screen",
    "!document.getElementById('web-hud') || document.getElementById('web-hud').hidden", true);
  if (levelled) { await evalJs("__VIEW__.home(); return 1;"); await sleep(300); }

  console.log("\nno view is a dead end, and none carries a button of its own");
  /* THE BARRACKS' FOUR ARE VIEWS LIKE THE REST (packages/webshell/army.js), so
     they answer the same three questions: no corner controls, exactly one way
     home, and that way home lands on the floor. They are asked only of a game
     that declares `web.army` — the handle is what says so. */
  var armied = await evalJs("return !!(window.__ARMY__ && __ARMY__.active());");
  var views = ["ranking"].concat(levelled ? ["map"] : [])
                         .concat(metaed ? ["sticker", "shop"] : [])
                         .concat(armied ? ["deck", "infirmary", "prison", "recruit"] : []);
  for (var v = 0; v < views.length; v++) {
    await evalJs("__VIEW__.home(); __VIEW__.go(" + JSON.stringify(views[v]) + "); return 1;");
    await sleep(400);
    await check(views[v] + " shows no corner controls",
      "document.getElementById('web-ctls').hidden", true);
    if (views[v] !== "map") {
      await check("...its sheet's bar carries home, help and options instead",
        "document.querySelectorAll('.wv-screen.on .wv-ctls [data-ctl]').length", 3);
    }
    /* EXACTLY ONE WAY HOME on every view, and never two: the band's level
       chip where there is a band, a home button where there is not. */
    await check("...and exactly one way home on it",
      "document.querySelectorAll(" +
      "'#web-hud.hud-full .mt-chip.home:not(.gone), .on .web-home').length", 1);
    await evalJs("document.querySelector(" +
      "'#web-hud.hud-full .mt-chip.home:not(.gone), .on .web-home').click(); return 1;");
    await sleep(400);
    await check(villaged ? "...which lands on the village" : "...which lands on the title screen",
      "__VIEW__.depth()", FLOOR);
  }
  await check("no back arrow anywhere in the frame",
    "document.querySelectorAll('.web-back').length", 0);

  if (armied) {
    console.log("\nthe barracks — four doors on the hub, and a deck the round reads");
    /* THE LAYER IS DRAINED FIRST. The sections above leave the meta layer's own
       gift card on screen, and an ESCAPE asserted here would close THAT — the
       stack is walked top down, which is the point of it, so a test of a view's
       key has to start with nothing over the view. */
    await evalJs("while (__MODAL__.closeTop());  __VIEW__.home(); return 1;");
    await sleep(400);
    /* Every door of the hub is a house, and the four new ones have to BE on it:
       a view nothing opens is a screen the player never reaches. */
    var doors = ["deck", "infirmary", "prison", "recruit"];
    for (var q = 0; q < doors.length; q++) {
      await check("the " + doors[q] + " is a house on the hub",
        "!!document.querySelector('#web-village [data-role=\"" + doors[q] + "\"] .vg-hit')", true);
      await evalJs("document.querySelector('#web-village [data-role=\"" + doors[q] +
                   "\"] .vg-hit').click(); return 1;");
      await sleep(350);
      await check("...and it opens its own view", "__VIEW__.top()", doors[q]);
      await key("Escape"); await sleep(300);
      await check("...and escape peels it back to the hub", "__VIEW__.top()", "village");
    }
    /* THE BAND'S FOLD: one sword chip between the level and the coins,
       the army's figures under it, each one a door. */
    await check("the band carries the fold's chip, after the level",
      "(function (c) { return !!c && !c.closest('.mt-band-more').hidden && " +
      "c.closest('.mt-band-more').previousElementSibling.className; })" +
      "(document.querySelector('#web-hud .mt-band.full .mt-chip.more'))", "mt-band-lv");
    await evalJs("document.querySelector('#web-hud .mt-chip.more').click(); return 1;");
    await sleep(200);
    await check("...a tap unfolds the army's figures",
      "document.querySelectorAll('#web-hud .mt-more:not([hidden]) .mt-more-row').length", 5);
    await check("...inside the frame",
      "(function (p, f) { return p.right <= f.right + 0.5 && p.left >= f.left - 0.5; })" +
      "(document.querySelector('#web-hud .mt-more').getBoundingClientRect()," +
      " document.getElementById('frame').getBoundingClientRect())", true);
    await evalJs("document.querySelectorAll('#web-hud .mt-more-row')[3].click(); return 1;");
    await sleep(350);
    await check("...its prison row is the prison's door", "__VIEW__.top()", "prison");
    await check("...and the fold is put away", "document.querySelector('#web-hud .mt-more').hidden", true);
    await key("Escape"); await sleep(300);
    /* THE ONE THING THE BARRACKS SAYS TO THE GAME. `CONFIG.army.deck` is what
       `Game.reset()` reads, and a deck that is short is filled with conscripts
       rather than left short — a battle the player cannot start is not a cost,
       it is a closed door. */
    await check("the round is handed a full deck",
      "__WEB__.CONFIG.army.deck.length === __ARMY__.size()", true);
    await check("...and every card in it is a grade and a tier",
      "__WEB__.CONFIG.army.deck.every(function (c) {" +
      " return typeof c.r === 'number' && typeof c.t === 'number'; })", true);

    /* THE CAMP'S MISSIONS (army.js, section 8d'): a squad picked on the
       briefing leaves the round's deck until it is back, and its report
       pays or costs on the tap that closes it. Asked only of a manifest
       that names missions — the tab bar is what says so. */
    var missioned = await evalJs("return !!(__WEB__.CONFIG.web.army.missions &&" +
      " __WEB__.CONFIG.web.army.missions.list.length);");
    if (missioned) {
      await evalJs("__VIEW__.home(); __ARMY__.open('recruit'); return 1;");
      await sleep(350);
      await check("the camp carries two tabs",
        "document.querySelectorAll('#ar-recruit .wv-tab').length", 2);
      await evalJs("document.querySelectorAll('#ar-recruit .wv-tab')[1].click(); return 1;");
      await sleep(250);
      await check("...and the missions tab shows the board",
        "document.querySelectorAll('#ar-recruit .ar-mis').length > 0", true);
      await evalJs("document.querySelector('#ar-recruit .ar-mis .ar-btn.gold').click(); return 1;");
      await sleep(250);
      await check("prepare opens the briefing, with its odds",
        "!!document.querySelector('#ar-recruit .ar-gauge')", true);
      await check("...at 0% before a card is taken",
        "document.querySelector('#ar-recruit .ar-gauge-p').textContent", "0%");
      var need = await evalJs("var m = __WEB__.CONFIG.web.army.missions.list.filter(function (x) {" +
        " return x.id === __ARMY__.missions().o[0]; })[0]; return m ? m.squad[0] : 2;");
      for (var p = 0; p < need; p++) {
        await evalJs("document.querySelectorAll('#ar-recruit .ar-pool .ar-slot.pool:not(.on)')[0].click(); return 1;");
        await sleep(120);
      }
      await check("...and the odds move with the squad",
        "document.querySelector('#ar-recruit .ar-gauge-p').textContent !== '0%'", true);
      await evalJs("document.querySelector('#ar-recruit .ar-acts .ar-btn.gold').click(); return 1;");
      await sleep(250);
      await check("the squad is away", "__ARMY__.missions().r.length", 1);
      await check("...and out of the round's deck",
        "(function () { var away = __ARMY__.missions().r[0].c;" +
        " return __WEB__.CONFIG.army.deck.every(function (c) { return away.indexOf(c.id) < 0; }); })()", true);
      await evalJs("__ARMY__.missions().r[0].e = 0;" +
        " document.querySelectorAll('#ar-recruit .wv-tab')[0].click();" +
        " document.querySelectorAll('#ar-recruit .wv-tab')[1].click(); return 1;");
      await sleep(250);
      await evalJs("document.querySelector('#ar-recruit .ar-run .ar-btn.gold').click(); return 1;");
      await sleep(400);
      await check("a squad back opens its report", "__MODAL__.top()", "ar-report");
      await check("...written and kept until collected", "__ARMY__.missions().q.length", 1);
      await evalJs("document.querySelector('.ar-report .ar-rep-text').click(); return 1;");
      await sleep(400);
      await check("a tap collects it", "__ARMY__.missions().q.length + __MODAL__.count()", 0);
      await key("Escape"); await sleep(300);
    }
  }

  console.log("\nthe floor wins — a round clears everything in front of it");
  await evalJs("if (window.__LEVELS__ && __LEVELS__.active()) __LEVELS__.open();" +
               " __MODAL__.open({ kind: 'test', dismiss: true }); return 1;");
  await sleep(260);
  await check("something is open", "__VIEW__.depth() + __MODAL__.count() > 0", true);
  await evalJs("__VIEW__.floor('playing'); return 1;"); await sleep(300);
  await check("no view survives it", "__VIEW__.depth()", 0);
  await check("no card survives it", "__MODAL__.count()", 0);
  await check("...and nothing of them is left in the frame",
    "document.querySelectorAll('.wm-modal').length + " +
    "document.querySelectorAll('#lv-screen.on, #al-screen.on, #sh-screen.on, #web-rank.on').length + " +
    "document.querySelectorAll('.ar-screen.on').length", 0);
}

/* ---------- main --------------------------------------------------------- */

reportSweep(sweep("views-test-"));
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "views-test-"));

console.log("building " + GAME + " for the web…");
execFileSync("node", ["tools/build/build.mjs", "--game=" + GAME, "--target=web"],
  { cwd: ROOT, stdio: "pipe" });

const dist = path.join(ROOT, "dist", "web");
if (!fs.existsSync(path.join(dist, GAME, "index.html"))) {
  console.error("no web build for " + GAME + " — does its manifest list the web target?");
  process.exit(1);
}
const { srv, port } = await serve(dist);
const url = "http://127.0.0.1:" + port + "/" + GAME + "/index.html";
console.log("serving " + url);

const chrome = await launchChrome(tmpDir);
reap(chrome.child, { label: "views-test" });
client = await cdp(chrome.port);
const t = await client.send("Target.createTarget", { url: "about:blank" });
const a = await client.send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
sid = a.sessionId;
await client.send("Page.enable", {}, sid);
await client.send("Runtime.enable", {}, sid);
await client.send("Emulation.setDeviceMetricsOverride",
  { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, sid);

let code = 0;
try {
  await run(url);
} catch (e) {
  console.error("\nthe run itself broke: " + e.message);
  code = 1;
}

console.log("\n" + passed + " passed, " + failures.length + " failed");
if (failures.length) code = 1;

if (KEEP) {
  console.log("\n--keep: " + url + " is still up. Ctrl-C to stop.");
  await new Promise(() => {});
}
client.close();
srv.close();
process.exit(code);
