"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";
import JSZip from "jszip";
import { Check, Copy, Download, Heart, X } from "lucide-react";
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

type PreviewBg = "transparent" | "white" | "dark" | "checker";

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

const SET_ARROW_SRC = buildIconSvgUrl(
  {
    setId: "lucide-icons",
    styleId: "line",
    filePath: "arrow-right.svg",
  },
  { size: 12, stroke: 2, color: "#d4d4d4" },
);

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
}: {
  focusedIcon: IconExportRef | null;
  selectedIcons: IconExportRef[];
  selectedCount: number;
  setLabel?: string | null;
  /** Line / Fill (or similar) — shown on the preview. */
  groupLabel?: string | null;
  favorited: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onCopySvg?: () => void;
  /** Jump to this icon's library and clear search. */
  onSelectSet?: (setId: string) => void;
  customizeRef?: React.MutableRefObject<{
    copySvg: () => Promise<void>;
    download: () => Promise<void>;
    getCustomize: () => IconExportCustomize;
  } | null>;
}) {
  const [size, setSize] = React.useState(DEFAULT_CUSTOMIZE.size);
  const [stroke, setStroke] = React.useState(DEFAULT_CUSTOMIZE.stroke);
  const [color, setColor] = React.useState(DEFAULT_CUSTOMIZE.color);
  const [previewBg, setPreviewBg] = React.useState<PreviewBg>("dark");
  const [copying, setCopying] = React.useState<CopyFormat | null>(null);
  const [copiedFormat, setCopiedFormat] = React.useState<CopyFormat | null>(
    null,
  );
  const [setupOpen, setSetupOpen] = React.useState<CopyFormat | null>(null);
  const [copiedSetup, setCopiedSetup] = React.useState<CopyFormat | null>(null);

  const previewCustomize = useDebouncedValue({ size, stroke, color }, 80);
  const previewSrc = focusedIcon
    ? buildIconSvgUrl(focusedIcon, previewCustomize)
    : null;

  const getCustomize = React.useCallback(
    (): IconExportCustomize => ({ size, stroke, color }),
    [size, stroke, color],
  );

  const reset = () => {
    setSize(DEFAULT_CUSTOMIZE.size);
    setStroke(DEFAULT_CUSTOMIZE.stroke);
    setColor(DEFAULT_CUSTOMIZE.color);
  };

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

  const downloadSvg = React.useCallback(async () => {
    if (selectedCount === 0) return;
    const customize = getCustomize();
    const zip = new JSZip();

    toast.loading("Preparing download...", { id: "download-zip" });

    try {
      const svgs = await Promise.all(
        selectedIcons.map(async (icon) => {
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
        selectedIcons.length === 1
          ? `${selectedIcons[0]?.name ?? "icon"}.svg`
          : `icons-${selectedIcons.length}.zip`;

      if (selectedIcons.length === 1) {
        const blob = new Blob([svgs[0]?.svg ?? ""], {
          type: "image/svg+xml",
        });
        const singleUrl = URL.createObjectURL(blob);
        a.href = singleUrl;
        a.download = `${selectedIcons[0]?.name ?? "icon"}.svg`;
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
        `Downloaded ${selectedIcons.length} icon${selectedIcons.length > 1 ? "s" : ""}`,
        { id: "download-zip" },
      );
    } catch (error) {
      toast.error("Failed to download icons", {
        description:
          error instanceof Error ? error.message : "Unknown error",
        id: "download-zip",
      });
    }
  }, [getCustomize, selectedCount, selectedIcons]);

  React.useEffect(() => {
    if (!customizeRef) return;
    customizeRef.current = {
      copySvg: () => copyAs("svg"),
      download: downloadSvg,
      getCustomize,
    };
    return () => {
      customizeRef.current = null;
    };
  }, [copyAs, customizeRef, downloadSvg, getCustomize]);

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
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 px-5">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium tracking-tight text-white">
            {focusedIcon.name}
          </div>
          <div className="truncate text-[12px] text-white/40">
            {setLabel ?? focusedIcon.setId}
            {selectedCount > 1
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

      <div className="flex-1 overflow-auto">
        <Section
          title="Preview"
          action={
            setLabel || focusedIcon.setId ? (
              <button
                type="button"
                onClick={() => onSelectSet?.(focusedIcon.setId)}
                title={`Open ${setLabel ?? focusedIcon.setId}`}
                className="group/set inline-flex max-w-[13rem] items-center gap-1 text-[11px] font-medium text-white/55 transition-colors duration-150 hover:text-white"
              >
                <span className="truncate">{setLabel ?? focusedIcon.setId}</span>
                <img
                  src={SET_ARROW_SRC}
                  alt=""
                  width={12}
                  height={12}
                  className="size-3 shrink-0 opacity-50 transition-opacity duration-150 group-hover/set:opacity-90"
                />
              </button>
            ) : null
          }
        >
          <div
            className={cn(
              "relative grid h-44 place-items-center rounded-xl ring-1 ring-inset ring-white/[0.06]",
              previewFrameClass,
            )}
          >
            {groupLabel ? (
              <span className="absolute right-3 top-3 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-white/85 ring-1 ring-white/10 backdrop-blur-sm">
                {groupLabel}
              </span>
            ) : null}
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
        </Section>

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
                <span className="font-mono text-[11px] text-white/45">
                  {size}
                </span>
              </div>
              <Slider
                min={12}
                max={64}
                step={1}
                value={[size]}
                onValueChange={(v) => setSize(v[0] ?? DEFAULT_CUSTOMIZE.size)}
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-[13px] text-white/80">Stroke</label>
                <span className="font-mono text-[11px] text-white/45">
                  {stroke}
                </span>
              </div>
              <Slider
                min={0.5}
                max={4}
                step={0.5}
                value={[stroke]}
                onValueChange={(v) =>
                  setStroke(v[0] ?? DEFAULT_CUSTOMIZE.stroke)
                }
              />
            </div>

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
            <Button
              variant="outline"
              onClick={downloadSvg}
              disabled={selectedCount === 0}
              className="h-10 justify-center rounded-lg border-white/[0.1] bg-transparent text-[13px] text-white/85 hover:bg-white/[0.04]"
            >
              <Download className="mr-1.5 size-3.5" />
              {selectedCount > 1 ? `Download ${selectedCount}` : "Download"}
            </Button>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[12px] font-semibold text-white/40">
              Copy as
            </div>
            <div className="flex flex-col gap-0.5">
              {COPY_FORMATS.map((format) => {
                const busy = copying === format;
                const done = copiedFormat === format;
                const logo = COPY_FORMAT_LOGOS[format];
                const setup = COPY_FORMAT_SETUP[format];
                const open = setupOpen === format;
                return (
                  <div key={format} className="rounded-[2px]">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={!!copying}
                        onClick={() => copyAs(format)}
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
                          <span className="truncate">
                            {COPY_FORMAT_LABELS[format]}
                          </span>
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
                          aria-label={`How to run ${COPY_FORMAT_LABELS[format]}`}
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
