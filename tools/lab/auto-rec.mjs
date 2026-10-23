/*
  auto-rec — REC without a player: a headless Chrome plays a game's levels and
  films every callout, notice and cue that has no clip yet, so both pages of
  the events bench can loop the moment of the game each line fires on.

    called by serve-events.mjs (POST /api/auto-rec, the Auto rec button of the
    message page and of the sound page); it needs that server's build to play.

  It is the page's REC with the two halves it lacks put back. The page records
  what a person plays, so a line is captured only once someone reaches it;
  here the blind pilot of tools/lab/probe-stages.mjs plays instead — taps,
  holds, drags, flicks and idle stretches, level after level — and the
  DevTools screencast films the whole page (tools/lab/shoot-shell.mjs), so a
  clip holds the HUD, the callouts, the notices and the star pill as the
  player sees them: it is filed `screen`, exactly as a REC of the shared tab.

  Every Pop.show, Pop.text, Notify.say and Sound.clip/cue/beep/arp the game
  makes is logged with its wall-clock time and its caller's stack; the caller
  matches it to its scanned row. A row in `want` (no clip yet) opens a window
  of PRE seconds before it and POST after — another wanted row firing inside
  an open window joins it rather than opening a second one — and every row
  that fired inside the window rides along in the clip's list, as the page's
  capture does. The frames are kept in a ring of RING seconds, which covers
  the pilot's longest gesture between two looks at the log. A window is
  encoded off the event loop (ffmpeg, encodeAsync) as soon as it closes, and
  handed to `save`, so the cards fill in while the walk goes on.

  The round runs at its own speed (no Loop.rate): a clip is watched, and a
  world at double speed is not the moment a player meets. The pilot is not a
  player either: a line that needs a skilled move may never fire, and the
  result says how many stayed without a clip rather than guessing. Levels the
  caller names in `first` (the stages already known for the wanted keys) are
  walked before the others, in order.
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sweep } from './chrome.mjs';
import { launch, cdp, encodeAsync } from './shoot-shell.mjs';
import { AREA, gesture } from './probe-stages.mjs';

const VW = 450, VH = 800;                  // the 720×1280 frame at 0.625
const PRE = 1, POST = 1;                   // seconds kept either side of a line
const RING = 8;                            // seconds of frames kept behind the newest
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Every call of the game a row of the bench can be, with its level, its time and its caller.
const HOOK = `(() => {
  const W = window.__WEB__;
  if (!W || W.__autoRec) return false;
  window.__autoRec = [];
  const wrap = (obj, meth, name) => {
    const o = obj && obj[meth];
    if (typeof o !== "function") return;
    obj[meth] = function () {
      const L = window.__LEVELS__;
      window.__autoRec.push({ name, level: L && L.current ? L.current() : 0, t: performance.timeOrigin + performance.now(), stack: new Error().stack });
      return o.apply(this, arguments);
    };
  };
  ["show", "text"].forEach((m) => wrap(W.Pop, m, "Pop." + m));
  wrap(W.Notify, "say", "Notify.say");
  ["clip", "cue", "beep", "arp"].forEach((m) => wrap(W.Sound, m, "Sound." + m));
  W.__autoRec = true;
  return true;
})()`;

/**
 * Play a game's levels and film every wanted line the first time it fires.
 * @param {{ base: string, game: string, want: Set<string>, match: Function, first?: number[],
 *           seconds?: number, minutes?: number, save: Function, log?: Function, progress?: Function, heard?: Function }} o
 *   `want` is the checkIds still without a clip; it is emptied as they are filmed.
 *   `match({ name, stack })` is the caller's: the scanned row that call is
 *   ({ checkId, name, line, fn, sound }), or null for a call the game did not make itself.
 *   `save({ webm, dur, at, events, claim })` files one clip; `heard(key, level)` is told
 *   every sound key heard, for lab/events-stages.json.
 * @returns {Promise<{ clips: number, left: number, levels: number, steps: string[] }>}
 */
