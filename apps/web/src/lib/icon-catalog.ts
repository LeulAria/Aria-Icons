import type { IconStyleGroup } from "@/lib/icon-sets";
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

export type CatalogIcon = WorkspaceIcon & {
	group: IconStyleGroup;
	tags?: string[];
};

export type IconCatalog = {
	generatedAt: string;
	icons: CatalogIcon[];
	counts: Record<string, Record<string, number>>;
};

const IDB_NAME = "aria-icons";
const IDB_STORE = "catalog";
const IDB_KEY = "icons-meta-v3-line-fill";

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

async function idbGet<T>(key: string): Promise<T | null> {
	if (typeof indexedDB === "undefined") return null;
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, "readonly");
			const store = tx.objectStore(IDB_STORE);
			const req = store.get(key);
			req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
			req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
		});
	} catch {
		return null;
	}
}

async function idbSet(key: string, value: unknown): Promise<void> {
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

export function expandIconsMeta(meta: IconsMetaFile): IconCatalog {
	const icons: CatalogIcon[] = meta.icons.map(
		([setIdx, styleIdx, group, name, filePath, tagIdx]) => {
			const tags = tagIdx != null ? meta.tagsList[tagIdx] : undefined;
			return {
				setId: meta.sets[setIdx] ?? "unknown",
				styleId: meta.styles[styleIdx] ?? "line",
				filePath: filePath === "" ? name : filePath,
				name,
				group: group === 1 ? "solid" : "line",
				...(tags ? { tags } : {}),
			};
		},
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

export async function loadIconCatalog(): Promise<IconCatalog> {
	const cached = await idbGet<CachedMeta>(IDB_KEY);

	try {
		const res = await fetch("/icons-meta.json");
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const meta = (await res.json()) as IconsMetaFile;

		if (cached?.generatedAt === meta.generatedAt) {
			return expandIconsMeta(cached.meta);
		}

		void idbSet(IDB_KEY, { generatedAt: meta.generatedAt, meta });
		return expandIconsMeta(meta);
	} catch (error) {
		if (cached) return expandIconsMeta(cached.meta);
		throw error instanceof Error
			? error
			: new Error("Failed to load icon catalog");
	}
}

export function countForStyleGroup(
	counts: Record<string, Record<string, number>>,
	setId: string,
	styles: Array<{ id: string; group: IconStyleGroup }>,
	styleGroup: IconStyleGroup | "both",
) {
	return styles
		.filter((st) => (styleGroup === "both" ? true : st.group === styleGroup))
		.reduce((acc, st) => acc + (counts[setId]?.[st.id] ?? 0), 0);
}
