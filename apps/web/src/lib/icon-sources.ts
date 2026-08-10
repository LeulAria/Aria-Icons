import { ICON_SETS, type IconSetConfig } from "./icon-sets";
import {
	isLogoOrColoredSet,
	listIconifyPrefixes,
	loadIconifyCollections,
} from "./iconify";
import {
	loadTheSvgRegistry,
	sortVariantKeys,
	THESVG_SET_ID,
} from "./thesvg";

/** Iconify prefixes that collide with vendored / theSVG set ids. */
const RESERVED_ICONIFY_PREFIXES = new Set([
	...ICON_SETS.map((s) => s.id),
	THESVG_SET_ID,
	"thesvg-color",
]);

/**
 * Unified registry across the three icon storage backends:
 * - "fs":      vendored sets as icons/vendored/{setId}.json (or loose SVGs)
 * - "thesvg":  brand icons as icons/thesvg.json (or loose registry + SVGs)
 * - "iconify": compact Iconify JSON sets (rendered on demand)
 */
export type IconSourceKind = "fs" | "thesvg" | "iconify";

const FS_SET_IDS = new Set(ICON_SETS.map((s) => s.id));

export async function getIconSourceKind(
	setId: string,
): Promise<IconSourceKind | null> {
	if (FS_SET_IDS.has(setId)) return "fs";
	if (setId === THESVG_SET_ID) {
		return (await loadTheSvgRegistry()) ? "thesvg" : null;
	}
	const prefixes = await listIconifyPrefixes();
	return prefixes.includes(setId) ? "iconify" : null;
}

function prettyStyleLabel(id: string) {
	return id
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

async function buildTheSvgConfig(): Promise<IconSetConfig | null> {
	const registry = await loadTheSvgRegistry();
	if (!registry) return null;
	const variantKeys = new Set<string>();
	for (const icon of registry.icons) {
		for (const key of Object.keys(icon.variants)) variantKeys.add(key);
	}
	return {
		id: THESVG_SET_ID,
		label: "theSVG Brands",
		homepage: "https://thesvg.org",
		styles: sortVariantKeys(Array.from(variantKeys)).map((id) => ({
			id,
			label: prettyStyleLabel(id),
			// Brand logos are filled artwork; group them under the Fill toggle.
			group: "solid" as const,
		})),
	};
}

async function buildIconifyConfigs(): Promise<IconSetConfig[]> {
	const prefixes = (await listIconifyPrefixes()).filter(
		(p) => !RESERVED_ICONIFY_PREFIXES.has(p),
	);
	if (prefixes.length === 0) return [];
	const collections = await loadIconifyCollections();
	return prefixes.map((prefix) => {
		const logoOrColor = isLogoOrColoredSet(prefix, collections);
		return {
			id: prefix,
			label: collections?.[prefix]?.name ?? prefix,
			homepage: `https://icones.js.org/collection/${prefix}`,
			// Logo / colored sets only expose Fill — they never appear under Line.
			styles: logoOrColor
				? [{ id: "solid", label: "Fill", group: "solid" as const }]
				: [
						{ id: "line", label: "Line", group: "line" as const },
						{ id: "solid", label: "Fill", group: "solid" as const },
					],
		};
	});
}

/**
 * All set configs for the browser UI: vendored sets first, then brands, then
 * downloaded Iconify sets. Server-only (reads the filesystem).
 */
export async function getAllIconSetConfigs(): Promise<IconSetConfig[]> {
	const [thesvg, iconify] = await Promise.all([
		buildTheSvgConfig(),
		buildIconifyConfigs(),
	]);
	return [...ICON_SETS, ...(thesvg ? [thesvg] : []), ...iconify];
}

/** Every known set id (used for MCP icon-id parsing). */
export async function getAllIconSetIds(): Promise<string[]> {
	const configs = await getAllIconSetConfigs();
	return configs.map((c) => c.id);
}
