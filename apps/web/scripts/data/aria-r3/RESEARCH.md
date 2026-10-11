# Aria gap round 3 — progress (checkpoint 2026-10-11 11:10 GST)

Target: 600,000 verified-unique new icons. Status: sweeps running; numbers below are interim.

## Method
- Exclusion: 1,159 shipped sets (Iconify collections.json 239 / prefixes.json 224 + vendored families named in icon-sets.ts) + all URLs in prior research files (900 GitHub repo URLs, 238 Iconify names).
- Geometry dedupe: every SVG rendered with resvg → 12×12 binary raster fingerprint, compared against the full @iconify/json set (396k icons → 278k fingerprints) and across all candidates (first-come, permissive first). Size/variant filenames are collapsed.
- Re-export filter: any candidate with ≥15% of its geometry already in Iconify, or whose name/description/path points at a known set (Font Awesome, Material, Fluent, Lucide, Flaticon UIcons, etc.), is dropped entirely.
- Licence from the LICENSE file or package.json; NC/ND/unknown are excluded.

## Totals (icons only; clipart separate), updated by checkpoint
- Strict icon families: permissive 104,439 / copyleft 7,069
- Aggregator residuals (SVG Repo, SVGFind PD, Wikimedia Commons): permissive 167,028 / copyleft 14,009
- ICON TOTAL: 292,545 (target 600,000)
- Clipart (CC0, not counted): 128,829

Round 3b sweeps: Round 5: X deep DONE (46 queries). GitHub monthly topic windows: 500 994 3414; owner-network: 110. Batches verified continuously.

Raw per-repo results: aria-gap-round3.jsonl. Manifest: aria-gap-round3-manifest.json
