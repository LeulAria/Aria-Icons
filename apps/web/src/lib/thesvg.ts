import fs from "node:fs/promises";
import path from "node:path";
import { loadPackedTheSvg } from "./icon-packed";

/**
 * Server-side support for theSVG brand icons (https://thesvg.org).
 *
 * Preferred (packed): icons/thesvg.json — registry metadata + SVG bodies.
 * Legacy (loose):     icons/thesvg/registry.json + per-variant SVG files
 *                     (created by fetch:thesvg, then collapsed by pack:icons)
 */

export const THESVG_SET_ID = "thesvg";

export type TheSvgRegistryEntry = {
	slug: string;
	title: string;
	aliases: string[];
	categories: string[];
	hex?: string;
	license?: string;
	url?: string;
	collection?: string;
	/** normalized variant key -> file path relative to icons/thesvg */
	variants: Record<string, string>;
};

export type TheSvgRegistry = {
	v: 1;
	fetchedAt: string;
	icons: TheSvgRegistryEntry[];
};

/** Preferred display order for brand variants. */
export const THESVG_VARIANT_ORDER = [
	"default",
	"color",
	"mono",
	"light",
	"dark",
	"wordmark",
	"wordmark-light",
	"wordmark-dark",
];

type TheSvgCache = {
	registry: TheSvgRegistry | null;
	loaded: boolean;
	bySlug: Map<string, TheSvgRegistryEntry> | null;
};

function getCache(): TheSvgCache {
	const g = globalThis as unknown as { __ariaTheSvgCache?: TheSvgCache };
	if (!g.__ariaTheSvgCache) {
		g.__ariaTheSvgCache = { registry: null, loaded: false, bySlug: null };
	}
	return g.__ariaTheSvgCache;
}

export async function loadTheSvgRegistry(): Promise<TheSvgRegistry | null> {
	const cache = getCache();
	if (cache.loaded) return cache.registry;

	const packed = await loadPackedTheSvg();
	if (packed) {
		cache.registry = {
			v: 1,
			fetchedAt: packed.fetchedAt,
			icons: packed.icons,
		};
		cache.loaded = true;
		return cache.registry;
	}

	try {
		const raw = await fs.readFile(
			path.join(process.cwd(), "icons", THESVG_SET_ID, "registry.json"),
			"utf8",
		);
		cache.registry = JSON.parse(raw) as TheSvgRegistry;
	} catch {
		cache.registry = null;
	}
	cache.loaded = true;
	return cache.registry;
}

export async function getTheSvgEntry(
	slug: string,
): Promise<TheSvgRegistryEntry | null> {
	const registry = await loadTheSvgRegistry();
	if (!registry) return null;
	const cache = getCache();
	if (!cache.bySlug) {
		cache.bySlug = new Map(registry.icons.map((i) => [i.slug, i]));
	}
	return cache.bySlug.get(slug) ?? null;
}

export function sortVariantKeys(keys: string[]): string[] {
	return keys.slice().sort((a, b) => {
		const ai = THESVG_VARIANT_ORDER.indexOf(a);
		const bi = THESVG_VARIANT_ORDER.indexOf(b);
		if (ai !== -1 && bi !== -1) return ai - bi;
		if (ai !== -1) return -1;
		if (bi !== -1) return 1;
		return a.localeCompare(b);
	});
}

/**
 * Pick one entry per unique SVG file: "default" often aliases another variant
 * key (e.g. color.svg), so we dedupe by target file and keep the
 * highest-priority key for each.
 */
export function dedupedVariants(
	entry: TheSvgRegistryEntry,
): Array<{ styleId: string; filePath: string }> {
	const byFile = new Map<string, string>();
	for (const key of sortVariantKeys(Object.keys(entry.variants))) {
		const file = entry.variants[key];
		if (!byFile.has(file)) byFile.set(file, key);
	}
	return Array.from(byFile, ([filePath, styleId]) => ({ styleId, filePath }));
}
