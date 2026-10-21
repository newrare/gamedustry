#!/usr/bin/env node
/*
  sim-economy — what a session of play is worth, in every game, without
  playing it.

    node tools/lab/sim-economy.mjs                  # 20 min and 2 h, every game
    node tools/lab/sim-economy.mjs --minutes=20,60,240 --round=90 --perfect=0.3
    node tools/lab/sim-economy.mjs vipera gearball
    node tools/lab/sim-economy.mjs --gallery        # the gallery's puzzle pieces

  A PLAYER IS MODELLED, NOT MEASURED. They climb the map one level per round,
  score the game's reference round (tools/lib/economy.mjs) scaled along the
  climb, three-star a share of the levels the first time they play them
  (`--perfect`), and replay at the top once the thirty are done. They watch no
  ad and open no daily road: what is printed is what PLAYING pays, which is the
  part the user's complaint was about. A round lasts `--round` seconds, menus
  included — the one number that is a guess for every game at once; a game
  whose rounds run longer (gearball) earns less per minute than the table says.

  The figures are EXPECTED values (a gift box is its average, not a roll), so
  two runs print the same table. The formulas mirror packages/webshell/meta.js
  — `xpFor`, the end screen's payout, `randomReward` — and the rates come from
  tools/lib/economy.mjs, which is what the builder injects: a change to either
  side is a change to make on both.
*/
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { roundScore, coinsPer, derivedRates, legible, REF_CLIMB } from '../lib/economy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const args = process.argv.slice(2);
const flag = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.slice(k.length + 3) : d;
};
const MINUTES = flag('minutes', '20,120').split(',').map(Number);
const ROUND_S = Number(flag('round', 90));
const PERFECT = Number(flag('perfect', 0.3));
const only = args.filter((a) => !a.startsWith('--'));
const GALLERY = args.includes('--gallery');

/* packages/webshell/meta.js, `xpFor` and `levelAt`. */
const xpFor = (l) => Math.round(500 * Math.pow(l, 1.5));
function levelAt(x) {
  let l = 1;
  while (x >= xpFor(l) && l < 999) { x -= xpFor(l); l++; }
  return l;
}

/* How a round's score grows up the climb: the objectives of the thirteen run
   from about 1x to 6.5x between level 1 and level 30, so the reference round
   (a third of the way up) is scaled on that line rather than on each game's
   own, which a par or a count cannot be read on. */
const GROWTH = 5.5;
const scoreAt = (ref, d) => ref * (1 + GROWTH * d) / (1 + GROWTH * REF_CLIMB);

/* The three-star bonus, `randomReward(true)` on average: 34 % coins (half a
   ticket to one), 24 % xp (20 to 35 % of the level), 24 % one ticket, 18 % a
   sticker — counted apart, it is not spendable. */
function bonusGift(ticket, need) {
  return { coins: 0.34 * 0.75 * ticket, xp: 0.24 * 0.275 * need, tickets: 0.24, stickers: 0.18 };
}

function simulate(web) {
  const rates = derivedRates(web);
  const ref = roundScore(web), per = coinsPer(web);
  const totals = MINUTES.map(() => null);
  let coins = 0, xp = 0, tickets = 1, stickers = 0, fromCoins = 0, fromLevels = 0, fromGifts = 0;
  const rounds = Math.max(...MINUTES) * 60 / ROUND_S;
  for (let i = 1; i <= rounds; i++) {
    const map = Math.min(i, 30);
    const d = Math.pow((map - 1) / 29, 0.9);
    const score = scoreAt(ref, d);
    const lvl = levelAt(xp);
    const earn = Math.floor(score / per) * lvl;
    coins += earn; fromCoins += earn / rates.ticketPrice;
    const before = levelAt(xp);
    xp += Math.floor(score / rates.xpPer);
    /* The first time a level is played; the replays past thirty earn none. */
    if (i <= 30) {
      const g = bonusGift(rates.ticketPrice, xpFor(levelAt(xp)));
      coins += PERFECT * g.coins; fromGifts += PERFECT * (g.coins / rates.ticketPrice + g.tickets);
      xp += PERFECT * g.xp; tickets += PERFECT * g.tickets; stickers += PERFECT * g.stickers;
    }
    const up = levelAt(xp) - before;
    tickets += up; fromLevels += up;
    MINUTES.forEach((m, k) => {
      if (!totals[k] && i >= m * 60 / ROUND_S) {
        totals[k] = { level: levelAt(xp), tickets: tickets + coins / rates.ticketPrice,
                      fromCoins, fromLevels, fromGifts };
      }
    });
  }
  return { rates, ref, totals };
}

/* ── the gallery ─────────────────────────────────────────────────────────

   Does the gallery fill AT THE PACE OF THE MAP? Two players, the same game
   (the rates of the first one listed), and the price of a piece read off the
   same rule as packages/webshell/meta.js `galPrice`:

     price = legible(galleryRounds * roundCoins * level * album * ahead)
     album = 0.5 + 0.5 * stickers owned / 20       (cheaper while the machine
                                                     still takes the coins)
     ahead = 2^(8 * (pieces% - 0.85 * stars%)), clamped to 0.5..8
                                                    (`--steep`, `--pace`, `--cap`)

   CLIMBER plays the thirty levels once (2.1 stars each on average, `--perfect`
   of them at three), then replays what is not perfect and gains `--replay`
   stars a round until 90/90. FARMER plays the first ten and then replays them
   for ever, gaining nothing. Both send half their coins to the machine until
   it has eaten 40 tickets — about what its eight stickers cost — and the rest
   to the gallery, buying every piece the purse can pay. The album's twelve
   milestone stickers are modelled as following the stars.

   What it showed: under a ×4 ceiling a slow climber's gallery ran 10
   points ahead of the map by the second hour — once the machine is done the
   gallery is the only thing left to buy, and coins pile up faster than the
   last stars come. ×8 and a steeper curve keep it within a few points, and a
   farmer still finishes it, slowly: that is a player playing, which is the
   point. */
