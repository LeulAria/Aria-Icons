"use client";

import * as React from "react";
import {
	ChevronLeft,
	ChevronRight,
	Columns3,
	LayoutGrid,
	Lock,
	X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ensureSetsLoaded,
	expandCatalogIcon,
	searchCatalogIndices,
} from "@/lib/icon-catalog-runtime";
import type { CatalogIcon } from "@/lib/icon-catalog";
import { ICON_SETS, type IconSetConfig } from "@/lib/icon-sets";
import { SIDEBAR_PINNED_ICONIFY_SET } from "@/lib/icon-set-order";
import { isAnimatedSet } from "@/lib/animated-sets";
import { isNonLineVariant } from "@/lib/icon-search";
import { buildIconSvgUrl, themeIconColor } from "@/lib/icon-export";
import { loadQueuedIconSrc, peekCachedIconSrc } from "@/lib/icon-svg-queue";
import { cn } from "@/lib/utils";

const FAMILY_COUNT = 5;
const LINE_ICON_COUNT = 4;
const GRID_ICON_COUNT = 8;
const STRIP_GAP_PX = 12;
const STRIP_BUFFER = 5;

const CONCEPTS = [
	{ id: "home", label: "Home", aliases: ["home", "house"] },
	{
		id: "bag",
		label: "Bag",
		aliases: ["shopping-bag", "bag", "shopping-cart", "briefcase"],
	},
	{
		id: "card",
		label: "Card",
		aliases: ["credit-card", "creditcard", "card", "wallet"],
	},
	{ id: "user", label: "User", aliases: ["user", "person", "account"] },
	{
		id: "search",
		label: "Search",
		aliases: ["search", "magnifying-glass", "zoom"],
	},
	{
		id: "settings",
		label: "Settings",
		aliases: ["settings", "cog", "gear"],
	},
	{ id: "mail", label: "Mail", aliases: ["mail", "envelope", "email"] },
	{ id: "heart", label: "Heart", aliases: ["heart", "favorite", "love"] },
] as const;

const STARTER_IDS = [
	"lucide-icons",
	"feathers",
	"heroicons",
	"tabler-icons",
	"iconoir",
];

type FamilyCard = {
	set: IconSetConfig;
	icons: Array<{ concept: (typeof CONCEPTS)[number]; icon: CatalogIcon }>;
};

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

const POPULAR_ICONIFY = new Set([
	"ph",
	"mdi",
	"bi",
	"ri",
	"solar",
	"hugeicons",
	"material-symbols",
	"carbon",
	"clarity",
	"bx",
]);

export function isPlaygroundFamily(id: string) {
	if (id === "thesvg") return false;
	if (isAnimatedSet(id)) return false;
	if (ICON_SETS.some((set) => set.id === id)) return true;
	if (SIDEBAR_PINNED_ICONIFY_SET.has(id)) return true;
	return POPULAR_ICONIFY.has(id);
}

function stripCardStep(el: HTMLElement) {
	const first = el.firstElementChild as HTMLElement | null;
	if (!first) return Math.max(180, el.clientWidth / FAMILY_COUNT);
	return first.getBoundingClientRect().width + STRIP_GAP_PX;
}

function animateScrollX(
	el: HTMLElement,
	to: number,
	tokenRef: React.MutableRefObject<number>,
	duration = 560,
) {
	const from = el.scrollLeft;
	const max = Math.max(0, el.scrollWidth - el.clientWidth);
	const target = Math.max(0, Math.min(max, to));
	const delta = target - from;
	if (Math.abs(delta) < 0.5) return Promise.resolve(true);
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		el.scrollLeft = target;
		return Promise.resolve(true);
	}
	const id = ++tokenRef.current;
	const start = performance.now();
	const ease = (t: number) => 1 - (1 - t) ** 4;
	return new Promise<boolean>((resolve) => {
		const tick = (now: number) => {
			if (tokenRef.current !== id) {
				resolve(false);
				return;
			}
			const t = Math.min(1, (now - start) / duration);
			el.scrollLeft = from + delta * ease(t);
			if (t < 1) requestAnimationFrame(tick);
			else resolve(true);
		};
		requestAnimationFrame(tick);
	});
}

