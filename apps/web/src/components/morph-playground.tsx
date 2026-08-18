"use client";

import * as React from "react";
import { MorphIcon } from "morphicons/react";
import { AlertTriangle, Check, Info, Pause, Play, Plus, X } from "lucide-react";
import { HoverCard } from "radix-ui";
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { buildIconSvgUrl, type IconExportRef } from "@/lib/icon-export";
import { iconKey } from "@/lib/icon-workspace";
import {
  loadMorphPath,
  morphCompatibility,
  morphErrorMessage,
  MORPH_HOLD_MS,
  MORPH_SPRINGS,
  MAX_MORPH_SEQUENCE,
  type MorphCompatibility,
  type MorphPath,
  type MorphSpring,
} from "@/lib/icon-morph";

export type PreviewBg = "transparent" | "white" | "dark" | "checker";

const PREVIEW_BGS: { id: PreviewBg; label: string }[] = [
  { id: "transparent", label: "Clear" },
  { id: "white", label: "White" },
  { id: "dark", label: "Dark" },
  { id: "checker", label: "Grid" },
];

function ControlSlider({
  label,
  valueLabel,
  children,
}: {
  label: string;
  valueLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <label className="text-[13px] text-white/80">{label}</label>
        <span className="text-[11px] font-normal capitalize text-white/45">
          {valueLabel}
        </span>
      </div>
      {children}
    </div>
  );
}

