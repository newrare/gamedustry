/*
  probe-stages — find, for every sound a game plays, ONE level of its map where
  it can be heard, so the sound page can say where to go and Rec it.

    called by serve-events.mjs (POST /api/probe-stages, the Find stages button
    of the sound page); it needs that server's build to play.

  A cue of the events bench is captured by playing until it fires, and a cue
  tied to a mechanic only fires on the levels that deal that mechanic — ice
  from the seventh level of marshmelt, the gusts later still. Which level that
  is lives in each game's own tables, written eighteen different ways, so it
  is not READ: it is OBSERVED. A headless Chrome (tools/lab/chrome.mjs, through
  shoot-shell's launcher) plays the game's own web build level by level, a
  blind pilot pressing the play area at random — taps, holds, drags, flicks,
  so every game's gesture gets some of it, with idle stretches between them
  for what only happens to a player who waits — while every Sound.clip and
  Sound.cue is logged with the stack that called it and the level it fired on.

  The pilot is not a player: a cue that needs a skilled move may never fire,
  and the result says which keys stayed unfound rather than guessing. The
  levels are walked in order and the walk stops once every key has a level,
  so a key is given the FIRST level it was heard on — the first meeting, which
  is the level a player would look for it on too. The round's corners (MENU,
  OPTIONS, the live stars) are never pressed: only the band the game owns,
  `Layout`, less its bottom strip.

  A round that ends is started again on the same level; a round that stalls
  (a card opened over it, the clock frozen) is taken down by ESCAPE and
  started again. The time scale is raised (Loop.rate) so a level gives more
  of itself per second of wall clock.
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sweep } from './chrome.mjs';
import { launch, cdp } from './shoot-shell.mjs';

const VW = 450, VH = 800;                  // the 720×1280 frame at 0.625
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Every Sound.clip / Sound.cue the GAME plays, with its level and its caller.
const HOOK = `(() => {
  const W = window.__WEB__, S = W && W.Sound;
  if (!S || S.__probe) return false;
  window.__probe = [];
  ["clip", "cue"].forEach((m) => {
    const o = S[m];
    S[m] = function () {
      const L = window.__LEVELS__;
      window.__probe.push({ name: "Sound." + m, level: L && L.current ? L.current() : 0, stack: new Error().stack });
      return o.apply(this, arguments);
    };
  });
  S.__probe = true;
  return true;
})()`;

// The play area in viewport px: Layout, less its bottom strip where the corners stand.
const AREA = `(() => {
  const W = window.__WEB__, L = W.Layout, cv = document.getElementById("game");
  const r = cv.getBoundingClientRect(), k = r.width / W.view.w;
  const bottom = Math.min(L.bottom, W.view.h - 150);
  return { x0: r.left + L.left * k, x1: r.left + L.right * k, y0: r.top + L.top * k, y1: r.top + bottom * k };
})()`;

/**
 * Walk a game's levels and note the first one each sound line fires on.
 * @param {{ base: string, game: string, keys: string[], match: Function, seconds?: number, rate?: number, log?: Function, progress?: Function }} o
 *   `keys` are the sound keys still to place: the walk stops once each has fired.
 *   `match({ name, stack })` is the caller's: the scanned row that call is
 *   ({ checkId, sound }), or null for a sound the game did not play itself.
 *   `found(key, level)` is told each key the first time it is heard.
 * @returns {Promise<{ stages: { [checkId]: level }, levels: number, left: string[], steps: string[] }>}
 */
