import { ICON_SETS } from "./icon-sets";

/**
 * Browse priority for the All Icons grid (lower = earlier).
 * Iconify packs first, then theSVG brands, then curated / vendored sets.
 */
const VENDORED_RANK = new Map(ICON_SETS.map((set, index) => [set.id, index]));

export function setBrowsePriority(setId: string): number {
	const vendored = VENDORED_RANK.get(setId);
	if (vendored != null) return 2_000 + vendored;
	if (setId === "thesvg") return 1_000;
	return 0; // Iconify
}

/** Sort icons for empty-query "All Icons" browsing. */
export function compareIconsForBrowse(
	a: { setId: string; name: string },
	b: { setId: string; name: string },
): number {
	const bySet = setBrowsePriority(a.setId) - setBrowsePriority(b.setId);
	if (bySet !== 0) return bySet;
	const byName = a.name.localeCompare(b.name);
	if (byName !== 0) return byName;
	return a.setId.localeCompare(b.setId);
}
