# Changelog

All notable changes to Aria Icons are documented here and in the in-app changelog (`apps/web/src/lib/changelog.ts`).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
