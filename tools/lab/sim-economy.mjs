#!/usr/bin/env node
/*
  sim-economy — what a session of play is worth, in every game, without
  playing it.

    node tools/lab/sim-economy.mjs                  # 20 min and 2 h, every game
    node tools/lab/sim-economy.mjs --minutes=20,60,240 --round=90 --perfect=0.3
    node tools/lab/sim-economy.mjs vipera gearball

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
import { roundScore, coinsPer, derivedRates, REF_CLIMB } from '../lib/economy.mjs';

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
