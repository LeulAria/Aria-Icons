import fs from "node:fs/promises";
import path from "node:path";
import { ICON_SETS, type IconSetId, type IconStyleGroup, type IconStyleId } from "./icon-sets";

export type IconListItem = {
	setId: IconSetId;
	styleId: IconStyleId;
	/**
	 * Stable identifier (unique within set/style). This is the file path relative
	 * to the set folder (e.g. `icons/outline/alert-circle.svg`).
	 */
	filePath: string;
	/**
	 * Display-friendly name (derived from filename).
	 */
	name: string;
};

type CachedIndex = {
	icons: IconListItem[];
	byFilePath: Map<string, IconListItem>;
};

function iconsRootDir() {
	// In Next.js route handlers, `process.cwd()` is the app root (`apps/web`).
	return path.join(process.cwd(), "icons");
}

function getCache(): Map<string, CachedIndex> {
	const g = globalThis as unknown as { __ariaIconIndexCache?: Map<string, CachedIndex> };
	if (!g.__ariaIconIndexCache) g.__ariaIconIndexCache = new Map();
	return g.__ariaIconIndexCache;
}

function cacheKey(setId: string, styleId: string) {
	return `${setId}::${styleId}`;
}

async function listSvgFilesRecursive(absDir: string, baseAbsDir: string): Promise<string[]> {
	const entries = await fs.readdir(absDir, { withFileTypes: true });
	const out: string[] = [];
	for (const ent of entries) {
		const abs = path.join(absDir, ent.name);
		if (ent.isDirectory()) {
			out.push(...(await listSvgFilesRecursive(abs, baseAbsDir)));
			continue;
		}
		if (!ent.isFile()) continue;
		if (!ent.name.toLowerCase().endsWith(".svg")) continue;
		const rel = path.relative(baseAbsDir, abs);
		out.push(rel);
	}
	return out;
}

function normalizeNameFromFilePath(filePath: string) {
	const base = path.basename(filePath, ".svg");
	return base.replace(/_/g, "-").replace(/\s+/g, "-");
}

function ensureUnder(baseAbsDir: string, absTarget: string) {
	const rel = path.relative(baseAbsDir, absTarget);
	if (rel.startsWith("..") || path.isAbsolute(rel)) {
		throw new Error("Invalid path");
	}
}

export async function buildIconIndex(setId: IconSetId, styleId: IconStyleId): Promise<CachedIndex> {
	const key = cacheKey(setId, styleId);
	const cache = getCache();
	const cached = cache.get(key);
	if (cached) return cached;

	const set = ICON_SETS.find((s) => s.id === setId);
	if (!set) throw new Error(`Unknown icon set: ${setId}`);
	const style = set.styles.find((st) => st.id === styleId);
	if (!style) throw new Error(`Unknown style "${styleId}" for set "${setId}"`);

	const setRootAbs = path.join(iconsRootDir(), setId);
	const icons: IconListItem[] = [];

	for (const rootRel of style.roots) {
		const rootAbs = path.join(setRootAbs, rootRel);
		ensureUnder(setRootAbs, rootAbs);

		let stat: Awaited<ReturnType<typeof fs.stat>> | null = null;
		try {
			stat = await fs.stat(rootAbs);
		} catch {
			stat = null;
		}
		if (!stat || !stat.isDirectory()) continue;

		const relSvgPathsFromRoot = await listSvgFilesRecursive(rootAbs, rootAbs);
		for (const relFromRoot of relSvgPathsFromRoot) {
			const fileAbs = path.join(rootAbs, relFromRoot);
			ensureUnder(setRootAbs, fileAbs);

			// Store filePath relative to set folder (used by the SVG route).
			const filePathRelToSet = path
				.join(rootRel, relFromRoot)
				.split(path.sep)
				.join("/");
			icons.push({
				setId,
				styleId,
				filePath: filePathRelToSet,
				name: normalizeNameFromFilePath(relFromRoot),
			});
		}
	}

	icons.sort((a, b) => a.name.localeCompare(b.name));
	const byFilePath = new Map<string, IconListItem>();
	for (const icon of icons) byFilePath.set(icon.filePath, icon);

	const idx: CachedIndex = { icons, byFilePath };
	cache.set(key, idx);
	return idx;
}

export async function listIcons(params: {
	setId: IconSetId;
	styleId: IconStyleId;
	query?: string;
	offset?: number;
	limit?: number;
}) {
	const { setId, styleId } = params;
	const limit = Math.max(1, Math.min(1000, params.limit ?? 200));
	const offset = Math.max(0, params.offset ?? 0);
	const q = (params.query ?? "").trim().toLowerCase();

	const idx = await buildIconIndex(setId, styleId);
	const all = q ? idx.icons.filter((i) => i.name.toLowerCase().includes(q)) : idx.icons;
	const items = all.slice(offset, offset + limit);
	const nextOffset = offset + limit < all.length ? offset + limit : null;

	return { total: all.length, items, nextOffset };
}

