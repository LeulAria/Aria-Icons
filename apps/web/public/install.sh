#!/usr/bin/env bash
# Aria Icons CLI — curl this into bash:
#   curl -fsSL https://icons.leularia.com/install.sh | bash
set -euo pipefail

echo ""
echo "  Aria Icons"
echo "  Find any icon. Put it in your codebase."
echo ""

# Piped curl has no TTY, so skip prompts.
if [ ! -t 0 ]; then
  set -- -y "$@"
fi

if command -v bunx >/dev/null 2>&1; then
  exec bunx aria-icons@latest setup "$@"
fi

if command -v pnpx >/dev/null 2>&1; then
  exec pnpx aria-icons@latest setup "$@"
fi

if command -v yarn >/dev/null 2>&1; then
  exec yarn dlx aria-icons@latest setup "$@"
fi

if command -v npx >/dev/null 2>&1; then
  exec npx -y aria-icons@latest setup "$@"
fi

echo "Need bun, pnpm, yarn, or npm to install aria-icons." >&2
echo "  bun:  https://bun.sh" >&2
echo "  pnpm: https://pnpm.io" >&2
echo "  yarn: https://yarnpkg.com" >&2
echo "  npm:  https://nodejs.org" >&2
exit 1
