# Publish the `aria-icons` npm package (`packages/cli`).
#
#   make publish                 test + build, then wait for a fresh OTP
#   make publish-only OTP=123456 upload now (no extra test/build delay)
#   make dry-run                 pack without uploading
#   make release                 bump version, tag v*, push

.PHONY: help test build dry-run publish publish-only release
.DEFAULT_GOAL := help

CLI := packages/cli
NPM_TAG := $(shell node -e "const v=JSON.parse(require('fs').readFileSync('$(CLI)/package.json','utf8')).version; const m=v.match(/-(next|canary|beta|rc)/); process.stdout.write(m?m[1]:'latest')")

help:
	@echo "aria-icons npm package (tag: $(NPM_TAG))"
	@echo "  make test                       Run CLI tests"
	@echo "  make build                      Bundle the CLI"
	@echo "  make dry-run                    Test, build, npm publish --dry-run"
	@echo "  make publish                    Test + build, then print the OTP command"
	@echo "  make publish-only OTP=123456    Publish immediately (use a fresh code)"
	@echo "  make release                    Bump version, tag v*, and push"

test:
	bun run --cwd $(CLI) test

build:
	bun run --cwd $(CLI) build

dry-run: test build
	cd $(CLI) && npm publish --access public --tag $(NPM_TAG) --workspaces=false --ignore-scripts --dry-run

publish: test build
	@npm whoami >/dev/null 2>&1 || { echo "Not logged in. Run: npm login && npm whoami"; exit 1; }
	@echo ""
	@echo "Build is ready. OTP codes expire in ~30s, so pass a fresh one now:"
	@echo ""
	@echo "  make publish-only OTP=123456"
	@echo ""

publish-only:
	@test -n "$(OTP)" || { echo "Usage: make publish-only OTP=123456"; exit 1; }
	@npm whoami >/dev/null 2>&1 || { echo "Not logged in. Run: npm login && npm whoami"; exit 1; }
	cd $(CLI) && CI=1 npm publish --access public --tag $(NPM_TAG) --workspaces=false --ignore-scripts --otp=$(OTP) </dev/null

release:
	bun run --cwd $(CLI) release