export async function listIconsMulti(params: {
	setId: IconSetId;
	styleIds: IconStyleId[];
	query?: string;
	offset?: number;
	limit?: number;
}) {
	const { setId } = params;
	const styleIds = (params.styleIds ?? []).filter(Boolean);
	if (styleIds.length === 0) return { total: 0, items: [], nextOffset: null as number | null };

	const limit = Math.max(1, Math.min(1000, params.limit ?? 200));
	const offset = Math.max(0, params.offset ?? 0);
	const q = (params.query ?? "").trim().toLowerCase();

	const idxs = await Promise.all(styleIds.map((styleId) => buildIconIndex(setId, styleId)));
	let all = idxs.flatMap((idx) => idx.icons);
	if (q) all = all.filter((i) => i.name.toLowerCase().includes(q));

	all.sort((a, b) => {
		const n = a.name.localeCompare(b.name);
		if (n !== 0) return n;
		const st = a.styleId.localeCompare(b.styleId);
		if (st !== 0) return st;
		return a.filePath.localeCompare(b.filePath);
	});

	const items = all.slice(offset, offset + limit);
	const nextOffset = offset + limit < all.length ? offset + limit : null;
	return { total: all.length, items, nextOffset };
}

async function buildAllIconsIndex(group: IconStyleGroup): Promise<CachedIndex> {
	const key = cacheKey("all", group);
	const cache = getCache();
	const cached = cache.get(key);
	if (cached) return cached;

	const icons: IconListItem[] = [];
	for (const set of ICON_SETS) {
		for (const style of set.styles) {
			if (style.group !== group) continue;
			const idx = await buildIconIndex(set.id, style.id);
			icons.push(...idx.icons);
		}
	}

	icons.sort((a, b) => {
		const n = a.name.localeCompare(b.name);
		if (n !== 0) return n;
		const s = a.setId.localeCompare(b.setId);
		if (s !== 0) return s;
		return a.styleId.localeCompare(b.styleId);
	});

	const byFilePath = new Map<string, IconListItem>();
	for (const icon of icons) {
		byFilePath.set(`${icon.setId}/${icon.filePath}`, icon);
	}

	const idx: CachedIndex = { icons, byFilePath };
	cache.set(key, idx);
	return idx;
}

async function buildAllIconsIndexMulti(groups: IconStyleGroup[]): Promise<CachedIndex> {
	const key = cacheKey("all", groups.slice().sort().join("+"));
	const cache = getCache();
	const cached = cache.get(key);
	if (cached) return cached;

	const groupSet = new Set(groups);
	const icons: IconListItem[] = [];
	for (const set of ICON_SETS) {
		for (const style of set.styles) {
			if (!groupSet.has(style.group)) continue;
			const idx = await buildIconIndex(set.id, style.id);
			icons.push(...idx.icons);
		}
	}

	icons.sort((a, b) => {
		const n = a.name.localeCompare(b.name);
		if (n !== 0) return n;
		const s = a.setId.localeCompare(b.setId);
		if (s !== 0) return s;
		const st = a.styleId.localeCompare(b.styleId);
		if (st !== 0) return st;
		return a.filePath.localeCompare(b.filePath);
	});

	const byFilePath = new Map<string, IconListItem>();
	for (const icon of icons) {
		byFilePath.set(`${icon.setId}/${icon.styleId}/${icon.filePath}`, icon);
	}

	const idx: CachedIndex = { icons, byFilePath };
	cache.set(key, idx);
	return idx;
}

export async function listAllIcons(params: {
	group: IconStyleGroup;
	query?: string;
	offset?: number;
	limit?: number;
}) {
	const limit = Math.max(1, Math.min(1000, params.limit ?? 200));
	const offset = Math.max(0, params.offset ?? 0);
	const q = (params.query ?? "").trim().toLowerCase();

	const idx = await buildAllIconsIndex(params.group);
	const all = q ? idx.icons.filter((i) => i.name.toLowerCase().includes(q)) : idx.icons;
	const items = all.slice(offset, offset + limit);
	const nextOffset = offset + limit < all.length ? offset + limit : null;

	return { total: all.length, items, nextOffset };
}

export async function listAllIconsMulti(params: {
	groups: IconStyleGroup[];
	query?: string;
	offset?: number;
	limit?: number;
}) {
	const limit = Math.max(1, Math.min(1000, params.limit ?? 200));
	const offset = Math.max(0, params.offset ?? 0);
	const q = (params.query ?? "").trim().toLowerCase();

	const idx = await buildAllIconsIndexMulti(params.groups);
	const all = q ? idx.icons.filter((i) => i.name.toLowerCase().includes(q)) : idx.icons;
	const items = all.slice(offset, offset + limit);
	const nextOffset = offset + limit < all.length ? offset + limit : null;

	return { total: all.length, items, nextOffset };
}

export async function readSvg(setId: IconSetId, filePath: string) {
	const setRootAbs = path.join(iconsRootDir(), setId);
	const abs = path.join(setRootAbs, filePath);
	ensureUnder(setRootAbs, abs);
	return await fs.readFile(abs, "utf8");
}


