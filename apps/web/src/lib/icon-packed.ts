import fs from "node:fs/promises";
import path from "node:path";

/**
 * Compact on-disk format for vendored filesystem icon sets.
 * One JSON file per set at icons/vendored/{setId}.json — same idea as Iconify
 * (icons/iconify/{prefix}.json), keyed by the legacy relative filePath so
 * /api/icon-svg and icons-meta stay compatible.
 */
export type PackedIcon = {
	/** Full SVG document (preserves viewBox / stroke attrs for FS recoloring). */
	svg: string;
	name: string;
	styleId: string;
	/** Lucide-style tags/categories/aliases when available. */
	tags?: string[];
};

export type PackedSetFile = {
	v: 1;
	prefix: string;
	icons: Record<string, PackedIcon>;
};

/**
 * theSVG packed registry: metadata keeps the same variant→filePath map, and
 * SVG bodies live in a flat `svgs` table keyed by those paths.
 */
export type TheSvgPackedRegistry = {
	v: 2;
	source?: string;
	fetchedAt: string;
	icons: Array<{
		slug: string;
		title: string;
		aliases: string[];
		categories: string[];
		hex?: string;
		license?: string;
		url?: string;
		collection?: string;
		variants: Record<string, string>;
	}>;
	svgs: Record<string, string>;
};

type PackedCache = {
	sets: Map<string, PackedSetFile | null>;
	thesvg: TheSvgPackedRegistry | null | undefined;
};

function getCache(): PackedCache {
	const g = globalThis as unknown as { __ariaPackedIconCache?: PackedCache };
	if (!g.__ariaPackedIconCache) {
		g.__ariaPackedIconCache = { sets: new Map(), thesvg: undefined };
	}
	return g.__ariaPackedIconCache;
}

function vendoredDir() {
	return path.join(process.cwd(), "icons", "vendored");
}

export function packedSetPath(setId: string) {
	return path.join(vendoredDir(), `${setId}.json`);
}

export function packedTheSvgPath() {
	return path.join(process.cwd(), "icons", "thesvg.json");
}

export async function loadPackedSet(setId: string): Promise<PackedSetFile | null> {
	if (!/^[a-z0-9-]+$/.test(setId)) return null;
	const cache = getCache();
	if (cache.sets.has(setId)) return cache.sets.get(setId) ?? null;
	let set: PackedSetFile | null = null;
	try {
		const raw = await fs.readFile(packedSetPath(setId), "utf8");
		set = JSON.parse(raw) as PackedSetFile;
	} catch {
		set = null;
	}
	cache.sets.set(setId, set);
	return set;
}

export async function listPackedSetIds(): Promise<string[]> {
	try {
		const entries = await fs.readdir(vendoredDir());
		return entries
			.filter((f) => f.endsWith(".json"))
			.map((f) => f.slice(0, -5))
			.sort();
	} catch {
		return [];
	}
}

export async function loadPackedTheSvg(): Promise<TheSvgPackedRegistry | null> {
	const cache = getCache();
	if (cache.thesvg !== undefined) return cache.thesvg;
	try {
		const raw = await fs.readFile(packedTheSvgPath(), "utf8");
		cache.thesvg = JSON.parse(raw) as TheSvgPackedRegistry;
	} catch {
		cache.thesvg = null;
	}
	return cache.thesvg;
}

/** Clear module caches (used by the pack script / tests). */
export function clearPackedIconCache() {
	const cache = getCache();
	cache.sets.clear();
	cache.thesvg = undefined;
}
