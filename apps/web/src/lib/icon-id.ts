import { parseIconId } from "@/lib/icon-resolve";

/**
 * Friendly collection names accepted by the CLI / public API.
 * Canonical ids stay as they are in the catalog (e.g. lucide-icons, ph).
 */
export const COLLECTION_ALIASES: Record<string, string> = {
	lucide: "lucide-icons",
	tabler: "tabler-icons",
	feather: "feathers",
	hero: "heroicons",
	phosphor: "ph",
	brands: "thesvg",
	ion: "ionicons",
	akar: "akar-icons",
	bytesize: "bytesize-icons",
	iconic: "iconicicons",
	material: "mdi",
};

/** Short names used when printing icon ids (`lucide:house` instead of `lucide-icons:house`). */
export const SHORT_COLLECTION_NAMES: Record<string, string> = {
	"lucide-icons": "lucide",
	"tabler-icons": "tabler",
	feathers: "feather",
	ionicons: "ion",
	"akar-icons": "akar",
	"bytesize-icons": "bytesize",
	iconicicons: "iconic",
};

/** Common Lucide renames and shorthand the catalog no longer uses as file names. */
export const ICON_NAME_ALIASES: Record<string, string> = {
	"more-horizontal": "ellipsis",
	"more-vert": "ellipsis-vertical",
	"more-vertical": "ellipsis-vertical",
	filter: "list-filter",
	home: "house",
};

export function aliasIconName(name: string): string {
	return ICON_NAME_ALIASES[name.toLowerCase()] ?? name;
}

export function canonicalCollectionId(input: string): string {
	const trimmed = input.trim().toLowerCase();
	return COLLECTION_ALIASES[trimmed] ?? trimmed;
}

export function displayCollectionId(setId: string): string {
	return SHORT_COLLECTION_NAMES[setId] ?? setId;
}

export function toPublicIconId(setId: string, name: string): string {
	return `${displayCollectionId(setId)}:${name}`;
}

export function toLegacyIconId(setId: string, name: string): string {
	return `${setId}-${name.toLowerCase()}`;
}

export type ParsedIconId = { setId: string; name: string };

/**
 * Parse CLI / public ids:
 *   lucide:house
 *   lucide-icons:house
 *   lucide-icons-house   (legacy MCP)
 */
export function parsePublicIconId(
	iconId: string,
	knownSetIds: string[],
): ParsedIconId | null {
	const raw = iconId.trim();
	if (!raw) return null;

	const colon = raw.indexOf(":");
	if (colon > 0) {
		const setId = canonicalCollectionId(raw.slice(0, colon));
		const name = aliasIconName(raw.slice(colon + 1).trim());
		if (!name) return null;
		const known = new Set(knownSetIds);
		if (known.size > 0 && !known.has(setId)) return null;
		return { setId, name };
	}

	const hyphen = parseIconId(raw, knownSetIds);
	if (hyphen) return hyphen;

	// `lucide-house` where lucide is an alias, not a catalog set id.
	for (const [alias, canonical] of Object.entries(COLLECTION_ALIASES)) {
		if (!raw.startsWith(`${alias}-`)) continue;
		const name = raw.slice(alias.length + 1);
		if (!name) continue;
		return { setId: canonical, name };
	}

	return null;
}