const REPLAY = Number(flag('replay', 0.45));
const STEEP = Number(flag('steep', 8)), PACE = Number(flag('pace', 0.85)), CAP = Number(flag('cap', 8));
const MACHINE_TICKETS = 40;
const STICKERS = 20, MILESTONES = 12;

function gallery(web, profile) {
  const rates = derivedRates(web);
  const ref = roundScore(web), per = coinsPer(web);
  const PIECES = 90, MAX = 90;
  let xp = 0, stars = 0, pieces = 0, purse = 0, machine = 0, tix = 1;
  const out = [];
  const rounds = Math.max(...MINUTES) * 60 / ROUND_S;
  let doneAt = null, gifted = 0;
  for (let i = 1; i <= rounds; i++) {
    const top = profile === 'farmer' ? 10 : 30;
    const map = Math.min(i, top);
    const d = Math.pow((map - 1) / 29, 0.9);
    const lvl = levelAt(xp);
    const earn = Math.floor(scoreAt(ref, d) / per) * lvl;
    const before = lvl;
    xp += Math.floor(scoreAt(ref, d) / rates.xpPer);
    tix += levelAt(xp) - before;
    if (i <= top) stars += 2.1 + 0.9 * (PERFECT - 0.3);
    else if (profile === 'climber') stars += REPLAY;
    stars = Math.min(MAX, stars);
    /* the machine first, half the coins, until its stickers are drawn */
    const toMachine = machine < MACHINE_TICKETS ? earn / 2 : 0;
    machine = Math.min(MACHINE_TICKETS, machine + toMachine / rates.ticketPrice + tix);
    tix = 0;
    purse += earn - toMachine;
    const s = stars / MAX;
    const owned = MILESTONES * s + (STICKERS - MILESTONES) * machine / MACHINE_TICKETS;
    const album = 0.5 + 0.5 * owned / STICKERS;
    const price = () => {
      const ahead = Math.min(CAP, Math.max(0.5, Math.pow(2, STEEP * (pieces / PIECES - PACE * s))));
      return legible(rates.galleryRounds * rates.roundCoins * levelAt(xp) * album * ahead);
    };
    while (pieces < PIECES && purse >= price()) { purse -= price(); pieces++; }
    if (stars >= MAX && doneAt == null) { doneAt = i; gifted = PIECES - pieces; pieces = PIECES; }
    MINUTES.forEach((m) => {
      if (i === Math.round(m * 60 / ROUND_S)) {
        out.push({ profile, minutes: m, 'stars %': Math.round(s * 100),
                   'pieces %': Math.round(pieces / PIECES * 100),
                   'price (rounds)': pieces < PIECES
                     ? Math.round(price() / (rates.roundCoins * levelAt(xp)) * 10) / 10 : '-',
                   level: levelAt(xp) });
      }
    });
  }
  return { out, doneAt, gifted };
}

if (GALLERY) {
  const slug = only[0] || 'vipera';
  const web = JSON.parse(readFileSync(path.join(ROOT, 'games', slug, 'manifest.json'), 'utf8')).web;
  const rows = [], notes = [];
  for (const p of ['climber', 'farmer']) {
    const g = gallery(web, p);
    rows.push(...g.out);
    if (g.doneAt) notes.push(`${p}: 90/90 after ${Math.round(g.doneAt * ROUND_S / 60)} min, ${g.gifted} pieces handed over by it`);
  }
  console.log(`${slug}: rounds of ${ROUND_S} s, ${REPLAY} stars a replay, ${Math.round(PERFECT * 100)} % three-starred the first time`);
  console.table(rows);
  notes.forEach((n) => console.log(n));
  process.exit(0);
}

const rows = [];
for (const slug of readdirSync(path.join(ROOT, 'games')).sort()) {
  if (only.length && !only.includes(slug)) continue;
  const file = path.join(ROOT, 'games', slug, 'manifest.json');
  if (!existsSync(file)) continue;
  const web = JSON.parse(readFileSync(file, 'utf8')).web;
  if (!web || !web.meta) continue;
  const { rates, ref, totals } = simulate(web);
  const row = { game: slug, roundScore: Math.round(ref), ticket: rates.ticketPrice, xpPer: rates.xpPer };
  MINUTES.forEach((m, k) => {
    const t = totals[k];
    row[`lv@${m}`] = t.level;
    row[`tix@${m}`] = Math.round(t.tickets * 10) / 10;
  });
  const last = totals[totals.length - 1];
  row['coins/lvl/gift'] = [last.fromCoins, last.fromLevels, last.fromGifts]
    .map((v) => Math.round(v * 10) / 10).join(' / ');
  rows.push(row);
}
console.log(`rounds of ${ROUND_S} s, ${Math.round(PERFECT * 100)} % of levels three-starred the first time, no ad, no daily road`);
console.table(rows);
