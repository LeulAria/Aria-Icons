<img width="1512" height="827" alt="image" src="https://github.com/user-attachments/assets/af85a5b1-41ba-4341-9b0a-262b602e27f8" />

[![Listed on mcpservers.org](https://mcpservers.org/badge.svg)](https://mcpservers.org/servers/leularia/aria-icons)
[![AllMCPs](https://allmcps.com/api/badge/aria-icons?style=directory)](https://allmcps.com/mcp/aria-icons)
[![npm](https://img.shields.io/npm/v/aria-icons)](https://www.npmjs.com/package/aria-icons)
[![Listed Startups](https://img.shields.io/badge/Listed%20on-Listed%20Startups-0A7CFF)](https://listedstartups.com/products/aria-icons)
[![Directory Index](https://img.shields.io/badge/Listed%20on-Directory%20Index-2EA44F)](https://directory-index.com/technology/aria-icons/)
[![Open Source Startups](https://img.shields.io/badge/Listed%20on-Open%20Source%20Startups-6F42C1)](https://www.opensourcestartups.com/project/aria-icons)
[![Show HN](https://img.shields.io/badge/Show%20HN-discussion-FF6600)](https://news.ycombinator.com/item?id=49717692)
[![MCP Repository](https://img.shields.io/badge/Listed%20on-MCP%20Repository-5C6BC0)](https://mcprepository.com/leularia/aria-icons)
[![Not Human Search](https://img.shields.io/badge/Listed%20on-Not%20Human%20Search-111111)](https://nothumansearch.ai/site/icons.leularia.com)

# Aria Icons

**380,000+ SVG icons - searchable, customizable, and a package manager for your icon codebase.**

Website + API + CLI + MCP. Find any icon, write it into the project as source (no giant dependency), migrate mixed icon libraries, and let AI agents use the same engine.

Repo: [github.com/LeulAria/Aria-Icons](https://github.com/LeulAria/Aria-Icons)

Test the MCP Server:
[<MCP. Playground/>](https://mcpplaygroundonline.com/mcp-test-server?url=https%3A%2F%2Ficons.leularia.com%2Fapi%2Fmcp)

```bash
npx -y aria-icons@latest setup
# or
bunx aria-icons@latest setup
# or
curl -fsSL https://icons.leularia.com/install.sh | bash
```

The npm package name is `aria-icons` (verified unused on the registry at the time of adding the CLI). The CLI is tiny: it talks to the Aria Icons API and only downloads the icons you request.

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
