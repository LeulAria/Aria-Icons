"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Mask } from "@/components/ui/mask";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "aria-icons:welcome-seen";

export function WelcomeDialog({
  onConnectMcp,
}: {
  onConnectMcp?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "1") {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = React.useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const handleConnectMcp = React.useCallback(() => {
    dismiss();
    onConnectMcp?.();
  }, [dismiss, onConnectMcp]);

  return (
    <Mask
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
      dismissible
      variant="blur"
      className="flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px]"
    >
      <div
        className={cn(
          "relative flex aspect-[6/4] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-100"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
      >
        <img
          src="/welcome-icons.png"
          alt=""
          className="absolute inset-0 size-full object-cover object-top"
          draggable={false}
        />

        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(34,34,34,0.95)_0%,rgba(34,34,34,0.7)_35%,transparent_70%)]"
          aria-hidden
        />

        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3.5 top-3.5 z-10 flex size-8 items-center justify-center rounded-full bg-[#444] text-white/70 transition-colors hover:bg-[#555] hover:text-white"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="relative z-[1] mt-auto px-8 pb-10 pt-24 text-center">
          <img
            src="/logo.svg"
            alt=""
            width={36}
            height={36}
            className="mx-auto mb-3 size-9"
          />
          <p
            id="welcome-title"
            className="text-[1.65rem] font-semibold tracking-tight text-white"
          >
            Aria Icons
          </p>
          <p className="mx-auto mt-3 max-w-[20rem] text-[14px] leading-relaxed text-white/60">
            Browse curated sets. Shape size, stroke, and color then copy or
            download in a click.
          </p>

          <div className="mt-7 flex items-center justify-center gap-3">
            <Button
              size="lg"
              variant="ghost"
              onClick={handleConnectMcp}
              className="px-5 text-white/70 hover:text-white"
            >
              Connect MCP
            </Button>
            <Button
              size="lg"
              onClick={dismiss}
              className="px-7 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started
            </Button>
          </div>
        </div>
      </div>
    </Mask>
  );
}
