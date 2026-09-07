"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Copy, Download, Heart, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildIconSvgUrl } from "@/lib/icon-export";
import {
	FIRST_VIEWPORT_ICON_COUNT,
	loadQueuedIconSrc,
	peekCachedIconSrc,
	prefetchIconBatch,
} from "@/lib/icon-svg-queue";
import { iconKey, type WorkspaceIcon } from "@/lib/icon-workspace";

const ScrollRootContext = React.createContext<HTMLElement | null>(null);

export type Density = "compact" | "comfortable" | "spacious";

const GRID_ICON_SIZE: Record<Density, number> = {
	compact: 24,
	comfortable: 24,
	spacious: 32,
};
const GAP_PX = 4;

let lastKickKey = "";

function kickFirstViewportLoad(
	getIcon: (index: number) => WorkspaceIcon | undefined,
	count: number,
	customize: { size: number; stroke: number; color: string },
) {
	const first = getIcon(0);
	if (!first) return;
	const firstUrl = buildIconSvgUrl(first, customize);
	const key = `${firstUrl}:${count}:${customize.size}`;
	if (key === lastKickKey) return;
	lastKickKey = key;

	if (typeof document !== "undefined") {
		const existing = document.querySelector(
			`link[data-aria-icon-preload="${CSS.escape(firstUrl)}"]`,
		);
		if (!existing) {
			const link = document.createElement("link");
			link.rel = "preload";
			link.as = "image";
			link.href = firstUrl;
			link.setAttribute("fetchpriority", "high");
			link.dataset.ariaIconPreload = firstUrl;
			document.head.appendChild(link);
		}
	}

	const batch: WorkspaceIcon[] = [];
	for (let i = 1; i < Math.min(FIRST_VIEWPORT_ICON_COUNT, count); i++) {
		const icon = getIcon(i);
		if (icon) batch.push(icon);
	}
	if (batch.length > 0) void prefetchIconBatch(batch, customize);
}

/** Tailwind breakpoint column counts matching the previous CSS grid. */
export const DENSITY_COL_COUNTS: Record<
	Density,
	{ base: number; sm: number; md: number; lg: number; xl: number }
> = {
	compact: { base: 5, sm: 7, md: 9, lg: 11, xl: 12 },
	comfortable: { base: 4, sm: 5, md: 7, lg: 9, xl: 11 },
	spacious: { base: 3, sm: 4, md: 5, lg: 7, xl: 8 },
};

function columnsForWidth(density: Density, width: number) {
	const c = DENSITY_COL_COUNTS[density];
	if (width >= 1280) return c.xl;
	if (width >= 1024) return c.lg;
	if (width >= 768) return c.md;
	if (width >= 640) return c.sm;
	return c.base;
}

