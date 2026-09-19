# Marketing — how a game finds players, and what it earns

This is the reasoning; [TODO.md](../TODO.md) holds the tasks. It answers one
question — *at what volume does a game become worth monetizing, and how does it
reach that volume without a budget* — and records the decisions taken on
2026-09-18 so they are not re-argued from scratch.

Everything here is an order of magnitude from the casual-games sector. The first
real cohort replaces it.

## Glossary

The five that carry every calculation below:

| term       | what it is                                                              |
| ---------- | ----------------------------------------------------------------------- |
| **DAU**    | people who *open* the game on a given day — not people who installed it |
| **eCPM**   | what an advertiser pays for 1 000 ad impressions                        |
| **ARPDAU** | what one active player earns per day of play                            |
| **LTV**    | what one player earns in total, over their whole life in the game       |
| **CPI**    | what one install costs to buy in advertising                            |

And the rest, in passing: **MAU** is DAU over 30 days (DAU/MAU measures
loyalty); **retention D1/D7/D30** is the share of players who reopen the game 1,
7 or 30 days after installing; **UA** is buying players; **ROAS** is what those
purchases returned; **fill rate** is the share of ad requests actually answered;
**remnant** is the cheap inventory that fills when nobody else bids;
**mediation** puts several ad networks in competition on each impression, and
**bidding** is its real-time form; an **interstitial** is the imposed full-screen
ad, a **rewarded** is the one the player opts into for a reward — it pays 2–3×
more and costs nothing in retention; **tier 1** is the countries where
advertisers pay most (US, UK, CA, DE, JP), worth up to 5× the same player
elsewhere.

## The economics

```
ARPDAU = (impressions per DAU) × eCPM / 1000
monthly revenue = ARPDAU × DAU × 30
```

Reference eCPMs: interstitial 2–4 $ on mixed traffic, 8–15 $ on tier 1; rewarded
6–10 $ and 15–30 $.

**Without paid UA there is no break-even.** The margin per install equals the
revenue per install, so it is positive from the first player. The threshold is
never economic — it is practical, and there are three of them:

| threshold                                 | at           | what it unlocks                           |
| ----------------------------------------- | ------------ | ----------------------------------------- |
| touching the money                        | 100 $ / 70 € | AdMob pays nothing below it               |
| a revenue worth noticing                  | ~1 000 DAU   | a few hundred € a month                   |
| worth optimizing (mediation, A/B on load) | ~3 000 DAU   | below it the time costs more than it pays |

So: **integrate ads at zero downloads** — the cost is one-off — and only start
tuning them past ~1 000 DAU.

| DAU   | realistic ARPDAU | €/month  |
| ----- | ---------------- | -------- |
| 200   | 0,008 $          | ~45 €    |
| 500   | 0,012 $          | ~165 €   |
| 1 000 | 0,018 $          | ~490 €   |
| 2 000 | 0,022 $          | ~1 200 € |
| 5 000 | 0,028 $          | ~3 800 € |

ARPDAU climbs with DAU (remnant fill → real bidding), so the curve is
**superlinear** between 200 and 2 000 DAU: doubling the audience more than
doubles the revenue.

### In downloads

`DAU ≈ installs per day × lifetime in days`, and the lifetime — the integral of
the retention curve — is 3 to 4 days for short casual games.

| target       | DAU    | installs/day | installs/month |
| ------------ | ------ | ------------ | -------------- |
| first payout | ~100   | ~30          | ~900           |
| ~150 €/month | ~500   | ~150         | ~4 500         |
| ~500 €/month | ~1 000 | ~300         | ~9 000         |
| ~1 200 €/mo  | ~2 000 | ~600         | ~18 000        |

**The stock does not count, the flow does.** 100 000 cumulative installs that
stopped a year ago are worth zero. The only question is how many new players
arrive per day, in steady state.

## Retention comes before volume

Both factors of `DAU = installs/day × lifetime` weigh the same in the formula.
They do not cost the same:

|                | doubling installs/day                 | doubling the lifetime         |
| -------------- | ------------------------------------- | ----------------------------- |
| what it takes  | work or money, **every day, forever** | one design decision, **once** |
| who it reaches | tomorrow's players                    | every player, past and future |

