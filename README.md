# Aria Icons

**340,000+ SVG icons — searchable, customizable, and exposed over MCP.**

Aria Icons aggregates curated UI icon sets (Lucide, Tabler, Heroicons, …),
brand logos from [theSVG](https://thesvg.org), and 200+
[Iconify](https://icones.js.org) collections into one fast icon browser with
instant metadata search and an MCP server for AI assistants.

Repo: [github.com/LeulAria/Aria-Icons](https://github.com/LeulAria/Aria-Icons)

## Getting Started

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

## MCP Server

The app exposes a remote MCP endpoint at `/api/mcp` (production: `https://icons.leularia.com/api/mcp`) with three tools:

- `search_icons` — ranked keyword search over names and metadata (brand titles, aliases, categories)
- `list_icons` — organized set summaries with per-set pagination
- `get_icon_svg` — fetch SVG content by id (e.g. `thesvg-github`, `lucide-icons-house`), with brand variant support

The server is dual-era and stateless: Cursor and other handshake clients use `initialize` (protocol `2025-06-18` and earlier), while `2026-07-28` clients send per-request metadata. Neither path uses `Mcp-Session-Id`.

Add it in Cursor with:

```json
{
  "mcpServers": {
    "aria-icons": {
      "url": "https://icons.leularia.com/api/mcp"
    }
  }
}
```

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
│   └── web/               # Fullstack application (Next.js)
│       ├── icons/         # Icon sources (vendored SVGs, thesvg, iconify)
│       ├── scripts/       # fetch + catalog generation scripts
│       └── src/
├── packages/
│   └── api/               # API layer / business logic
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run check-types`: Check TypeScript types across all apps

Inside `apps/web`:

- `bun run fetch:thesvg`: Fetch/refresh theSVG brand icons (packs into `icons/thesvg.json`)
- `bun run fetch:iconify`: Fetch Iconify sets (`-- --sets a,b`, `-- --all`)
- `bun run pack:icons`: Collapse loose SVG folders into one JSON per set (`-- --delete` removes sources)
- `bun run generate-icons`: Rebuild the icon search catalog
