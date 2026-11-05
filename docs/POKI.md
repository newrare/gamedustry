# Poki

Plan for shipping newrare games on [Poki](https://poki.com), written on
2026-10-31. Nothing here is built yet. The portal strategy around it (Newgrounds,
CrazyGames, Poki) is in [INDUSTRIALIZATION.md](INDUSTRIALIZATION.md#web-portals),
and [TODO.md](../TODO.md) still files Poki as "a goal, not a checkbox".

Facts marked *(official)* come from Poki's developer guide; facts marked
*(third party)* come from a secondary source and must be confirmed with Poki
before anything is signed or built on them.

## 1. Decide first

These answers decide whether the rest is worth doing.

| question                                                         | why it matters                                                                                                                                                                                            |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web Exclusive or Non-Exclusive?**                              | Exclusive pays **50 % of ad revenue on traffic Poki brings** *(official)* and 100 % on traffic we bring *(third party)*. Non-exclusive is a one-time flat licence fee with no revenue share *(official)*. |
| **Is the newrare site, and itch.io, compatible with exclusive?** | Exclusive means "only on Poki across the open web" *(official)*, for 5 years *(third party)*. Every game is on the newrare site and on itch today. Ask Poki whether the studio's own site is tolerated.   |
| **Can a game ship with no rewarded ad at all?**                  | The studio wants no ads of its own. Poki's SDK is mandatory and Poki earns from ads, so `commercialBreak()` calls are expected. Not calling `rewardedBreak()` should be fine. Confirm with Poki.          |
| **Which game first?**                                            | One game, then apply the review notes to the rest in one pass. `vipera` is the recommendation: natively endless, measured in metres, a `lives` count, a reference guide.                                  |

## 2. What Poki requires

### Technical *(official)*

- **SDK** loaded in `<head>` from `https://game-cdn.poki.com/scripts/v2/poki-sdk.js`,
  then `PokiSDK.init()`. The `catch` branch loads the game anyway.
- **Events**:
  - startup: `gameLoadingFinished()` then `gameplayStart()`;
  - `gameplayStart()` on the player's **first input**, never on load;
  - `gameplayStop()` on every interruption: pause, menu opened, level end,
    death, cutscene;
  - never the same event twice in a row (`gameplayStart` after `gameplayStart`);
  - no event may fire while a midroll or a rewarded video is playing.
- **`commercialBreak()`** at natural stops, when the player heads back into
  gameplay: `gameplayStop() → commercialBreak() → gameplayStart()` for a
  restart, a next level and an unpause. Not every call shows an ad: Poki decides.
  The requirements page and the SDK overview disagree on one point — the
  requirements say leaving gameplay *to a level select* must not call it. Follow
  the overview's sequences and never call it on the way out to a menu.
- **No internal ad timer.** Poki sets the ad frequency.
- **Audio muted and keyboard disabled** during any ad, restored after.
- **`rewardedBreak()`** only on an explicit player choice, announced before.
  Grant the reward only when the promise resolves `true`. One video per reward.
- **Rewarded button layout**:
  - a standard "continue" button is always shown at the same time;
  - it is the same size or larger, and placed next to or above the reward button;
  - the reward button carries a 🎬 icon and is never green.
- **Ad blocker**: the game stays playable, gives no reward, shows no "ad
  blocked" message.
- **No external request** at runtime: fonts, images, audio and libraries are
  bundled. Analytics needs an approval and Google products are refused.
- **No other ad system, no splash screen, no outgoing link.** The studio logo
  is welcome on the loading screen. A link that must exist goes through
  `PokiSDK.openExternalLink(url)`.
- **`localStorage` wrapped in try/catch** (incognito); the game must stay
  playable without it.
- **Keyboard**: ESC or SPACE pauses on a keyboard game; arrows and space
  `preventDefault()` so the parent page does not scroll; wheel listener
  `{ passive: false }`.
- **Devices**: desktop, mobile and tablet. Desktop scales into a 16:9 frame
  (640×360, 836×470 or 1031×580) and must cover it. Portrait is strongly advised
  on mobile.
- **Mobile pill**: Poki draws a 46×62 px pill (92×64 at ≥ 1211 px wide) at the top
  right; `PokiSDK.movePill(topPercent, topPx)` moves it.
- **Size**: no hard figure on the official pages, only "small" and "progressive
  loading", with players leaving past **10 s** of loading. A third-party guide
  quotes **8 MB** for the initial download.
- **Clean build**: no debug code, no dev tools, no test artefacts.

### Content *(official)*

- Easy access: a first-time player skips splash, title screen and level select
  and lands in gameplay.
- Out of scope: gambling, graphic violence, sustained scary themes, sexual
  content, misused IP. **Direct copies and clones are never accepted.**
- No in-game purchase, no "remove ads". A second currency is discouraged.
- Cutscenes and intros are skippable.
- No AI watermark or prompt text; AI tools and process shown on request.
- Static **and** animated thumbnails for a global release.

### Test funnel

1. Upload a web build to Poki for Developers (`app.poki.dev`, or the
   `poki-cli`), checked first in the **Poki Inspector** (`inspector.poki.dev`),
   which tests SDK use, mobile behaviour and the main requirements.
1. **Player Fit Test**: 500 players. To move on, the **average overall playtime
   must be over 3 minutes** *(official)* — replays included, not one run. A third
   party reads it as 25 % of players (125 of 500) past 3 minutes.
1. **Web Fit Test**: CTR, average playtime, conversion to play, for 3 to 7 days
   *(third party)*.
1. Final review by Poki's team, then soft and global release.

## 3. Where the project stands

### Already compliant

- Self-contained builds, no CDN, fonts embedded (hard constraint 1).
- `Store` falls back to memory when `localStorage` throws.
- First launch already skips the title, the village and the map and opens
  level 1 with the Help card over the frozen round
  ([menu.js](../packages/webshell/menu.js), section 4c).
- The web target has no store link and no install CTA.
- ESC pauses; every card pauses the round (`Modal.open`); the motor exposes the
  moments the SDK needs: `Loop.pause/resume`, `onOutro`, `onReveal`, `endRound`.
- Portrait, with the desk scene painted around the frame on a wide window
  (`packages/frame-web/frame.css`). *Assumption*: that fills Poki's 16:9 frame
  correctly — check in the Inspector.
- The DEV pill only shows on `localhost`.

### Gaps

| gap                                          | where                                                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| no Poki platform adapter                     | `packages/platform/` holds `mraid.js`, `web.js`, `capacitor.js`                                          |
| the title SPLASH (logotype + signature, 2 s) | `splash()` in [menu.js](../packages/webshell/menu.js)                                                    |
| the rewarded ad is a placeholder             | `ad(cb)` in [meta.js](../packages/webshell/meta.js), section 10                                          |
| the ×5 offer button breaks the layout rules  | end screen bonus row (`MULTIPLY YOUR COINS`, the ×5 plate)                                               |
| sticker machine, tickets, super tickets      | `album.js`, the shop, the daily road ladder, the map's milestone stickers                                |
| Notify chips and "!" sit top right           | where Poki's pill goes                                                                                   |
| initial download                             | `dist/web/<slug>` is 3.3–9.8 MB (+ ~1.5 MB shared); stratideck 32 MB                                     |
| music loaded with the game                   | full `web.music` track (~1.4 MB); chainring ships five (6.8 MB). *Not verified* whether it is preloaded. |

## 4. The Poki build

### 4.1 Target

- `node tools/build/build.mjs --target=poki --game=<slug>` writes
  `dist/poki/<slug>/`: the web build in one self-contained file, like
  `--dest=itch`, with `packages/platform/poki.js` in section 4 in place of
  `web.js`. It inherits `web.js`'s behaviour (no MRAID, `ctaHeight` zeroed,
  `footHeight`, `framePad`).
- A game opts in by listing `poki` in its manifest `targets`.
- The SDK `<script>` tag is the one external request of the file, injected by the
  builder for this target only. `--check` and `check-size` must know about it.
- `CONFIG.platform = "poki"` lets the web shell branch where it must (sections
  4.3 and 4.4) without a second shell.

### 4.2 SDK event map

| SDK call                | motor / shell moment                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `init()`                | before `Ad.whenReady` resolves; a failed init still starts the game                                         |
| `gameLoadingFinished()` | once `preloadImages` is done and the first screen is up                                                     |
| `gameplayStart()`       | first input of a round (after the entrance lands), and every resume                                         |
| `gameplayStop()`        | `Loop.pause` from any card, the leave card, `endRound` (start of the outro), tab hidden                     |
| `commercialBreak()`     | the end screen's replay and next buttons, and the leave card's play again — before the next `gameplayStart` |
| `rewardedBreak()`       | body of `Meta.ad(cb)`: `cb(success)`                                                                        |
| `openExternalLink(url)` | only if a link survives at all (privacy policy); otherwise none                                             |

Rules the adapter enforces itself, so no caller has to:

- a state flag drops a repeated `gameplayStart` / `gameplayStop`;
- nothing is sent while an ad plays;
- around every break: `Sound.setMuted(true)`, `Music.setMuted(true)`, input
  blocked, then restored to the player's own settings.

### 4.3 First session

The chosen flow, for a first-time player only:

1. **Help card** over the frozen round, closed in one tap — what section 4c
   already does.
1. **Prologue round: level 10's tuning**, with **twice the usual lives** (or the
   game's equivalent, see section 5), **score not recorded**: no best, no stars,
   no level marked played.
1. **It still pays coins and xp.** The first end screen is where the player
   decides to stay; an empty one loses them. The coin cascade and the level bar
   moving are the hook.
1. **The end screen says what comes next**: everything just seen is waiting,
   starting at level 1. One button, straight into **level 1**, no map — Poki
   wants no level select at first contact.
1. From there, the normal climb: map, village, levels.

In code: a `prologue` flag in `levels.js` arms `dOf(10)` without its objective
and outro, lets `onResult` skip the save, and points the end screen's way on at
level 1. The lives multiplier is a per-game knob (section 5).

### 4.4 Meta layer for Poki

**Hidden**: the sticker machine, tickets and super tickets — Poki discourages a
second currency and the machine reads as a loot box.

**Kept**: coins and xp. Coins must still buy something, or the wallet means
nothing:

- **the gallery** (puzzle pieces of the game's paintings) — the terminal coin
  sink, which has to leave the album and stand on its own;
- **the boosts** (double coins next round, double xp next three);
- **the xp pack**.

To rework under `CONFIG.platform === "poki"`:

- the shop: four tiles left (gallery is its own room, two boosts, xp pack);
- the daily road ladder: tickets and gift boxes paying stickers become coins
  and xp;
- the map's twelve milestone stickers: paid as coins and xp, or the collection
  chip and album hidden entirely;
- the end screen's three gift boxes: no ticket, no sticker in them;
- the wallet band: no collection chip if the album is gone.

**Ads**: no rewarded offer by default. If one is kept, it follows the layout
rules in section 2 (🎬, not green, a standard button the same size or larger,
beside or above). No timer: the "ad after 3 minutes" idea is
`commercialBreak()` on every end-screen exit, and Poki chooses when an ad
actually plays.

### 4.5 Shell changes

- **Splash removed** on this target; the newrare mark moves to the loading
  screen.
- **Pill**: `PokiSDK.movePill()` to a free spot, or the Notify stack and "!" move
  away from the top right.
- **Keys**: `preventDefault` on arrows and space, wheel `{ passive: false }` —
  check what `Input` already does before adding it.
- **No outgoing link** anywhere (site, `more`, cross-promo). A privacy policy UI
  is needed only if an external request is ever approved.

### 4.6 Size

- Load the menu, the help and level 1 first; fetch the rest in the background
  (Poki's "progressive loading").
- Music: start on the round's own section, or a short cut, and load the full
  `web.music` track after `gameLoadingFinished()`.
- Biome art and stratideck's 180 portraits stay lazy (`CONFIG.artLazy`).
- Target: first screen in under 10 s on a slow connection; measure in the
  Inspector.

## 5. Per game

The prologue needs a "twice the lives" knob, and a game whose round is a clock
or a turn structure needs more thought.

| group               | games                                                                           | prologue                                                                                  |
| ------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| endless             | vipera, triverse, marshmelt, spinshock                                          | easiest: `lives` × 2 (vipera, triverse), slower lava (marshmelt), lower drain (spinshock) |
| timed               | chainring, orbinity, radiam, blight, gearball                                   | longer clock or more hearts; keep the level's own length                                  |
| objectives / turns  | stratideck, slipdeck, bridgessa, bouncetry, echomaze, pawko, grudgeon, foldiers | a prologue at level 10 may confuse; consider level 3–5 instead                            |
| has an endless mode | gelatile                                                                        | its classic mode                                                                          |

Content risks to weigh before choosing:

- **gambling**: slipdeck (poker hands), bridgessa (casino look);
- **clone**: gelatile (2048 with powers), parrynormal (remake of Magic Shield
  Brick);
- **AI art**: disclose on request; no watermark in any shipped picture.

## 6. Order of work

1. Ask Poki the questions of section 1 (developersupport@poki.com or Discord).
1. `packages/platform/poki.js` + `--target=poki`, on vipera only.
1. Pass the build through the Inspector until it is clean.
1. Prologue flow (4.3) and the Poki meta layer (4.4) on vipera.
1. Splash, pill, keys, progressive loading (4.5, 4.6).
1. Thumbnails, static and animated.
1. Upload, Player Fit Test, read the playtime against the 3-minute bar.
1. Only then the other games, with Poki's review notes applied in one pass.

## 7. Open questions

- Exclusive deal vs the newrare site and itch.io.
- Whether a game with no rewarded ad is accepted, and how often
  `commercialBreak()` is expected.
- The real initial-download figure Poki tests against.
- Whether the desk scene around a portrait frame passes the 16:9 rule.
- Whether a coin-bought gallery counts as a "second currency" problem.

## Sources

- [Poki — Requirements & quality](https://developers.poki.com/guide/requirements-quality)
- [Poki — SDK overview](https://developers.poki.com/guide/sdk-overview)
- [Poki — HTML5 SDK](https://developers.poki.com/guide/sdk-html5)
- [Poki — External resources policy](https://developers.poki.com/guide/external-resources-policy)
- [Poki — Content & player safety](https://developers.poki.com/guide/content-player-safety)
- [Poki — Easy access](https://developers.poki.com/guide/easy-access)
- [Poki — Deals](https://sdk.poki.com/deals.html)
- [Poki — Player Fit](https://sdk.poki.com/player-fit)
- [Poki — Web Fit help](https://sdk.poki.com/web-fit-help)
- [Cinevva — How to get your game on Poki](https://app.cinevva.com/guides/publish-game-poki) *(third party)*
- [Playgama — Should I go exclusive](https://playgama.com/blog/business-faqs/should-i-go-exclusive-with-one-web/) *(third party)*
