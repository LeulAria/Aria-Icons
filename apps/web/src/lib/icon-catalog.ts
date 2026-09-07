import { isAnimatedSet } from "@/lib/animated-sets";
import {
	FORCE_FILL_SET_IDS,
	type IconStyleFilter,
	type IconStyleGroup,
} from "@/lib/icon-sets";
import type { WorkspaceIcon } from "@/lib/icon-workspace";

export type CompactIconTuple = [number, number, 0 | 1, string, string, number?];

export type IconsMetaFile = {
	v: 3;
	generatedAt: string;
	sets: string[];
	styles: string[];
	/** [setIdx, styleIdx, group, name, filePath ("" = same as name), tagIdx?] */
	icons: CompactIconTuple[];
	/** Deduplicated tag arrays referenced by tagIdx. */
	tagsList: string[][];
	counts: Record<string, Record<string, number>>;
};

export type IconsMetaIndex = {
	v: 3;
	generatedAt: string;
	sets: string[];
	styles: string[];
	tagsList: string[][];
	counts: Record<string, Record<string, number>>;
	loadOrder: string[];
};

export type CatalogIcon = WorkspaceIcon & {
	group: IconStyleGroup;
	tags?: string[];
};

export function asCatalogIcon(icon: WorkspaceIcon): CatalogIcon {
	if ("group" in icon && (icon.group === "line" || icon.group === "solid")) {
		return icon as CatalogIcon;
	}
	return {
		...icon,
		group: /^(solid|filled|fill|bulk|bold)$/i.test(icon.styleId)
			? "solid"
			: "line",
	};
}

export type IconCatalog = {
	generatedAt: string;
	icons: CatalogIcon[];
	counts: Record<string, Record<string, number>>;
};

export const IDB_NAME = "aria-icons";
export const IDB_STORE = "catalog";
export const IDB_KEY = "icons-meta-v3-line-fill";
export const IDB_INDEX_KEY = "icons-meta-index-v3";

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(IDB_NAME, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(IDB_STORE)) {
				db.createObjectStore(IDB_STORE);
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
	});
}

export async function idbGet<T>(key: string): Promise<T | null> {
	if (typeof indexedDB === "undefined") return null;
	try {
		const db = await Promise.race([
			openDb(),
			new Promise<null>((resolve) => setTimeout(() => resolve(null), 400)),
		]);
		if (!db) return null;
		return await Promise.race([
			new Promise<T | null>((resolve, reject) => {
				const tx = db.transaction(IDB_STORE, "readonly");
				const store = tx.objectStore(IDB_STORE);
				const req = store.get(key);
				req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
				req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
			}),
			new Promise<null>((resolve) => setTimeout(() => resolve(null), 400)),
		]);
	} catch {
		return null;
	}
}

export async function idbSet(key: string, value: unknown): Promise<void> {
	if (typeof indexedDB === "undefined") return;
	try {
		const db = await openDb();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, "readwrite");
			const store = tx.objectStore(IDB_STORE);
			const req = store.put(value, key);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error ?? new Error("IndexedDB put failed"));
		});
	} catch {
		// Cache is best-effort.
	}
}

export function expandCompactIcon(
	sets: string[],
	styles: string[],
	tagsList: string[][],
	tuple: CompactIconTuple,
): CatalogIcon {
	const [setIdx, styleIdx, group, name, filePath, tagIdx] = tuple;
	const tags = tagIdx != null ? tagsList[tagIdx] : undefined;
	return {
		setId: sets[setIdx] ?? "unknown",
		styleId: styles[styleIdx] ?? "line",
		filePath: filePath === "" ? name : filePath,
		name,
		group: group === 1 ? "solid" : "line",
		...(tags ? { tags } : {}),
	};
}

export function expandIconsMeta(meta: IconsMetaFile): IconCatalog {
	const icons: CatalogIcon[] = meta.icons.map((tuple) =>
		expandCompactIcon(meta.sets, meta.styles, meta.tagsList, tuple),
	);

	return {
		generatedAt: meta.generatedAt,
		icons,
		counts: meta.counts,
	};
}

