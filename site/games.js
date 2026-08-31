/*
  Playable catalogue rendered by the Playables section.

  Hand-maintained for now. Once every game carries a manifest.json
  (see docs/INDUSTRIALIZATION.md), tools/build/build-site.mjs generates this
  file from the manifests instead.

  The builder rewrites this array on the way to dist/site/, adding for each game:
    icon    - true when assets/icon/thumb/<slug>.png exists
    screens - how many assets/screen/<slug>-NN.jpg were found

  Two ways a game stays off the public site:
    draft: true   - still in construction. Deliberate: the entry keeps its copy
                    ready, delete the flag to publish it.
    no icon       - dropped and reported, because a card with no artwork is a
                    broken card, not a discreet one.
*/
window.GAMES = [
  {
    slug: "spinshock",
    name: "Spinshock",
    accent: ["#40ecff", "#ff4fbe"],
    fr: {
      tagline: "Toupie contre toupie. Tape pile à l’impact pour souffler tes rivaux et regagner de la vitesse.",
      tags: ["Tap rythmé", "Sans fin", "Physique"]
    },
    en: {
      tagline: "Top against top. Tap right on impact to blast your rivals away and wind your spin back up.",
      tags: ["Timing tap", "Endless", "Physics"]
    }
  },
  {
    slug: "chainring",
    name: "Chainring",
    accent: ["#4bf5ff", "#4263eb"],
    fr: {
      tagline: "Tape à l’instant où l’anneau se referme sur la balle. Chaque anneau tombe sur un temps de la musique.",
      tags: ["Tap rythmé", "30 s", "Mort subite"]
    },
    en: {
      tagline: "Tap the instant the closing ring hits the ball. Every ring lands on a beat of the track.",
      tags: ["Rhythm tap", "30 s", "Sudden death"]
    }
  },
  {
    slug: "bouncetry",
    name: "Bouncetry",
    accent: ["#ff3b57", "#2f86ff"],
    fr: {
      tagline: "Un mur de verre rouge et bleu au-dessus de la lave. Tape pour inverser toutes les couleurs en plein vol.",
      tags: ["Tap inverseur", "Casse-brique", "Sol de lave"]
    },
    en: {
      tagline: "A wall of red and blue glass over a lake of lava. Tap to flip every colour while the ball is mid-air.",
      tags: ["Tap to swap", "Breakout", "Lava floor"]
    }
  },
  {
    slug: "blight",
    name: "Blight",
    accent: ["#ff8fab", "#7048e8"],
    fr: {
      tagline: "Vise, tire, aligne trois bulles. La moisissure ne redescend que si tu lui coupes la route.",
      tags: ["Vise et tire", "60 s", "Ligne de danger"]
    },
    en: {
      tagline: "Aim, shoot, match three bubbles. The spreading blight only falls if you cut it off.",
      tags: ["Aim & shoot", "60 s", "Danger line"]
    }
  },
  {
    slug: "orbinity",
    name: "Orbinity",
    accent: ["#7cf5ff", "#6d5cff"],
    fr: {
      tagline: "Une comète en orbite. Tape pour couper la gravité et la projeter vers la planète suivante.",
      tags: ["Tap rythmé", "30 s", "Chaîne de combos"]
    },
    en: {
      tagline: "A comet in orbit. Tap to snap gravity and fling it toward the next planet.",
      tags: ["Timing tap", "30 s", "Combo chain"]
    }
  },
  {
    slug: "triverse",
    name: "Triverse",
    accent: ["#3ce0ff", "#ff5ad4"],
    fr: {
      tagline: "Trois cordes de lumière montent dans le vide. Swipe pour sauter de l’une à l’autre, gemmes contre mines.",
      tags: ["Swipe", "Sans fin", "3 vies"]
    },
    en: {
      tagline: "Three ropes of light run up the void. Swipe to hop between them, gems against mines.",
      tags: ["Swipe lanes", "Endless", "3 lives"]
    }
  },
  {
    slug: "arcider",
    name: "Arcider",
    accent: ["#35e8ff", "#7a4dff"],
    fr: {
      tagline: "Vingt pilotes, une autoroute néon, trois arrivants. Penche-toi pour doubler : ton bouclier ne se recharge jamais.",
      tags: ["Maintiens pour incliner", "Battle royale", "1020 m"]
    },
    en: {
      tagline: "Twenty pilots, one neon highway, three finishers. Lean to overtake, because your shield never refills.",
      tags: ["Hold to lean", "Battle royale", "1020 m"]
    }
  },
  {
    slug: "vipera",
    name: "Vipera",
    accent: ["#4dff9b", "#12b86a"],
    fr: {
      tagline: "Une vipère taille sa galerie sans fin. Chaque tap change le côté qu’elle creuse, chaque gemme l’allonge.",
      tags: ["Tap pour dévier", "Sans fin", "Armure"]
    },
    en: {
      tagline: "A viper carves its endless burrow. Every tap flips the side it digs toward, every gem makes it longer.",
      tags: ["Tap to swerve", "Endless", "Armour"]
    }
  },
  {
    slug: "echomaze",
    name: "Echomaze",
    accent: ["#7ef9ff", "#4ade80"],
    fr: {
      tagline: "Deux secondes pour voir le labyrinthe, puis le noir total. Tire des impulsions pour l’écholocaliser.",
      tags: ["Vise et tire", "Écholocation", "1 sortie sur 6"]
    },
    en: {
      tagline: "Two seconds to see the labyrinth, then total darkness. Fire pulses to echolocate it.",
      tags: ["Aim & fire", "Echolocation", "1 way out of 6"]
    }
  },
  {
    slug: "gearball",
    name: "Gearball",
    accent: ["#7ef9ff", "#ffb44f"],
    fr: {
      tagline: "Huit engrenages, une piste continue, une bille qui tombe. Anticipe la rotation et soude la chaîne.",
      tags: ["Tap pour lâcher", "45 s", "Boucle à remplir"]
    },
    en: {
      tagline: "Eight cogs, one continuous track, one falling ball. Lead the rotation and weld the chain.",
      tags: ["Tap to drop", "45 s", "Fill the loop"]
    }
  },
  {
    slug: "radiam",
    name: "Radiam",
    accent: ["#35e0ff", "#8b6cff"],
    fr: {
      tagline: "Trois couronnes de perles sur douze rayons. Fais tourner une seule couronne : la mise ne tombe qu’à l’arrêt.",
      tags: ["Glisse un anneau", "40 s", "Charges et novas"]
    },
    en: {
      tagline: "Three rings of beads over twelve rays. Turn one ring at a time; the dial only pays once it stops.",
      tags: ["Drag a ring", "40 s", "Charges & novas"]
    }
  },
  {
    slug: "slipdeck",
    name: "Slipdeck",
    draft: true,
    accent: ["#f5c451", "#3ddc97"],
    fr: {
      tagline: "Une carte à la fois : à la poubelle ou dans la main. Cinq gardes forment une main de poker.",
      tags: ["Swipe pour trier", "30 s", "Mains de poker"]
    },
    en: {
      tagline: "One card at a time: bin it or keep it. Five keeps make a poker hand, paid on the spot.",
      tags: ["Swipe to sort", "30 s", "Poker hands"]
    }
  }
];
