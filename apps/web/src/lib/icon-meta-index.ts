import fs from "node:fs/promises";
import path from "node:path";
import { isAnimatedSet } from "@/lib/animated-sets";
import { isNonLineVariant } from "@/lib/icon-search";
import type { IconStyleFilter } from "@/lib/icon-sets";

/**
 * Server-side search index over the generated icon catalog
 * (public/icons-meta.json). Powers the MCP `search_icons` tool: fast,
 * dependency-free relevance scoring over icon names + tags (brand titles,
 * aliases, categories).
 */

type MetaFile = {
	v: number;
	generatedAt: string;
	sets: string[];
	styles: string[];
	/** [setIdx, styleIdx, group, name, filePath ("" = same as name), tagIdx?] */
	icons: Array<[number, number, 0 | 1, string, string, number?]>;
	tagsList: string[][];
	counts: Record<string, Record<string, number>>;
};

export type IndexedIcon = {
	id: string;
	setId: string;
	name: string;
	styleIds: string[];
	tags?: string[];
};

export type IconSearchResult = IndexedIcon & { score: number };

type IndexCache = {
	icons: IndexedIcon[];
	meta: MetaFile;
	countsBySet: Record<string, number>;
	generatedAt: string;
	mtimeMs: number;
} | null;

function getCache(): { index: IndexCache } {
	const g = globalThis as unknown as { __ariaIconMetaIndex?: { index: IndexCache } };
	if (!g.__ariaIconMetaIndex) g.__ariaIconMetaIndex = { index: null };
	return g.__ariaIconMetaIndex;
}

async function loadIndex() {
	const cache = getCache();
	const metaPath = path.join(process.cwd(), "public", "icons-meta.json");
	// Cheap staleness check so a regenerated catalog is picked up without a
	// server restart.
	const stat = await fs.stat(metaPath);
	if (cache.index && cache.index.mtimeMs === stat.mtimeMs) return cache.index;

	const raw = await fs.readFile(metaPath, "utf8");
	const meta = JSON.parse(raw) as MetaFile;

	// Collapse style variants: one searchable entry per (set, name).
	const byId = new Map<string, IndexedIcon>();
	const countsBySet: Record<string, number> = {};
	for (const [setIdx, styleIdx, , name, , tagIdx] of meta.icons) {
		const setId = meta.sets[setIdx] ?? "unknown";
		const styleId = meta.styles[styleIdx] ?? "line";
		countsBySet[setId] = (countsBySet[setId] ?? 0) + 1;
		const id = `${setId}-${name.toLowerCase()}`;
		const tags = tagIdx != null ? meta.tagsList[tagIdx] : undefined;
		const existing = byId.get(id);
		if (existing) {
			if (!existing.styleIds.includes(styleId)) existing.styleIds.push(styleId);
			if (tags) {
				existing.tags = Array.from(new Set([...(existing.tags ?? []), ...tags]));
			}
		} else {
			byId.set(id, {
				id,
				setId,
				name,
				styleIds: [styleId],
				...(tags ? { tags } : {}),
			});
		}
	}

	cache.index = {
		icons: Array.from(byId.values()),
		meta,
		countsBySet,
		generatedAt: meta.generatedAt,
		mtimeMs: stat.mtimeMs,
	};
	return cache.index;
}

export async function getSetSummaries() {
	const index = await loadIndex();
	return index.countsBySet;
}

/** Unique icon names grouped by set id. */
export async function getNamesBySet(): Promise<Record<string, string[]>> {
	const index = await loadIndex();
	const bySet: Record<string, Set<string>> = {};
	for (const icon of index.icons) {
		(bySet[icon.setId] ??= new Set()).add(icon.name.toLowerCase());
	}
	return Object.fromEntries(
		Object.entries(bySet).map(([setId, names]) => [
			setId,
			Array.from(names).sort(),
		]),
	);
}

export async function listIconNames(setId: string, offset: number, limit: number) {
	const index = await loadIndex();
	const names = index.icons
		.filter((icon) => icon.setId === setId)
		.map((icon) => icon.name)
		.sort();
	return {
		total: names.length,
		items: names.slice(offset, offset + limit),
		nextOffset: offset + limit < names.length ? offset + limit : null,
	};
}

function scoreToken(icon: IndexedIcon, token: string): number {
	const name = icon.name.toLowerCase();
	if (name === token) return 100;
	// Word-level match inside hyphenated names ("arrow" in "arrow-up-right").
	const nameWords = name.split(/[-_.]/);
	if (nameWords.includes(token)) return 88;
	if (name.startsWith(token)) return 82;
	if (name.includes(token)) return 65;

	let best = 0;
	for (const tag of icon.tags ?? []) {
		if (tag === token) best = Math.max(best, 60);
		else if (tag.startsWith(token)) best = Math.max(best, 48);
		else if (tag.includes(token)) best = Math.max(best, 35);
		if (best === 60) break;
	}
	return best;
}

/**
 * Search icons by name and metadata tags. Multi-token queries require every
 * token to match somewhere (name or tag).
 */
