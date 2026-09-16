<img width="1512" height="827" alt="image" src="https://github.com/user-attachments/assets/af85a5b1-41ba-4341-9b0a-262b602e27f8" />

# Aria Icons

**340k SVG icons — browse them, add them as source with a CLI, and wire the same catalog into Cursor/Claude via MCP.**

Not another Lucide clone. Aria indexes Lucide, Tabler, Heroicons, Iconify, brand logos, and more in one search — then writes only the icons you pick into your repo (no giant icon dependency). Same engine powers the [website](https://icons.leularia.com), CLI, REST API, and MCP.

| | |
|---|---|
| **Site** | [icons.leularia.com](https://icons.leularia.com) |
| **Repo** | [github.com/LeulAria/Aria-Icons](https://github.com/LeulAria/Aria-Icons) |
| **MCP** | `npx -y aria-icons` (stdio) or `https://icons.leularia.com/api/mcp` (HTTP) |

### Quickstart

```bash
npx -y aria-icons@latest setup
# or
bunx aria-icons@latest setup
# or
curl -fsSL https://icons.leularia.com/install.sh | bash
```

The npm package is `aria-icons`. The CLI is tiny: it talks to the Aria Icons API and only downloads the icons you request.

## CLI (published package)

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

| Command | Purpose |
|---------|---------|
| `search <query>` | Search all collections |
| `get <id>` | Print SVG or framework source |
| `add <names…>` | Write icon files into the repo |
| `migrate --to <set>` | Map existing icon-package imports onto one collection |
| `doctor` | Audit mixed libraries |
| `suggest [src/]` | Recommend a consistent set |
| `init` | Write `.aria-icons.json` |
| `setup` | Configure MCP for Cursor / Claude / VS Code / … |
| `mcp` | Stdio MCP server (default if you run `aria-icons` with no args) |

Icon ids: `collection:name` (`lucide:house`, `tabler:arrow-up`, `thesvg:github`).

Full CLI docs: [`packages/cli/README.md`](packages/cli/README.md).

### MCP

**Local (stdio)** — what `aria-icons setup` writes:

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

**Remote HTTP** — same catalog, hosted with the website:

```json
{
  "mcpServers": {
    "aria-icons": {
      "url": "https://icons.leularia.com/api/mcp"
    }
  }
}
```

Public REST used by the CLI (tiny payloads, no icon database in the package):

| Endpoint | |
|----------|--|
| `GET /api/v1/search?q=` | Search |
| `GET /api/v1/icon?id=lucide:house` | One icon |
| `GET /api/v1/icons?ids=a,b` | Batch |
| `GET /api/v1/collections` | Collections |
| `GET /api/v1/similar?id=` | Similar / other sets |
| `GET /api/v1/equivalent?id=&to=` | Cross-set mapping |

During local development:

```bash
ARIA_ICONS_API=http://localhost:3001 bun run cli:dev -- search house
```

## Website (this monorepo)

First, install the dependencies:

```bash
bun install
```

Fetch the brand + Iconify icon sources (one-time, or whenever you want to refresh), then rebuild the search catalog:

```bash
cd apps/web
bun run fetch:thesvg          # ~6,500 brand logos (~4s)
bun run fetch:iconify -- --all  # 200+ Iconify sets (~80s)
bun run generate-icons        # build icons-meta.json for search + MCP
```

Then, from the repo root, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser. The in-app **Contribute Icons** page (`/contribute`) walks through adding a new set.

## Icon Sources

Icons come from three storage backends, all indexed into one catalog:

| Source | Storage | Fetch |
| --- | --- | --- |
| Vendored sets (Lucide, Tabler, Heroicons, …) | one JSON per set in `apps/web/icons/vendored/` | committed to the repo |
| theSVG brand logos (6,500+ brands, variants) | `apps/web/icons/thesvg.json` | `bun run fetch:thesvg` (auto-packs) |
| Iconify collections (200+ sets) | one JSON per set in `apps/web/icons/iconify/` | `bun run fetch:iconify` (add `-- --all` for every set) |

After fetching, rebuild the search catalog:

```bash
cd apps/web
bun run generate-icons
```

This writes `public/icons-meta.json` (browser + MCP search index with names,
tags, aliases, and categories) and `icons-name.json`.

## Contributing Icons

Every icon set here was contributed or curated by the community — new sets
and better metadata are always welcome. The in-app guide at
[`/contribute`](http://localhost:3001/contribute) walks through it, and the
short version is:

1. **Fork** [LeulAria/Aria-Icons](https://github.com/LeulAria/Aria-Icons) and clone your fork.
2. **Add SVGs** under `apps/web/icons/<your-set-name>/` (lowercase, hyphenated file names — the file name becomes the icon name).
3. **Register the set** in `apps/web/src/lib/icon-sets.ts` (id, label, homepage, and whether it's `line` or `solid` style).
4. **Pack + rebuild** with `bun run pack:icons -- --delete && bun run generate-icons` inside `apps/web`.
5. **Preview** with `bun run dev` — check the sidebar, grid rendering, and search.
6. **Open a pull request** against [LeulAria/Aria-Icons](https://github.com/LeulAria/Aria-Icons) mentioning the icon count, source, and license.

Other ways to contribute:

- **Brand icons** — contribute upstream to [theSVG](https://github.com/glincker/thesvg), then refresh with `bun run fetch:thesvg`.
- **Iconify sets** — pull additional collections with `bun run fetch:iconify -- --sets <prefix>`.
- **Metadata** — better tags/aliases make search smarter; metadata PRs are just as valuable as new icons.

Only submit icons you have the right to share, and include the license in
your PR (MIT, CC0, or similarly permissive licenses preferred).

## Project Structure

```
aria-icons/
├── apps/
│   └── web/               # Next.js app, catalog, /api/v1, HTTP MCP
├── packages/
│   ├── cli/               # published npm package `aria-icons`
│   ├── api/               # oRPC layer
│   └── config/
```

## Run, build, version, publish

```bash
# Install
bun install

# Website
bun run dev:web                          # http://localhost:3001
bun run build                            # turbo: web + cli

# CLI against production API
bun run cli:dev -- search house
bun run cli:dev -- get lucide:house
bun run cli:dev -- doctor

# CLI against local website
ARIA_ICONS_API=http://localhost:3001 bun run cli:dev -- search house

# Tests + types
bun run cli:test
bun run check-types

# Version the CLI (bumpp: commit, tag vX.Y.Z, push)
bun run cli:release

# GitHub Actions then publishes packages/cli to npm on tag v*
# Requires repo secret NPM_TOKEN
```

Manual npm publish:

```bash
cd packages/cli
bun run build
npm publish --access public
```

Pre-release:

```bash
cd packages/cli
bunx bumpp prerelease --preid beta --commit --tag --push
# tag like v0.1.1-beta.0 publishes with npm tag `beta`
```

Website deploy is unchanged (Vercel / your current host for `apps/web`). After deploy, `/api/v1/*` and `/api/mcp` are what the CLI and remote MCP use.

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run check-types`: Check TypeScript types across all apps
- `bun run cli:dev`: Run the CLI from source
- `bun run cli:build`: Bundle the CLI for npm
- `bun run cli:release`: Version, tag, and push the CLI

Inside `apps/web`:

- `bun run fetch:thesvg`: Fetch/refresh theSVG brand icons (packs into `icons/thesvg.json`)
- `bun run fetch:iconify`: Fetch Iconify sets (`-- --sets a,b`, `-- --all`)
- `bun run pack:icons`: Collapse loose SVG folders into one JSON per set (`-- --delete` removes sources)
- `bun run generate-icons`: Rebuild the icon search catalog

## License

[MIT](LICENSE) © Leul Aria

---

If Aria Icons saves you time finding or shipping icons, a ⭐ on [the repo](https://github.com/LeulAria/Aria-Icons) helps others discover it.