const IconGridCell = React.memo(function IconGridCell({
	icon,
	index,
	keyId,
	active,
	favorited,
	morphMode,
	morphIndex,
	iconSize,
	onFavorite,
	onCopy,
	onDownload,
	onCustomize,
}: {
	icon: WorkspaceIcon;
	index: number;
	keyId: string;
	active: boolean;
	favorited: boolean;
	morphMode?: boolean;
	morphIndex?: number;
	iconSize: number;
	onFavorite: (icon: WorkspaceIcon) => void;
	onCopy: (icon: WorkspaceIcon) => void;
	onDownload: (icon: WorkspaceIcon) => void;
	onCustomize: (icon: WorkspaceIcon) => void;
}) {
	const url = buildIconSvgUrl(icon, {
		size: iconSize,
		stroke: 1,
		color: "#ffffff",
	});
	const cellRef = React.useRef<HTMLDivElement | null>(null);
	const scrollRoot = React.useContext(ScrollRootContext);
	const [src, setSrc] = React.useState<string | undefined>(() => {
		return peekCachedIconSrc(url) ?? (index === 0 ? url : undefined);
	});
	const [ready, setReady] = React.useState(() => Boolean(peekCachedIconSrc(url)));

	React.useEffect(() => {
		const cached = peekCachedIconSrc(url);
		setSrc(cached ?? (index === 0 ? url : undefined));
		setReady(Boolean(cached));

		let cancelled = false;
		const apply = (next: string) => {
			if (cancelled) return;
			setSrc(next);
		};

		if (index === 0) {
			return () => {
				cancelled = true;
			};
		}

		if (index < FIRST_VIEWPORT_ICON_COUNT) {
			void loadQueuedIconSrc(url, index)
				.then(apply)
				.catch(() => {});
			return () => {
				cancelled = true;
			};
		}

		const node = cellRef.current;
		if (!node) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries[0]?.isIntersecting) return;
				io.disconnect();
				void loadQueuedIconSrc(url, 100 + index)
					.then(apply)
					.catch(() => {});
			},
			{ root: scrollRoot, rootMargin: "160px", threshold: 0.01 },
		);
		io.observe(node);
		return () => {
			cancelled = true;
			io.disconnect();
		};
	}, [url, scrollRoot, index]);

	return (
		<div
			ref={cellRef}
			role="button"
			tabIndex={0}
			aria-label={icon.name}
			aria-pressed={active}
			data-icon-key={keyId}
			data-icon-index={index}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.currentTarget.click();
				}
			}}
			className={cn(
				"group relative z-0 flex aspect-square cursor-pointer flex-col items-center overflow-visible px-1.5 pb-1.5 pt-2 text-left outline-none transition-[background-color,box-shadow,transform] duration-150",
				"hover:z-20 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-white/25",
				"focus-within:z-20",
				active && "z-20 bg-white/[0.06] ring-1 ring-inset ring-[#2D2D2D]",
				morphMode && morphIndex != null && "ring-1 ring-inset ring-white/20",
				morphMode && active && "bg-white/[0.08] ring-white/55",
			)}
		>
			{morphMode && morphIndex != null ? (
				<span className="absolute left-1 top-1 z-10 grid size-4 place-items-center rounded-[3px] bg-white text-[9px] font-semibold text-black">
					{morphIndex}
				</span>
			) : null}
			<div className="grid min-h-0 flex-1 place-items-center">
				{src ? (
					<img
						alt=""
						decoding={index === 0 ? "sync" : "async"}
						fetchPriority={index === 0 ? "high" : index < 12 ? "high" : "auto"}
						loading="eager"
						onLoad={() => setReady(true)}
						onError={() => setReady(true)}
						className={cn(
							"col-start-1 row-start-1 transition-transform duration-150 ease-out will-change-transform group-hover:scale-110",
							!ready && "invisible",
							active && "scale-110",
						)}
						style={{ width: iconSize, height: iconSize }}
						src={src}
					/>
				) : null}
				{!ready ? (
					<span
						aria-hidden
						className="col-start-1 row-start-1 rounded-[2px] bg-white/[0.06]"
						style={{ width: iconSize, height: iconSize }}
					/>
				) : null}
			</div>

			<span
				className={cn(
					"mt-1 w-full truncate px-0.5 text-center text-[10px] leading-tight text-white/55 transition-colors duration-150 group-hover:text-white/70",
					active && "text-white/70",
				)}
			>
				{icon.name}
			</span>

			<div
				aria-hidden={!active}
				className={cn(
					"pointer-events-none absolute left-1/2 top-full z-20 flex -translate-x-1/2 pt-1 opacity-0 transition-opacity duration-150 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100",
					active && "pointer-events-auto opacity-100",
				)}
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-center gap-0.5 rounded-[2px] bg-[#141414] px-1 py-1 shadow-lg ring-1 ring-white/[0.06]">
					<ActionIcon
						label="Copy SVG"
						interactive={active}
						onClick={() => onCopy(icon)}
						icon={<Copy className="size-3" />}
					/>
					<ActionIcon
						label="Download"
						interactive={active}
						onClick={() => onDownload(icon)}
						icon={<Download className="size-3" />}
					/>
					<ActionIcon
						label={favorited ? "Unfavorite" : "Favorite"}
						interactive={active}
						onClick={() => onFavorite(icon)}
						icon={
							<Heart
								className={cn("size-3", favorited && "fill-white text-white")}
							/>
						}
					/>
					<ActionIcon
						label="Customize"
						interactive={active}
						onClick={() => onCustomize(icon)}
						icon={<SlidersHorizontal className="size-3" />}
					/>
				</div>
			</div>
		</div>
	);
});

function ActionIcon({
	label,
	onClick,
	icon,
	interactive,
}: {
	label: string;
	onClick: () => void;
	icon: React.ReactNode;
	interactive?: boolean;
}) {
	return (
		<span
			role="button"
			tabIndex={interactive ? 0 : -1}
			aria-label={label}
			title={label}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
					onClick();
				}
			}}
			className="inline-flex size-6 cursor-pointer items-center justify-center rounded-[2px] text-white/55 transition-colors duration-100 hover:bg-white/[0.08] hover:text-white"
		>
			{icon}
		</span>
	);
}

export type VirtualIconGridHandle = {
	scrollToIndex: (index: number) => void;
	columnCount: number;
};

export const VirtualIconGrid = React.forwardRef<
	VirtualIconGridHandle,
	{
		count: number;
		getIcon: (index: number) => WorkspaceIcon | undefined;
		ensureRange?: (start: number, end: number) => void;
		selectedKeys: Set<string>;
		favoriteKeys: Set<string>;
		morphActiveKey?: string | null;
		morphMode?: boolean;
		density: Density;
		scrollParentRef: React.RefObject<HTMLDivElement | null>;
		onGridClick: (e: React.MouseEvent<HTMLDivElement>) => void;
		onFavorite: (icon: WorkspaceIcon) => void;
		onCopy: (icon: WorkspaceIcon) => void;
		onDownload: (icon: WorkspaceIcon) => void;
		onCustomize: (icon: WorkspaceIcon) => void;
	}
