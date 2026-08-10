"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Copy, Download, Heart, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildIconSvgUrl } from "@/lib/icon-export";
import { iconKey, type WorkspaceIcon } from "@/lib/icon-workspace";

export type Density = "compact" | "comfortable" | "spacious";

const GRID_ICON_SIZE = 24;
const GAP_PX = 4;

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
	onFavorite: (icon: WorkspaceIcon) => void;
	onCopy: (icon: WorkspaceIcon) => void;
	onDownload: (icon: WorkspaceIcon) => void;
	onCustomize: (icon: WorkspaceIcon) => void;
}) {
	const src = buildIconSvgUrl(icon, {
		size: GRID_ICON_SIZE,
		stroke: 1,
		color: "#ffffff",
	});

	return (
		<div
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
				"group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[2px] p-2 text-left outline-none transition-[background-color,box-shadow,transform] duration-150 [contain:content] [content-visibility:auto] [contain-intrinsic-size:80px]",
				"hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-white/25",
				active && "bg-white/[0.06] ring-1 ring-inset ring-[#2D2D2D]",
			)}
		>
			<img
				alt=""
				loading="lazy"
				decoding="async"
				className={cn(
					"transition-transform duration-150 ease-out will-change-transform group-hover:scale-110",
					active && "scale-110",
				)}
				style={{ width: GRID_ICON_SIZE, height: GRID_ICON_SIZE }}
				src={src}
			/>

			<span
				className={cn(
					"mt-2 max-w-full truncate px-1 text-[10px] leading-none text-white/0 transition-colors duration-150 group-hover:text-white/45",
					active && "text-white/45",
				)}
			>
				{icon.name}
			</span>

			<div
				aria-hidden={!active}
				className={cn(
					"pointer-events-none absolute inset-x-1 bottom-1 flex items-center justify-center gap-0.5 rounded-[2px] bg-[#141414]/95 px-1 py-1 opacity-0 shadow-lg ring-1 ring-white/[0.06] transition-opacity duration-150 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100",
					active && "pointer-events-auto opacity-100",
				)}
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
			>
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
		icons: WorkspaceIcon[];
		selectedKeys: Set<string>;
		favoriteKeys: Set<string>;
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
		icons,
		selectedKeys,
		favoriteKeys,
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

	const rowCount = Math.ceil(icons.length / columnCount) || 0;
	const rowHeight =
		width > 0
			? (width - GAP_PX * (columnCount - 1)) / columnCount + GAP_PX
			: 96;

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => scrollParentRef.current,
		estimateSize: () => rowHeight,
		overscan: 6,
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

	return (
		<div
			className="relative w-full [contain:layout_paint]"
			style={{ height: Math.max(rowCount * rowHeight, 0) }}
			onClick={onGridClick}
		>
			{virtualRows.map((row) => {
				const start = row.index * columnCount;
				const rowIcons = icons.slice(start, start + columnCount);
				return (
					<div
						key={row.key}
						className="absolute top-0 left-0 grid w-full"
						style={{
							height: rowHeight,
							transform: `translateY(${row.index * rowHeight}px)`,
							gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
							gap: GAP_PX,
						}}
					>
						{rowIcons.map((icon, col) => {
							const index = start + col;
							const key = iconKey(icon);
							return (
								<IconGridCell
									key={key}
									icon={icon}
									index={index}
									keyId={key}
									active={selectedKeys.has(key)}
									favorited={favoriteKeys.has(key)}
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
	);
});
