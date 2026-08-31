  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "GAME TITLE",
    /* ONE sentence teaching the core mechanic, never two, and the words that
       carry it wrapped in <b class="w-…"> so they read in colour. The animated
       stage below the line shows the same thing in motion — that is the pitch,
       so intro.caption stays empty. */
    tagline: "<b class=\"w-verb\">Tap</b> to hit the <b class=\"w-target\">target</b>",
    gameSeconds: 20,                 // round length in seconds; 0 = endless

    // Store links used by every CTA. The right one is picked at runtime from the
    // user agent. Until this game has a real listing all three point at the
    // newrare site, where the game can actually be played — never leave a
    // placeholder store URL here, it ships as a 404 on the device.
    storeUrl: {
      ios:     "https://newrare-website.vercel.app/#playables",
      android: "https://newrare-website.vercel.app/#playables",
      fallback:"https://newrare-website.vercel.app/#playables"
    },

    // Design resolution — all game logic and all DOM overlays use these units.
    designWidth: 720,
    designHeight: 1280,
    bg: "#0a0a1c",

    // Bands the engine reserves (design px). Layout.top / Layout.bottom are
    // derived from them plus the device safe-area insets: keep gameplay there.
    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 30 },

    // Intro: logo is a key in ASSETS.images (omit for a text-only intro).
    // demo is the animated how-to-play: tap | hold | drag | swipe | aim — the
    // shared finger acts out the gesture on a stage the SKIN dresses as the
    // game itself. caption is the fallback label for a stage that cannot say
    // it on its own; leave it empty and the tagline carries the sentence.
    intro: { logo: null, demo: "tap", caption: "" },

    // Desktop fallbacks: SPACE acts as a tap (start, play, replay) for the
    // "tap" and "hold" demos, and the LEFT/RIGHT arrows fire a lateral flick
    // for a "swipe" demo. Set to false to keep the keyboard out entirely.
    keyboard: true,

    // HUD slots: the centre score is always there; the timer fills the right.
    hud: { score: true, timer: true },

    // Background music. Only used when the game embeds ASSETS.sounds.music.
    // volume: keep it discreet — the bed must never fight the sfx.
    // fade:   seconds of fade in / out; also the crossfade at the loop seam.
    // A game played on the beat also declares the tempo here — bpm, beatOffset
    // (seconds to the first beat inside the file) and loopBeats (beats the loop
    // keeps) — and drives its action with Beat. See docs/ENGINE.md.
    music: { volume: 0.12, fade: 1.6 },

    // All user-facing copy in one place.
    copy: {
      start:      "TAP TO PLAY",
      ctaBar:     "INSTALL NOW",
      ctaEnd:     "PLAY THE FULL GAME",
      replay:     "Replay the demo",
      scoreLabel: "SCORE",
      timeLabel:  "TIME",
      endScore:   "FINAL SCORE",
      gameOver:   "GAME OVER",
      timeUp:     "TIME'S UP!"
    }
  };

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     Generate entries with tools/lab/embed-asset.mjs. Draw the graphics on canvas:
     every embedded byte counts against the 5 MB budget.

     SOUND EFFECTS ALWAYS COME FROM assets/sfx/ — that shared library is the
     palette for every game, so the whole catalogue sounds like one product.
     Pick a clip per event, trim it to the useful part and re-encode it small,
     then embed it under a short game-side key:

       ffmpeg -i assets/sfx/<clip>.mp3 -t 0.4 -ac 1 -ar 32000 -b:a 64k gem.mp3
       node tools/lab/embed-asset.mjs gem.mp3 --key gem

     Keep a comment naming the source clip next to every key (below), and pitch
     a single sample with Sound.clip(name, vol, rate) instead of embedding
     variations. Sound.beep / Sound.arp stay available, but only as a fallback
     for an event with no clip.
     =================================================================== */
  var ASSETS = {
    images: {
      // logo: "data:image/png;base64,iVBORw0KGgo…"
    },
    sounds: {
      // assets/sfx/*.mp3, trimmed and re-encoded mono 32 kHz / 64 kbps
      // pop: "data:audio/mpeg;base64,SUQzBAAAAAA…"
      // music: the background bed, looped and crossfaded by Music (see
      // CONFIG.music). Encode it small — mono 64 kbps is plenty under sfx:
      //   ffmpeg -i track.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      //   node tools/lab/embed-asset.mjs music.mp3 --key music
      // End-screen cues, shared by every game (played through Sound.cue, so a
      // game that drops them falls back to the synthesized beeps).
      // uiScore: alert_ping_chime_correct_answer_check_positive_009
      // uiStar:  alert_mallet_chime_ring_notification_002  (pitched per star)
      // uiRow:   alert_menu_select_item_beep_click_003
      uiScore: "data:audio/mpeg;base64,SUQzBAAAAAAAW1RFTkMAAAAVAAADU291bmQgR3JpbmRlciA0LjQuMQBUQ09QAAAADwAAA0FsYW4gTWNLaW5uZXkAVFNTRQAAAA8AAANMYXZmNjIuMTIuMTAwAAAAAAAAAAAAAAD/+1jAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAACAAACUgAA8PDxcXFx8fHyYmJi4uLjY2Nj4+PkVFRU1NTU1VVVVdXV1kZGRsbGx0dHR8fHyDg4OLi4uLk5OTm5uboqKiqqqqsrKyurq6wcHBycnJydHR0dnZ2eDg4Ojo6PDw8Pj4+P///wAAAABMYXZjNjIuMjgAAAAAAAAAAAAAAAAkBEAAAAAAAAAlIMNcOKcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+1jEAAAMpaL4dDEAAl4sadcxQAAAAIAVKHAwM0SgAAhf6AYtAAQxxbnOc76nIQAEEUOdAMWgQk55znO/UhCEzvO8jVPqd8jSE/nP/+p85/5P8jdCMpCN6EP6ncgGBv1efac50AzyMpzoBgb9aBxZ3QhCKACHH/w/y+W2ySSGOlgEgGRNesThnKIFx+Z7SAlQSB+VVjY8Ac0Az7kR0HlNyfUBJ2AQIC2IHMRBcORaguAoDDrhkYAoQRpRIKMcfY3N8G3AKhw9YFBQWKBq8dREhZpDTQvILvfE6i3igBjhySSGaFKJLQUkuGSW/xzy6cMzEvGhoZqE1U/V//59BNFKipkTeQP/6Asz//44y4ZHRF9KARTiAAKIVAAhACBkMkr/+1jEBwAQwT0xvJsACfKn42RfVZjpe5SoiehVQPUR4atDGoDgBAYLwfAYT0LAaNB+gYpgugYLQiAYMQFAKBKC54iZqYsktqSzUyTZFFknbpLRqSMk0Uretui2tF2IcKSBtIAkOgIgZCthKQ5pVMUVOrR/0v/orb///sTRWRpFIdRJCegMA4EgJA1IKxQDAAC4AwAnb1Xfa1GXGTmQQjIBQwA+DQTDASDZMKWRo2Qz1TA1CMGgXDDlBpMQUBAOA5QiZqPRIH37qQTq//vV//pNUuZk4M2FwgGOcQBgIMBZWLIIARcghPJv///////9nazl0NSD2BKIWBAxavwNKAMOWHCTwbWh3///XWb62+dJQTaGXgbBQChEAZkBtA5gM4D/+1jECwPQ4UUSCn6wCfSoYoFP1gFIYHIBEmGejVRsmIXaYRKAQgZVbYGkdOBslGAYWE4AoGDAIs4ckyQKxVRdN01/////ppnUUpoWyCDNh2AMg2wDegMAsDxOg5Ax4jAiRuplqf//////9a3WgyZUFjC0kQBBIIgYc4YFBKH4D7JgzLjDpv9f1lAWeOYLnBswBkSIGqUGAsgL5gYAHoYVGTRmoLiBhg9YISBqdwgcGnoHBjQBh0Kg2oIDikBlyKFwtoXQWmr////6SaJlUyBkeIkLaBhsyAW/Ah5BCYNxLiLI0UV///////1Ke6jMwDRwsCPgQeBk5OgFVMN4HskC+27Mqqv01vQpkEFTC+oAgsCqIBd+BguRgCYG2YBYESH/+1jEDgPR5UUOCn6wggAoYkGf1gGA/q05hZ5IgYFyDTmBlgQoGEiQgUFEgNIeARSIAOUiyeETVu1Z7Pz9vb9X//QRNE1l4uFMvl0XEHSgYpRoAbpCgDIARxTDRiYRW62///////2UpUxLwIAGBEAhcEAKDAMmSoDcISAkARSxBTY1WDy////1/////r99/HWoiyJMUsyYoRoHnPEYCcAqmBcggBhWheOaqwIzGDhAJ4GElQBv6sAdSPIGLw8BgQBhcMKBHESK5s6a2QR/v///1IKZbmEvEyRINWgYljIG4gSHOJ08URPR5Bl///////+yO7F8ZAPsKWBqBAMEyoEAQFDlIzMjEA1VBbklAC2QgAH/zbW1h1A0xwEOYwhiCGL/+1jEC4ARITs3rPZPEiUnJ/afUAIIYQRhBGEEayBsQGsJXl9iH3ELtmGAoHGgZgYNC9gNApU9Sv8r7b5hhhguxdjEF2KnQllsyy5gCAJgCAIGJgZiAMYAQABADZANgwG2ANwBYYFkAYkTTTTTTTTdD/86DXxoq/0Ff/9BBn/////1KsKSFQdOSywAG2ig//alNETUeknJoheiFE6HqAIgAoABA2gzgMSJRL6IbIBgIAAYYUQGbiyDAGLsEQGC9455XnFJIooooiCogqGrQyKILCCwgsILCCwoIUELKFzDmjmjmkVIqXS6XTVJJJLqXUk6Cv0y+EwCW7///+j//////UpAmxCMVA5//9tjv///+hUFgEcIZEUkRzTxpxfTcbD/+1jEB4AQ0YOP+PkiEgypKHeNYAED/cCCP7+jw3Z/xmixp1WIkGNB9kyXAVMdELIBZZ8osXkex8wNEzI+TPdTDAFzpE8LkKiYggM2TR01/nSCHTdNOmsmSdKSKnSd/+RIghiblMi58Zs2NDtFSKklJJ//mJuggpBkGtlgyNjFKjW3S//+aJrTv/9yCLTpaIAAAAnAGHAJKwWZn+ZntVIoqJoZYZYOWBxDgBgDBq0Z04kXnWYmrrR1GRRJ03HIAwAgOAwNg6Aw6huA05ibAwQgCCyYGxoMuidRcpGmqjIvGzUn1JGzJJJPWij0TEckUZLr9JKpJL/9aPR60aKLev/RSS/rMT6KikGKwvaQUvF4alAAKgAgIBQAKv/mQ1nSRtz/+1jECAEQeUkroPqvChuppTQfVagE5wAAcYHIupkihFGBGAaBQAzAQALDgJH7sZ/nh+f8+3IGhJ0hQAMdAaGQRTAEC6MEtN8y92KAMnskDChGAweHQAguBIOAiCYLDkYn1ur//7GwWIBQxHnqO////////+r1rUZBqAox0oCMwMCHEG2pMGhWmGA9IEAog2XsUvy/S4zUEtiQLJQHgIRGYZwahAAer8MBAHgUXOnbXO71/cvoGyqpKUhAAIsBURA0iQfZjTAFnykGaB9ADAaDBIGMAkBgQJARB4NAYGPHVLVWiq3/92rKQFBcCIpGu5j////////+rpJKBqAjBM0IkAMGQWG5EDAfyZQV////VQACAQgAMa1LZtS1+mWgYAL/+1jECAAO/UkrIHqtSkQpJbXuUwEwQhATK0BMJgRUZAIAoEAGv9S5Y6w///7MWYKikBQBAQA2BQPjAKCvMElJYzpVtwMzrgAQdgLA4CwABQJAWBoLDMb7Pp2///WcCYwBEDkVXR/////////6kmYWcMRI6PoEhcFpRiouqgpR6gAAEQAD/pJuVRmLSFv2/dR10BiC6ABItCQgnm6lWjdQuOYGwXRknAomA8AEWoMAEA5AfDE3Ux1jzvO8rwA3d6mbCwABgMgCmCYBkYjIzJzClDHMSGZSCxh0HmAQODAAXPQ1lm9b/9da61LV95kEURBDdmf6k3UmzoO1///////9EWskVJkwAuQC5BumUBpBKOQAEBgUXfz+zs9Oy5iKwr7/+1jECQBOSUM3rum4EcsopeBvTiHQC0RkbDGDrcW9lVuTcEJviItjEAPVbHcTOSzvd53n///rVWNO6w1KoKAOYChcYhNaeKQEdBiYMA4MWaay5bln//2v///QA1C0f//////1///V+PvRB1ii9n//7P93+3rBT0AH/x7aPEk0zCDn0s0GALhF5TAZD8MXsEsWAObCWzFgCpbax1zPDmfcKSVyiXxAv+YAwCBgTgimFYQQbGRg5heApGBeA2YBgBBaQvGkIgdb3nrB0EFp0GoV/+wm4LrP1f/////////y6W6iyE+kDQE6BTbjAAAAgAH9svYSia0Nhoa6H0P4zTpmLd6TzRttDBECRaNhoB2tqoxCrrLuPN4/lljqUu01pdr/+1jEHAAODUk3p/WxEcQpJbQu0eBbIwKBcxNSg+TScxdBIIBVizwuE+rr546y2k60aTrb//Mxa/9FkWU9GpKp///////5x9MJ6EOgo6ABxYACAwAB/9fqQWJ3UlcMMDCwDGDKhmsI6GBoCoSwUCo0DEXwz53n/r887EXhK8RgAASC5gYMhj7Sp/rrwHh3gZpABiQ4NxhY4GCwWClRba///+sX4qP//////////5KM6JDgCFAXKZRiT//////9lVCARFIAAgQWiVd8pgRHvKzjWqx54R0AACCmxi0l7Fg4AEQNkXOou31FEhwyolENuAYAKBgfAMBiSGWB2CGcBikAKCwQgscEIBTRPQyiPs6n///j+Vf/a613qb6m//6/+/7/+1jEMIAOqUsx4PLM0aMpZfQeybKv0mUmUAHgeDYDdMwV/+v//Z/k+u2iSIAEBGUAUtdFmW7lXG1ennlT6MKBnN7AMHgkVUHAGWLKquW//v//8vyF+mBIelgEhUTTAiVjNy/TAYVAqCpbhXCo2KItSfn/6v//+sVlFv///V1et0q/Vf9T/1fnWZIugCiFVPrLChbZQgAQIZBJzedC8YHzOkjbWC65h5gHmCWAg4iYAQAiPLM8E+3WWCVIELiENBwCwJBIAxQgVA70iaAGLOAoEwA4BYXTD2BIxyUPSZO39H/rGqW////r1f/9f///ztaiVBoCkZVBA+j///6tf//+oCepBtNBBBqZfMysZEaRwp4ZwEIIwikYDASOMCgEgvr/+1jERwFN0UkvoPLOkcUpZIlgT8gFAlAsFoVElzV6dukRETsGJQCABgEgUAABuBgPEwBhYgyBwKoYBhyFCBgFBgBEA4bGCIBIFgDA4Eg3km13///xnRi//9E+s0IOBsqCuyIGA+zFBSbkABALsAH//cqn26aV1pRTvPAT+PjA/d5WaZ2QCKRlyBa3o+yttrPfwxz3nrDPW6le8/bEC0ZhsNRz8WoCHgOAdYjsQ3DEi7h+/fDJfFTc7Pin2/QroZVf/+yTj7ZL4ZLH2yX2yae7e37t///1dQKAW1Z0CAEwBP/irqDZdoPyL60CYAd9MAwlE83RCwHBGj2FAFXZX1963hlzHLLGtGXKUCQxBoEGBgbmL7xH9MamN4dGBQCu8+r/+1jEXIAOfUU5rq26kcWopZxuyiLLmWqjv3su8oqUur/U6+7iuCZL//3////////zm5gBGhkEwcZ/////9RD/+hXoobJhKtX7MzEH3ZgKgBgwCowGyPTGpDmMB8B8wAwATAmAHGgXGryC3jnzH//68MOXAjMwQAMYCYE5giA+GIKaacUaaAHD0mBkwaAYjDoGCwWBgYAADAMCQdJA/qb///xICS///////////dlydANAIOCp9Mji8igAUbypaWVQyyJEEGgOGBkQeZLQaRgHACsCMBwBIMBRbaK2qXL+d/eq0ArSR5AAAZgFgFGBAA+YK4LxiZFLnNAXQYpwJ5gngCDQDCBAKAAhUAAuhFe87x0UkXUtXZf/SDqK////////+1jEbwJO7U0gAPqtQcmopBwPTbH////LLVFkClxPqskOtOEAABAUMc4aeZl3cq42pM56tBMA0YNQHpnxADAYIAEAGFgChCa8UzW3/7/v8wl7yNOSOIQDwQBgYC4SJg/H/GnwnyBpZOAYnG4GEAsAECAFAeA0AAWEQw2Vrt///UHeHj//////6vv//+YrzYUCMM4S////qBa8BgQgCCZ67EMDJWJRJJQCQSASCQIgk1CkK7SC+5gIBoGJwCWCgDFAC0SF85nzLLHWWWOG5qOw015aqBwGAxMH8IA01QiQgRooAwRHZG2RusN5f/+xyuyoqIex7H/2BgNP///////////QSib////61QChGAAAENQLIRpyyuqFWmYKbCncOA3/+1jEf4AO2UMhoPqtQcYopajPKiKYBwIZymKIwKY4GBuNCU3sispI79y0NITqFroFQFA0BWDQPwALhQMI8cAFxEgIBUAKAkLKwWAAFxwYAoeXXqv///l4VX/9////9X9b//+p+Oo0f/////rAQQIABR00IyQgkw1rtzKdizqrWAQBJgricGaiCiPAziEAcCgPgoBZ2abHLeX//53ILbI3FS0oAKEgNDBPAHMRwHo5xBhQOcBoDKYHAw0CABAIA8AggAAfEuvU3///H2MT//////////9LyPNav///+pUQPgmPG8Bl2HHfWIW3MBQBowhRjTSVDOMFUCEwDwGzAiA5MBgABncYt0lf9a/m6sPLFLtGAGAQYAAD5gEglGBAGGb/+1jEkIANqUMjoPbOgcQopBwfVagRKkRrwsSga1ZAGFiGCQODMASDQDARBYfipGl67f//1iKi2///////////21C/Pt6xqqxVKMK3AaWAmfpuDIBYgA+MBE0ExORWDAHArAQB5giABlASiroRTXv5r+c7NvAzNsDHwEAoYFoDpg3A0GMGU2eWKRgHm0GBngaAY1EoGDwqBgYGACgcA4KkEWgtl///9YdUiP//////////6epydJdCB5tCQAACA1aPcp5Ep1iDS00thpcoJAEMDAWsyIAYhIC1RowBABg4CF3qW1jll//rWUpdpiKEkEgAGAEAqYDYKBhAFDmqcVUYUAJpgNgGK5dpQVMZICQ/z/T///wMv///p/X6/////1//+1jEpoNOLUUaIPqvAc4oYwA/VeEKh7///9f1f/f/Xu5uig9miSYsAoYFYBJhwBhG1gB2YQwERgJAZGAaC4DQFWMQDQVdU+88cr0oa2sRz03DADAbMCQEQwbw0TFgR4O6BxEDwjgAz2XQMcDQDDgcAwuCwMIAgAohCfzy2ZL///x0kn///////////fMAwcNAXOfrdVgiIAACAzQJEbqQYS4Keq8QdNVQKg0w5eDxSPMIAguQBhELCeEW8D7VutSlk0OSK2D5gshACAMBgiBSBiHKYB1dMKBilA0AoEUNjE9iEQfqKXNl9////WW/+//////////8i5Lf///rD/Z/1O8nLt7msAAgR6i2ZTU7OUcIq0zEm4plCAGzB2Bjakz/+1jEuYNOVUEh4PlPQdGoYkAPVahTAMBmmmDoBiwlNrPXu8t7//zzpJG/LISQABCDZgMLhifWp5DwAHVzgY44Bgw4N3hbwG/gsFIRbWXp///zhL/X/T+mv//6TatX///6xFWp/7fp1cr7/+p3to+mACi/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",
      uiStar: "data:audio/mpeg;base64,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9bVeZf5NL7itzvIJTABwAIwA8AKMAUANzACQEYwDQC1MDdDfDTozZowmEFGMBeAMTAEQBowgTZWMpM6gGBLaZ04bTYdicmgaGrWu6tUV2GZXG8aPWL8vTlOZRHUqmr8dxy+km6Ccp8ZTzVvdWPU1HG7eOVjW7tWWUF3IWDhWJmKhYPFQcEoierHHKQF/IgKxf5n+jf6X/qFyIXoF0IahmilC49R///mMIdoLohfiUA0E0KVAJgawGh38wfn//+hASN//ypANmu3v////5Tx+kuz/+1jE7gHToiLwrxi3AZE1XqGPChJr0RgcAKYBgDpgEgbGAkDCYHocxhSH6nqxRCZMArJg5g4GAAAqDgAgMBaYEoCAcBtUa0CQNISYlLJkuFSImj6pMtsmIJKkpC6SyzuISXpN4KXlCqT6XZbuoy9kvIrdca2ISH8RMODpS/1L8O/jB/+JH1ExdqAwK///wGP////QGDwt//6Cgn8KDH//+AS///qLkoAAKWMqr3pVXlsqlcOxGIQMuVpCYSyxIBUwHwEDAjBCCgLpgLAvGASEaYeaCht5viGwCWEYHwZJghAAGBoBaYEYFxgNAjmBQAC8DfMNfRg0NROBYalaAASM8hUaVq4pE1asiKkudYlSatChQsqyWJpoWatDKW37pEv/+1jE8oOZ+hTfD+VTQnBC20HklqAQsy31506OgtElk/6c1Dl9jnN/NY6o1PBaLR4fB6UJf746RQbEh0iIxhxv///uarf/6OPAuB0/YbFCX/VvNU05///joLQclgAgq3Ldmmq1K9ymnHXW4LCMwzLYQfFODjEd1TA5pmSRnF5jYRJJMFAAEAAsRAqBKUwxgyIsMGEwtC1IlYJaa6Ght64zsvtAUFwxF5NPBIMJEiCaC0SRpxx8XlScWXDEoiVIlUGrpV/6f/ldTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1jEwgBYAhjKzyT2waqST9WNGhlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=",
      uiRow: "data:audio/mpeg;base64,SUQzBAAAAAAAW1RFTkMAAAAVAAADU291bmQgR3JpbmRlciA0LjQuMQBUQ09QAAAADwAAA0FsYW4gTWNLaW5uZXkAVFNTRQAAAA8AAANMYXZmNjIuMTIuMTAwAAAAAAAAAAAAAAD/+1jAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAAAMAAASAAICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP///////////////////////////////////////////wAAAABMYXZjNjIuMjgAAAAAAAAAAAAAAAAkBSAAAAAAAAAEgBfTdCoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+1jEAAAOiRtP9IWAAiO4br8w0AJQhAAAAAAAACkf+vnSpLDsG4flAoAHADADAnLwSABAEB8UHYOwdg7DSthubv4Yxlf////+9jGU83Nz9m5ubm5uffcPe973v0B3m9sNDRlPZUvfDGSaGjGf/////sYykx2GlJm58+Iz/D//8uH/+Qhj////BCIdmUiMAESMiNuJAAFKQSALCd10W8q7rJOabt+3hbbN+NP0E3CrEgTSs2FYvF8kVGpYTVAtgyycPBAkXPGxedIvHnLCcUHSNlHUFpJObS4O0fEVJWpK9H/dK1iXT/1rb/9TXWdHpU36TmYvH1f9BNS/Zk66lqTSZO69T/f6///01f1fy+pxJP6FKhN/wAAFWwFX9fKqrML/+1jEBoEP4idFvIiAAg/E4qBctaDeSCkBUBUpACwLKhxHRzSdRKJAiLEWJ5J2LxtWgXkjYxNUC6i3qLyi8bGJdNTI2V9WpFFFH3rapJJJL1o/1Ja0nUkkklb6kvWiijScvECIMovkVNUVIooqMUF//////1N/1UldaWj7N////////Wj6KJ6CE4JfqXMowLehm5aUQKnM+hA48CQqW5SrCm3Zy1Tbw/GJRbaNEyUtkn9T+palJUS6g6KP1t113/rZKl6qnMR7JnC8s1qSQek5kXlqUmgPYzNVGw4RikoFuAAmBGiVCpArw8jEnFMepOHkXnUjS//////+v/////////9KkpLotzIvJFt8bv6uTYJApAKBSAUKTCRSaJ2zct//+1jECoPNWhzgAyBZCAAANIAAAATJWkXRJFwuTjS42W//8x00z/800WsXXxE1fax+sWsXPP2sWv//szmlObBxLrTSqB8CkMiIIy8wPFRo45UUEdlYysb////////////////6yocqOUNKSUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU="
    }
  };

  /* ===================================================================
     6. GAME — the only section a new concept rewrites.
     Contract (see docs/ENGINE.md):
        reset()            required — build a fresh round
        update(dt)         required — advance the simulation (seconds)
        render()           required — draw the world in design coordinates
        onDown/onMove/onUp optional — pointer, in design coordinates
        onTimeUp()         optional — the round clock hit zero
        onResize()         optional — Layout changed
     Call endRound({...}) when the run is over.

     This placeholder is a working demo of the whole engine: tap the drifting
     target inside Layout, chain hits for a combo, HUD/Overlay/Fx feedback.
     =================================================================== */
  var Game = (function () {
    var score, combo, hits, best, dot;

    function reset() {
      score = 0; combo = 0; hits = 0;
      best = Store.get("bestScore", 0);
      dot = { x: Layout.cx, y: Layout.cy, r: 78, vx: Rand.pick([-1, 1]) * 280, vy: 220 };
      HUD.setScoreNow(0);
      HUD.setLeft(best, "BEST");
      Fx.reset();
    }

    function onDown(p) {
      var dx = p.x - dot.x, dy = p.y - dot.y;
      if (dx * dx + dy * dy > dot.r * dot.r) {           // miss: break the chain
        combo = 0;
        Fx.shake(4, 0.15);
        Fx.text(p.x, p.y, "MISS", { color: "#ff6b6b", size: 34 });
        return;
      }
      combo++; hits++;
      var gained = 10 * combo;
      score += gained;
      HUD.setScore(score);
      HUD.punch(combo >= 5 ? "#ffd43b" : "#4bf5ff");

      // World-space juice on the impact point.
      Fx.burst(dot.x, dot.y, { color: ["#4bf5ff", "#ffffff"], count: 14, speed: 380, life: .5, grav: 300 });
      Fx.ring(dot.x, dot.y, { from: dot.r * .6, to: dot.r * 2.6, color: "#4bf5ff", width: 6, life: .4 });
      Fx.shake(6 + combo, 0.22);
      Sound.beep(620 + combo * 30, 0.09, "triangle");

      // Every gain gets a comic score pop right on the impact point.
      Pop.show("score", { word: "+" + gained, at: { x: dot.x, y: dot.y - dot.r } });

      // Screen-space feedback: milestones get the dramatic treatment.
      if (combo > 0 && combo % 5 === 0) {
        Pop.show(combo >= 15 ? "ultra" : "combo", { word: "COMBO x" + combo, sub: "+" + combo * 20 });
        Sound.arp([523, 659, 784, 1046], 55, 0.14, "triangle");
        score += combo * 20; HUD.setScore(score);
      } else if (combo === 3) {
        Pop.show("streak", { word: "NICE CHAIN" });
      }

      // Teleport + speed up.
      dot.x = Rand.range(Layout.left + dot.r, Layout.right - dot.r);
      dot.y = Rand.range(Layout.top + dot.r, Layout.bottom - dot.r);
      dot.vx *= 1.04; dot.vy *= 1.04;
    }

    function update(dt) {
      dot.x += dot.vx * dt; dot.y += dot.vy * dt;
      if (dot.x < Layout.left + dot.r)   { dot.x = Layout.left + dot.r;   dot.vx = Math.abs(dot.vx); }
      if (dot.x > Layout.right - dot.r)  { dot.x = Layout.right - dot.r;  dot.vx = -Math.abs(dot.vx); }
      if (dot.y < Layout.top + dot.r)    { dot.y = Layout.top + dot.r;    dot.vy = Math.abs(dot.vy); }
      if (dot.y > Layout.bottom - dot.r) { dot.y = Layout.bottom - dot.r; dot.vy = -Math.abs(dot.vy); }
    }

    function render() {
      ctx.fillStyle = CONFIG.bg;
      ctx.fillRect(0, 0, view.w, view.h);
      // The playable area, so it is obvious what Layout reserves.
      ctx.strokeStyle = "rgba(255,255,255,.07)";
      ctx.lineWidth = 2;
      ctx.strokeRect(Layout.left, Layout.top, Layout.w, Layout.h);
      // Target.
      ctx.fillStyle = rgba("#4bf5ff", 0.25);
      ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r * 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4bf5ff";
      ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r * 0.42, 0, Math.PI * 2); ctx.fill();
    }

    // Timer out -> wrap up with a graded result.
    function onTimeUp() {
      var stars = score >= 900 ? 3 : score >= 450 ? 2 : score > 0 ? 1 : 0;
      endRound({
        title: stars === 3 ? "PERFECT!" : CONFIG.copy.timeUp,
        variant: stars === 3 ? "perfect" : "",
        score: score,
        stars: stars,
        rows: [
          { label: "HITS", value: hits },
          { label: "BEST CHAIN", value: combo, grade: "accent" },
          { label: "BEST SCORE", value: Math.max(score, best), grade: "gold" }
        ]
      });
    }

    return { reset: reset, onDown: onDown, update: update, render: render, onTimeUp: onTimeUp };
  })();

