"use client";

import * as React from "react";
import { Mask } from "@/components/ui/mask";
import { cn } from "@/lib/utils";
import { buildIconSvgUrl } from "@/lib/icon-export";

export type CommandItem = {
  id: string;
  label: string;
  shortcut?: string;
  group?: string;
  disabled?: boolean;
  onSelect: () => void;
};

const SEARCH_ICON_SRC = buildIconSvgUrl(
  {
    setId: "lucide-icons",
    styleId: "line",
    filePath: "search.svg",
  },
  { size: 18, stroke: 1.75, color: "#d4d4d4" },
);

function shortcutParts(shortcut: string) {
  if (shortcut.startsWith("⌘") && shortcut.length > 1) {
    return ["⌘", shortcut.slice(1)];
  }
  return [shortcut];
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] px-1 font-sans text-[10px] leading-none text-white/45">
      {children}
    </kbd>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
  commands,
  searchValue,
  onSearchChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: CommandItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.group?.toLowerCase().includes(q),
    );
  }, [commands, searchValue]);

  const groups = React.useMemo(() => {
    const next: { name: string; items: { cmd: CommandItem; index: number }[] }[] =
      [];
    const map = new Map<string, { cmd: CommandItem; index: number }[]>();
    filtered.forEach((cmd, index) => {
      const name = cmd.group ?? "Commands";
      let items = map.get(name);
      if (!items) {
        items = [];
        map.set(name, items);
        next.push({ name, items });
      }
      items.push({ cmd, index });
    });
    return next;
  }, [filtered]);

  React.useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [searchValue]);

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[activeIndex];
        if (cmd && !cmd.disabled) {
          cmd.onSelect();
          onOpenChange(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filtered, onOpenChange, open]);

  if (!open) return null;

  return (
    <Mask
      open={open}
      onOpenChange={onOpenChange}
      dismissible
      variant="blur"
      className="flex items-start justify-center bg-black/50 px-4 pt-[16vh] backdrop-blur-md"
    >
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        className="animate-in fade-in-0 zoom-in-95 w-full max-w-[40rem] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#101010]/90 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.06)] duration-150 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4">
          <img
            src={SEARCH_ICON_SRC}
            alt=""
            width={18}
            height={18}
            className="size-[18px] shrink-0 opacity-55"
          />
          <input
            ref={inputRef}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search icons & commands…"
            className="w-full bg-transparent py-3.5 text-[15px] tracking-tight text-white outline-none placeholder:text-white/30"
          />
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <Kbd>Esc</Kbd>
          </button>
        </div>

        <div className="mx-4 h-px bg-white/[0.06]" />

        <div
          ref={listRef}
          className="max-h-[min(52vh,380px)] overflow-auto px-2 py-2"
        >
          {filtered.length === 0 ? (
            <div className="grid place-items-center px-3 py-10 text-center">
              <img
                src={SEARCH_ICON_SRC}
                alt=""
                width={20}
                height={20}
                className="mb-3 size-5 opacity-30"
              />
              <div className="text-[13px] text-white/50">No matching commands</div>
              <div className="mt-1 text-[12px] text-white/30">
                Try a different name or shortcut
              </div>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.name} className="mb-1 last:mb-0">
                <div className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-white/28">
                  {group.name}
                </div>
                {group.items.map(({ cmd, index }) => (
                  <button
                    key={cmd.id}
                    type="button"
                    data-index={index}
                    disabled={cmd.disabled}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      if (cmd.disabled) return;
                      cmd.onSelect();
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors duration-100",
                      index === activeIndex
                        ? "bg-white/[0.08] text-white"
                        : "text-white/70",
                      cmd.disabled && "opacity-40",
                    )}
                  >
                    <span className="min-w-0 truncate">{cmd.label}</span>
                    {cmd.shortcut ? (
                      <span className="flex shrink-0 items-center gap-0.5">
                        {shortcutParts(cmd.shortcut).map((part) => (
                          <Kbd key={part}>{part}</Kbd>
                        ))}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-white/30">
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="ml-0.5">navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↵</Kbd>
              <span className="ml-0.5">select</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Esc</Kbd>
            <span className="ml-0.5">close</span>
          </span>
        </div>
      </div>
    </Mask>
  );
}