export async function searchIcons(params: {
	query: string;
	setId?: string;
	limit?: number;
}): Promise<{ total: number; results: IconSearchResult[] }> {
	const index = await loadIndex();
	const limit = Math.max(1, Math.min(999, params.limit ?? 24));
	const tokens = params.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return { total: 0, results: [] };

	const scored: IconSearchResult[] = [];
	for (const icon of index.icons) {
		if (params.setId && icon.setId !== params.setId) continue;
		let total = 0;
		let matchedAll = true;
		for (const token of tokens) {
			const s = scoreToken(icon, token);
			if (s === 0) {
				matchedAll = false;
				break;
			}
			total += s;
		}
		if (!matchedAll) continue;
		// Slight penalty for longer names so "home" outranks "home-heart-fill".
		const score = total / tokens.length - Math.min(icon.name.length * 0.1, 8);
		scored.push({ ...icon, score: Math.round(score * 10) / 10 });
	}

	scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
	return { total: scored.length, results: scored.slice(0, limit) };
}

export type BrowseIcon = {
	setId: string;
	styleId: string;
	filePath: string;
	name: string;
	group: "line" | "solid";
};

const browseLists = new Map<string, number[]>();
let browseOrder: number[] | null = null;
let browseOrderAt = "";

function getBrowseOrder(meta: MetaFile): number[] {
	if (browseOrder && browseOrderAt === meta.generatedAt) return browseOrder;
	const buckets: number[][] = meta.sets.map(() => []);
	for (let i = 0; i < meta.icons.length; i++) {
		const setIdx = meta.icons[i]?.[0] ?? 0;
		buckets[setIdx]?.push(i);
	}
	browseOrder = buckets.flat();
	browseOrderAt = meta.generatedAt;
	return browseOrder;
}

function tupleMatches(
	meta: MetaFile,
	tuple: MetaFile["icons"][number],
	collection: string,
	styleGroup: IconStyleFilter,
	styleId: string,
): boolean {
	const setId = meta.sets[tuple[0]] ?? "";
	const iconStyle = meta.styles[tuple[1]] ?? "";
	const name = tuple[3];
	const group = tuple[2] === 1 ? "solid" : "line";
	if (collection !== "all" && setId !== collection) return false;
	if (styleGroup === "animated") return isAnimatedSet(setId);
	if (styleGroup === "line" && isNonLineVariant({ setId, styleId: iconStyle, name, group })) {
		return false;
	}
	if (styleGroup === "solid" && !isNonLineVariant({ setId, styleId: iconStyle, name, group })) {
		return false;
	}
	if (
		collection !== "all" &&
		styleId !== "both" &&
		styleId !== styleGroup &&
		iconStyle !== styleId
	) {
		return false;
	}
	return true;
}

function toBrowseIcon(meta: MetaFile, tuple: MetaFile["icons"][number]): BrowseIcon {
	const filePath = tuple[4] || tuple[3];
	return {
		setId: meta.sets[tuple[0]] ?? "",
		styleId: meta.styles[tuple[1]] ?? "line",
		filePath,
		name: tuple[3],
		group: tuple[2] === 1 ? "solid" : "line",
	};
}

export async function browseIcons(params: {
	query?: string;
	collection?: string;
	styleGroup?: IconStyleFilter;
	styleId?: string;
	offset: number;
	limit: number;
}): Promise<{ total: number; icons: BrowseIcon[] }> {
	const index = await loadIndex();
	const meta = index.meta;
	const collection = params.collection && params.collection !== "all" ? params.collection : "all";
	const styleGroup = params.styleGroup ?? "both";
	const styleId = params.styleId ?? "both";
	const offset = Math.max(0, params.offset);
	const limit = Math.max(1, Math.min(120, params.limit));
	const query = (params.query ?? "").trim().toLowerCase();
	const unfiltered = !query && collection === "all" && styleGroup === "both";

	const order = getBrowseOrder(meta);
	let indexes: number[];
	if (unfiltered) {
		const end = Math.min(order.length, offset + limit);
		const icons: BrowseIcon[] = [];
		for (let i = offset; i < end; i++) {
			const tuple = meta.icons[order[i] ?? -1];
			if (tuple) icons.push(toBrowseIcon(meta, tuple));
		}
		return { total: order.length, icons };
	}

	const key = `${index.generatedAt}|${collection}|${styleGroup}|${styleId}|${query}`;
	const cached = browseLists.get(key);
	if (cached) {
		indexes = cached;
	} else {
		indexes = [];
		const tokens = query.split(/\s+/).filter(Boolean);
		for (const i of order) {
			const tuple = meta.icons[i];
			if (!tuple || !tupleMatches(meta, tuple, collection, styleGroup, styleId)) continue;
			if (tokens.length > 0) {
				const name = tuple[3].toLowerCase();
				let ok = true;
				for (const token of tokens) {
					if (!name.includes(token) && !(meta.sets[tuple[0]] ?? "").includes(token)) {
						ok = false;
						break;
					}
				}
				if (!ok) continue;
			}
			indexes.push(i);
			if (tokens.length > 0 && indexes.length >= 2000) break;
		}
		if (browseLists.size > 24) browseLists.clear();
		browseLists.set(key, indexes);
	}

	const slice = indexes.slice(offset, offset + limit);
	return {
		total: indexes.length,
		icons: slice.flatMap((i) => {
			const tuple = meta.icons[i];
			return tuple ? [toBrowseIcon(meta, tuple)] : [];
		}),
	};
}
