# The commands that used to be CI.
#
# GitHub Actions never ran on this repo — every job was refused before a runner
# was allocated — so the two workflows were deleted and what they did lives
# here, run by hand. Vercel is untouched: it deploys the site from its own git
# integration on every push to main, and needs nothing from this file.
#
#   make check   the three build gates, before a commit
#   make push    check, push, then publish the 13 to itch
#   make itch    re-publish to itch without pushing
#   make site    assemble dist/site locally
#   make serve   the dev loop, with reload on save
#   make store   the store card composer, at http://localhost:8091/
#   make events  the callouts / cues bench, at http://localhost:8092/
#   make meta    the itch page copy, one file per game
#   make shots [GAME=<slug>]   the eleven captures → assets/image/screen/
#   make map   [GAME=<slug>]   just the eleventh, the level map
#   make android GAME=<slug>   the signed .aab for the Play Console
#   make ng      zip the 13 for a Newgrounds submission
#
# Written for GNU Make 3.81, which is what macOS ships: no .ONESHELL, so every
# recipe line is its own shell.

MD := docs/ README.md CLAUDE.md TODO.md

.PHONY: help check push itch site serve store events meta shots map ng android

# Matched, not a line range: adding a target used to mean editing a `sed` range
# here too, and forgetting silently truncated this list.
help:
	@grep -E '^#   make ' Makefile | sed 's/^# \{0,1\}//'

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

meta:
	node tools/publish/store-meta.mjs --all --out=dist/meta

# A scripted pilot replays every game's web build in headless Chrome and writes
# eleven pictures per game: ten of the round, from its first seconds to the end
# screen, and the level map. Two minutes a game, so GAME=<slug> is how one is
# redone; `make map` is the eleventh alone, and it renumbers none of the ten.
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