type CachedMeta = {
	generatedAt: string;
	meta: IconsMetaFile;
};

function indexFromMeta(meta: IconsMetaFile, loadOrder?: string[]): IconsMetaIndex {
	return {
		v: 3,
		generatedAt: meta.generatedAt,
		sets: meta.sets,
		styles: meta.styles,
		tagsList: meta.tagsList,
		counts: meta.counts,
		loadOrder: loadOrder ?? meta.sets,
	};
}

async function fetchJson<T>(url: string): Promise<T | null> {
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

async function fetchAndCacheMeta(): Promise<IconsMetaFile | null> {
	const meta = await fetchJson<IconsMetaFile>("/icons-meta.json");
	if (!meta) return null;
	void idbSet(IDB_KEY, { generatedAt: meta.generatedAt, meta } satisfies CachedMeta);
	void idbSet(IDB_INDEX_KEY, indexFromMeta(meta));
	return meta;
}

/** Compact catalog only — does not expand 300k+ icon objects. */
export async function loadIconCatalogMeta(): Promise<IconsMetaFile> {
	const cached = await idbGet<CachedMeta>(IDB_KEY);
	if (cached?.meta) {
		void (async () => {
			const index = await fetchJson<IconsMetaIndex>("/icons-meta-index.json");
			if (index && index.generatedAt === cached.generatedAt) return;
			await fetchAndCacheMeta();
		})();
		return cached.meta;
	}

	const meta = await fetchAndCacheMeta();
	if (meta) return meta;
	throw new Error("Failed to load icon catalog");
}

export async function loadIconCatalogIndex(): Promise<IconsMetaIndex> {
	const network = await fetchJson<IconsMetaIndex>("/icons-meta-index.json");
	if (network) {
		void idbSet(IDB_INDEX_KEY, network);
		const first = network.loadOrder[0];
		if (first) void loadIconSetShard(first);
		return network;
	}

	const cached = await idbGet<IconsMetaIndex>(IDB_INDEX_KEY);
	if (cached) return cached;
	const cachedMeta = await idbGet<CachedMeta>(IDB_KEY);
	if (cachedMeta?.meta) return indexFromMeta(cachedMeta.meta);

	return {
		v: 3,
		generatedAt: "",
		sets: [],
		styles: [],
		tagsList: [],
		counts: {},
		loadOrder: [],
	};
}

const shardPromises = new Map<string, Promise<CompactIconTuple[] | null>>();

export async function loadIconSetShard(
	setId: string,
): Promise<CompactIconTuple[] | null> {
	const hit = shardPromises.get(setId);
	if (hit) return hit;
	const next = fetchJson<CompactIconTuple[]>(
		`/icons-meta/sets/${encodeURIComponent(setId)}.json`,
	);
	shardPromises.set(setId, next);
	return next;
}

export async function loadIconCatalog(): Promise<IconCatalog> {
	const meta = await loadIconCatalogMeta();
	return expandIconsMeta(meta);
}

export function countForStyleGroup(
	counts: Record<string, Record<string, number>>,
	setId: string,
	styles: Array<{ id: string; group: IconStyleGroup }>,
	styleGroup: IconStyleFilter,
) {
	if (styleGroup === "animated") {
		if (!isAnimatedSet(setId)) return 0;
		return styles.reduce((acc, st) => acc + (counts[setId]?.[st.id] ?? 0), 0);
	}
	if (FORCE_FILL_SET_IDS.has(setId)) {
		if (styleGroup === "line") return 0;
		return styles.reduce((acc, st) => acc + (counts[setId]?.[st.id] ?? 0), 0);
	}
	return styles
		.filter((st) => (styleGroup === "both" ? true : st.group === styleGroup))
		.reduce((acc, st) => acc + (counts[setId]?.[st.id] ?? 0), 0);
}
