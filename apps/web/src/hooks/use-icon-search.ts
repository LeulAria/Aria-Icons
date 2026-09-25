"use client";

import * as React from "react";
import { asCatalogIcon, type CatalogIcon } from "@/lib/icon-catalog";
import { getCatalogProgress } from "@/lib/icon-catalog-runtime";
import type { SearchFilters } from "@/lib/icon-search";
import { iconKey, type WorkspaceIcon } from "@/lib/icon-workspace";

function filterWorkspace(
	items: WorkspaceIcon[] | undefined,
	query: string,
): CatalogIcon[] {
	if (!items || items.length === 0) return [];
	const needle = query.trim().toLowerCase();
	const matched = !needle
		? items
		: items.filter(
				(icon) =>
					icon.name.toLowerCase().includes(needle) ||
					icon.setId.toLowerCase().includes(needle) ||
					icon.styleId.toLowerCase().includes(needle),
			);
	return matched.map(asCatalogIcon);
}

export type IconSearchState = {
	getIcon: (index: number) => CatalogIcon | undefined;
	getByKey: (key: string) => CatalogIcon | undefined;
	remember: (icon: CatalogIcon) => void;
	ensureRange: (start: number, end: number) => void;
	total: number;
	ready: boolean;
	isStale: boolean;
	catalogReady: boolean;
	loadedIcons: number;
	loadedSets: number;
	setCount: number;
	counts: Record<string, Record<string, number>> | undefined;
};

export function useIconSearch(
	query: string,
	filters: SearchFilters,
): IconSearchState {
	const deferredQuery = React.useDeferredValue(query);
	const deferredFilters = React.useDeferredValue(filters);
	const [version, setVersion] = React.useState(0);
	const byKeyRef = React.useRef(new Map<string, CatalogIcon>());
	const pagesRef = React.useRef(new Map<number, CatalogIcon[]>());
	const totalRef = React.useRef(0);
	const inflightRef = React.useRef(new Set<number>());
	const requestRef = React.useRef(0);

	const isWorkspace =
		deferredFilters.collection === "favorites" ||
		deferredFilters.collection === "recent";

	const progress = getCatalogProgress();
	const pageSize = 96;

	const filterKey = isWorkspace
		? ""
		: `${deferredQuery}\n${deferredFilters.collection}\n${deferredFilters.styleGroup}\n${deferredFilters.selectedStyleId}`;

	const loadPage = React.useCallback(
		async (offset: number, requestId: number) => {
			const page = Math.floor(offset / pageSize) * pageSize;
			if (pagesRef.current.has(page) || inflightRef.current.has(page)) return;
			inflightRef.current.add(page);
			try {
				const params = new URLSearchParams({
					offset: String(page),
					limit: String(pageSize),
					q: deferredQuery,
					collection: deferredFilters.collection,
					style: deferredFilters.styleGroup,
					styleId: deferredFilters.selectedStyleId,
				});
				const res = await fetch(`/api/browse?${params}`);
				if (!res.ok || requestId !== requestRef.current) return;
				const data = (await res.json()) as {
					total: number;
					icons: CatalogIcon[];
				};
				if (requestId !== requestRef.current) return;
				pagesRef.current.set(page, data.icons);
				totalRef.current = data.total;
				for (const icon of data.icons) byKeyRef.current.set(iconKey(icon), icon);
				setVersion((n) => n + 1);
			} finally {
				inflightRef.current.delete(page);
			}
		},
		[
			deferredQuery,
			deferredFilters.collection,
			deferredFilters.styleGroup,
			deferredFilters.selectedStyleId,
		],
	);

	React.useEffect(() => {
		if (isWorkspace) return;
		const requestId = ++requestRef.current;
		pagesRef.current = new Map();
		inflightRef.current = new Set();
		totalRef.current = 0;
		void loadPage(0, requestId);
	}, [filterKey, isWorkspace, loadPage]);

	const remember = React.useCallback((icon: CatalogIcon) => {
		byKeyRef.current.set(iconKey(icon), icon);
	}, []);

	const getIcon = React.useCallback(
		(index: number) => {
			void version;
			const page = Math.floor(index / pageSize) * pageSize;
			const icon = pagesRef.current.get(page)?.[index - page];
			if (icon) byKeyRef.current.set(iconKey(icon), icon);
			return icon;
		},
		[version],
	);

	const getByKey = React.useCallback((key: string) => {
		return byKeyRef.current.get(key);
	}, []);

	const ensureRange = React.useCallback(
		(start: number, end: number) => {
			const requestId = requestRef.current;
			const lo = Math.max(0, start);
			const hi = Math.max(lo, end);
			for (let page = Math.floor(lo / pageSize) * pageSize; page <= hi; page += pageSize) {
				void loadPage(page, requestId);
			}
		},
		[loadPage],
	);

	const isStale = query !== deferredQuery || filters !== deferredFilters;

	if (isWorkspace) {
		const source =
			deferredFilters.collection === "favorites"
				? deferredFilters.favoriteIcons
				: deferredFilters.recentIcons;
		const items = filterWorkspace(source, deferredQuery);
		return {
			getIcon: (index) => items[index],
			getByKey,
			remember,
			ensureRange,
			total: items.length,
			ready: true,
			isStale,
			catalogReady: true,
			loadedIcons: items.length,
			loadedSets: 1,
			setCount: 1,
			counts: progress.counts,
		};
	}

	return {
		getIcon,
		getByKey,
		remember,
		ensureRange,
		total: totalRef.current,
		ready: version > 0 && (totalRef.current > 0 || pagesRef.current.has(0)),
		isStale,
		catalogReady: true,
		loadedIcons: totalRef.current,
		loadedSets: progress.setCount,
		setCount: progress.setCount,
		counts: progress.counts,
	};
}
