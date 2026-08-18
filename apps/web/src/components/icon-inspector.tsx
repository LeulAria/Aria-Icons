"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import JSZip from "jszip";
import { ArrowRight, Check, Copy, Download, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildIconSvgUrl,
  COPY_FORMAT_LABELS,
  COPY_FORMAT_LOGOS,
  COPY_FORMAT_SETUP,
  fetchIconSvg,
  formatIconExport,
  type CopyFormat,
  type IconExportCustomize,
  type IconExportRef,
} from "@/lib/icon-export";
import {
  formatMorphExport,
  loadMorphPaths,
  morphErrorMessage,
  MORPH_COPY_FORMATS,
  MORPH_COPY_LABELS,
  MORPH_COPY_LOGOS,
  MORPH_COPY_SETUP,
  type MorphCopyFormat,
  type MorphSpring,
} from "@/lib/icon-morph";
import { MorphPlayground } from "@/components/morph-playground";
import { UnderlineTabs } from "@/components/ui/underline-tabs";

type PreviewBg = "transparent" | "white" | "dark" | "checker";

const PREVIEW_TABS = [
  { id: "static", label: "Static" },
  { id: "morph", label: "Morph" },
] as const;

const DEFAULT_CUSTOMIZE: IconExportCustomize = {
  size: 24,
  stroke: 1,
  color: "#ffffff",
};

const COPY_FORMATS: CopyFormat[] = [
  "svg",
  "react",
  "react-native",
  "vue",
  "html",
  "solid",
  "flutter",
];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="px-5 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