export async function probeStages({ base, game, keys, match, seconds = 14, rate = 2, log = () => {}, progress = () => {}, found = () => {} }) {
  sweep('probe-stages-');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-stages-'));
  const { child, port } = await launch(profile, { label: 'probe-stages', minutes: 20 });
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
    // Headless only turns its frames while something consumes them: the screencast, every frame acked.
    client.on((msg) => {
      if (msg.method === 'Page.screencastFrame' && msg.sessionId === sid) client.send('Page.screencastFrameAck', { sessionId: msg.params.sessionId }, sid).catch(() => {});
    });
    const mouse = (type, x, y) => client.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 }, sid).catch(() => {});
    const move = (x, y) => client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 }, sid).catch(() => {});

    await client.send('Page.navigate', { url: `${base}/build/${game}/index.html?first=0&lang=en&force=1` }, sid);
    let up = false;
    for (let i = 0; i < 60 && !up; i++) { await sleep(250); up = await ev(`!!(window.__WEB__ && window.__LEVELS__ && window.__LEVELS__.active && window.__LEVELS__.active())`).catch(() => false); }
    if (!up) throw new Error(game + ' has no level map — nothing to walk');
    await sleep(2500);                      // the splash and the hub settle
    await ev(HOOK);
    await ev(`(window.__WEB__.Sound.unlock(), true)`);
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 30, everyNthFrame: 4 }, sid);

    const count = await ev(`window.__LEVELS__.count()`);
    const left = new Set(keys), steps = [];
    const start = async (n) => {
      await ev(`(window.__LEVELS__.play(${n}), true)`);
      await sleep(600);
      await ev(`(window.__WEB__.Enter && window.__WEB__.Enter.skip && window.__WEB__.Enter.skip(), true)`).catch(() => {});
    };
    // What fired since the last look, each on its row, the first level it was heard on kept.
    const stages = {};
    const drain = async () => {
      for (const c of await ev(`(window.__probe || []).splice(0)`)) {
        const row = c.level ? match(c) : null;
        if (!row) continue;
        if (!stages[row.checkId]) stages[row.checkId] = c.level;
        if (left.delete(row.sound)) found(row.sound, c.level);
      }
    };
    let levels = 0;
    for (let n = 1; n <= count && left.size; n++) {
      levels = n;
      progress({ level: n, count, left: [...left] });
      await start(n);
      const t0 = Date.now();
      let lastClock = -1, still = 0, rounds = 1;
      while (Date.now() - t0 < seconds * 1000 && left.size) {
        const st = await ev(`(() => { const W = window.__WEB__; if (W.state() === "playing") W.Loop.rate(${rate}); return { s: W.state(), c: W.Round.elapsed ? W.Round.elapsed() : 0 }; })()`).catch(() => ({ s: '?', c: 0 }));
        if (st.s !== 'playing') { await start(n); rounds++; continue; }
        if (st.c === lastClock) {
          // A frozen clock is a card over the round (or a game waiting on the DOM): ESCAPE once, then a new round.
          if (++still === 4) await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sid).catch(() => {});
          if (still >= 8) { await start(n); rounds++; still = 0; }
        } else still = 0;
        lastClock = st.c;
        // One gesture, picked at random: a tap, a hold, a drag or a flick.
        const a = await ev(AREA).catch(() => null);
        if (a) {
          const rx = () => a.x0 + Math.random() * (a.x1 - a.x0), ry = () => a.y0 + Math.random() * (a.y1 - a.y0);
          const x = rx(), y = ry(), g = Math.random();
          await mouse('mousePressed', x, y);
          if (g < 0.4) await sleep(40);
          else if (g < 0.6) await sleep(300 + Math.random() * 600);
          else {
            const tx = g < 0.8 ? rx() : x + (Math.random() < 0.5 ? -1 : 1) * 120, ty = g < 0.8 ? ry() : y + (Math.random() - 0.5) * 60;
            for (let i = 1; i <= 6; i++) { await move(x + (tx - x) * i / 6, y + (ty - y) * i / 6); await sleep(g < 0.8 ? 60 : 15); }
          }
          await mouse('mouseReleased', x, y);
        }
        /* And now and then nothing at all: a mechanic that pays for staying
           put (an ice rock thrown after a hold, a fuse burning down under the
           body) never fires under a pilot that presses three times a second. */
        await sleep(Math.random() < 0.35 ? 700 + Math.random() * 1800 : 120 + Math.random() * 200);
        await drain();
      }
      steps.push(`level ${n}: ${rounds} round${rounds > 1 ? 's' : ''}, ${left.size} key${left.size === 1 ? '' : 's'} left`);
      log('  ' + steps[steps.length - 1]);
    }
    await client.send('Page.stopScreencast', {}, sid).catch(() => {});
    return { stages, levels, left: [...left], steps };
  } finally {
    if (client) client.close();
    try { child.kill('SIGKILL'); } catch {}
    await sleep(300);
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  }
}
