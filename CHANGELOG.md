# Changelog

All notable changes to Aria Icons are documented here and in the in-app changelog (`apps/web/src/lib/changelog.ts`).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2026-10-08] — ~300k open icon families (gap research rounds 1 + 2)

Vendored **597** open SVG icon families from the October 2026 gap research (**274,321** icons after the pack quality/dedupe pass). Catalog estimate: about **1,301,569** icons across **1,159** sets (previous baseline 1,027,248 / 562).

Of the packed icons, **135,099** are from copyleft families (GPL/LGPL/CC-BY-SA/MPL/EPL) and **139,222** are from permissive licences. Licence, copyleft, and CC-BY attribution fields are stored on each set in `icon-sets.ts`. Icons ship as packed JSON under `apps/web/icons/vendored/` (same approach as prior large imports), not as loose SVGs.

Research target was 300,147 new unique icons across 621 families; 24 families were skipped (unreachable, empty, or non-extractable sources — nothing substituted).

### Added (highlights)

| Family | Source | License | Icons |
|--------|--------|---------|------:|
| PhyloPic silhouettes | [phylopic.org](https://www.phylopic.org/) | CC0 / PDM / CC-BY | 11,067 |
| Lazycons Pro | [xprateek/lazycons_pro](https://github.com/xprateek/lazycons_pro) | Apache-2.0 | 5,936 |
| luceviasicons | [luceviasicons/luceviasicons](https://github.com/luceviasicons/luceviasicons) | MIT | 4,802 |
| Besgnulinux Circle | [opendesktop 2158340](https://www.opendesktop.org/p/2158340) | GPL-3.0 | 4,622 |
| Alfa-Bank UI primitives | [npm ui-primitives](https://www.npmjs.com/package/ui-primitives) | MIT (package.json) | 4,287 |
| Cisco Momentum Design | [momentum-design/momentum-design](https://github.com/momentum-design/momentum-design) | MIT | 3,223 |
| … | 591 more families | see set metadata | … |

Full per-family licence metadata is in `apps/web/src/lib/icon-sets.ts` (GAP_300K block) and `apps/web/scripts/data/aria-300k/import-report.json`.

### Skipped

| Family | Source | License | Reason |
|--------|--------|---------|--------|
| AdLib Icons full theme | [opendesktop 2319998](https://www.opendesktop.org/p/2319998) | GPL-3.0 | Archive corrupt or not a valid zip/tar |
| AIGA/US DOT symbol signs | [Commons](https://commons.wikimedia.org/wiki/Category:AIGA_symbol_signs) | PD / CC0 / CC-BY | Wikimedia originals unreachable |
| Arc Elementary Icons | [opendesktop 1084955](https://www.opendesktop.org/p/1084955) | GPL-3.0 | Pling download unreachable |
| Arc Flat Elementary Icons | [opendesktop 1089818](https://www.opendesktop.org/p/1089818) | GPL-3.0 | Pling download unreachable |
| Ardis circle and square | [opendesktop 1011967](https://www.opendesktop.org/p/1011967) | GPL-2.0 | No usable SVGs after fetch/filter |
| bold-colors | [opendesktop 1532872](https://www.opendesktop.org/p/1532872) | GPL-3.0 | Archive corrupt or not a valid zip/tar |
| Bonandry's GNOME Icons for LibreOffice | [opendesktop 1011937](https://www.opendesktop.org/p/1011937) | GPL-3.0 | Pling download unreachable |
| cscs-icons-svg | [npm](https://www.npmjs.com/package/cscs-icons-svg) | MIT | Archive extract failed |
| Flexicons | [opendesktop 1508659](https://www.opendesktop.org/p/1508659) | GPL-3.0 | Archive corrupt or not a valid zip/tar |
| Game/Forum icons (OpenGameArt) | [OGA](https://opengameart.org/content/gameforum-icons) | CC0 | No usable SVGs after fetch/filter |
| GitLab illustrations | [gitlabhq/gitlab-svgs](https://github.com/gitlabhq/gitlab-svgs) | MIT | Git clone failed |
| Glitch Food & Drink Items (SVG) | [OGA](https://opengameart.org/content/glitch-food-drink-items-svg) | CC0 | No usable SVGs after fetch/filter |
| Graphis (npm font package) | [npm graphis](https://www.npmjs.com/package/graphis) | MIT | Path list is font tables only (repo Graphis was imported separately) |
| GruvAdwat icon theme | [opendesktop 2366662](https://www.opendesktop.org/p/2366662) | GPL-3.0 | Pling download unreachable |
| Inkscape UI icons | [inkscape/inkscape](https://github.com/inkscape/inkscape) | GPL-2.0-or-later | No usable SVGs after fetch/filter |
| Lila-Ubuntu | [opendesktop 1012315](https://www.opendesktop.org/p/1012315) | GPL-2.0 | No usable SVGs after fetch/filter |
| Luminary Icon Set | [opendesktop 1269689](https://www.opendesktop.org/p/1269689) | GPL-3.0 | Archive extract failed |
| MyMint Elementary | [opendesktop 1012040](https://www.opendesktop.org/p/1012040) | GPL-3.0 | Pling download unreachable |
| NIH BioArt Source | [bioart.niaid.nih.gov](https://bioart.niaid.nih.gov/) | Public Domain | Per-id authenticated API; not automated |
| Papirus Colors | [opendesktop 1012110](https://www.opendesktop.org/p/1012110) | CC-BY-SA-4.0 | Archive corrupt or not a valid zip/tar |
| scarce | [opendesktop 1506885](https://www.opendesktop.org/p/1506885) | GPL-3.0 | Archive corrupt or not a valid zip/tar |
| TurkinOS icon Theme | [opendesktop 1369690](https://www.opendesktop.org/p/1369690) | GPL-3.0 | Pling download unreachable |
| Yr weather symbols | [nrkno/yr-weather-symbols](https://github.com/nrkno/yr-weather-symbols) | CC-BY-4.0 | No usable SVGs after fetch/filter |
| ZevenOS icons | [opendesktop 1442196](https://www.opendesktop.org/p/1442196) | GPL-2.0-or-later | Archive corrupt or not a valid zip/tar |

### Changed

- Added `bun run fetch:300k` (`apps/web/scripts/fetch-300k-families.ts`) — manifest-driven importer for the gap research batch.
- Extended `IconSetConfig` with optional `license`, `copyleft`, and `attribution`.
- `pack:icons --only` accepts comma-separated set ids for incremental packing.
- Registered Cisco Momentum Design (`momentum-icons`) and Clarity (`clarity-icon-theme`) which were listed in `fetch:p0` but never registered.

## [2026-10-08] — Ten more open icon families

Vendored 10 open icon families from the October 2026 gap report (~27,099 icons after the quality/dedupe pass). Catalog estimate: about **1,027,248** icons across **562** sets (previous baseline 1,000,149 / 552).

### Added

| Family | Source | License | Icons | Notes |
|--------|--------|---------|------:|-------|
| With Icons | [withevergrow/withicons](https://github.com/withevergrow/withicons) (`@withicons/static`) | MIT | 9,999 | 500 icons × 20 styles |
| MX Icons | [ig-imanish/mx-icons](https://github.com/ig-imanish/mx-icons) | MIT | 10,832 | 6 styles; foreign duplicates dropped |
| Reicon Glass | [dqev/reicon-glass](https://github.com/dqev/reicon-glass) | MIT (README; no LICENSE file) | 2,665 | Path glyphs from `icon-data.json` |
| Obra Icons | [Obra-Studio/obra-icons-mr](https://github.com/Obra-Studio/obra-icons-mr) | MIT | 1,047 | |
| Meya Icons | [nazmijavier/meya-icons](https://github.com/nazmijavier/meya-icons) | MIT | 858 | Outline + Duotone |
| Finicon | [npm finicon](https://www.npmjs.com/package/finicon) | MIT (README) | 512 | Extracted from package font |
| Singularity Icons | [singularityos-lab/singularity-themes](https://github.com/singularityos-lab/singularity-themes) | GPL-3.0 | 474 | Desktop theme; same GPL class as Papirus etc. |
| Animated Icons (Koven Labs) | [kovenlabs/animated-icons](https://github.com/kovenlabs/animated-icons) | MIT | 335 | Static path extracts |
| Its Hover | [itshover/itshover](https://github.com/itshover/itshover) | Apache-2.0 | 211 | Static extracts; Tabler-overlap dupes dropped |
| Iconimate | [smammar100/Iconimate](https://github.com/smammar100/Iconimate) | MIT | 166 | Static extracts (Phosphor-grid geometry) |

### Skipped

| Family | Source | License | Reason |
|--------|--------|---------|--------|
| 3dicons | [realvjy/3dicons](https://github.com/realvjy/3dicons) | CC0-1.0 | No usable static SVGs — 3D raster/Blender renders (previously removed for blurred artwork) |
| Morphicons | [guillermolg00/morphicons](https://github.com/guillermolg00/morphicons) | MIT | Morphing library, not an icon pack; already an Aria npm dependency |

### Changed

- Added `bun run fetch:gap` (`apps/web/scripts/fetch-oss-gap-families.ts`) for this import batch.
- Pack hash indexing skips Git LFS pointer files so packing works on shallow checkouts.