function shuffle<T>(items: T[]) {
	const next = items.slice();
	for (let i = next.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const a = next[i];
		const b = next[j];
		if (a === undefined || b === undefined) continue;
		next[i] = b;
		next[j] = a;
	}
	return next;
}

function pickSets(
	pool: IconSetConfig[],
	exclude: Set<string>,
	preferStarter: boolean,
	count = FAMILY_COUNT,
): IconSetConfig[] {
	if (pool.length === 0 || count <= 0) return [];
	if (preferStarter) {
		const starter = STARTER_IDS.map((id) =>
			pool.find((set) => set.id === id),
		).filter((set): set is IconSetConfig => Boolean(set));
		if (starter.length >= count) return starter.slice(0, count);
		const extra = pool.filter((set) => !starter.some((s) => s.id === set.id));
		return [...starter, ...shuffle(extra)].slice(0, count);
	}

	const fresh = pool.filter((set) => !exclude.has(set.id));
	const source = fresh.length >= count ? fresh : pool;
	return shuffle(source).slice(0, Math.min(count, source.length));
}

function findConceptIcon(
	setId: string,
	aliases: readonly string[],
): CatalogIcon | undefined {
	let fallback: CatalogIcon | undefined;
	for (const alias of aliases) {
		const indices = searchCatalogIndices(alias, {
			collection: setId,
			styleGroup: "both",
			selectedStyleId: "both",
		});
		for (const index of indices) {
			const icon = expandCatalogIcon(index);
			if (!icon || icon.setId !== setId) continue;
			const name = icon.name.toLowerCase();
			const exact = aliases.some(
				(item) =>
					name === item ||
					name === `${item}-outline` ||
					name === `${item}-line`,
			);
			const word =
				name === alias ||
				name.startsWith(`${alias}-`) ||
				name.startsWith(`${alias}_`);
			if (!exact && !word) continue;
			if (!isNonLineVariant(icon)) return icon;
			fallback ??= icon;
		}
	}
	return fallback;
}

function fallbackIcons(
	setId: string,
	needed: number,
	used: Set<string>,
): CatalogIcon[] {
	if (needed <= 0) return [];
	const line: CatalogIcon[] = [];
	const rest: CatalogIcon[] = [];
	const indices = searchCatalogIndices("", {
		collection: setId,
		styleGroup: "both",
		selectedStyleId: "both",
	});
	for (const index of indices) {
		const icon = expandCatalogIcon(index);
		if (!icon || icon.setId !== setId) continue;
		if (used.has(icon.filePath)) continue;
		if (isNonLineVariant(icon)) rest.push(icon);
		else line.push(icon);
		if (line.length + rest.length >= needed) break;
	}
	const out = [...line, ...rest].slice(0, needed);
	for (const icon of out) used.add(icon.filePath);
	return out;
}

async function resolveFamily(
	set: IconSetConfig,
	iconCount = LINE_ICON_COUNT,
): Promise<FamilyCard | null> {
	await ensureSetsLoaded([set.id]);
	const concepts = CONCEPTS.slice(0, iconCount);
	const matched: FamilyCard["icons"] = [];
	const used = new Set<string>();
	for (const concept of concepts) {
		const icon = findConceptIcon(set.id, concept.aliases);
		if (!icon || used.has(icon.filePath)) continue;
		used.add(icon.filePath);
		matched.push({ concept, icon });
	}
	const extras = fallbackIcons(set.id, iconCount, used);
	for (const concept of concepts) {
		if (matched.length >= iconCount) break;
		if (matched.some((item) => item.concept.id === concept.id)) continue;
		const icon = extras.shift();
		if (!icon) break;
		matched.push({ concept, icon });
	}
	while (matched.length < iconCount && extras.length > 0) {
		const icon = extras.shift();
		if (!icon) break;
		const concept = concepts[matched.length] ?? concepts[0];
		if (!concept) break;
		matched.push({ concept, icon });
	}
	if (matched.length === 0) return null;
	return { set, icons: matched.slice(0, iconCount) };
}

