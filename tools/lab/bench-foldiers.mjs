#!/usr/bin/env node
/* The foldiers bench (docs/FOLDIERS.md, section 11): games/foldiers/game.js
 * run in Node with the motor stubbed, every stage generated and played by a
 * scripted pilot that sends its orders through the game's own functions.
 * Prints, per stage, the map's size, the time reset() takes (the bake is most
 * of it) and one result per seed: W<stars>/<ticks>, L0/<ticks>, or -/60 for a
 * stage still undecided after sixty ticks.
 *
 *   node tools/lab/bench-foldiers.mjs                 # 30 stages x 3 seeds
 *   node tools/lab/bench-foldiers.mjs 12              # 12 seeds
 *   node tools/lab/bench-foldiers.mjs 6 1,7,30        # three stages
 *   DIAG=1 node tools/lab/bench-foldiers.mjs 1 25     # + who holds what at the end
 *
 * The pilot is PLAIN on purpose — it marches everything toward the stage's
 * goal and attacks what its pooled neighbours outnumber, seed by seed a
 * careful and a bold one — so a stage it cannot win is a stage a player who
 * reads the tags may still win, and a stage it wins easily is too easy.
 * The AI's four knobs are lerped over the climb as web.levels.tune does.
 */
import { readFileSync } from "node:fs";

const ROOT = new URL("../..", import.meta.url).pathname;
const SRC = process.env.SRC || ROOT + "games/foldiers/game.js";   // SRC=<file> benches another copy
const SEEDS = +(process.argv[2] || 3);
const ONLY = process.argv[3] ? process.argv[3].split(",").map(Number) : null;
let src = readFileSync(SRC, "utf8");
src = src.replace("    return { reset: reset, update: update,",
  "    globalThis.__F = { S: function () { return { regions: regions, orders: orders, cavOrders: cavOrders, phase: phase, won: won, lost: lost, tick: tick, M: M, stat: stat, gold: gold, rules: rules, acts: acts, row: row, score: score, latch: latch, GEO: GEO, pickDoctrine: pickDoctrine }; }, setPick: function (v) { pickDoctrine = v; doctrine = v ? '' : 'blitz'; }, setDoc: function (d) { doctrine = d; pickDoctrine = false; }, classify: classify, forecast: forecast, verdict: verdict, startResolve: startResolve, applyResolve: applyResolve, finish: finish, tallyNow: tallyNow, objNow: objNow, owns: owns, genMap: genMap, STAGES: STAGES, fitZoom: fitZoom, setRng: function (s) { rng = makeRng(s); }, adj: function () { return adj; }, regionActions: regionActions, mult: mult, defParts: defParts, ATK: typeof ATTACK_PTS === 'undefined' ? 1 : ATTACK_PTS, cavReach: cavReach, isNb: isNb, canCross: canCross };\n    return { reset: reset, update: update,");

function noop() {}
const ctx2d = new Proxy({}, { get: (t, k) => k === "createImageData" ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })
  : k === "measureText" ? (s) => ({ width: String(s).length * 11 }) : k === "getImageData" ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })
  : k === "createPattern" ? () => ({}) : noop, set: () => true });
const fakeCanvas = () => ({ width: 0, height: 0, style: {}, getContext: () => ctx2d, addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 1280 }) });
const store = {};
const G = {
  ctx: ctx2d, canvas: fakeCanvas(), view: { w: 720, h: 1280, dpr: 1 },
  Layout: { top: 150, bottom: 1254, left: 26, right: 694, w: 668, h: 1100, cx: 360, cy: 700 },
  Lang: { t: (s) => s }, Store: { get: (k, d) => (k in store ? store[k] : d), set: (k, v) => { store[k] = v; } },
  Notify: { say: noop, learn: noop }, Pop: { show: noop, text: noop }, HUD: { setScore: noop, setScoreNow: noop, punch: noop, setLeft: noop, setRight: noop },
  Sound: { clip: noop }, Enter: { begin: () => true, end: noop }, ArtImages: {}, freeCanvas: () => null,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)), rgba: () => "#000", upper: (s) => s,
  endRound: (r) => { G.__result = r; }, document: { createElement: fakeCanvas, documentElement: {} },
  getComputedStyle: () => ({ getPropertyValue: () => "" }), location: { search: "" }, window: { addEventListener: noop },
  State: "playing"
};
const fn = new Function(...Object.keys(G), src + "\nreturn { CONFIG: CONFIG, Game: Game };");
const { CONFIG, Game } = fn(...Object.values(G));
const F = globalThis.__F;
CONFIG.web = {};

