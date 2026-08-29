# Using Aria Icons — CLI, MCP, and the example apps

This is the working cookbook for the `aria-icons` CLI and MCP: every command we used to build the examples, how MCP maps onto those commands, and how to run the three apps.

The npm package is [`aria-icons`](https://www.npmjs.com/package/aria-icons). The website/API is [icons.leularia.com](https://icons.leularia.com).

Ids are always `collection:name` — `lucide:house`, `tabler:arrow-up`, `thesvg:github`.

---

## Run the examples

Start the catalog API (already used by the CLI):

```bash
cd apps/web && bun run dev          # http://localhost:3001
```

Then, each in its own terminal:

```bash
cd examples/lumen && bun install && bun run dev     # React  → http://localhost:5173
cd examples/harbor && bun install && bun run dev    # Vue    → http://localhost:5174
cd examples/north && bun install && bun run dev     # Svelte → http://localhost:5175
```

None of the examples depend on `lucide-react`, `lucide-vue-next`, or `lucide-svelte`. Icons are source files under `src/components/icons` (React/Vue) or `src/lib/icons` (Svelte).

---

## How to invoke the CLI

From this repo (the rebuilt CLI with every fix in this pass):

```bash
node packages/cli/dist/index.js --api http://localhost:3001 search house
# or
bun run --cwd packages/cli dev -- --api http://localhost:3001 search house
```

Against production (the CLI now falls back to `/api/mcp` when `/api/v1` is not deployed yet):

```bash
node packages/cli/dist/index.js search house --limit 5
node packages/cli/dist/index.js get lucide:house
```

After you publish a new CLI version:

```bash
bunx aria-icons search house
npx -y --package=aria-icons -- aria-icons search house
```

`npx aria-icons search house` is unreliable on current npm (it treats `search` as a binary name). Prefer `bunx`, or put `--` after the package:

```bash
npx -y --package=aria-icons -- aria-icons -- search house
```

Global `--api` works on every command:

```bash
aria-icons --api http://localhost:3001 add lucide:house
# same as
ARIA_ICONS_API=http://localhost:3001 aria-icons add lucide:house
```

Project defaults live in `.aria-icons.json`:

```json
{
  "framework": "react",
  "outDir": "src/components/icons",
  "defaultCollection": "lucide"
}
```

---

## CLI commands we used

### Search

```bash
aria-icons search house --collection lucide --limit 5
aria-icons search "layout dashboard" --collection lucide --json
aria-icons search github --collection thesvg --limit 3
```

`--collection` (or `--prefix`) filters. If you omit it, results from `.aria-icons.json` `defaultCollection` are sorted first.

### Get (print source, do not write)

```bash
aria-icons get lucide:house
aria-icons get lucide:house --format react
aria-icons get lucide:house --format vue
aria-icons get lucide:house --format svelte
aria-icons get lucide:filter --format json          # alias → list-filter
aria-icons get thesvg:github --variant mono
```

Formats: `svg` (default), `react`, `vue`, `svelte`, `solid`, `flutter`, `react-native`, `json`.

### Add (write files + barrel)

What built the examples:

```bash
# React (examples/lumen)
aria-icons --api http://localhost:3001 add \
  lucide:house lucide:search lucide:bell lucide:settings lucide:users \
  lucide:calendar lucide:inbox lucide:plus lucide:layout-dashboard \
  lucide:check lucide:sparkles lucide:log-out lucide:ellipsis \
  lucide:trending-up lucide:clock lucide:circle-user lucide:mail lucide:zap \
  lucide:list-filter lucide:folder lucide:arrow-up lucide:arrow-down \
  lucide:filter lucide:more-horizontal \
  thesvg:github --variant mono --force

# Vue (examples/harbor) — framework comes from .aria-icons.json
aria-icons --api http://localhost:3001 add lucide:house thesvg:github --variant mono

# Svelte (examples/north)
aria-icons --api http://localhost:3001 add lucide:house --framework svelte
```

Useful flags:

| Flag | What it does |
|------|----------------|
| `--framework vue\|svelte\|react` | Override detection / config |
| `--out-dir src/lib/icons` | Override output folder |
| `--collection lucide` | Resolve bare names (`house`) in this set |
| `--variant mono` | theSVG brand variant |
| `--force` | Overwrite an existing file |
| `--color` / `--size` | Bake into the SVG |

Bare names and old Lucide names resolve:

- `filter` → `lucide:list-filter`
- `more-horizontal` → `lucide:ellipsis`
- `home` → `house`

A failed id no longer aborts the rest of the batch.

Import after add:

```tsx
import { House, Sparkles } from "@/components/icons";
<House width={20} height={20} />
```

Vue/Svelte barrels re-export defaults:

```ts
export { default as House } from "./house.vue";
export { default as House } from "./house.svelte";
```

### Similar / equivalent (cross-set)

```bash
aria-icons similar lucide:house --limit 8
aria-icons equivalent lucide:house --to tabler
```

### Audit

```bash
aria-icons doctor          # third-party packages + Aria source files in outDir
aria-icons suggest
aria-icons migrate --to lucide --dry-run
```

### Project + agents

```bash
aria-icons init -y --framework vue --out-dir src/components/icons
aria-icons setup --scope project --agent cursor -y
aria-icons config
aria-icons collections --search lucide --limit 10
aria-icons mcp             # stdio MCP (also the default with no args)
```

`setup` wrote this in each example (`.cursor/mcp.json`):

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

Remote HTTP (same tools, hosted):

```json
{
  "mcpServers": {
    "aria-icons": {
      "url": "https://icons.leularia.com/api/mcp"
    }
  }
}
```

Point the stdio server at a local API with env:

```json
{
  "mcpServers": {
    "aria-icons": {
      "command": "npx",
      "args": ["-y", "aria-icons"],
      "env": { "ARIA_ICONS_API": "http://localhost:3001" }
    }
  }
}
```

---

## MCP tools (what we called)

Stdio (`npx -y aria-icons` / `aria-icons mcp`) and HTTP (`POST /api/mcp`) now share names. Both accept `icon_id` **or** `iconId`, and `collection` **or** `set`.

| Tool | CLI equivalent | What we used it for |
|------|----------------|---------------------|
| `search_icons` | `search` | Pick house, bell, github, dashboard icons. Returns `id` like `lucide:house` plus SVG previews |
| `get_icon` | `get --json` | SVG + react/vue/svelte snippets |
| `get_icon_svg` | `get` | SVG only |
| `get_icon_component` | `get --format vue\|svelte\|react` | One framework |
| `get_icons` | (batch get) | Several ids at once |
| `list_collections` / `list_icons` | `collections` | Browse sets |
| `find_similar_icons` | `similar` | Same glyph in other sets |
| `find_equivalent_icon` | `equivalent --to` | `lucide:house` → `tabler:…` |
| `recommend_icons` | `search` on a use case | Sidebar / settings suggestions |
| `add_icon_to_project` | `add` | Stdio **writes the file**. HTTP returns `{ fileName, code, importStatement }` for the agent to save |
| `scan_project_icons` | `doctor` (third-party) | Detect lucide-react etc. |
| `doctor_project_icons` | `doctor` | Local files + third-party. HTTP explains it cannot see your disk |
| `suggest_icon_set` | `suggest` | Recommended collection |
| `get_recent_icons` | (local memory) | Recently fetched ids |

Example HTTP call (what we ran against localhost):

```bash
curl -sS -X POST http://localhost:3001/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"tools/call",
    "params":{
      "name":"add_icon_to_project",
      "arguments":{"icon_id":"lucide:house","framework":"svelte"}
    }
  }'
```

Ask an agent, after MCP is connected:

- “Search Lucide for a minimal outline calendar icon”
- “Add `lucide:inbox` to this project”
- “Map `lucide:house` onto Tabler”
- “Run doctor on this repo”

`add_icon_to_project` writes relative to the **project**, not an npx cache (`ARIA_ICONS_CWD` / `INIT_CWD` / `project_dir`).

---

## Public REST (what the CLI calls)

| Method | |
|--------|--|
| `GET /api/v1/search?q=&collection=&prefer=&svg=1` | Search (optional SVG previews) |
| `GET /api/v1/icon?id=lucide:house&format=json\|react\|vue\|svelte` | One icon |
| `GET /api/v1/icons?ids=a,b` | Batch |
| `GET /api/v1/collections` | Sets |
| `GET /api/v1/similar?id=` | Related |
| `GET /api/v1/equivalent?id=&to=` | Cross-set map |

If `/api/v1` is 404 on production, the CLI automatically uses `POST /api/mcp` so search/get still work.

---

## What we fixed while building the examples

- **Production 404** — CLI falls back to HTTP MCP when `/api/v1` is missing. Search and get work against icons.leularia.com today. Redeploy `apps/web` so REST is first-class.
- **npx `search` as a binary** — bin is now `dist/index.js` with a shebang. Prefer `bunx` or `npx -y --package=aria-icons -- aria-icons …` until 0.1.1 is published.
- **Batch `add`** — one missing id no longer stops the rest.
- **Lucide aliases** — `filter` → `list-filter`, `more-horizontal` → `ellipsis`, `home` → `house`.
- **`--variant` / `--force`** on `add`.
- **Pretty components** — no more `<svg {...props}` then a raw newline before `xmlns`.
- **Brand theming** — monochrome fills become `currentColor` so `thesvg:github --variant mono` works on a dark UI.
- **Barrel prefix bug** — `arrow-up` is exported even if `arrow-up-right` exists; Vue/Svelte specifiers include `.vue` / `.svelte`.
- **`doctor`** reports Aria source files in `outDir`, not only third-party packages.
- **Search ranking** — prefers `defaultCollection` when you omit `--collection`.
- **MCP parity** — `icon_id` / `iconId`, `collection` / `set`, SVG previews, remote `add_icon_to_project` returns source, `doctor_project_icons` / `suggest_icon_set` / `list_icons` on stdio.
- **Write cwd** — skips `_npx` caches.
- **`types` field** on the npm package (`aria-icons.d.ts`).
- **`similar` / `equivalent` CLI commands**.

Publish a new CLI (`bun run cli:release` or `npm publish` in `packages/cli`) and redeploy the website so npm users and remote MCP pick this up.
