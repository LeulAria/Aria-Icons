# aria-icons

Tiny CLI + MCP server for [Aria Icons](https://icons.leularia.com). Search 340k+ icons, drop them into your repo as source (no giant dependency), migrate existing icon libraries, and expose the same engine to AI agents.

```bash
npx -y aria-icons@latest setup
# or
bunx aria-icons@latest setup
# or
curl -fsSL https://icons.leularia.com/install.sh | bash
```

## Install

```bash
npx -y aria-icons@latest setup
bunx aria-icons@latest setup
curl -fsSL https://icons.leularia.com/install.sh | bash
```

```bash
npm install -g aria-icons
# or
bun add -g aria-icons
```

### Agent skill

```bash
npx skills add LeulAria/Aria-Icons
```

## MCP

```bash
npx aria-icons setup
```

Configures Cursor, Claude Code, OpenCode, Windsurf, VS Code, and Google Antigravity.

Or run the server directly:

```bash
npx aria-icons mcp
```

Manual Cursor config (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "aria-icons": {
      "command": "npx",
      "args": ["-y", "aria-icons"]
    }
  }
}
```

Remote HTTP MCP (same tools, hosted):

```json
{
  "mcpServers": {
    "aria-icons": {
      "url": "https://icons.leularia.com/api/mcp"
    }
  }
}
```

## Commands

| Command | What it does |
|---------|----------------|
| `search <query>` | Search all collections |
| `get <id>` | Print SVG or a framework component |
| `add <names…>` | Write icon source files into the project |
| `migrate --to <set>` | Map existing icon-package imports onto one collection |
| `doctor` | Audit mixed libraries / unused imports |
| `suggest [src/]` | Recommend a consistent set from current usage |
| `init` | Write `.aria-icons.json` |
| `setup` | Wire MCP into your editor |
| `config` | Print manual MCP snippets |
| `similar <id>` | Same icon in other collections |
| `equivalent <id> --to <set>` | Map onto a target collection |
| `collections` | List collections |
| `mcp` | Stdio MCP server (also the default with no args) |

```bash
aria-icons search "shopping cart" --collection lucide --json
aria-icons get lucide:house --format react --size 20
aria-icons add house --framework vue --out-dir src/components/icons
aria-icons add thesvg:github --variant mono --force
aria-icons similar lucide:house
aria-icons equivalent lucide:house --to tabler
aria-icons migrate --to lucide --dry-run
```

Icon ids use `collection:name` (`lucide:house`, `thesvg:github`). The CLI only downloads the icons you request.

## Development (this package)

From the monorepo root:

```bash
bun install
bun run cli:dev -- search house --api http://localhost:3001
bun run cli:build
bun run --cwd packages/cli test
```

## Publish

```bash
cd packages/cli
bun run release          # bumpp: commit, tag vX.Y.Z, push
# GitHub Actions publishes to npm on the tag
```

Manual:

```bash
cd packages/cli
bun run build
npm publish --access public
```

## License

MIT