const SIZE_INPUT = { min: 1, max: 512 } as const;
const STROKE_INPUT = { min: 0, max: 16 } as const;
const SIZE_SLIDER = { min: 12, max: 64, step: 1 } as const;
const STROKE_SLIDER = { min: 0.5, max: 4, step: 0.5 } as const;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function SliderValueInput({
  value,
  min,
  max,
  decimals = 0,
  ariaLabel,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  decimals?: number;
  ariaLabel: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = React.useState(() => String(value));
  const focusedRef = React.useRef(false);

  React.useEffect(() => {
    if (!focusedRef.current) setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = Number(raw.trim());
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const factor = 10 ** decimals;
    const next = clampNumber(
      Math.round(parsed * factor) / factor,
      min,
      max,
    );
    onCommit(next);
    setDraft(String(next));
  };

  return (
    <input
      aria-label={ariaLabel}
      inputMode={decimals > 0 ? "decimal" : "numeric"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        focusedRef.current = true;
        e.currentTarget.select();
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        commit(e.currentTarget.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(String(value));
          e.currentTarget.blur();
        }
      }}
      className="size-8 rounded-md bg-white/4 text-center font-mono text-[12px] leading-none text-white ring-1 ring-inset ring-white/10 outline-none transition-colors focus:bg-white/6 focus:ring-white/25"
    />
  );
}

export function IconInspector({
  focusedIcon,
  selectedIcons,
  selectedCount,
  setLabel,
  groupLabel,
  favorited,
  onToggleFavorite,
  onClose,
  onCopySvg,
  onSelectSet,
  customizeRef,
  morphMode = false,
  morphIcons = [],
  morphActiveKey = null,
  onEnableMorph,
  onDisableMorph,
  onMorphSelect,
  onMorphRemove,
  onMorphReorder,
}: {
  focusedIcon: IconExportRef | null;
  selectedIcons: IconExportRef[];
  selectedCount: number;
  setLabel?: string | null;
  /** Line / Fill — used to hide stroke controls on filled icons. */
  groupLabel?: string | null;
  favorited: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onCopySvg?: () => void;
  /** Jump to this icon's library and clear search, keeping the current selection. */
  onSelectSet?: (setId: string) => void;
  customizeRef?: React.MutableRefObject<{
    copySvg: () => Promise<void>;
    download: () => Promise<void>;
    getCustomize: () => IconExportCustomize;
  } | null>;
  morphMode?: boolean;
  morphIcons?: IconExportRef[];
  morphActiveKey?: string | null;
  onEnableMorph?: () => void;
  onDisableMorph?: () => void;
  onMorphSelect?: (key: string) => void;
  onMorphRemove?: (key: string) => void;
  onMorphReorder?: (keys: string[]) => void;
}) {
  const [size, setSize] = React.useState(DEFAULT_CUSTOMIZE.size);
  const [stroke, setStroke] = React.useState(DEFAULT_CUSTOMIZE.stroke);
  const [color, setColor] = React.useState(DEFAULT_CUSTOMIZE.color);
  const [previewBg, setPreviewBg] = React.useState<PreviewBg>("dark");
  const [spring, setSpring] = React.useState<MorphSpring>("snappy");
  const [copying, setCopying] = React.useState<CopyFormat | MorphCopyFormat | null>(null);
  const [copiedFormat, setCopiedFormat] = React.useState<
    CopyFormat | MorphCopyFormat | null
  >(null);
  const [setupOpen, setSetupOpen] = React.useState<
    CopyFormat | MorphCopyFormat | null
  >(null);
  const [copiedSetup, setCopiedSetup] = React.useState<
    CopyFormat | MorphCopyFormat | null
  >(null);
  const [headerScrolled, setHeaderScrolled] = React.useState(false);
  const bodyScrollRef = React.useRef<HTMLDivElement>(null);

  const previewCustomize = useDebouncedValue({ size, stroke, color }, 80);
  const previewSrc = focusedIcon
    ? buildIconSvgUrl(focusedIcon, previewCustomize)
    : null;

  React.useEffect(() => {
    setHeaderScrolled(false);
    bodyScrollRef.current?.scrollTo({ top: 0 });
  }, [focusedIcon?.setId, focusedIcon?.filePath, focusedIcon?.styleId]);

  const getCustomize = React.useCallback(
    (): IconExportCustomize => ({ size, stroke, color }),
    [size, stroke, color],
  );

  const reset = () => {
    setSize(DEFAULT_CUSTOMIZE.size);
    setStroke(DEFAULT_CUSTOMIZE.stroke);
    setColor(DEFAULT_CUSTOMIZE.color);
    setSpring("snappy");
  };

  const exportIcons = morphMode && morphIcons.length > 0 ? morphIcons : selectedIcons;
  const exportCount = exportIcons.length;

  const copyAs = React.useCallback(
    async (format: CopyFormat) => {
      if (!focusedIcon) return;
      setCopying(format);
      try {
        const svg = await fetchIconSvg(focusedIcon, getCustomize());
        const text = formatIconExport(svg, focusedIcon.name, format);
        await navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        toast.success(`Copied ${COPY_FORMAT_LABELS[format]}`, {
          description: focusedIcon.name,
        });
        onCopySvg?.();
        window.setTimeout(() => setCopiedFormat(null), 1400);
      } catch (error) {
        toast.error(`Failed to copy ${COPY_FORMAT_LABELS[format]}`, {
          description:
            error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setCopying(null);
      }
    },
    [focusedIcon, getCustomize, onCopySvg],
  );

  const copyMorph = React.useCallback(
    async (format: MorphCopyFormat) => {
      if (morphIcons.length < 2) {
        toast.error("Add another icon", {
          description: "A morph needs at least two stroke icons.",
        });
        return;
      }
      setCopying(format);
      try {
        const paths = await loadMorphPaths(morphIcons);
        const text = formatMorphExport(paths, format, getCustomize(), spring);
        await navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        toast.success(`Copied ${MORPH_COPY_LABELS[format]} morph`, {
          description: `${paths.length} icons · ${spring}`,
        });
        onCopySvg?.();
        window.setTimeout(() => setCopiedFormat(null), 1400);
      } catch (error) {
        toast.error(`Failed to copy ${MORPH_COPY_LABELS[format]}`, {
          description: morphErrorMessage(error),
        });
      } finally {
        setCopying(null);
      }
    },
    [getCustomize, morphIcons, onCopySvg, spring],
  );

  const downloadSvg = React.useCallback(async () => {
    if (exportCount === 0) return;
    const customize = getCustomize();
    const zip = new JSZip();

    toast.loading("Preparing download...", { id: "download-zip" });

    try {
      const svgs = await Promise.all(
        exportIcons.map(async (icon) => {
          const svg = await fetchIconSvg(icon, customize);
          return { name: icon.name, svg };
        }),
      );
      svgs.forEach(({ name, svg }) => zip.file(`${name}.svg`, svg));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        exportIcons.length === 1
          ? `${exportIcons[0]?.name ?? "icon"}.svg`
          : `icons-${exportIcons.length}.zip`;

      if (exportIcons.length === 1) {
        const blob = new Blob([svgs[0]?.svg ?? ""], {
          type: "image/svg+xml",
        });
        const singleUrl = URL.createObjectURL(blob);
        a.href = singleUrl;
        a.download = `${exportIcons[0]?.name ?? "icon"}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(singleUrl);
        URL.revokeObjectURL(url);
      } else {
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      toast.success(
        `Downloaded ${exportIcons.length} icon${exportIcons.length > 1 ? "s" : ""}`,
        { id: "download-zip" },
      );
    } catch (error) {
      toast.error("Failed to download icons", {
        description:
          error instanceof Error ? error.message : "Unknown error",
        id: "download-zip",
      });
    }
  }, [exportCount, exportIcons, getCustomize]);

  React.useEffect(() => {
    if (!customizeRef) return;
    customizeRef.current = {
      copySvg: () => (morphMode ? copyMorph("react") : copyAs("svg")),
      download: downloadSvg,
      getCustomize,
    };
    return () => {
      customizeRef.current = null;
    };
  }, [copyAs, copyMorph, customizeRef, downloadSvg, getCustomize, morphMode]);

  const previewFrameClass =
    previewBg === "white"
      ? "bg-white"
      : previewBg === "dark"
        ? "bg-[#0a0a0a]"
        : previewBg === "checker"
          ? "bg-[length:16px_16px] bg-[linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a),linear-gradient(45deg,#1a1a1a_25%,transparent_25%,transparent_75%,#1a1a1a_75%,#1a1a1a)] bg-[position:0_0,8px_8px]"
          : "bg-transparent";

  const emptyBody = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between px-5">
        <div>
          <div className="text-[15px] font-medium text-white">Customize</div>
          <div className="text-[12px] text-white/45">Appearance & export</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
        <div className="grid size-20 place-items-center rounded-full bg-white/5 ring-1 ring-inset ring-white/10">
          <div className="size-6 rounded-sm border border-dashed border-white/25" />
        </div>
        <p className="mt-4 text-[14px] font-medium text-white">Select an icon</p>
        <p className="mt-1.5 max-w-[16rem] text-[12px] leading-5 text-white/40">
          Choose an icon to preview, customize, and export it.
        </p>
        <p className="mt-4 font-mono text-[11px] text-white/30">⌘K Search</p>
      </div>
    </>
  );

  const body = focusedIcon ? (
    <>
      <div
        className={cn(
          "flex h-14 shrink-0 items-center justify-between gap-3 px-5 transition-[border-color] duration-200",
          headerScrolled ? "border-b border-white/[0.08]" : "border-b border-transparent",
        )}
      >
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium tracking-tight text-white">
            {focusedIcon.name}
          </div>
          <div className="truncate text-[12px] text-white/40">
            {morphMode
              ? `Morph · ${morphIcons.length} icon${morphIcons.length === 1 ? "" : "s"}`
              : setLabel ?? focusedIcon.setId}
            {!morphMode && selectedCount > 1
              ? ` · ${selectedCount.toLocaleString()} selected`
              : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={favorited ? "Remove favorite" : "Favorite"}
            onClick={onToggleFavorite}
            className="inline-flex size-8 items-center justify-center rounded-md text-white/50 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
          >
            <Heart
              className={cn(
                "size-4 transition-transform duration-150",
                favorited && "fill-white text-white scale-110",
              )}
            />
          </button>
          <button
            type="button"
            aria-label="Clear selection"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-white/50 transition-colors duration-150 hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={bodyScrollRef}
        className="flex-1 overflow-auto"
        onScroll={(e) => {
          setHeaderScrolled(e.currentTarget.scrollTop > 80);
        }}
      >
        <section>
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5">
            <UnderlineTabs
              ariaLabel="Preview mode"
              value={morphMode ? "morph" : "static"}
              onChange={(mode) => {
                if (mode === "morph") onEnableMorph?.();
                else onDisableMorph?.();
              }}
              items={PREVIEW_TABS}
            />
            {setLabel || focusedIcon.setId ? (
              <button
                type="button"
                onClick={() => onSelectSet?.(focusedIcon.setId)}
                title={`Open ${setLabel ?? focusedIcon.setId}`}
                className="group/set inline-flex h-6 max-w-36 shrink-0 items-center gap-1 rounded-full bg-white/4 pl-2.5 pr-1.5 text-[11px] font-medium text-white/65 ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/8 hover:text-white"
              >
                <span className="truncate">{setLabel ?? focusedIcon.setId}</span>
                <ArrowRight className="size-3 shrink-0 text-white/30 transition-colors group-hover/set:text-white/70" />
              </button>
            ) : null}
          </div>
          <div className="px-5 py-5">
          {morphMode && morphIcons.length > 0 && morphActiveKey ? (
            <MorphPlayground
              icons={morphIcons}
              activeKey={morphActiveKey}
              size={size}
              stroke={stroke}
              color={color}
              previewBg={previewBg}
              spring={spring}
              onPreviewBgChange={setPreviewBg}
              onSpringChange={setSpring}
              onSelect={onMorphSelect ?? (() => {})}
              onRemove={onMorphRemove ?? (() => {})}
              onReorder={onMorphReorder ?? (() => {})}
            />
          ) : (
            <>
              <div
                className={cn(
                  "relative grid h-44 place-items-center rounded-xl ring-1 ring-inset ring-white/[0.06]",
                  previewFrameClass,
                )}
              >
                {previewSrc ? (
                  <img
                    key={previewSrc}
                    src={previewSrc}
                    alt={focusedIcon.name}
                    className="transition-transform duration-150"
                    style={{
                      width: Math.min(previewCustomize.size * 2.2, 96),
                      height: Math.min(previewCustomize.size * 2.2, 96),
                    }}
                  />
                ) : null}
              </div>
            </>
          )}
            {morphMode ? null : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                ["transparent", "Clear"],
                ["white", "White"],
                ["dark", "Dark"],
                ["checker", "Grid"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPreviewBg(id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] transition-colors duration-150",
                  previewBg === id
                    ? "bg-white/[0.1] text-white"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          )}
          </div>
        </section>

        <div className="mx-5 h-px bg-white/[0.06]" />

        <Section
          title="Appearance"
          action={
            <button
              type="button"
              onClick={reset}
              className="text-[11px] text-white/40 transition-colors hover:text-white/70"
            >
              Reset
            </button>
          }
        >
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[13px] text-white/80">Size</label>
                <SliderValueInput
                  value={size}
                  min={SIZE_INPUT.min}
                  max={SIZE_INPUT.max}
                  ariaLabel="Size"
                  onCommit={setSize}
                />
              </div>
              <Slider
                min={SIZE_SLIDER.min}
                max={SIZE_SLIDER.max}
                step={SIZE_SLIDER.step}
                value={[
                  clampNumber(size, SIZE_SLIDER.min, SIZE_SLIDER.max),
                ]}
                onValueChange={(v) => setSize(v[0] ?? DEFAULT_CUSTOMIZE.size)}
              />
            </div>

            {morphMode || groupLabel !== "Filled" ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[13px] text-white/80">Stroke</label>
                <SliderValueInput
                  value={stroke}
                  min={STROKE_INPUT.min}
                  max={STROKE_INPUT.max}
                  decimals={2}
                  ariaLabel="Stroke"
                  onCommit={setStroke}
                />
              </div>
              <Slider
                min={STROKE_SLIDER.min}
                max={STROKE_SLIDER.max}
                step={STROKE_SLIDER.step}
                value={[
                  clampNumber(stroke, STROKE_SLIDER.min, STROKE_SLIDER.max),
                ]}
                onValueChange={(v) =>
                  setStroke(v[0] ?? DEFAULT_CUSTOMIZE.stroke)
                }
              />
            </div>
            ) : null}

            <div>
              <label className="mb-3 block text-[13px] text-white/80">
                Color
              </label>
              <div className="flex items-center gap-3">
                <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-white/15 transition-opacity duration-150 hover:opacity-90">
                  <span
                    className="absolute inset-0"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    aria-label="Color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.currentTarget as HTMLInputElement).blur();
                  }}
                  className="h-9 flex-1 rounded-md border-0 bg-white/[0.04] font-mono text-[13px] text-white/80 focus-visible:bg-white/[0.06]"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </Section>

        <div className="mx-5 h-px bg-white/[0.06]" />

        <Section title="Export">
          <div className="grid grid-cols-2 gap-2">
            {morphMode ? (
              <Button
                variant="outline"
                onClick={() => copyMorph("react")}
                disabled={!!copying}
                className="h-10 justify-center rounded-lg border-white/[0.1] bg-transparent text-[13px] text-white/85 hover:bg-white/[0.04]"
              >
                {copiedFormat === "react" ? (
                  <Check className="mr-1.5 size-3.5" />
                ) : null}
                Copy React
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => copyAs("svg")}
                disabled={!!copying}
                className="h-10 justify-center rounded-lg border-white/[0.1] bg-transparent text-[13px] text-white/85 hover:bg-white/[0.04]"
              >
                {copiedFormat === "svg" ? (
                  <Check className="mr-1.5 size-3.5" />
                ) : null}
                Copy SVG
              </Button>
            )}
            <Button
              variant="outline"
              onClick={downloadSvg}
              disabled={exportCount === 0}
              className="h-10 justify-center rounded-lg border-white/[0.1] bg-transparent text-[13px] text-white/85 hover:bg-white/[0.04]"
            >
              <Download className="mr-1.5 size-3.5" />
              {exportCount > 1 ? `Download ${exportCount}` : "Download"}
            </Button>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[12px] font-semibold text-white/40">
              {morphMode ? "Copy morph as" : "Copy as"}
            </div>
            {morphMode ? (
              <p className="mb-2 text-[11px] leading-4 text-white/35">
                morphicons — React, Vue, Svelte, React Native, HTML, Vanilla.
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {(morphMode ? MORPH_COPY_FORMATS : COPY_FORMATS).map((format) => {
                const busy = copying === format;
                const done = copiedFormat === format;
                const logo = morphMode
                  ? MORPH_COPY_LOGOS[format as MorphCopyFormat]
                  : COPY_FORMAT_LOGOS[format as CopyFormat];
                const setup = morphMode
                  ? MORPH_COPY_SETUP[format as MorphCopyFormat]
                  : COPY_FORMAT_SETUP[format as CopyFormat];
                const label = morphMode
                  ? MORPH_COPY_LABELS[format as MorphCopyFormat]
                  : COPY_FORMAT_LABELS[format as CopyFormat];
                const open = setupOpen === format;
                return (
                  <div key={format} className="rounded-[2px]">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={!!copying}
                        onClick={() =>
                          morphMode
                            ? copyMorph(format as MorphCopyFormat)
                            : copyAs(format as CopyFormat)
                        }
                        className="flex h-9 min-w-0 flex-1 items-center justify-between rounded-[2px] px-2.5 text-left text-[13px] text-white/70 transition-colors duration-150 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {logo ? (
                            <img
                              src={logo}
                              alt=""
                              className="size-4 shrink-0 object-contain"
                            />
                          ) : (
                            <span className="size-4 shrink-0 rounded-[2px] bg-white/10" />
                          )}
                          <span className="truncate">{label}</span>
                        </span>
                        {busy ? (
                          <Loader size="sm" />
                        ) : done ? (
                          <Check className="size-3.5 shrink-0 text-white" />
                        ) : null}
                      </button>
                      {setup ? (
                        <button
                          type="button"
                          aria-label={`How to run ${label}`}
                          aria-expanded={open}
                          onClick={() =>
                            setSetupOpen((current) =>
                              current === format ? null : format,
                            )
                          }
                          className={cn(
                            "inline-flex h-9 shrink-0 items-center rounded-[2px] px-2 text-[11px] transition-colors duration-150",
                            open
                              ? "bg-white/[0.08] text-white"
                              : "text-white/40 hover:bg-white/[0.04] hover:text-white/70",
                          )}
                        >
                          Setup
                        </button>
                      ) : null}
                    </div>
                    {setup && open ? (
                      <div className="mb-1 mt-0.5 space-y-2 rounded-[2px] bg-white/[0.03] px-2.5 py-2.5">
                        <div className="text-[11px] leading-4 text-white/45">
                          How to run
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-[2px] bg-black/40 px-2.5 py-2 font-mono text-[11px] leading-4 text-white/75">
                          {setup.install}
                        </pre>
                        <p className="text-[11px] leading-4 text-white/40">
                          {setup.usage}
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                setup.install,
                              );
                              setCopiedSetup(format);
                              toast.success("Copied install command");
                              window.setTimeout(
                                () => setCopiedSetup(null),
                                1400,
                              );
                            } catch {
                              toast.error("Failed to copy install command");
                            }
                          }}
                          className="inline-flex h-7 items-center gap-1.5 rounded-[2px] px-2 text-[11px] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          {copiedSetup === format ? (
                            <Check className="size-3" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          Copy install
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      </div>
    </>
  ) : (
    emptyBody
  );

  return (
    <aside
      className={cn(
        "z-40 flex h-full min-h-0 flex-col overflow-hidden bg-[#0b0b0b]",
        // Always visible on large screens; mobile sheet only when an icon is selected
        focusedIcon
          ? "fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border border-white/[0.08] shadow-2xl lg:relative lg:inset-auto lg:h-full lg:max-h-none lg:rounded-none lg:border-0 lg:border-l lg:border-[#2D2D2D] lg:shadow-none"
          : "hidden h-full border-l border-[#2D2D2D] lg:flex",
      )}
    >
      {focusedIcon ? (
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/15 lg:hidden" />
      ) : null}
      {body}
    </aside>
  );
}
