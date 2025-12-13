"use client";
import * as React from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { IconStyleGroup } from "@/lib/icon-sets";
import { Copy, Download, Search } from "lucide-react";

type AppliedCustomize = {
  size: number;
  stroke: number;
  color: string;
};

function useGridColumns() {
  const [cols, setCols] = React.useState(6);

  React.useEffect(() => {
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqMd = window.matchMedia("(min-width: 768px)");

    const compute = () => {
      if (mqLg.matches) return 10;
      if (mqMd.matches) return 8;
      return 6;
    };

    const update = () => setCols(compute());
    update();

    mqLg.addEventListener("change", update);
    mqMd.addEventListener("change", update);
    return () => {
      mqLg.removeEventListener("change", update);
      mqMd.removeEventListener("change", update);
    };
  }, []);

  return cols;
}

function CustomizeControls({
  value,
  onApplyPatch,
}: {
  value: AppliedCustomize;
  onApplyPatch: (patch: Partial<AppliedCustomize>) => void;
}) {
  const [uiSize, setUiSize] = React.useState(value.size);
  const [uiStroke, setUiStroke] = React.useState(value.stroke);
  const [uiColor, setUiColor] = React.useState(value.color);

  // Sync local UI when the applied value changes (e.g. Reset).
  React.useEffect(() => {
    setUiSize(value.size);
    setUiStroke(value.stroke);
    setUiColor(value.color);
  }, [value.size, value.stroke, value.color]);

  const pendingRef = React.useRef<Partial<AppliedCustomize>>({});
  const timerRef = React.useRef<number | null>(null);

  const scheduleApply = React.useCallback(
    (patch: Partial<AppliedCustomize>) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onApplyPatch(pendingRef.current);
        pendingRef.current = {};
      }, 180);
    },
    [onApplyPatch]
  );

  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 px-5 pt-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-foreground">
            Size
          </label>
          <span className="text-[11px] text-muted-foreground font-mono">
            {uiSize}px
          </span>
        </div>
        <Slider
          min={12}
          max={64}
          step={1}
          value={[uiSize]}
          onValueChange={(v) => setUiSize(v[0] ?? value.size)}
          onValueCommit={(v) => scheduleApply({ size: v[0] ?? value.size })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-foreground">
            Stroke Width
          </label>
          <span className="text-[11px] text-muted-foreground font-mono">
            {uiStroke}px
          </span>
        </div>
        <Slider
          min={0.5}
          max={4}
          step={0.5}
          value={[uiStroke]}
          onValueChange={(v) => setUiStroke(v[0] ?? value.stroke)}
          onValueCommit={(v) =>
            scheduleApply({ stroke: v[0] ?? value.stroke })
          }
        />
      </div>

      <div className="space-y-3">
        <label className="text-[12px] font-medium text-foreground block">
          Color
        </label>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <input
              aria-label="Color"
              type="color"
              value={uiColor}
              onChange={(e) => setUiColor(e.target.value)}
              onBlur={() => scheduleApply({ color: uiColor })}
              className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-background p-0.5 shadow-sm hover:border-foreground/20 transition-colors"
              style={{
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
              }}
            />
          </div>
          <Input
            value={uiColor}
            onChange={(e) => setUiColor(e.target.value)}
            onBlur={() => scheduleApply({ color: uiColor })}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                (e.currentTarget as HTMLInputElement).blur();
            }}
            className="h-10 flex-1 font-mono text-[12px]"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  type UiStyleGroup = IconStyleGroup | "both";
  const [styleGroup, setStyleGroup] = React.useState<UiStyleGroup>("line");
  const [search, setSearch] = React.useState("");
  const [selectedSetId, setSelectedSetId] = React.useState<string>("all");
  const [selectedStyleId, setSelectedStyleId] = React.useState<string>("line");
  const [focusedIcon, setFocusedIcon] = React.useState<{
    setId: string;
    styleId: string;
    filePath: string;
    name: string;
  } | null>(null);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    () => new Set()
  );
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const gridCols = useGridColumns();

  // Applied values used by the icon grid + SVG copy/download.
  // The Customise panel keeps its own local UI state and only commits changes on "stop" events.
  const [appliedSize, setAppliedSize] = React.useState(24);
  const [appliedStroke, setAppliedStroke] = React.useState(1);
  const [appliedColor, setAppliedColor] = React.useState("#000000");

  const applyCustomizePatch = React.useCallback(
    (patch: Partial<AppliedCustomize>) => {
      if (patch.size != null) setAppliedSize(patch.size);
      if (patch.stroke != null) setAppliedStroke(patch.stroke);
      if (patch.color != null) setAppliedColor(patch.color);
    },
    []
  );

  const setsQuery = useQuery({
    queryKey: ["iconSets"],
    queryFn: async () => {
      const res = await fetch("/api/icon-sets");
      if (!res.ok) throw new Error("Failed to load icon sets");
      return (await res.json()) as {
        sets: Array<{
          id: string;
          label: string;
          homepage: string | null;
          styles: Array<{
            id: string;
            label: string;
            group: IconStyleGroup;
            count: number;
          }>;
        }>;
      };
    },
  });

  // If user toggles line/fill/both, try to switch style within current set if possible.
  React.useEffect(() => {
    if (selectedSetId === "all") {
      setSelectedStyleId(styleGroup);
      return;
    }
    if (!setsQuery.data) return;
    const set = setsQuery.data.sets.find((s) => s.id === selectedSetId);
    if (!set) return;
    if (styleGroup === "both") {
      setSelectedStyleId("both");
      return;
    }
    const preferred = set.styles.find((s) => s.group === styleGroup);
    if (!preferred) return;
    if (preferred.id !== selectedStyleId) setSelectedStyleId(preferred.id);
  }, [styleGroup, setsQuery.data, selectedSetId, selectedStyleId]);

  const iconsQuery = useInfiniteQuery({
    enabled: !!selectedSetId && !!selectedStyleId,
    queryKey: ["icons", selectedSetId, selectedStyleId, search],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("setId", selectedSetId!);
      params.set("styleId", selectedStyleId!);
      if (search.trim()) params.set("q", search.trim());
      params.set("offset", String(pageParam ?? 0));
      params.set("limit", "240");
      const res = await fetch(`/api/icons?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load icons");
      return (await res.json()) as {
        total: number;
        items: Array<{
          setId: string;
          styleId: string;
          filePath: string;
          name: string;
        }>;
        nextOffset: number | null;
      };
    },
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });

  const allIcons = React.useMemo(
    () => iconsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [iconsQuery.data]
  );

  const setForSidebar = React.useMemo(() => {
    const sets = setsQuery.data?.sets ?? [];
    return sets.map((s) => {
      const countForGroup = s.styles
        .filter((st) => (styleGroup === "both" ? true : st.group === styleGroup))
        .reduce((acc, st) => acc + st.count, 0);
      return { ...s, countForGroup };
    });
  }, [setsQuery.data, styleGroup]);

  const allCountForGroup = React.useMemo(() => {
    const sets = setsQuery.data?.sets ?? [];
    return sets.reduce((acc, s) => {
      const c = s.styles
        .filter((st) => (styleGroup === "both" ? true : st.group === styleGroup))
        .reduce((a, st) => a + st.count, 0);
      return acc + c;
    }, 0);
  }, [setsQuery.data, styleGroup]);

  const selectedSet = React.useMemo(() => {
    if (selectedSetId === "all") return null;
    return (
      (setsQuery.data?.sets ?? []).find((s) => s.id === selectedSetId) ?? null
    );
  }, [setsQuery.data, selectedSetId]);

  const selectedStyle = React.useMemo(() => {
    return selectedSet?.styles.find((s) => s.id === selectedStyleId) ?? null;
  }, [selectedSet, selectedStyleId]);

  const selectedSvgQuery = useQuery({
    enabled: !!focusedIcon,
    queryKey: [
      "svg",
      focusedIcon?.setId,
      focusedIcon?.styleId,
      focusedIcon?.filePath,
      appliedSize,
      appliedStroke,
      appliedColor,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("setId", focusedIcon!.setId);
      params.set("styleId", focusedIcon!.styleId);
      params.set("filePath", focusedIcon!.filePath);
      params.set("size", String(appliedSize));
      params.set("strokeWidth", String(appliedStroke));
      params.set("color", appliedColor);
      const res = await fetch(`/api/icon-svg?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load SVG");
      return await res.text();
    },
  });

  const copySvg = async () => {
    if (!selectedSvgQuery.data || !focusedIcon) return;
    await navigator.clipboard.writeText(selectedSvgQuery.data);
    toast.success("Copied SVG", { description: focusedIcon.name });
  };

  const downloadSvg = () => {
    if (!selectedSvgQuery.data || !focusedIcon) return;
    const blob = new Blob([selectedSvgQuery.data], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${focusedIcon.name}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Downloaded SVG", { description: `${focusedIcon.name}.svg` });
  };

  // Infinite scroll (native) for icons list.
  const iconsScrollRef = React.useRef<HTMLDivElement | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const root = iconsScrollRef.current;
    const target = loadMoreRef.current;
    if (!root || !target) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!iconsQuery.hasNextPage) return;
        if (iconsQuery.isFetchingNextPage) return;
        iconsQuery.fetchNextPage();
      },
      { root, rootMargin: "600px 0px", threshold: 0 }
    );

    obs.observe(target);
    return () => obs.disconnect();
  }, [
    iconsQuery.hasNextPage,
    iconsQuery.isFetchingNextPage,
    iconsQuery.fetchNextPage,
  ]);

	return (
    <div className="h-full overflow-hidden bg-background">
      <div className="grid h-full grid-cols-[17rem_1fr_22rem] overflow-hidden">
        {/* Left sidebar */}
        <aside className="border-r bg-muted/10 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="p-5">
              <div className="text-base font-semibold tracking-tight">
                Aria Icons
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Browse and export icons from local collections.
              </div>
              <div
                className="mt-4 inline-flex rounded-full border bg-muted p-1"
                role="tablist"
                aria-label="Icon style"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={styleGroup === "line"}
                  onClick={() => setStyleGroup("line")}
                  className={[
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    styleGroup === "line"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  Line
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={styleGroup === "solid"}
                  onClick={() => setStyleGroup("solid")}
                  className={[
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    styleGroup === "solid"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  Fill
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={styleGroup === "both"}
                  onClick={() => setStyleGroup("both")}
                  className={[
                    "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                    styleGroup === "both"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  Both
                </button>
              </div>
            </div>
            <div className="border-y bg-muted/20 px-5 py-3 text-sm font-semibold">
              Collections
            </div>
            <div className="flex-1 min-h-0 overflow-auto px-3 py-4">
              {setsQuery.isLoading ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : setsQuery.isError ? (
                <div className="px-2 py-2 text-sm text-destructive">
                  Failed to load icon sets
                </div>
              ) : (
                <div className="grid min-w-0 gap-2">
                  <div className="px-2 text-xs font-medium text-muted-foreground">
                    All
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSetId("all");
                      setSelectedStyleId(styleGroup);
                      setFocusedIcon(null);
                      setSelectedKeys(new Set());
                      lastSelectedIndexRef.current = null;
                    }}
                    className={[
                      "flex w-full min-w-0 items-center justify-between gap-3 rounded-full px-4 py-1.5 text-left outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      selectedSetId === "all"
                        ? "bg-accent"
                        : "hover:bg-accent/60",
                    ].join(" ")}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium leading-4">
                        All Icons
                      </div>
                      <div className="truncate text-[11px] leading-4 text-muted-foreground">
                        {allCountForGroup.toLocaleString()} icons
                      </div>
                    </div>
                    <div className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] leading-4 text-secondary-foreground">
                      {allCountForGroup.toLocaleString()}
                    </div>
                  </button>
                  <div className="mt-2 px-2 text-xs font-medium text-muted-foreground">
                    Collections
                  </div>
                  {setForSidebar.map((set) => {
                    const active = set.id === selectedSetId;
                    return (
                      <button
                        key={set.id}
                        type="button"
                        onClick={() => {
                          setSelectedSetId(set.id);
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
                        }}
                        className={[
                          "flex w-full min-w-0 items-center justify-between gap-3 rounded-full px-4 py-1.5 text-left outline-none",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          active ? "bg-accent" : "hover:bg-accent/60",
                        ].join(" ")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-medium leading-4">
                            {set.label}
                          </div>
                          <div className="truncate text-[11px] leading-4 text-muted-foreground">
                            {set.homepage ? set.homepage : set.id}
                          </div>
                        </div>
                        <div className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] leading-4 text-secondary-foreground">
                          {set.countForGroup.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center: search + grid */}
        <main className="flex min-w-0 flex-col overflow-hidden">
          <div className="border-b bg-background px-6 py-4">
            <div className="flex items-start justify-between gap-8">
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-semibold tracking-tight">
                  {selectedSetId === "all"
                    ? "All Icons"
                    : selectedSet?.label ?? "Icons"}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground leading-4">
                  {selectedSetId === "all"
                    ? `${allCountForGroup.toLocaleString()} icons`
                    : selectedStyle
                    ? `${selectedStyle.count.toLocaleString()} icons` : ""}
                </div>
              </div>

              <div className="w-full max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 rounded-full pl-10"
                    placeholder="Search icons by name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground">
                  {allIcons.length.toLocaleString()} /{" "}
                  {(iconsQuery.data?.pages?.[0]?.total ?? 0).toLocaleString()}{" "}
                  shown
                </div>
              </div>
            </div>
          </div>

          <div ref={iconsScrollRef} className="flex-1 overflow-auto p-6">
            {iconsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading icons…
              </div>
            ) : iconsQuery.isError ? (
              <div className="text-sm text-destructive">
                Failed to load icons
              </div>
            ) : (
              <>
                {allIcons.length === 0 && search.trim().length > 0 ? (
                  <div className="grid h-full place-items-center">
                    <div className="flex max-w-sm flex-col items-center px-6 text-center">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                        <path d="M7 15l8-8" />
                      </svg>
                      <div className="mt-4 text-base font-semibold">
                        No icons found
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Try a different search query.
                      </div>
                    </div>
                  </div>
                ) : (
                  <TooltipProvider>
                    <div className="rounded-lg bg-border/70 p-px overflow-hidden">
                      <div className="grid grid-cols-6 gap-px bg-border/70 overflow-hidden rounded-lg md:grid-cols-8 lg:grid-cols-10">
                      {allIcons.map((icon, idx) => {
                        const key = `${icon.setId}:${icon.styleId}:${icon.filePath}`;
                        const active = selectedKeys.has(key);
                        const params = new URLSearchParams();
                        params.set("setId", icon.setId);
                        params.set("styleId", icon.styleId);
                        params.set("filePath", icon.filePath);
                        params.set("size", String(appliedSize));
                        params.set("strokeWidth", String(appliedStroke));
                        params.set("color", appliedColor);
                        return (
                          <Tooltip key={key} delayDuration={150}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={icon.name}
                                onClick={(e) => {
                                  setFocusedIcon(icon);
                                  setSelectedKeys((prev) => {
                                    // Shift+Click: select a contiguous range.
                                    if (
                                      e.shiftKey &&
                                      lastSelectedIndexRef.current != null
                                    ) {
                                      const start = Math.min(
                                        lastSelectedIndexRef.current,
                                        idx
                                      );
                                      const end = Math.max(
                                        lastSelectedIndexRef.current,
                                        idx
                                      );
                                      const next = new Set(prev);
                                      for (let j = start; j <= end; j++) {
                                        const it = allIcons[j];
                                        if (!it) continue;
                                        next.add(
                                          `${it.setId}:${it.styleId}:${it.filePath}`
                                        );
                                      }
                                      return next;
                                    }

                                    // Normal click: single selection.
                                    return new Set([key]);
                                  });
                                  lastSelectedIndexRef.current = idx;
                                }}
                                className={[
                                  "group relative flex aspect-square items-center justify-center bg-background p-3 text-left outline-none",
                                  "hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                  active ? "ring-1 ring-black ring-inset" : "",
                                ].join(" ")}
                              >
                                <img
                                  alt={icon.name}
                                  loading="lazy"
                                  style={{
                                    width: appliedSize,
                                    height: appliedSize,
                                  }}
                                  src={`/api/icon-svg?${params.toString()}`}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">{icon.name}</TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {(() => {
                        const remainder = allIcons.length % gridCols;
                        const fillerCount =
                          remainder === 0 ? 0 : gridCols - remainder;
                        return Array.from({ length: fillerCount }).map(
                          (_, i) => (
                            <div
                              // eslint-disable-next-line react/no-array-index-key
                              key={`__filler__${i}`}
                              aria-hidden="true"
                              className="aspect-square bg-background"
                            />
                          )
                        );
                      })()}
                      </div>
                    </div>
                  </TooltipProvider>
                )}

                <div ref={loadMoreRef} className="h-12" />
                {iconsQuery.isFetchingNextPage ? (
                  <div className="mt-2 text-center text-xs text-muted-foreground">
                    Loading more…
                  </div>
                ) : null}
                {iconsQuery.hasNextPage ? (
                  <div className="mt-3 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                      onClick={() => iconsQuery.fetchNextPage()}
                      disabled={iconsQuery.isFetchingNextPage}
                    >
                      {iconsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </main>

        {/* Right: customize + collect */}
        <aside className="border-l bg-muted/10 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between border-b bg-background px-5">
              <div>
                <div className="text-sm font-semibold">Customize</div>
                <div className="text-xs text-muted-foreground">
                  Appearance & export
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAppliedSize(24);
                  setAppliedStroke(1);
                  setAppliedColor("#000000");
                }}
              >
                Reset
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="space-y-6 pb-5">
                <CustomizeControls
                  value={{
                    size: appliedSize,
                    stroke: appliedStroke,
                    color: appliedColor,
                  }}
                  onApplyPatch={applyCustomizePatch}
                />

                <div className="border-t pt-6">
                  <div className="px-5 mb-4">
                    <label className="text-[12px] font-medium text-foreground">
                      Export
                    </label>
                  </div>
                  <div className="grid gap-2.5 px-5">
                    <Button
                      onClick={downloadSvg}
                      disabled={!focusedIcon || !selectedSvgQuery.data}
                      className="w-full justify-start"
                    >
                      <Download className="size-4" />
                      Download SVG
                    </Button>
                    <Button
                      variant="outline"
                      onClick={copySvg}
                      disabled={!focusedIcon || !selectedSvgQuery.data}
                      className="w-full justify-start"
                    >
                      <Copy className="size-4" />
                      Copy SVG
                    </Button>
                  </div>
                  {selectedSvgQuery.isFetching ? (
                    <div className="mt-3 px-5 text-[11px] text-muted-foreground">
                      Loading SVG…
                    </div>
                  ) : null}
                  {selectedKeys.size > 1 ? (
                    <div className="mt-3 px-5 text-[11px] text-muted-foreground">
                      {selectedKeys.size.toLocaleString()} selected ·
                      Shift+Click to extend
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
