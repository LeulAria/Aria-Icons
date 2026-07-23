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
import { Loader } from "@/components/ui/loader";
import JSZip from "jszip";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { McpDialog } from "@/components/mcp-dialog";

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
  previewSrc,
  previewName,
}: {
  value: AppliedCustomize;
  onApplyPatch: (patch: Partial<AppliedCustomize>) => void;
  previewSrc: string | null;
  previewName: string | null;
}) {
  const [uiSize, setUiSize] = React.useState(value.size);
  const [uiStroke, setUiStroke] = React.useState(value.stroke);
  const [uiColor, setUiColor] = React.useState(value.color);

  React.useEffect(() => {
    setUiSize(value.size);
    setUiStroke(value.stroke);
    setUiColor(value.color);
  }, [value.size, value.stroke, value.color]);

  return (
    <div className="space-y-1 px-4 pt-3">
      {/* Live preview */}
      <div className="mb-5 flex flex-col items-center rounded-2xl border border-white/10 bg-transparent px-4 py-6">
        <div className="grid size-20 place-items-center rounded-full bg-white/5 ring-1 ring-inset ring-white/10">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt={previewName ?? "Preview"}
              style={{ width: Math.min(uiSize, 48), height: Math.min(uiSize, 48) }}
            />
          ) : (
            <div className="size-6 rounded-sm border border-dashed border-white/25" />
          )}
        </div>
        <p className="mt-3 max-w-full truncate text-[12px] text-white/45">
          {previewName ?? "Select an icon to preview"}
        </p>
      </div>

      {/* Size */}
      <div className="rounded-2xl border border-white/10 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[13px] font-medium text-white">Size</label>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] text-white/70">
            {uiSize}px
          </span>
        </div>
        <Slider
          min={12}
          max={64}
          step={1}
          value={[uiSize]}
          onValueChange={(v) => {
            const next = v[0] ?? value.size;
            setUiSize(next);
            onApplyPatch({ size: next });
          }}
        />
        <div className="mt-2 flex justify-between text-[10px] text-white/35">
          <span>12</span>
          <span>64</span>
        </div>
      </div>

      {/* Stroke */}
      <div className="mt-3 rounded-2xl border border-white/10 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[13px] font-medium text-white">Stroke</label>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[11px] text-white/70">
            {uiStroke}px
          </span>
        </div>
        <Slider
          min={0.5}
          max={4}
          step={0.5}
          value={[uiStroke]}
          onValueChange={(v) => {
            const next = v[0] ?? value.stroke;
            setUiStroke(next);
            onApplyPatch({ stroke: next });
          }}
        />
        <div className="mt-2 flex justify-between text-[10px] text-white/35">
          <span>0.5</span>
          <span>4</span>
        </div>
      </div>

      {/* Color */}
      <div className="mt-3 rounded-2xl border border-white/10 px-4 py-4">
        <label className="mb-3 block text-[13px] font-medium text-white">
          Color
        </label>
        <div className="flex items-center gap-3">
          <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-white/15 transition-opacity duration-100 hover:opacity-90">
            <span
              className="absolute inset-0"
              style={{ backgroundColor: uiColor }}
            />
            <input
              aria-label="Color"
              type="color"
              value={uiColor}
              onChange={(e) => {
                const next = e.target.value;
                setUiColor(next);
                onApplyPatch({ color: next });
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <Input
            value={uiColor}
            onChange={(e) => {
              const next = e.target.value;
              setUiColor(next);
              if (/^#[0-9a-fA-F]{6}$/.test(next)) onApplyPatch({ color: next });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                (e.currentTarget as HTMLInputElement).blur();
            }}
            className="h-11 flex-1 rounded-full border-white/10 bg-transparent font-mono text-[13px] focus-visible:bg-transparent"
            placeholder="#ffffff"
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  type UiStyleGroup = IconStyleGroup | "both";
  const [styleGroup, setStyleGroup] = React.useState<UiStyleGroup>("both");
  const [search, setSearch] = React.useState("");
  const [selectedSetId, setSelectedSetId] = React.useState<string>("all");
  const [selectedStyleId, setSelectedStyleId] = React.useState<string>("both");
  const [focusedIcon, setFocusedIcon] = React.useState<{
    setId: string;
    styleId: string;
    filePath: string;
    name: string;
  } | null>(null);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    () => new Set()
  );
  const [mcpDialogOpen, setMcpDialogOpen] = React.useState(false);
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const gridCols = useGridColumns();

  // Customize applies only to the selected icon(s). The rest of the grid stays at defaults.
  const GRID_DEFAULT: AppliedCustomize = { size: 24, stroke: 1, color: "#ffffff" };
  const [appliedSize, setAppliedSize] = React.useState(GRID_DEFAULT.size);
  const [appliedStroke, setAppliedStroke] = React.useState(GRID_DEFAULT.stroke);
  const [appliedColor, setAppliedColor] = React.useState(GRID_DEFAULT.color);

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
    return sets
      .map((s) => {
        const countForGroup = s.styles
          .filter((st) => (styleGroup === "both" ? true : st.group === styleGroup))
          .reduce((acc, st) => acc + st.count, 0);
        return { ...s, countForGroup };
      })
      .filter((s) => s.countForGroup > 0);
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

  const downloadSvg = async () => {
    if (selectedKeys.size === 0) return;

    const zip = new JSZip();
    const selectedIcons = allIcons.filter((icon) => {
      const key = `${icon.setId}:${icon.styleId}:${icon.filePath}`;
      return selectedKeys.has(key);
    });

    if (selectedIcons.length === 0) return;

    toast.loading("Preparing download...", { id: "download-zip" });

    try {
      // Fetch all selected SVGs
      const svgPromises = selectedIcons.map(async (icon) => {
        const params = new URLSearchParams();
        params.set("setId", icon.setId);
        params.set("styleId", icon.styleId);
        params.set("filePath", icon.filePath);
        params.set("size", String(appliedSize));
        params.set("strokeWidth", String(appliedStroke));
        params.set("color", appliedColor);
        const res = await fetch(`/api/icon-svg?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to load SVG for ${icon.name}`);
        return { name: icon.name, svg: await res.text() };
      });

      const svgs = await Promise.all(svgPromises);

      // Add all SVGs to the zip file
      svgs.forEach(({ name, svg }) => {
        zip.file(`${name}.svg`, svg);
      });

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icons-${selectedIcons.length}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(
        `Downloaded ${selectedIcons.length} icon${selectedIcons.length > 1 ? "s" : ""}`,
        {
          description: `icons-${selectedIcons.length}.zip`,
          id: "download-zip",
        }
      );
    } catch (error) {
      toast.error("Failed to download icons", {
        description: error instanceof Error ? error.message : "Unknown error",
        id: "download-zip",
      });
    }
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
    <div className="h-full overflow-hidden bg-black">
      <div className="flex h-full flex-col lg:grid lg:grid-cols-[17rem_1fr_22rem] overflow-hidden">
        {/* Left sidebar */}
        <aside className="hidden lg:block border-r border-white/10 bg-black overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="p-5">
              <div className="text-base font-semibold tracking-tight">
                Aria Icons
              </div>
              <div className="mt-1 text-[11px] leading-4 text-muted-foreground">
                Browse and export icons from local collections.
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMcpDialogOpen(true)}
                className="mt-2 h-auto px-2 py-2 text-xs text-muted-foreground hover:text-white"
              >
                <img
                  src="/mcp.svg"
                  alt="MCP"
                  width={14}
                  height={14}
                  className="mr-1.5"
                />
                Add MCP Server
              </Button>
            </div>
            <div className="border-y border-white/10 bg-black px-5 pt-1 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white mb-1">
                Collections
              </div>
              <div
                className="inline-flex"
                role="tablist"
                aria-label="Icon style"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={styleGroup === "line"}
                  onClick={() => setStyleGroup("line")}
                  className={[
                    "cursor-pointer px-3 py-2 text-xs font-medium transition-colors relative",
                    styleGroup === "line"
                      ? "text-white border-b-2 border-white"
                      : "text-white/60 hover:text-white/80",
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
                    "cursor-pointer px-3 py-2 text-xs font-medium transition-colors relative",
                    styleGroup === "solid"
                      ? "text-white border-b-2 border-white"
                      : "text-white/60 border-b-2 border-transparent hover:text-white/80",
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
                    "cursor-pointer px-3 py-2 text-xs font-medium transition-colors relative",
                    styleGroup === "both"
                      ? "text-white border-b-2 border-white"
                      : "text-white/60 hover:text-white/80",
                  ].join(" ")}
                >
                  Both
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto px-3 py-4">
              {setsQuery.isLoading ? (
                <div className="px-2 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader size="sm" />
                  <span>Loading…</span>
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
                      "cursor-pointer flex w-full min-w-0 items-center justify-between gap-3 px-4 py-1.5 text-left outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    ].join(" ")}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={[
                        "truncate text-[12px] leading-4",
                        selectedSetId === "all"
                          ? "font-semibold text-foreground"
                          : "font-medium text-muted-foreground",
                      ].join(" ")}>
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
                          "cursor-pointer flex w-full min-w-0 items-center justify-between gap-3 px-4 py-1.5 text-left outline-none",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        ].join(" ")}
                      >
                        <div className="min-w-0 flex-1">
                          <div className={[
                            "truncate text-[12px] leading-4",
                            active
                              ? "font-semibold text-foreground"
                              : "font-medium text-muted-foreground",
                          ].join(" ")}>
                            {set.label}
                          </div>
                          <div className={[
                            "truncate text-[11px] leading-4",
                            active ? "text-foreground/80" : "text-muted-foreground",
                          ].join(" ")}>
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
        <main className="flex min-w-0 flex-1 flex-col overflow-auto">
          {/* Sticky header */}
          {/* @ts-ignore - bg-gradient-to-b is correct, linter false positive */}
          <div className="sticky top-0 z-10 bg-linear-to-b from-black/85 via-black/60 to-black/20 backdrop-blur-[2px]">
            {/* Mobile style toggle */}
            <div className="lg:hidden border-b border-white/10 px-4 py-3">
              <div className="inline-flex rounded-lg border border-white/10 bg-transparent p-1 w-full justify-center">
                <button
                  type="button"
                  role="tab"
                  aria-selected={styleGroup === "line"}
                  onClick={() => setStyleGroup("line")}
                    className={[
                      "flex-1 rounded-full px-2 py-1.5 text-sm font-medium transition-colors",
                      styleGroup === "line"
                        ? "bg-white text-black"
                        : "text-white/60 hover:text-white",
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
                    "flex-1 rounded-full px-2 py-1.5 text-sm font-medium transition-colors",
                    styleGroup === "solid"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white",
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
                    "flex-1 rounded-full px-2 py-1.5 text-sm font-medium transition-colors",
                    styleGroup === "both"
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white",
                  ].join(" ")}
                >
                  Both
                </button>
              </div>
            </div>

            <div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-8">
                <div className="min-w-0 flex-1 w-full sm:w-auto">
                  <div className="truncate text-base sm:text-lg font-semibold tracking-tight text-white">
                    {selectedSetId === "all"
                      ? "All Icons"
                      : selectedSet?.label ?? "Icons"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/60 leading-4">
                    {selectedSetId === "all"
                      ? `${allCountForGroup.toLocaleString()} icons`
                      : selectedStyle
                      ? `${selectedStyle.count.toLocaleString()} icons` : ""}
                  </div>
                </div>

                <div className="w-full sm:flex-1 sm:max-w-none grow">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/50" />
                    <Input
                      className="h-9 sm:h-9 pl-9 w-full text-sm"
                      placeholder="Search icons by name…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] text-white/50">
                    {allIcons.length.toLocaleString()} /{" "}
                    {(iconsQuery.data?.pages?.[0]?.total ?? 0).toLocaleString()}{" "}
                    shown
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div ref={iconsScrollRef} className="flex-1 p-3 sm:p-4 md:p-6">
            {iconsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader size="sm" />
                <span>Loading icons…</span>
              </div>
            ) : iconsQuery.isError ? (
              <div className="text-sm text-destructive">
                Failed to load icons
              </div>
            ) : (
              <>
                {allIcons.length === 0 && search.trim().length > 0 ? (
                  <div className="grid h-full place-items-center">
                    <div className="flex max-w-sm flex-col items-center px-6 dark:text-white text-center">
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.3"
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
                    <div className="rounded-lg bg-border/60 border border-border/60  sp-px overflow-hidden">
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-px bg-border/60 overflow-hidden rounded-lg">
                      {allIcons.map((icon, idx) => {
                        const key = `${icon.setId}:${icon.styleId}:${icon.filePath}`;
                        const active = selectedKeys.has(key);
                        const displaySize = active
                          ? appliedSize
                          : GRID_DEFAULT.size;
                        const displayStroke = active
                          ? appliedStroke
                          : GRID_DEFAULT.stroke;
                        const displayColor = active
                          ? appliedColor
                          : GRID_DEFAULT.color;
                        const params = new URLSearchParams();
                        params.set("setId", icon.setId);
                        params.set("styleId", icon.styleId);
                        params.set("filePath", icon.filePath);
                        params.set("size", String(displaySize));
                        params.set("strokeWidth", String(displayStroke));
                        params.set("color", displayColor);
                        return (
                          <Tooltip key={key} delayDuration={0}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={icon.name}
                                onClick={(e) => {
                                  setFocusedIcon(icon);
                                  setSelectedKeys((prev) => {
                                    // Ctrl/Cmd+Click: toggle individual selection
                                    if (e.ctrlKey || e.metaKey) {
                                      const next = new Set(prev);
                                      if (next.has(key)) {
                                        next.delete(key);
                                      } else {
                                        next.add(key);
                                      }
                                      return next;
                                    }

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
                                  "group relative flex aspect-square items-center justify-center bg-background p-2 sm:p-3 text-left outline-none transition-colors duration-100 [content-visibility:auto] [contain-intrinsic-size:72px]",
                                  "hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                  active ? "ring-1 ring-white/40 ring-inset" : "",
                                ].join(" ")}
                              >
                                <img
                                  alt={icon.name}
                                  loading="lazy"
                                  className="transition-transform duration-100 ease-out will-change-transform group-hover:scale-110"
                                  style={{
                                    width: displaySize,
                                    height: displaySize,
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
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader size="sm" />
                    <span>Loading more…</span>
                  </div>
                ) : null}
                {iconsQuery.hasNextPage ? (
                  <div className="mt-3 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-5"
                      onClick={() => iconsQuery.fetchNextPage()}
                      disabled={iconsQuery.isFetchingNextPage}
                    >
                      {iconsQuery.isFetchingNextPage ? (
                        <>
                          <Loader size="sm" className="mr-2" />
                          Loading…
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </main>

        {/* Right: customize + collect */}
        <aside className="hidden lg:block border-l border-white/10 bg-black overflow-hidden order-3">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center justify-between px-4">
              <div>
                <div className="text-[15px] font-medium text-white">
                  Customize
                </div>
                <div className="text-[12px] text-white/45">
                  Appearance & export
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppliedSize(GRID_DEFAULT.size);
                  setAppliedStroke(GRID_DEFAULT.stroke);
                  setAppliedColor(GRID_DEFAULT.color);
                }}
                className="h-9 rounded-full px-3 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Reset
              </button>
            </div>

            <div className="flex-1 overflow-auto pb-4">
              <CustomizeControls
                value={{
                  size: appliedSize,
                  stroke: appliedStroke,
                  color: appliedColor,
                }}
                onApplyPatch={applyCustomizePatch}
                previewName={focusedIcon?.name ?? null}
                previewSrc={
                  focusedIcon
                    ? `/api/icon-svg?${new URLSearchParams({
                        setId: focusedIcon.setId,
                        styleId: focusedIcon.styleId,
                        filePath: focusedIcon.filePath,
                        size: String(appliedSize),
                        strokeWidth: String(appliedStroke),
                        color: appliedColor,
                      }).toString()}`
                    : null
                }
              />

              <div className="mt-4 px-4">
                <div className="rounded-2xl border border-white/10 px-4 py-4">
                  <div className="mb-3 text-[13px] font-medium text-white">
                    Export
                  </div>
                  <div className="grid gap-2">
                    <Button
                      onClick={downloadSvg}
                      disabled={selectedKeys.size === 0}
                      className="h-11 w-full justify-center rounded-full"
                    >
                      <Download className="size-4" />
                      {selectedKeys.size > 1
                        ? `Download ${selectedKeys.size} (ZIP)`
                        : "Download SVG"}
                    </Button>
                    <Button
                      onClick={copySvg}
                      disabled={!focusedIcon || !selectedSvgQuery.data}
                      className="h-11 w-full justify-center rounded-full border-0 bg-[#FFF1] text-black hover:bg-[#FFF1]/90"
                    >
                      <Copy className="size-4" />
                      Copy SVG
                    </Button>
                  </div>
                  {selectedSvgQuery.isFetching ? (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-white/45">
                      <Loader size="sm" />
                      <span>Loading SVG…</span>
                    </div>
                  ) : null}
                  {selectedKeys.size > 1 ? (
                    <p className="mt-3 text-[11px] leading-4 text-white/40">
                      {selectedKeys.size.toLocaleString()} selected · Shift+click
                      to extend
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <WelcomeDialog onConnectMcp={() => setMcpDialogOpen(true)} />
      <McpDialog open={mcpDialogOpen} onOpenChange={setMcpDialogOpen} />
    </div>
  );
}