// The pilot: march everything toward the stage's goal, attack whatever its
// pooled neighbours outnumber, ship across the water when the goal is overseas.
function goalOf(s) {
  const o = s.row.obj[0], r = s.M.roles;
  if (o[0] === "take") return r[o[1]] != null && o[1] !== "hiddenCap" && o[1] !== "farCap" ? r[o[1]] : r.redCap;
  if (o[0] === "holdK" || o[0] === "holdAll" || o[0] === "holdRegions" || o[0] === "troops") return r.redCap;
  if (o[0] === "wonder") return r.wonder;
  if (o[0] === "takeAll") return r.isles[0];
  return r.redCap;
}
function pilot(careful) {
  const s = F.S(), R = s.regions, adj = F.adj();
  if (s.pickDoctrine) F.setDoc("blitz");
  R.forEach((r) => { if (r.owner === 1 && s.rules.recruit && (r.city || r.capital) && s.gold[1] >= 3) { s.gold[1] -= 3; s.acts.push({ kind: "recruit", at: r.id }); s.stat.recruit[r.id] = true; } });
  const goal = goalOf(s);
  // what a region must keep: enough to hold against its enemy neighbours
  const keepOf = (r) => Math.ceil(adj[r.id].reduce((t, n) => t + (R[n].owner > 1 && R[n].owner !== 4 ? R[n].troops : 0), 0) / 1.5) + (r.capital ? 1 : 0);
  // steps to the goal, through any land a column can cross
  const dist = {}; const q = [goal]; dist[goal] = 0;
  while (q.length) { const c = q.shift(); adj[c].forEach((n) => { if (dist[n] == null && F.canCross(c, n)) { dist[n] = dist[c] + 1; q.push(n); } }); }
  const used = {};
  const reach = (n, t) => { const c = F.classify(n, t, null, 1); return c.ok && !c.eta; };
  const cands = R.filter((t) => t.owner !== 1 && adj[t.id].some((n) => R[n].owner === 1 && reach(n, t.id)));
  cands.sort((a, b) => (dist[a.id] == null ? 99 : dist[a.id]) - (dist[b.id] == null ? 99 : dist[b.id]) || a.troops - b.troops);
  for (const t of cands) {
    const k = F.mult(F.defParts(t.id, t.owner, t.general)) / F.ATK;   // in attacking troops
    const need = t.troops * k * (careful ? 1.3 : 1.08) + 0.6 + (t.capital ? 2 : 0);
    const src = adj[t.id].filter((n) => R[n].owner === 1 && !used[n] && R[n].troops > 1 && reach(n, t.id));
    src.sort((a, b) => R[b].troops - R[a].troops);
    let sum = 0; const pick = [];
    for (const n of src) { if (sum >= need) break; sum += R[n].troops - (R[n].capital ? keepOf(R[n]) : 0); pick.push(n); }
    if (sum < need) continue;
    pick.forEach((n) => { used[n] = true; s.orders[n] = { to: t.id, frac: 1, kind: "move" }; });
  }
  // overseas: a full harbour ships to the nearest harbour of the goal's side
  if (dist[s.M.roles.blueCap] == null || R[s.M.roles.blueCap].comp !== R[goal].comp) {
    R.filter((r) => r.owner === 1 && r.harbour && !used[r.id] && r.troops >= 6).forEach((h) => {
      const dst = R.filter((t) => t.harbour && t.owner !== 1 && t.comp !== h.comp).sort((a, b) => (dist[a.id] ?? 99) - (dist[b.id] ?? 99) || a.troops - b.troops)[0];
      if (dst && F.classify(h.id, dst.id, null, 1).ok) { used[h.id] = true; s.orders[h.id] = { to: dst.id, frac: 1, kind: "fleet" }; }
    });
  }
  // the rest marches toward the goal, a step a tick, leaving one behind
  const front = (r) => adj[r.id].some((n) => R[n].owner > 1);
  R.forEach((r) => {
    if (r.owner !== 1 || used[r.id] || r.troops < 2 || front(r)) return;
    let best = -1;
    adj[r.id].forEach((n) => { if (R[n].owner === 1 && F.canCross(r.id, n) && dist[n] != null && (best < 0 || dist[n] < dist[best])) best = n; });
    if (best < 0 || (dist[best] ?? 99) >= (dist[r.id] ?? 99)) {
      // landlocked from the goal: walk to the nearest harbour instead
      const hb = R.filter((h) => h.owner === 1 && h.harbour);
      if (!hb.length) return;
      adj[r.id].forEach((n) => { if (R[n].owner === 1 && F.canCross(r.id, n) && (best < 0 || Math.hypot(R[n].cx - hb[0].cx, R[n].cy - hb[0].cy) < Math.hypot(R[best].cx - hb[0].cx, R[best].cy - hb[0].cy))) best = n; });
      if (best < 0 || r.harbour) return;
    }
    const go = r.troops - Math.max(1, keepOf(r));
    if (go > 0) s.orders[r.id] = { to: best, n: go, frac: 1, kind: "move" };
  });
}

