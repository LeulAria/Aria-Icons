"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Mask } from "@/components/ui/mask";
import { cn } from "@/lib/utils";

export type CommandItem = {
  id: string;
  label: string;
  shortcut?: string;
  group?: string;
  disabled?: boolean;
  onSelect: () => void;
};

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
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
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
      className="flex items-start justify-center px-4 pt-[18vh]"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
          <Search className="size-4 shrink-0 text-white/40" />
          <input
            ref={inputRef}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search icons & commands…"
            className="h-12 w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/35">
            Esc
          </kbd>
        </div>

        <div className="max-h-[min(50vh,360px)] overflow-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-white/40">
              No matching commands
            </div>
          ) : (
            filtered.map((cmd, index) => (
              <button
                key={cmd.id}
                type="button"
                disabled={cmd.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  if (cmd.disabled) return;
                  cmd.onSelect();
                  onOpenChange(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors duration-100",
                  index === activeIndex
                    ? "bg-white/[0.08] text-white"
                    : "text-white/70 hover:bg-white/[0.04]",
                  cmd.disabled && "opacity-40",
                )}
              >
                <div className="min-w-0">
                  {cmd.group ? (
                    <div className="mb-0.5 text-[10px] uppercase tracking-[0.06em] text-white/30">
                      {cmd.group}
                    </div>
                  ) : null}
                  <div className="truncate">{cmd.label}</div>
                </div>
                {cmd.shortcut ? (
                  <kbd className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/35">
                    {cmd.shortcut}
                  </kbd>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>
    </Mask>
  );
}
