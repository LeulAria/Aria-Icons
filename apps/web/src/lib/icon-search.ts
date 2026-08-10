import type { CatalogIcon } from "@/lib/icon-catalog";
import type { IconStyleGroup } from "@/lib/icon-sets";
import { iconKey } from "@/lib/icon-workspace";

export type SearchFilters = {
	collection: "all" | "favorites" | "recent" | string;
	styleGroup: IconStyleGroup | "both";
	selectedStyleId: string;
	favoriteKeys?: Set<string>;
	recentKeys?: Set<string>;
};

export function matchesFilters(icon: CatalogIcon, filters: SearchFilters): boolean {
	const { collection, styleGroup, selectedStyleId } = filters;

	if (collection === "favorites") {
		return Boolean(filters.favoriteKeys?.has(iconKey(icon)));
	}
	if (collection === "recent") {
		return Boolean(filters.recentKeys?.has(iconKey(icon)));
	}

	if (collection !== "all" && icon.setId !== collection) return false;

	// Line / Fill / Both is the primary toggle. Line = stroke UI icons only
	// (logos + colored sets are indexed as solid/Fill and never match here).
	if (styleGroup !== "both" && icon.group !== styleGroup) return false;

	// Within a specific library, optionally narrow to one concrete style
	// (e.g. Tabler "outline", theSVG "mono").
	if (
		collection !== "all" &&
		selectedStyleId !== "both" &&
		selectedStyleId !== styleGroup &&
		icon.styleId !== selectedStyleId
	) {
		return false;
	}

	return true;
}

export function filterCatalogIcons(
	icons: CatalogIcon[],
	filters: SearchFilters,
): CatalogIcon[] {
	return icons.filter((icon) => matchesFilters(icon, filters));
}

/**
 * Fast ranked search: token scoring over precomputed lowercase names.
 * A linear scan stays fast at 300k+ icons (Fuse.js index build/search does
 * not), and exact/word/prefix ranking beats fuzzy matching for icon names.
 */
export type SearchContext = {
	icons: CatalogIcon[];
	/** Lowercased names, precomputed once per catalog. */
	names: string[];
};

export function createSearchContext(icons: CatalogIcon[]): SearchContext {
	return {
		icons,
		names: icons.map((icon) => icon.name.toLowerCase()),
	};
}

export function tokenizeQuery(query: string): string[] {
	return query.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

/** Score one token against an icon; 0 = no match. */
function scoreToken(
	name: string,
	icon: CatalogIcon,
	token: string,
): number {
	if (name === token) return 100;
	const hitAt = name.indexOf(token);
	if (hitAt === 0) {
		// Prefix; full word prefix ("arrow" in "arrow-up") ranks higher.
		const end = name.charAt(token.length);
		return end === "" || end === "-" || end === "_" ? 90 : 82;
	}
	if (hitAt > 0) {
		const before = name.charAt(hitAt - 1);
		return before === "-" || before === "_" ? 78 : 65;
	}

	let best = 0;
	for (const tag of icon.tags ?? []) {
		if (tag === token) {
			best = 60;
			break;
		}
		if (best < 48 && tag.startsWith(token)) best = 48;
		else if (best < 35 && tag.includes(token)) best = 35;
	}
	if (best === 0 && icon.setId.includes(token)) best = 25;
	return best;
}

export function scoreIcon(
	ctx: SearchContext,
	index: number,
	tokens: string[],
): number {
	const icon = ctx.icons[index];
	const name = ctx.names[index];
	if (!icon || name == null) return 0;
	let total = 0;
	for (const token of tokens) {
		const s = scoreToken(name, icon, token);
		if (s === 0) return 0;
		total += s;
	}
	// Slight penalty for longer names so "home" outranks "home-heart-fill".
	return total / tokens.length - Math.min(name.length * 0.1, 8);
}

export function searchWithContext(
	ctx: SearchContext,
	query: string,
	filters?: SearchFilters,
): CatalogIcon[] {
	const tokens = tokenizeQuery(query);
	if (tokens.length === 0) {
		return filters ? filterCatalogIcons(ctx.icons, filters) : ctx.icons;
	}

	const hits: Array<{ icon: CatalogIcon; score: number }> = [];
	for (let i = 0; i < ctx.icons.length; i++) {
		const icon = ctx.icons[i];
		if (!icon) continue;
		if (filters && !matchesFilters(icon, filters)) continue;
		const score = scoreIcon(ctx, i, tokens);
		if (score > 0) hits.push({ icon, score });
	}

	hits.sort(
		(a, b) => b.score - a.score || a.icon.name.localeCompare(b.icon.name),
	);
	return hits.map((h) => h.icon);
}

/** Convenience wrapper for one-off searches (builds a throwaway context). */
export function searchCatalogIcons(
	icons: CatalogIcon[],
	query: string,
	filters?: SearchFilters,
): CatalogIcon[] {
	return searchWithContext(createSearchContext(icons), query, filters);
}