function MorphCompatibilityCard({ compat }: { compat: MorphCompatibility }) {
  return (
    <div className="w-[260px] rounded-lg border border-white/10 bg-[#141416]/95 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          Morph compatibility
        </div>
        <div className="font-mono text-[12px] tabular-nums text-white/80">
          {compat.ready ? `${compat.score}%` : "—"}
        </div>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-300"
          style={{ width: compat.ready ? `${compat.score}%` : "0%" }}
        />
      </div>
      {compat.pair ? (
        <div className="mt-2 truncate text-[11px] text-white/35">{compat.pair}</div>
      ) : (
        <div className="mt-2 text-[11px] text-white/35">
          Add a second icon to score this pair.
        </div>
      )}
      {compat.ready ? (
        <div className="mt-3 space-y-1.5">
          {compat.checks.map((check) => (
            <div key={check.label} className="flex items-center gap-2">
              {check.ok ? (
                <Check className="size-3.5 shrink-0 text-white/70" strokeWidth={2.25} />
              ) : (
                <AlertTriangle className="size-3.5 shrink-0 text-white/35" strokeWidth={2} />
              )}
              <span
                className={cn(
                  "text-[12px] leading-4",
                  check.ok ? "text-white/70" : "text-white/40",
                )}
              >
                {check.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-4 text-white/30">
          Select two stroke icons to evaluate path structure and interpolation.
        </p>
      )}
    </div>
  );
}

export function MorphPlayground({
  icons,
  activeKey,
  size,
  stroke,
  color,
  previewBg,
  spring,
  onPreviewBgChange,
  onSpringChange,
  onSelect,
  onRemove,
  onReorder,
}: {
  icons: IconExportRef[];
  activeKey: string;
  size: number;
  stroke: number;
  color: string;
  previewBg: PreviewBg;
  spring: MorphSpring;
  onPreviewBgChange: (bg: PreviewBg) => void;
  onSpringChange: (spring: MorphSpring) => void;
  onSelect: (key: string) => void;
  onRemove: (key: string) => void;
  onReorder: (keys: string[]) => void;
}) {
  const [loaded, setLoaded] = React.useState<
    Record<string, MorphPath | { error: string }>
  >({});
  const [playing, setPlaying] = React.useState(false);
  const [scrubbing, setScrubbing] = React.useState(false);
  const [progress, setProgress] = React.useState(1);
  const [fromKey, setFromKey] = React.useState<string | null>(null);
  const activeKeyRef = React.useRef(activeKey);
  const pendingAdvanceRef = React.useRef(false);
  const cycleRef = React.useRef({ icons, loaded, activeKey, onSelect });
  cycleRef.current = { icons, loaded, activeKey, onSelect };
  const rowRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const chipsRef = React.useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = React.useState(false);
  const [fadeRight, setFadeRight] = React.useState(false);

  const canAdd = icons.length > 0 && icons.length < MAX_MORPH_SEQUENCE;
  const sortable = icons.length > 1;
  const dragKeyRef = React.useRef<string | null>(null);
  const skipClickRef = React.useRef(false);
  const pointerRef = React.useRef<{
    id: number;
    key: string;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);
  const [dragKey, setDragKey] = React.useState<string | null>(null);

  const moveIcon = React.useCallback(
    (fromKey: string, toKey: string) => {
      if (fromKey === toKey) return;
      const from = icons.findIndex((icon) => iconKey(icon) === fromKey);
      const to = icons.findIndex((icon) => iconKey(icon) === toKey);
      if (from < 0 || to < 0) return;
      const next = icons.slice();
      const [item] = next.splice(from, 1);
      if (!item) return;
      next.splice(to, 0, item);
      onReorder(next.map((icon) => iconKey(icon)));
    },
    [icons, onReorder],
  );

  const keyAtPoint = React.useCallback((x: number) => {
    const root = chipsRef.current;
    if (!root) return null;
    const chips = Array.from(root.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    for (const chip of chips) {
      const rect = chip.getBoundingClientRect();
      if (x < rect.left + rect.width / 2) return chip.dataset.key ?? null;
    }
    return chips[chips.length - 1]?.dataset.key ?? null;
  }, []);

  const endPointerDrag = React.useCallback((target: HTMLElement, pointerId: number) => {
    pointerRef.current = null;
    dragKeyRef.current = null;
    setDragKey(null);
    if (target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  }, []);

  const updateChipOverflow = React.useCallback(() => {
    const row = rowRef.current;
    const chips = chipsRef.current;
    const scroller = scrollerRef.current;
    if (!row || !chips) {
      setOverflowing(false);
      setFadeRight(false);
      return;
    }
    const plusSlot = canAdd ? 46 : 0;
    const trailingSlot = 92;
    const available = row.clientWidth - plusSlot - trailingSlot;
    const nextOverflow = chips.scrollWidth > available + 1;
    setOverflowing(nextOverflow);
    if (!scroller || !nextOverflow) {
      setFadeRight(false);
      return;
    }
    setFadeRight(scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 2);
  }, [canAdd]);

  React.useEffect(() => {
    const row = rowRef.current;
    const chips = chipsRef.current;
    if (!row) return;
    updateChipOverflow();
    const ro = new ResizeObserver(updateChipOverflow);
    ro.observe(row);
    if (chips) ro.observe(chips);
    return () => ro.disconnect();
  }, [icons, updateChipOverflow]);

  React.useEffect(() => {
    let cancelled = false;
    const keys = new Set(icons.map((icon) => iconKey(icon)));

    void Promise.all(
      icons.map(async (icon) => {
        const key = iconKey(icon);
        try {
          const d = await loadMorphPath(icon);
          return [key, { key, name: icon.name, d } as MorphPath] as const;
        } catch (error) {
          return [key, { error: morphErrorMessage(error) }] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setLoaded((prev) => {
        const next: typeof prev = {};
        for (const [key, value] of entries) next[key] = value;
        for (const [key, value] of Object.entries(prev)) {
          if (keys.has(key) && !(key in next)) next[key] = value;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [icons]);

  React.useEffect(() => {
    if (activeKey !== activeKeyRef.current) {
      setFromKey(activeKeyRef.current);
      activeKeyRef.current = activeKey;
      setScrubbing(false);
      setProgress(1);
      return;
    }
    if (!fromKey && icons.length >= 2) {
      const other = icons.find((icon) => iconKey(icon) !== activeKey);
      if (other) setFromKey(iconKey(other));
    }
  }, [activeKey, icons, fromKey]);

  const readyKeys = React.useMemo(
    () =>
      icons
        .map((icon) => iconKey(icon))
        .filter((key) => {
          const item = loaded[key];
          return !!item && "d" in item;
        }),
    [icons, loaded],
  );
  const canPlay = readyKeys.length >= 2;

  const advance = React.useCallback(() => {
    const { icons: list, loaded: map, activeKey: current, onSelect: select } =
      cycleRef.current;
    const ready = list.filter((icon) => {
      const item = map[iconKey(icon)];
      return item && "d" in item;
    });
    if (ready.length < 2) return false;
    const idx = ready.findIndex((icon) => iconKey(icon) === current);
    const next = ready[(idx < 0 ? 0 : idx + 1) % ready.length];
    if (!next) return false;
    select(iconKey(next));
    return true;
  }, []);

  React.useEffect(() => {
    if (readyKeys.length < 2) setPlaying(false);
  }, [readyKeys.length]);

  React.useEffect(() => {
    if (!playing) return;
    if (pendingAdvanceRef.current) {
      pendingAdvanceRef.current = false;
      advance();
    }
  }, [playing, advance]);

  React.useEffect(() => {
    if (!playing || scrubbing || !canPlay) return;
    const id = window.setInterval(() => {
      advance();
    }, MORPH_HOLD_MS[spring]);
    return () => window.clearInterval(id);
  }, [playing, scrubbing, canPlay, spring, advance]);

  const activeIcon = icons.find((icon) => iconKey(icon) === activeKey) ?? icons[0];
  const toItem = activeIcon ? loaded[iconKey(activeIcon)] : undefined;
  const fromItem = fromKey ? loaded[fromKey] : undefined;
  const toPath = toItem && "d" in toItem ? toItem : null;
  const fromPath = fromItem && "d" in fromItem ? fromItem : null;
  const toError = toItem && "error" in toItem ? toItem.error : null;

  const readout = React.useMemo(
    () => morphCompatibility(fromPath, toPath),
    [fromPath, toPath],
  );

  const previewSize = Math.min(Math.max(size * 2.6, 64), 96);
  const springIndex = Math.max(0, MORPH_SPRINGS.indexOf(spring));

  const stageClass =
    previewBg === "white"
      ? "bg-white"
      : previewBg === "dark"
        ? "bg-[#0a0a0a]"
        : previewBg === "checker"
          ? "bg-[length:16px_16px] bg-[linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a),linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a)] bg-[position:0_0,8px_8px]"
          : "bg-transparent";

  const iconColor = previewBg === "white" ? "#111111" : color;

  const togglePlayback = () => {
    if (playing) {
      pendingAdvanceRef.current = false;
      setPlaying(false);
      return;
    }
    if (!canPlay) return;
    setScrubbing(false);
    setProgress(1);
    pendingAdvanceRef.current = true;
    setPlaying(true);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative grid min-h-[13.5rem] place-items-center overflow-hidden rounded-xl ring-1 ring-inset ring-white/[0.06]",
          stageClass,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,255,255,0.07),transparent_62%)]"
        />
        {toError ? (
          <p className="relative z-10 max-w-[14rem] px-4 text-center text-[12px] leading-5 text-white/50">
            {toError}
          </p>
        ) : toPath ? (
          <div
            className="relative z-10"
            style={{ width: previewSize, height: previewSize }}
          >
            <MorphIcon
              icon={toPath.d}
              from={scrubbing && fromPath ? fromPath.d : undefined}
              to={scrubbing && fromPath ? toPath.d : undefined}
              progress={scrubbing ? progress : undefined}
              spring={spring}
              size={previewSize}
              strokeWidth={stroke}
              color={iconColor}
              label={activeIcon?.name}
              className="overflow-visible"
            />
          </div>
        ) : (
          <Loader className="relative z-10 text-white/40" />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PREVIEW_BGS.map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onPreviewBgChange(bg.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] transition-colors duration-150",
              previewBg === bg.id
                ? "bg-white/[0.1] text-white"
                : "text-white/40 hover:bg-white/[0.04] hover:text-white/70",
            )}
          >
            {bg.label}
          </button>
        ))}
      </div>

      <div ref={rowRef} className="flex items-center gap-1.5">
        <div className={cn("relative min-w-0", overflowing && "flex-1")}>
          <div
            ref={scrollerRef}
            onScroll={updateChipOverflow}
            className="overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex items-center gap-1.5">
              <div ref={chipsRef} className="flex items-center gap-1.5">
                {icons.map((icon) => {
                  const key = iconKey(icon);
                  const selected = key === activeKey;
                  const item = loaded[key];
                  const failed = item && "error" in item;
                  const dragging = dragKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      data-key={key}
                      title={failed && item ? item.error : icon.name}
                      onClick={() => {
                        if (skipClickRef.current) {
                          skipClickRef.current = false;
                          return;
                        }
                        pendingAdvanceRef.current = false;
                        setPlaying(false);
                        setScrubbing(false);
                        onSelect(key);
                      }}
                      onPointerDown={(e) => {
                        if (!sortable || e.button !== 0) return;
                        pointerRef.current = {
                          id: e.pointerId,
                          key,
                          startX: e.clientX,
                          startY: e.clientY,
                          dragging: false,
                        };
                      }}
                      onPointerMove={(e) => {
                        const pointer = pointerRef.current;
                        if (!pointer || pointer.id !== e.pointerId) return;
                        if (!pointer.dragging) {
                          const dist = Math.hypot(
                            e.clientX - pointer.startX,
                            e.clientY - pointer.startY,
                          );
                          if (dist < 5) return;
                          pointer.dragging = true;
                          skipClickRef.current = true;
                          dragKeyRef.current = pointer.key;
                          setDragKey(pointer.key);
                          pendingAdvanceRef.current = false;
                          setPlaying(false);
                          e.currentTarget.setPointerCapture(e.pointerId);
                        }
                        const over = keyAtPoint(e.clientX);
                        if (over) moveIcon(pointer.key, over);
                      }}
                      onPointerUp={(e) => {
                        endPointerDrag(e.currentTarget, e.pointerId);
                      }}
                      onPointerCancel={(e) => {
                        endPointerDrag(e.currentTarget, e.pointerId);
                      }}
                      className={cn(
                        "group/chip relative grid size-10 shrink-0 place-items-center rounded-lg ring-1 transition-[opacity,background-color,box-shadow] duration-150",
                        sortable && "cursor-grab touch-none select-none active:cursor-grabbing",
                        selected
                          ? "bg-white/[0.08] ring-white/80"
                          : "bg-white/[0.03] ring-white/[0.08] hover:bg-white/[0.06] hover:ring-white/20",
                        failed && "opacity-40",
                        dragging && "opacity-50",
                      )}
                    >
                      <img
                        src={buildIconSvgUrl(icon, {
                          size: 18,
                          stroke,
                          color: iconColor,
                        })}
                        alt=""
                        width={18}
                        height={18}
                        className="pointer-events-none size-[18px]"
                        draggable={false}
                      />
                      {icons.length > 1 ? (
                        <span
                          role="button"
                          tabIndex={-1}
                          aria-label={`Remove ${icon.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(key);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-white text-black opacity-0 shadow-sm transition-opacity group-hover/chip:opacity-100"
                        >
                          <X className="size-2.5" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {canAdd && !overflowing ? (
                <div
                  title="Click icons in the grid to add them"
                  className="grid size-10 shrink-0 place-items-center rounded-lg border border-dashed border-white/15 text-white/30"
                >
                  <Plus className="size-3.5" />
                </div>
              ) : null}
            </div>
          </div>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-9 bg-gradient-to-l from-[#0b0b0b] to-transparent transition-opacity duration-200",
              fadeRight ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
        {canAdd && overflowing ? (
          <div
            title="Click icons in the grid to add them"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-dashed border-white/15 text-white/30"
          >
            <Plus className="size-3.5" />
          </div>
        ) : null}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5",
            !overflowing && "ml-auto",
          )}
        >
          <HoverCard.Root openDelay={140} closeDelay={80}>
            <HoverCard.Trigger asChild>
              <button
                type="button"
                aria-label="Morph compatibility"
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-lg ring-1 ring-white/8 transition-colors duration-150",
                  readout.ready && readout.score < 55
                    ? "text-white/55 hover:bg-white/6 hover:text-white"
                    : "text-white/40 hover:bg-white/6 hover:text-white/80",
                )}
              >
                <Info className="size-3.5" strokeWidth={1.75} />
              </button>
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Content
                side="top"
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="z-50 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              >
                <MorphCompatibilityCard compat={readout} />
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
          <button
            type="button"
            disabled={!canPlay}
            aria-label={playing ? "Pause morph" : "Play morph"}
            title={playing ? "Pause morph" : "Play morph"}
            onClick={togglePlayback}
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-150",
              canPlay
                ? "bg-white text-black hover:bg-white/90"
                : "bg-white/10 text-white/30",
            )}
          >
            {playing ? (
              <Pause className="size-3.5 fill-current" />
            ) : (
              <Play className="size-3.5 fill-current pl-0.5" />
            )}
          </button>
        </div>
      </div>

      <ControlSlider label="Spring" valueLabel={spring}>
        <Slider
          min={0}
          max={2}
          step={1}
          value={[springIndex]}
          onValueChange={(value) => {
            const next = MORPH_SPRINGS[value[0] ?? 1] ?? "snappy";
            onSpringChange(next);
          }}
        />
        <div className="mt-1.5 flex justify-between text-[11px] font-normal text-white/35">
          <span>Smooth</span>
          <span>Snappy</span>
          <span>Bouncy</span>
        </div>
      </ControlSlider>

      <div className="flex items-center gap-3 px-0.5">
        <Slider
          min={0}
          max={1}
          step={0.01}
          disabled={!fromPath || !toPath}
          value={[progress]}
          onValueChange={(value) => {
            pendingAdvanceRef.current = false;
            setPlaying(false);
            setScrubbing(true);
            setProgress(value[0] ?? 1);
          }}
        />
        <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-white/40">
          t={progress.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