At 100 installs/day, a 2-day lifetime gives 200 DAU and a 6-day lifetime gives
600 — same acquisition, 3× the revenue.

And retention is not a factor beside the other one, it is **its input**: Play
ranks on retention and listing conversion, so retention buys ranking, which buys
organic installs. The reverse never happens — installs do not manufacture
retention. Without UA, volume is not a step you execute, it is the *output* of
retention.

### The ad load has a ceiling

"More play means more ads" is true up to tolerance. A casual player absorbs 4–8
interstitials a day before uninstalling; past that each extra impression earns
0,003 $ and costs a player worth 0,05 $.

Impressions **per day** therefore plateau fast. What does not plateau is the
**number of days**. A player's value is measured in return days, not in session
minutes — which is why rewarded ads are the format to lead with: the player
chose them, so they cost no retention at all.

Ordering, in practice: rewarded only below ~500 DAU; interstitials with a
frequency cap (one per 3 rounds, 60 s cooldown) from 500 to 2 000; mediation and
frequency A/B past ~3 000.

## Decision — thirteen separate apps, no pack (2026-09-18)

A single "NEWRARE Arcade" containing all thirteen was considered and **rejected**.
The argument for it was real — DAU and reviews concentrate, the lifetime climbs
because a bored player switches game instead of uninstalling, cross-promotion
becomes free, and one listing replaces thirteen (≈1–2 days of Play Console per
listing per year: target API deadlines, Data safety, content rating, ads
declaration, store graphics, crash and ANR thresholds, review triage).

It loses on the listing, which on Play **is** the product:

- thirteen incoherent art directions produce no single readable promise, and a
  pack gets one icon, one screenshot set, one sentence;
- "13 mini-games" is the exact shape of shovelware — a low-trust genre where
  real quality works against you, because nobody clicks through to verify it;
- the collections that work are coherent by genre (solitaire, puzzle) or carried
  by a known brand. Neither applies here.

