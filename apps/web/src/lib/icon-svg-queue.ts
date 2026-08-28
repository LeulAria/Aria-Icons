/**
 * Limits how many grid SVGs we fetch at once so scrolling doesn't open
 * dozens of /api/icon-svg requests in parallel.
 */
const MAX_CONCURRENCY = 3;
const MAX_CACHE = 400;

type Job = {
	url: string;
	resolve: (src: string) => void;
	reject: (error: unknown) => void;
};

const queue: Job[] = [];
const inflight = new Map<string, Promise<string>>();
const cache = new Map<string, string>();
let active = 0;

function evictIfNeeded() {
	while (cache.size > MAX_CACHE) {
		const oldest = cache.keys().next().value;
		if (oldest == null) break;
		const src = cache.get(oldest);
		cache.delete(oldest);
		if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
	}
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
				cache.set(job.url, src);
				evictIfNeeded();
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

export function loadQueuedIconSrc(url: string): Promise<string> {
	const cached = cache.get(url);
	if (cached) return Promise.resolve(cached);

	const pending = inflight.get(url);
	if (pending) return pending;

	const next = new Promise<string>((resolve, reject) => {
		queue.push({ url, resolve, reject });
		pump();
	}).finally(() => {
		inflight.delete(url);
	});

	inflight.set(url, next);
	return next;
}
