# The commands that used to be CI.
#
# GitHub Actions never ran on this repo — every job was refused before a runner
# was allocated — so the two workflows were deleted and what they did lives
# here, run by hand. Vercel is untouched: it deploys the site from its own git
# integration on every push to main, and needs nothing from this file.
#
#   make check   the three build gates, before a commit
#   make test [GAME=<slug>]     the web shell's view system, in a real build
#   make push    check, push, then publish the 13 to itch
#   make itch    re-publish to itch without pushing
#   make site    assemble dist/site locally
#   make serve   the dev loop, with reload on save
#   make preview the same site built once, no reload — restart it to rebuild
#   make lab     every lab page behind one back office, at http://localhost:8095/
#   make store   the store card composer, at http://localhost:8091/
#   make events  the callouts / cues bench, at http://localhost:8092/ (and /library, the sfx by ear)
#   make sfx     re-index assets/audio/sfx/ into index.json after adding or renaming a file
#   make text    the copy desk, at http://localhost:8093/
#   make village the village composer, at http://localhost:8094/
#   make meta    the itch page copy, one file per game
#   make shots [GAME=<slug>]   the eleven captures → assets/image/screen/
#   make map   [GAME=<slug>]   just the eleventh, the level map
#   make android GAME=<slug>   the signed .aab for the Play Console
#   make ng      zip the 13 for a Newgrounds submission
#
# Written for GNU Make 3.81, which is what macOS ships: no .ONESHELL, so every
# recipe line is its own shell.

MD := docs/ README.md CLAUDE.md TODO.md

.PHONY: help check test push itch site serve preview lab store events sfx text village meta shots map ng android

# Matched, not a line range: adding a target used to mean editing a `sed` range
# here too, and forgetting silently truncated this list.
help:
	@grep -E '^#   make ' Makefile | sed 's/^# \{0,1\}//'

# The one thing in this repo that is checked by running it rather than by
# comparing bytes: the view stack, the modal layer, the wallet band and what
# ESCAPE does are all what the DOM does, and none of it can be read off a
# source file. It builds the game it drives, so it needs nothing else first.
test:
	node tools/test/views.mjs $(GAME)

# `update.mjs` builds every artifact and both catalogues, then runs the three
# checks Actions used to run: the artifacts match their sources, the catalogues
# are current, every creative is under 5 MB. mdformat first, because a table it
# realigns after the check would leave the tree dirty.
check:
	mdformat $(MD)
	node tools/update.mjs

# The one guard worth having: deploy-itch stamps the build `<day>-<short sha>`
# and appends `-dirty` when the tree is not clean, which traces back to nothing.
# So push the commit first, then publish from it — in that order, so the sha in
# the version is one the remote actually has.
push: check
	@test -z "$$(git status --porcelain)" || { \
	  echo ""; \
	  echo "the tree is dirty — commit first, or itch gets a -dirty build:"; \
	  git status --short; \
	  exit 1; \
	}
	git push
	node tools/publish/deploy-itch.mjs --all
	@echo ""
	@echo "Vercel redeploys the site from the push on its own."
	@echo "On itch, tick 'played in the browser' on any upload that is new."

# butler uploads a build and cannot touch the page around it: the title, copy,
# tags, cover, screenshots and that checkbox have no public API.
itch:
	node tools/publish/deploy-itch.mjs --all

site:
	node tools/build/build-site.mjs

serve:
	node tools/lab/serve-site.mjs

# Same server, frozen: one build at start, no watcher, no reload. For testing
# by hand while an agent is editing the sources.
preview:
	node tools/lab/serve-site.mjs --no-watch

# Every page of lab/ on one port, localhost only: a back office that lists them
# and opens each beside the list. The four tools below are started the first
# time they are opened, each in its own process under its own prefix
# (/events/, /text/, /store/, /village/); their own targets still work alone.
lab:
	node tools/lab/serve-lab.mjs

# lab/store-card.html needs a server for two things it cannot do over file://:
# list what a game owns, and write the image it composed into assets/image/<store>/.
store:
	node tools/lab/serve-store.mjs