function PlaygroundGlyph({
	icon,
	color,
	size,
}: {
	icon: CatalogIcon;
	color: string;
	size: number;
}) {
	const url = buildIconSvgUrl(icon, { size, stroke: 1.4, color });
	const [src, setSrc] = React.useState(() => peekCachedIconSrc(url));

	React.useEffect(() => {
		let cancelled = false;
		const cached = peekCachedIconSrc(url);
		if (cached) {
			setSrc(cached);
			return;
		}
		setSrc(undefined);
		void loadQueuedIconSrc(url, 0).then((next) => {
			if (!cancelled) setSrc(next);
		});
		return () => {
			cancelled = true;
		};
	}, [url]);

	return (
		<div
			className="grid shrink-0 place-items-center"
			style={{ width: size, height: size, color }}
		>
			{src ? (
				<img
					alt=""
					src={src}
					width={size}
					height={size}
					draggable={false}
					className="size-full"
				/>
			) : (
				<span className="size-full rounded-md bg-current/10" />
			)}
		</div>
	);
}

function estimateGridViewportCount(box: HTMLElement | null, headerPx = 0) {
	const gap = 12;
	const minCol = 184;
	const row = 148 + gap;
	const pad = 20;
	const width = Math.max(280, (box?.clientWidth ?? 1100) - pad * 2);
	const height = Math.max(180, (box?.clientHeight ?? 700) - headerPx - pad * 2);
	const cols = Math.max(1, Math.floor((width + gap) / (minCol + gap)));
	const rows = Math.max(1, Math.floor((height + gap) / row));
	return cols * rows;
}

function FamilyGridSkeleton({ set }: { set: IconSetConfig }) {
	return (
		<div
			aria-busy="true"
			aria-label={`Loading ${set.label}`}
			className="flex min-h-[148px] flex-col overflow-hidden rounded-xl border border-foreground/[0.08]"
		>
			<div className="grid grid-cols-4 gap-3 px-4 py-5">
				{Array.from({ length: GRID_ICON_COUNT }, (_, i) => (
					<Skeleton
						key={i}
						className="size-[22px] rounded-md bg-foreground/[0.08]"
					/>
				))}
			</div>
			<div className="border-t border-foreground/[0.08] bg-background/40 px-4 py-3 backdrop-blur-md">
				<div className="truncate text-[15px] font-semibold tracking-tight text-foreground/35">
					{set.label}
				</div>
				<div className="mt-0.5 truncate text-[11px] text-foreground/25">
					{set.id}
				</div>
			</div>
		</div>
	);
}

function FamilyGridItem({
	set,
	card,
	eager,
	iconColor,
	scrollRoot,
	onSelect,
	requestLoad,
}: {
	set: IconSetConfig;
	card?: FamilyCard | null;
	eager: boolean;
	iconColor: string;
	scrollRoot: HTMLElement | null;
	onSelect: (set: IconSetConfig) => void;
	requestLoad: (setId: string) => void;
}) {
	const [inView, setInView] = React.useState(eager);
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (eager) setInView(true);
	}, [eager]);

	React.useEffect(() => {
		if (card !== undefined) return;
		if (eager) {
			requestLoad(set.id);
			return;
		}
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				setInView(true);
				requestLoad(set.id);
				io.disconnect();
			},
			{ root: scrollRoot, rootMargin: "280px 0px", threshold: 0 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [card, eager, requestLoad, scrollRoot, set.id]);

	if (card) {
		return (
			<div
				ref={ref}
				tabIndex={0}
				aria-label={`Use ${card.set.label}`}
				onClick={() => onSelect(card.set)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						onSelect(card.set);
					}
				}}
				className={cn(
					"group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-foreground/[0.08] bg-transparent text-left text-foreground outline-none",
					"transition-colors duration-150 hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.06]",
					"focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/25",
				)}
			>
				<div className="grid grid-cols-4 gap-3 px-4 py-5">
					{card.icons.map((item) => (
						<PlaygroundGlyph
							key={`${item.concept.id}-${item.icon.filePath}`}
							icon={item.icon}
							color={iconColor}
							size={22}
						/>
					))}
				</div>
				<div className="border-t border-foreground/[0.08] bg-background/40 px-4 py-3 backdrop-blur-md group-hover:bg-background/55">
					<div className="truncate text-[15px] font-semibold tracking-tight">
						{card.set.label}
					</div>
					<div className="mt-0.5 truncate text-[11px] text-foreground/40">
						{card.set.id}
					</div>
				</div>
			</div>
		);
	}

	if (card === null) {
		return (
			<div
				ref={ref}
				className="flex min-h-[148px] flex-col overflow-hidden rounded-xl border border-foreground/[0.08]"
			>
				<div className="grid flex-1 grid-cols-4 gap-3 px-4 py-5" />
				<div className="border-t border-foreground/[0.08] bg-background/40 px-4 py-3 backdrop-blur-md">
					<div className="truncate text-[15px] font-semibold tracking-tight text-foreground/35">
						{set.label}
					</div>
					<div className="mt-0.5 truncate text-[11px] text-foreground/25">
						{set.id}
					</div>
				</div>
			</div>
		);
	}

	if (!inView && !eager) {
		return (
			<div
				ref={ref}
				aria-hidden
				className="min-h-[148px] rounded-xl border border-foreground/[0.08]"
			/>
		);
	}

	return (
		<div ref={ref}>
			<FamilyGridSkeleton set={set} />
		</div>
	);
}

