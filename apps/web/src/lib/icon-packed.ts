import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import type { SvgPaint } from "./svg-paint";

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
	/** Pack-time paint class; absent means a single-color ("mono") icon. */
	paint?: Exclude<SvgPaint, "mono">;
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
	pending: Map<string, Promise<PackedSetFile | null>>;
	thesvg: TheSvgPackedRegistry | null | undefined;
};

function getCache(): PackedCache {
	const g = globalThis as unknown as { __ariaPackedIconCache?: PackedCache };
	if (!g.__ariaPackedIconCache) {
		g.__ariaPackedIconCache = { sets: new Map(), pending: new Map(), thesvg: undefined };
	}
	// Dev HMR can hand back a cache object created before `pending` existed.
	g.__ariaPackedIconCache.pending ??= new Map();
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

/** Public URL path the deploy step moves gzipped vendored packs to. */
export const STATIC_ICON_PACKS_PATH = "icon-packs";

/**
 * Where a deployed function can fetch `{setId}.json.gz` from. Vendored packs are
 * far over the 250 MB function limit, so on Vercel they ship as static assets
 * instead of being traced into functions. Production goes through the
 * production domain (deployment URLs sit behind Vercel Authentication).
 */
function staticPacksBaseUrl(): string | null {
	const explicit = process.env.ICON_PACKS_BASE_URL;
	if (explicit) return explicit.replace(/\/+$/, "");
	const host =
		process.env.VERCEL_ENV === "production"
			? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
			: process.env.VERCEL_URL;
	return host ? `https://${host}/${STATIC_ICON_PACKS_PATH}` : null;
}

function decodePackBytes(bytes: Buffer): string {
	// The CDN may or may not have already undone the gzip.
	const gzipped = bytes.length > 1 && bytes[0] === 0x1f && bytes[1] === 0x8b;
	return (gzipped ? gunzipSync(bytes) : bytes).toString("utf8");
}

/** `undefined` = transient failure (don't cache); `null` = not available. */
async function fetchStaticPack(fileName: string): Promise<string | null | undefined> {
	const base = staticPacksBaseUrl();
	if (!base) return null;
	const headers: Record<string, string> = {};
	const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
	if (bypass) headers["x-vercel-protection-bypass"] = bypass;
	try {
		const res = await fetch(`${base}/${fileName}.gz`, { headers, cache: "no-store" });
		if (res.status === 404) return null;
		if (!res.ok) return undefined;
		return decodePackBytes(Buffer.from(await res.arrayBuffer()));
	} catch {
		return undefined;
	}
}

/**
 * Plain JSON locally; `.json.gz` on disk or as a static asset on Vercel after
 * the deploy compress step.
 */
async function readPackedText(filePath: string): Promise<string | null | undefined> {
	try {
		return await fs.readFile(filePath, "utf8");
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		if (code !== "ENOENT") return null;
	}
	try {
		return decodePackBytes(await fs.readFile(`${filePath}.gz`));
	} catch {
		/* not on disk — try the static copy */
	}
	return fetchStaticPack(path.basename(filePath));
}

async function readPackedSet(setId: string): Promise<PackedSetFile | null> {
	const cache = getCache();
	const raw = await readPackedText(packedSetPath(setId));
	if (raw === undefined) return null;
	let set: PackedSetFile | null = null;
	if (raw) {
		try {
			set = JSON.parse(raw) as PackedSetFile;
		} catch {
			set = null;
		}
	}
	cache.sets.set(setId, set);
	return set;
}

export async function loadPackedSet(setId: string): Promise<PackedSetFile | null> {
	if (!/^[a-z0-9-]+$/.test(setId)) return null;
	const cache = getCache();
	if (cache.sets.has(setId)) return cache.sets.get(setId) ?? null;
	// Share one read/fetch between concurrent requests for the same pack.
	let pending = cache.pending.get(setId);
	if (!pending) {
		pending = readPackedSet(setId).finally(() => cache.pending.delete(setId));
		cache.pending.set(setId, pending);
	}
	return pending;
}

export async function listPackedSetIds(): Promise<string[]> {
	try {
		const entries = await fs.readdir(vendoredDir());
		const ids = new Set<string>();
		for (const file of entries) {
			if (file.endsWith(".json.gz")) ids.add(file.slice(0, -".json.gz".length));
			else if (file.endsWith(".json")) ids.add(file.slice(0, -".json".length));
		}
		return Array.from(ids).sort();
	} catch {
		return [];
	}
}

export async function loadPackedTheSvg(): Promise<TheSvgPackedRegistry | null> {
	const cache = getCache();
	if (cache.thesvg !== undefined) return cache.thesvg;
	const raw = await readPackedText(packedTheSvgPath());
	if (raw === undefined) return null;
	if (!raw) {
		cache.thesvg = null;
		return null;
	}
	try {
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
	cache.pending.clear();
	cache.thesvg = undefined;
}
