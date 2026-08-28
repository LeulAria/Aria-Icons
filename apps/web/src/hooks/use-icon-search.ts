"use client";

import * as React from "react";
import type { CatalogIcon } from "@/lib/icon-catalog";
import {
	expandCatalogIcon,
	getCatalogProgress,
	searchCatalogIndices,
	startCatalogLoad,
	subscribeCatalog,
} from "@/lib/icon-catalog-runtime";
import type { SearchFilters } from "@/lib/icon-search";
import { iconKey } from "@/lib/icon-workspace";

function filterWorkspace(
	items: CatalogIcon[] | undefined,
	query: string,
): CatalogIcon[] {
	if (!items || items.length === 0) return [];
	const needle = query.trim().toLowerCase();
	if (!needle) return items;
	return items.filter(
		(icon) =>
			icon.name.toLowerCase().includes(needle) ||
			icon.setId.toLowerCase().includes(needle) ||
			icon.styleId.toLowerCase().includes(needle) ||
			icon.tags?.some((t) => t.includes(needle)),
	);
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
	const expandedRef = React.useRef(new Map<number, CatalogIcon>());

	const isWorkspace =
		deferredFilters.collection === "favorites" ||
		deferredFilters.collection === "recent";

	React.useEffect(() => subscribeCatalog(() => setVersion((n) => n + 1)), []);

	React.useEffect(() => {
		const collection = filters.collection;
		const prefer =
			collection === "all" ||
			collection === "favorites" ||
			collection === "recent"
				? null
				: collection;
		void startCatalogLoad(prefer);
	}, [filters.collection]);

	const progress = getCatalogProgress();
	void version;

	const indices = React.useMemo(() => {
		if (isWorkspace) return [];
		expandedRef.current = new Map();
		return searchCatalogIndices(deferredQuery, {
			collection: deferredFilters.collection,
			styleGroup: deferredFilters.styleGroup,
			selectedStyleId: deferredFilters.selectedStyleId,
		});
	}, [
		deferredQuery,
		deferredFilters.collection,
		deferredFilters.styleGroup,
		deferredFilters.selectedStyleId,
		isWorkspace,
		version,
	]);

	const remember = React.useCallback((icon: CatalogIcon) => {
		byKeyRef.current.set(iconKey(icon), icon);
	}, []);

	const getIcon = React.useCallback(
		(index: number) => {
			const cached = expandedRef.current.get(index);
			if (cached) return cached;
			const tupleIndex = indices[index];
			if (tupleIndex == null) return undefined;
			const icon = expandCatalogIcon(tupleIndex);
			if (icon) {
				expandedRef.current.set(index, icon);
				byKeyRef.current.set(iconKey(icon), icon);
			}
			return icon;
		},
		[indices],
	);

	const getByKey = React.useCallback((key: string) => {
		return byKeyRef.current.get(key);
	}, []);

	const ensureRange = React.useCallback(
		(start: number, end: number) => {
			const lo = Math.max(0, start);
			const hi = Math.min(indices.length, Math.max(lo, end));
			for (let i = lo; i < hi; i++) getIcon(i);
		},
		[getIcon, indices.length],
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
		total: indices.length,
		ready: indices.length > 0 || progress.catalogReady,
		isStale,
		catalogReady: progress.catalogReady,
		loadedIcons: progress.loadedIcons,
		loadedSets: progress.loadedSets,
		setCount: progress.setCount,
		counts: progress.counts,
	};
}