Technically the pack was cheap: `dist/site` is already the thirteen web builds
behind one shared motor (41 MB, ~30 MB as an AAB, against Play's 200 MB limit),
so it would have been that folder in a Capacitor WebView. The decision is
commercial, not technical.

Two things survive from that analysis:

- **do not launch thirteen listings at once** — thirteen simultaneous launches
  teach nothing. Waves of three or four, each applying what the previous wave
  showed;
- Play production access is granted **at the account level** and is already
  held, so the 12-testers / 14-day gate does not apply per app (see
  [TODO.md](../TODO.md), *Android*).

## The portfolio is the right model — it needs a mechanism

Launching many games so that one covers the others is what Voodoo, Homa and
Supersonic actually do: dozens of prototypes, 95 % killed, one paying for
everything. Casual outcomes are a power law, so aiming at the average is
meaningless and buying tickets is correct.

With `p` the probability that one game takes off, thirteen games give
`1 − (1−p)¹³`:

| p per game | chance at least one takes off |
| ---------- | ----------------------------- |
| 1 %        | 12 %                          |
| 3 %        | 33 %                          |
| 6 %        | 55 %                          |

The portfolio **multiplies the odds, it does not create them** — thirteen times
almost-zero is still almost-zero. Everything rides on `p`, and publishing to
Play with nothing else leaves `p` around 0,5–1 %.

What publishers have that closes the loop is a **kill criterion** (CPI and D1
measured within 48 h against a hard bar) and a **discovery mechanism**
(~300 € of TikTok Ads per test). Without a mechanism the portfolio is not a
strategy, it is thirteen tickets in a draw that is never held.

**Play's algorithm amplifies traction, it does not create it.** Publishing
without initial traction is filing the ticket without entering the draw.

## The two mechanisms available without a budget

### Short vertical video — where the lottery is actually played

The only free discovery channel that still works in casual: TikTok, Shorts,
Reels. 15–30 seconds of the most satisfying moment, looping, no voice-over.

This is where a thirteen-game portfolio earns its keep, far more than on Play:

- thirteen art directions are **thirteen content angles**, where a one-game
  studio repeats itself;
- you post two hundred clips, not thirteen. **The unit of the lottery is the
  clip, not the game**, and a clip costs an hour;
- a clip that lands supplies exactly the initial traction Play waits for before
  amplifying. The order is video → installs → ranking → organic.

The portfolio instinct is right; it applies to the content, not to the listings.

### The web portals — the channel already built for

Thirteen finished web builds — menu, options, levels, FR/EN, music — are an
asset on a portal and a liability on Play. No ASO, no target API, no reviews to
collect, no listing to maintain; their SDK, their revenue share, **their
traffic**.

| portal     | access                   | role                             |
| ---------- | ------------------------ | -------------------------------- |
| Newgrounds | open, upload immediately | shakedown for the adapter        |
| CrazyGames | submit, QA review        | the first real reachable traffic |
| Poki       | curated                  | a goal, not a checkbox           |

Roughly a day of code each once `Platform.ads` exists. For the stated objective
— a small passive income — this is the shortest path on the board. See
[INDUSTRIALIZATION.md](INDUSTRIALIZATION.md), *Web portals*.

## Cross-promotion — the only k you control

Not a tracked task yet; the reasoning is kept here for when it becomes one.

Between two separate Play apps, a promoted player crosses four steps:

| step                              | rate                                                     |
| --------------------------------- | -------------------------------------------------------- |
| sees the promo → clicks           | 5 % (house ad with your own art; 0,8 % for a network ad) |
| clicks → lands on Play → installs | 30 %                                                     |
| installs → actually opens         | 85 %                                                     |
| **total**                         | **~1,3 %**                                               |

**~80 impressions to manufacture one player.** At ~0,003 $ an impression that is
0,20 $ per install — *more* than a bought one. House ads are not free.

Two things make them obvious anyway at this stage: at low volume the fill rate
is poor, so a large share of those impressions would have shown nothing at all
(real cost closer to 0,05 $), and it is **paid in inventory, not in euros**,
which for a studio with no UA budget is the whole difference between possible
and impossible. Corollary: **do it hard now, taper later** — the window where it
is nearly free is exactly the window where you are small.

Three moments convert, and they share one property — the player has just
*received* something:

1. **the end screen after a good run** — under the two icons it ends on,
   filtered on the star count so it never lands after a frustrating defeat;
1. **a milestone on the level map** — level 10, 20, 30 is a closure, and all
   thirteen declare a `web.levels` block;
1. **the exit** — leaving to the menu or closing. Free inventory, nobody is
   interrupted.

Never the intro: asking before having given.

Which game to offer, with signals that already exist:

- **never one they already have.** On the split site build the thirteen share
  one origin, so the `best:<slug>` and `prog:<slug>` keys in `Store` say exactly
  what has been played;
- **by affinity**, not by novelty — `theme` and `copy.<lang>.tags` in each
  `manifest.json` are already a proximity matrix;
- **the game that retains best**, not the newest. You are spending an acquired
  player; spend them on the best product.

Where it would go: `tools/build/gen-catalogues.mjs` already reads the thirteen
manifests to write `site/games.js` and can write a second catalogue, consumed by
a `packages/promo/` built on the pattern of `packages/webshell/levels.js`. It is
a **web + android feature only** — a playable is an ad and points at one store,
and thirteen base64 thumbs would eat its 5 MB budget, while in the split build
they are files and in an Android app ~100 KB. The existing `targets` mechanism
already expresses exactly that distinction. Measurement: `Ad.track` is a stub,
`track(name, data)` exists in `site/analytics.js`; two events (`promo_shown`,
`promo_click`) plus `?from=<slug>` on the destination close the loop.

## The order of work

1. **Retention first** — a reason to reopen tomorrow. It multiplies everything
   else and it is the input to Play's ranking.
1. **The portals** — a day of code against twelve listings to maintain.
1. **Video** — it is what sets `p`, and `p` is the only term that matters in the
   portfolio calculation.
1. **Play, in waves of three or four**, applying what the previous wave showed.
1. **Ads** — rewarded first, interstitials with a cap next, optimization only
   once the DAU justifies it.
