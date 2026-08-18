import fs from "node:fs/promises";
import path from "node:path";

/**
 * Server-side support for Iconify icon sets (the data model behind Icônes).
 *
 * Locally: each set is icons/iconify/{prefix}.json (via `bun run fetch:iconify`).
 * On Vercel: set bodies are pruned after catalog generation to stay under the
 * function size limit; individual icons are fetched from the Iconify API.
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
		tags?: string[];
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

const ICONIFY_API = "https://api.iconify.design";

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
	remoteIcons: Map<string, IconifyIconData | null>;
	prefixes: string[] | null;
	prefixesDirMtimeMs: number;
	collections: IconifyCollectionsFile | null;
};

function getCache(): IconifyCache {
	const g = globalThis as unknown as { __ariaIconifyCache?: IconifyCache };
	if (!g.__ariaIconifyCache) {
		g.__ariaIconifyCache = {
			sets: new Map(),
			remoteIcons: new Map(),
			prefixes: null,
			prefixesDirMtimeMs: 0,
			collections: null,
		};
	}
	return g.__ariaIconifyCache;
}

/**
 * List Iconify set prefixes available to the app.
 * Prefers icons/iconify/prefixes.json (written at build), then local set files,
 * then collections.json keys (production after prune).
 */
export async function listIconifyPrefixes(): Promise<string[]> {
	const cache = getCache();
	let dirMtimeMs = 0;
	try {
		dirMtimeMs = (await fs.stat(iconifyDir())).mtimeMs;
	} catch {
		return cache.prefixes ?? [];
	}
	if (cache.prefixes && cache.prefixesDirMtimeMs === dirMtimeMs) {
		return cache.prefixes;
	}

	// Build-time manifest of sets that were actually indexed.
	try {
		const raw = await fs.readFile(
			path.join(iconifyDir(), "prefixes.json"),
			"utf8",
		);
		const parsed = JSON.parse(raw) as string[];
		if (Array.isArray(parsed) && parsed.length > 0) {
			const prefixes = parsed.filter((p) => typeof p === "string").sort();
			cache.prefixes = prefixes;
			cache.prefixesDirMtimeMs = dirMtimeMs;
			return prefixes;
		}
	} catch {
		/* fall through */
	}

	let prefixes: string[] = [];
	try {
		const entries = await fs.readdir(iconifyDir());
		prefixes = entries
			.filter(
				(f) =>
					f.endsWith(".json") &&
					f !== "collections.json" &&
					f !== "prefixes.json",
			)
			.map((f) => f.slice(0, -5))
			.sort();
	} catch {
		prefixes = [];
	}

	// Production prune keeps collections.json only — use it as the set list.
	if (prefixes.length === 0) {
		const collections = await loadIconifyCollections();
		if (collections) {
			prefixes = Object.keys(collections).sort();
		}
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
 * Fetch a single icon from the Iconify API (used on Vercel after local set
 * bodies are pruned). Response is a partial set JSON for the requested icons.
 */
async function fetchIconifyIconRemote(
	prefix: string,
	name: string,
): Promise<{
	icon: IconifyIconData;
	width?: number;
	height?: number;
} | null> {
	if (!/^[a-z0-9-]+$/.test(prefix) || !/^[a-zA-Z0-9:_-]+$/.test(name)) {
		return null;
	}
	const cache = getCache();
	const key = `${prefix}:${name}`;
	if (cache.remoteIcons.has(key)) {
		const cached = cache.remoteIcons.get(key);
		return cached ? { icon: cached } : null;
	}

	try {
		const url = `${ICONIFY_API}/${prefix}.json?icons=${encodeURIComponent(name)}`;
		const res = await fetch(url);
		if (!res.ok) {
			cache.remoteIcons.set(key, null);
			return null;
		}
		const data = (await res.json()) as IconifySetFile & {
			not_found?: string[];
		};
		const icon =
			data.icons?.[name] ??
			(data.aliases?.[name]
				? data.icons?.[data.aliases[name].parent]
				: undefined);
		if (!icon) {
			cache.remoteIcons.set(key, null);
			return null;
		}
		cache.remoteIcons.set(key, icon);
		return {
			icon,
			width: icon.width ?? data.width,
			height: icon.height ?? data.height,
		};
	} catch {
		cache.remoteIcons.set(key, null);
		return null;
	}
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
	return renderIconifyIconData(icon, {
		width: icon.width ?? set.width ?? 16,
		height: icon.height ?? set.height ?? 16,
		left: icon.left ?? 0,
		top: icon.top ?? 0,
		...options,
	});
}

function renderIconifyIconData(
	icon: IconifyIconData,
	options: {
		width: number;
		height: number;
		left?: number;
		top?: number;
		size?: number | string;
		color?: string;
	},
): string {
	const left = options.left ?? icon.left ?? 0;
	const top = options.top ?? icon.top ?? 0;
	let body = icon.body;
	if (options.color) {
		body = body.replaceAll("currentColor", options.color);
	}
	const outWidth = options.size ?? options.width;
	const outHeight = options.size ?? options.height;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}" viewBox="${left} ${top} ${options.width} ${options.height}">${body}</svg>`;
}

/**
 * Render an Iconify icon from local set JSON, or the Iconify API when local
 * bodies were pruned (production).
 */
export async function renderIconifyIcon(
	prefix: string,
	name: string,
	options?: { size?: number | string; color?: string },
): Promise<string | null> {
	const local = await loadIconifySet(prefix);
	if (local) {
		return renderIconifySvg(local, name, options);
	}

	const remote = await fetchIconifyIconRemote(prefix, name);
	if (!remote) return null;
	return renderIconifyIconData(remote.icon, {
		width: remote.icon.width ?? remote.width ?? 16,
		height: remote.icon.height ?? remote.height ?? 16,
		left: remote.icon.left ?? 0,
		top: remote.icon.top ?? 0,
		...options,
	});
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