# Every callout, notification and cue a game fires, listed off its own source
# and played inside its own build, under two tabs: view and sound. Same reason
# for a server as the composer — it reads the sources back and serves a built
# game on a scriptable origin — plus one more: Apply writes the change back into
# games/<slug>/game.js (tools/lab/apply-events.mjs) and re-cuts a swapped clip.
# `node tools/lab/scan-events.mjs <slug>` is the same list as text, no browser.
events:
	node tools/lab/serve-events.mjs

# The sfx folder read back into assets/audio/sfx/index.json — durations,
# channels, packs, licences — which the bench's file menu and the library page
# (`make events` → /library) read instead of listing 870 names. It is an input,
# committed like assets/image/embed/: tools/update.mjs never runs ffprobe, so
# this is run by hand when a file is added, removed or renamed.
sfx:
	node tools/lab/index-sfx.mjs

# Every word a game shows a player, EN and FR side by side, read off the four
# sources instead of one call at a time. Same reason for a server as the two
# above, plus the one that matters: APPLY writes the correction back into
# manifest.json, game.js and page.html (tools/lab/apply-text.mjs), then rebuilds
# the game and the catalogues so the tree still passes `make check`.
# `node tools/lab/scan-text.mjs <slug>` is the same list as text, no browser.
text:
	node tools/lab/serve-text.mjs

# A game's title screen laid out as a PLACE: a painted hub, and the game's own
# houses standing on it, each one the door to a screen the web shell already
# has. Same two reasons for a server as the three above — it lists what a game
# owns, and APPLY writes: a draft into lab/village-presets.json, or `web.village`
# into games/<slug>/manifest.json, with the patch bump and the rebuild that
# touching a game's sources owes (CLAUDE.md).
village:
	node tools/lab/serve-village.mjs

meta:
	node tools/publish/store-meta.mjs --all --out=dist/meta

# A scripted pilot replays every game's web build in headless Chrome and writes
# twelve pictures per game: ten of the round, from its first seconds to the end
# screen, the level map (-11) and the village (-12) — plus, for a game with an
# army (stratideck), five officers at full size, face then back (-13 to -22).
# Two minutes a game, so GAME=<slug> is how one is redone; `make map` is the
# eleventh alone, and it renumbers none of the ten (so do --village-only and
# --cards-only on the tool itself).
#
# The images are an input, like the painted art: nothing rebuilds them, and the
# site picks them up on its next build — `make check && make site` after a run.
shots:
	node tools/lab/shoot-screens.mjs $(GAME)

map:
	node tools/lab/shoot-screens.mjs $(GAME) --map-only

# One game to one .aab. The web build, the Capacitor project and Gradle, in
# that order — gen-native re-runs the build itself, so this target is the same
# command whether native/<slug>/ exists or not. It signs only if
# native/<slug>/android/keystore.properties is there; Gradle says so otherwise
# rather than producing a bundle Play will refuse.
#
# There is no `make play`: the first .aab goes up through the console by hand
# (supply cannot create an app), and every later one is
# `cd native/<slug> && fastlane android beta`.
android:
	@test -n "$(GAME)" || { echo "usage: make android GAME=<slug>"; exit 1; }
	node tools/publish/gen-native.mjs $(GAME)
	cd native/$(GAME)/android && ./gradlew --quiet bundleRelease
	@ls -l native/$(GAME)/android/app/build/outputs/bundle/release/*.aab

# Newgrounds takes a zip with index.html at its TOP level, so each one is zipped
# from inside its own folder. The itch destination is already the right build —
# one self-contained document, no network — so there is nothing portal-specific
# to produce. Their SDK (medals, scoreboards) is optional and not wired.
ng:
	node tools/build/build.mjs --target=web --dest=itch
	mkdir -p dist/newgrounds
	for d in dist/itch/*/; do \
	  slug=$$(basename $$d); \
	  ( cd $$d && zip -q -X -FS ../../newgrounds/$$slug.zip index.html ); \
	done
	@ls -l dist/newgrounds/*.zip | awk '{printf "  %5.0f KB  %s\n", $$5/1024, $$9}'
