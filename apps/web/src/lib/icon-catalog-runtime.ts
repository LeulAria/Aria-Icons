import {
	expandCompactIcon,
	loadIconCatalogIndex,
	loadIconSetShard,
	type CatalogIcon,
	type CompactIconTuple,
	type IconsMetaIndex,
} from "@/lib/icon-catalog";
import { isAnimatedSet } from "@/lib/animated-sets";
import { isNonLineVariant, type SearchFilters } from "@/lib/icon-search";

export type CatalogProgress = {
	counts: Record<string, Record<string, number>>;
	loadedIcons: number;
	loadedSets: number;
	setCount: number;
	catalogReady: boolean;
};

type CompactFilters = Pick<
	SearchFilters,
	"collection" | "styleGroup" | "selectedStyleId"
>;

let index: IconsMetaIndex | null = null;
let icons: CompactIconTuple[] = [];
let names: string[] = [];
let loadedSets = new Set<string>();
let loadPromise: Promise<void> | null = null;
let loadGeneration = 0;
const inflight = new Map<string, Promise<boolean>>();
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) listener();
}

export function subscribeCatalog(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getCatalogProgress(): CatalogProgress {
	return {
		counts: index?.counts ?? {},
		loadedIcons: icons.length,
		loadedSets: loadedSets.size,
		setCount: index?.loadOrder.length ?? index?.sets.length ?? 0,
		catalogReady: Boolean(
			index && loadedSets.size >= (index.loadOrder.length || index.sets.length),
		),
	};
}

function appendTuples(tuples: CompactIconTuple[]) {
	const start = icons.length;
	icons.push(...tuples);
	for (let i = 0; i < tuples.length; i++) {
		names[start + i] = tuples[i]?.[3].toLowerCase() ?? "";
	}
}

async function loadOneSet(setId: string): Promise<boolean> {
	if (loadedSets.has(setId)) return true;
	const pending = inflight.get(setId);
	if (pending) return pending;

	const task = (async () => {
		const tuples = await loadIconSetShard(setId);
		if (!tuples) return false;
		if (loadedSets.has(setId)) return true;
		appendTuples(tuples);
		loadedSets.add(setId);
		if (loadedSets.size === 1 || loadedSets.size % 6 === 0) notify();
		return true;
	})().finally(() => {
		inflight.delete(setId);
	});

	inflight.set(setId, task);
	return task;
}

function orderedSetIds(preferSetId?: string | null) {
	const order = index?.loadOrder.length
		? index.loadOrder.slice()
		: (index?.sets ?? []);
	if (preferSetId && order.includes(preferSetId)) {
		return [preferSetId, ...order.filter((id) => id !== preferSetId)];
	}
	return order;
}

export async function ensureCatalogIndex(): Promise<IconsMetaIndex | null> {
	if (index) return index;
	index = await loadIconCatalogIndex();
	notify();
	return index;
}

export async function loadCatalogSets(preferSetId?: string | null) {
	const generation = ++loadGeneration;
	await ensureCatalogIndex();
	if (!index?.loadOrder.length) return;

	const only = preferSetId && preferSetId !== "all" ? preferSetId : null;
	if (only) {
		await loadOneSet(only);
		return;
	}

	const order = orderedSetIds(preferSetId);
	const first = order.find((id) => !loadedSets.has(id));
	if (first) {
		await loadOneSet(first);
		notify();
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	if (generation !== loadGeneration) return;

	const rest = order.filter((id) => !loadedSets.has(id));
	for (let i = 0; i < rest.length; i += 8) {
		if (generation !== loadGeneration) return;
		await Promise.all(rest.slice(i, i + 8).map((id) => loadOneSet(id)));
		notify();
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	notify();
}

export function startCatalogLoad(preferSetId?: string | null) {
	loadPromise = loadCatalogSets(preferSetId).catch(() => undefined);
	return loadPromise;
}

function matchesFilters(tupleIndex: number, filters: CompactFilters): boolean {
	const tuple = icons[tupleIndex];
	if (!tuple || !index) return false;
	const setId = index.sets[tuple[0]] ?? "";
	const styleId = index.styles[tuple[1]] ?? "";
	const group = tuple[2] === 1 ? "solid" : "line";
	const name = tuple[3];
	const { collection, styleGroup, selectedStyleId } = filters;

	if (collection !== "all" && setId !== collection) return false;
	if (styleGroup === "animated") return isAnimatedSet(setId);
	if (styleGroup === "line" && isNonLineVariant({ setId, styleId, name, group })) {
		return false;
	}
	if (styleGroup === "solid" && !isNonLineVariant({ setId, styleId, name, group })) {
		return false;
	}
	if (
		collection !== "all" &&
		selectedStyleId !== "both" &&
		selectedStyleId !== styleGroup &&
		styleId !== selectedStyleId
	) {
		return false;
	}
	return true;
}

function scoreToken(name: string, tupleIndex: number, token: string): number {
	if (!index) return 0;
	if (name === token) return 100;
	const hitAt = name.indexOf(token);
	if (hitAt === 0) {
		const end = name.charAt(token.length);
		return end === "" || end === "-" || end === "_" ? 90 : 82;
	}
	if (hitAt > 0) {
		const before = name.charAt(hitAt - 1);
		return before === "-" || before === "_" ? 78 : 65;
	}

	let best = 0;
	const tuple = icons[tupleIndex];
	const tags = tuple?.[5] != null ? index.tagsList[tuple[5]] : undefined;
	if (tags) {
		for (const tag of tags) {
			if (tag === token) {
				best = 60;
				break;
			}
			if (best < 48 && tag.startsWith(token)) best = 48;
			else if (best < 35 && tag.includes(token)) best = 35;
		}
	}
	const setId = index.sets[tuple?.[0] ?? -1] ?? "";
	if (best === 0 && setId.includes(token)) best = 25;
	return best;
}

export function searchCatalogIndices(
	query: string,
	filters: CompactFilters,
): number[] {
	if (!index || icons.length === 0) return [];
	const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

	if (tokens.length === 0) {
		const indices: number[] = [];
		for (let i = 0; i < icons.length; i++) {
			if (matchesFilters(i, filters)) indices.push(i);
		}
		return indices;
	}

	const hits: Array<[number, number]> = [];
	outer: for (let i = 0; i < icons.length; i++) {
		if (!matchesFilters(i, filters)) continue;
		const name = names[i] ?? "";
		let total = 0;
		for (const token of tokens) {
			const s = scoreToken(name, i, token);
			if (s === 0) continue outer;
			total += s;
		}
		hits.push([i, total / tokens.length - Math.min(name.length * 0.1, 8)]);
		if (hits.length > 4000) break;
	}
	hits.sort((a, b) => {
		const byScore = b[1] - a[1];
		if (byScore !== 0) return byScore;
		return (names[a[0]] ?? "").localeCompare(names[b[0]] ?? "");
	});
	return hits.slice(0, 2500).map((h) => h[0]);
}

export function expandCatalogIcon(tupleIndex: number): CatalogIcon | undefined {
	if (!index) return undefined;
	const tuple = icons[tupleIndex];
	if (!tuple) return undefined;
	return expandCompactIcon(index.sets, index.styles, index.tagsList, tuple);
}