const rows = [];
for (let n = 1; n <= 30; n++) {
  if (ONLY && !ONLY.includes(n)) continue;
  const out = { n, gen: 0, bake: 0, tex: 0, res: [] };
  for (let sd = 0; sd < SEEDS; sd++) {
    {
      CONFIG.level = n;
      const tune = JSON.parse(readFileSync(ROOT + "games/foldiers/manifest.json", "utf8")).web.levels.tune, dd = (n - 1) / 29;
      for (const k in tune) CONFIG.play[k.split(".")[1]] = tune[k][0] + (tune[k][1] - tune[k][0]) * dd;
      const t0 = performance.now();
      Game.reset();
      const t1 = performance.now();
      if (sd === 0) { out.reset = Math.round(t1 - t0); out.tex = F.S().M.regions.reduce((a, r) => a + r.poly.length, 0); }
      F.setRng(1000 + sd * 77);
      let guard = 0;
      G.__result = null;
      while (guard++ < 60) {
        const s = F.S();
        if (s.phase === "over") { F.finish(); break; }
        if (s.phase !== "plan") break;
        pilot(sd % 2 === 1);
        F.startResolve(false);
        F.applyResolve();
      }
      const s = F.S(), r = G.__result;
      out.res.push(r ? (s.won ? "W" : "L") + r.stars + "/" + s.tick : "-/" + s.tick);
    }
  }
  rows.push(out);
  console.log(`stage ${String(n).padStart(2)}  regions ${String(F.S().regions.length).padStart(2)}  reset ${String(out.reset).padStart(5)} ms  vertices ${String(out.tex).padStart(4)}  ${out.res.join(" ")}`);
}
if (process.env.DIAG) {
  const s = F.S(), R = s.regions;
  const by = {}; R.forEach((r) => { by[r.owner] = by[r.owner] || [0, 0]; by[r.owner][0]++; by[r.owner][1] += r.troops; });
  console.log("owners [regions, troops]:", JSON.stringify(by), "redCap troops", R[s.M.roles.redCap].troops, "owner", R[s.M.roles.redCap].owner, "blueCap", R[s.M.roles.blueCap].troops);
}
