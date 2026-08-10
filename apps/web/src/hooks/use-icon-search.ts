"use client";

import * as React from "react";
import type { CatalogIcon } from "@/lib/icon-catalog";
import {
	createSearchContext,
	searchWithContext,
	type SearchContext,
	type SearchFilters,
} from "@/lib/icon-search";
import { iconKey } from "@/lib/icon-workspace";

/**
 * Local catalog search. Prefers a Web Worker when available; falls back to
 * main-thread scoring + useDeferredValue so typing never blocks the UI.
 */
export function useIconSearch(
	icons: CatalogIcon[] | undefined,
	query: string,
	filters: SearchFilters,
) {
	const deferredQuery = React.useDeferredValue(query);
	const deferredFilters = React.useDeferredValue(filters);
	const [results, setResults] = React.useState<CatalogIcon[] | null>(null);
	const [workerReady, setWorkerReady] = React.useState(false);
	const workerRef = React.useRef<Worker | null>(null);
	const searchIdRef = React.useRef(0);
	const ctxRef = React.useRef<SearchContext | null>(null);
	const iconsRef = React.useRef(icons);
	iconsRef.current = icons;

	const isWorkspace =
		deferredFilters.collection === "favorites" ||
		deferredFilters.collection === "recent";

	const runMainThreadSearch = React.useCallback(
		(source: CatalogIcon[], q: string, f: SearchFilters) => {
			if (f.collection === "favorites" || f.collection === "recent") {
				const keySet =
					f.collection === "favorites" ? f.favoriteKeys : f.recentKeys;
				if (!keySet || keySet.size === 0) {
					setResults([]);
					return;
				}
				const byKey = new Map(source.map((icon) => [iconKey(icon), icon]));
				const ordered: CatalogIcon[] = [];
				for (const key of keySet) {
					const icon = byKey.get(key);
					if (icon) ordered.push(icon);
				}
				const needle = q.trim().toLowerCase();
				if (!needle) {
					setResults(ordered);
					return;
				}
				setResults(
					ordered.filter(
						(icon) =>
							icon.name.toLowerCase().includes(needle) ||
							icon.setId.toLowerCase().includes(needle) ||
							icon.styleId.toLowerCase().includes(needle) ||
							icon.tags?.some((t) => t.includes(needle)),
					),
				);
				return;
			}

			if (!ctxRef.current || ctxRef.current.icons !== source) {
				ctxRef.current = createSearchContext(source);
			}
			setResults(searchWithContext(ctxRef.current, q, f));
		},
		[],
	);

	React.useEffect(() => {
		if (!icons || icons.length === 0) {
			ctxRef.current = null;
			workerRef.current?.terminate();
			workerRef.current = null;
			setWorkerReady(false);
			return;
		}

		let cancelled = false;

		let worker: Worker | null = null;
		try {
			worker = new Worker(
				new URL("../lib/icon-search.worker.ts", import.meta.url),
				{ type: "module" },
			);
		} catch {
			worker = null;
		}

		if (!worker) {
			if (!cancelled) setWorkerReady(false);
			return () => {
				cancelled = true;
			};
		}

		const failToMain = () => {
			worker?.terminate();
			workerRef.current = null;
			if (!cancelled) setWorkerReady(false);
		};

		workerRef.current = worker;
		worker.onmessage = (event: MessageEvent) => {
			const msg = event.data as
				| { type: "ready"; total: number }
				| { type: "results"; id: number; indices: number[] };
			if (msg.type === "ready") {
				if (!cancelled) setWorkerReady(true);
				return;
			}
			if (msg.type === "results" && msg.id === searchIdRef.current) {
				const source = iconsRef.current;
				if (!source) return;
				setResults(
					msg.indices.map((i) => source[i]).filter(Boolean) as CatalogIcon[],
				);
			}
		};
		worker.onerror = () => failToMain();

		try {
			worker.postMessage({ type: "init", icons });
		} catch {
			failToMain();
		}

		return () => {
			cancelled = true;
			worker?.terminate();
			workerRef.current = null;
			setWorkerReady(false);
		};
	}, [icons]);

	React.useEffect(() => {
		if (!icons) {
			setResults(null);
			return;
		}

		if (isWorkspace || !workerReady || !workerRef.current) {
			runMainThreadSearch(icons, deferredQuery, deferredFilters);
			return;
		}

		const id = ++searchIdRef.current;
		workerRef.current.postMessage({
			type: "search",
			id,
			query: deferredQuery,
			filters: {
				collection: deferredFilters.collection,
				styleGroup: deferredFilters.styleGroup,
				selectedStyleId: deferredFilters.selectedStyleId,
			},
		});

		// Safety: if the worker stalls, fall back so the UI never looks stuck.
		const timer = window.setTimeout(() => {
			if (searchIdRef.current === id) {
				runMainThreadSearch(icons, deferredQuery, deferredFilters);
			}
		}, 250);

		return () => window.clearTimeout(timer);
	}, [
		icons,
		deferredQuery,
		deferredFilters,
		isWorkspace,
		workerReady,
		runMainThreadSearch,
	]);

	return {
		results: results ?? [],
		total: results?.length ?? 0,
		ready: results !== null,
		isStale: query !== deferredQuery || filters !== deferredFilters,
	};
}
