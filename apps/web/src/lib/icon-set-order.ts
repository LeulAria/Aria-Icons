import { ICON_SETS } from "./icon-sets";

/**
 * Browse priority for the All Icons grid (lower = earlier).
 * Iconify line icons first, then other Iconify, then brands, then curated.
 */
const VENDORED_RANK = new Map(ICON_SETS.map((set, index) => [set.id, index]));

export function setBrowsePriority(
	setId: string,
	group?: "line" | "solid",
): number {
	const vendored = VENDORED_RANK.get(setId);
	if (vendored != null) return 3_000 + vendored;
	if (setId === "thesvg") return 2_000;
	// Iconify: line packs before fill/solid packs
	if (group === "line") return 0;
	return 1_000;
}

/** Sort icons for empty-query "All Icons" browsing. */
export function compareIconsForBrowse(
	a: { setId: string; name: string; group?: "line" | "solid" },
	b: { setId: string; name: string; group?: "line" | "solid" },
): number {
	const bySet =
		setBrowsePriority(a.setId, a.group) - setBrowsePriority(b.setId, b.group);
	if (bySet !== 0) return bySet;
	const byName = a.name.localeCompare(b.name);
	if (byName !== 0) return byName;
	return a.setId.localeCompare(b.setId);
}
