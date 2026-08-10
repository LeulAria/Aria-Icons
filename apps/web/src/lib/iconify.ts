import fs from "node:fs/promises";
import path from "node:path";

/**
 * Server-side support for Iconify icon sets (the data model behind Icônes).
 * Each set lives as ONE compact JSON file at icons/iconify/{prefix}.json —
 * icon name -> SVG body string. SVGs are rendered on demand.
 */

export type IconifyIconData = {
	body: string;
	width?: number;
	height?: number;
	left?: number;
	top?: number;
	hidden?: boolean;
};

export type IconifyAlias = {
	parent: string;
	hidden?: boolean;
};

export type IconifySetFile = {
	prefix: string;
	info?: {
		name?: string;
		author?: { name?: string; url?: string };
		license?: { title?: string; spdx?: string };
	};
	icons: Record<string, IconifyIconData>;
	aliases?: Record<string, IconifyAlias>;
	categories?: Record<string, string[]>;
	width?: number;
	height?: number;
};

export type IconifyCollectionsFile = Record<
	string,
	{
		name: string;
		total: number;
		palette?: boolean;
		category?: string;
		author?: { name?: string; url?: string };
	}
>;

/**
 * Logo / colored / emoji / flag sets belong under Fill — never the Line tab
 * (Line is for stroke UI icons only).
 */
const LOGO_COLORED_CATEGORIES = new Set([
	"logos",
	"emoji",
	"flags / maps",
	"ui multicolor",
]);

export function isLogoOrColoredSet(
	prefix: string,
	collections: IconifyCollectionsFile | null | undefined,
): boolean {
	const info = collections?.[prefix];
	if (info?.palette) return true;
	const category = (info?.category ?? "").trim().toLowerCase();
	if (LOGO_COLORED_CATEGORIES.has(category)) return true;
	if (category.includes("logo") || category.includes("emoji") || category.includes("flag")) {
		return true;
	}
	// Prefix heuristics for sets missing category metadata.
	if (/(^|-)(logo|logos|brand|brands|flag|flags|emoji|color)($|-)/i.test(prefix)) {
		return true;
	}
	return false;
}

function iconifyDir() {
	return path.join(process.cwd(), "icons", "iconify");
}

type IconifyCache = {
	sets: Map<string, IconifySetFile | null>;
	prefixes: string[] | null;
	prefixesDirMtimeMs: number;
	collections: IconifyCollectionsFile | null;
};

function getCache(): IconifyCache {
	const g = globalThis as unknown as { __ariaIconifyCache?: IconifyCache };
	if (!g.__ariaIconifyCache) {
		g.__ariaIconifyCache = {
			sets: new Map(),
			prefixes: null,
			prefixesDirMtimeMs: 0,
			collections: null,
		};
	}
	return g.__ariaIconifyCache;
}

/** List downloaded Iconify set prefixes (scans icons/iconify/*.json). */
export async function listIconifyPrefixes(): Promise<string[]> {
	const cache = getCache();
	let dirMtimeMs = 0;
	try {
		dirMtimeMs = (await fs.stat(iconifyDir())).mtimeMs;
	} catch {
		return [];
	}
	if (cache.prefixes && cache.prefixesDirMtimeMs === dirMtimeMs) {
		return cache.prefixes;
	}
	let prefixes: string[] = [];
	try {
		const entries = await fs.readdir(iconifyDir());
		prefixes = entries
			.filter((f) => f.endsWith(".json") && f !== "collections.json")
			.map((f) => f.slice(0, -5))
			.sort();
	} catch {
		prefixes = [];
	}
	cache.prefixes = prefixes;
	cache.prefixesDirMtimeMs = dirMtimeMs;
	return prefixes;
}

export async function loadIconifyCollections(): Promise<IconifyCollectionsFile | null> {
	const cache = getCache();
	if (cache.collections) return cache.collections;
	try {
		const raw = await fs.readFile(
			path.join(iconifyDir(), "collections.json"),
			"utf8",
		);
		cache.collections = JSON.parse(raw) as IconifyCollectionsFile;
	} catch {
		cache.collections = null;
	}
	return cache.collections;
}

export async function loadIconifySet(
	prefix: string,
): Promise<IconifySetFile | null> {
	if (!/^[a-z0-9-]+$/.test(prefix)) return null;
	const cache = getCache();
	if (cache.sets.has(prefix)) return cache.sets.get(prefix) ?? null;
	let set: IconifySetFile | null = null;
	try {
		const raw = await fs.readFile(
			path.join(iconifyDir(), `${prefix}.json`),
			"utf8",
		);
		set = JSON.parse(raw) as IconifySetFile;
	} catch {
		set = null;
	}
	cache.sets.set(prefix, set);
	return set;
}

/** Resolve an icon by name, following alias chains. */
export function resolveIconifyIcon(
	set: IconifySetFile,
	name: string,
): IconifyIconData | null {
	let current = name;
	for (let hops = 0; hops < 6; hops++) {
		const icon = set.icons[current];
		if (icon) return icon;
		const alias = set.aliases?.[current];
		if (!alias) return null;
		current = alias.parent;
	}
	return null;
}

/**
 * Heuristic used for the UI's Line/Fill toggle: stroke-drawn icons mark their
 * paths with fill="none".
 */
export function isIconifyLineIcon(body: string): boolean {
	return body.includes('fill="none"');
}

export function renderIconifySvg(
	set: IconifySetFile,
	name: string,
	options?: { size?: number | string; color?: string },
): string | null {
	const icon = resolveIconifyIcon(set, name);
	if (!icon) return null;

	const width = icon.width ?? set.width ?? 16;
	const height = icon.height ?? set.height ?? 16;
	const left = icon.left ?? 0;
	const top = icon.top ?? 0;

	let body = icon.body;
	if (options?.color) {
		body = body.replaceAll("currentColor", options.color);
	}

	const size = options?.size;
	const outWidth = size ?? width;
	const outHeight = size ?? height;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}" viewBox="${left} ${top} ${width} ${height}">${body}</svg>`;
}

/** Invert the set's categories map into per-icon tag lists. */
export function buildIconifyTagMap(set: IconifySetFile): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const [category, names] of Object.entries(set.categories ?? {})) {
		const tag = category.trim().toLowerCase();
		if (!tag) continue;
		for (const name of names) {
			const existing = map.get(name);
			if (existing) existing.push(tag);
			else map.set(name, [tag]);
		}
	}
	// Alias names are searchable tags on their parent icon.
	for (const [aliasName, alias] of Object.entries(set.aliases ?? {})) {
		const existing = map.get(alias.parent);
		if (existing) existing.push(aliasName);
		else map.set(alias.parent, [aliasName]);
	}
	return map;
}
