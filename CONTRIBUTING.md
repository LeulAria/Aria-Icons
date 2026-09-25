# Contributing Guidelines

Thanks for helping improve Aria Icons. Contributions to the icon catalog, metadata, website, API, CLI, and MCP server are welcome.

## Support

Use this repository to [report bugs or request features](https://github.com/LeulAria/Aria-Icons/issues/new). Search [existing issues](https://github.com/LeulAria/Aria-Icons/issues) before opening a new one so the same report is not filed twice.

For security vulnerabilities, follow [SECURITY.md](SECURITY.md). Do not open a public issue for those.

## Documentation

- Project overview, local setup, and scripts: [README.md](README.md)
- CLI and MCP: [packages/cli/README.md](packages/cli/README.md)
- Adding an icon set in the app: [icons.leularia.com/contribute](https://icons.leularia.com/contribute) (or `/contribute` on a local dev server)

## How to contribute code

Bug fixes, features, icon sets, and metadata improvements are all in scope. Before opening a pull request:

1. Work against the latest source on the `main` branch.
2. Check open and recently merged pull requests so you are not duplicating work.
3. Open an issue before a large change, so the direction is agreed before you spend the time.

To send a pull request:

1. Fork the repository.
2. Keep the change focused. Reformatting unrelated code makes the review harder.
3. Run the checks below and make sure they pass.
4. Commit to your fork with a clear message.
5. Open a pull request against [LeulAria/Aria-Icons](https://github.com/LeulAria/Aria-Icons).
6. Watch CI on the pull request and stay available for review.

GitHub documents [forking a repository](https://docs.github.com/articles/fork-a-repo) and [creating a pull request](https://docs.github.com/articles/creating-a-pull-request).

### First steps

```bash
git clone git@github.com:LeulAria/Aria-Icons.git
cd Aria-Icons
bun install
```

Icon sources are already vendored in the repo. Refresh them only when you need newer upstream data:

```bash
cd apps/web
bun run fetch:thesvg             # brand logos
bun run fetch:iconify -- --all   # Iconify collections
bun run generate-icons           # rebuild the search catalog
```

From the repo root, start the site:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001).

### Running tests

```bash
bun run cli:test
bun run check-types
```

CLI tests live in `packages/cli` and run with `bun test`.

### Directory layout

```
aria-icons/
├── apps/
│   └── web/               # Next.js app, catalog, /api/v1, HTTP MCP
├── packages/
│   ├── cli/               # published npm package `aria-icons`
│   ├── api/               # oRPC layer
│   └── config/
```

## Adding icons

Only submit icons you have the right to share. Name the source and license in the pull request. MIT, CC0, and other permissive licenses are preferred.

1. Fork [LeulAria/Aria-Icons](https://github.com/LeulAria/Aria-Icons) and clone your fork.
2. Add SVGs under `apps/web/icons/<your-set-name>/`. Use lowercase, hyphenated file names. The file name becomes the icon name.
3. Register the set in `apps/web/src/lib/icon-sets.ts` (id, label, homepage, and whether the style is `line` or `solid`).
4. From `apps/web`, pack and rebuild:

   ```bash
   bun run pack:icons -- --delete && bun run generate-icons
   ```

5. Preview with `bun run dev`. Check the sidebar, the grid, and search.
6. Open a pull request that states the icon count, source, and license.

Other ways to add icons:

- **Brand icons** — contribute upstream to [theSVG](https://github.com/glincker/thesvg), then refresh with `bun run fetch:thesvg`.
- **Iconify sets** — pull collections with `bun run fetch:iconify -- --sets <prefix>`.
- **Metadata** — tags and aliases improve search. Those pull requests are as useful as new icons.

## Code of Conduct

This project has adopted the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security issue notifications

If you find a potential security issue, report it privately as described in [SECURITY.md](SECURITY.md). Please do **not** open a public GitHub issue.

## Licensing

This project is licensed under the [MIT License](LICENSE). By contributing, you agree that your contribution is licensed under the same terms. Icon submissions must also include the license of the artwork itself.