>(function VirtualIconGrid(
	{
		count,
		getIcon,
		ensureRange,
		selectedKeys,
		favoriteKeys,
		morphActiveKey = null,
		morphMode = false,
		density,
		scrollParentRef,
		onGridClick,
		onFavorite,
		onCopy,
		onDownload,
		onCustomize,
	},
	ref,
) {
	const [width, setWidth] = React.useState(0);

	React.useEffect(() => {
		const el = scrollParentRef.current;
		if (!el) return;

		const measure = () => {
			const style = getComputedStyle(el);
			const padX =
				(Number.parseFloat(style.paddingLeft) || 0) +
				(Number.parseFloat(style.paddingRight) || 0);
			setWidth(Math.max(0, el.clientWidth - padX));
		};

		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [scrollParentRef]);

	const columnCount = React.useMemo(
		() => columnsForWidth(density, width || 800),
		[density, width],
	);

	const rowCount = Math.ceil(count / columnCount) || 0;
	const rowHeight =
		width > 0
			? (width - GAP_PX * (columnCount - 1)) / columnCount + GAP_PX
			: 96;

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => scrollParentRef.current,
		estimateSize: () => rowHeight,
		overscan: 2,
	});

	React.useEffect(() => {
		virtualizer.measure();
	}, [rowHeight, columnCount, rowCount, virtualizer]);

	React.useImperativeHandle(
		ref,
		() => ({
			columnCount,
			scrollToIndex: (index: number) => {
				const row = Math.floor(index / columnCount);
				virtualizer.scrollToIndex(row, { align: "auto" });
			},
		}),
		[columnCount, virtualizer],
	);

	const virtualRows = virtualizer.getVirtualItems();
	const rangeStart = virtualRows[0] ? virtualRows[0].index * columnCount : 0;
	const lastRow = virtualRows[virtualRows.length - 1];
	const rangeEnd = lastRow ? (lastRow.index + 1) * columnCount : 0;

	React.useEffect(() => {
		ensureRange?.(rangeStart, rangeEnd);
	}, [ensureRange, rangeStart, rangeEnd]);

	const gridCustomize = React.useMemo(
		() => ({
			size: GRID_ICON_SIZE[density],
			stroke: 1,
			color: "#ffffff",
		}),
		[density],
	);

	// Start the first-icon preload + first-viewport batch during render so
	// cell effects can wait on the in-flight batch instead of 24 separate GETs.
	kickFirstViewportLoad(getIcon, count, gridCustomize);

	return (
		<ScrollRootContext.Provider value={scrollParentRef.current}>
			<div
				className="relative w-full overflow-visible [contain:layout]"
				style={{ height: Math.max(rowCount * rowHeight, 0) }}
				onClick={onGridClick}
			>
				{virtualRows.map((row) => {
					const start = row.index * columnCount;
					const cells = Array.from(
						{ length: Math.min(columnCount, count - start) },
						(_, col) => start + col,
					);
					const rowHasActive = cells.some((index) => {
						const icon = getIcon(index);
						if (!icon) return false;
						const key = iconKey(icon);
						return morphMode
							? morphActiveKey === key
							: selectedKeys.has(key);
					});
					return (
						<div
							key={row.key}
							className={cn(
								"absolute top-0 left-0 grid w-full overflow-visible hover:z-20 focus-within:z-20",
								rowHasActive && "z-20",
							)}
							style={{
								height: rowHeight,
								transform: `translateY(${row.index * rowHeight}px)`,
								gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
								gap: GAP_PX,
							}}
						>
							{cells.map((index) => {
								const icon = getIcon(index);
								if (!icon) {
									return (
										<div
											key={`pending-${index}`}
											className="flex aspect-square items-center justify-center rounded-[2px]"
										>
											<span
												aria-hidden
												className="rounded-[2px] bg-white/[0.06]"
												style={{
													width: GRID_ICON_SIZE[density],
													height: GRID_ICON_SIZE[density],
												}}
											/>
										</div>
									);
								}
								const key = iconKey(icon);
								const morphIndex = morphMode
									? [...selectedKeys].indexOf(key) + 1
									: 0;
								return (
									<IconGridCell
										key={key}
										icon={icon}
										index={index}
										keyId={key}
										active={
											morphMode
												? morphActiveKey === key
												: selectedKeys.has(key)
										}
										favorited={favoriteKeys.has(key)}
										morphMode={morphMode}
										morphIndex={morphIndex > 0 ? morphIndex : undefined}
										iconSize={GRID_ICON_SIZE[density]}
										onFavorite={onFavorite}
										onCopy={onCopy}
										onDownload={onDownload}
										onCustomize={onCustomize}
									/>
								);
							})}
						</div>
					);
				})}
			</div>
		</ScrollRootContext.Provider>
	);
});