function GridBottomSentinel({
	scrollRoot,
	onReach,
}: {
	scrollRoot: HTMLElement | null;
	onReach: () => void;
}) {
	const ref = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				onReach();
			},
			{ root: scrollRoot, rootMargin: "640px 0px", threshold: 0 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [onReach, scrollRoot]);

	return <div ref={ref} aria-hidden className="col-span-full h-px w-full" />;
}

export function IconFamilyPlayground({
	sets,
	onSelectFamily,
	onExit,
}: {
	sets: IconSetConfig[];
	onSelectFamily: (set: IconSetConfig) => void;
	onExit: () => void;
}) {
	const { resolvedTheme } = useTheme();
	const iconColor = themeIconColor(resolvedTheme);
	const [cards, setCards] = React.useState<FamilyCard[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [lockedSlots, setLockedSlots] = React.useState<Record<number, boolean>>(
		{},
	);
	const [view, setView] = React.useState<"lines" | "grid">("grid");
	const [gridCardsById, setGridCardsById] = React.useState<
		Record<string, FamilyCard | null>
	>({});
	const [scrollRoot, setScrollRoot] = React.useState<HTMLElement | null>(null);
	const [viewportBudget, setViewportBudget] = React.useState(0);
	const [revealRest, setRevealRest] = React.useState(false);
	const busyRef = React.useRef(false);
	const pendingStripRef = React.useRef(0);
	const startedRef = React.useRef(false);
	const cardsRef = React.useRef<FamilyCard[]>([]);
	const poolRef = React.useRef<IconSetConfig[]>([]);
	const viewRef = React.useRef(view);
	const gridCardsByIdRef = React.useRef(gridCardsById);
	const setsRef = React.useRef(sets);
	const shellRef = React.useRef<HTMLDivElement>(null);
	const loadQueueRef = React.useRef<string[]>([]);
	const queuedRef = React.useRef(new Set<string>());
	const inFlightRef = React.useRef(new Set<string>());
	const pumpingRef = React.useRef(false);
	const revealRestRef = React.useRef(false);
	const aliveRef = React.useRef(true);
	const stripRef = React.useRef<HTMLDivElement>(null);
	const scrollAnimRef = React.useRef(0);
	const animatingRef = React.useRef(false);
	const wheelGateRef = React.useRef(false);
	const pendingStripDirRef = React.useRef<-1 | 1>(1);
	const pendingStripCountRef = React.useRef(0);
	const [canScrollLeft, setCanScrollLeft] = React.useState(false);

	const pool = React.useMemo(
		() => sets.filter((set) => isPlaygroundFamily(set.id)),
		[sets],
	);
	poolRef.current = pool;
	viewRef.current = view;
	gridCardsByIdRef.current = gridCardsById;
	setsRef.current = sets;

	React.useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;
		};
	}, []);

	const toggleLock = React.useCallback((index: number) => {
		setLockedSlots((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	}, []);

	const appendFamilies = React.useCallback(
		async (count: number, preferStarter = false) => {
			const currentPool = poolRef.current;
			if (currentPool.length === 0 || count <= 0) return;
			if (busyRef.current) {
				pendingStripRef.current += count;
				return;
			}
			const current = cardsRef.current;
			let exclude = new Set(current.map((card) => card.set.id));
			if (exclude.size >= Math.max(1, currentPool.length - 2)) {
				exclude = new Set(
					current.slice(-FAMILY_COUNT).map((card) => card.set.id),
				);
			}

			busyRef.current = true;
			if (current.length === 0) setLoading(true);
			try {
				const primary = pickSets(
					currentPool,
					exclude,
					preferStarter && current.length === 0,
					count,
				);
				await ensureSetsLoaded(primary.map((set) => set.id));
				const usable: FamilyCard[] = [];
				for (const set of primary) {
					if (exclude.has(set.id)) continue;
					const card = await resolveFamily(set, GRID_ICON_COUNT);
					if (card) {
						usable.push(card);
						exclude.add(card.set.id);
					}
					if (usable.length >= count) break;
				}
				if (usable.length < count) {
					const extras = shuffle(
						currentPool.filter((set) => !exclude.has(set.id)),
					);
					await ensureSetsLoaded(
						extras.slice(0, count - usable.length + 4).map((set) => set.id),
					);
					for (const set of extras) {
						if (usable.length >= count) break;
						const card = await resolveFamily(set, GRID_ICON_COUNT);
						if (!card || exclude.has(card.set.id)) continue;
						usable.push(card);
						exclude.add(card.set.id);
					}
				}
				if (usable.length === 0) return;
				const next = [...current, ...usable];
				cardsRef.current = next;
				setCards(next);
			} finally {
				busyRef.current = false;
				setLoading(false);
				const extra = pendingStripRef.current;
				if (extra > 0) {
					pendingStripRef.current = 0;
					void appendFamilies(Math.min(extra, STRIP_BUFFER * 2));
				}
			}
		},
		[],
	);

	const syncStripButtons = React.useCallback(() => {
		const el = stripRef.current;
		if (!el) return;
		setCanScrollLeft(el.scrollLeft > 4);
	}, []);

	const maybePrefetchStrip = React.useCallback(() => {
		const el = stripRef.current;
		if (!el) return;
		const step = stripCardStep(el);
		if (el.scrollLeft > el.scrollWidth - el.clientWidth - step * 3.5) {
			void appendFamilies(STRIP_BUFFER);
		}
	}, [appendFamilies]);

	const scrollStrip = React.useCallback(
		async (direction: -1 | 1) => {
			const el = stripRef.current;
			if (!el) return;
			if (animatingRef.current) {
				if (pendingStripDirRef.current === direction) {
					pendingStripCountRef.current += 1;
				} else {
					pendingStripDirRef.current = direction;
					pendingStripCountRef.current = 1;
				}
				return;
			}
			const step = stripCardStep(el);
			if (direction > 0) maybePrefetchStrip();
			const snapped = Math.round(el.scrollLeft / step) * step;
			const target = snapped + direction * step;
			if (Math.abs(target - el.scrollLeft) < 0.5) {
				maybePrefetchStrip();
				return;
			}
			animatingRef.current = true;
			const from = el.scrollLeft;
			const completed = await animateScrollX(el, target, scrollAnimRef);
			if (completed) animatingRef.current = false;
			syncStripButtons();
			maybePrefetchStrip();
			if (Math.abs(el.scrollLeft - from) < 0.5) return;
			if (pendingStripCountRef.current > 0 && !animatingRef.current) {
				pendingStripCountRef.current -= 1;
				void scrollStrip(pendingStripDirRef.current);
			}
		},
		[maybePrefetchStrip, syncStripButtons],
	);

	React.useEffect(() => {
		if (view !== "lines") return;
		const el = stripRef.current;
		if (!el) return;
		let snapTimer = 0;
		const onScroll = () => {
			syncStripButtons();
			maybePrefetchStrip();
			if (animatingRef.current) return;
			window.clearTimeout(snapTimer);
			snapTimer = window.setTimeout(() => {
				if (animatingRef.current || !stripRef.current) return;
				const node = stripRef.current;
				const step = stripCardStep(node);
				const target = Math.round(node.scrollLeft / step) * step;
				if (Math.abs(node.scrollLeft - target) < 1) return;
				animatingRef.current = true;
				void animateScrollX(node, target, scrollAnimRef, 320).then(
					(completed) => {
						if (completed) animatingRef.current = false;
						syncStripButtons();
						if (pendingStripCountRef.current > 0 && !animatingRef.current) {
							pendingStripCountRef.current -= 1;
							void scrollStrip(pendingStripDirRef.current);
						}
					},
				);
			}, 90);
		};
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			const raw =
				Math.abs(event.deltaX) > Math.abs(event.deltaY)
					? event.deltaX
					: event.deltaY;
			if (Math.abs(raw) < 4) return;
			const dir: -1 | 1 = raw > 0 ? 1 : -1;
			if (wheelGateRef.current || animatingRef.current) {
				if (pendingStripDirRef.current === dir) {
					pendingStripCountRef.current += 1;
				} else {
					pendingStripDirRef.current = dir;
					pendingStripCountRef.current = 1;
				}
				return;
			}
			wheelGateRef.current = true;
			void scrollStrip(dir).finally(() => {
				window.setTimeout(() => {
					wheelGateRef.current = false;
				}, 40);
			});
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		el.addEventListener("wheel", onWheel, { passive: false });
		syncStripButtons();
		maybePrefetchStrip();
		if (pendingStripCountRef.current > 0 && !animatingRef.current) {
			pendingStripCountRef.current -= 1;
			void scrollStrip(pendingStripDirRef.current);
		}
		return () => {
			window.clearTimeout(snapTimer);
			el.removeEventListener("scroll", onScroll);
			el.removeEventListener("wheel", onWheel);
		};
	}, [cards.length, maybePrefetchStrip, scrollStrip, syncStripButtons, view]);

	React.useEffect(() => {
		if (view !== "lines") return;
		if (startedRef.current || pool.length === 0) return;
		startedRef.current = true;
		void (async () => {
			await appendFamilies(FAMILY_COUNT, true);
			void appendFamilies(STRIP_BUFFER);
		})();
	}, [appendFamilies, pool.length, view]);

	const pumpGridQueue = React.useCallback(async () => {
		if (pumpingRef.current) return;
		pumpingRef.current = true;
		try {
			while (loadQueueRef.current.length > 0) {
				if (!aliveRef.current || viewRef.current !== "grid") break;
				const setId = loadQueueRef.current.shift();
				if (!setId) continue;
				if (gridCardsByIdRef.current[setId] !== undefined) continue;
				const set = setsRef.current.find((item) => item.id === setId);
				if (!set) continue;
				inFlightRef.current.add(setId);
				let card: FamilyCard | null = null;
				try {
					card = await resolveFamily(set, GRID_ICON_COUNT);
				} catch {
					card = null;
				} finally {
					inFlightRef.current.delete(setId);
				}
				if (!aliveRef.current) return;
				gridCardsByIdRef.current = {
					...gridCardsByIdRef.current,
					[setId]: card,
				};
				setGridCardsById((prev) => {
					if (prev[setId] !== undefined) return prev;
					return { ...prev, [setId]: card };
				});
			}
		} finally {
			pumpingRef.current = false;
			if (
				loadQueueRef.current.length > 0 &&
				viewRef.current === "grid" &&
				aliveRef.current
			) {
				void pumpGridQueue();
			}
		}
	}, []);

	const requestGridLoad = React.useCallback(
		(setId: string) => {
			if (gridCardsByIdRef.current[setId] !== undefined) return;
			if (queuedRef.current.has(setId) || inFlightRef.current.has(setId)) {
				return;
			}
			queuedRef.current.add(setId);
			loadQueueRef.current.push(setId);
			void pumpGridQueue();
		},
		[pumpGridQueue],
	);

	const requestRemaining = React.useCallback(() => {
		if (!revealRestRef.current) {
			revealRestRef.current = true;
			setRevealRest(true);
		}
		for (const set of setsRef.current) {
			requestGridLoad(set.id);
		}
	}, [requestGridLoad]);

	React.useEffect(() => {
		if (view === "grid") return;
		loadQueueRef.current = [];
		queuedRef.current = new Set(Object.keys(gridCardsByIdRef.current));
		revealRestRef.current = false;
		setRevealRest(false);
	}, [view]);

	React.useEffect(() => {
		if (view !== "grid" || !scrollRoot) return;
		const onScroll = () => {
			const remaining =
				scrollRoot.scrollHeight -
				scrollRoot.scrollTop -
				scrollRoot.clientHeight;
			if (remaining <= 640) requestRemaining();
		};
		onScroll();
		scrollRoot.addEventListener("scroll", onScroll, { passive: true });
		return () => scrollRoot.removeEventListener("scroll", onScroll);
	}, [requestRemaining, scrollRoot, view]);

	React.useLayoutEffect(() => {
		if (view !== "grid") return;
		const n = scrollRoot
			? estimateGridViewportCount(scrollRoot)
			: estimateGridViewportCount(shellRef.current, 48);
		if (n > 0 && n !== viewportBudget) setViewportBudget(n);
		const count = Math.max(n, viewportBudget);
		for (const set of setsRef.current.slice(0, count)) {
			requestGridLoad(set.id);
		}
	}, [requestGridLoad, scrollRoot, view, viewportBudget]);

	const openGrid = React.useCallback(() => {
		setViewportBudget(estimateGridViewportCount(shellRef.current, 48));
		setView("grid");
	}, []);

	React.useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isTypingTarget(e.target)) return;
			if (viewRef.current !== "lines") return;
			if (e.key === " " || e.code === "Space" || e.key === "ArrowRight") {
				e.preventDefault();
				void scrollStrip(1);
				return;
			}
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				void scrollStrip(-1);
			}
		};
		window.addEventListener("keydown", onKeyDown, true);
		return () => window.removeEventListener("keydown", onKeyDown, true);
	}, [scrollStrip]);

	return (
		<div
			ref={shellRef}
			className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-canvas"
		>
			<header className="relative z-10 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-foreground/[0.08] bg-background/55 px-4 backdrop-blur-xl sm:px-5">
				<p className="flex min-w-0 items-center text-[13px] text-foreground/45">
					{view === "grid" ? (
						<span className="truncate">Click a family to use it</span>
					) : (
						<>
							<span className="shrink-0">Press</span>
							<kbd className="mx-1 inline-flex shrink-0 items-center rounded-[5px] border border-foreground/12 bg-foreground/[0.04] px-1.5 py-0.5 font-sans text-[11px] leading-none text-foreground/70">
								space
							</kbd>
							<span className="min-w-0 truncate">to browse families</span>
						</>
					)}
				</p>
				<div className="flex shrink-0 items-center gap-1">
					<div className="mr-1 flex items-center rounded-full p-0.5">
						<button
							type="button"
							aria-label="Grid view"
							title="Grid"
							aria-pressed={view === "grid"}
							onClick={openGrid}
							className={cn(
								"grid size-7 place-items-center rounded-full transition-colors",
								view === "grid"
									? "bg-foreground/[0.08] text-foreground"
									: "text-foreground/45 hover:text-foreground",
							)}
						>
							<LayoutGrid className="size-3.5" />
						</button>
						<button
							type="button"
							aria-label="Lines view"
							title="Lines"
							aria-pressed={view === "lines"}
							onClick={() => setView("lines")}
							className={cn(
								"grid size-7 place-items-center rounded-full transition-colors",
								view === "lines"
									? "bg-foreground/[0.08] text-foreground"
									: "text-foreground/45 hover:text-foreground",
							)}
						>
							<Columns3 className="size-3.5" />
						</button>
					</div>
					<button
						type="button"
						aria-label="Exit generate"
						onClick={onExit}
						className="grid size-8 place-items-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
					>
						<X className="size-4" />
					</button>
				</div>
			</header>

			{view === "grid" ? (
				<div
					ref={setScrollRoot}
					className="min-h-0 flex-1 overflow-auto p-4 sm:p-5"
				>
					<div className="grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-3">
						{sets.map((set, index) => (
							<FamilyGridItem
								key={set.id}
								set={set}
								card={gridCardsById[set.id]}
								eager={revealRest || index < viewportBudget}
								iconColor={iconColor}
								scrollRoot={scrollRoot}
								onSelect={onSelectFamily}
								requestLoad={requestGridLoad}
							/>
						))}
						<GridBottomSentinel
							scrollRoot={scrollRoot}
							onReach={requestRemaining}
						/>
					</div>
				</div>
			) : cards.length === 0 ? (
				<div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-foreground/40">
					<Loader size="sm" />
					<span>Picking families…</span>
				</div>
			) : (
				<div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
					<div
						aria-hidden
						className={cn(
							"pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas via-canvas/70 to-transparent transition-opacity duration-300",
							canScrollLeft ? "opacity-100" : "opacity-0",
						)}
					/>
					<div
						aria-hidden
						className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas via-canvas/70 to-transparent"
					/>
					<button
						type="button"
						aria-label="Previous families"
						aria-hidden={!canScrollLeft}
						tabIndex={canScrollLeft ? 0 : -1}
						onClick={() => void scrollStrip(-1)}
						className={cn(
							"absolute top-1/2 left-3 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-foreground/10 bg-background/55 text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition-[opacity,transform,background-color] duration-300 hover:bg-background/80",
							canScrollLeft
								? "opacity-100"
								: "pointer-events-none opacity-0",
						)}
					>
						<ChevronLeft className="size-4" />
					</button>
					<button
						type="button"
						aria-label="Next families"
						onClick={() => void scrollStrip(1)}
						className="absolute top-1/2 right-3 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-foreground/10 bg-background/55 text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition-colors duration-200 hover:bg-background/80"
					>
						<ChevronRight className="size-4" />
					</button>
					<div
						ref={stripRef}
						className="family-playground-strip flex min-h-0 min-w-0 flex-1 gap-3 overflow-x-auto p-4 sm:p-5"
					>
					{cards.map((card, index) => {
						const locked = Boolean(lockedSlots[index]);
						const stopLockClick = (
							event: React.MouseEvent | React.PointerEvent,
						) => {
							event.stopPropagation();
						};
						return (
						<div
							key={`${index}-${card.set.id}`}
							tabIndex={0}
							aria-label={`Use ${card.set.label}`}
							onClick={(event) => {
								if (
									event.target instanceof Element &&
									event.target.closest("button")
								) {
									return;
								}
								onSelectFamily(card.set);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									onSelectFamily(card.set);
								}
								if (e.key === " " || e.code === "Space") {
									e.preventDefault();
								}
							}}
							style={{
								flex: `0 0 calc((100% - ${STRIP_GAP_PX * (FAMILY_COUNT - 1)}px) / ${FAMILY_COUNT})`,
								animationDelay:
									index < FAMILY_COUNT ? `${index * 40}ms` : "0ms",
							}}
							className={cn(
								"family-playground-card group relative flex min-h-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-foreground/[0.08] bg-transparent text-left text-foreground outline-none",
								"transition-colors duration-150 hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.06]",
								"focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/25",
							)}
						>
							<button
								type="button"
								aria-label={
									locked
										? `Unlock ${card.set.label}`
										: `Lock ${card.set.label}`
								}
								title={locked ? "Unlock" : "Lock"}
								aria-pressed={locked}
								onPointerDown={stopLockClick}
								onMouseDown={stopLockClick}
								onClick={(event) => {
									stopLockClick(event);
									toggleLock(index);
								}}
								className={cn(
									"absolute top-3 left-3 z-10 grid size-8 place-items-center rounded-full transition-colors",
									locked
										? "bg-foreground/[0.08] text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-foreground/[0.14]"
										: "text-foreground/0 group-hover:text-foreground/45 group-focus-visible:text-foreground/45 hover:bg-foreground/[0.08] hover:text-foreground",
								)}
							>
								<Lock className="size-3.5" />
							</button>
							<div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6">
								<div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:gap-x-10 sm:gap-y-12">
									{card.icons.slice(0, GRID_ICON_COUNT).map((item) => (
										<PlaygroundGlyph
											key={`${item.concept.id}-${item.icon.filePath}`}
											icon={item.icon}
											color={iconColor}
											size={36}
										/>
									))}
								</div>
							</div>

							<div className="border-t border-foreground/[0.08] bg-background/40 px-4 py-3 backdrop-blur-md group-hover:bg-background/55">
								<div className="truncate text-[16px] font-semibold tracking-tight sm:text-[17px]">
									{card.set.label}
								</div>
								<div className="mt-0.5 truncate text-[11px] text-foreground/40">
									{card.set.id}
								</div>
							</div>
						</div>
						);
					})}
					</div>
				</div>
			)}
		</div>
	);
}
