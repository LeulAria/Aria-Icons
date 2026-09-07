# Publish the `aria-icons` npm package (`packages/cli`).
#
#   make publish                 test + build, then publish (browser 2FA)
#   make publish-only            upload now (no extra test/build delay)
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
	@echo "  make publish                    Test + build, then publish (browser 2FA)"
	@echo "  make publish-only               Publish immediately (browser 2FA; OTP=123456 for TOTP)"
	@echo "  make release                    Bump version, tag v*, and push"

test:
	bun run --cwd $(CLI) test

build:
	bun run --cwd $(CLI) build

dry-run: test build
	cd $(CLI) && npm publish --access public --tag $(NPM_TAG) --workspaces=false --ignore-scripts --dry-run

publish: test build publish-only

# Publishes via npm's web-based 2FA (opens a browser to approve).
# Pass OTP=123456 only if your account still uses TOTP codes.
publish-only:
	@npm whoami >/dev/null 2>&1 || { echo "Not logged in. Run: npm login && npm whoami"; exit 1; }
ifdef OTP
	cd $(CLI) && CI=1 npm publish --access public --tag $(NPM_TAG) --workspaces=false --ignore-scripts --otp=$(OTP) </dev/null
else
	cd $(CLI) && npm publish --access public --tag $(NPM_TAG) --workspaces=false --ignore-scripts
endif

release:
	bun run --cwd $(CLI) release
