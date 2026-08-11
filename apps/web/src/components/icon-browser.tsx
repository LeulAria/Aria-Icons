"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	ICON_SETS,
	type IconSetConfig,
	type IconStyleGroup,
} from "@/lib/icon-sets";
import {
	SIDEBAR_PINNED_ICONIFY_SET,
	sidebarCuratedRank,
} from "@/lib/icon-set-order";
import { GitPullRequestArrow, Search } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { McpDialog } from "@/components/mcp-dialog";
import { IconInspector } from "@/components/icon-inspector";
import {
	CommandPalette,
	type CommandItem,
} from "@/components/command-palette";
import {
	VirtualIconGrid,
	type Density,
	type VirtualIconGridHandle,
} from "@/components/virtual-icon-grid";
import {
	countForStyleGroup,
	loadIconCatalog,
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
import {
	fetchIconSvg,
	formatIconExport,
	type IconExportCustomize,
} from "@/lib/icon-export";
import { toast } from "sonner";

type CollectionId = "all" | "favorites" | "recent" | string;
type UiStyleGroup = IconStyleGroup | "both";

const DEFAULT_CUSTOMIZE: IconExportCustomize = {
	size: 24,
	stroke: 1,
	color: "#ffffff",
};

const STYLE_TABS: { id: UiStyleGroup; label: string }[] = [
	{ id: "line", label: "Line" },
	{ id: "solid", label: "Fill" },
	{ id: "both", label: "Both" },
];

function UnderlineTabs<T extends string>({
	value,
	onChange,
	items,
	ariaLabel,
	className,
}: {
	value: T;
	onChange: (value: T) => void;
	items: { id: T; label: string; ariaLabel?: string }[];
	ariaLabel: string;
	className?: string;
}) {
	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			className={cn("flex", className)}
		>
			{items.map((tab) => {
				const selected = value === tab.id;
				return (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={selected}
						aria-label={tab.ariaLabel}
						onClick={() => onChange(tab.id)}
						className={cn(
							"h-9 px-3 text-[13px] font-medium transition-colors",
							selected
								? "border-b-2 border-white text-white"
								: "border-b-2 border-transparent text-white/45 hover:text-white/80",
						)}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
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
	const [styleGroup, setStyleGroup] = React.useState<UiStyleGroup>("both");
	const [search, setSearch] = React.useState("");
	const [collection, setCollection] = React.useState<CollectionId>("all");
	const [selectedStyleId, setSelectedStyleId] = React.useState<string>("both");
	const [focusedIcon, setFocusedIcon] = React.useState<CatalogIcon | null>(null);
	const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
		() => new Set(),
	);
	const [mcpDialogOpen, setMcpDialogOpen] = React.useState(false);
	const [commandOpen, setCommandOpen] = React.useState(false);
	const [commandQuery, setCommandQuery] = React.useState("");
	const [density, setDensity] = React.useState<Density>("compact");
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

	const catalogQuery = useQuery({
		queryKey: ["icon-catalog"],
		queryFn: loadIconCatalog,
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
		if (styleGroup === "both") {
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
		}),
		[collection, styleGroup, selectedStyleId, favoriteKeys, recentKeys],
	);

	const {
		results: allIcons,
		total: totalShown,
		ready: searchReady,
		isStale,
	} = useIconSearch(catalogQuery.data?.icons, search, searchFilters);

	const counts = catalogQuery.data?.counts;

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
			.filter((s) => !counts || s.countForGroup > 0);
	}, [sets, styleGroup, counts]);

	const sidebarCurated = React.useMemo(
		() =>
			setForSidebar
				.filter(
					(s) =>
						curatedSetIds.has(s.id) ||
						s.id === "thesvg" ||
						SIDEBAR_PINNED_ICONIFY_SET.has(s.id),
				)
				.sort((a, b) => sidebarCuratedRank(a.id) - sidebarCuratedRank(b.id)),
		[setForSidebar, curatedSetIds],
	);

	const sidebarIconify = React.useMemo(
		() =>
			setForSidebar.filter(
				(s) =>
					!curatedSetIds.has(s.id) &&
					s.id !== "thesvg" &&
					!SIDEBAR_PINNED_ICONIFY_SET.has(s.id),
			),
		[setForSidebar, curatedSetIds],
	);

	const selectLibrary = React.useCallback(
		(set: IconSetConfig & { countForGroup?: number }) => {
			setCollection(set.id);
			setSearch("");
			if (styleGroup === "both") {
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
		},
		[styleGroup],
	);

	const openFocusedSet = React.useCallback(
		(setId: string) => {
			const set = sets.find((s) => s.id === setId);
			if (!set) return;
			selectLibrary(set);
		},
		[sets, selectLibrary],
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
		const byKey = new Map(allIcons.map((icon) => [iconKey(icon), icon]));
		const out: CatalogIcon[] = [];
		for (const key of selectedKeys) {
			const icon = byKey.get(key);
			if (icon) out.push(icon);
		}
		return out;
	}, [allIcons, selectedKeys]);

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
		: `${totalShown.toLocaleString()} icons`;

	const selectCollection = (id: CollectionId) => {
		setCollection(id);
		setFocusedIcon(null);
		setSelectedKeys(new Set());
		lastSelectedIndexRef.current = null;
		if (id === "all") setSelectedStyleId(styleGroup);
	};

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
			const svg = await fetchIconSvg(icon, DEFAULT_CUSTOMIZE);
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
	}, []);

	const quickDownload = React.useCallback(async (icon: WorkspaceIcon) => {
		try {
			const svg = await fetchIconSvg(icon, DEFAULT_CUSTOMIZE);
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
	}, []);

	const focusIcon = React.useCallback((icon: CatalogIcon | WorkspaceIcon) => {
		setFocusedIcon(icon as CatalogIcon);
		setSelectedKeys(new Set([iconKey(icon)]));
		markRecent(icon);
	}, []);

	const clearSelection = React.useCallback(() => {
		setFocusedIcon(null);
		setSelectedKeys(new Set());
		lastSelectedIndexRef.current = null;
	}, []);

	const handleGridClick = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const cell = (e.target as HTMLElement).closest<HTMLElement>(
				"[data-icon-key]",
			);
			if (!cell) return;

			const key = cell.dataset.iconKey;
			const idx = Number(cell.dataset.iconIndex);
			const icon = allIcons[idx];
			if (!key || !icon) return;

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
						const it = allIcons[j];
						if (!it) continue;
						next.add(iconKey(it));
					}
					return next;
				}

				return new Set([key]);
			});
			lastSelectedIndexRef.current = idx;
		},
		[allIcons],
	);

	const moveFocus = React.useCallback(
		(delta: number) => {
			if (allIcons.length === 0) return;
			const currentIdx = focusedIcon
				? allIcons.findIndex((icon) => iconKey(icon) === iconKey(focusedIcon))
				: -1;
			const nextIdx = Math.min(
				Math.max((currentIdx < 0 ? 0 : currentIdx) + delta, 0),
				allIcons.length - 1,
			);
			const next = allIcons[nextIdx];
			if (!next) return;
			focusIcon(next);
			lastSelectedIndexRef.current = nextIdx;
			gridRef.current?.scrollToIndex(nextIdx);
		},
		[allIcons, focusIcon, focusedIcon],
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

			if (e.key === "Escape") {
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
		focusedIcon,
		handleFavorite,
		moveFocus,
		quickCopy,
		quickDownload,
		search,
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
				label: "Show Fill icons",
				group: "Filters",
				onSelect: () => setStyleGroup("solid"),
			},
			{
				id: "style-both",
				label: "Show Line & Fill",
				group: "Filters",
				onSelect: () => setStyleGroup("both"),
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
	]);

	const showLoading =
		catalogQuery.isLoading || (!searchReady && !catalogQuery.isError);
	const showEmptyWorkspace =
		isWorkspaceCollection && allIcons.length === 0 && !showLoading;
	const showEmptySearch =
		!isWorkspaceCollection &&
		!showLoading &&
		allIcons.length === 0 &&
		search.trim().length > 0;

	return (
		<div
			className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black"
			style={{ height: "100vh", minHeight: "100vh" }}
		>
			<div className="grid h-full min-h-0 flex-1 grid-rows-1 overflow-hidden lg:grid-cols-[15.5rem_minmax(0,1fr)_22rem]">
				<aside className="hidden h-full min-h-0 min-w-0 overflow-hidden border-r border-[#2D2D2D] bg-[#0d0d0d] lg:block">
					<div className="flex h-full min-h-0 min-w-0 flex-col">
						<div className="min-w-0 px-5 pb-4 pt-5">
							<div className="truncate text-[15px] font-semibold tracking-tight text-white">
								Aria Icons
							</div>
							<div className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/40">
								Search, customize, and export SVG icons from curated libraries.
							</div>
							<div className="mt-2 flex flex-row flex-wrap items-center gap-1">
								<Button
									variant="ghost"
									size="sm"
									asChild
									className="h-auto px-2 py-2 text-xs text-muted-foreground hover:text-white"
								>
									<Link href="/changelog">
										<img
											src="/changelog.svg"
											alt=""
											width={14}
											height={14}
											className="mr-1.5"
										/>
										View Changelogs
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setMcpDialogOpen(true)}
									className="h-auto px-2 py-2 text-xs text-muted-foreground hover:text-white"
								>
									<img
										src="/mcp.svg"
										alt=""
										width={14}
										height={14}
										className="mr-1.5"
									/>
									Add MCP Server
								</Button>
								<Button
									variant="ghost"
									size="sm"
									asChild
									className="h-auto px-2 py-2 text-xs text-muted-foreground hover:text-white"
								>
									<Link href="/contribute">
										<GitPullRequestArrow className="mr-1.5 size-3.5" />
										Contribute Icons
									</Link>
								</Button>
							</div>
						</div>

						<div className="min-h-0 min-w-0 flex-1 overflow-auto pb-6">
							<div className="px-5 pb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-white/30">
								Collections
							</div>
							<nav className="grid min-w-0">
								<SidebarRow
									label="All Icons"
									subtitle={`${allCountForGroup.toLocaleString()} icons`}
									count={allCountForGroup}
									active={collection === "all"}
									onClick={() => selectCollection("all")}
								/>
								<SidebarRow
									label="Favorites"
									subtitle="Saved icons"
									count={favorites.length}
									active={collection === "favorites"}
									onClick={() => selectCollection("favorites")}
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
								<div className="mt-6 flex items-center gap-2 px-5 py-2 text-sm text-white/40">
									<Loader size="sm" />
									<span>Loading…</span>
								</div>
							) : catalogQuery.isError ? (
								<div className="mt-6 px-5 py-2 text-sm text-destructive">
									Failed to load libraries
								</div>
							) : (
								<>
									{sidebarCurated.length > 0 ? (
										<>
											<div className="mt-6 px-5 pb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-white/30">
												Curated
											</div>
											<nav className="grid min-w-0">
												{sidebarCurated.map((set) => (
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
										</>
									) : null}
									{sidebarIconify.length > 0 ? (
										<>
											<div className="mt-6 px-5 pb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-white/30">
												Iconify
											</div>
											<nav className="grid min-w-0">
												{sidebarIconify.map((set) => (
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
										</>
									) : null}
								</>
							)}
						</div>
					</div>
				</aside>

				<main
					ref={iconsScrollRef}
					className="relative flex h-full min-h-0 min-w-0 flex-col overflow-auto bg-black"
				>
					<div className="sticky top-0 z-10 bg-black/90 px-4 pt-4 backdrop-blur-md sm:px-6 sm:pt-5">
						<div className="flex flex-col gap-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
							<div className="min-w-0">
								<h1 className="truncate text-[22px] font-semibold tracking-tight text-white">
									{title}
								</h1>
								<p className="mt-0.5 text-[13px] text-white/40">
									{subtitle}
									{isStale ? "…" : ""}
								</p>
							</div>

							<div className="relative w-full max-w-xl lg:flex-1">
								<Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35" />
								<Input
									ref={searchInputRef}
									className="h-11 rounded-[3px] border-[#2D2D2D] bg-white/[0.04] pr-16 pl-10 text-[14px] placeholder:text-white/35 focus-visible:border-[#2D2D2D] focus-visible:bg-white/[0.055]"
									placeholder="Search icons, collections, styles…"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Escape") {
											(e.target as HTMLInputElement).blur();
										}
									}}
								/>
								<button
									type="button"
									onClick={() => {
										setCommandOpen(true);
										setCommandQuery(search);
									}}
									className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-[3px] border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/35 transition-colors hover:border-white/20 hover:text-white/60"
								>
									⌘K
								</button>
							</div>
						</div>

						<div className="-mx-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#2D2D2D] px-4 sm:-mx-6 sm:px-6">
							<UnderlineTabs
								ariaLabel="Icon style"
								value={styleGroup}
								onChange={setStyleGroup}
								items={STYLE_TABS}
							/>

							<UnderlineTabs
								ariaLabel="Grid density"
								value={density}
								onChange={setDensity}
								items={[
									{ id: "compact" as const, label: "S", ariaLabel: "compact density" },
									{
										id: "comfortable" as const,
										label: "M",
										ariaLabel: "comfortable density",
									},
									{ id: "spacious" as const, label: "L", ariaLabel: "spacious density" },
								]}
							/>
						</div>
					</div>

					<div className="px-2 pb-8 sm:px-4 md:px-5">
						{showLoading ? (
							<div className="flex items-center gap-2 px-2 py-8 text-sm text-white/40">
								<Loader size="sm" />
								<span>Loading icons…</span>
							</div>
						) : catalogQuery.isError ? (
							<div className="px-2 py-8 text-sm text-destructive">
								Failed to load icons. Run{" "}
								<code className="text-white/70">bun run generate-icons</code>{" "}
								and restart.
							</div>
						) : showEmptyWorkspace ? (
							<EmptyWorkspace
								kind={collection === "favorites" ? "favorites" : "recent"}
								hasQuery={search.trim().length > 0}
							/>
						) : showEmptySearch ? (
							<div className="grid h-[50vh] place-items-center">
								<div className="max-w-sm px-6 text-center">
									<div className="text-base font-medium text-white">
										No icons found
									</div>
									<div className="mt-2 text-sm text-white/40">
										Try a different name, library, or style.
									</div>
								</div>
							</div>
						) : (
							<VirtualIconGrid
								ref={gridRef}
								icons={allIcons}
								selectedKeys={selectedKeys}
								favoriteKeys={favoriteKeys}
								density={density}
								scrollParentRef={iconsScrollRef}
								onGridClick={handleGridClick}
								onFavorite={handleFavorite}
								onCopy={quickCopy}
								onDownload={quickDownload}
								onCustomize={focusIcon}
							/>
						)}
					</div>
				</main>

				<IconInspector
					focusedIcon={focusedIcon}
					selectedIcons={selectedIcons}
					selectedCount={selectedKeys.size}
					setLabel={sets.find((s) => s.id === focusedIcon?.setId)?.label}
					groupLabel={
						focusedIcon
							? focusedIcon.group === "solid"
								? "Fill"
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
				/>
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
				"focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/20",
				active
					? "bg-white/[0.07] text-white"
					: "text-white/55 hover:bg-white/[0.035] hover:text-white/85",
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
				<div className="text-base font-medium text-white">
					{hasQuery
						? "No matching icons"
						: kind === "favorites"
							? "No favorites yet"
							: "No recent icons"}
				</div>
				<p className="mt-2 text-sm leading-6 text-white/40">
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
