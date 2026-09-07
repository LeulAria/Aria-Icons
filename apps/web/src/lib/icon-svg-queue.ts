/**
 * First icon is requested immediately (and often via a native <img>).
 * The rest of the first viewport rides one /api/icon-svgs batch so production
 * Iconify icons are one remote call, not one per cell. Scroll loads stay
 * parallel with a high concurrency cap.
 */
import { buildIconSvgUrl, type IconExportCustomize } from "@/lib/icon-export";

const MAX_CONCURRENCY = 16;
const MAX_CACHE = 800;
const FIRST_VIEWPORT = 24;

type Job = {
	url: string;
	priority: number;
	resolve: (src: string) => void;
	reject: (error: unknown) => void;
};

type BatchIcon = {
	setId: string;
	styleId: string;
	filePath: string;
	group?: string;
};

const queue: Job[] = [];
const inflight = new Map<string, Promise<string>>();
const cache = new Map<string, string>();
let active = 0;
let batchInflight: Promise<void> | null = null;

function evictIfNeeded() {
	while (cache.size > MAX_CACHE) {
		const oldest = cache.keys().next().value;
		if (oldest == null) break;
		const src = cache.get(oldest);
		cache.delete(oldest);
		if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
	}
}

function remember(url: string, src: string) {
	cache.set(url, src);
	evictIfNeeded();
}

function insertJob(job: Job) {
	const at = queue.findIndex((queued) => queued.priority > job.priority);
	if (at === -1) queue.push(job);
	else queue.splice(at, 0, job);
}

function pump() {
	while (active < MAX_CONCURRENCY && queue.length > 0) {
		const job = queue.shift();
		if (!job) break;
		active++;
		void (async () => {
			try {
				const cached = cache.get(job.url);
				if (cached) {
					job.resolve(cached);
					return;
				}
				const res = await fetch(job.url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const blob = await res.blob();
				const src = URL.createObjectURL(blob);
				remember(job.url, src);
				job.resolve(src);
			} catch (error) {
				job.reject(error);
			} finally {
				active--;
				pump();
			}
		})();
	}
}

export function peekCachedIconSrc(url: string): string | undefined {
	return cache.get(url);
}

export function loadQueuedIconSrc(
	url: string,
	priority = 100,
): Promise<string> {
	const cached = cache.get(url);
	if (cached) return Promise.resolve(cached);

	const pending = inflight.get(url);
	if (pending) return pending;

	const next = (async () => {
		if (batchInflight && priority < FIRST_VIEWPORT) {
			await batchInflight;
			const fromBatch = cache.get(url);
			if (fromBatch) return fromBatch;
		}
		return new Promise<string>((resolve, reject) => {
			insertJob({ url, priority, resolve, reject });
			pump();
		});
	})().finally(() => {
		inflight.delete(url);
	});

	inflight.set(url, next);
	return next;
}

export function prefetchIconBatch(
	icons: BatchIcon[],
	customize: IconExportCustomize,
): Promise<void> {
	const items = icons.slice(0, FIRST_VIEWPORT).filter((icon) => {
		const url = buildIconSvgUrl(icon, customize);
		return !cache.has(url);
	});
	if (items.length === 0) return Promise.resolve();

	const task = (async () => {
		try {
			const res = await fetch("/api/icon-svgs", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					items: items.map((icon) => ({
						setId: icon.setId,
						styleId: icon.styleId,
						filePath: icon.filePath,
						size: String(customize.size),
						strokeWidth: customize.stroke,
						color: customize.color,
						group: icon.group,
					})),
				}),
			});
			if (!res.ok) return;
			const data = (await res.json()) as { svgs?: Array<string | null> };
			const svgs = data.svgs ?? [];
			for (let i = 0; i < items.length; i++) {
				const svg = svgs[i];
				const item = items[i];
				if (!svg || !item) continue;
				const url = buildIconSvgUrl(item, customize);
				if (cache.has(url)) continue;
				remember(
					url,
					`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
				);
			}
		} catch {
			/* individual fetches in the queue cover misses */
		}
	})().finally(() => {
		if (batchInflight === task) batchInflight = null;
	});

	batchInflight = task;
	return task;
}

export const FIRST_VIEWPORT_ICON_COUNT = FIRST_VIEWPORT;
