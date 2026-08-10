import fs from "node:fs/promises";
import path from "node:path";

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
	const limit = Math.max(1, Math.min(100, params.limit ?? 24));
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
