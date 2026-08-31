# Ad networks, MRAID & the CTA

A playable ad runs inside an ad network's container (usually a sandboxed
iframe/WebView). This doc explains the glue in section 4 (`Ad`), how the
call-to-action works, and per-network notes for packaging and QA.

## The container lifecycle

1. The network loads your HTML into its frame.
1. It may inject **`mraid.js`** (Mobile Rich-media Ad Interface Definitions) — a
   standard API for playables. It might not be `ready` immediately.
1. Your creative should wait for readiness before starting, then let the user
   play, then send them to the store via the network's redirect API.

The template handles all three via the `Ad` module so games don't have to.

## `Ad.whenReady(cb)`

Gates the start of the experience on the container being ready:

```js
function whenReady(cb) {
  if (!window.mraid) return cb();                    // standalone / no MRAID
  if (mraid.getState() === "loading") mraid.addEventListener("ready", cb);
  else cb();
}
```

- **Standalone** (opened directly, or a network without MRAID): runs `cb`
  immediately, so development and QA are frictionless.
- **With MRAID**: waits for the `ready` event.

## `Ad.openStore()` — the only redirect path

Every install/CTA button routes through this. It tries, in order:

1. **MRAID** — `mraid.open(url)` (the standard, works across most networks).
1. **Network globals** — common non-MRAID hooks:
   - `window.install()` — ironSource / generic playable API.
   - `ExitApi.exit()` — Google Ads playables.
   - `mintegral_playable_exit()` — Mintegral.
1. **Fallback** — `window.open(url, "_blank")`.

The destination is chosen by platform (`ios` / `android` / `fallback`) from
`CONFIG.storeUrl`. **Set these URLs per campaign.** Never hard-code a redirect
elsewhere — always call `Ad.openStore()`.

> Some networks ignore the URL you pass and use the store link configured in
> their dashboard. That's expected — still call the correct API so behavior is
> right in every case.

## `Ad.track(event, data)`

A logging stub (`console.log`) marking lifecycle events: `loaded`,
`game_start`, `state`, `game_end`, `cta_click`. Replace with a network's
analytics/telemetry call if a campaign requires event reporting.

## Per-network notes

These change over time — always confirm against the network's current playable
spec before delivery.

| Network                | Redirect API                | Packaging                                                                 | Notes                                                       |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **AppLovin**           | MRAID `open()`              | Single HTML                                                               | Supports MRAID; standard flow works.                        |
| **ironSource**         | `window.install()`          | Single HTML                                                               | Non-MRAID global; `openStore` covers it.                    |
| **Unity Ads**          | MRAID `open()`              | Single HTML                                                               | MRAID-based.                                                |
| **Google Ads (AdMob)** | `ExitApi.exit()`            | Single HTML, ≤ 5 MB, `<meta name="ad.size">` may be required              | Uses ExitApi, not MRAID `open`. Store URL set in dashboard. |
| **Vungle / Liftoff**   | MRAID `open()`              | Single HTML                                                               | MRAID.                                                      |
| **Mintegral**          | `mintegral_playable_exit()` | Single HTML                                                               | Custom global.                                              |
| **Facebook / Meta**    | `FbPlayableAd.onCTAClick()` | Single HTML, ≤ 5 MB, no external requests, no autoplay before interaction | Add this call if delivering to Meta (see below).            |

### Adding Meta (Facebook) support

Meta uses its own CTA function. If you deliver to Meta, extend `Ad.openStore()`:

```js
try { if (window.FbPlayableAd) { FbPlayableAd.onCTAClick(); return; } } catch (e) {}
```

Add it near the top of the try-chain (before the MRAID/`window.open` fallbacks).

## Packaging & delivery

- Deliver the **single `index.html`**. If a network wants a `.zip`, zip just
  that file (plus any network-required manifest).
- Confirm **no external requests** — the file must be fully offline.
- Meet the network's **size limit** (`node tools/build/check-size.mjs`).
- Some networks require a specific `<meta>` (e.g. `ad.size`) or an
  orientation declaration — add per their current spec.

## QA checklist

- [ ] Plays start-to-finish opened directly in a browser (`file://` or a local
  server) — desktop and a mobile viewport.
- [ ] Intro appears only after `Ad.whenReady` resolves.
- [ ] Audio starts only after the first tap (autoplay policies + iOS unlock).
- [ ] Every CTA button triggers `Ad.openStore()` (check the console log).
- [ ] Correct store URL per platform in `CONFIG.storeUrl`.
- [ ] Network tab empty (no external calls); under the size budget.
- [ ] No scroll/zoom/selection; fills the frame in portrait.
- [ ] Test inside the target network's **playable preview/validator** tool
  before shipping (most provide one).