export async function autoRec({ base, game, want, match, first = [], seconds = 20, minutes = 30, save,
  log = () => {}, progress = () => {}, heard = () => {} }) {
  sweep('auto-rec-');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-rec-'));
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-rec-frames-'));
  const { child, port } = await launch(profile, { label: 'auto-rec', minutes: minutes + 5 });
  let client = null;
  const pending = [];
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
    const mouse = (type, x, y) => client.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 }, sid).catch(() => {});
    const move = (x, y) => client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 }, sid).catch(() => {});

    // The film: every frame, in a ring; an open window holds its own on top.
    let frames = [];
    client.on((msg) => {
      if (msg.method !== 'Page.screencastFrame' || msg.sessionId !== sid) return;
      frames.push({ t: msg.params.metadata.timestamp * 1000, data: Buffer.from(msg.params.data, 'base64') });
      client.send('Page.screencastFrameAck', { sessionId: msg.params.sessionId }, sid).catch(() => {});
    });

    await client.send('Page.navigate', { url: `${base}/build/${game}/index.html?first=0&lang=en&force=1` }, sid);
    let up = false;
    for (let i = 0; i < 60 && !up; i++) { await sleep(250); up = await ev(`!!(window.__WEB__ && window.__LEVELS__ && window.__LEVELS__.active && window.__LEVELS__.active())`).catch(() => false); }
    if (!up) throw new Error(game + ' has no level map — nothing to walk');
    await sleep(2500);                      // the splash and the hub settle
    await ev(HOOK);
    await ev(`(window.__WEB__.Sound.unlock(), true)`);
    await client.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 2 }, sid);

    const log_ = [], inflight = new Set();
    let open = null, saved = 0, n = 0;
    // A window closed: its frames to a webm, its rows to the index.
    const close = (win) => {
      const shot = frames.filter((f) => f.t >= win.t0 && f.t <= win.until);
      if (shot.length < 4) { win.ids.forEach((id) => inflight.delete(id)); return; }
      const t0 = shot[0].t, t1 = shot[shot.length - 1].t;
      const events = log_.filter((e) => e.t >= t0 && e.t <= t1)
        .map((e) => ({ id: e.id, name: e.name, line: e.line, fn: e.fn, t: Math.round(e.t - t0) / 1000 }));
      const claim = [...win.ids];
      const at = Math.round(win.at - t0) / 1000;
      const name = 'c' + (n++);
      pending.push(encodeAsync(shot, work, name)
        .then((webm) => save({ webm, dur: (t1 - t0) / 1000 + 0.05, at, events, claim }))
        .then((r) => {
          if (r && r.error) throw new Error(r.error);
          claim.forEach((id) => want.delete(id));
          saved++;
          log(`  clip ${saved}: ${[...new Set(events.filter((e) => claim.includes(e.id)).map((e) => e.name + ' L' + e.line))].join(', ')}`);
        })
        .catch((e) => log('  a clip failed — ' + e.message))
        .finally(() => claim.forEach((id) => inflight.delete(id))));
    };
    // What fired since the last look: logged, and a wanted row opens (or joins) a window.
    const drain = async () => {
      for (const c of await ev(`(window.__autoRec || []).splice(0)`).catch(() => [])) {
        const row = match(c);
        if (!row) continue;
        if (row.sound && c.level) heard(row.sound, c.level);
        log_.push({ id: row.checkId, name: row.name, line: row.line, fn: row.fn || '', t: c.t });
        if (!want.has(row.checkId) || inflight.has(row.checkId)) continue;
        if (!open || c.t > open.until) {
          if (open) close(open);
          open = { t0: c.t - PRE * 1000, until: c.t + POST * 1000, at: c.t, ids: new Set() };
        }
        open.ids.add(row.checkId);
        inflight.add(row.checkId);
      }
      const last = frames.length ? frames[frames.length - 1].t : 0;
      if (open && last > open.until) { close(open); open = null; }
      // The ring: what no open window still needs, and what is older than RING.
      const keep = Math.min(last - RING * 1000, open ? open.t0 : Infinity);
      if (frames.length && frames[0].t < keep) frames = frames.filter((f) => f.t >= keep);
      if (log_.length > 2000) log_.splice(0, 1000);
    };

    const count = await ev(`window.__LEVELS__.count()`);
    const order = [...new Set(first.filter((l) => l >= 1 && l <= count))];
    for (let l = 1; l <= count; l++) if (!order.includes(l)) order.push(l);
    const start = async (lv) => {
      await ev(`(window.__LEVELS__.play(${lv}), true)`);
      await sleep(600);
      await ev(`(window.__WEB__.Enter && window.__WEB__.Enter.skip && window.__WEB__.Enter.skip(), true)`).catch(() => {});
    };
    const steps = [], deadline = Date.now() + minutes * 60 * 1000;
    const left = () => [...want].filter((id) => !inflight.has(id)).length;
    let levels = 0;
    for (const lv of order) {
      if (!left() || Date.now() > deadline) break;
      levels++;
      progress({ level: lv, count, done: levels, left: want.size, clips: saved });
      await start(lv);
      const t0 = Date.now();
      let lastClock = -1, still = 0, rounds = 1;
      while (Date.now() - t0 < seconds * 1000 && left() && Date.now() < deadline) {
        const st = await ev(`(() => { const W = window.__WEB__; return { s: W.state(), c: W.Round.elapsed ? W.Round.elapsed() : 0 }; })()`).catch(() => ({ s: '?', c: 0 }));
        if (st.s !== 'playing') {
          // The end of a round is part of its moment: the window open on it is let run before the next one starts.
          if (open) { await sleep(POST * 1000 + 200); await drain(); }
          await start(lv); rounds++; continue;
        }
        if (st.c === lastClock) {
          // A frozen clock is a card over the round (or a game waiting on the DOM): ESCAPE once, then a new round.
          if (++still === 4) await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sid).catch(() => {});
          if (still >= 8) { await start(lv); rounds++; still = 0; }
        } else still = 0;
        lastClock = st.c;
        await gesture(mouse, move, await ev(AREA).catch(() => null));
        await drain();
        progress({ level: lv, count, done: levels, left: want.size, clips: saved });
      }
      steps.push(`level ${lv}: ${rounds} round${rounds > 1 ? 's' : ''}, ${want.size} line${want.size === 1 ? '' : 's'} left`);
      log('  ' + steps[steps.length - 1]);
    }
    // The last window plays out before the film stops.
    if (open) { await sleep(POST * 1000 + 300); await drain(); if (open) { close(open); open = null; } }
    await client.send('Page.stopScreencast', {}, sid).catch(() => {});
    await Promise.all(pending);
    return { clips: saved, left: want.size, levels, steps };
  } finally {
    await Promise.all(pending).catch(() => {});
    if (client) client.close();
    try { child.kill('SIGKILL'); } catch {}
    await sleep(300);
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    fs.rmSync(work, { recursive: true, force: true });
  }
}
