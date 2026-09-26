  /* ===================================================================
     1. CONFIG — the knobs a new game changes first.
     =================================================================== */
  var CONFIG = {
    title:   "Stratideck",
    /* One sentence, three words in colour: the gesture, what it lands on and
       the one rule that decides a fight. The stage under it drags a blue card
       onto a face-down red one, which flips and falls. */
    tagline: "<b class=\"w-drag\">Drag</b> a card onto a <b class=\"w-hidden\">hidden</b> enemy, the higher <b class=\"w-rank\">rank</b> wins",
    /* NO CLOCK. A battle is turn-based: it ends when the enemy camp is empty,
       its flag is taken, or the player's army is spent. */
    gameSeconds: 0,

    // Store links used by every CTA. Until this game has a real listing all
    // three point at the newrare site, where the game can actually be played.
    storeUrl: {
      ios:     "https://newrare.app/#playables",
      android: "https://newrare.app/#playables",
      fallback:"https://newrare.app/#playables"
    },

    designWidth: 720,
    designHeight: 1280,
    bg: "#0a1026",

    /* The painted camp goes behind the ROUND too: the grid, the hand and the
       readouts are drawn over the band's own scene, on a translucent panel,
       so the round is played in the world the level map shows. render()
       asks Art.scene() before painting a ground of its own. */
    sceneArt: true,

    /* The 180 portraits of the cast (`castBlue04C`…) are web-only art and are
       only ever an <img src>: waiting on all of them before the title screen
       would be a loading bar for pictures most sessions never open. */
    artLazy: /^cast/,

    layout: { hudHeight: 150, ctaHeight: 112, sideMargin: 26 },

    // The stage is the drag variant, re-dressed from the SKIN as a battle
    // grid: the shared finger carries a blue card up onto a face-down red one.
    intro: { logo: null, demo: "drag", caption: "" },

    // SPACE starts and replays; a grid pick is a pointer's job.
    keyboard: true,

    // The centre score is always there; the right slot counts the foes.
    hud: { score: true, timer: false },

    /* THE BED. One track, six windows of it: five for the bands of the climb
       (below) and a quiet, slower one under the menus. The entry points are
       the track's own seams, measured (docs/MUSIC.md): a quiet intro to 30 s,
       the body from 30, a full section 45-75, a break at 75, a second body
       80-110, a breakdown 115-125, the loudest section 125-155, an outro to
       170 and the fade from 173. */
    music: {
      volume: 0.11, fade: 1.8,
      menu: { from: 0, length: 30, rate: 0.85, gain: 0.5 }
    },
    /* THE FIVE BANDS OF THE CLIMB, six levels apiece — the same stretches the
       level map names on its card. Each carries the PICTURE the round and the
       end screen are played over and the STRETCH of the track under it, so the
       two can only turn over together. `scene` is a key of CONFIG.art, injected
       out of assets/image/embed/stratideck-background-phone-NN.webp. A playable
       is one round at level 0: it rides the first band, the only scene and the
       only window the builder embeds in it. */
    bands: [
      { scene: "backgroundPhone01", music: { from: 30,  length: 30 } },  //  1-6   Outpost
      { scene: "backgroundPhone02", music: { from: 45,  length: 30 } },  //  7-12  Palisade
      { scene: "backgroundPhone03", music: { from: 80,  length: 30 } },  // 13-18  Warcamp
      { scene: "backgroundPhone04", music: { from: 125, length: 30 } },  // 19-24  Siege
      { scene: "backgroundPhone05", music: { from: 140, length: 30 } }   // 25-30  Citadel
    ],

    // All user-facing copy in one place.
    copy: {
      start:      "To battle",
      ctaBar:     "Install now",
      ctaEnd:     "Play the full game",
      replay:     "Fight again",
      scoreLabel: "Score",
      timeLabel:  "Time",
      endScore:   "Final score",
      gameOver:   "Army lost",
      timeUp:     "Time's up!",
      victory:    "Camp taken!",
      flagTaken:  "Flag captured!",
      cardsLabel: "Cards",
      foesLabel:  "Foes"
    },

    /* --- game tunables ------------------------------------------------
       The level layer lerps the ones its manifest names (web.levels.tune)
       between level 1 and level 30, in place; section 6 re-reads them on
       every reset, so a playable reads the same numbers it always did. */
    play: {
      cols: 4,           // the enemy camp: columns...
      rows: 3,           // ...and rows of face-down cards
      traps: 0,          // traps hidden in the camp (only a sapper clears one)
      objects: 1,        // objects in the camp, each answering to one grade (OBJECTS)
      deckRatio: 1.1,    // a GENERATED army, as a share of the camp's cells. A
                         // web build with a barracks hands its own deck over in
                         // CONFIG.army and this is not read at all.
      enemyBias: -1.0,   // shift on the enemy GRADES drawn: negative = weaker camp
      deckBias: 0.6,     // the same shift on a generated army
      /* THE SECOND AXIS OF A CAMP, and the one the tiers added: 0 is a camp of
         E and D, 1 is a camp where S is ordinary. A level is not merely a
         bigger camp than the one before it, it is a better equipped one — which
         is what makes a deck worth going back to the barracks for. */
      enemyTier: 0.12,
      deckTier: 0.22,    // the same for a generated army (playable, endless run)
      handSize: 4,       // cards on the table at once
      // no score goal: the three stars are the flag, no wound and a capture (tally)
      cornerClear: 96    // the hand stops this far above the frame's foot, so the
                         // web target's two corner pills never cover a card
    },

    /* THE CARD FACES, as lab/stratideck-card.html composes them. The look is
       the lab's own stylesheet, pasted verbatim into the SKIN; these are the
       knobs of its panel, under the same names, so "Copy the card settings"
       in the lab is this block and nothing has to be renamed on the way.
       `style` is the frame, `brank` / `btier` the two badge designs, `arank`
       / `atier` their place ("auto" is the design's own). The numbers are
       the lab's at a 300px card; `blur` is scaled with the card. */
    cards: {
      style: "forge", brank: "shield", btier: "burst", arank: "auto", atier: "br",
      rankOn: true, tierOn: true,
      zoom: 2.6, blur: 2, vary: true,
      hero: 95, mark: 0.5, mx: -28, markover: false,
      midz: 1.35, midx: 0, midy: 16, tinyz: 3, tinyx: -20, tinyy: 65
    }
  };

  /* ===================================================================
     2. ASSETS — embedded base64 data URIs only (no network requests ever).
     =================================================================== */
  var ASSETS = {
    /* No `logo`: this game ships a painted logotype
       (assets/image/master/stratideck-title.png) and the shell hides
       #app-icon as soon as one exists. The card crests, the special ranks,
       the flag, the trap and the decor pool are painted too — cut out of
       stratideck-object-other.png and named in art.objects of the manifest
       (piece-01..09, decor-01..04). */
    images: {},
    sounds: {
      // The background bed, looped and crossfaded by Music. The playable's cut
      // is the FIRST band's window and nothing else; the web target ships the
      // whole track instead (`web.music` in the manifest):
      //   ffmpeg -ss 30 -t 30 -i assets/audio/music/stratideck.mp3 -ac 1 -ar 44100 -b:a 64k music.mp3
      // assets/audio/sfx/*.{mp3,ogg}, trimmed and re-encoded mono 32 kHz / 64 kbps
      // pick:    card-fan-01                  (a hand card is picked up)
      // place:   chip-stack-02                                          (it is sent at a cell)
      // flip:    book-flip-03                                (the enemy card turns over)
      // clash:   impact-metal-medium-04                             (the two cards meet)
      // win:     jingle-hit-15              (the enemy falls)
      // lose:    impact-wood-heavy-03       (the player's card falls)
      // tie:     chip-collide-01                               (both fall)
      // trap:    explosion-crunch-01                 (a trap goes off)
      // flag:    impact-bell-heavy-03 (the flag is taken)
      // victory: jingle-steel-01           (the camp is empty)
      // defeat:  metal-pot-01              (the army is spent)
      // warn:    error-ui-01                  (last cards)
      pick: "data:audio/mpeg;base64,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",
      place: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tYwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAAH4ABJSUlJSUlJSUlJSUlJSUlJbW1tbW1tbW1tbW1tbW1tbW2SkpKSkpKSkpKSkpKSkpKStra2tra2tra2tra2tra2trbb29vb29vb29vb29vb29vb2/////////////////////8AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJAONAAAAAAAAB+BD0710AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tYxAAADUQtFFTEgAJLu7B/GIQCQAYQICIWKnYlg3EcnkwwMDAwMDAwMA2KydGD6wcBAEAQOAhB8HwJBAEAxB8HwfBwEAQd1h/ygPh/8oD4Pv/B8HwfB8HAQDGGFg+ficH3lwQd+IAfB8H3lz+oH3//BwEAQBAEAfB8Hw+XD6ywSwA7S4QzQ2y1WgDIgEKVbxisLsyP5+qI0zMhQnOsTC4Q3+geKDcAhs3WPcYHjA+CQi8dV1aChIj0jwo+//px6Of8KQNZT4EfSEcws8P93Yxz4SThTakTcdb////4eTaU58Z8VjZx6ikMHkdJ///////zaGPbU58J//H9xMd///////460Mm33HuJ8qKoAzhWI8dTSGhmftAABMbwThzp//tYxAcAD/T9Z/zxgAHtsKp0Ywp459H3EiyRsvYsWHFmRTDMBBhQYBXhiwEBEspQIfPjMzMx+zM3PZmY//8qoCAsevfaqqkTBgy8ZjjN4oCFNrmlVVAQESsFQ0WBkFQVg0dsAwMuPRKe/ijQVHXAYsKHroBsbkgVBUkd8Vtd5J4TAIlcsFToDD1vclIAAAIEMNIgEioxVkUZOrCUaGffrqTm8x4w6LaWpjcKYozzu7/3jY9fP2///bDl1nvFul/2kJRmY6UYWYsiZp5wBxF81m8IZKOf1Wf/kQUyIxviRhJjI0Bdy1/+Cq/6vmlqVlo1AymBdQqHEUNcInN1G82oBf/oCEtda+QAASAZwqpHg40Qaz1CKTxUGvPpGeEAgiNR//tYxA8AEdWxSYMk/kIBK6m8lBcgkrGXH/v+a6BxizFe5d48a/iv59RPiSkjWiF/+sMNAjQcw6RBooCZcjIxWy4UhlkzGMQ0IjLc4xz+N52P7YPlxVpaW9kqjms8WBAKCIwd//qXoRMcxS5Ubznt+Vbk2QqN8oNi2OsxrR5HBV7A1/z37liSm0mio1aQAAJOf1MjYQ2GUJOltVBuprblKSi2SxxguLWeZinJAQzxNAhqkMUh9RM61a7+Vo3trjLaL+v/8jgRwaiigituNdUobA2B6j+Vjn/+P1/JRVySBo8VU2Dw9HjAdG///RB4UDp5et4lzodPToInSIkJVzx5X5eGt638NiYh62iqSlgqiJ0UVd08+4+Jp1QJ6W3lgjUk//tYxA0AEbG7QISNbcITr2dwwa5gKM8a1xOmZkeqksSFw0LtLgwC3E3/8IpDoHIVAPQBR0jrHA80weVF0TWjXOmrqXfLoYv38Gyv0/0yFSaVxJx0yPROealAIyxSen/////Zp0bNOcs4QYw4eTkyalbYPQ50fH/pZ2DZ7WtzuxJp2R/M9bgl0vCNeprEIALYWl4ej7TY5yIyXe1v7v3MW7vN1epEeokCQgwtlVDZShmRsxlHCxDPdAQ/P7P0UXT/UAhARAnKqKB6uR3Hs2WJS/shVFxtTlz3Cpx1/zVZ+PaSTyrZo1zAhtLhy7kod/////ndRRJJvnfaqasStE6HfmnY9wx4MyLbvWN+hfK1Bo6AgBOinj0zKy01G/YbTXm3//tYxAkATzltLQeYU8HrpiQU8Zl46Xg/G4M0wc8JEudP+TFJTvrTYo9je2H6z45uUl/2O1i+SOOcsSRwl4pU0YWoG044JJHBXOsoSssjFnog2EZ3/8i1qNR62Out0GTOfH5T9Qolv//meGFeyuKSkGXiw/SISthVic83O6QBohgIRon66gwZY76NiSiRIZT0NXISVgQG4V/zcKTC1Fe7FJSzWnmu3Jqj89OVyVtrblziHpxjJEzSk3LRnJNmcATAwkJQNz7xBLUv1J1O/7vO9FLZyk/ReVvNImubI7YZaIpZ6AWJDGlRkkVU9RoVveIYVg7ZRrv103IcAAJCEhSr6FGsxM2m+rDWkzNVWE1JueGAmar8nTBxJpVjDdSDiRh3//tYxBQDDhkfEkeNCYGNn9lEsZn6qsN9rNWteULILWTVkmlUzipsXKsSgtcYwBYczCzXKiEK1K81NKu1+vDNeULHCE7gqVco9VnvICIOnc79Y0GjzNn5V2SI8qp+VAEDwijwTyxdj2RP8/y5MoYKCBB0P2UFHQ1ZQwMGjkatZLP5ZKX/yWfkds8yZZHI1as7t/NERQkDEE1Lmn//+zRpRQOGqhX/9vFRZBoGRRuLCqTISFyNYqLB5/+kFhcRmfjxRtVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      flip: "data:audio/mpeg;base64,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",
      clash: "data:audio/mpeg;base64,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",
      win: "data:audio/mpeg;base64,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0096H//+PD7ZQXG/lTShL///////1Hn/8qRf//Us7kWY6YBQJZIWAs3qyKUnkLMbVFKgqJlxSCIqJjolh/89aQukqhQ71WeRE0lkKy4IqEyFQVItTzOV/+5FSRagUioGDgHHAJIlcEt4CJRS/qVlYxjBXmFP//wwpcMb81TG///////8KAt/3KJ//8MEqzdFnUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tYxBeDwFgCAA4AACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      lose: "data:audio/mpeg;base64,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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tYxLMDzkB22m9ow8AAAAAAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      tie: "data:audio/mpeg;base64,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3MJVWH1xWP/lPvIly7U6GZrfeSJY6B2qjRor5VoQfQhiYHjijg45GKHzEKcPMY4cOFJKbrgXvUzgTfKniQoWYxhLIgiYhotgo087/M/T/R6PcpYUFo9HClA4fAT1fmToUXotRJaBPtIVhszISaM6tZXzGTgpYzjaS0KZ7FdlsfKFlpAMBbQ4wAGC2qxC9pHP2QwH1Z93ChnwwE6UGBUhwJILr1q79ixtI90B8HLiWGJ6UXPJdWfy3YEpytWvdkczNuy9/W5M2e3W+vK6rBksvZ/pmcyNmVUV6R7lAUNCUNuuIKPIUBZ39CoKgrJEuWJKpr11ShLbZSABKLSHWX9HwYs2J8Ke//tYxAkAEI1fMYeZEcHgJOTs9hgoI8mhT0vWNEhXJy5VJXSPzkneWan+92x5heutmPa8fa7LR/fJKdtgrkqLzNPkaceASJIBVauVncJOspFEZjo8ZvS/53oOYskVvGEfkiWWHgcIwejl7ngVX/+Lfb8rJFVDFdCTXFF5DNxFozqEpc69v/FNIJBERQAIRIOIKX2zJV8E1ZH8wKpaBqTJGowlVxunJSp+7ybnx4r7U7RdpY9viUnTmtFfvro1N4cFVC8L+kTSUsddXpjLnGqTu6JFhQCSKqZzlec8Z/+WXn/5h6GDn01xmIn/SE32HEqJC425NdFUVEiW9f5ayn/9CgBoAEnBqKqA8TCJRYTl5T/Ph14uWd2f+Zc2cnnJZ3ZJ//tYxBAADWUjHKeEwgFvnWGk8I04aPp3nNOS9d5OS95fdjkjq/rYnLI+eaxoKpIktHHmWJFo4R9TBajrz/vnzed9be+fv8JTJqQVCINfkaL9hPYAXqjy0sv6a3e7Lcr3gBAIigPAsQYqhZdVkfPqrmpxPEIzEL4mUKF5CE884zZTXZvbmtJqtVSCkx9VQE4BHt7F/7f1fZmFO8t6FgqEw0Imj/OiLK/UFXLDstFzsaGsjkflTocwafLI5akAZWIiizD4uN3Mj/IyMjPuRkRlT//yWX/1ayyo+RkygrJY5GrKrAwVR0cyZWoIGCDBQQMEHBMIC36xECwsLCQVZrFRUV//+Kiot/1ioqKCwsLBYV/+K0xBTUUzLjEwMFVVVVVV//tYxDIDyrzkiEMEacAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      trap: "data:audio/mpeg;base64,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",
      flag: "data:audio/mpeg;base64,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",
      victory: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tYwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAaAAAeYAASEhIcHBwcJSUlJS8vLy84ODg4QkJCQktLS1VVVVVeXl5eaGhoaHFxcXF7e3t7hISEjo6OjpeXl5ehoaGhqqqqqrS0tLS9vb29x8fH0NDQ0Nra2trj4+Pj7e3t7fb29vb///8AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJAJAAAAAAAAAHmC8G/OrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tYxAAADEwpLHRhAAJspCm3MyACAAJTcvfERBAgAwGT2DCEOAABwuD4OAgCAIO6wIc4f6P6wIc7+j/wQBAMA+D75QEHb4Pg+DgIAgCAYB8HwfB8CAgCAIBgHwfB+gQAg6PB//4EBAEAQjwfB8HwICAIAhg+D/IONsxCN7v6fHabYC0CARhMdzREmFRjAtb9aAyOWgAyYGvRyYjSL6ZY+4YBIiMI6LPEuC00QSFLBt4pQLXguoDsDbAGwPxDVocqLNSShqwG4AvSAW45QoITsTIskZmp3aJ/Iosn1IHC8XjpdNVF5d9by0fJwiCe6TGrUnRRtdGh6B88bk+fQLhdK////+bguETSnV67CrD3///12LVKsLiz9oIIs9JsCUdK//tYxAaAEIzdVBm8AAIOnGz3sUACQmsqxzI0BIEAhiQE+iGYeLq/MuCU4HPPAmuHRcSg502eKASZL6C4HICRWrNJEK6nI8I6LCu3B6bSSjiyN3O8KY3qj+yO+RxgB2H9hixd7n+H17dmt9bs5V3dy3qvO/v89Ya53fft2rW/s3Mcs91tlWSbvhUAjLVXEBEFUgop7coPTMiTC1uUxhDmzSAGlxjVNaIAEzhqmanKE6KUUoN8EyDLwUDg38BdAGZNatOdRHyOWa3SMTyJoyLLPbnmmJDwtDIk1CtZuS5rPdNDT11NU69AuL/5m7/ic5/ID1JHkVKSDQbEKmC25VyxrVIbGU5FVcGGn7wMxTiXpa64oEglgAEuYFFcfVXr3LsQ//tYxAgAEEmVXazI+NINKqr1pp8KYeOVMviqrnvpJnIdYItoBe7Oo+uslD6HVHG8M0xUZCZi3nQZf83U3FFdZ/9SVmiiwu7mqM6XeKeAGz1ddFaRs+sco0e66StJXMhUX37PMW/QvvP7ZUCAExf+urcqvu9P6v+j++7LOaqN3ygSMueMZeJ6XSgCCEAACrh3sZiWdJPQyZKKmg7NAwH78rFRBNLZizb7rlam2ZdrS3GloE7QELHkuXzWXPkry4MyRgnMvo65Kyc+s8lUXqKQOERIvP50uEd1F2iCKWs6JtR9RCELzuhx1yPtVvTtxOUL/p+eiUdDnYzTqLVdZtWsyYNjeXEITi4mVmKl5AAIAABOiH6am7MyKCU3DG+Bga/p//tYxAqAENmXTU09VpIeIimpqasKMAYV+DKwBEH5ysrz82gryhQAxikYtlXjj7myNiRGpYpqfnnq3zDDDZcf1Io2XuS18xXtvlG/UMcgD3fcDf+pmDbFdCYD7GI6aduFGBCfbz2mt6VNtoffoMwbzvt18hb9P8hLf/sfdJs1Kts+VN4YbI5rgAAQACVKGUP07kUwoeOuY/qh0chXrp3uz4g0B7ZR915fcV9T6XtlL6Sbh+nWCMyaVBe7hhnbg2E13yGg1reUzACSZHn16KbUqSISMCPxNXY7kHHaxEc8oDINxqj5CujzW4EpQbfljZ7dNW33r0G4ivuzFtQglyphZu20OJBO5LSpVCbDdD3EFd8Q0GSEgkpAQBkx6OSopjTi//tYxAiAELFjaa4xr3oWGiv1p626POF0c3KQCzjJUlo61JRRSyra4spvh7VvERDX5s6sOQBx/WGo+37JmU9PB4PHdny6+vrVe9lW28vyIKTfo561zpGZNGkvam+ovkq+/Vqbr/Qagyaarpo09adDfzpuaMYFy7LTNEUGTTJAwPU00zdPAiH2a3+4QAIAACi5JwYMAnvORYvqbCSEJaoIIxYqBSaGXRMGQR+qSoX+lVCU4J823ts5hN4LZzsh6VbbSNe+w6wxqH6+WKVbc/LFl1qSu755sEOrr63a0b7ep2oodPOZcU1tfzEhieVacDQXhJYb2Fo0OETwrvae4lBUJmNMsDT35Uq07MEW1+z0FMAIAAAkloQJy3KUjIIxwhFp//tYxAiBEJ0HV00tFpoWJ+r1potKFAwaB1CAGegoXVf5uttohQTswvS+RyYxTe6tC/KdosQxtKAzsGzmUev8H1qBFHLL8bSxEu849svpeTPB5d//eWeFQbhgfBwXH1Iw0OCdkaho9nC0DVn9ralW7iOp9a4aRykFcqb7LlYlzb60EqQkuIr/4/UAAAADd2AYmg/CbUUMDYb9McgNumSiCBag07KqNOkoRCqtuaayQu1Q03fm4H4NBaDKJalN7cQpez/cAqZW/Ztc+Zk2N/VWm+rVwq6Vi4Hp7dRf3KJeKaBWXqqwn5L+ixXhC3v+7+8q1lsjF0clptH6shqy1Fufh4AnRpAEyhhjbX9NmkktKoAAAAAAAFLQUFaa2MSaqajS//tYxAiAEMURT62suFIHommpp5cLjQIzwCnjDFpG6nSfd5WejKhANFUEwfeWkGNBEJSbt5or/M+CCeXUC7G0iL2VIbpPfHCAwYqpJY1MaCIAy4+94BNw4898W8KgAVuoYjqe7X26h0AG610F//V/zP1NQq8aZE7n9QuEQxQEylSJNBy+V2SWl2/1YAAgAAVaA3jWbcYQni+wmDIYmWiqpt0PoCSYlyHWFEDQeTLTc+1KTp0madnbKj6zK4KZQPBA6EajVgXUtv8muy8ICq8p72Vxl6ASE+akmtGtWtpYXMIf2K/4t4/6jrpSjIFDW60ahv/N/Ey6EuWPlhITR9Z2wJ7MN/YdF+WjyOd/K6QgEGCAk7+AyxsepuOAWBOdBpEL//tYxAoCDmUTXay0tNnGoesph55bBuxliutGU28iwFIoLaHGmgAJGE978EyGSq45QDQQEzykmu0hDovyMO4+w+kxE1QSTZbKKgmRGaq60shVfXxIEb6tMLsnZOAn9CNEXOLzaY/5s3y1iTio6vTveCl/5wZECBMu4CKKQ2NaGQTkvAkuODpU3z6xg9AVA3CU0UnW+oU0haci5lxr+B46kCBh2NhwwoT/xdQyAja9f4LjLb4QNaYz9I8oDkY6tXG4uNdUPdmQgAC3ehGrU1Xx5v2etb16jvuLfm7LOBe4yNt5nI6qlqakIBlggJzfgIBH07Yl5iCpRP4XOjTslLA86vYUDyGQlCGeM24SjgMyppWQTILmo4O01U1ep1ASgeKV//tYxB0CDnVhW6y0cdHGE+t1nDSqU6i7LGgrczXe6SxqGOSra0KWgpTL74xxlP9bVulX7aC+2RN9QzPTNNs79Iq2WsptUfKwj793pnQU1EyCC5v/0DGE6uxwsXCVWNlrYZVkCpwqRhLMZ9nxM14oVWaYBgkZN62OidVDWgcqb0AU4SPpekUv11k4cBv6Lc2O1Eoa51b5o5KaB2srKpcWAyxCAhKNOoY8BqegRpYG1OOUadrqCtwGpt+OutUOs/u01YAAEWSAndsAWhhWNqGTSw2rLuBx6RO0aMgUE4EzyWQlDADzxFMYhAufetcoYpKXQpfGfWrUnzoJ8WJFLLphuLxa0nzbiUBWOXRUL99EZFwxEx8/KHzCY7Qiop8lRlRz//tYxC+ADmjjU61FVFnalukprEFrudLXcYi8pLbPv6d5rpcskt6FbPmwASAgp20AHCHcvyxc56m5QrQAgZ6+q8QdtTVn24ViQyMLIIXDCS4J9R/Y+Sva8CcN7ILDanUtXb9bSaBNgFIor1ORJnaXSQZFa0egZiDj3U98wP/6iga/37+VUsQXXcXf/YkmRvjSdZ2viljHCpr2/yye7DbfNIAEQABkkAKwiU0EFlgKM73AcgK+DFph6qZs4WilJkpH4GUB6haEWkTKDgjhGXPgt8l9PX9ZDkx/G1d5n+GceC61Pax+7mRVri1KdMTgGN9H5lVnPONB8M+y27JOzeBl2l78ivr1rdzvf7hmPP7Nqn/pi/Ktb9YARAApbaADkLlV//tYxEAADrS1Q03k65nPlukprMirZUnqaGeoC0EfB4h6bEwIDghJaBHaJkFFIafVfQAdUDeWWIeMKopEu70z/RAipkillRkK1kTrd11MmTogKgjqNDmqYnqlpNyAngYRNitVf54R4K4ibsze7ub3xvW6WsvwV0fpvCeeVqx5CoIEJSyAPljnIH7OJVHq69gdnWiODDtKw4Q5bPmoioUoMwVhUeku7Ld5doYqz2g5oIYbRGn0UVaBmAYh4eovlosPJUZJ3R38H9KcVe7LW5hJWXU40gjDSmM5hSlB8mIkscslVCAGRGNjkWqQ8VJusxZgEiFlIPbbANpM6uvgS/AYhloCgjrpBKY98jSw9vSE9ZsSfiutpRi1je5Vlksb3HQO//tYxFCADgDjRO1AtJHMnKo1lo6bIbDOpR/qD4av6KsrNGq5xJIfQ2lNN0iwkjZlRtvI3piWOEecQjMtjq9lwcfun/Ye88g4nhFhurSd6774/6HO0tXs1YQ0KYmVLbIAjTDWOUpMbTw1S4AjjDZUZBxq0iSshJAy903livQx1Fln+4dUSm9bDlli92qoAXwWS9R2hL6hVLmu78sFdXEREXwTlnwK0wTCJCgzTpydVPwPbA07v5WFHuuFX5nZn7puBHWRA/3ib6gAhFGVtIBjnc7Dtm4IjyuBC1DT09DjD0LHnHA7yo6p5wHLa0GgEJXm1ShniXwURgJGh8uk29zoIMiB59zzeRAAVGZgszT4OgUPsVdDyDvvjvh1mSwDjhys//tYxGQADfChV6w1FHnMlqkpqCIfa6TTNvd8J2Nw7Wlby20rz+n47d7Ovd8oq7iyhDIiYjU1sYC/JLq7HAvIyYFhpDwl0g8YPcy0R1fJyCsb141WwNE1/PrPIvNxN1EVmgVd2Klzs1AJAs+YxiYpalqsw/FBV6MyD89ZZi9DrSjHrsErnAu9di3CZ8mLi7hzqbm9dQ3/n+t/fM/VX652Age//4CobVLGkZTY/zaESgKYJQpIVfnL5I/v4Qh2mEhoiLRHONPCaFO0HUt+5MtFb3CqAXyVfVqMkAUpb6h3kY6BKG1UbxkwpAVuoNhHqIH3apn+sqNt1Fd8ax/W7064hfvvsnwtsHyTSdA9kpqvz/cz911AAI1+lBQmpnSNbMwM//tYxHgADdi3VawodrnPladdpqKJQxTdcEDLvISRc5RJkabtQlCH6kMDU60wcWQvCf+RQ8rlQOKRsAZDKmqi+dPVudDkfl6KqAPQ2iLeqccUCR5s4ighMnC9PtqLzXPf4eUL93692HvSeXaUAv7ye/No2FceX/fC2dAT31tjUM5hu5UBhUggMSN2MukQSlicbHCndAKHsXFQjTKlNMtEM2GYJTyrOrRvAx7egxcPSVmfMYJTK1mNesqt9051SCTp03oUD5YFQ+FzBIwC7wSa4aSMxqS96jdw17TlQmFED417lmCqL1qpV//q//sVAbckAIgLTOyyowIGTi+PNVCkFBMxIR0/gcNztJ4BwfY4OAVFtW9SFaejybYjK7Zakh5K//tYxIwADjyLPy3BFHnJlCbNzUC4UgS4uUreBXjUzq3/xQKpN6/zgXJ4ctT7uVE9ej99vKHMfYQQXsOiZfvsVDyv89fNrDtI7+1qWpgDeYwgK+6b38VwEkJYyQEsL0/CBoBnCgqZhB5gwAGDxQykADc0cJBICv9BybK0XXl9HAMFGJBczbC983HEIZJsHkM0svGZmf0kRTyFbXt3a6jnb+dN4A89l5nx/jO3opw+CgGnWueEDZY+NF3hfbQ1Nhk8etUwVj5suFNaJwiqAKDrJIAVgbsAKHgQJG97wQjAwGDTmKURyEEajmz6LkgJKIQAEg69t/nYN+JUYl0i7jFVg3N/AhFUlX8Of+q0doN/ewuVvk1OsayOG6RIfUV8Wm6L//tYxJ8CDpiJLG48conRlaYpyJpUfx2D7H3ltaW24z/76h2t/oBVJdQ34/S6D4s+m9mHV//21sCxEgpM2CoizIYCpgTBmdASKBY7KBC1Bs+bYaDzhKMbYcOQrlPVZmaA2r+xKuXKVusP/VR7ahb7ru/2YJYNf62xeYVrKTkW1r4N623Z0AEiLHBQSz7iTlxQ9xPVOpIKOum1vYmUplmdl6DTe//1qt5Rnx39NdEL+QJjCMy5oIOCj6Po4sTMCOQj1MVCQUFDlQ4HgS8xIMF0BchBAgfSHqZeAVNTcrr5c9zJYxb5Wj7M0ndXdf+W2e2ufrVohHlEWalRIlQpTs7Kq2R5zRYzPc0xkRpKMW2p7pRRyMaRsdAboFZQhN2rkPWB//tYxK+CDsidLO5pZ8nWkqWNzSz8G0kAVhh4XYSrBAeNVxQw6DjDIaByXFhCFS8ZjUKCZ3SUVDQcBIGHiQ0Smi04YRI6FsaleEqjM5RUkBIPI+6++My83K7/9M8iEk8rBBHd3SkJhuPyaPs3WF8Bnusy6Oa7JLrvwfmv7vvq1S+lM/ae0ZtzO+1m5ApUAOD2GHrW0QCOZJxeZBAkYIBKYxB8+pgyL5taRwd+tQheJ4TBxG5V8agRr5oDkzcgb6zJWsRJq34qXt7rtTXNdu+sqD+/+G4rwg8Laxi4kHhmCBiOgHnoJKzjmpXOtYWtgTIKmnJaQfeLflmac0gFiIkwAyZNUwaJD+EQNAiMwESDMZzMHB4xUlz9TeMcA1AMIwAP//tYxL8DDkTrJE3wqcHbEmSNx45RI0ZO4QHZp5OMoGFIJAiLsskcdbCzNoOEyARJOpKNq9TjHjuX0ZDkFnsUNhB2ofr8yCWwQAlIAwFUBARFwBYSS8aw4IXtBMJBB7XilC2sfPQJ6pjV/6f+qiYkkABIYUbiLDmAA8dfzACA5gEXmDCk4JgZDHFGeYQAyt6yxIuhQkhwfdOKzEEmFUq+sxQ5KGQOEed0xTNFGM41RuIVm5wIKBkQMX9Ag20Zt/s0UgV4m2/SXybSTJ73Z5mRFCVdPiZ5If+f5GIuKpXcVKgg4Qb7YUpCEPTHquQSFRhOHRhQO6JBguJBwCLIsrJAg0hDGUABJWZrBzMsdozSIJgKTNC7p14Aebm00K3/n++Z//tYxNADTgCZIE7ka4HyFOOJyQ6IEsKybzSaMXuv6uYqenKKOpIoLDRETY1hqFXB2k4p6hYtFCRdNY7XTFVKF0U3/6//2///2922n6mh4ORFxlKTAoONobQSF5j4MmTx8LA8sJcxyxFzx4crHqARgNjPHK4s1E9602J9/NyHgVEI2AAg497mfqUFc9eyH+58dMtx+iojAEiGDoJNOJFFPMIJrSFBQDJUfPCooE6iczANAx5PTTb5ljE/v9N39X/+Z1ACEEQ9CvAwBzEALjm0qjIgazIcIDQ4UxYQh40T9QNzTgMaFzAIEOLBjYLJP60KHHfOGFQ4jchWGKYs/eIoAbERFQt+b+9c/LmV5utF9799GPxanl+YUjQWaKx6EqO1//tYxN8DDh0bIG40coHfkiPJ3a1oLPTyWOP9mSSy2lOU7lZNGpNukbu2xrzI78NvK9sVyq71Xg+CwDY1aH9nNO30UspgewgI3tMPXeyl/aH6aiAGhlaQ2MYAAwTDEzgjEyVCwFCKRLuYBA6YDoQZdpiYlImiKSXDMD2DvDMIae5fRvWjcrjT87joL7hnDMuy0PXauf8sscQFYf1a6x+95QaGzaQI1KgCPDJck4xLPGjBAg0ECkYgQG6iyb3RoaKnBaInF2PfNjh5oZe3/Wj6Pt93GBKgg8MLdWBIIQaEBmk7xgYDgcGxlcGwMAgw/C85jJYm/iwARsxo+VkyNwjI/0ErJBANEW06XdNzWy825ISlIl/853+TO87H81y4h2Fi//tYxPADDtSDIE5lasJqqmKF3Y1wtyKKEmoiLXeGUzpqhSHdXTREFp/sp4ODB8Ohl9KqLDBJQdY049I1Zo429m17rH6LP/Yhm7pqo6l6KgAhAAA0XHHgVWsmFJ5lcGyCWAkoajOZggPGIHudEhBrCqRQMGj18A+xcizx8H9co0z0mDSFZuG4KeV5sZYrGoTf3c1e7xdW3/0mUzWzFGvXQdv2QEhYGjoBBuxoqgBlhVwu8ABGCiSCOcbFLkHUkaRRgPE3jqwHdGqf/p6XnKd6/9H7dY0IKRBrDDtp6BUIzMqLQcqQKFMw4HIeAowuEQ2uJUx4IT7AAUGJ4pGppuHFLN4y9mX5t37/vio5ewrkAfG7H/3fMNDs+f0ZEY87euU5//tYxOyDEBxzGC7pC0IZmyMJ3Q1wtJc55Z1bR5uh1SyoTFibKiLw+yeADQuJVpYtYHc5uxB56HlmvovfC7PjfH/to1fudfp1VQAlxIkJEQtqwUsCDRMZs3RgQPGFgIYI0iIVBrQdytq6ZaIBIoHwIhhyevuU1KpiSjKdv93USW1OfWLwNS1rPf/KHiAFO8YxWXJBj1NdmxCD+EvqPnx4MsCYZBRZxg+tSGDBx55YgKijRVKSSDnnPUyj//6V92a7ezxTtbXrJUBSImN83qvjBgZPC283sFTHIhM5pQaERg0LnQUgHH1BCB8JHjIACecOg3TwYcY/skFDKzeagmA6LOYCoqkt44a/2GEEgOIL+U3tc1vzOgs6FTgEJAInAISE//tYxO4CEISLFs5oy0IAEuMJ3ZloqAKDJ4iaPLGCizyDM7FR48Ezx4ogqx1Rk6gJYUH4u0mVGvDeKO968lzD9LFaHZpfqcVUQ1LjlTDBw5cV00jASIT0kRNOh8xcGjpIUs2Fn07gYDg1cwXPkQixFBlEo7A8WXaKJJQASp6+/GFG3k1tENcOX6y/3DqAeEWPsiG4+nXq7m8viYVOqKPDRxINJFwoSBYg88QCjViMgV4/EeRolmOIQbtJEqMZHf77DBhHqilnrqRZ/9SipSSSciFszMNhIRY3nIMqSRrOWeSGY2cgvEL4hFOICXSdUogb66HKL4Rb9VZTd5mBkmbfzxkeW5oNMpFQFFi5ai7rlFqPOwDCqRVteEK+xKMWQtGF//tYxPECD6CjHO5tB8JBESKJzS1oxs04OrpQ+1btux54r7aA9eiRLXZ3mtP0KkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqoJUbAwdQWclG4wgLTVFxOHBcxGITWRNMOAMEEYyWCBJJaJkmAIk9+B4gKCBBWoBNZl3IDbXfYagpzsZUjMnljqre/eNWdiU7++b4rQjWNGqk3nmTKTyqpNS9WUuo8jjPCMqXrXJbr/rw811s9V/89Ta/5lqUOjGTfG1u3WNels1WMzN/nfhyVVI/+l+1WHsZfT/9qpqXfaF8OOgao15UyRAcy2Ru0nIkeEqOAR4kVIS3DpVPWW/1SPY7+R//tYxO+DEAydEC5tB8GvC6LNvTS4O/hMZ/t/R/2WN//2LLdFQUeIip3/b11MQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tYxOMCFAH4/k5ka4DGgmOoEJgGVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      defeat: "data:audio/mpeg;base64,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",
      warn: "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//tYwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAAH4ABJSUlJSUlJSUlJSUlJSUlJbW1tbW1tbW1tbW1tbW1tbW2SkpKSkpKSkpKSkpKSkpKStra2tra2tra2tra2tra2trbb29vb29vb29vb29vb29vb2/////////////////////8AAAAATGF2YzYyLjI4AAAAAAAAAAAAAAAAJATAAAAAAAAAB+Ac0gLBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tYxAAADORFbXQRAAJZtLL/HxACKjbIABADbwAAAYx4xjGQAAAAQRvnOHFnwffKAmH+8uD4f1AgCAPv/UD5+XBwEAQDHygIAgCBysHz4jB8Hz8EDnqBAMLB8+oEwfB8H3g+D5//+D8HwfB8P+gHwficHAQBAMYnB8P/D8PMPLvCqzQ7M+228kjqQbAF4XKLpNZLkTPaRocBcSU5q7wQ4NTUIowZ+cKYaiLeOYHEmhqHWC/ykBlwrCysXYWunjcUKCiIMRYa5dLocFUXT8QNYjHXFLGrmQy5wvRZKKkyJcQWSUURsJzJ2MS8VVqL7K5KmuhVzF99I1yMbsj3zjf1pZSb9++rq//V////0TKwdkp7OqXfCj9hgtLWsGUncR0l//tYxAaAEA1LXLipgAIjpanzH0AAl1A0goGrUgaETNRcx5hI05FQXMSji0iETsRoLFLM6DrNIcVIUM0fZqoNOXJk/MQyK0sDM3UIWeZDfVizdMvZKVsK4O5pIOSjVChj1isosMpybLTrKrKRJFFh1FT+peWDytvfU35jWo/mTSWFZ4AbSuz7PW0Y5JAAEwAACNWEA6zN9ehNIog1zzI/ULCAoYgPTmYCxo1AiRJExDPCuaiyhjBcwIBoTAk4fLIEmxGWDoCsaFAHFkWGcK0KCshx6GnIKKZ7D9nrGyvFdacO6hXpo5JOojmuLSvK0sHrFwt5rKBouOpLNnUdLi2OFrX811N+6nax5tDP//wxHGGjlbbaraEI4oCSEiQgEBQO//tYxAcAEGXPf7iFAAoMG2z/sPAAIaunsvlzxUHeDB4MglxIJDBmRmhNaMT2sFEyBfDVbD8+YZFJ1aD5q559s9SEizC82QtlNzDGJ8/MnHD4xJd/Ules8+YYxjTz3MUzkrfXTON/zDKGGczP2oQqhxrWbT+s5f8WzjCdDPPPY+ToYfoTdm2iqJt1X2W5pAAQAAATocWQxCh7S16v44ymaw/K7z/D5RGkOVC594z9Wwhw3jkOdVz/58KCwnKlFfjFf/XNYuL/f/+avYtYGb/XxatdWzjV8/4xa2dZz/a1oT6NCBxrgCDQcYx4TEqlColBUNEBGQC3sWsNGzpe4OliTQMREQ9imdRDb8iaPMQqNZphKIAQAAAHZt1rNaDr1xdO//tYxAkAkK1xU+egWsIDH2c0LK14oD6tVh6Gny8blWBOhCg02Fx9ZIT18fx5QAwh0Mn8CC9q3PyeiEk4JeqKWz9/wcYcOeRVG4sOQFRFEIsp5r1KOYmrHfXLRKrDNPPJK1JNqwxrym2a5pmvZ19Vim/K3//lK3X8olpYHgaee+HD3z08+Cv+kqENodwAG87t2zA0sxeEV+dtUUDNWaXRO0z8xDTL0XrWx7p2r3x2WQaukRhCA9b+oCncfppVPVmVN+yYiNt6//58POkodwHk793MWomBCCEDofPlQ9y01YNxOKY5pvyjRKJpqo6216NNSNjZVgMnSR4YVZyQdFh0lCp3/r///6+61NUAhADnf8ojRL4ENAuJgvdAg4EAGzyU//tYxAsAEOEBGklt8UFZlaP0fDYIlDjLS4x8YBVqPATaxZpIwDpsW5LArDmkiMeMfkAFtM1aUxG5AM7NS9+UboGeQzVgDDKO1quX5a7zKIwADQRi3Pq4ZfxPOcVvElFaeF6zPoN4vpBblOJqs/P+sbru2aRv/651b/VV0PU4wh9JgFD3ZiEGzIIAAAMT/ja+t7JPBaJLerZZYw0o8ZokQYtS5bHqUd0DMOwAvA2jM4edHWpy6ExAbpKH2/5iaq/8xYmmqXqBr/+P//Ueyrst3/5bZ+s6S6n/5EReVSoQAAAd1wrpfD7VJ3fOaceiSNZ4USEgTWiDXDBAngUQZ4sBDi4yK5fePjRJEUZYB1EFSC3G9fIzoSQYcpnnAlmWycVD//tYxCGDywx26ueZ44AAADSAAAAEIS6AqSf+Lf//X/r//+r//6iIxAV9VUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      music: "data:audio/mpeg;base64,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",
      // End-screen cues, shared by every game (played through Sound.cue, so a
      // game that drops them falls back to the synthesized beeps).
      // uiScore: chime-ping-correct-01
      // uiStar:  mallet-chime-ring-02  (pitched per star)
      // uiRow:   beep-select-01
      uiScore: "data:audio/mpeg;base64,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SUM3rum4EcsopeBvTiHQC0RkbDGDrcW9lVuTcEJviItjEAPVbHcTOSzvd53n///rVWNO6w1KoKAOYChcYhNaeKQEdBiYMA4MWaay5bln//2v///QA1C0f//////1///V+PvRB1ii9n//7P93+3rBT0AH/x7aPEk0zCDn0s0GALhF5TAZD8MXsEsWAObCWzFgCpbax1zPDmfcKSVyiXxAv+YAwCBgTgimFYQQbGRg5heApGBeA2YBgBBaQvGkIgdb3nrB0EFp0GoV/+wm4LrP1f/////////y6W6iyE+kDQE6BTbjAAAAgAH9svYSia0Nhoa6H0P4zTpmLd6TzRttDBECRaNhoB2tqoxCrrLuPN4/lljqUu01pdr/+1jEHAAODUk3p/WxEcQpJbQu0eBbIwKBcxNSg+TScxdBIIBVizwuE+rr546y2k60aTrb//Mxa/9FkWU9GpKp///////5x9MJ6EOgo6ABxYACAwAB/9fqQWJ3UlcMMDCwDGDKhmsI6GBoCoSwUCo0DEXwz53n/r887EXhK8RgAASC5gYMhj7Sp/rrwHh3gZpABiQ4NxhY4GCwWClRba///+sX4qP//////////5KM6JDgCFAXKZRiT//////9lVCARFIAAgQWiVd8pgRHvKzjWqx54R0AACCmxi0l7Fg4AEQNkXOou31FEhwyolENuAYAKBgfAMBiSGWB2CGcBikAKCwQgscEIBTRPQyiPs6n///j+Vf/a613qb6m//6/+/7/+1jEMIAOqUsx4PLM0aMpZfQeybKv0mUmUAHgeDYDdMwV/+v//Z/k+u2iSIAEBGUAUtdFmW7lXG1ennlT6MKBnN7AMHgkVUHAGWLKquW//v//8vyF+mBIelgEhUTTAiVjNy/TAYVAqCpbhXCo2KItSfn/6v//+sVlFv///V1et0q/Vf9T/1fnWZIugCiFVPrLChbZQgAQIZBJzedC8YHzOkjbWC65h5gHmCWAg4iYAQAiPLM8E+3WWCVIELiENBwCwJBIAxQgVA70iaAGLOAoEwA4BYXTD2BIxyUPSZO39H/rGqW////r1f/9f///ztaiVBoCkZVBA+j///6tf//+oCepBtNBBBqZfMysZEaRwp4ZwEIIwikYDASOMCgEgvr/+1jERwFN0UkvoPLOkcUpZIlgT8gFAlAsFoVElzV6dukRETsGJQCABgEgUAABuBgPEwBhYgyBwKoYBhyFCBgFBgBEA4bGCIBIFgDA4Eg3km13///xnRi//9E+s0IOBsqCuyIGA+zFBSbkABALsAH//cqn26aV1pRTvPAT+PjA/d5WaZ2QCKRlyBa3o+yttrPfwxz3nrDPW6le8/bEC0ZhsNRz8WoCHgOAdYjsQ3DEi7h+/fDJfFTc7Pin2/QroZVf/+yTj7ZL4ZLH2yX2yae7e37t///1dQKAW1Z0CAEwBP/irqDZdoPyL60CYAd9MAwlE83RCwHBGj2FAFXZX1963hlzHLLGtGXKUCQxBoEGBgbmL7xH9MamN4dGBQCu8+r/+1jEXIAOfUU5rq26kcWopZxuyiLLmWqjv3su8oqUur/U6+7iuCZL//3////////zm5gBGhkEwcZ/////9RD/+hXoobJhKtX7MzEH3ZgKgBgwCowGyPTGpDmMB8B8wAwATAmAHGgXGryC3jnzH//68MOXAjMwQAMYCYE5giA+GIKaacUaaAHD0mBkwaAYjDoGCwWBgYAADAMCQdJA/qb///xICS///////////dlydANAIOCp9Mji8igAUbypaWVQyyJEEGgOGBkQeZLQaRgHACsCMBwBIMBRbaK2qXL+d/eq0ArSR5AAAZgFgFGBAA+YK4LxiZFLnNAXQYpwJ5gngCDQDCBAKAAhUAAuhFe87x0UkXUtXZf/SDqK////////+1jEbwJO7U0gAPqtQcmopBwPTbH////LLVFkClxPqskOtOEAABAUMc4aeZl3cq42pM56tBMA0YNQHpnxADAYIAEAGFgChCa8UzW3/7/v8wl7yNOSOIQDwQBgYC4SJg/H/GnwnyBpZOAYnG4GEAsAECAFAeA0AAWEQw2Vrt///UHeHj//////6vv//+YrzYUCMM4S////qBa8BgQgCCZ67EMDJWJRJJQCQSASCQIgk1CkK7SC+5gIBoGJwCWCgDFAC0SF85nzLLHWWWOG5qOw015aqBwGAxMH8IA01QiQgRooAwRHZG2RusN5f/+xyuyoqIex7H/2BgNP///////////QSib////61QChGAAAENQLIRpyyuqFWmYKbCncOA3/+1jEf4AO2UMhoPqtQcYopajPKiKYBwIZymKIwKY4GBuNCU3sispI79y0NITqFroFQFA0BWDQPwALhQMI8cAFxEgIBUAKAkLKwWAAFxwYAoeXXqv///l4VX/9////9X9b//+p+Oo0f/////rAQQIABR00IyQgkw1rtzKdizqrWAQBJgricGaiCiPAziEAcCgPgoBZ2abHLeX//53ILbI3FS0oAKEgNDBPAHMRwHo5xBhQOcBoDKYHAw0CABAIA8AggAAfEuvU3///H2MT//////////9LyPNav///+pUQPgmPG8Bl2HHfWIW3MBQBowhRjTSVDOMFUCEwDwGzAiA5MBgABncYt0lf9a/m6sPLFLtGAGAQYAAD5gEglGBAGGb/+1jEkIANqUMjoPbOgcQopBwfVagRKkRrwsSga1ZAGFiGCQODMASDQDARBYfipGl67f//1iKi2///////////21C/Pt6xqqxVKMK3AaWAmfpuDIBYgA+MBE0ExORWDAHArAQB5giABlASiroRTXv5r+c7NvAzNsDHwEAoYFoDpg3A0GMGU2eWKRgHm0GBngaAY1EoGDwqBgYGACgcA4KkEWgtl///9YdUiP//////////6epydJdCB5tCQAACA1aPcp5Ep1iDS00thpcoJAEMDAWsyIAYhIC1RowBABg4CF3qW1jll//rWUpdpiKEkEgAGAEAqYDYKBhAFDmqcVUYUAJpgNgGK5dpQVMZICQ/z/T///wMv///p/X6/////1//+1jEpoNOLUUaIPqvAc4oYwA/VeEKh7///9f1f/f/Xu5uig9miSYsAoYFYBJhwBhG1gB2YQwERgJAZGAaC4DQFWMQDQVdU+88cr0oa2sRz03DADAbMCQEQwbw0TFgR4O6BxEDwjgAz2XQMcDQDDgcAwuCwMIAgAohCfzy2ZL///x0kn///////////fMAwcNAXOfrdVgiIAACAzQJEbqQYS4Keq8QdNVQKg0w5eDxSPMIAguQBhELCeEW8D7VutSlk0OSK2D5gshACAMBgiBSBiHKYB1dMKBilA0AoEUNjE9iEQfqKXNl9////WW/+//////////8i5Lf///rD/Z/1O8nLt7msAAgR6i2ZTU7OUcIq0zEm4plCAGzB2Bjakz/+1jEuYNOVUEh4PlPQdGoYkAPVahTAMBmmmDoBiwlNrPXu8t7//zzpJG/LISQABCDZgMLhifWp5DwAHVzgY44Bgw4N3hbwG/gsFIRbWXp///zhL/X/T+mv//6TatX///6xFWp/7fp1cr7/+p3to+mACi/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",
      uiStar: "data:audio/mpeg;base64,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9bVeZf5NL7itzvIJTABwAIwA8AKMAUANzACQEYwDQC1MDdDfDTozZowmEFGMBeAMTAEQBowgTZWMpM6gGBLaZ04bTYdicmgaGrWu6tUV2GZXG8aPWL8vTlOZRHUqmr8dxy+km6Ccp8ZTzVvdWPU1HG7eOVjW7tWWUF3IWDhWJmKhYPFQcEoierHHKQF/IgKxf5n+jf6X/qFyIXoF0IahmilC49R///mMIdoLohfiUA0E0KVAJgawGh38wfn//+hASN//ypANmu3v////5Tx+kuz/+1jE7gHToiLwrxi3AZE1XqGPChJr0RgcAKYBgDpgEgbGAkDCYHocxhSH6nqxRCZMArJg5g4GAAAqDgAgMBaYEoCAcBtUa0CQNISYlLJkuFSImj6pMtsmIJKkpC6SyzuISXpN4KXlCqT6XZbuoy9kvIrdca2ISH8RMODpS/1L8O/jB/+JH1ExdqAwK///wGP////QGDwt//6Cgn8KDH//+AS///qLkoAAKWMqr3pVXlsqlcOxGIQMuVpCYSyxIBUwHwEDAjBCCgLpgLAvGASEaYeaCht5viGwCWEYHwZJghAAGBoBaYEYFxgNAjmBQAC8DfMNfRg0NROBYalaAASM8hUaVq4pE1asiKkudYlSatChQsqyWJpoWatDKW37pEv/+1jE8oOZ+hTfD+VTQnBC20HklqAQsy31506OgtElk/6c1Dl9jnN/NY6o1PBaLR4fB6UJf746RQbEh0iIxhxv///uarf/6OPAuB0/YbFCX/VvNU05///joLQclgAgq3Ldmmq1K9ymnHXW4LCMwzLYQfFODjEd1TA5pmSRnF5jYRJJMFAAEAAsRAqBKUwxgyIsMGEwtC1IlYJaa6Ght64zsvtAUFwxF5NPBIMJEiCaC0SRpxx8XlScWXDEoiVIlUGrpV/6f/ldTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1jEwgBYAhjKzyT2waqST9WNGhlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=",
      uiRow: "data:audio/mpeg;base64,SUQzBAAAAAAAW1RFTkMAAAAVAAADU291bmQgR3JpbmRlciA0LjQuMQBUQ09QAAAADwAAA0FsYW4gTWNLaW5uZXkAVFNTRQAAAA8AAANMYXZmNjIuMTIuMTAwAAAAAAAAAAAAAAD/+1jAAAAAAAAAAAAAAAAAAAAAAABJbmZvAAAADwAAAAMAAASAAICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP///////////////////////////////////////////wAAAABMYXZjNjIuMjgAAAAAAAAAAAAAAAAkBSAAAAAAAAAEgBfTdCoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+1jEAAAOiRtP9IWAAiO4br8w0AJQhAAAAAAAACkf+vnSpLDsG4flAoAHADADAnLwSABAEB8UHYOwdg7DSthubv4Yxlf////+9jGU83Nz9m5ubm5uffcPe973v0B3m9sNDRlPZUvfDGSaGjGf/////sYykx2GlJm58+Iz/D//8uH/+Qhj////BCIdmUiMAESMiNuJAAFKQSALCd10W8q7rJOabt+3hbbN+NP0E3CrEgTSs2FYvF8kVGpYTVAtgyycPBAkXPGxedIvHnLCcUHSNlHUFpJObS4O0fEVJWpK9H/dK1iXT/1rb/9TXWdHpU36TmYvH1f9BNS/Zk66lqTSZO69T/f6///01f1fy+pxJP6FKhN/wAAFWwFX9fKqrML/+1jEBoEP4idFvIiAAg/E4qBctaDeSCkBUBUpACwLKhxHRzSdRKJAiLEWJ5J2LxtWgXkjYxNUC6i3qLyi8bGJdNTI2V9WpFFFH3rapJJJL1o/1Ja0nUkkklb6kvWiijScvECIMovkVNUVIooqMUF//////1N/1UldaWj7N////////Wj6KJ6CE4JfqXMowLehm5aUQKnM+hA48CQqW5SrCm3Zy1Tbw/GJRbaNEyUtkn9T+palJUS6g6KP1t113/rZKl6qnMR7JnC8s1qSQek5kXlqUmgPYzNVGw4RikoFuAAmBGiVCpArw8jEnFMepOHkXnUjS//////+v/////////9KkpLotzIvJFt8bv6uTYJApAKBSAUKTCRSaJ2zct//+1jECoPNWhzgAyBZCAAANIAAAATJWkXRJFwuTjS42W//8x00z/800WsXXxE1fax+sWsXPP2sWv//szmlObBxLrTSqB8CkMiIIy8wPFRo45UUEdlYysb////////////////6yocqOUNKSUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU="
    }
  };

  /* ===================================================================
     6. GAME — STRATIDECK
     A camp of face-down enemy cards on a grid, and the player's own army
     dealt four at a time under it. A card is dragged (or tapped, then the
     cell tapped) onto an enemy the player can REACH — the bottom row at
     first, then whatever stands next to a cell already emptied, so the camp
     is opened corridor by corridor.

     EVERY CARD IS TWO NUMBERS, AND THEY ARE READ IN THAT ORDER: the GRADE,
     1 to 12, and the TIER, E D C B A S. The grade is what a fight is decided
     on; the tier is what decides it when two grades are equal, and what says
     who limps away when they are not. A draw is now only possible between
     two cards that match on BOTH — a Captain B against a Captain B — which
     is what makes the tier the second half of the guess the player is making
     about a face-down card.

     A FIGHT LEAVES A MARK. The winner is the higher grade, then the higher
     tier; and the tier GAP decides what the fight cost:

       the loser's tier is higher   the winner is WOUNDED — it takes the
                                    cell, sits out a turn, and goes to the
                                    infirmary when the battle is over
       the winner's tier is higher  the loser is WOUNDED rather than
                                    destroyed: an enemy left standing is one
                                    the player may take PRISONER at the end
       the two tiers are equal      a clean fight, and nothing is owed

     Three specials still bend the rule the way Stratego does, and all three
     are blind to the tier — the SPY kills the Marshal, the SAPPER is the only
     card that clears a TRAP, and the SCOUT does not fight at all: it reveals
     the card it is sent at and comes back.

     EVERY OTHER GRADE HAS AN OBJECT OF ITS OWN TO BREAK. A camp is also built
     of six OBJECTS — a straw man, a fence, a rock, a forest, a skull and a
     book — which never fight: each does one thing to whoever strikes it,
     except to the ONE grade that breaks it (OBJECTS, below). So a Sergeant
     is not merely a weaker Captain: it is the card that tears the straw man
     down, and the macaron in its corner says so. Only the Marshal has none —
     it is the highest grade, and that is its whole particularity.

     A card that wins returns to the bottom of the deck; a card that loses is
     gone; a card that wins WOUNDED stays in its hand slot, greyed, for one
     turn. After every card sent, THE CAMP ANSWERS: it may slide one soldier
     one cell into the emptied corridor, or pass — the flag and the traps
     never move, some soldiers never do on purpose, and a card that has moved
     stays tilted for the rest of the battle (THE ENEMY'S TURN, below). The
     enemy FLAG, once found, ends the battle in a capture. The camp
     grows with the level, and a level's camp is always the same, so a second
     try is played with what the first one learned.

     WHERE THE ARMY COMES FROM. A playable and an endless run generate their
     own deck, exactly as they always did. A web build with a BARRACKS
     (packages/webshell/army.js, `web.army` in the manifest) hands the player's
     own cards over in `CONFIG.army` before the round, and the battle reports
     back what it cost: which of them were wounded, and which enemies were
     left standing to be taken prisoner. The motor knows none of it — it
     travels on `endRound`'s result like the game's own stat rows.
     =================================================================== */
  var Game = (function () {
    var P = CONFIG.play;

    /* --- the grades -----------------------------------------------------
       EVERY GRADE HAS A PAINTED FACE AND IT HAS TWO OF THEM: the blue one is
       the player's army, the red one the camp's — the same officer on both
       sides of the same war, which is what makes a card taken prisoner
       obviously the card that was just fighting back. They come off
       assets/image/master/stratideck-card-<side>-<name>.png, so there is
       nothing in the manifest to wire: a file name is the whole declaration
       (CLAUDE.md, The painted artwork).

       `art` is the cut of the object sheet that was there before them, kept as
       the fallback for a build with no artwork on disk, and 11 and 12 — the
       two enemy-only cards — have nothing else.

       13 to 18 are OBJECTS too, like the flag and the trap: cards with no
       grade and no tier, which the camp deals from the level its kind is
       unlocked at (OBJECTS, below). */
    var RANKS = {
      1:  { name: "Spy",        art: "piece08", blue: "cardBlueSpy",        red: "cardRedSpy" },
      2:  { name: "Scout",      art: "piece07", blue: "cardBlueScout",      red: "cardRedScout" },
      3:  { name: "Sapper",     art: "piece09", blue: "cardBlueSapper",     red: "cardRedSapper" },
      4:  { name: "Sergeant",                   blue: "cardBlueSergeant",   red: "cardRedSergeant" },
      5:  { name: "Lieutenant",                 blue: "cardBlueLieutenant", red: "cardRedLieutenant" },
      6:  { name: "Captain",                    blue: "cardBlueCaptain",    red: "cardRedCaptain" },
      7:  { name: "Major",                      blue: "cardBlueMajor",      red: "cardRedMajor" },
      8:  { name: "Colonel",                    blue: "cardBlueColonel",    red: "cardRedColonel" },
      9:  { name: "General",    art: "piece06", blue: "cardBlueGeneral",    red: "cardRedGeneral" },
      10: { name: "Marshal",    art: "piece05", blue: "cardBlueMarshal",    red: "cardRedMarshal" },
      11: { name: "Trap",       art: "piece04" },
      12: { name: "Flag",       art: "piece03" },
      13: { name: "Straw man",    art: "itemStraw" },
      14: { name: "Wooden fence", art: "itemFence" },
      15: { name: "Rock",         art: "itemRock" },
      16: { name: "Forest",       art: "itemForest" },
      17: { name: "Skull",        art: "itemSkull" },
      18: { name: "Book",         art: "itemBook" }
    };
    var SPY = 1, SCOUT = 2, SAPPER = 3, GENERAL = 9, MARSHAL = 10, TRAP = 11, FLAG = 12;
    var STRAW = 13, FENCE = 14, ROCK = 15, FOREST = 16, SKULL = 17, BOOK = 18;
    var CREST = { blue: "piece01", red: "piece02" };

    /* --- the objects ------------------------------------------------------
       WHAT A CAMP IS BUILT OF, AND THE ONE GRADE EACH OF THEM ANSWERS TO.
       An object never fights and never moves. Struck by its `breaker` it is
       destroyed and the card goes back to the deck like any winner; struck
       by anything else it does its `effect` and stays where it stands:

         decoy   the card goes back to the bottom of the deck
         block   the card goes back to its hand slot — the turn was spent
         stray   the card is out of this battle: neither wounded nor dead,
                 it simply never finds its way back before the end
         stun    the card goes back to its slot and never leaves it again
                 this battle — a slot of the hand taken for good
         spell   the card turns round and strikes one of its own hand, and
                 that fight is a real one: it wins, loses, wounds or is
                 wounded exactly as against the camp

       `unlock` is the first level of the climb that deals it, so the three
       that only cost a turn arrive before the three that cost a card. The
       playable and the endless run deal the first three only. `hit` is the
       callout when it acts, `lesson` the one line that names its breaker —
       said the first time that kind acts in a battle — and `broken` the
       callout when its breaker takes it down. */
    var OBJECTS = {
      13: { breaker: 4, effect: "decoy", unlock: 1,  hit: "Straw man!", broken: "Straw man torn",
            lesson: "Only a sergeant is too naive to fall for it" },
      14: { breaker: 5, effect: "block", unlock: 1,  hit: "Fence!", broken: "Fence chopped",
            lesson: "Only a lieutenant carries an axe" },
      15: { breaker: 6, effect: "block", unlock: 4,  hit: "Rock!", broken: "Rock smashed",
            lesson: "Only a captain carries a pickaxe" },
      16: { breaker: 7, effect: "stray", unlock: 8,  hit: "Lost in the forest", broken: "Forest crossed",
            lesson: "Only a major finds his way through" },
      17: { breaker: 8, effect: "stun",  unlock: 13, hit: "Stunned!", broken: "Skull shattered",
            lesson: "Only a colonel is not afraid of it" },
      18: { breaker: 9, effect: "spell", unlock: 18, hit: "Bewitched!", broken: "Book burnt",
            lesson: "Only a general can never turn traitor" }
    };
    /* the three that cost a card never stand on the front row: a first turn
       that loses a card for the battle is a first turn nobody played */
    var HARMLESS = { decoy: true, block: true };
    function isObject(r) { return !!OBJECTS[r]; }

    /* WHAT THE BACK OF AN OBJECT SAYS: what it does to whoever strikes it,
       and `by`, the one grade that destroys it (0 for the flag, which any
       card takes). Every object card turns over to this — in the round's
       lists and in the barracks' OBJECTS tab (packages/webshell/army.js,
       openFile) — so the rule is read where the card is, rather than learnt
       by losing a card to it. The trap and the flag are objects here too. */
    var ABOUT = {
      11: { by: SAPPER, text: "A mine hidden among the soldiers. Any card that strikes it is lost with it." },
      12: { by: 0, text: "The enemy's standard. Capture it and the battle is won on the spot, whatever still stands in the camp." },
      13: { by: 4, text: "A decoy dressed as a soldier. A card that strikes it is fooled and goes back to the bottom of the deck." },
      14: { by: 5, text: "A wall of stakes. A card that strikes it goes back to its place in the hand: the turn is wasted." },
      15: { by: 6, text: "A boulder in the way. A card that strikes it goes back to its place in the hand: the turn is wasted." },
      16: { by: 7, text: "A card that walks into it gets lost: out of the battle until the end, neither wounded nor dead." },
      17: { by: 8, text: "A card that strikes it is frozen with fear: it goes back to its place in the hand and never leaves it again this battle." },
      18: { by: 9, text: "A card that opens it is bewitched: it turns round and strikes a card of its own hand." }
    };
    /* The barracks' door into it: the text in the player's language and the
       breaker's grade, which the shell names in its own words. */
    function objectInfo(r) {
      var a = ABOUT[r];
      return a ? { text: Lang.t(a.text), by: a.by } : null;
    }

    /* WHAT THE BACK OF AN OFFICER SAYS ABOUT THEIR GRADE: the one thing that
       makes it useful, which the macaron on the face only draws — the three
       specials' rule, the object each of the next six breaks, the crown. It
       is the grade's and not the officer's, so it is read on every card of
       that grade, a stranger's or a turncoat's included (army.js, fileBack). */
    var SKILL = {
      1:  "Kills the marshal, whatever its tier. Against any other card it is the weakest of all.",
      2:  "Does not fight a hidden card: reveals it and goes back to the bottom of the deck.",
      3:  "The only grade that clears a trap without being lost with it.",
      4:  "The only grade that tears down the straw man.",
      5:  "The only grade that chops down the wooden fence.",
      6:  "The only grade that smashes the rock.",
      7:  "The only grade that crosses the forest without getting lost.",
      8:  "The only grade that shatters the skull without being stunned.",
      9:  "The only grade that burns the book without being bewitched.",
      10: "The highest grade: no soldier outranks it, but the spy kills it."
    };
    function gradeInfo(r) {
      return SKILL[r] ? Lang.t(SKILL[r]) : "";
    }

    /* --- the macaron ------------------------------------------------------
       EVERY GRADE WEARS WHAT MAKES IT USEFUL, in a round macaron in the
       bottom-left corner of the army's cards: the ability of the three
       specials, the object each of the next six breaks, the crown of the one
       that outranks everything. Lucide pictograms (assets/motor/lucide/, the
       file named on each line), inlined as DOM SVG because a card face is
       DOM: the stroke is the stylesheet's, so it follows the card. */
    var PERK = {
      1:  '<path d="m11 19-6-6"/><path d="m5 21-2-2"/><path d="m8 16-4 4"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/>',   // sword
      2:  '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',   // eye
      3:  '<circle cx="11" cy="13" r="9"/><path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95"/><path d="m22 2-1.5 1.5"/>',   // bomb
      4:  '<path d="m2 22 10-10"/><path d="m16 8-1.17 1.17"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="m8 8-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97"/><path d="M10.91 5.26c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="m16 16-.53.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.49 3.49 0 0 1 1.97-.98"/><path d="M18.74 13.09c.26-.15.51-.34.73-.56L21 11l-1.53-1.53a3.5 3.5 0 0 0-4.62-.28"/><path d="m2 2 20 20"/>',   // wheat-off
      5:  '<path d="m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9"/><path d="M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z"/>',   // axe
      6:  '<path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999"/><path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024"/><path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"/><path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"/>',   // pickaxe
      7:  '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',   // compass
      8:  '<path d="M12.035 17.012a3 3 0 0 0-3-3l-.311-.002a.72.72 0 0 1-.505-1.229l1.195-1.195A2 2 0 0 1 10.828 11H12a2 2 0 0 0 0-4H9.243a3 3 0 0 0-2.122.879l-2.707 2.707A4.83 4.83 0 0 0 3 14a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0"/><path d="M13.888 9.662A2 2 0 0 0 17 8V5A2 2 0 1 0 13 5"/><path d="M9 5A2 2 0 1 0 5 5V10"/><path d="M9 7V4A2 2 0 1 1 13 4V7.268"/>',   // hand-fist
      9:  '<path d="M18 6V4a2 2 0 1 0-4 0v2"/><path d="M20 15v6a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10"/><rect x="12" y="6" width="8" height="5" rx="1"/>',   // book-lock
      10: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>'   // crown
    };

    /* --- the tiers --------------------------------------------------------
       SIX STEPS AND SIX FAMILIES: E is basic, D common, C uncommon, B rare,
       A epic, S legendary — the ladder the collection is read on
       (packages/webshell/meta.css), with one step added under it so that the
       card a conscript comes with is visibly the bottom of the pile. That
       step is BRONZE and not a darker grey: two greys side by side on a
       grid read as one colour, and E against D is a call the player makes
       every turn.

       THE COLOURS ARE NOT THE SKIN'S. Grey to gold is a ladder the player
       reads as a ladder, and a game whose accent happened to be gold would
       flatten epic against legendary. Same reasoning as `Pop.text`: the
       colour is data and the rest is style. */
    var TIERS = ["E", "D", "C", "B", "A", "S"];
    var TIER_COLOR = ["#c8773f", "#aab1c6", "#51cf66", "#4dabf7", "#c77dff", "#ffd43b"];
    var TOP_TIER = TIERS.length - 1;

    /* --- what a fight pays ------------------------------------------------
       A kill pays by the grade it took down, times how TIGHT the card was: the
       tightest card that could do it (the same grade won on tier, one grade
       above, the spy on the marshal, the sapper on a trap) pays double, two
       grades above pays even, and an OVERKILL — three or more — pays half.
       That margin is the whole economy of the game: a marshal thrown blind at
       the camp wins almost every fight and earns almost nothing, so a reveal
       is worth points on its own. The bench said so in one run — a pilot that
       only ever played its biggest card out-scored a careful one four to one
       on a flat payout.

       THE TIER IS THE SECOND FACTOR, and it points the other way: a card that
       beat something better equipped than itself is worth more than one that
       walked over a conscript. A streak of wins multiplies all of it, gently. */
    var KILL = 10, TIE = 10, TRAP_CLEAR = 120, SCOUT_PAY = 15, OBJECT_PAY = 100;
    /* THE FLAG PAYS FOR THE CAMP THAT WAS BEATEN, NOT FOR THE CAMP THAT WAS
       SKIPPED. It used to be `ROUTED * (foesLeft - 1)` — a rout bonus — and on
       a small camp that read as a coup. On the big camps the climb now builds
       it was the whole score and it pointed the wrong way: a battle that
       tunnelled straight up one column to the top row and took the flag with
       twenty-six enemies still standing paid MORE than one that fought through
       them, and a deeper camp was free points rather than a longer fight. The
       bench said so in one run — a careful pilot took every level in ten to
       twenty turns of a thirty-six cell camp and won 100% of them.

       So the flag is a capture bonus over what the battle actually did, and
       finding it early is now what it should always have been: the risk that
       ends a good run. The scout is the answer to it — reading the top row
       before walking into it is what that card is for. */
    var FLAG_PAY = 260, ROUTED = 34, SURVIVOR = 30, STREAK_STEP = 0.2, STREAK_CAP = 2;
    var TIER_STEP = 0.22, TIER_MIN = 0.7, TIER_MAX = 1.9;
    /* THE STARS ARE THREE OBJECTIVES (`tally`), AND THE SCORE ECHOES THEM:
       the flag already paid for the camp that was beaten, so a capture and a
       battle without a wound now pay too — the score is what the wallet and
       the ranking read, and it should rise with the same things the stars
       do rather than beside them. */
    var CAPTIVE_PAY = 80;                       // per enemy left standing to be taken
    var UNSCATHED = 200;                        // a battle won without a wound

    /* --- colours ----------------------------------------------------------- */
    var GOLD = "#f2c14e", BLUE = "#5aa9ff", RED = "#ff5c5c", INK = "#f6f1e4";

    /* --- geometry (design px), rebuilt by geometry() ---------------------- */
    var G = {};
    var HAND_W = 118, HAND_H = 165, HAND_GAP = 10;   // the size is geometry()'s

    /* --- state --------------------------------------------------------------- */
    var grid, cols, rows, deck, hand, handSize;
    var score, streak, bestStreak, kills, ties, losses, precise, scouted, trapsCleared;
    var reach, targets, selected, drag, turn, refills, mood, lastFoe, lastWon;
    var levelD, ended, outcome, tAnim, seed, BAND, flagCell, flagTaken;
    /* THE CAMP IS PLAYED FROM MEMORY. Only the last enemy turned over stays
       face up (`lastFoe`); the one before it turns back down the moment a new
       one is revealed, and `hiding` is that card on its way over. */
    var hiding;
    /* THE ENEMY'S REPLY: after every turn the camp may slide one of its
       soldiers one cell, or pass. `march` is that move while it plays. */
    var march;
    /* THE BATTLE'S OWN LEDGER, and the only thing that leaves the round: the
       ids of the player's cards that were wounded, and the enemies left
       standing. Both are empty and inert for a playable. */
    var wounded, captives, roster, met;
    /* every card of the barracks played this battle, by id: each is a
       service, and a won battle may promote it (packages/webshell/army.js) */
    var used = {};
    /* WHAT THE ROUND KEEPS TO SHOW, in the order it happened: the player's
       cards wounded (the infirmary icon), the enemies beaten (the pile in the
       top-right corner) — the captives are `captives` above (the prison). */
    var hurtCards, fallen, sheet;
    /* THE ARMY AS IT MARCHED IN, and the cards of it that fell: a tap on the
       deck pile shows the one split in two by the other. */
    var army0, lostCards, refused, prisonWarned;
    /* THE OBJECTS' SHARE OF IT: the cards a forest swallowed (out of the
       battle, neither dead nor wounded), how many objects were broken, and
       which kinds have already told the player who breaks them. */
    var strayed, smashed, taught;
    /* THE CAMP AS IT WAS DEALT, counted by grade: what the commander tells the
       player when asked (a tap on him). Grades and counts only — no tier, no
       place — so it is the start of a deduction and not the answer. */
    var muster;

    /* --- the level ------------------------------------------------------------
       The web target's level layer hands `d` (0 at the foot of the climb, 1
       at the top) before the round starts, and null for an endless run. The
       objective is the same number the map writes on its card — one lerp
       over web.levels.objective. A playable never gets the call and plays to
       its own goal. */
    function applyLevel(d) { levelD = (d == null) ? null : d; }
    function bandFor() {
      var b = CONFIG.bands;
      if (!CONFIG.level) return b[0];
      return b[clamp(Math.floor((CONFIG.level - 1) / 6), 0, b.length - 1)];
    }

    /* A tiny LCG for what has to be the same every time a level is opened:
       the camp and, where the game generates one, the deck. A level is a
       puzzle the player learns, so it is seeded by the level number; the
       playable and the endless run draw from Rand instead. */
    function lcg() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    function draw() { return CONFIG.level ? lcg() : Math.random(); }
    function drawInt(n) { return Math.min(n - 1, Math.floor(draw() * n)); }
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(draw() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    /* --- helpers ------------------------------------------------------------- */
    function font(size, weight) {
      return (weight || 900) + " " + Math.round(size) + "px -apple-system,Segoe UI,Roboto,sans-serif";
    }
    function roundRect(g, x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    }
    function ease(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }
    function art(key) {
      var img = ArtImages[key];
      return img && img.complete && img.naturalWidth ? img : null;
    }
    function rankName(r) { return RANKS[r].name; }
    function tierName(t) { return TIERS[clamp(t | 0, 0, TOP_TIER)]; }
    /* The one place a card is named in full, so the callouts, the readout and
       the end screen cannot disagree: MAJOR·B. The grade is translated and the
       tier is a letter, which is the same letter in every language. */
    /* WHO A CARD IS, in what the round says: the officer's own name — "Sara
       Colt", not "Scout·C" — out of the barracks' cast, where the web shell
       has one. `side` is the army the card stands in ("red" for the camp);
       a turncoat is named as the officer they were raised. An object, and a
       build with no barracks (a playable), keep the grade and the tier. */
    function cardName(card, side) {
      var AR = window.__ARMY__;
      if (AR && AR.who && card.rank <= MARSHAL) {
        return AR.who(side === "red" ? "red" : (card.o || "blue"), card.rank, card.base != null ? card.base : card.tier);
      }
      return Lang.t(rankName(card.rank)) + "·" + tierName(card.tier);
    }
    /* `o` is the army the officer was RAISED in, when it is not the one they
       fight for: "red" on a prisoner who turned (packages/webshell/army.js).
       It changes the face and nothing else — a turncoat is a card of the
       player's army in every rule of the round. `base` is the tier the
       officer was RAISED at, on a card the barracks has promoted since: the
       portrait and the name are read there, every rule and the frame at
       `tier`. */
    function card(rank, tier, id, o, base) {
      var c = { rank: rank, tier: clamp(tier | 0, 0, TOP_TIER), id: id || null, hurt: 0 };
      if (o) c.o = o;
      if (base != null && (base | 0) !== c.tier) c.base = clamp(base | 0, 0, TOP_TIER);
      return c;
    }

    /* ===================================================================
       THE CAMP AND THE ARMY
       =================================================================== */

    /* A weighted grade for a soldier: a pyramid over 2..10 (an enemy never
       needs a spy — it never attacks) leaned by `bias`, positive toward the
       high grades. A generated army comes off the same table. */
    function soldierRank(bias, min) {
      var w = { 2: 1.4, 3: 2.0, 4: 2.6, 5: 2.6, 6: 2.1, 7: 1.5, 8: 1.0, 9: 0.35, 10: 0.15 };
      var total = 0, r, x;
      for (r = min; r <= 10; r++) total += w[r] * Math.exp(bias * (r - 5) / 3);
      x = draw() * total;
      for (r = min; r <= 10; r++) {
        x -= w[r] * Math.exp(bias * (r - 5) / 3);
        if (x <= 0) return r;
      }
      return min;
    }

    /* AND A TIER FOR IT, off the same shape of table. `lvl` is 0 at the foot
       of the ladder — a camp of E and D — and 1 at the top, where S is
       ordinary. It is what the climb moves (web.levels.tune), and it is the
       second axis of a level's difficulty: level 30 is not merely a bigger
       camp, it is a better equipped one. */
    function soldierTier(lvl) {
      var w = [3.2, 3.0, 2.2, 1.3, 0.55, 0.18], bias = -1.1 + 3.4 * clamp(lvl, 0, 1);
      var total = 0, i, x;
      for (i = 0; i <= TOP_TIER; i++) total += w[i] * Math.exp(bias * (i - 2) / 2);
      x = draw() * total;
      for (i = 0; i <= TOP_TIER; i++) {
        x -= w[i] * Math.exp(bias * (i - 2) / 2);
        if (x <= 0) return i;
      }
      return 0;
    }

    /* THE CAMP IS A FORMATION, AND THE CLIMB DEALS A DIFFERENT ONE EVERY
       LEVEL. A battle is two games at once — reading where the flag is and
       remembering what was turned over — and a flag that always sat on the
       back row, usually in a corner, answered the first before the round
       began. So each formation says three things: where the flag may stand,
       which cells the strongest grades are dealt to, and where a trap goes
       first.

         keep    the flag in the middle of the back row, the officers around it
         wall    the flag anywhere at the back, the best grades on the FRONT —
                 the camp is a wall to break before it is a puzzle
         flank   the flag down one side, the guard around it
         deep    the flag in the middle of the camp with privates round it, and
                 the officers on the back row, where a flag is expected
         decoy   a trap (or an officer) in a back corner, guarded like a flag,
                 and the real one somewhere else in the back half

       Never on the front row, because a flag struck on the first turn is a
       battle nobody played. A level cycles `(L - 1) * 3 mod 5` — level 1 is
       the keep, the camp a player expects — so two levels in a row never
       share a formation, and everything inside one is drawn off the
       level's seed: a second try is the same camp, a new level is not. */
    var FORMATIONS = ["keep", "wall", "flank", "deep", "decoy"];

    function formationFor() {
      if (!CONFIG.level) return FORMATIONS[drawInt(FORMATIONS.length)];
      return FORMATIONS[(((CONFIG.level | 0) - 1) * 3) % FORMATIONS.length];
    }
    function dist(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c); }
    function pickCell(list) { return list[drawInt(list.length)]; }

    /* The cells a flag may stand on, per formation. `back` is the deepest row
       the flag is allowed on: the back row alone on a three-row camp's first
       formations, down to one row above the front on a big one. */
    function flagCells(form) {
      var out = [], r, c, back = rows - 2, half = Math.max(0, Math.floor((rows - 1) / 2));
      for (r = 0; r <= back; r++) for (c = 0; c < cols; c++) {
        var side = c === 0 || c === cols - 1, top = r === 0;
        if (form === "keep"  && top && !side) out.push({ r: r, c: c });
        if (form === "wall"  && top) out.push({ r: r, c: c });
        if (form === "flank" && side && r <= Math.max(1, half) && !(top && rows >= 4)) out.push({ r: r, c: c });
        if (form === "deep"  && r >= 1 && r <= back) out.push({ r: r, c: c });
        if (form === "decoy" && r <= Math.max(1, half) && !(top && side)) out.push({ r: r, c: c });
      }
      return out.length ? out : [{ r: 0, c: drawInt(cols) }];
    }

    /* How much a cell deserves a strong grade: the highest-scoring cells get
       the best cards. The noise is in cells, so a formation is a tendency the
       player learns to read and not a template they can recite. */
    function cellWeight(form, q, decoy) {
      var noise = draw() * 1.6;
      if (form === "wall")  return q.r + noise;
      if (form === "deep")  return -q.r - (dist(q, flagCell) <= 1 ? 2.5 : 0) + noise;
      if (form === "decoy") return -dist(q, decoy) + noise;
      return -dist(q, flagCell) + noise;                      // keep, flank
    }

    /* The camp: `known` is what the player has ever seen of a cell; a
       defeated cell is null.

       THE FLAG AND THE TRAPS CARRY A TIER TOO, and it is the camp's best:
       neither of them ever fights on it — the flag is taken by anything and a
       trap answers only to a sapper — but a card the player turns over must
       never be a card with no tier on its face. */
    function buildGrid() {
      var r, c, cells = [], i;
      var lvl = clamp(P.enemyTier == null ? 0.15 : P.enemyTier, 0, 1);
      grid = [];
      for (r = 0; r < rows; r++) {
        grid.push([]);
        for (c = 0; c < cols; c++) { grid[r].push(null); cells.push({ r: r, c: c }); }
      }
      var form = formationFor();
      flagCell = pickCell(flagCells(form));
      grid[flagCell.r][flagCell.c] = card(FLAG, TOP_TIER);

      // the decoy: a back corner the flag is not standing in
      var decoy = { r: 0, c: flagCell.c < cols / 2 ? cols - 1 : 0 };

      // the traps: the decoy's corner first, then round the flag, then anywhere
      var traps = P.traps | 0, placed = 0, q;
      var first = [];
      if (form === "decoy") first.push(decoy);
      var around = shuffle([
        { r: flagCell.r - 1, c: flagCell.c }, { r: flagCell.r + 1, c: flagCell.c },
        { r: flagCell.r, c: flagCell.c - 1 }, { r: flagCell.r, c: flagCell.c + 1 }
      ]);
      first = first.concat(around);
      for (i = 0; i < first.length && placed < traps; i++) {
        q = first[i];
        if (q.r < 0 || q.r >= rows - 1 || q.c < 0 || q.c >= cols || grid[q.r][q.c]) continue;
        grid[q.r][q.c] = card(TRAP, TOP_TIER); placed++;
      }
      shuffle(cells);
      for (i = 0; i < cells.length && placed < traps; i++) {
        q = cells[i];
        if (grid[q.r][q.c] || q.r === rows - 1) continue;   // never on the front row
        grid[q.r][q.c] = card(TRAP, TOP_TIER); placed++;
      }
      placeObjects();
      // the soldiers, the two officers among them, best grades to the cells
      // the formation weighs highest
      var free = [];
      for (i = 0; i < cells.length; i++) if (!grid[cells[i].r][cells[i].c]) free.push(cells[i]);
      var ranks = [];
      if (free.length >= 6) ranks.push(MARSHAL);
      if (free.length >= 8) ranks.push(GENERAL);
      while (ranks.length < free.length) ranks.push(soldierRank(P.enemyBias, 2));
      ranks.sort(function (a, b) { return b - a; });
      for (i = 0; i < free.length; i++) free[i].w = cellWeight(form, free[i], decoy);
      free.sort(function (a, b) { return b.w - a.w; });
      for (i = 0; i < free.length; i++) {
        var sold = card(ranks[i], soldierTier(lvl));
        /* A BLUFF, DECIDED BEFORE THE FIRST TURN: some soldiers never move.
           A card that stays put all battle is a card the player starts to
           read as a trap or the flag — which is exactly what the camp wants
           them to think. */
        sold.anchored = draw() < ANCHORED;
        grid[free[i].r][free[i].c] = sold;
      }
      muster = {};
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var g = grid[r][c].rank;
        muster[g] = (muster[g] || 0) + 1;
      }
    }

    /* THE OBJECTS, after the traps and before the soldiers. The kinds the
       level has unlocked are shuffled and dealt round-robin, so a camp shows
       as many DIFFERENT objects as it can before it repeats one; the three
       that cost a card are kept off the front row.

       NEVER NEXT TO THE FLAG. A flag walled in by fences and rocks, against
       a deck with no lieutenant and no captain in it, is a battle that can be
       neither won nor lost — a fence sends the card back and costs nothing.
       The flag is guarded by soldiers and traps, which can always be fought
       through or died against. Every object carries the camp's best tier on
       its face, like the flag and the traps. */
    function placeObjects() {
      var n = P.objects | 0, pool = [], cells = [], r, c, i, k;
      if (n <= 0) return;
      for (k in OBJECTS) {
        if (!OBJECTS.hasOwnProperty(k)) continue;
        var O = OBJECTS[k];
        if (CONFIG.level ? O.unlock <= CONFIG.level : HARMLESS[O.effect]) pool.push(+k);
      }
      if (!pool.length) return;
      shuffle(pool);
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        if (!grid[r][c] && dist({ r: r, c: c }, flagCell) > 1) cells.push({ r: r, c: c });
      }
      shuffle(cells);
      for (i = 0; i < n && cells.length; i++) {
        var kind = pool[i % pool.length], keepBack = !HARMLESS[OBJECTS[kind].effect], spot = -1;
        for (var j = 0; j < cells.length && spot < 0; j++) {
          if (!(keepBack && cells[j].r === rows - 1)) spot = j;
        }
        if (spot < 0) continue;                 // no room behind the front row for this one
        grid[cells[spot].r][cells[spot].c] = card(kind, TOP_TIER);
        cells.splice(spot, 1);
      }
    }

    /* THE ARMY, AND THERE ARE TWO WAYS IT ARRIVES.

       A BARRACKS HANDS ONE OVER. `CONFIG.army.deck` is the deck the player
       composed, every card with an `id` of its own so the battle can name the
       ones it wounded. It is taken exactly as it stands — no officer is added
       and no count is made up — because a deck the player chose and a deck the
       game corrected are two different games.

       WITHOUT ONE THE GAME BUILDS ITS OWN, as it always has: one marshal, one
       general, one spy, the scouts, a sapper per trap (and one at least),
       soldiers to make the count, and a tier per card off the same ladder the
       camp is drawn on. That is what a playable plays and what an endless run
       plays. */
    function buildDeck() {
      var i;
      deck = [];
      roster = (CONFIG.army && CONFIG.army.deck && CONFIG.army.deck.length)
             ? CONFIG.army.deck : null;
      if (roster) {
        for (i = 0; i < roster.length; i++) {
          deck.push(card(roster[i].r, roster[i].t, roster[i].id, roster[i].o, roster[i].b));
        }
      } else {
        var n = Math.max(6, Math.round(cols * rows * P.deckRatio));
        var traps = P.traps | 0;
        var lvl = clamp(P.deckTier == null ? 0.2 : P.deckTier, 0, 1);
        var ranks = [MARSHAL, GENERAL, SPY, SCOUT, SCOUT];
        if (n >= 20) ranks.push(SCOUT);
        var sappers = Math.max(1, traps + (traps >= 3 ? 1 : 0));
        for (i = 0; i < sappers; i++) ranks.push(SAPPER);
        while (ranks.length < n) ranks.push(soldierRank(P.deckBias, 4));
        for (i = 0; i < ranks.length; i++) deck.push(card(ranks[i], soldierTier(lvl)));
      }
      army0 = deck.slice();
      shuffle(deck);
      hand = [];
      refillHand(false);
    }

    function refillHand(animate) {
      var i;
      for (i = 0; i < handSize; i++) {
        if (hand[i] == null && deck.length) {
          hand[i] = deck.shift();
          if (animate) refills.push({ slot: i, t: 0 });
        }
      }
    }
    function countHand() {
      var n = 0;
      for (var i = 0; i < handSize; i++) if (hand[i] != null) n++;
      return n;
    }
    function cardsLeft() { return deck.length + countHand(); }
    /* A WOUNDED CARD IS STILL AN ARMY, but it cannot be sent this turn. The two
       counts are told apart because the round ends on one of them and not the
       other: a hand of nothing but bandages is a turn to wait through, not a
       battle lost. */
    function readyLeft() {
      var n = deck.length;
      for (var i = 0; i < handSize; i++) if (pickable(i)) n++;
      return n;
    }
    /* What can go out NOW: a stunned card fills its slot for good, so a deck
       can still hold cards behind a hand that none of them can reach. */
    function playableNow() {
      var n = 0;
      for (var i = 0; i < handSize; i++) if (pickable(i)) n++;
      return n;
    }
    /* A trap and an object are not foes: the count is what can be fought. */
    function foesLeft() {
      var n = 0;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++)
        if (grid[r][c] && grid[r][c].rank !== TRAP && !isObject(grid[r][c].rank)) n++;
      return n;
    }

    /* ===================================================================
       REACH — where the army can strike from
       A walk from a virtual row under the camp through the cells already
       emptied, four-way; every enemy standing next to a reached cell is a
       target. The front row is reachable from the start.
       =================================================================== */
    function computeReach() {
      var r, c, i, q = [], seen = {}, k;
      reach = {}; targets = {};
      for (c = 0; c < cols; c++) q.push({ r: rows, c: c });
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      while (q.length) {
        var p = q.shift();
        for (i = 0; i < 4; i++) {
          var nr = p.r + dirs[i][0], nc = p.c + dirs[i][1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          k = nr + "," + nc;
          if (seen[k]) continue;
          if (grid[nr][nc] === null) { seen[k] = true; reach[k] = true; q.push({ r: nr, c: nc }); }
          else targets[k] = true;
        }
      }
    }
    function isTarget(r, c) { return !!targets[r + "," + c]; }
    function anyTarget() { for (var k in targets) if (targets.hasOwnProperty(k)) return true; return false; }

    /* ===================================================================
       GEOMETRY — everything derives from Layout

       THE CARDS ARE AS BIG AS THE BAND LETS THEM BE, because a painted card
       is read by its picture and its two badges, and both are sized in
       percents of the card (the SKIN's `1em = 1% of the card`). The hand
       takes the whole width of Layout, the camp takes whatever height the
       hand and the info band leave, and a cell is SQUARE — the lab's grid
       formats are squares, and a square is also the widest cell a 6x6 camp
       can afford in a portrait frame.
       =================================================================== */
    var HAND_MAX = 160;           // a 4-card hand stops here; a 5-card one is width-bound
    var LIFT = 34;                // the room a picked card rises into, badges included
    var CELL_MAX = 190;
    /* The two square formats of the lab: MID carries the name plate and wants
       room; TINY is the token, whose badges are re-measured for a small card.
       A four-column camp deals 155px cells and reads as cards; from five
       columns on the plate is too small to read and TINY is the one. */
    var MID_MIN = 150;
    /* The fight is TINY AGAINST TINY: the card that leaves the hand is the
       token, `TOKEN` of a cell wide, and the enemy it meets turns over into
       the same format whatever the camp is dealt in. The hand card itself
       never leaves its slot while the token is out. */
    var TOKEN = 0.72, FIGHT_FMT = "tiny";
    /* The commander's picture (stratideck-enemy-*.png, 1148x1371): its
       height over its width, and where the face is — x of its centre, y of
       the chin — as fractions of the picture. */
    var FOE_RATIO = 1371 / 1148, FOE_FACE = [0.62, 0.46];
    /* DRAWN MIRRORED, so he looks INTO the frame — at the camp and the
       player — rather than off its right edge. The face's x is read on the
       mirrored picture. */
    var FOE_FLIP = true, FOE_FX = FOE_FLIP ? 1 - FOE_FACE[0] : FOE_FACE[0];

    function geometry() {
      var bottom = Math.min(Layout.bottom, CONFIG.designHeight - P.cornerClear);
      HAND_W = Math.floor(Math.min(HAND_MAX, (Layout.w - (handSize - 1) * HAND_GAP) / handSize));
      HAND_H = Math.round(HAND_W * 1.4);
      G.handBottom = bottom;
      G.handY = bottom - HAND_H;
      var row = handSize * HAND_W + (handSize - 1) * HAND_GAP;
      G.handX0 = Layout.cx - row / 2;

      G.infoH = 130;
      G.infoY = G.handY - LIFT - G.infoH;

      G.gridTop = Layout.top + 12;
      G.gridBot = G.infoY - 10;
      var gap = 12, pad = 14;
      var cw = Math.min(CELL_MAX, (Layout.w - 12 - (cols - 1) * gap) / cols);
      var maxH = (G.gridBot - G.gridTop - 2 * pad - (rows - 1) * gap) / rows;
      cw = Math.floor(Math.min(cw, maxH));
      G.cw = cw; G.ch = cw; G.gap = gap;
      G.fmt = cw >= MID_MIN ? "mid" : "tiny";
      var gw = cols * cw + (cols - 1) * gap, gh = rows * cw + (rows - 1) * gap;
      G.gx0 = Layout.cx - gw / 2;
      G.gy0 = G.gridTop + pad + Math.max(0, (G.gridBot - G.gridTop - 2 * pad - gh) / 2);
      G.gw = gw; G.gh = gh;
      /* the army's card on a cell it strikes: a TOKEN, the same tiny format
         as the enemy it meets, a little smaller and offset so both read */
      G.tw = Math.round(cw * TOKEN); G.ax = -cw * 0.34; G.ay = cw * 0.3;

      /* THE INFO BAND IS THE PLAYER'S SIDE: the deck pile on the left, the
         infirmary and the prison on the right — the two tents of the village,
         each the door to its list. */
      G.deckW = 70; G.deckH = Math.round(G.deckW * 1.4);
      G.deckX = Layout.left + 6;
      G.deckY = G.infoY + G.infoH - G.deckH;
      G.doorW = 124; G.doorH = Math.round(G.doorW * 297 / 420);
      G.doorY = G.infoY + G.infoH - G.doorH - 24;
      G.prisonX = Layout.right - G.doorW;
      G.infX = G.prisonX - G.doorW - 6;

      /* THE TOP-RIGHT CORNER IS THE ENEMY'S SIDE: under the HUD's foe count,
         the pile of what the camp has lost; left of it, the commander.

         THE COMMANDER STANDS BEHIND HIS CAMP. He is drawn big, in the table
         layer UNDER the camp's panel and its cards, placed so his FACE clears
         the top edge of the panel and the rest of him is hidden by the board
         — the face is what the player reads his mood off, and a whole figure
         shrunk into the HUD band was a face nobody could see. `FOE_FACE` is
         where the face sits in his picture (x centre, y of the chin), so the
         chin lands on the panel's edge whatever height the camp is dealt at.
         The HUD's own gradient lies over his hat and barely touches his face. */
      var hudTop = view.insetTop;
      G.pileW = 58;
      G.pileCx = Layout.right - 45;
      G.pileCy = hudTop + 94 + G.pileW / 2;
      G.panelTop = G.gy0 - 14;
      G.foeW = 260; G.foeH = Math.round(G.foeW * FOE_RATIO);
      G.foeX = Layout.right - 175 - G.foeW * FOE_FX;
      G.foeY = G.panelTop - G.foeH * FOE_FACE[1];
    }
    function cellX(c) { return G.gx0 + c * (G.cw + G.gap); }
    function cellY(r) { return G.gy0 + r * (G.ch + G.gap); }
    function cellAt(p) {
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var x = cellX(c), y = cellY(r);
        if (p.x >= x - 6 && p.x <= x + G.cw + 6 && p.y >= y - 6 && p.y <= y + G.ch + 6) return { r: r, c: c };
      }
      return null;
    }
    function handX(i) { return G.handX0 + i * (HAND_W + HAND_GAP); }
    function handAt(p) {
      if (p.y < G.handY - 40 || p.y > G.handBottom + 10) return -1;
      for (var i = 0; i < handSize; i++) {
        if (hand[i] == null) continue;
        var x = handX(i);
        if (p.x >= x - 8 && p.x <= x + HAND_W + 8) return i;
      }
      return -1;
    }

    /* ===================================================================
       LIFECYCLE
       =================================================================== */
    function reset() {
      BAND = bandFor();
      Art.backdrop(BAND.scene);
      seed = ((CONFIG.level | 0) * 7919 + 12345) >>> 0;
      cols = Math.max(2, P.cols | 0); rows = Math.max(2, P.rows | 0);
      handSize = Math.max(2, P.handSize | 0);
      geometry();
      tableClear();
      refills = [];
      wounded = {}; captives = []; hurtCards = []; fallen = []; lostCards = []; met = []; refused = []; prisonWarned = false;
      used = {};
      strayed = []; smashed = 0; taught = {};
      sheetClose();
      buildGrid();
      buildDeck();
      computeReach();
      score = 0; streak = 0; bestStreak = 0;
      kills = 0; ties = 0; losses = 0; precise = 0; scouted = 0; trapsCleared = 0;
      selected = -1; drag = null; turn = null; march = null; ended = false; outcome = null; tAnim = 0;
      mood = "neutral"; lastFoe = null; lastWon = null; hiding = null;
      flagTaken = false;
      HUD.setScoreNow(0);
      showCounts();
      Fx.reset();
      Music.play(CONFIG.level ? BAND.music : null);
    }
    /* The motor lays the frame out before any round exists (the intro, a
       turn of the device on the menu): nothing to place then — reset()
       builds the camp from Layout when the round starts. */
    function onResize() {
      if (!grid) return;
      geometry();
    }
    function showCounts() {
      var left = cardsLeft();
      HUD.setLeft(left, CONFIG.copy.cardsLabel, left <= 2 ? "warn" : "");
      HUD.setRight(foesLeft(), CONFIG.copy.foesLabel);
    }

    /* ===================================================================
       INPUT — pick a card, send it at a cell; or drag it there
       =================================================================== */
    /* A BANDAGED CARD IS NOT PICKED UP AT ALL. It is answered rather than
       ignored: a slot that does nothing under the finger reads as a dead
       screen, and the one thing the player needs told is that it comes back
       next turn. */
    function pickable(i) { return hand[i] != null && !hand[i].hurt && !hand[i].stun; }

    function inBox(p, x, y, w, h) { return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h; }
    /* The five things on the table that open a list: the beaten pile, the
       two tents, the deck pile and the commander's face — the part of him
       above the board. */
    function zoneAt(p) {
      var ph = G.pileW / 2 + 10;
      if (inBox(p, G.pileCx - ph, G.pileCy - ph, ph * 2, ph * 2)) return "beaten";
      if (inBox(p, G.infX, G.doorY - 6, G.doorW, G.doorH + 30)) return "infirmary";
      if (inBox(p, G.prisonX, G.doorY - 6, G.doorW, G.doorH + 30)) return "prison";
      if (inBox(p, G.deckX - 6, G.deckY - 16, G.deckW + 18, G.deckH + 22)) return "army";
      var top = Math.max(view.insetTop, G.foeY), fx = G.foeX + G.foeW * FOE_FX;
      if (inBox(p, fx - G.foeW * 0.35, top, G.foeW * 0.7, G.panelTop - top)) return "camp";
      return null;
    }
    /* ON A DESK THE MOUSE SAYS WHAT IS CLICKABLE. The canvas takes every
       pointer — the cards and the commander are layers under it — so the hand
       cursor is the canvas's, set while the mouse is over one of the zones
       above. A finger never sees it. */
    var cursorOn = false;
    function hover(p) {
      var on = sheet ? !!sheetFileAt(p) : !drag && (!!zoneAt(p) || !!foeUpAt(p));
      if (on === cursorOn) return;
      cursorOn = on;
      var cv = document.getElementById("game");
      if (cv) cv.style.cursor = on ? "pointer" : "";
    }
    function onDown(p) {
      if (ended || State !== "playing") return;
      /* the lists: a tap on an officer opens their file, a tap anywhere else
         puts the list away, and a tap on a pile or a tent opens it — between
         turns or during one, since nothing is chosen */
      if (sheet) {
        var at = sheetFileAt(p);
        if (at) window.__ARMY__.file(at._file, at._file.team, at.querySelector(".card") || at);
        else sheetClose();
        return;
      }
      var zone = zoneAt(p);
      if (zone) { sheetOpen(zone); return; }
      if (turn || march) return;
      var i = handAt(p);
      if (i >= 0) {
        if (!pickable(i)) {
          Sound.clip("warn", 0.35, 0.9);
          if (hand[i].stun) Notify.say("Stunned for the battle", { kind: "warn", icon: "lock" });
          else Notify.say("Still wounded", { kind: "warn", icon: "hourglass" });
          return;
        }
        selected = i;
        drag = { i: i, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false };
        Sound.clip("pick", 0.45, 1 + i * 0.03);
        return;
      }
      var cell = cellAt(p), armed = selected >= 0 && pickable(selected);
      if (cell && armed && isTarget(cell.r, cell.c)) { attack(selected, cell.r, cell.c); return; }
      /* a card picked and a target in reach is a strike; anything else on
         the one enemy face up is a question about it */
      if (foeUpAt(p)) { foeOpen(cell); return; }
      if (cell && armed) {
        if (grid[cell.r][cell.c]) {
          Sound.clip("warn", 0.35, 1.2);
          Notify.say("Out of reach", { kind: "warn" });
        }
        return;
      }
      selected = -1;
    }
    /* THE ENEMY FACE UP IS A DOOR TOO. The camp is played from memory and
       the card just turned over is the one the player is reading, so a tap
       on it opens it at full size, the way a card of the lists does — its
       file, or what an object does and who breaks it. Between turns only:
       a card mid-fight or mid-march is not standing where it is drawn. Only
       where the web shell's barracks is there to show it. */
    function foeUpAt(p) {
      if (turn || march || !lastFoe || !window.__ARMY__ || !window.__ARMY__.file) return null;
      var cell = cellAt(p);
      return cell && grid[cell.r][cell.c] === lastFoe ? cell : null;
    }
    function foeOpen(cell) {
      var f = fileOf(lastFoe, "red");
      if (cursorOn) { cursorOn = false; document.getElementById("game").style.cursor = ""; }
      drag = null;
      window.__ARMY__.file(f, f.team, Table.nodes[cellKey(cell.r, cell.c)]);
    }
    function onMove(p) {
      if (!ended && State === "playing") hover(p);
      if (!drag) return;
      drag.x = p.x; drag.y = p.y;
      if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) > 14) drag.moved = true;
    }
    function onUp(p) {
      if (!drag) return;
      var d = drag; drag = null;
      if (ended || turn || march) return;
      if (!d.moved) return;                       // a tap: the card stays picked
      var cell = cellAt(p);
      if (cell && isTarget(cell.r, cell.c)) { attack(d.i, cell.r, cell.c, { x: p.x, y: p.y - DRAG_UP, s: DRAG_S }); return; }
      if (cell && grid[cell.r][cell.c]) {
        Sound.clip("warn", 0.35, 1.2);
        Notify.say("Out of reach", { kind: "warn" });
      }
    }

    /* ===================================================================
       THE FIGHT
       =================================================================== */

    /* The verdict, before anything moves: what happens to the attacker, to
       the defender, and what it pays.

       THE GRADE FIRST, THE TIER SECOND, AND THE TIER GAP LAST. `margin` is how
       far above the defender the attacker's grade was — 0 when the two grades
       matched and the tier settled it, which is the tightest win there is.
       `hurt` says who limps away: "a" the attacker, "d" the defender, nothing
       when the two tiers matched.

       The three specials are blind to the tier on purpose. A spy kills the
       marshal because it is a spy; a sapper clears a trap because it is a
       sapper; a scout reveals because it is a scout. Putting a letter in front
       of any of those turns a rule the player can recite into a rule they have
       to look up. */
    function judge(a, foe) {
      var d = foe.rank;
      if (d === FLAG)  return { kind: "flag" };
      /* a scout REVEALS — a card already turned over leaves it nothing to
         do but fight, which a grade 2 mostly loses */
      if (a.rank === SCOUT && !foe.known) return { kind: "scout" };
      if (d === TRAP)  return a.rank === SAPPER ? { kind: "clear" } : { kind: "trap" };
      /* an object is broken by its one grade and answers everyone else its
         own way — blind to the tier, like the specials */
      if (isObject(d)) return a.rank === OBJECTS[d].breaker ? { kind: "smash" } : { kind: OBJECTS[d].effect };
      if (a.rank === SPY && d === MARSHAL) return { kind: "win", margin: 1, hurt: null };
      if (a.rank > d)  return { kind: "win", margin: a.rank - d, hurt: toll(a, foe) };
      if (a.rank < d)  return { kind: "lose" };
      /* SAME GRADE: the tier is the whole of it, and equal on both is the one
         draw left in the game. */
      if (a.tier > foe.tier) return { kind: "win", margin: 0, hurt: "d" };
      if (a.tier < foe.tier) return { kind: "lose" };
      return { kind: "tie" };
    }

    /* WHO PAYS FOR A WIN THE GRADE ALREADY DECIDED. The loser's tier standing
       above the winner's is a card that was better equipped and lost anyway —
       it takes a piece of the winner with it. The other way round the fight
       was one-sided enough that the loser is left standing rather than
       destroyed, which is what makes it a prisoner worth taking. */
    function toll(a, foe) {
      if (foe.tier > a.tier) return "a";
      if (a.tier > foe.tier) return "d";
      return null;
    }

    /* THE BOOK'S SPELL: the card turns round and strikes one of its own hand,
       picked before anything moves so the duel can show who. It is the same
       fight as against the camp, read from both sides — the grade decides,
       the tier settles equal grades, and the tier gap decides what it costs:
       a winner whose tier was lower is wounded, a loser whose tier was lower
       is left standing — WOUNDED, since an ally cannot be taken prisoner —
       rather than killed. A card that survives goes back to its own slot:
       it never left the hand, it only turned round in it. With nobody else in
       the hand the spell finds no one and the card simply comes back. */
    function bewitch(a, i) {
      var picks = [], j;
      for (j = 0; j < handSize; j++) if (j !== i && hand[j]) picks.push(j);
      if (!picks.length) return { kind: "spell", ally: -1 };
      j = picks[drawInt(picks.length)];
      var b = hand[j], v = judge(a, { rank: b.rank, tier: b.tier, known: true });
      var out = { kind: "spell", ally: j, b: b, res: v.kind,
                  deadA: false, hurtA: false, deadB: false, hurtB: false };
      if (v.kind === "win") {
        out.hurtA = v.hurt === "a";
        out.hurtB = v.hurt === "d";
        out.deadB = !out.hurtB;
      } else if (v.kind === "lose") {
        var t = toll(b, a);
        out.hurtB = t === "a";
        out.hurtA = t === "d";
        out.deadA = !out.hurtA;
      } else {
        out.deadA = out.deadB = true;
      }
      return out;
    }

    /* A WOUND, wherever it comes from: the card stays in its hand slot for
       this turn and the next, and goes on the infirmary's list — WHEN THERE
       IS A BED. The barracks has six (`CONFIG.army.beds` is how many are
       free when the battle starts); a card of the player's own that finds
       none is refused, and a wound nobody can treat is a card lost: it
       leaves the battle on the spot, the barracks strikes it off the roster
       (`ledger`, `dead`), and the notice says so now rather than later. A
       conscript has no id and never reaches a bed, so it is always taken in.
       `slot` is the hand slot the card stands in, emptied on a refusal.
       Returns whether the card was admitted. */
    function wound(c, slot) {
      var beds = CONFIG.army && CONFIG.army.beds;
      if (c.id && beds != null && !wounded[c.id] && Object.keys(wounded).length >= beds) {
        refused.push(c);
        lostCards.push(c);
        losses++;
        if (slot != null && hand[slot] === c) hand[slot] = null;
        Notify.say("Infirmary full", { sub: cardName(c) + " · " + Lang.t("card lost"), kind: "loss", icon: "heart" });
        return false;
      }
      c.hurt = 2;
      if (c.id) wounded[c.id] = 1;
      if (hurtCards.indexOf(c) < 0) hurtCards.push(c);
      return true;
    }

    function mult() { return Math.min(STREAK_CAP, 1 + STREAK_STEP * Math.max(0, streak - 1)); }
    /* What the tier gap is worth: beating something better equipped pays more
       than walking over a conscript, clamped both ways so it stays a nudge
       rather than the whole score. */
    function tierPay(a, foe) {
      return clamp(1 + TIER_STEP * (foe.tier - a.tier), TIER_MIN, TIER_MAX);
    }

    /* `from` is where the token sets off: the finger that let go of it, or
       the hand card it springs out of when the cell was tapped. */
    function attack(i, r, c, from) {
      var a = hand[i], foe = grid[r][c];
      if (a == null || a.hurt || a.stun || !foe) return;
      selected = -1;
      if (a.id) used[a.id] = 1;               // a service, for the barracks (`ledger`)
      var verdict = judge(a, foe);
      if (verdict.kind === "spell") verdict = bewitch(a, i);
      turn = {
        i: i, r: r, c: c, a: a, foe: foe, verdict: verdict,
        state: "fly", t: 0, wasUp: foe === lastFoe,
        from: from || { x: handX(i) + HAND_W / 2, y: G.handY + HAND_H / 2 - LIFT_SEL, s: 0.6 }
      };
      hand[i] = null;
      Sound.clip("place", 0.5, 1);
    }

    /* AN OBJECT STRUCK BY THE WRONG GRADE. Nothing is beaten and the object
       stays where it stands; what happens to the card is the object's own
       effect (OBJECTS). The callout is the moment, and the first time a kind
       acts in a battle one Notify names the grade that breaks it — the rule
       is learnt from the mistake it answers, not from a page of rules. */
    function objectHit(T, O) {
      var v = T.verdict, a = T.a;
      streak = 0;
      lastWon = false; mood = "happy";
      Pop.show("alert", { word: O.hit });
      if (v.kind === "decoy") {
        deck.push(a);
        Sound.clip("place", 0.5, 0.8);
      } else if (v.kind === "block") {
        hand[T.i] = a;
        Sound.clip("lose", 0.45, 1.3);
        Fx.shake(6, 0.2);
      } else if (v.kind === "stray") {
        strayed.push(a);
        Sound.clip("lose", 0.5, 0.8);
        Notify.say("Out of the battle", { sub: cardName(a), kind: "loss", icon: "x" });
      } else if (v.kind === "stun") {
        a.stun = true;
        hand[T.i] = a;
        Sound.clip("tie", 0.55, 0.7);
        Fx.flash("#9b6bff", 0.25, 2.5);
        Notify.say("Stunned for the battle", { sub: cardName(a), kind: "loss", icon: "hourglass" });
      } else if (v.kind === "spell") {
        spellLands(T);
      }
      if (!taught[T.foe.rank]) {
        taught[T.foe.rank] = true;
        Notify.say(O.lesson, { kind: "info", icon: "info" });
      }
    }

    /* The spell's fight, landed (bewitch picked it): who falls, who limps. */
    function spellLands(T) {
      var v = T.verdict, a = T.a, b = v.b;
      Fx.flash("#9b6bff", 0.3, 2.2);
      if (v.ally < 0) {
        hand[T.i] = a;
        Sound.clip("place", 0.45, 0.7);
        Notify.say("The spell finds no one", { kind: "info", icon: "sparkles" });
        return;
      }
      Sound.clip(v.res === "tie" ? "tie" : "lose", 0.6, 0.9);
      Fx.shake(9, 0.25);
      if (v.deadB) { lostCards.push(b); hand[v.ally] = null; losses++; }
      else if (v.hurtB) wound(b, v.ally);
      if (v.deadA) { lostCards.push(a); losses++; }
      else { hand[T.i] = a; if (v.hurtA) wound(a, T.i); }
      var fell = v.deadA && v.deadB ? "Both fall"
               : v.deadB ? "An ally falls"
               : v.deadA ? "Struck down by an ally"
               : v.hurtB ? "An ally is wounded" : "Wounded by an ally";
      Notify.say(fell, { sub: cardName(a) + " → " + cardName(b), kind: "loss", icon: "sparkles" });
    }

    /* The verdict lands: the camp and the deck are updated here, once, at
       the moment of the clash — everything after it is the picture catching
       up. */
    function resolve(T) {
      var v = T.verdict, foe = T.foe, a = T.a, pts = 0, O = OBJECTS[foe.rank];
      if (v.kind === "flag" || v.kind === "clear" || v.kind === "smash" || v.kind === "win" || v.kind === "tie") fallen.push(foe);
      var cx = cellX(T.c) + G.cw / 2, cy = cellY(T.r) + G.ch / 2;
      /* every enemy card turned over, once: the barracks' collection is
         filled from it (`ledger`) */
      if (!foe.known) met.push({ r: foe.rank, t: foe.tier });
      foe.known = true;
      if (lastFoe && lastFoe !== foe) hiding = { card: lastFoe, t: 0 };
      lastFoe = foe;

      if (v.kind === "scout") {
        scouted++;
        deck.push(a);
        pts = SCOUT_PAY;
        lastWon = null; mood = "neutral";
        Sound.clip("flip", 0.6, 1.3);
        Notify.say(Lang.t("Spotted") + ": " + cardName(foe, "red"), { kind: "info", icon: "eye" });
      } else if (v.kind === "flag") {
        pts = FLAG_PAY + ROUTED * kills;      // what was BEATEN, not what was skipped
        flagTaken = true;
        grid[T.r][T.c] = null;
        deck.push(a);
        kills++; streak++;
        lastWon = true; mood = "sad";
        Sound.clip("flag", 0.8, 1);
        Fx.flash(GOLD, 0.5, 2.5); Fx.shake(16, 0.4); Fx.freeze(0.1);
        Fx.ring(cx, cy, { from: 40, to: 700, color: GOLD, width: 10, life: 0.6 });
        Pop.show("ultra", { word: CONFIG.copy.flagTaken, sub: "+" + pts });
      } else if (v.kind === "clear") {
        pts = Math.round(TRAP_CLEAR * mult());
        grid[T.r][T.c] = null;
        deck.push(a);
        trapsCleared++; streak++;
        lastWon = true; mood = "sad";
        Sound.clip("win", 0.6, 1.1);
        Fx.burst(cx, cy, { color: [GOLD, "#ffffff"], count: 16, speed: 360, life: 0.5, grav: 500 });
        Pop.show("bonus", { word: "Trap cleared", sub: "+" + pts });
      } else if (v.kind === "smash") {
        /* THE ONE GRADE THE OBJECT ANSWERS TO: it goes, and the card goes
           back to the deck like any winner. */
        pts = Math.round(OBJECT_PAY * mult());
        grid[T.r][T.c] = null;
        deck.push(a);
        smashed++; streak++;
        if (streak > bestStreak) bestStreak = streak;
        lastWon = true; mood = "sad";
        Sound.clip("win", 0.6, 1.05);
        Fx.burst(cx, cy, { color: [GOLD, BLUE, "#ffffff"], count: 16, speed: 360, life: 0.5, grav: 500 });
        Pop.show("bonus", { word: O.broken, sub: "+" + pts });
      } else if (O) {
        objectHit(T, O);
      } else if (v.kind === "trap") {
        lostCards.push(a);
        losses++; streak = 0;
        lastWon = false; mood = "happy";
        Sound.clip("trap", 0.7, 1);
        Fx.flash(RED, 0.4, 2.2); Fx.shake(14, 0.35); Fx.freeze(0.06);
        Fx.burst(cx, cy, { color: [RED, "#3a0a0a"], count: 18, speed: 420, life: 0.5, grav: 600 });
        Pop.show("score", { word: "Trap!" });
      } else if (v.kind === "win") {
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        var tight = v.margin <= 1 ? 2 : v.margin === 2 ? 1 : 0.5;
        pts = Math.round(KILL * foe.rank * tight * tierPay(a, foe) * mult());
        grid[T.r][T.c] = null;
        kills++;
        if (v.margin <= 1) precise++;
        lastWon = true; mood = "sad";
        Sound.clip("win", 0.6, 0.9 + foe.rank * 0.03);
        Fx.burst(cx, cy, { color: [GOLD, BLUE, "#ffffff"], count: 14, speed: 380, life: 0.5, grav: 500 });
        Fx.shake(6, 0.2);

        if (v.hurt === "a") {
          /* A WIN THAT COST SOMETHING. The card takes the cell and stays in the
             slot it was sent from, bandaged, unable to go out again until the
             turn after next — and it is on the infirmary's list for as long as
             the barracks says when the battle is over. It does NOT go to the
             bottom of the deck: a wound the player cannot see is a rule
             nobody learns, and the slot it occupies is what the wound costs. */
          hand[T.i] = a;
          Sound.clip("tie", 0.5, 1.25);
          Fx.burst(cx, cy, { color: [RED, "#ffd0d0"], count: 10, speed: 260, life: 0.45, grav: 420 });
          if (wound(a, T.i)) Notify.say("Wounded", { sub: cardName(a), kind: "loss" });
        } else {
          deck.push(a);
          if (v.hurt === "d" && foe.rank <= MARSHAL) {
            /* AN ENEMY LEFT STANDING. The cell is taken either way — this is
               not a fight the player has to finish — but a card beaten by
               something plainly better is one that can be talked into
               changing sides, and the end of a won battle is where that is
               offered (packages/webshell/army.js). */
            var cells = CONFIG.army && CONFIG.army.cells;
            if (cells != null && captives.length >= cells) {
              /* NO CELL FOR THEM. The barracks' prison has six, and a
                 prisoner with nowhere to go is not taken: said once, on the
                 first one turned away. */
              if (!prisonWarned) {
                prisonWarned = true;
                Notify.say("Prison full", { sub: cardName(foe, "red") + " " + Lang.t("walks free"), kind: "warn", icon: "lock" });
              }
            } else {
              captives.push({ r: foe.rank, t: foe.tier, seq: captives.length });
              pts += CAPTIVE_PAY;
              Pop.show("bonus", { word: "Captive", sub: cardName(foe, "red") });
            }
          } else if (v.margin <= 1) {
            Pop.show("combo", { word: "Precise!", sub: "+" + pts });
          } else if (v.margin >= 3) {
            Pop.show("alert", { word: "Overkill" });
          }
        }
        if (streak >= 3 && v.margin <= 2 && v.hurt !== "a") {
        }
      } else if (v.kind === "lose") {
        lostCards.push(a);
        losses++; streak = 0;
        lastWon = false; mood = "happy";
        Sound.clip("lose", 0.6, 1);
        Fx.shake(10, 0.28); Fx.flash(RED, 0.25, 2.5);
        Pop.show("alert", { word: cardName(foe, "red") + " " + Lang.t("holds") });
      } else {                                              // tie: both fall
        lostCards.push(a);
        ties++; streak = 0;
        pts = TIE * foe.rank;
        grid[T.r][T.c] = null;
        lastWon = null; mood = "neutral";
        Sound.clip("tie", 0.6, 1);
        Fx.shake(8, 0.25);
        Fx.burst(cx, cy, { color: [BLUE, RED], count: 16, speed: 340, life: 0.5, grav: 500 });
        Pop.show("alert", { word: "Both fall" });
      }

      if (pts) {
        score += pts;
        HUD.setScore(score);
        HUD.punch(v.kind === "flag" ? GOLD : BLUE);
        Pop.text(cx, cy - G.ch * 0.6, "+" + pts, { color: GOLD, size: 22, life: 0.6, tier: 1 });
      }
      T.pts = pts;
      Sound.clip("clash", 0.5, 1);
      computeReach();
      showCounts();
    }

    /* After the pictures have caught up: the bandages come off a turn at a
       time, a new card fills the empty slot, and the two questions every turn
       ends on — is the camp empty, is the army. */
    function endTurn(T) {
      var v = T.verdict, i;
      for (i = 0; i < handSize; i++) if (hand[i] && hand[i].hurt) hand[i].hurt--;
      refillHand(true);
      var left = cardsLeft();
      if (left <= 2 && left > 0) Sound.clip("warn", 0.4, 1);
      showCounts();
      turn = null;
      if (v.kind === "flag" || foesLeft() === 0) { finish(true); return; }
      if (left === 0) { finish(false); return; }
      /* A HAND OF NOTHING BUT BANDAGES IS NOT A BATTLE LOST. The wounds come
         off on the turn boundary above, so the only way `playableNow` can be
         0 here with cards still on the table is a hand that heals next turn —
         and there is no turn to wait through, because a turn is a card being
         sent. So they are healed on the spot rather than the round being
         ended on a technicality nobody could have played around. */
      if (!playableNow()) {
        for (i = 0; i < handSize; i++) if (hand[i]) hand[i].hurt = 0;
      }
      /* A HAND OF NOTHING BUT STUNNED CARDS IS. No bandage comes off a
         stun, and the deck behind it has no slot to be dealt into: the army
         cannot send another card, which is an army spent. */
      if (!playableNow()) {
        Notify.say("No card can move", { kind: "loss", icon: "lock" });
        finish(false);
        return;
      }
      if (!anyTarget()) { finish(true); return; }         // nothing left to strike: the camp is taken
      enemyTurn();
    }

    /* ===================================================================
       THE ENEMY'S TURN — one soldier, one cell, or nothing
       The camp answers every card the player sends. It may slide ONE of its
       soldiers one cell — up, down or sideways — into a cell the fighting
       emptied, or it may pass. The flag and the traps never move, and the
       anchored soldiers never do either (buildGrid): standing still is the
       camp's bluff.

       WHAT IT PLAYS FOR IS THE FLAG. `siege()` is how many enemy cards still
       stand between the army and the flag, on the cheapest path — an emptied
       cell is free, a standing card costs one fight. A move that raises it is
       a card stepping into the corridor the player was opening; a move that
       lowers it is never played. When nothing defends, the camp may still
       move for the sake of it — a weak card it knows the player has seen
       stepping out of reach, a strong one stepping into it — and it passes
       more often low on the climb than high on it.

       A CARD THAT HAS MOVED IS TILTED a few degrees for the rest of the
       battle, face up or face down: it is the one thing the player is told
       about it, and it is what makes an untilted card worth wondering about.
       =================================================================== */
    var ANCHORED = 0.4;                       // share of soldiers that never move
    var THINK = 0.3, MARCH = 0.4;             // the pause before the move, the slide

    function siege() {
      var r, c, i, best = {}, dq = [], k;
      for (c = 0; c < cols; c++) {
        var cost0 = grid[rows - 1][c] && (rows - 1 !== flagCell.r || c !== flagCell.c) ? 1 : 0;
        k = (rows - 1) + "," + c;
        if (best[k] == null || cost0 < best[k]) { best[k] = cost0; dq.push({ r: rows - 1, c: c, d: cost0 }); }
      }
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      while (dq.length) {
        dq.sort(function (a, b) { return a.d - b.d; });
        var p = dq.shift();
        if (p.d > best[p.r + "," + p.c]) continue;
        if (p.r === flagCell.r && p.c === flagCell.c) return p.d;
        for (i = 0; i < 4; i++) {
          r = p.r + dirs[i][0]; c = p.c + dirs[i][1];
          if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
          var isFlag = r === flagCell.r && c === flagCell.c;
          var d = p.d + (grid[r][c] && !isFlag ? 1 : 0);
          k = r + "," + c;
          if (best[k] == null || d < best[k]) { best[k] = d; dq.push({ r: r, c: c, d: d }); }
        }
      }
      return 99;
    }
    function movable(q) { return q && q.rank <= MARSHAL && !q.anchored; }

    function enemyTurn() {
      var lvl = levelD == null ? 0.3 : levelD;
      var base = siege(), moves = [], r, c, i, k0, before = {};
      for (k0 in targets) if (targets.hasOwnProperty(k0)) before[k0] = true;   // the loop re-reaches
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var q = grid[r][c];
        if (!movable(q)) continue;
        var wasTarget = !!before[r + "," + c];
        for (i = 0; i < 4; i++) {
          var nr = r + dirs[i][0], nc = c + dirs[i][1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc]) continue;
          grid[nr][nc] = q; grid[r][c] = null;
          var gain = siege() - base;
          computeReach();
          var exposed = isTarget(nr, nc);
          grid[r][c] = q; grid[nr][nc] = null;
          if (gain < 0) continue;
          var sc = gain * 3;
          if (exposed) sc += (q.rank - 5) * 0.25;                  // strong cards step forward
          if (q.known && wasTarget && !exposed && q.rank <= 5) sc += 0.8;   // a seen weakling steps back
          sc += draw() * 0.6;
          moves.push({ q: q, from: { r: r, c: c }, to: { r: nr, c: nc }, gain: gain, sc: sc });
        }
      }
      computeReach();
      if (!moves.length) return;
      moves.sort(function (a, b) { return b.sc - a.sc; });
      var m = moves[0];
      var play = m.gain > 0 ? draw() < 0.45 + 0.45 * lvl : m.sc > 0.4 && draw() < 0.15 + 0.3 * lvl;
      if (!play) return;
      march = { q: m.q, from: m.from, to: m.to, t: 0, state: "think" };
    }

    function marchStep(dt) {
      var M = march;
      M.t += dt;
      if (M.state === "think" && M.t >= THINK) {
        M.state = "slide"; M.t = 0;
        grid[M.to.r][M.to.c] = M.q; grid[M.from.r][M.from.c] = null;
        if (!M.q.moved) {
          M.q.moved = true;
          M.q.tilt = (draw() < 0.5 ? -1 : 1) * (0.05 + 0.035 * draw());   // 3 to 5 degrees
        }
        computeReach();
        Sound.clip("place", 0.35, 0.75);
      } else if (M.state === "slide" && M.t >= MARCH) {
        march = null;
        showCounts();
      }
    }

    /* ===================================================================
       UPDATE — the turn's five beats
       =================================================================== */
    var FLY = 0.3, FLIP = 0.3, CLASH = 0.62, SETTLE = 0.45;
    /* THE DUEL: a fight is played a second time, BIG, over the table, so the
       player can see who hit whom (drawDuel). It enters, the winner winds up,
       lunges and lands — the verdict is written at that impact, `D_HIT` — the
       loser is knocked back and greyed, and both leave. A draw is two cards
       lunging at once. The flag and the scout do not fight and skip it. */
    var D_IN = 0.3, D_WIND = 0.55, D_HIT = 0.72, D_KNOCK = 1.2, D_OUT = 1.55, DUEL = 1.85;
    /* THE FLAG IS SHOWN BEFORE IT IS WON. A capture used to fade the flag out
       with the settle and cut to the end screen: the one card the whole
       battle was about was on screen for a fraction of a second. It now
       stays turned over, raised and lit, for two seconds — the clash and
       this hold together — and only then is the victory declared. */
    var REVEAL = 2 - CLASH;
    /* AN OBJECT THAT ONLY TURNS A CARD AWAY IS NOT A FIGHT. The straw man,
       the fence, the rock, the forest and the skull play on the board, where
       the token is sent back, lost or held; the object a grade breaks is
       fought in the duel like a soldier, and so is the book's spell — the
       duel is the card against the ALLY it turned on. */
    var TURNED = { decoy: true, block: true, stray: true, stun: true };
    function noDuel(v) {
      return v.kind === "flag" || v.kind === "scout" || TURNED[v.kind] || (v.kind === "spell" && v.ally < 0);
    }

    function update(dt) {
      var i;
      tAnim += dt;
      for (i = refills.length - 1; i >= 0; i--) {
        refills[i].t += dt / 0.28;
        if (refills[i].t >= 1) refills.splice(i, 1);
      }
      if (hiding) { hiding.t += dt / FLIP; if (hiding.t >= 1) hiding = null; }
      if (march) { marchStep(dt); return; }
      if (!turn) return;
      var T = turn;
      T.t += dt;
      if (T.state === "fly" && T.t >= FLY) {
        T.state = "flip"; T.t = 0;
        Sound.clip("flip", 0.55, 1);
      } else if (T.state === "flip" && T.t >= FLIP) {
        T.t = 0;
        if (noDuel(T.verdict)) { T.state = "clash"; resolve(T); }
        else { T.state = "duel"; Sound.clip("place", 0.4, 0.7); }
      } else if (T.state === "duel") {
        if (!T.hit && T.t >= D_HIT) { T.hit = true; resolve(T); duelGlow(T.verdict); }
        if (T.t >= DUEL) { T.state = "settle"; T.t = 0; }
      } else if (T.state === "clash" && T.t >= CLASH) {
        T.state = T.verdict.kind === "flag" ? "reveal" : "settle"; T.t = 0;
      } else if ((T.state === "settle" && T.t >= SETTLE) || (T.state === "reveal" && T.t >= REVEAL)) {
        endTurn(T);
      }
    }

    /* ===================================================================
       THE CARD FACES — the lab's card, as DOM
       lab/stratideck-card.html is where a card is composed, and its
       stylesheet is pasted verbatim into the SKIN (the block between THE CARD
       ITSELF and END OF THE CARD). What this section adds is the one thing a
       stylesheet cannot say: which nodes a card is made of, with the numbers
       of CONFIG.cards on them. `faceNode` is the lab's `build()`, minus the
       tilt, and it is the one builder of a card face in the game — the
       barracks asks for it too (`cardNode`), so a card picked in the deck
       screen and the card that lands on the grid are the same object.
       =================================================================== */
    var TIER_CLS   = ["basic", "common", "uncommon", "rare", "epic", "legendary"];
    var TIER_LABEL = ["Basic", "Common", "Uncommon", "Rare", "Epic", "Legendary"];
    var TIER_PIPS  = [1, 1, 2, 3, 4, 5];
    /* where each grade's scene looks, when `vary` is on — the lab's table */
    var FOCUS = { 1: [72, 22], 2: [30, 24], 3: [84, 80], 4: [16, 78], 5: [50, 74], 6: [66, 66],
                  7: [36, 62], 8: [78, 44], 9: [22, 46], 10: [50, 30], 11: [40, 50], 12: [60, 36],
                  13: [26, 70], 14: [70, 58], 15: [44, 82], 16: [18, 34], 17: [80, 28], 18: [56, 52] };
    /* A face-down card must not say what it is: the frame's inner rim is the
       rarity colour on a face, and the house gold on a back. */
    var BACK_RIM = "#d9a441";
    /* A card with no tier has no rarity colour to wear: an OBJECT is a warm
       brass, a GHOST (a card the player has never had) a cold slate — so a
       shadow never reads as the bottom rung of the ladder. */
    var OBJECT_RIM = "#c9a86a", GHOST_RIM = "#69718a";

    /* The seven badge shapes, verbatim from the lab. `.f` is the coloured
       body, `.f2` its darker second colour, `.x` the neutral metal, `.g` the
       gloss, `.d` the shade; the number is HTML laid over it. */
    var BADGE = {
      shield:  { vb: "0 0 100 110", svg:
        '<path class="f" d="M50 4 L92 18 V52 C92 78 72 96 50 106 C28 96 8 78 8 52 V18 Z"/>' +
        '<path class="d" d="M50 4 L92 18 V52 C92 78 72 96 50 106 C28 96 8 78 8 52 V18 Z"/>' +
        '<path class="g" d="M50 10 L86 22 V50 C86 62 78 72 66 80 C58 66 46 60 14 52 V22 Z"/>' },
      crown:   { vb: "0 0 120 90", svg:
        '<path class="f" d="M12 80 L4 24 L36 48 L60 6 L84 48 L116 24 L108 80 Z"/>' +
        '<path class="d" d="M12 80 L4 24 L36 48 L60 6 L84 48 L116 24 L108 80 Z"/>' +
        '<path class="g" d="M16 36 L36 54 L60 16 L84 54 L104 36 L100 56 L20 56 Z"/>' +
        '<rect class="f2" x="10" y="76" width="100" height="10" rx="3"/>' +
        '<circle class="x" cx="24" cy="66" r="3.5"/><circle class="x" cx="96" cy="66" r="3.5"/>' },
      seal:    { vb: "0 0 120 130", svg:
        '<path class="f2" d="M44 72 L22 128 L38 118 L48 130 L62 86 Z"/><path class="f2" d="M76 72 L98 128 L82 118 L72 130 L58 86 Z"/>' +
        '<circle class="f" cx="60" cy="52" r="44" style="stroke-width:9; stroke-dasharray:5 4.2"/>' +
        '<circle class="f" cx="60" cy="52" r="40" style="stroke:none"/>' +
        '<circle class="d" cx="60" cy="52" r="40"/><ellipse class="g" cx="60" cy="38" rx="30" ry="18"/>' +
        '<circle cx="60" cy="52" r="33" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="2.5"/>' },
      medal:   { vb: "0 0 100 140", svg:
        '<path class="f2" d="M28 0 H72 L62 54 H38 Z"/><path class="x" d="M46 0 H54 L53 54 H47 Z" style="fill:rgba(255,255,255,.55); stroke:none"/>' +
        '<circle class="f" cx="50" cy="94" r="42"/><circle class="d" cx="50" cy="94" r="42"/>' +
        '<circle cx="50" cy="94" r="34" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="3"/><ellipse class="g" cx="50" cy="78" rx="30" ry="18"/>' },
      dogtag:  { vb: "0 0 70 140", svg:
        '<path d="M35 0 V44" fill="none" stroke="#9aa3b0" stroke-width="4" stroke-dasharray="5 4"/>' +
        '<rect class="f" x="6" y="44" width="58" height="90" rx="12"/><rect class="d" x="6" y="44" width="58" height="90" rx="12"/>' +
        '<rect class="g" x="8" y="46" width="54" height="40" rx="10"/>' +
        '<circle cx="35" cy="57" r="5" fill="#0b0d12"/><path d="M6 64 L14 70 L6 76 Z" fill="rgba(0,0,0,.35)"/>' +
        '<rect x="18" y="118" width="34" height="3" fill="rgba(0,0,0,.35)"/><rect x="24" y="124" width="22" height="3" fill="rgba(0,0,0,.35)"/>' },
      burst:   { vb: "0 0 100 100", svg:
        '<path class="f" d="M50.0 5.4 L55.7 25.1 L70.5 7.5 L65.4 30.7 L86.2 21.1 L74.9 38.0 L91.4 40.6 L79.1 50.0 L91.2 59.4 L75.5 62.3 L83.3 76.5 L65.5 69.5 L69.7 90.9 L57.2 81.5 L50.0 93.0 L44.2 75.6 L29.6 92.4 L29.1 76.2 L13.6 79.1 L24.8 62.1 L1.4 61.1 L25.5 50.0 L2.4 39.1 L25.8 38.3 L16.3 23.1 L34.3 30.3 L30.7 9.9 L42.8 18.6 Z"/>' +
        '<path class="d" d="M50.0 5.4 L55.7 25.1 L70.5 7.5 L65.4 30.7 L86.2 21.1 L74.9 38.0 L91.4 40.6 L79.1 50.0 L91.2 59.4 L75.5 62.3 L83.3 76.5 L65.5 69.5 L69.7 90.9 L57.2 81.5 L50.0 93.0 L44.2 75.6 L29.6 92.4 L29.1 76.2 L13.6 79.1 L24.8 62.1 L1.4 61.1 L25.5 50.0 L2.4 39.1 L25.8 38.3 L16.3 23.1 L34.3 30.3 L30.7 9.9 L42.8 18.6 Z"/>' +
        '<ellipse class="g" cx="50" cy="38" rx="26" ry="16"/>' },
      scroll:  { vb: "0 0 180 60", svg:
        '<rect class="f" x="18" y="14" width="144" height="32"/><rect class="d" x="18" y="14" width="144" height="32"/>' +
        '<rect class="g" x="18" y="14" width="144" height="14"/>' +
        '<rect class="f2" x="3" y="5" width="24" height="50" rx="11"/><rect class="f2" x="153" y="5" width="24" height="50" rx="11"/>' +
        '<rect x="9" y="12" width="6" height="36" rx="3" fill="rgba(0,0,0,.3)"/><rect x="165" y="12" width="6" height="36" rx="3" fill="rgba(0,0,0,.3)"/>' }
    };

    /* the gradients every badge shape refers to, once per document */
    function badgeDefs() {
      if (document.getElementById("bx-defs")) return;
      var box = document.createElement("div");
      box.innerHTML =
        '<svg id="bx-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
        '<linearGradient id="bx-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="bx-shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>' +
        '<linearGradient id="bx-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2f5f9"/><stop offset=".45" stop-color="#a7b0bd"/><stop offset=".55" stop-color="#6d7683"/><stop offset="1" stop-color="#c9d1db"/></linearGradient>' +
        "</defs></svg>";
      document.body.appendChild(box.firstChild);
    }
    function badgeHTML(role, design, value, at) {
      var d = BADGE[design] || BADGE.shield;
      return '<div class="c-badge ' + role + " d-" + (BADGE[design] ? design : "shield") +
        (at && at !== "auto" ? " at-" + at : "") + '">' +
        '<svg viewBox="' + d.vb + '" preserveAspectRatio="none">' + d.svg + "</svg>" +
        "<span>" + value + "</span></div>";
    }
    function artUrl(key) {
      var src = key && CONFIG.art && CONFIG.art[key];
      return src ? 'url("' + src + '")' : "none";
    }

    /* ONE CARD FACE. `c` is { rank, tier } or null for a back with nothing
       behind it (the deck pile); `side` picks the painted officer and the
       cloth of the back. Every number is a CSS variable, so a size change is
       a restyle (`sizeNode`) and never a rebuild.

       TWO SHAPES THE BARRACKS' COLLECTION ASKS FOR (`cardNode`): a card whose
       `tier` is null is an OBJECT — no badge, no pips, and the plate says
       "Object" where a rarity would be (the flag and the trap in the round
       keep the camp's tier); and `ghost` is a card the player has never had,
       drawn as its own white silhouette like an unowned sticker, named ???,
       with its grade and its tier badges still on it, in slate. */
    /* THE CAST: one painted officer per army, grade and tier — 120 of them,
       `assets/image/master/stratideck-object-cast-<side>-NN.png` cut four to
       a sheet (tools/lab/cast-sheets.mjs) — so a card is a PERSON, the one
       whose name, age and story the barracks prints on its back. The key is
       worked out, never listed: `castBlue04C` is the blue sergeant at C, and
       `castTurn04C` the RED sergeant at C in the blue army's uniform, painted
       under their red self on the same sheet. A portrait not painted yet
       falls back — the turncoat on the red officer, anyone on the grade's
       face — so every sheet that lands fills its four cards and nothing else
       changes. */
    function castKey(kind, rank, t) {
      return "cast" + (kind === "turn" ? "Turn" : kind === "red" ? "Red" : "Blue") +
             (rank < 10 ? "0" : "") + rank + TIERS[t];
    }
    function castArt(kind, rank, t) {
      return (CONFIG.art && CONFIG.art[castKey(kind, rank, t)]) ||
             (kind === "turn" && CONFIG.art && CONFIG.art[castKey("red", rank, t)]) || "";
    }
    /* NO CREST ON A FACE, and no turncoat's disc under it: the army a card
       fights for is its cloth and its side of the table, and the corner was
       one badge too many beside the grade, the tier and the macaron. A
       turncoat still wears the army's uniform over the camp's face, and the
       back of the card (cardBack) says where they came from. */
    function faceNode(c, fmt, side, ghost) {
      var K = CONFIG.cards, t = c ? clamp(c.tier | 0, 0, TOP_TIER) : 0;
      var def = c ? RANKS[c.rank] : null, officer = c && c.rank <= 10;
      var tiered = !!c && c.tier != null && !ghost;
      badgeDefs();
      var n = document.createElement("div");
      n.className = "card static fmt-" + fmt + " style-" + K.style + " tier-" + TIER_CLS[t] +
        (K.markover ? " mark-over" : "") + (K.rankOn && officer ? " rank-on" : "") +
        (K.tierOn && c && c.tier != null ? " tier-on" : "") + (c ? "" : " back") +
        (c && !officer ? " object" : "") + (ghost ? " ghost" : "");
      n.style.setProperty("--rar", !c ? BACK_RIM : ghost ? GHOST_RIM : tiered ? TIER_COLOR[t] : OBJECT_RIM);
      n.style.setProperty("--team", side === "red" ? RED : BLUE);
      var f = c && K.vary && FOCUS[c.rank] ? FOCUS[c.rank] : [50, 40];
      n.style.setProperty("--fx", f[0] + "%");
      n.style.setProperty("--fy", f[1] + "%");
      n.style.setProperty("--zoom", K.zoom);
      n.style.setProperty("--hero", K.hero + "%");
      n.style.setProperty("--mark", K.mark);
      n.style.setProperty("--mx", K.mx + "%");
      n.style.setProperty("--midz", K.midz);
      n.style.setProperty("--midx", K.midx + "%");
      n.style.setProperty("--midy", K.midy + "%");
      n.style.setProperty("--tinyz", K.tinyz);
      n.style.setProperty("--tinyx", K.tinyx + "%");
      n.style.setProperty("--tinyy", K.tinyy + "%");

      var crest = (CONFIG.art && CREST[side] && CONFIG.art[CREST[side]]) || "";
      var html = '<div class="c-body"><div class="c-frame"></div><div class="c-scene"></div>';
      if (c) {
        /* THE SIDE PICKS THE FACE: the painted officer where the build has
           one, the object-sheet cut where it does not (the trap, the flag),
           and the lab's "missing" plate where there is neither. */
        var turn = officer && side !== "none" && c.o && c.o !== side;
        var kind = turn ? "turn" : (c.o || side);
        var key = side === "red" ? def.red : def.blue;
        if (c.o === "red") key = def.red;
        /* the portrait is the officer's, at the tier they were raised at:
           a promotion changes the frame and never the face */
        var src = (officer && castArt(kind, c.rank, c.base != null ? clamp(c.base | 0, 0, TOP_TIER) : t)) ||
                  (key && CONFIG.art && CONFIG.art[key]) || (def.art && CONFIG.art && CONFIG.art[def.art]) || "";
        var pips = "";
        for (var i = 0; tiered && i < TIER_PIPS[t]; i++) pips += "<i></i>";
        var name = ghost ? "???" : upper(Lang.t(def.name));
        html +=
          '<div class="c-mark' + (c.rank >= 10 ? " two" : "") + '"><b>' + (officer ? c.rank : "") + "</b></div>" +
          '<div class="c-hero' + (src ? "" : " missing") + '" data-missing="' + name + '">' +
            (src ? '<img alt="" src="' + src + '">' : "") + "</div>" +
          badgeHTML("rank", K.brank, officer ? c.rank : "", K.arank) +
          badgeHTML("tier", K.btier, TIERS[t], K.atier) +
          /* the macaron: what this grade is FOR (PERK), on the army's cards
             only — the camp never strikes, so its officers use none of it */
          (officer && side !== "red" && PERK[c.rank]
            ? '<div class="c-perk"><svg viewBox="0 0 24 24" aria-hidden="true">' + PERK[c.rank] + "</svg></div>" : "") +
          '<div class="c-plate"><span class="c-name">' + name +
            '</span><span class="c-tier">' + (ghost ? "" : upper(Lang.t(tiered ? TIER_LABEL[t] : "Object"))) + "</span></div>" +
          '<div class="c-pips">' + pips + "</div>";
      }
      html += '<div class="c-back">' + (crest ? '<img alt="" src="' + crest + '">' : "") + "</div>" +
              '<div class="c-shine"></div></div>';
      n.innerHTML = html;
      return n;
    }
    /* THE SIZE, and the one number the lab reads in pixels: the scene's blur,
       tuned at a 300px card, is scaled with the card or a small one turns to
       fog.

       AND THE BADGES AT A PLAYING SIZE. Everything on a card is a percent of
       its width, which is what lets one stylesheet draw three formats — and
       it is also what makes the two numbers a fight is decided on shrink with
       the card: the lab's full card is composed at 300px, the hand is dealt
       at 125 to 160. So under FIT_AT a card wears `fit` and `--fit`, and the
       SKIN scales its two badges by that much and nothing else: the picture
       may be small, the grade and the tier may not. The token (tiny) is
       exempt — its badges were already re-measured for a small card. */
    var FIT_AT = { full: 220, mid: 200 }, FIT_MAX = 1.7;
    function sizeNode(n, w, fmt) {
      n.style.setProperty("--w", w + "px");
      n.style.setProperty("--h", (fmt === "full" ? Math.round(w * 1.4) : w) + "px");
      n.style.setProperty("--blur", (CONFIG.cards.blur * w / 300).toFixed(2) + "px");
      var fit = FIT_AT[fmt] ? clamp(FIT_AT[fmt] / w, 1, FIT_MAX) : 1;
      n.style.setProperty("--fit", fit.toFixed(2));
      n.classList.toggle("fit", fit > 1.01);
    }
    /* The barracks' door into this builder: `c` is { rank, tier }, `opt` is
       { fmt, w, side, ghost }. The scene is the first band's, which is the
       camp the player's army was raised in. `side: "none"` is a card of
       neither army — an object — and wears no crest. */
    function cardNode(c, opt) {
      opt = opt || {};
      var fmt = opt.fmt || "full";
      var n = faceNode(c, fmt, opt.side || "blue", !!opt.ghost);
      sizeNode(n, opt.w || 120, fmt);
      n.style.setProperty("--bgi", artUrl(CONFIG.bands[0].scene));
      return n;
    }

    /* THE BACK OF AN OFFICER'S FILE, for the barracks (packages/webshell/
       army.js, openFile). It is the same card turned over: the frame, the
       rim, the grade, the tier, the macaron and the pips of the face, so the
       back is visibly the same object — with the officer standing small in a
       window at its head and their file under it. `info` is written by the
       barracks, already in the player's language and already in capitals
       where it shouts: { grade, first, last, facts: [], skill, lore, army, turn }.
       Every line is text written into a node, never markup — a name like
       O'Ween and a lore with quotes in it are data. */
    function cardBack(c, opt, info) {
      opt = opt || {};
      var n = cardNode(c, { fmt: "full", w: opt.w || 300, side: opt.side || "blue" });
      n.classList.add("file");
      var body = n.querySelector(".c-body");
      function line(parent, tag, cls, str) {
        var e = document.createElement(tag);
        e.className = cls;
        if (str != null) e.textContent = str;
        parent.appendChild(e);
        return e;
      }
      var sheet = line(body, "div", "cf-file");
      var plate = line(sheet, "div", "cf-plate");
      if (info.first) line(plate, "span", "cf-first", info.first);
      line(plate, "span", "cf-last", info.last);
      line(plate, "span", "cf-grade", info.grade);
      if (info.facts && info.facts.length) {
        var facts = line(sheet, "div", "cf-facts");
        for (var i = 0; i < info.facts.length; i++) line(facts, "span", "", info.facts[i]);
      }
      /* the grade's ability, under the macaron's own pictogram */
      if (info.skill) {
        var skill = line(sheet, "div", "cf-skill");
        if (PERK[c.rank]) skill.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + PERK[c.rank] + "</svg>";
        line(skill, "p", "", info.skill);
      }
      var lore = line(sheet, "div", "cf-lore");
      var crest = CONFIG.art && CREST[opt.side] && CONFIG.art[CREST[opt.side]];
      if (crest) {
        var wm = line(lore, "img", "cf-wm");
        wm.alt = ""; wm.src = crest;
      }
      line(lore, "p", "", info.lore || "");
      /* an object fights for neither army: no foot */
      if (info.army) {
        var foot = line(sheet, "div", "cf-foot");
        line(foot, "span", "", info.army);
        if (info.turn) line(foot, "span", "turn", info.turn);
      } else n.classList.add("footless");
      return n;
    }

    /* ===================================================================
       THE TABLE — the round's cards, placed every frame
       One layer of card nodes between the painted scene and the canvas
       (z-index -1, after .frame-art): the canvas above it still draws what is
       not a card — the halo round a target, the bandage on a wounded card,
       every word, the Fx — which therefore lands ON the cards. A node is kept
       per SLOT ("g2.3" a cell, "h1" a hand slot, "p0" the pile, "last"), so a
       card that moves from one frame to the next is the same node moved, and
       a style is written only when it changed: a frame where nothing moves
       touches nothing.
       =================================================================== */
    var Table = { root: null, top: null, crown: null, sheet: null, foe: null, panel: null,
                  duel: null, duelBack: null,
                  nodes: {}, seen: {}, z: 1, panelAt: "" };

    function tableRoot() {
      if (Table.root) return Table.root;
      var canvas = document.getElementById("game");
      var root = document.createElement("div");
      root.className = "cd-layer";
      canvas.parentNode.insertBefore(root, canvas);
      Table.panel = document.createElement("div");
      Table.panel.className = "cd-panel";
      root.appendChild(Table.panel);
      Table.root = root;
      /* THE CARD UNDER THE FINGER IS ABOVE THE CANVAS. Everything else on the
         table sits under it so the canvas can paint the halos and the Fx on
         the cards — but a card being dragged crosses the camp, and the camp's
         halos and dashes painted over it read as a card turning translucent
         in the hand. The one layer over the canvas holds that token and
         nothing else. */
      var top = document.createElement("div");
      top.className = "cd-layer cd-top";
      canvas.parentNode.insertBefore(top, canvas.nextSibling);
      Table.top = top;
      /* THE ENEMY'S CORNER, top right, is over the HUD's own gradient: the
         commander and the pile of what the camp has lost are the enemy's
         side of the table, and a veil over them would push them back into
         the scene. Appended last, at the HUD's depth, so it lands on it. */
      var crown = document.createElement("div");
      crown.className = "cd-layer cd-crown";
      canvas.parentNode.appendChild(crown);
      Table.crown = crown;
      Table.foe = document.createElement("img");
      Table.foe.className = "cd-foe"; Table.foe.alt = "";
      root.insertBefore(Table.foe, Table.panel);          // behind the board
      /* THE DUEL'S LAYER, over the canvas and under the HUD: the two big
         cards of a fight, on a dim of their own. */
      var duel = document.createElement("div");
      duel.className = "cd-layer cd-duel";
      Table.duelBack = document.createElement("div");
      Table.duelBack.className = "cd-duel-back";
      duel.appendChild(Table.duelBack);
      canvas.parentNode.insertBefore(duel, top.nextSibling);
      Table.duel = duel;
      /* THE LISTS: the infirmary, the prison and the beaten pile open one
         sheet over the round, above the callouts. It takes no pointer — the
         canvas under it still gets the tap, and onDown closes it. */
      var sh = document.createElement("div");
      sh.className = "cd-layer cd-sheet";
      canvas.parentNode.appendChild(sh);
      Table.sheet = sh;
      /* The cards are the round's and nothing else's: a menu the web shell
         draws over a cleared canvas must not find a camp still standing under
         it. The end screen keeps them, as it keeps the canvas's last frame. */
      onState(function (s) {
        root.style.visibility = (s === "playing" || s === "end") ? "" : "hidden";
        top.style.visibility = s === "playing" ? "" : "hidden";
        crown.style.visibility = s === "playing" ? "" : "hidden";
        duel.style.visibility = s === "playing" ? "" : "hidden";
        if (s !== "playing") {
          sheetClose();
          cursorOn = false; canvas.style.cursor = "";
        }
      });
      return root;
    }
    function tableClear() {
      var root = tableRoot(), k;
      for (k in Table.nodes) if (Table.nodes.hasOwnProperty(k)) Table.nodes[k].parentNode.removeChild(Table.nodes[k]);
      Table.nodes = {};
      root.style.setProperty("--bgi", artUrl(BAND.scene));
      root.style.visibility = "";
    }
    function styleOnce(n, prop, v) {
      if (n._s[prop] !== v) { n._s[prop] = v; n.style[prop] = v; }
    }
    function place(key, c, x, y, w, h, fmt, opt) {
      var side = opt.side || "blue", down = !!opt.down || !c;
      var sig = (c ? c.rank + "." + c.tier + (c.o || "") : "x") + "." + side + "." + fmt + "." + Lang.code();
      var n = Table.nodes[key];
      if (!n || n._sig !== sig) {
        if (n) n.parentNode.removeChild(n);
        n = faceNode(c, fmt, side);
        n._sig = sig; n._s = {}; n._w = 0; n._down = !c; n._seen = false;
        if (opt.still) n.classList.add("still");
        (opt.layer ? Table[opt.layer] : Table.root).appendChild(n);
        Table.nodes[key] = n;
      }
      Table.seen[key] = true;
      styleOnce(n, "display", "");
      if (n._w !== w) { sizeNode(n, w, fmt); n._w = w; }
      if (c && n._down !== down) {
        n.classList.toggle("back", down);
        n.style.setProperty("--rar", down ? BACK_RIM : TIER_COLOR[c.tier]);
        n._down = down;
      }
      if (opt.pile && !n._pile) { n.classList.add("pile"); n._pile = true; }
      var seen = down && !!opt.seen;
      if (n._seen !== seen) { n.classList.toggle("seen", seen); n._seen = seen; }
      var dimmed = !!opt.dim;
      if (n._dim !== dimmed) { n.classList.toggle("dim", dimmed); n._dim = dimmed; }
      var shine = opt.shine || 0;
      if (n._shine !== shine) {
        n.classList.toggle("lit", shine > 0);
        n.classList.toggle("hot", shine > 1);
        n._shine = shine;
      }
      if (opt.delay != null && n._delay !== opt.delay) {
        n.style.setProperty("--sd", opt.delay.toFixed(2) + "s");
        n._delay = opt.delay;
      }
      var sx = opt.scale || 1, sy = sx;
      if (opt.flip != null) sx *= Math.max(0.02, Math.abs(Math.cos(opt.flip * Math.PI)));
      var tf = "translate(" + (x - w / 2).toFixed(1) + "px," + (y - h / 2).toFixed(1) + "px)";
      if (opt.rot) tf += " rotate(" + opt.rot.toFixed(3) + "rad)";
      if (sx !== 1 || sy !== 1) tf += " scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";
      styleOnce(n, "transform", tf);
      styleOnce(n, "opacity", opt.alpha != null ? String(Math.round(clamp(opt.alpha, 0, 1) * 100) / 100) : "1");
      styleOnce(n, "zIndex", String(Table.z++));
    }
    function tableBegin() {
      tableRoot();
      Table.seen = {}; Table.z = 1;
      Table.root.classList.toggle("flat", !Art.scene());
    }
    function tableEnd() {
      for (var k in Table.nodes) {
        if (Table.nodes.hasOwnProperty(k) && !Table.seen[k]) styleOnce(Table.nodes[k], "display", "none");
      }
    }
    /* The camp's panel is part of the table, UNDER the cards: on the canvas
       it would be a veil over them. */
    function panel(x, y, w, h) {
      var at = Math.round(x) + "," + Math.round(y) + "," + Math.round(w) + "," + Math.round(h);
      if (Table.panelAt === at) return;
      Table.panelAt = at;
      var s = Table.panel.style;
      s.left = Math.round(x) + "px"; s.top = Math.round(y) + "px";
      s.width = Math.round(w) + "px"; s.height = Math.round(h) + "px";
    }

    /* One card, about its centre, `w` wide: the node on the table, and what
       the canvas paints over it. `fmt` is the lab's format — "full" (5:7, the
       hand), "mid" or "tiny" (squares, the camp) — and it decides the height.
       `side` is blue (the army) or red (the camp); `down` a face-down card;
       `seen` a face-down card the player has already turned over once;
       `shine` a target the player may strike (1, or 2 while a card is
       picked); `lit` the canvas ring, for the hand and the token. */
    function drawCard(key, c, x, y, w, opt) {
      opt = opt || {};
      var fmt = opt.fmt || "full", h = fmt === "full" ? Math.round(w * 1.4) : w;
      place(key, c, x, y, w, h, fmt, opt);
      var lit = opt.lit || 0, hurt = c && c.hurt && !opt.down, stun = c && c.stun && !opt.down;
      if (lit <= 0 && !hurt && !stun) return;
      ctx.save();
      ctx.translate(x, y);
      if (opt.rot) ctx.rotate(opt.rot);
      if (opt.scale) ctx.scale(opt.scale, opt.scale);
      if (opt.alpha != null) ctx.globalAlpha = clamp(opt.alpha, 0, 1);
      if (opt.flip != null) ctx.scale(Math.max(0.02, Math.abs(Math.cos(opt.flip * Math.PI))), 1);
      var r = w * (fmt === "tiny" ? 0.16 : fmt === "mid" ? 0.05 : 0.06);
      if (lit > 0) {
        /* THE HALO IS A RING, NOT A FILL: it is painted over the card now,
           and a gold wash over a painted officer is a card nobody can read. */
        roundRect(ctx, -w / 2 - 7, -h / 2 - 7, w + 14, h + 14, r + 7);
        ctx.lineWidth = 9; ctx.strokeStyle = rgba(GOLD, 0.12 + 0.18 * lit); ctx.stroke();
        roundRect(ctx, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8, r + 4);
        ctx.lineWidth = 3 + 2 * lit; ctx.strokeStyle = rgba(GOLD, 0.45 + 0.5 * lit); ctx.stroke();
      }
      if (stun) drawStun(w, h, r);
      else if (hurt) drawWound(w, h, r);
      ctx.restore();
    }

    /* STUNNED, AND IT IS THE SKULL THAT DID IT: a violet veil — a wound's
       veil says "not this turn", this one "not this battle" — and the skull
       that stunned it, in the Lucide stroke (assets/motor/lucide/skull.svg)
       replayed through Path2D like the drop. */
    var SKULL_PATHS = ["m12.5 17-.5-1-.5 1h1z",
      "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"];
    var skullShapes = null;
    function drawStun(w, h, r) {
      roundRect(ctx, -w / 2, -h / 2, w, h, r);
      ctx.fillStyle = "rgba(34,12,60,.66)"; ctx.fill();
      if (!skullShapes) skullShapes = SKULL_PATHS.map(function (d) { return new Path2D(d); });
      var s = Math.min(w, h) * 0.5 / 24;
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-12, -12);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineWidth = 3.4; ctx.strokeStyle = "rgba(10,0,20,.8)";
      for (var i = 0; i < skullShapes.length; i++) ctx.stroke(skullShapes[i]);
      ctx.lineWidth = 2; ctx.strokeStyle = "#d9c2ff";
      for (i = 0; i < skullShapes.length; i++) ctx.stroke(skullShapes[i]);
      ctx.fillStyle = "#d9c2ff";
      ctx.beginPath(); ctx.arc(15, 12, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(9, 12, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    /* A WOUND, AND IT IS A DROP OF BLOOD AND A VEIL. The veil is what says the
       card cannot be sent — a greyed card reads as unavailable in any game —
       and the drop is what says why. A red cross said the opposite: it is the
       sign of the medic, not of the hurt. The drop is an SVG path (24-unit
       box) replayed through Path2D, filled with a lit gradient and a white
       glint so it reads as liquid rather than as a red pictogram. */
    var DROP_PATH = "M12 1.5C12 1.5 4.2 10.4 4.2 15.6a7.8 7.8 0 0 0 15.6 0C19.8 10.4 12 1.5 12 1.5z";
    var dropShape = null;
    function drawWound(w, h, r) {
      roundRect(ctx, -w / 2, -h / 2, w, h, r);
      ctx.fillStyle = "rgba(8,10,22,.6)"; ctx.fill();
      if (!dropShape) dropShape = new Path2D(DROP_PATH);
      var s = Math.min(w, h) * 0.46 / 24;
      ctx.save();
      ctx.scale(s, s);
      ctx.translate(-12, -13);
      var g = ctx.createLinearGradient(6, 3, 18, 24);
      g.addColorStop(0, "#ff6b6b"); g.addColorStop(0.55, "#d61f2c"); g.addColorStop(1, "#6e0710");
      ctx.fillStyle = g; ctx.fill(dropShape);
      ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(20,0,4,.85)"; ctx.stroke(dropShape);
      ctx.beginPath();
      ctx.ellipse(9.2, 15.2, 1.6, 3.2, 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fill();
      ctx.restore();
    }

    /* ===================================================================
       RENDER
       =================================================================== */
    function cellKey(r, c) { return "g" + r + "." + c; }

    function drawGrid() {
      var r, c, T = turn;
      panel(G.gx0 - 14, G.gy0 - 14, G.gw + 28, G.gh + 28);
      var hot = selected >= 0 || (drag && drag.moved) ? 2 : 1;
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var x = cellX(c) + G.cw / 2, y = cellY(r) + G.ch / 2, cell = grid[r][c];
        var busy = T && T.r === r && T.c === c;
        var sliding = march && march.state === "slide";
        if (sliding && ((march.from.r === r && march.from.c === c) || (march.to.r === r && march.to.c === c))) {
          if (cell !== march.q) continue;               // the cell it left: no dashes under the slide
          var km = ease(Math.min(1, march.t / MARCH));
          var fx = cellX(march.from.c) + G.cw / 2, fy = cellY(march.from.r) + G.ch / 2;
          drawCard(cellKey(r, c), cell, fx + (x - fx) * km, fy + (y - fy) * km, G.cw,
                   { fmt: G.fmt, side: "red", down: cell !== lastFoe, seen: cell.known, still: true,
                     rot: cell.tilt * km, scale: 1 + 0.08 * Math.sin(km * Math.PI) });
          continue;
        }
        if (!cell) {
          /* an emptied cell: the path the army walks. Not under a fight — the
             canvas is over the cards, so its dashes would be painted across
             the card falling or the flag being shown. */
          if (busy) continue;
          roundRect(ctx, cellX(c), cellY(r), G.cw, G.ch, G.cw * 0.11);
          ctx.fillStyle = reach[r + "," + c] ? rgba(GOLD, 0.07) : "rgba(255,255,255,.03)"; ctx.fill();
          ctx.setLineDash([7, 8]); ctx.lineWidth = 2;
          ctx.strokeStyle = reach[r + "," + c] ? rgba(GOLD, 0.28) : "rgba(255,255,255,.1)"; ctx.stroke();
          ctx.setLineDash([]);
          continue;
        }
        if (busy && T.state !== "fly") continue;   // drawn by drawTurn
        var key = cellKey(r, c), target = isTarget(r, c) && !T;
        /* A moved card keeps its tilt everywhere it is drawn (`tilt`, set on
           its first move); the one about to move rises a little first. */
        /* the card turned over before this one, going back face down */
        if (hiding && hiding.card === cell) {
          var k = Math.min(1, hiding.t);
          drawCard(key, cell, x, y, G.cw, { fmt: G.fmt, side: "red", down: k >= 0.5, flip: k,
                   seen: true, still: true, rot: cell.tilt || 0 });
          continue;
        }
        var up = cell === lastFoe;
        /* THE CAMP HOLDS STILL. Thirty-six shimmering frames are thirty-six
           repaints a frame for a decoration nobody is looking at: only the
           cards the player may strike catch the light, a gloss swept across
           them in a wave down the camp, faster once a card is picked. */
        var lift = march && march.state === "think" && march.q === cell ? 1.06 : 1;
        drawCard(key, cell, x, y, G.cw, { fmt: G.fmt, side: "red", down: !up, seen: cell.known, still: true,
                 shine: target && !march ? hot : 0, delay: (r + c) * 0.12,
                 rot: cell.tilt || 0, scale: lift,
                 alpha: !isTarget(r, c) && !up ? 0.82 : 1 });
      }
    }

    /* The turn's own drawing: the token in flight, the enemy turning over,
       the clash and the two cards' exits. The token is one node ("tok") from
       the moment it leaves to the moment it goes, and the enemy keeps its
       cell's; the hand card it came from is drawHand's and stays put. */
    function drawTurn() {
      var T = turn;
      if (!T) return;
      var tx = cellX(T.c) + G.cw / 2, ty = cellY(T.r) + G.ch / 2;
      var fk = cellKey(T.r, T.c), tw = G.tw;
      var ox = tx + G.ax, oy = ty + G.ay;
      var v = T.verdict, k;
      var tok = { fmt: FIGHT_FMT, side: "blue" };
      if (T.state === "fly") {
        k = ease(Math.min(1, T.t / FLY));
        tok.scale = T.from.s + (1 - T.from.s) * k; tok.rot = -0.12 * (1 - k);
        drawCard("tok", T.a, T.from.x + (ox - T.from.x) * k, T.from.y + (oy - T.from.y) * k - 40 * Math.sin(k * Math.PI), tw, tok);
        return;
      }
      if (T.state === "flip") {
        k = Math.min(1, T.t / FLIP);
        /* the swap to the fight's format happens edge-on, where it cannot be
           seen; a card already face up does not show its back on the way */
        var turnOver = !T.wasUp || G.fmt !== FIGHT_FMT;
        drawCard(fk, T.foe, tx, ty, G.cw, { fmt: k < 0.5 ? G.fmt : FIGHT_FMT, side: "red",
                 down: !T.wasUp && k < 0.5, seen: T.foe.known, flip: turnOver ? k : null,
                 scale: 1 + 0.1 * Math.sin(k * Math.PI), still: true });
        tok.rot = -0.08;
        drawCard("tok", T.a, ox, oy, tw, tok);
        return;
      }
      var won = v.kind === "win" || v.kind === "flag" || v.kind === "clear" || v.kind === "smash" || v.kind === "scout";
      var lost = v.kind === "lose" || v.kind === "trap";
      /* turned away by an object: the object holds, the token is thrown back */
      var turned = !!TURNED[v.kind] || v.kind === "spell";
      /* A CAPTIVE DOES NOT FALL. The cell is taken, so the camp is one card
         lighter either way, but the picture has to say which of the two
         happened: a card that fades out is gone and a card that walks off is
         one the player may be offered at the end. */
      var spared = v.kind === "win" && v.hurt === "d";
      var foe = { fmt: FIGHT_FMT, side: "red", still: true };
      if (T.state === "clash") {
        k = Math.min(1, T.t / CLASH);
        var kick = v.kind === "flag" ? 0 : Math.max(0, 1 - k * 4);
        // the enemy, face up, kicked back if it fell; the flag rises instead
        foe.scale = v.kind === "flag" ? 1.06 + 0.16 * ease(k) : 1.06;
        foe.lit = v.kind === "flag" ? ease(k) : 0;
        drawCard(fk, T.foe, tx + (won ? 10 * kick : 0), ty - (won ? 8 * kick : 0), G.cw, foe);
        // the token, in front, kicked back if it fell or was turned away
        var back = lost || turned;
        tok.rot = -0.08 + (back ? 0.1 * kick : 0); tok.scale = won ? 1.08 : 1;
        if (v.kind === "flag") tok.alpha = 1 - ease(k);
        drawCard("tok", T.a, ox - (back ? 12 * kick : 0), oy + (back ? 10 * kick : 0), tw, tok);
        return;
      }
      if (T.state === "duel") {
        // the board holds still under the big duel
        foe.scale = 1.06;
        drawCard(fk, T.foe, tx, ty, G.cw, foe);
        tok.rot = -0.08;
        drawCard("tok", T.a, ox, oy, tw, tok);
        drawDuel(T);
        return;
      }
      if (T.state === "reveal") {
        // the flag, raised and lit, breathing, until the victory is declared
        var pulse = 0.5 + 0.5 * Math.sin(T.t * 6);
        foe.scale = 1.22 + 0.04 * pulse; foe.lit = 0.7 + 0.3 * pulse;
        drawCard(fk, T.foe, tx, ty, G.cw, foe);
        return;
      }
      // settle: the loser goes, the token goes with the fight
      k = ease(Math.min(1, T.t / SETTLE));
      /* an enemy that stays on its cell settles back into the camp's format,
         edge-on again for the swap, when the camp is not dealt tiny */
      var stay = function () {
        var back = G.fmt !== FIGHT_FMT;
        drawCard(fk, T.foe, tx, ty, G.cw, { fmt: back && k >= 0.5 ? G.fmt : FIGHT_FMT, side: "red", still: true,
                 flip: back ? k : null, scale: 1.06 - 0.06 * k });
      };
      /* A token that won goes back to the bottom of the deck, and flies to
         the pile to say so; a wounded one flies back to its slot, where the
         card comes back into the hand. */
      var px = G.deckX + G.deckW / 2, py = G.deckY + G.deckH / 2, ps = 0.75 * G.deckW / tw;
      var hx = handX(T.i) + HAND_W / 2, hy = G.handY + HAND_H / 2, hs = HAND_W / tw;
      var home = function (toSlot) {
        var slot = toSlot || v.hurt === "a";
        var gx = slot ? hx : px, gy = slot ? hy : py, gs = slot ? hs : ps;
        tok.scale = 1.08 + (gs - 1.08) * k; tok.rot = -0.08 * (1 - k);
        drawCard("tok", T.a, ox + (gx - ox) * k, oy + (gy - oy) * k - 50 * Math.sin(k * Math.PI), tw, tok);
      };
      var fade = function () {
        tok.alpha = 1 - k; tok.scale = 1 - 0.35 * k; tok.rot = -0.08 - 0.5 * k;
        drawCard("tok", T.a, ox, oy + 40 * k, tw, tok);
      };
      if (v.kind === "scout" || v.kind === "decoy") {
        // back to the bottom of the deck
        stay();
        home();
      } else if (v.kind === "block" || v.kind === "stun") {
        // back to its own slot, where it lands (stunned, it lands for good)
        stay();
        home(true);
      } else if (v.kind === "stray") {
        // into the trees: it drifts off the cell, shrinking, and is gone
        stay();
        tok.alpha = 1 - k; tok.scale = 1 - 0.5 * k; tok.rot = -0.08 + 0.6 * k;
        drawCard("tok", T.a, ox - 30 * k, oy - 60 * k, tw, tok);
      } else if (v.kind === "spell") {
        // the fight was the duel; what survived it goes back to its slot
        stay();
        if (v.deadA) fade(); else home(true);
      } else if (won) {
        if (spared) {
          // led away: sideways off the cell, upright, rather than face down
          foe.alpha = 1 - k; foe.scale = 1 - 0.15 * k; foe.rot = -0.15 * k;
          drawCard(fk, T.foe, tx + 70 * k, ty - 10 * k, G.cw, foe);
        } else {
          foe.alpha = 1 - k; foe.scale = 1 - 0.3 * k; foe.rot = 0.3 * k;
          drawCard(fk, T.foe, tx, ty + 30 * k, G.cw, foe);
        }
        home();
      } else if (lost) {
        stay();
        fade();
      } else {                                              // tie: both go
        foe.alpha = 1 - k; foe.scale = 1 - 0.3 * k; foe.rot = 0.4 * k;
        drawCard(fk, T.foe, tx + 20 * k, ty - 20 * k, G.cw, foe);
        tok.alpha = 1 - k; tok.scale = 1 - 0.3 * k; tok.rot = -0.5 * k;
        drawCard("tok", T.a, ox - 20 * k, oy + 30 * k, tw, tok);
      }
    }

    /* The edge of the frame says how it went, at the impact: blue the
       army won, red it lost, gold a draw or a win that cost a wound. */
    function duelGlow(v) {
      var c = v.kind === "spell" ? "rgba(155,107,255,.9)"
            : v.kind === "lose" || v.kind === "trap" ? "rgba(255,70,70,.9)"
            : v.kind === "tie" || v.hurt === "a" ? "rgba(255,212,59,.9)"
            : "rgba(90,169,255,.9)";
      Overlay.vignette(c, 1, 900);
    }

    /* THE DUEL, BIG. The two cards of the fight at full size over the
       table, the army's on the left and the camp's on the right: the WINNER
       is the one that moves — it winds up, lunges and lands — and the loser
       is knocked back, shaken and greyed. `duelBack` is the dim behind them.

       One pose function per card, read off the duel's clock; everything is
       the card nodes the table already builds, in their own layer above the
       canvas. */
    var DUEL_W = 312;             // may touch or cross the frame's edges mid-fight
    function duelPose(t, side, role) {
      var dir = side === "a" ? 1 : -1;            // +1: towards the camp's card
      var p = { dx: 0, rot: 0, scale: 1, alpha: 1, dim: false };
      var e = ease(clamp(t / D_IN, 0, 1));
      p.dx = -dir * 280 * (1 - e); p.scale = 0.7 + 0.3 * e; p.alpha = e;
      var reach = role === "tie" ? 58 : 118;
      if (role === "win" || role === "tie") {
        if (t > D_IN && t <= D_WIND) p.dx = -dir * 26 * ease((t - D_IN) / (D_WIND - D_IN));
        else if (t > D_WIND && t <= D_HIT) {
          var u = (t - D_WIND) / (D_HIT - D_WIND);
          p.dx = -dir * 26 + dir * (26 + reach) * u * u; p.scale = 1 + 0.08 * u;
        } else if (t > D_HIT) {
          var b = ease(clamp((t - D_HIT) / (D_KNOCK - D_HIT), 0, 1));
          p.dx = dir * reach * (1 - b); p.scale = 1.08 - 0.08 * b;
        }
        p.rot = dir * 0.05;
      }
      if ((role === "lose" || role === "tie") && t > D_HIT) {
        var q = ease(clamp((t - D_HIT) / (D_KNOCK - D_HIT), 0, 1));
        var shake = Math.sin((t - D_HIT) * 70) * 10 * (1 - q);
        var back = role === "tie" ? 36 : 50;
        p.dx += -dir * back * q + shake;
        p.rot = -dir * 0.32 * q;
        p.alpha = 1 - 0.35 * q; p.dim = true;
      }
      if (t > D_OUT) {
        var o = clamp((t - D_OUT) / (DUEL - D_OUT), 0, 1);
        p.alpha *= 1 - o; p.scale *= 1 - 0.1 * o;
      }
      return p;
    }
    function drawDuel(T) {
      var v = T.verdict, t = T.t;
      /* the book's spell: the right-hand card is the ALLY it turned on, in
         blue, and the fight is the one bewitch() settled */
      var spell = v.kind === "spell", them = spell ? v.b : T.foe;
      var aw = spell ? v.res === "win" : v.kind === "win" || v.kind === "clear" || v.kind === "smash";
      var fw = spell ? v.res === "lose" : v.kind === "lose" || v.kind === "trap";
      var ra = aw ? "win" : fw ? "lose" : "tie", rf = fw ? "win" : aw ? "lose" : "tie";
      var cx = Layout.cx, h = Math.round(DUEL_W * 1.4);
      var cy = clamp(G.gy0 + G.gh / 2, Layout.top + h / 2 - 20, G.handY - h / 2);
      var gap = DUEL_W / 2 + 24;
      var dim = Math.min(clamp(t / D_IN, 0, 1), 1 - clamp((t - D_OUT) / (DUEL - D_OUT), 0, 1));
      var bs = Table.duelBack.style, op = (0.8 * dim).toFixed(2);
      if (bs.opacity !== op) bs.opacity = op;
      var pa = duelPose(t, "a", ra), pf = duelPose(t, "f", rf);
      // the winner is drawn last, so its lunge lands ON the loser
      var order = rf === "win" ? [["a", pa], ["f", pf]] : [["f", pf], ["a", pa]];
      for (var i = 0; i < 2; i++) {
        var who = order[i][0], P = order[i][1];
        var x = cx + (who === "a" ? -gap : gap) + P.dx;
        drawCard(who === "a" ? "duelA" : "duelF", who === "a" ? T.a : them, x, cy, DUEL_W,
                 { fmt: "full", side: who === "a" || spell ? "blue" : "red", layer: "duel", still: true,
                   rot: P.rot, scale: P.scale, alpha: P.alpha, dim: P.dim });
      }
    }

    /* A picked card rises this far out of its slot, and a dragged one's token
       rides this far above the finger, at this scale. */
    var LIFT_SEL = 22, DRAG_UP = 30, DRAG_S = 1.1;

    function slotDashes(i) {
      roundRect(ctx, handX(i), G.handY, HAND_W, HAND_H, HAND_W * 0.06);
      ctx.fillStyle = "rgba(255,255,255,.035)"; ctx.fill();
      ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.stroke();
      ctx.setLineDash([]);
    }

    /* The hand. A card being PLAYED is its token: the moment it is dragged
       out, or sent from a tap, the big card leaves its slot and the tiny one
       is the only picture of it on the table — two pictures of one card read
       as two cards. It comes back into the slot only when it comes back to
       the hand (wounded), and otherwise the next card is dealt into it.

       The slot's dashes are painted on the canvas, which is OVER the cards,
       so they are only drawn where no card is standing: dashes across a card
       are what made a picked card look see-through. */
    function drawHand() {
      var i, j, T = turn;
      var px = G.deckX + G.deckW / 2, py = G.deckY + G.deckH / 2, ps = G.deckW / HAND_W;
      for (i = 0; i < handSize; i++) {
        var x = handX(i) + HAND_W / 2, y = G.handY + HAND_H / 2;
        /* the ally a spell turned the card on has stepped into the duel: one
           picture of it, not two */
        var called = T && T.state === "duel" && T.verdict.kind === "spell" && T.verdict.ally === i;
        var played = (T && T.i === i) || (drag && drag.moved && drag.i === i && !T) || called;
        if (played || hand[i] == null) { slotDashes(i); continue; }
        var arriving = null;
        for (j = 0; j < refills.length; j++) if (refills[j].slot === i) arriving = refills[j];
        if (arriving) {
          var ka = ease(Math.min(1, arriving.t));
          drawCard("h" + i, hand[i], px + (x - px) * ka, py + (y - py) * ka, HAND_W,
                   { down: ka < 0.5, flip: ka * 0.5 + 0.5, scale: ps + (1 - ps) * ka });
          continue;
        }
        var sel = selected === i && !T;
        drawCard("h" + i, hand[i], x, sel ? y - LIFT_SEL : y, HAND_W, { lit: sel ? 1 : 0, scale: sel ? 1.06 : 1 });
      }
      /* the dragged card's token, over the canvas, under the finger */
      if (drag && drag.moved && hand[drag.i] != null && !T) {
        drawCard("drag", hand[drag.i], drag.x, drag.y - DRAG_UP, G.tw,
                 { fmt: FIGHT_FMT, layer: "top", lit: 1, scale: DRAG_S,
                   rot: (drag.x - (handX(drag.i) + HAND_W / 2)) / 1800 });
      }
    }

    /* A number on a card node: the deck's count as a watermark across its
       top card, the beaten pile's as a badge. DOM, because both piles are
       card nodes and the pile in the corner stands over the canvas. */
    function countOn(key, v, cls) {
      var n = Table.nodes[key];
      if (!n) return;
      var b = n._count;
      if (!b) {
        b = document.createElement("b");
        /* a watermark is clipped by the card it is printed on, so it goes in
           the card's body (overflow hidden, the card's own corners); a badge
           hangs off the corner, so it goes on the node */
        var into = cls && cls.indexOf("wm") >= 0 ? n.querySelector(".c-body") || n : n;
        into.appendChild(b); n._count = b; b._t = null;
      }
      var txt = v == null ? "" : String(v), c = "c-count" + (cls ? " " + cls : "");
      if (b._t !== txt) { b.textContent = txt; b._t = txt; }
      if (b.className !== c) b.className = c;
    }

    /* A tent of the village, and the door to its list. The picture is the
       hub's own (`art.objects`: infirmary, prison); a build with no artwork
       draws a plain plate with the word, which is all the door needs. */
    function drawDoor(role, x, count, tint) {
      var img = art(role), y = G.doorY, w = G.doorW, h = G.doorH;
      var open = sheet && sheet.kind === role;
      ctx.save();
      /* the pad it stands on, in its own colour: the prison is a black tent
         and a black tent on a night scene is a door nobody finds */
      ctx.save();
      ctx.translate(x + w / 2, y + h * 0.9);
      ctx.scale(1, 0.32);
      var halo = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.55);
      halo.addColorStop(0, rgba(tint, 0.55)); halo.addColorStop(1, rgba(tint, 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, w * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (img) {
        ctx.globalAlpha = count || open ? 1 : 0.88;
        ctx.drawImage(img, x, y, w, h);
      } else {
        roundRect(ctx, x + 8, y + 8, w - 16, h - 12, 12);
        ctx.fillStyle = rgba(tint, 0.25); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = rgba(tint, 0.7); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = font(15, 900); ctx.fillStyle = rgba(INK, open ? 1 : 0.8);
      ctx.fillText(upper(Lang.t(role === "infirmary" ? "Infirmary" : "Prison")), x + w / 2, y + h + 13);
      if (count) {
        var bx = x + w - 12, by = y + 10;
        ctx.beginPath(); ctx.arc(bx, by, 15, 0, Math.PI * 2);
        ctx.fillStyle = tint; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(8,10,22,.85)"; ctx.stroke();
        ctx.font = font(17, 900); ctx.fillStyle = "#fff";
        ctx.fillText(String(count), bx, by + 1);
      }
      ctx.restore();
    }

    /* The enemy's corner: the commander behind his camp, reacting to the
       last fight, and the pile of the camp's losses, the last one beaten face
       up on top. */
    function drawCrown() {
      var f = Table.foe;
      if (!f._s) f._s = {};
      var key = mood === "happy" ? "enemyHappy" : mood === "sad" ? "enemySad" : "enemyNeutral";
      var src = (CONFIG.art && CONFIG.art[key]) || "";
      if (f._src !== src) { f._src = src; if (src) f.src = src; styleOnce(f, "display", src ? "" : "none"); }
      styleOnce(f, "width", G.foeW + "px"); styleOnce(f, "height", G.foeH + "px");
      var bob = Math.round(Math.sin(tAnim * 2.2) * 30) / 10;
      styleOnce(f, "transform", "translate(" + Math.round(G.foeX) + "px," + (Math.round(G.foeY) + bob) + "px)" +
                (FOE_FLIP ? " scaleX(-1)" : ""));

      var i, n = fallen.length, w = G.pileW;
      if (!n) {
        roundRect(ctx, G.pileCx - w / 2, G.pileCy - w / 2, w, w, w * 0.16);
        ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.stroke();
        ctx.setLineDash([]);
        return;
      }
      for (i = Math.min(3, n) - 1; i >= 0; i--) {
        drawCard("b" + i, fallen[n - 1 - i], G.pileCx - i * 4, G.pileCy - i * 4, w,
                 { fmt: "tiny", side: "red", still: true, layer: "crown" });
      }
      countOn("b0", n, "badge");
    }

    function drawInfo() {
      // the deck pile, three backs deep; its count is the watermark on top
      var i, n = deck.length;
      for (i = Math.min(3, n) - 1; i >= 0; i--) {
        drawCard("p" + i, null, G.deckX + G.deckW / 2 + i * 3, G.deckY + G.deckH / 2 - i * 4, G.deckW, { pile: true });
      }
      if (n) countOn("p0", n, n <= 2 ? "wm warn" : "wm");
      else {
        roundRect(ctx, G.deckX, G.deckY, G.deckW, G.deckH, G.deckW * 0.06);
        ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.stroke();
        ctx.setLineDash([]);
      }

      /* The centre of the band carries no words: the targets' gloss says
         where to strike, and the streak is the callout's to announce. */

      drawDoor("infirmary", G.infX, hurtCards.length, RED);
      drawDoor("prison", G.prisonX, captives.length, BLUE);
      drawCrown();
    }

    /* ===================================================================
       THE LISTS — the infirmary, the prison, the camp's losses
       One sheet over the round, newest first, so the oldest is at the foot
       of the list. It is read, never played: a tap anywhere closes it.
       =================================================================== */
    var DROP_SVG = '<svg class="sh-drop" viewBox="0 0 24 24"><path d="' + DROP_PATH + '"/></svg>';
    /* The camp as it was dealt: one tile per grade, best first, with how
       many of it the enemy brought. The tile's tier badge is hidden, since
       the muster does not say it. */
    function campGrid() {
      var grid = document.createElement("div"), g, total = 0;
      grid.className = "sh-tiles";
      var order = [FLAG, TRAP, STRAW, FENCE, ROCK, FOREST, SKULL, BOOK, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      for (var i = 0; i < order.length; i++) {
        g = order[i];
        if (!muster[g]) continue;
        total += muster[g];
        var cell = document.createElement("div");
        cell.className = "sh-cell";
        var n = faceNode(card(g, 0), "tiny", "red");
        sizeNode(n, 96, "tiny");
        n.style.setProperty("--bgi", artUrl(BAND.scene));
        n.classList.add("still", "no-tier");
        cell.appendChild(n);
        /* the count and nothing else: what a token is, it says at full size */
        cell.insertAdjacentHTML("beforeend", '<div class="sh-n">×' + muster[g] + "</div>");
        fileDoor(cell, card(g, 0), "red", true);
        grid.appendChild(cell);
      }
      return { node: grid, total: total };
    }

    /* The army as it marched in, in two parts: the cards still standing —
       in the deck, in the hand or in a bed, a wounded one wearing its drop —
       and the cards lost, each part best grade first. A third, only when a
       forest swallowed someone: neither standing nor lost, simply gone for
       the rest of the battle. */
    function armyTiles(list, w, lost) {
      var grid = document.createElement("div");
      grid.className = "sh-tiles" + (lost ? " lost" : "");
      list = list.slice().sort(function (a, b) { return (b.rank - a.rank) || (b.tier - a.tier); });
      for (var i = 0; i < list.length; i++) {
        var cell = document.createElement("div");
        cell.className = "sh-cell";
        var n = faceNode(list[i], "tiny", "blue");
        sizeNode(n, w, "tiny");
        n.style.setProperty("--bgi", artUrl(BAND.scene));
        n.classList.add("still");
        cell.appendChild(n);
        fileDoor(cell, list[i], "blue");
        if (hurtCards.indexOf(list[i]) >= 0) cell.insertAdjacentHTML("beforeend", DROP_SVG);
        grid.appendChild(cell);
      }
      return grid;
    }
    /* THE MOTOR'S CARD (packages/shell/motor.css, CARD): the count on the
       corner, the eyebrow, the title, a body, and the line that says what the
       tap does — the same six slots every card of the web shell is built on,
       so a list over the round reads as one of them. */
    function sheetCard(kind, title, count, sub) {
      var box = document.createElement("div");
      box.className = "mt-card sh-box sh-" + kind;
      box.innerHTML = (count != null ? '<i class="mt-pin">' + count + "</i>" : "") +
        (sub ? '<div class="mt-eyebrow">' + upper(Lang.t(sub)) + "</div>" : "") +
        '<h3 class="mt-h">' + upper(Lang.t(title)) + "</h3>";
      var body = document.createElement("div");
      body.className = "mt-body";
      box.appendChild(body);
      return { box: box, body: body };
    }
    function sheetShow(box) {
      box.insertAdjacentHTML("beforeend", '<p class="mt-tap">' + upper(Lang.t("Tap to close")) + "</p>");
      Table.sheet.innerHTML = "";
      Table.sheet.appendChild(box);
      Table.sheet.classList.add("on");
      Fit.box(box.querySelector(".mt-h"), 32);
      sheet = { kind: box.getAttribute("data-kind") };
      drag = null;
      Sound.clip("pick", 0.4, 0.8);
    }

    function armySheet() {
      var alive = [], i;
      for (i = 0; i < army0.length; i++) {
        if (lostCards.indexOf(army0[i]) < 0 && strayed.indexOf(army0[i]) < 0) alive.push(army0[i]);
      }
      var n = army0.length, w = n > 24 ? 76 : n > 14 ? 88 : 100;
      var c = sheetCard("army", "Your army", n, "At the start of the battle"), box = c.body;
      box.insertAdjacentHTML("beforeend", '<div class="sh-sec">' + upper(Lang.t("Alive")) + " <span>" + alive.length + "</span></div>");
      box.appendChild(armyTiles(alive, w));
      box.insertAdjacentHTML("beforeend", '<div class="sh-sec lost">' + upper(Lang.t("Lost")) + " <span>" + lostCards.length + "</span></div>");
      if (lostCards.length) box.appendChild(armyTiles(lostCards, w, true));
      else box.insertAdjacentHTML("beforeend", '<div class="sh-empty">' + upper(Lang.t("No card lost yet")) + "</div>");
      if (strayed.length) {
        box.insertAdjacentHTML("beforeend", '<div class="sh-sec lost">' + upper(Lang.t("Lost in the forest")) + " <span>" + strayed.length + "</span></div>");
        box.appendChild(armyTiles(strayed, w, true));
      }
      return c.box;
    }

    /* A CARD OF A LIST IS A DOOR TO WHO IT IS. The sheet takes no pointer —
       the canvas under it gets the tap (onDown) — so a cell that can open an
       officer's file carries the file it opens, and the tap is matched
       against the cells' own boxes. Only where the web shell's barracks is
       there to show them: a playable has no barracks.

       THREE KINDS OF DOOR. An officer opens their file; an OBJECT opens the
       card at full size, whose back says what it does and which grade
       destroys it (ABOUT); and a tile of the camp's muster (`blind`) opens
       the card at full size and nothing more — it counts grades and hides
       the tiers, and a file would say both. */
    function fileOf(c, side, blind) {
      if (c.rank > MARSHAL) return { g: c.rank, obj: true, team: "none" };
      if (blind) return { o: side, g: c.rank, t: c.tier, blind: true, team: side };
      return { o: c.o || side, g: c.rank, t: c.tier, b: c.base != null ? c.base : null, team: side };
    }
    function fileDoor(cell, c, side, blind) {
      var AR = window.__ARMY__;
      if (!AR || !AR.file || !c) return;
      cell._file = fileOf(c, side, blind);
      cell.classList.add("file");
    }
    function sheetFileAt(p) {
      if (!sheet || !Table.sheet) return null;
      var cv = document.getElementById("game");
      if (!cv) return null;
      var r = cv.getBoundingClientRect();
      var x = r.left + p.x / view.w * r.width, y = r.top + p.y / view.h * r.height;
      var cells = Table.sheet.querySelectorAll(".sh-cell.file");
      for (var i = 0; i < cells.length; i++) {
        var b = cells[i].getBoundingClientRect();
        if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return cells[i];
      }
      return null;
    }

    function sheetOpen(kind) {
      var list = [], side = "red", title, empty, i;
      if (cursorOn) { cursorOn = false; document.getElementById("game").style.cursor = ""; }
      if (kind === "camp" || kind === "army") {
        var cbox;
        if (kind === "army") cbox = armySheet();
        else {
          var cg = campGrid();
          var cc = sheetCard("camp", "Enemy camp", cg.total, "At the start of the battle");
          cc.body.appendChild(cg.node);
          cbox = cc.box;
        }
        cbox.setAttribute("data-kind", kind);
        sheetShow(cbox);
        return;
      }
      if (kind === "infirmary") { list = hurtCards; side = "blue"; title = "Infirmary"; empty = "Nobody wounded yet"; }
      else if (kind === "prison") {
        for (i = 0; i < captives.length; i++) list.push(card(captives[i].r, captives[i].t));
        title = "Prison"; empty = "No prisoners yet";
      } else { list = fallen; title = "Foes beaten"; empty = "No foe beaten yet"; }
      var sc = sheetCard(kind, title, list.length || null), box = sc.body;
      sc.box.setAttribute("data-kind", kind);
      if (!list.length) {
        box.innerHTML += '<div class="sh-empty">' + upper(Lang.t(empty)) + "</div>";
      } else {
        var grid = document.createElement("div");
        grid.className = "sh-tiles";
        var w = list.length > 20 ? 88 : 104;
        for (i = list.length - 1; i >= 0; i--) {
          var cell = document.createElement("div");
          cell.className = "sh-cell";
          var n = faceNode(list[i], "tiny", side);
          sizeNode(n, w, "tiny");
          n.style.setProperty("--bgi", artUrl(BAND.scene));
          n.classList.add("still");
          cell.appendChild(n);
          fileDoor(cell, list[i], side);
          if (kind === "infirmary") cell.insertAdjacentHTML("beforeend", DROP_SVG);
          grid.appendChild(cell);
        }
        box.appendChild(grid);
      }
      sheetShow(sc.box);
    }
    function sheetClose() {
      sheet = null;
      if (Table.sheet) { Table.sheet.classList.remove("on"); Table.sheet.innerHTML = ""; }
    }

    function render() {
      /* The camp is the painted scene (CONFIG.sceneArt), a CSS layer under the
         table; with no artwork on disk the table paints the fallback ground
         itself (`.cd-layer.flat`), since a ground painted on the canvas would
         now hide every card under it — and the canvas is then wiped here,
         whole, because the frame pipeline only wipes it for a scene. */
      if (!Art.scene()) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }
      tableBegin();
      drawGrid();
      drawInfo();
      drawHand();
      drawTurn();
      if ((!turn || turn.state !== "duel") && Table.duelBack.style.opacity !== "0") Table.duelBack.style.opacity = "0";
      tableEnd();
    }

    /* ===================================================================
       THE END OF A BATTLE
       =================================================================== */

    /* WHAT THE BATTLE OWES THE BARRACKS, and it is the whole of what leaves
       this file: the ids of the player's own cards that were wounded, every
       enemy card that was turned over (`met`, the collection's), and the
       enemies left standing, best first — the choice offered at the end is
       three cards and a player asked to pick between fifteen is not being
       offered a choice. It rides on the result, so the motor carries it
       without knowing what any of it is. */
    function ledger() {
      var out = [], k;
      for (k in wounded) if (wounded.hasOwnProperty(k)) out.push(k);
      var best = captives.slice().sort(function (a, b) {
        return (b.r * 10 + b.t) - (a.r * 10 + a.t);
      });
      var dead = [];
      for (k = 0; k < refused.length; k++) if (refused[k].id) dead.push(refused[k].id);
      var played = [];
      for (k in used) if (used.hasOwnProperty(k)) played.push(k);
      return { hurt: out, dead: dead, met: met.slice(0), used: played,
               captives: best.slice(0, 8).map(function (q) { return { r: q.r, t: q.t }; }) };
    }

    /* THE THREE STARS ARE THREE OBJECTIVES, and the score decides none of
       them: one for the flag, one for a battle without a single wound, one
       for taking at least one prisoner — and a battle whose army ran out
       before the flag fell is worth nothing, whatever it collected on the way.
       Read live by the level layer (`levelTally`): the unwounded star is held
       from the first turn and goes out on the first wound, the capture's
       lights on the first prisoner, the flag's on the capture that ends the
       round. The playable ends on the same count. */
    function tally() {
      if (outcome === false) return 0;
      return (flagTaken ? 1 : 0) + (hurtCards.length || refused.length ? 0 : 1) + (captives.length ? 1 : 0);
    }

    function finish(won) {
      if (ended) return;
      ended = true; outcome = won; turn = null; march = null; drag = null; selected = -1;
      var clean = won && !hurtCards.length && !refused.length;
      var bonus = won ? SURVIVOR * cardsLeft() + (clean ? UNSCATHED : 0) : 0;
      score += bonus;
      HUD.setScore(score);
      var stars = tally();
      if (won) {
        Sound.clip("victory", 0.8, 1);
        Fx.flash(GOLD, 0.4, 2);
        Pop.show("perfect", { word: CONFIG.copy.victory, sub: bonus ? "+" + bonus : "" });
      } else {
        Sound.clip("defeat", 0.8, 1);
        Fx.flash(RED, 0.4, 1.6);
      }
      if (clean) Pop.show("bonus", { word: "Unscathed", sub: "+" + UNSCATHED });
      /* THE ROWS ARE THE STARS: the three objectives, each with the star it
         earned or a dash, and then what the battle beat. The level layer adds
         no objective row of its own for a game that tallies its stars. */
      var star = function (on) { return on ? "★" : "—"; };
      var led = ledger();
      var rows = [
        { label: "Flag captured",  value: star(flagTaken && won), grade: flagTaken && won ? "gold" : "" },
        { label: "No wounds",      value: star(clean),            grade: clean ? "gold" : "" },
        { label: "Prisoner taken", value: star(won && captives.length > 0), grade: won && captives.length ? "gold" : "" },
        { label: "Foes beaten",    value: kills }
      ];
      endRound({
        title: won ? CONFIG.copy.victory : CONFIG.copy.gameOver,
        variant: won && stars === 3 ? "win" : "",
        score: score,
        stars: stars,
        rows: rows,
        /* The barracks reads this and nothing else of the round
           (packages/webshell/army.js). `won` is what decides whether a
           prisoner is offered at all. */
        army: { won: won, hurt: led.hurt, dead: led.dead, met: led.met, captives: led.captives, used: led.used },
        track: { score: score, kills: kills, losses: losses, ties: ties, scouted: scouted, traps: trapsCleared,
                 objects: smashed, strayed: strayed.length, won: won }
      });
    }

    /* The web target's level layer: `applyLevel` hands the climb's `d` before
       the round (the objective comes from it), and `levelWon` ends the round
       through the game's own result on the third star, so the end screen
       keeps these stat rows. Ignored by the playable. */
    function levelWon() {
      if (turn && turn.verdict.kind === "flag") return;   // the reveal's end declares it
      finish(true);
    }
    /* The level layer's two hooks on the stars: `levelTally` IS the count
       (it replaces the score bands, packages/webshell/levels.js) and
       `levelStars` stays as the floor it can never be promoted past — a lost
       battle is worth nothing. */
    function levelTally() { return tally(); }
    function levelStars(stars) { return outcome === false ? 0 : stars; }

    return { reset: reset, update: update, render: render,
             onDown: onDown, onMove: onMove, onUp: onUp, onResize: onResize,
             applyLevel: applyLevel, levelWon: levelWon, levelStars: levelStars, levelTally: levelTally,
             cardNode: cardNode, cardBack: cardBack, objectInfo: objectInfo, gradeInfo: gradeInfo };
  })();
