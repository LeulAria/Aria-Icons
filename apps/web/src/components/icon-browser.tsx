"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isAnimatedSet } from "@/lib/animated-sets";
import {
	ICON_SETS,
	type IconSetConfig,
	type IconStyleFilter,
} from "@/lib/icon-sets";
import {
	SIDEBAR_PINNED_ICONIFY_SET,
	sidebarCuratedRank,
} from "@/lib/icon-set-order";
import {
	ChevronRight,
	Columns3,
	GitPullRequestArrow,
	Heart,
	Search,
	X,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { GitHubStars } from "@/components/github-stars";
import { ModeToggle } from "@/components/mode-toggle";
import { McpDialog } from "@/components/mcp-dialog";
import { IconInspector } from "@/components/icon-inspector";
import { IconFamilyPlayground } from "@/components/icon-family-playground";
import {
	CommandPalette,
	type CommandItem,
} from "@/components/command-palette";
import {
	VirtualIconGrid,
	type Density,
	type VirtualIconGridHandle,
} from "@/components/virtual-icon-grid";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import {
	countForStyleGroup,
	loadIconCatalogIndex,
	type CatalogIcon,
} from "@/lib/icon-catalog";
import { useIconSearch } from "@/hooks/use-icon-search";
import {
	getFavorites,
	getRecent,
	iconKey,
	pushRecent,
	toggleFavorite,
	type WorkspaceIcon,
} from "@/lib/icon-workspace";
import { useTheme } from "next-themes";
import {
	fetchIconSvg,
	formatIconExport,
	themeIconColor,
	type IconExportCustomize,
} from "@/lib/icon-export";
import { toast } from "sonner";
import {
	loadMorphPath,
	morphErrorMessage,
	MAX_MORPH_SEQUENCE,
} from "@/lib/icon-morph";

type CollectionId = "all" | "favorites" | "recent" | string;

const STYLE_TABS: { id: IconStyleFilter; label: string }[] = [
	{ id: "both", label: "All" },
	{ id: "line", label: "Line" },
	{ id: "solid", label: "Filled" },
	{ id: "animated", label: "Animated" },
];

const DENSITY_TABS: { id: Density; label: string; ariaLabel: string }[] = [
	{ id: "compact", label: "S", ariaLabel: "compact density" },
	{ id: "comfortable", label: "M", ariaLabel: "comfortable density" },
	{ id: "spacious", label: "L", ariaLabel: "spacious density" },
];

const INSPECTOR_MIN = 280;
const INSPECTOR_MAX = 640;
const INSPECTOR_DEFAULT = 352;
const INSPECTOR_WIDTH_KEY = "aria-inspector-width";

function clampInspectorWidth(width: number) {
	return Math.min(INSPECTOR_MAX, Math.max(INSPECTOR_MIN, Math.round(width)));
}

function isTypingTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		target.isContentEditable
	);
}

