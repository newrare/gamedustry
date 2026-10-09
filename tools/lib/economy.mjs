/*
  THE ECONOMY'S ONE UNIT IS THE ROUND.

  Every game scores on its own scale — vipera's runs are worth a few hundred
  points, gearball's tens of thousands — and the ticket price and the xp rate
  used to be typed per game to match. They drifted: a ticket cost about eight
  rounds of play on vipera and forty-five on chainring, a round paid 60 xp on
  pawko and 1 200 on gearball, and the gifts, which pay fixed sums, handed
  vipera's player forty-six tickets out of one box. So the two rates are no
  longer written in a manifest: they are DERIVED here from one number the
  game owns — what a typical round scores — and the builder injects them into
  CONFIG.web.meta (tools/build/build.mjs). tools/lab/sim-economy.mjs reads the
  same functions, so what the simulator measures is what ships.

  `roundScore` is the score of a REFERENCE ROUND: a third of the way up the
  climb, played to about two stars. A game whose score is its objective
  writes nothing and gets 1.5x the objective at a third of the climb; a game
  whose objective is something else (a distance, a count, a par) states it in
  `web.meta.roundScore`.
*/

/* How many reference rounds a ticket costs, paid at REF_LEVEL — the player
   level a reference round is typically played at. The level multiplies the
   coins (docs/META.md), so a ticket is cheaper in rounds above it and dearer
   under it, which is the lever doing its job. */
export const TICKET_ROUNDS = 20;
export const REF_LEVEL = 3;

/* What a reference round pays in xp, whatever the game. The curve under it
   (packages/webshell/meta.js, `xpFor`) is 500 * l^1.5. */
export const ROUND_XP = 100;

/* Where on the climb the reference round sits, and how far above the
   objective it is played: 1x is one star, 1.5x two, 2.2x three. */
export const REF_CLIMB = 1 / 3;
export const REF_PLAY = 1.5;

/* The house's rounding for a price: the exact figure under twenty, a multiple
   of five above it — the same `legible` as packages/webshell/meta.js. */
export function legible(v) {
  v = v < 20 ? Math.round(v) : Math.round(v / 5) * 5;
  return Math.max(1, v);
}

export function roundScore(web) {
  const meta = (web && web.meta) || {};
  if (meta.roundScore != null) return meta.roundScore;
  const o = web && web.levels && web.levels.objective;
  if (!o) throw new Error('web.meta.roundScore is required for a game with no web.levels.objective');
  return REF_PLAY * (o.from + (o.to - o.from) * REF_CLIMB);
}

export function coinsPer(web) {
  return (web && web.meta && web.meta.coinsPer) || 1000;
}

/* The ticket: TICKET_ROUNDS reference rounds of coins at REF_LEVEL. */
export function ticketPrice(web) {
  const coins = Math.max(1, Math.floor(roundScore(web) / coinsPer(web)));
  return legible(TICKET_ROUNDS * coins * REF_LEVEL);
}

/* The xp rate: points per xp, so that a reference round pays ROUND_XP. */
export function xpPer(web) {
  return Math.max(1, Math.round(roundScore(web) / ROUND_XP));
}

/* The two rates, as the builder injects them. */
export function derivedRates(web) {
  return { ticketPrice: ticketPrice(web), xpPer: xpPer(web) };
}
