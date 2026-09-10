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
#   make meta    the itch page copy, one file per game
#   make ng      zip the 13 for a Newgrounds submission
#
# Written for GNU Make 3.81, which is what macOS ships: no .ONESHELL, so every
# recipe line is its own shell.

MD := docs/ README.md CLAUDE.md TODO.md

.PHONY: help check push itch site serve meta ng

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

meta:
	node tools/publish/store-meta.mjs --all --out=dist/meta

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
