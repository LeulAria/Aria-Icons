"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Indicator = { left: number; width: number };

function sameRect(a: Indicator, b: Indicator) {
  return Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5;
}

export function UnderlineTabs<T extends string>({
  value,
  onChange,
  items,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  items: readonly { id: T; label: string; ariaLabel?: string }[];
  ariaLabel: string;
  className?: string;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const indicatorRef = React.useRef<HTMLSpanElement>(null);
  const posRef = React.useRef<Indicator>({ left: 0, width: 0 });
  const visualRef = React.useRef(value);
  const pendingRef = React.useRef<T | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const commitRafRef = React.useRef<number | null>(null);
  const [visualValue, setVisualValue] = React.useState(value);

  visualRef.current = visualValue;

  const writeIndicator = React.useCallback(
    (next: Indicator, animate: boolean) => {
      const el = indicatorRef.current;
      if (!el) return;
      if (sameRect(posRef.current, next)) return;
      posRef.current = next;
      el.style.width = `${next.width}px`;
      el.style.transition = animate
        ? "transform 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)"
        : "none";
      el.style.transform = `translate3d(${next.left}px,0,0)`;
    },
    [],
  );

  const measure = React.useCallback((id: string, animate: boolean) => {
    const tab = tabRefs.current.get(id);
    if (!tab) return;
    writeIndicator({ left: tab.offsetLeft, width: tab.offsetWidth }, animate);
  }, [writeIndicator]);

  const measureFrame = React.useCallback(
    (id: string, animate: boolean) => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        measure(id, animate);
      });
    },
    [measure],
  );

  React.useEffect(() => {
    if (value === visualValue) {
      pendingRef.current = null;
      return;
    }
    if (pendingRef.current != null) return;
    setVisualValue(value);
    measureFrame(value, true);
  }, [value, visualValue, measureFrame]);

  React.useLayoutEffect(() => {
    measure(visualRef.current, false);
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => {
      measureFrame(visualRef.current, false);
    });
    observer.observe(list);
    for (const tab of tabRefs.current.values()) observer.observe(tab);
    return () => {
      observer.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (commitRafRef.current != null) cancelAnimationFrame(commitRafRef.current);
    };
  }, [measure, measureFrame, items.length]);

  const select = (id: T) => {
    if (id === visualValue) return;
    setVisualValue(id);
    measure(id, true);
    pendingRef.current = id;
    if (commitRafRef.current != null) cancelAnimationFrame(commitRafRef.current);
    commitRafRef.current = requestAnimationFrame(() => {
      commitRafRef.current = requestAnimationFrame(() => {
        commitRafRef.current = null;
        if (pendingRef.current !== id) return;
        pendingRef.current = null;
        onChange(id);
      });
    });
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn("relative flex", className)}
    >
      {items.map((tab) => {
        const selected = visualValue === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={tab.ariaLabel}
            ref={(node) => {
              if (node) tabRefs.current.set(tab.id, node);
              else tabRefs.current.delete(tab.id);
            }}
            onClick={() => select(tab.id)}
            className={cn(
              "relative z-10 h-9 px-3 text-[13px] font-medium transition-colors duration-200",
              selected ? "text-white" : "text-white/45 hover:text-white/80",
            )}
          >
            {tab.label}
          </button>
        );
      })}
      <span
        ref={indicatorRef}
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-white will-change-transform"
      />
    </div>
  );
}