export function IconBrowser({ sets }: { sets: IconSetConfig[] }) {
	const pathname = usePathname();
	const router = useRouter();
	const { resolvedTheme } = useTheme();
	const defaultCustomize = React.useMemo<IconExportCustomize>(
		() => ({
			size: 24,
			stroke: 1,
			color: themeIconColor(resolvedTheme),
		}),
		[resolvedTheme],
	);
	const [styleGroup, setStyleGroup] = React.useState<IconStyleFilter>("both");
	const [search, setSearch] = React.useState("");
	const [collection, setCollection] = React.useState<CollectionId>(() =>
		pathname === "/favorites" ? "favorites" : "all",
	);
	const [selectedStyleId, setSelectedStyleId] = React.useState<string>("both");
	const [focusedIcon, setFocusedIcon] = React.useState<CatalogIcon | null>(null);
	const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
		() => new Set(),
	);
	const [morphMode, setMorphMode] = React.useState(false);
	const [morphIcons, setMorphIcons] = React.useState<CatalogIcon[]>([]);
	const [morphActiveKey, setMorphActiveKey] = React.useState<string | null>(
		null,
	);
	const [mcpDialogOpen, setMcpDialogOpen] = React.useState(false);
	const [playgroundMode, setPlaygroundMode] = React.useState(false);
	const [libraryDrawerOpen, setLibraryDrawerOpen] = React.useState(false);
	const [commandOpen, setCommandOpen] = React.useState(false);
	const [commandQuery, setCommandQuery] = React.useState("");
	const [density, setDensity] = React.useState<Density>("compact");
	const [sidebarSearch, setSidebarSearch] = React.useState("");
	const [inspectorWidth, setInspectorWidth] = React.useState(INSPECTOR_DEFAULT);
	const [favoritesVersion, setFavoritesVersion] = React.useState(0);
	const [recentVersion, setRecentVersion] = React.useState(0);
	const [workspaceReady, setWorkspaceReady] = React.useState(false);
	const lastSelectedIndexRef = React.useRef<number | null>(null);
	const searchInputRef = React.useRef<HTMLInputElement | null>(null);
	const iconsScrollRef = React.useRef<HTMLDivElement | null>(null);
	const gridRef = React.useRef<VirtualIconGridHandle | null>(null);
	const inspectorActionsRef = React.useRef<{
		copySvg: () => Promise<void>;
		download: () => Promise<void>;
		getCustomize: () => IconExportCustomize;
	} | null>(null);

	React.useEffect(() => {
		setWorkspaceReady(true);
	}, []);

	React.useEffect(() => {
		try {
			const raw = localStorage.getItem(INSPECTOR_WIDTH_KEY);
			const parsed = raw ? Number.parseInt(raw, 10) : NaN;
			if (Number.isFinite(parsed)) {
				setInspectorWidth(clampInspectorWidth(parsed));
			}
		} catch {
			// ignore
		}
	}, []);

	const handleInspectorWidthChange = React.useCallback((width: number) => {
		const next = clampInspectorWidth(width);
		setInspectorWidth(next);
		try {
			localStorage.setItem(INSPECTOR_WIDTH_KEY, String(next));
		} catch {
			// ignore
		}
	}, []);

	const catalogQuery = useQuery({
		queryKey: ["icon-catalog-index"],
		queryFn: loadIconCatalogIndex,
		staleTime: Infinity,
		gcTime: Infinity,
	});

	React.useEffect(() => {
		if (collection === "favorites" || collection === "recent") return;
		if (collection === "all") {
			setSelectedStyleId(styleGroup);
			return;
		}
		const set = sets.find((s) => s.id === collection);
		if (!set) return;
		if (styleGroup === "both" || styleGroup === "animated") {
			setSelectedStyleId("both");
			return;
		}
		const preferred = set.styles.find((s) => s.group === styleGroup);
		if (!preferred) return;
		if (preferred.id !== selectedStyleId) setSelectedStyleId(preferred.id);
	}, [styleGroup, sets, collection, selectedStyleId]);

	const favorites = React.useMemo(() => {
		void favoritesVersion;
		if (!workspaceReady) return [];
		return getFavorites();
	}, [favoritesVersion, workspaceReady]);

	const recent = React.useMemo(() => {
		void recentVersion;
		if (!workspaceReady) return [];
		return getRecent();
	}, [recentVersion, workspaceReady]);

	const favoriteKeys = React.useMemo(
		() => new Set(favorites.map((item) => iconKey(item))),
		[favorites],
	);

	const recentKeys = React.useMemo(
		() => new Set(recent.map((item) => iconKey(item))),
		[recent],
	);

	const searchFilters = React.useMemo(
		() => ({
			collection,
			styleGroup,
			selectedStyleId,
			favoriteKeys,
			recentKeys,
			favoriteIcons: favorites,
			recentIcons: recent,
		}),
		[collection, styleGroup, selectedStyleId, favoriteKeys, recentKeys, favorites, recent],
	);

	const {
		getIcon,
		getByKey,
		remember,
		ensureRange,
		total: totalShown,
		ready: searchReady,
		isStale,
		catalogReady,
		loadedSets,
		setCount,
		counts: searchCounts,
	} = useIconSearch(search, searchFilters);

	const counts = catalogQuery.data?.counts ?? searchCounts;

	const curatedSetIds = React.useMemo(
		() => new Set(ICON_SETS.map((s) => s.id)),
		[],
	);

	const setForSidebar = React.useMemo(() => {
		return sets
			.map((s) => {
				const countForGroup = counts
					? countForStyleGroup(counts, s.id, s.styles, styleGroup)
					: 0;
				return { ...s, countForGroup };
			})
			.filter(
				(s) => !counts || s.countForGroup > 0 || s.id === collection,
			);
	}, [sets, styleGroup, counts, collection]);

	const sidebarLibraries = React.useMemo(() => {
		const curated = setForSidebar
			.filter(
				(s) =>
					curatedSetIds.has(s.id) ||
					s.id === "thesvg" ||
					SIDEBAR_PINNED_ICONIFY_SET.has(s.id),
			)
			.sort((a, b) => sidebarCuratedRank(a.id) - sidebarCuratedRank(b.id));
		const rest = setForSidebar.filter(
			(s) =>
				!curatedSetIds.has(s.id) &&
				s.id !== "thesvg" &&
				!SIDEBAR_PINNED_ICONIFY_SET.has(s.id),
		);
		const merged = [...curated, ...rest];
		const q = sidebarSearch.trim().toLowerCase();
		if (!q) return merged;
		return merged.filter(
			(s) =>
				s.label.toLowerCase().includes(q) ||
				s.id.toLowerCase().includes(q) ||
				(s.homepage?.toLowerCase().includes(q) ?? false),
		);
	}, [setForSidebar, curatedSetIds, sidebarSearch]);

	const disableMorph = React.useCallback(() => {
		setMorphMode(false);
		setMorphIcons((current) => {
			const active =
				current.find((icon) => iconKey(icon) === morphActiveKey) ??
				current[0] ??
				null;
			if (active) {
				setFocusedIcon(active);
				setSelectedKeys(new Set([iconKey(active)]));
			}
			return [];
		});
		setMorphActiveKey(null);
	}, [morphActiveKey]);

	const enableMorph = React.useCallback(async () => {
		if (morphMode || !focusedIcon) return;
		try {
			await loadMorphPath(focusedIcon);
		} catch (error) {
			toast.error("Can't morph this icon", {
				description: morphErrorMessage(error),
			});
			return;
		}

		const candidates =
			selectedKeys.size > 1
				? [...selectedKeys]
						.map((key) => getByKey(key))
						.filter((icon): icon is CatalogIcon => Boolean(icon))
						.slice(0, MAX_MORPH_SEQUENCE)
				: [focusedIcon];
		const ok: CatalogIcon[] = [];
		for (const icon of candidates) {
			try {
				await loadMorphPath(icon);
				ok.push(icon);
			} catch {
				// Skip fill / unsupported icons in a multi-select seed.
			}
		}
		if (ok.length === 0) {
			toast.error("Can't morph this icon", {
				description: "Morphing needs stroke-based line icons.",
			});
			return;
		}

		setMorphIcons(ok);
		setMorphActiveKey(iconKey(ok[0]!));
		setFocusedIcon(ok[0]!);
		setMorphMode(true);
	}, [focusedIcon, getByKey, morphMode, selectedKeys]);

	const addMorphIcon = React.useCallback(async (icon: WorkspaceIcon) => {
		const key = iconKey(icon);
		try {
			await loadMorphPath(icon);
		} catch (error) {
			toast.error("Can't morph this icon", {
				description: morphErrorMessage(error),
			});
			return;
		}

		setMorphIcons((prev) => {
			if (prev.some((item) => iconKey(item) === key)) return prev;
			if (prev.length >= MAX_MORPH_SEQUENCE) {
				toast.error("Morph sequence is full", {
					description: `Remove an icon to add another (${MAX_MORPH_SEQUENCE} max).`,
				});
				return prev;
			}
			return [...prev, icon as CatalogIcon];
		});
		setMorphActiveKey(key);
		setFocusedIcon(icon as CatalogIcon);
		pushRecent(icon);
		setRecentVersion((v) => v + 1);
		remember(icon as CatalogIcon);
	}, [remember]);

	const selectMorphIcon = React.useCallback((key: string) => {
		setMorphActiveKey(key);
		setMorphIcons((current) => {
			const icon = current.find((item) => iconKey(item) === key);
			if (icon) setFocusedIcon(icon);
			return current;
		});
	}, []);

	const removeMorphIcon = React.useCallback((key: string) => {
		setMorphIcons((prev) => {
			if (prev.length <= 1) return prev;
			const next = prev.filter((icon) => iconKey(icon) !== key);
			setMorphActiveKey((active) => {
				if (active !== key) return active;
				const fallback = next[next.length - 1];
				if (fallback) {
					setFocusedIcon(fallback);
					return iconKey(fallback);
				}
				return active;
			});
			return next;
		});
	}, []);

	const reorderMorphIcons = React.useCallback((keys: string[]) => {
		setMorphIcons((prev) => {
			const byKey = new Map(prev.map((icon) => [iconKey(icon), icon]));
			const next = keys
				.map((key) => byKey.get(key))
				.filter((icon): icon is CatalogIcon => Boolean(icon));
			if (next.length !== prev.length) return prev;
			return next;
		});
	}, []);

	const selectLibrary = React.useCallback(
		(set: IconSetConfig & { countForGroup?: number }) => {
			setCollection(set.id);
			setSearch("");
			if (styleGroup === "both" || styleGroup === "animated") {
				if (styleGroup === "animated" && !isAnimatedSet(set.id)) {
					setStyleGroup("both");
				}
				setSelectedStyleId("both");
			} else {
				const preferred =
					set.styles.find((s) => s.group === styleGroup) ??
					set.styles[0] ??
					null;
				if (preferred) setSelectedStyleId(preferred.id);
			}
			setFocusedIcon(null);
			setSelectedKeys(new Set());
			lastSelectedIndexRef.current = null;
			setMorphMode(false);
			setMorphIcons([]);
			setMorphActiveKey(null);
			setPlaygroundMode(false);
			setLibraryDrawerOpen(false);
			if (pathname === "/favorites") router.push("/");
		},
		[pathname, router, styleGroup],
	);

	const openFocusedSet = React.useCallback(
		(setId: string) => {
			const set = sets.find((s) => s.id === setId);
			if (!set) return;
			setCollection(set.id);
			setSearch("");
			if (pathname === "/favorites") router.push("/");
			if (styleGroup === "animated" && !isAnimatedSet(set.id)) {
				setStyleGroup("both");
				setSelectedStyleId("both");
				return;
			}
			if (styleGroup === "both" || styleGroup === "animated") {
				setSelectedStyleId("both");
				return;
			}
			const preferred =
				set.styles.find((s) => s.group === styleGroup) ??
				set.styles[0] ??
				null;
			if (preferred) setSelectedStyleId(preferred.id);
		},
		[pathname, router, sets, styleGroup],
	);

	const allCountForGroup = React.useMemo(() => {
		if (!counts) return 0;
		return sets.reduce(
			(acc, s) => acc + countForStyleGroup(counts, s.id, s.styles, styleGroup),
			0,
		);
	}, [sets, styleGroup, counts]);

	const selectedSet = React.useMemo(() => {
		if (collection === "all" || collection === "favorites" || collection === "recent")
			return null;
		return sets.find((s) => s.id === collection) ?? null;
	}, [sets, collection]);

	const selectedIcons = React.useMemo(() => {
		if (selectedKeys.size === 0) return [] as CatalogIcon[];
		const out: CatalogIcon[] = [];
		for (const key of selectedKeys) {
			const icon = getByKey(key);
			if (icon) out.push(icon);
		}
		return out;
	}, [getByKey, selectedKeys]);

	const isWorkspaceCollection =
		collection === "favorites" || collection === "recent";

	const title =
		collection === "all"
			? "All Icons"
			: collection === "favorites"
				? "Favorites"
				: collection === "recent"
					? "Recently Used"
					: (selectedSet?.label ?? "Icons");

	const subtitle = isWorkspaceCollection
		? collection === "favorites"
			? `${favorites.length.toLocaleString()} saved`
			: `${recent.length.toLocaleString()} recent`
		: `${totalShown.toLocaleString()} icons${
				!catalogReady && collection === "all" && setCount > 0
					? ` · ${loadedSets}/${setCount} libraries`
					: ""
			}`;

	const selectStyleGroup = React.useCallback((next: IconStyleFilter) => {
		setStyleGroup(next);
	}, []);

	const resetBrowseSelection = React.useCallback(() => {
		setFocusedIcon(null);
		setSelectedKeys(new Set());
		lastSelectedIndexRef.current = null;
		setMorphMode(false);
		setMorphIcons([]);
		setMorphActiveKey(null);
		setPlaygroundMode(false);
	}, []);

	const selectCollection = React.useCallback(
		(id: CollectionId) => {
			setCollection(id);
			resetBrowseSelection();
			if (id === "all") setSelectedStyleId(styleGroup);
			const nextPath = id === "favorites" ? "/favorites" : "/";
			if (pathname !== nextPath) router.push(nextPath);
			setLibraryDrawerOpen(false);
		},
		[pathname, resetBrowseSelection, router, styleGroup],
	);

	React.useEffect(() => {
		if (pathname === "/favorites") {
			setCollection("favorites");
			resetBrowseSelection();
			return;
		}
		if (pathname === "/") {
			setCollection((id) => (id === "favorites" ? "all" : id));
		}
	}, [pathname, resetBrowseSelection]);

	React.useEffect(() => {
		if (!libraryDrawerOpen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			e.preventDefault();
			setLibraryDrawerOpen(false);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [libraryDrawerOpen]);

	const markRecent = (icon: WorkspaceIcon) => {
		pushRecent(icon);
		setRecentVersion((v) => v + 1);
	};

	const handleFavorite = React.useCallback((icon: WorkspaceIcon) => {
		const added = toggleFavorite(icon);
		setFavoritesVersion((v) => v + 1);
		toast.success(added ? "Added to favorites" : "Removed from favorites", {
			description: icon.name,
		});
	}, []);

	const quickCopy = React.useCallback(async (icon: WorkspaceIcon) => {
		try {
			const svg = await fetchIconSvg(icon, defaultCustomize);
			await navigator.clipboard.writeText(
				formatIconExport(svg, icon.name, "svg"),
			);
			markRecent(icon);
			toast.success("Copied SVG", { description: icon.name });
		} catch (error) {
			toast.error("Failed to copy SVG", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}, [defaultCustomize]);

	const quickDownload = React.useCallback(async (icon: WorkspaceIcon) => {
		try {
			const svg = await fetchIconSvg(icon, defaultCustomize);
			const blob = new Blob([svg], { type: "image/svg+xml" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${icon.name}.svg`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			markRecent(icon);
			toast.success("Downloaded SVG", { description: icon.name });
		} catch (error) {
			toast.error("Failed to download", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}, [defaultCustomize]);

	const focusIcon = React.useCallback((icon: CatalogIcon | WorkspaceIcon) => {
		remember(icon as CatalogIcon);
		setFocusedIcon(icon as CatalogIcon);
		setSelectedKeys(new Set([iconKey(icon)]));
		markRecent(icon);
	}, [remember]);

	const clearSelection = React.useCallback(() => {
		setFocusedIcon(null);
		setSelectedKeys(new Set());
		lastSelectedIndexRef.current = null;
		setMorphMode(false);
		setMorphIcons([]);
		setMorphActiveKey(null);
	}, []);

	const handleGridClick = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const cell = (e.target as HTMLElement).closest<HTMLElement>(
				"[data-icon-key]",
			);
			if (!cell) return;

			const key = cell.dataset.iconKey;
			const idx = Number(cell.dataset.iconIndex);
			const icon = getIcon(idx);
			if (!key || !icon) return;
			remember(icon);

			if (morphMode) {
				void addMorphIcon(icon);
				lastSelectedIndexRef.current = idx;
				return;
			}

			setFocusedIcon(icon);
			markRecent(icon);
			setSelectedKeys((prev) => {
				if (e.ctrlKey || e.metaKey) {
					const next = new Set(prev);
					if (next.has(key)) next.delete(key);
					else next.add(key);
					return next;
				}

				if (e.shiftKey && lastSelectedIndexRef.current != null) {
					const start = Math.min(lastSelectedIndexRef.current, idx);
					const end = Math.max(lastSelectedIndexRef.current, idx);
					const next = new Set(prev);
					for (let j = start; j <= end; j++) {
						const it = getIcon(j);
						if (!it) continue;
						remember(it);
						next.add(iconKey(it));
					}
					return next;
				}

				return new Set([key]);
			});
			lastSelectedIndexRef.current = idx;
		},
		[addMorphIcon, getIcon, morphMode, remember],
	);

	const moveFocus = React.useCallback(
		(delta: number) => {
			if (totalShown === 0) return;
			const currentIdx = lastSelectedIndexRef.current ?? -1;
			const nextIdx = Math.min(
				Math.max((currentIdx < 0 ? 0 : currentIdx) + delta, 0),
				totalShown - 1,
			);
			const next = getIcon(nextIdx);
			if (!next) {
				ensureRange(nextIdx, nextIdx + 1);
				return;
			}
			focusIcon(next);
			lastSelectedIndexRef.current = nextIdx;
			gridRef.current?.scrollToIndex(nextIdx);
		},
		[ensureRange, focusIcon, getIcon, totalShown],
	);

	React.useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			const meta = e.metaKey || e.ctrlKey;

			if (meta && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setCommandOpen(true);
				setCommandQuery(search);
				return;
			}

			if (commandOpen) return;
			if (isTypingTarget(e.target)) return;

			if (playgroundMode) {
				if (e.key === "Escape") {
					e.preventDefault();
					setPlaygroundMode(false);
				}
				return;
			}

			if (e.key === "Escape") {
				if (morphMode) {
					e.preventDefault();
					disableMorph();
					return;
				}
				if (focusedIcon) {
					e.preventDefault();
					clearSelection();
				}
				return;
			}

			if (e.key === "/" && !meta) {
				e.preventDefault();
				searchInputRef.current?.focus();
				return;
			}

			if (e.key === "f" && !meta) {
				if (!focusedIcon) return;
				e.preventDefault();
				handleFavorite(focusedIcon);
				return;
			}

			if (e.key === "Enter" && focusedIcon) {
				e.preventDefault();
				return;
			}

			if (meta && e.key.toLowerCase() === "c" && focusedIcon) {
				e.preventDefault();
				void (inspectorActionsRef.current?.copySvg() ?? quickCopy(focusedIcon));
				return;
			}

			if (meta && e.key.toLowerCase() === "d" && focusedIcon) {
				e.preventDefault();
				void (
					inspectorActionsRef.current?.download() ?? quickDownload(focusedIcon)
				);
				return;
			}

			const cols = gridRef.current?.columnCount ?? 9;
			if (morphMode && morphIcons.length > 1) {
				if (
					e.key === "ArrowRight" ||
					e.key === "ArrowDown" ||
					e.key === "ArrowLeft" ||
					e.key === "ArrowUp"
				) {
					e.preventDefault();
					const dir =
						e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
					const idx = morphIcons.findIndex(
						(icon) => iconKey(icon) === morphActiveKey,
					);
					const next =
						morphIcons[
							(idx + dir + morphIcons.length) % morphIcons.length
						];
					if (next) selectMorphIcon(iconKey(next));
					return;
				}
			}
			if (e.key === "ArrowRight") {
				e.preventDefault();
				moveFocus(1);
			} else if (e.key === "ArrowLeft") {
				e.preventDefault();
				moveFocus(-1);
			} else if (e.key === "ArrowDown") {
				e.preventDefault();
				moveFocus(cols);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				moveFocus(-cols);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		clearSelection,
		commandOpen,
		disableMorph,
		focusedIcon,
		handleFavorite,
		morphActiveKey,
		morphIcons,
		morphMode,
		moveFocus,
		playgroundMode,
		quickCopy,
		quickDownload,
		search,
		selectMorphIcon,
	]);

	const commands: CommandItem[] = React.useMemo(() => {
		const items: CommandItem[] = [
			{
				id: "search-focus",
				label: "Focus search",
				shortcut: "/",
				group: "Navigation",
				onSelect: () => searchInputRef.current?.focus(),
			},
			{
				id: "all-icons",
				label: "Go to All Icons",
				group: "Collections",
				onSelect: () => selectCollection("all"),
			},
			{
				id: "favorites",
				label: "Go to Favorites",
				group: "Collections",
				onSelect: () => selectCollection("favorites"),
			},
			{
				id: "recent",
				label: "Go to Recently Used",
				group: "Collections",
				onSelect: () => selectCollection("recent"),
			},
			{
				id: "copy-svg",
				label: "Copy SVG",
				shortcut: "⌘C",
				group: "Icon",
				disabled: !focusedIcon,
				onSelect: () => {
					if (focusedIcon) void quickCopy(focusedIcon);
				},
			},
			{
				id: "download",
				label: "Download SVG",
				shortcut: "⌘D",
				group: "Icon",
				disabled: !focusedIcon,
				onSelect: () => {
					if (focusedIcon) void quickDownload(focusedIcon);
				},
			},
			{
				id: "favorite",
				label:
					focusedIcon && favoriteKeys.has(iconKey(focusedIcon))
						? "Remove from favorites"
						: "Add to favorites",
				shortcut: "F",
				group: "Icon",
				disabled: !focusedIcon,
				onSelect: () => {
					if (focusedIcon) handleFavorite(focusedIcon);
				},
			},
			{
				id: "close-inspector",
				label: "Close customization",
				shortcut: "Esc",
				group: "Icon",
				disabled: !focusedIcon,
				onSelect: clearSelection,
			},
			{
				id: "style-line",
				label: "Show Line icons",
				group: "Filters",
				onSelect: () => setStyleGroup("line"),
			},
			{
				id: "style-fill",
				label: "Show Filled icons",
				group: "Filters",
				onSelect: () => setStyleGroup("solid"),
			},
			{
				id: "style-both",
				label: "Show all icons",
				group: "Filters",
				onSelect: () => setStyleGroup("both"),
			},
			{
				id: "style-animated",
				label: "Show Animated icons",
				group: "Filters",
				onSelect: () => selectStyleGroup("animated"),
			},
			{
				id: "mcp",
				label: "Add MCP Server",
				group: "Integrations",
				onSelect: () => setMcpDialogOpen(true),
			},
			{
				id: "contribute",
				label: "Contribute new icons",
				group: "Integrations",
				onSelect: () => {
					window.location.href = "/contribute";
				},
			},
		];

		if (commandQuery.trim()) {
			items.unshift({
				id: "apply-search",
				label: `Search icons for “${commandQuery.trim()}”`,
				group: "Search",
				onSelect: () => {
					setSearch(commandQuery.trim());
					selectCollection("all");
				},
			});
		}

		return items;
	}, [
		clearSelection,
		commandQuery,
		favoriteKeys,
		focusedIcon,
		handleFavorite,
		quickCopy,
		quickDownload,
		selectCollection,
		selectStyleGroup,
	]);

	const showLoading =
		!isWorkspaceCollection &&
		!searchReady &&
		totalShown === 0 &&
		!catalogQuery.isError;
	const showEmptyWorkspace =
		isWorkspaceCollection && totalShown === 0 && !showLoading;
	const showEmptySearch =
		!isWorkspaceCollection &&
		!showLoading &&
		searchReady &&
		totalShown === 0;

	return (
		<div
			className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
			style={{ height: "100vh", minHeight: "100vh" }}
		>
			<div
				className={cn(
					"grid h-full min-h-0 flex-1 grid-rows-1 overflow-hidden",
					playgroundMode
						? "lg:grid-cols-[15.5rem_minmax(0,1fr)]"
						: "lg:grid-cols-[15.5rem_minmax(0,1fr)_var(--inspector-w)]",
				)}
				style={
					{
						"--inspector-w": `${inspectorWidth}px`,
					} as React.CSSProperties
				}
			>
				<aside
					className={cn(
						"h-full min-h-0 min-w-0 overflow-hidden border-r border-border bg-sidebar",
						"fixed inset-y-0 left-0 z-50 w-[15.5rem] transition-transform duration-200 ease-out",
						libraryDrawerOpen
							? "translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.4)]"
							: "-translate-x-full pointer-events-none",
						"lg:relative lg:z-auto lg:w-auto lg:translate-x-0 lg:pointer-events-auto lg:shadow-none",
					)}
				>
					<div className="flex h-full min-h-0 min-w-0 flex-col">
						<div className="min-w-0 px-5 pb-4 pt-5">
							<div className="flex min-w-0 items-center justify-between gap-2">
								<Link
									href="/"
									aria-label="Aria Icons home"
									onClick={(e) => {
										e.preventDefault();
										selectCollection("all");
									}}
									className="flex min-w-0 items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-1 focus-visible:ring-foreground/25"
								>
									<img
										src="/logo.svg"
										alt=""
										width={22}
										height={22}
										className="size-[22px] shrink-0 theme-invert"
									/>
									<div className="truncate text-[15px] font-semibold tracking-tight text-foreground">
										Aria Icons
									</div>
								</Link>
								<div className="flex shrink-0 items-center gap-0.5">
									<ModeToggle />
									<GitHubStars />
									<button
										type="button"
										aria-label="Close libraries"
										onClick={() => setLibraryDrawerOpen(false)}
										className="grid size-8 place-items-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/[0.06] hover:text-foreground lg:hidden"
									>
										<X className="size-4" />
									</button>
								</div>
							</div>
							<div className="mt-1 line-clamp-2 text-[11px] leading-4 text-foreground/40">
								Search, customize, and export SVG icons from curated libraries.
							</div>
							<div className="mt-2 flex flex-col items-stretch">
								<Button
									variant="ghost"
									size="sm"
									asChild
									className={cn(
										"h-auto w-full justify-start gap-1.5 rounded-md px-2 py-2 text-xs has-[>svg]:px-2 hover:text-foreground",
										collection === "favorites"
											? "text-foreground"
											: "text-muted-foreground",
									)}
								>
									<Link
										href="/favorites"
										onClick={(e) => {
											e.preventDefault();
											selectCollection("favorites");
										}}
									>
										<Heart
											className={cn(
												"size-3.5",
												collection === "favorites" && "fill-current",
											)}
										/>
										Favorites
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									asChild
									className="h-auto w-full justify-start gap-1.5 rounded-md px-2 py-2 text-xs text-muted-foreground has-[>svg]:px-2 hover:text-foreground"
								>
									<Link href="/changelog">
										<img
											src="/changelog.svg"
											alt=""
											width={14}
											height={14}
											className="size-3.5 theme-invert"
										/>
										View Changelogs
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setMcpDialogOpen(true);
										setLibraryDrawerOpen(false);
									}}
									className="h-auto w-full justify-start gap-1.5 rounded-md px-2 py-2 text-xs text-muted-foreground has-[>svg]:px-2 hover:text-foreground"
								>
									<img
										src="/mcp.svg"
										alt=""
										width={14}
										height={14}
										className="size-3.5 theme-invert"
									/>
									Add MCP Server
								</Button>
								<Button
									variant="ghost"
									size="sm"
									asChild
									className="h-auto w-full justify-start gap-1.5 rounded-md px-2 py-2 text-xs text-muted-foreground has-[>svg]:px-2 hover:text-foreground"
								>
									<Link href="/contribute">
										<GitPullRequestArrow className="size-3.5" />
										Contribute Icons
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									aria-pressed={playgroundMode}
									onClick={() => {
										setPlaygroundMode((open) => !open);
										setLibraryDrawerOpen(false);
									}}
									className={cn(
										"h-auto w-full justify-start gap-1.5 rounded-md px-2 py-2 text-xs has-[>svg]:px-2 hover:text-foreground",
										playgroundMode
											? "text-foreground"
											: "text-muted-foreground",
									)}
								>
									<Columns3 className="size-3.5" />
									Explore Families
								</Button>
							</div>
						</div>

						<div className="flex min-h-0 min-w-0 flex-1 flex-col">
							<div className="z-10 w-full shrink-0 border-b border-border bg-sidebar">
								<div className="px-5 pb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-foreground/30">
									Collections
								</div>
								<label className="group/search block w-full px-5 pb-3">
									<span className="relative block">
										<Search
											aria-hidden
											strokeWidth={1.6}
											className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-foreground/30 transition-colors duration-200 group-focus-within/search:text-foreground/65"
										/>
										<Input
											aria-label="Search collections"
											className="h-8 w-full rounded-[3px] border-foreground/12 bg-transparent pr-7 pl-7 text-left text-[12px] tracking-tight placeholder:text-foreground/30 hover:border-foreground/20 focus-visible:border-foreground/28 focus-visible:bg-transparent"
											placeholder="Search collections…"
											value={sidebarSearch}
											onChange={(e) => setSidebarSearch(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Escape") {
													if (sidebarSearch) setSidebarSearch("");
													else (e.target as HTMLInputElement).blur();
												}
											}}
										/>
										{sidebarSearch ? (
											<button
												type="button"
												aria-label="Clear collection search"
												onClick={() => setSidebarSearch("")}
												className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center text-foreground/30 transition-colors hover:text-foreground/70"
											>
												<X className="size-3" />
											</button>
										) : null}
									</span>
								</label>
							</div>
							<div className="min-h-0 min-w-0 flex-1 overflow-auto pb-6">
							<nav className="grid min-w-0">
								<SidebarRow
									label="All Icons"
									subtitle={`${allCountForGroup.toLocaleString()} icons`}
									count={allCountForGroup}
									active={collection === "all"}
									onClick={() => selectCollection("all")}
								/>
								<SidebarRow
									label="Recently Used"
									subtitle="Your recent picks"
									count={recent.length}
									active={collection === "recent"}
									onClick={() => selectCollection("recent")}
								/>
							</nav>

							{catalogQuery.isLoading ? (
								<div className="mt-4 flex items-center gap-2 px-5 py-2 text-sm text-foreground/40">
									<Loader size="sm" />
									<span>Loading…</span>
								</div>
							) : catalogQuery.isError ? (
								<div className="mt-4 px-5 py-2 text-sm text-destructive">
									Failed to load libraries
								</div>
							) : sidebarLibraries.length > 0 ? (
								<nav className="mt-1 grid min-w-0">
									{sidebarLibraries.map((set) => (
										<SidebarRow
											key={set.id}
											label={set.label}
											subtitle={set.homepage ?? set.id}
											count={set.countForGroup}
											active={collection === set.id}
											onClick={() => selectLibrary(set)}
										/>
									))}
								</nav>
							) : (
								<div className="px-5 py-3 text-[12px] text-foreground/35">
									No collections match
								</div>
							)}
							</div>
						</div>
					</div>
				</aside>

				{libraryDrawerOpen ? (
					<button
						type="button"
						aria-label="Close libraries"
						className="fixed inset-0 z-40 bg-black/45 lg:hidden"
						onClick={() => setLibraryDrawerOpen(false)}
					/>
				) : null}

				{playgroundMode ? (
					<IconFamilyPlayground
						sets={setForSidebar}
						onSelectFamily={selectLibrary}
						onExit={() => setPlaygroundMode(false)}
					/>
				) : (
					<>
				<main
					ref={iconsScrollRef}
					className="icons-canvas relative flex h-full min-h-0 min-w-0 flex-col overflow-auto"
				>
					<div className="sticky top-0 z-10 bg-canvas/55 px-4 pt-4 backdrop-blur-md sm:px-6 sm:pt-5">
						<div className="flex flex-col gap-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
							<div className="flex min-w-0 items-start justify-between gap-3">
								<div className="min-w-0">
									<h1 className="truncate text-[22px] font-semibold tracking-tight text-foreground">
										{title}
									</h1>
									<p className="mt-0.5 text-[13px] text-foreground/40">
										{subtitle}
										{isStale ? "…" : ""}
									</p>
								</div>
								<button
									type="button"
									aria-label={`Open libraries, ${title}`}
									aria-expanded={libraryDrawerOpen}
									onClick={() => setLibraryDrawerOpen(true)}
									className="mt-0.5 inline-flex max-w-[min(100%,14.5rem)] shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-left outline-none transition-colors hover:bg-foreground/[0.05] focus-visible:ring-1 focus-visible:ring-foreground/25 lg:hidden"
								>
									<span className="truncate text-[12px] text-foreground/40">
										Libraries
									</span>
									<ChevronRight className="size-3 shrink-0 text-foreground/25" />
									<span className="min-w-0 truncate text-[12px] font-medium text-foreground/80">
										{title}
									</span>
								</button>
							</div>

							<label className="group/search relative w-full max-w-xl lg:flex-1">
								<Search
									aria-hidden
									strokeWidth={1.6}
									className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/30 transition-colors duration-200 group-focus-within/search:text-foreground/65"
								/>
								<Input
									ref={searchInputRef}
									aria-label="Search icons"
									className="h-10 rounded-[3px] border-foreground/14 bg-transparent pr-24 pl-10 text-[13px] tracking-tight placeholder:text-foreground/30 hover:border-foreground/22 focus-visible:border-foreground/28 focus-visible:bg-transparent"
									placeholder="Search icons, collections, styles…"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Escape") {
											if (search) setSearch("");
											else (e.target as HTMLInputElement).blur();
										}
									}}
								/>
								<div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
									{search ? (
										<button
											type="button"
											aria-label="Clear search"
											onClick={() => {
												setSearch("");
												searchInputRef.current?.focus();
											}}
											className="grid size-6 place-items-center rounded-md text-foreground/30 transition-colors hover:text-foreground/70"
										>
											<X className="size-3.5" />
										</button>
									) : null}
									<button
										type="button"
										aria-label="Open command palette"
										onClick={() => {
											setCommandOpen(true);
											setCommandQuery(search);
										}}
										className="flex items-center gap-0.5"
									>
										<kbd className="grid size-5 place-items-center rounded-[5px] border border-foreground/[0.1] bg-transparent font-sans text-[10px] leading-none text-foreground/40">
											⌘
										</kbd>
										<kbd className="grid size-5 place-items-center rounded-[5px] border border-foreground/[0.1] bg-transparent font-sans text-[10px] leading-none text-foreground/40">
											K
										</kbd>
									</button>
								</div>
							</label>
						</div>

						<div className="-mx-4 flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 sm:-mx-6 sm:px-6">
							<UnderlineTabs
								ariaLabel="Icon style"
								value={styleGroup}
								onChange={selectStyleGroup}
								items={STYLE_TABS}
								className="-mb-px"
							/>

							<UnderlineTabs
								ariaLabel="Grid density"
								value={density}
								onChange={setDensity}
								className="-mb-px"
								items={DENSITY_TABS}
							/>
						</div>
						{morphMode ? (
							<div className="-mx-4 flex items-center justify-between gap-3 border-b border-foreground/[0.06] bg-foreground/[0.03] px-4 py-2 text-[12px] text-foreground/55 sm:-mx-6 sm:px-6">
								<span>
									Morph playground · click icons to add them
									<span className="text-foreground/30">
										{" "}
										· {morphIcons.length}/{MAX_MORPH_SEQUENCE}
									</span>
								</span>
								<button
									type="button"
									onClick={disableMorph}
									className="text-[11px] text-foreground/40 transition-colors hover:text-foreground/70"
								>
									Exit
								</button>
							</div>
						) : null}
					</div>

					<div className="px-2 pb-8 sm:px-4 md:px-5">
						{showLoading ? (
							<div className="flex items-center gap-2 px-2 py-8 text-sm text-foreground/40">
								<Loader size="sm" />
								<span>Loading icons…</span>
							</div>
						) : catalogQuery.isError ? (
							<div className="px-2 py-8 text-sm text-destructive">
								Failed to load icons. Run{" "}
								<code className="text-foreground/70">bun run generate-icons</code>{" "}
								and restart.
							</div>
						) : showEmptyWorkspace ? (
							<EmptyWorkspace
								kind={collection === "favorites" ? "favorites" : "recent"}
								hasQuery={search.trim().length > 0}
							/>
						) : showEmptySearch ? (
							<EmptyStyleState
								styleGroup={styleGroup}
								hasQuery={search.trim().length > 0}
							/>
						) : (
							<VirtualIconGrid
								ref={gridRef}
								count={totalShown}
								getIcon={getIcon}
								ensureRange={ensureRange}
								selectedKeys={
									morphMode
										? new Set(morphIcons.map((icon) => iconKey(icon)))
										: selectedKeys
								}
								favoriteKeys={favoriteKeys}
								morphActiveKey={morphMode ? morphActiveKey : null}
								morphMode={morphMode}
								density={density}
								scrollParentRef={iconsScrollRef}
								onGridClick={handleGridClick}
								onFavorite={handleFavorite}
								onCopy={quickCopy}
								onDownload={quickDownload}
								onCustomize={morphMode ? addMorphIcon : focusIcon}
							/>
						)}
					</div>
				</main>

				<IconInspector
					width={inspectorWidth}
					onWidthChange={handleInspectorWidthChange}
					focusedIcon={focusedIcon}
					selectedIcons={selectedIcons}
					selectedCount={selectedKeys.size}
					setLabel={sets.find((s) => s.id === focusedIcon?.setId)?.label}
					groupLabel={
						focusedIcon
							? focusedIcon.group === "solid"
								? "Filled"
								: "Line"
							: null
					}
					favorited={
						focusedIcon ? favoriteKeys.has(iconKey(focusedIcon)) : false
					}
					onToggleFavorite={() => {
						if (focusedIcon) handleFavorite(focusedIcon);
					}}
					onClose={clearSelection}
					onSelectSet={openFocusedSet}
					customizeRef={inspectorActionsRef}
					morphMode={morphMode}
					morphIcons={morphIcons}
					morphActiveKey={morphActiveKey}
					onEnableMorph={() => void enableMorph()}
					onDisableMorph={disableMorph}
					onMorphSelect={selectMorphIcon}
					onMorphRemove={removeMorphIcon}
					onMorphReorder={reorderMorphIcons}
				/>
					</>
				)}
			</div>

			<WelcomeDialog onConnectMcp={() => setMcpDialogOpen(true)} />
			<McpDialog open={mcpDialogOpen} onOpenChange={setMcpDialogOpen} />
			<CommandPalette
				open={commandOpen}
				onOpenChange={setCommandOpen}
				commands={commands}
				searchValue={commandQuery}
				onSearchChange={setCommandQuery}
			/>
		</div>
	);
}

function SidebarRow({
	label,
	subtitle,
	count,
	active,
	onClick,
}: {
	label: string;
	subtitle?: string;
	count: number;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full min-w-0 items-center justify-between gap-3 px-5 py-2 text-left outline-none transition-colors duration-150",
				"focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-foreground/20",
				active
					? "bg-foreground/[0.07] text-foreground"
					: "text-foreground/55 hover:bg-foreground/[0.035] hover:text-foreground/85",
			)}
			title={subtitle ? `${label} — ${subtitle}` : label}
		>
			<div className="min-w-0 flex-1 overflow-hidden">
				<div
					className={cn(
						"truncate text-[12px] leading-4",
						active
							? "font-semibold text-foreground"
							: "font-medium text-muted-foreground",
					)}
				>
					{label}
				</div>
				{subtitle ? (
					<div
						className={cn(
							"truncate text-[11px] leading-4",
							active ? "text-foreground/80" : "text-muted-foreground",
						)}
					>
						{subtitle}
					</div>
				) : null}
			</div>
			<span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] leading-4 tabular-nums text-secondary-foreground">
				{count.toLocaleString()}
			</span>
		</button>
	);
}

function SearchListIcon({
	className,
	...props
}: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			className={className}
			{...props}
		>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1"
				d="M14 5h6m-6 3h3m4 3.5c0 5.25-4.25 9.5-9.5 9.5S2 16.75 2 11.5S6.25 2 11.5 2M22 22l-2-2"
			/>
		</svg>
	);
}

function EmptyStyleState({
	styleGroup,
	hasQuery,
}: {
	styleGroup: IconStyleFilter;
	hasQuery: boolean;
}) {
	const copy = hasQuery
		? {
				title: "No icons found",
				description: "Try a different name, library, or style.",
			}
		: styleGroup === "animated"
			? {
					title: "No animated icons",
					description:
						"Animated icons live in Material Line Icons, SVG Spinners, and Meteocons. Open All Icons to see them all.",
				}
			: styleGroup === "solid"
				? {
						title: "No filled icons",
						description:
							"This collection has no filled icons. Switch to Line or All, or pick another library.",
					}
				: styleGroup === "line"
					? {
							title: "No line icons",
							description:
								"This collection has no line icons. Switch to Filled or All, or pick another library.",
						}
					: {
							title: "No icons",
							description: "This collection is empty.",
						};

	return (
		<div className="grid h-[50vh] place-items-center">
			<div className="max-w-sm px-6 text-center">
				<SearchListIcon
					aria-hidden
					className="mx-auto mb-3 size-8 text-foreground/30"
				/>
				<div className="text-base font-medium text-foreground">{copy.title}</div>
				<div className="mt-2 text-sm text-foreground/40">{copy.description}</div>
			</div>
		</div>
	);
}

function EmptyWorkspace({
	kind,
	hasQuery,
}: {
	kind: "favorites" | "recent";
	hasQuery: boolean;
}) {
	return (
		<div className="grid h-[50vh] place-items-center">
			<div className="max-w-sm px-6 text-center">
				<SearchListIcon
					aria-hidden
					className="mx-auto mb-3 size-8 text-foreground/30"
				/>
				<div className="text-base font-medium text-foreground">
					{hasQuery
						? "No matching icons"
						: kind === "favorites"
							? "No favorites yet"
							: "No recent icons"}
				</div>
				<p className="mt-2 text-sm leading-6 text-foreground/40">
					{hasQuery
						? "Try a different search."
						: kind === "favorites"
							? "Hover an icon and tap the heart, or press F while selected."
							: "Icons you copy, download, or select will appear here."}
				</p>
			</div>
		</div>
	);
}
