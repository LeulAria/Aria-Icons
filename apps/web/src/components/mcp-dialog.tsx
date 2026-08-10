"use client";

import * as React from "react";
import { Check, Copy, X } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { Mask } from "@/components/ui/mask";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BundledLanguage } from "shiki";

type ClientTab = "cursor" | "claude" | "opencode" | "codex";

const TABS: {
  id: ClientTab;
  label: string;
  lang: BundledLanguage;
  icon: string;
}[] = [
  { id: "cursor", label: "Cursor", lang: "json", icon: "/cursor.svg" },
  { id: "claude", label: "Claude Code", lang: "bash", icon: "/claude.svg" },
  { id: "opencode", label: "OpenCode", lang: "json", icon: "/opencode.svg" },
  { id: "codex", label: "Codex", lang: "toml", icon: "/codex.svg" },
];

function useMcpUrl() {
  const [url, setUrl] = React.useState("/api/mcp");
  React.useEffect(() => {
    setUrl(`${window.location.origin}/api/mcp`);
  }, []);
  return url;
}

function CopyIconButton({
  value,
  successLabel,
}: {
  value: string;
  successLabel: string;
}) {
  const [copied, setCopied] = React.useState(false);

  return (
    <button
      type="button"
      aria-label="Copy"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(successLabel);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
    >
      {copied ? <Check className="size-4 text-white" /> : <Copy className="size-4" />}
    </button>
  );
}

export function McpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mcpUrl = useMcpUrl();
  const [tab, setTab] = React.useState<ClientTab>("cursor");

  const configs = React.useMemo(() => {
    const cursor = `{
  "mcpServers": {
    "aria-icons": {
      "url": "${mcpUrl}"
    }
  }
}`;
    const claude = `claude mcp add --transport http aria-icons ${mcpUrl}`;
    const opencode = `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "Aria Icons": {
      "type": "remote",
      "url": "${mcpUrl}",
      "enabled": true
    }
  }
}`;
    const codex = `[mcp_servers.aria-icons]
url = "${mcpUrl}"`;
    return { cursor, claude, opencode, codex } as const;
  }, [mcpUrl]);

  const activeConfig = configs[tab];
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  const addToCursor = () => {
    const config = { url: mcpUrl };
    const base64Config = btoa(JSON.stringify(config));
    window.location.href = `cursor://anysphere.cursor-deeplink/mcp/install?name=Aria%20Icons&config=${encodeURIComponent(base64Config)}`;
  };

  return (
    <Mask
      open={open}
      onOpenChange={onOpenChange}
      dismissible
      variant="blur"
      className="flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        className={cn(
          "relative flex max-h-[min(640px,calc(100vh-2rem))] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl",
          "border border-white/10 bg-[#111]/90 shadow-2xl backdrop-blur-[2px]",
          "animate-in fade-in-0 zoom-in-95 duration-100"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcp-dialog-title"
      >
        <div className="flex shrink-0 items-start gap-2 border-b border-[#333] px-2 pl-6 pt-4 pb-4">
          <div className="min-w-0 flex-1 py-2 pr-2">
            <h2
              id="mcp-dialog-title"
              className="text-[18px] font-semibold leading-7 tracking-tight text-white"
            >
              Connect Aria Icons
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-white/50">
              Use Aria Icons from Cursor or any MCP-compatible client.
            </p>
          </div>
          <div className="pr-1.5 pt-1.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#222] text-white/70 transition-colors hover:bg-[#333] hover:text-white"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-2">
          <section className="pb-5">
            <h3 className="mb-2 text-[14px] font-medium leading-5 text-white">
              Server URL
            </h3>
            <div className="flex h-12 items-center gap-1 rounded-[2px] border border-white/10 bg-transparent pl-4 pr-1.5">
              <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-white/80">
                {mcpUrl}
              </code>
              <CopyIconButton
                value={mcpUrl}
                successLabel="Copied server URL"
              />
            </div>
          </section>

          <section className="pb-5">
            <h3 className="mb-1 text-[14px] font-medium leading-5 text-white">
              Manual setup
            </h3>

            <div
              role="tablist"
              aria-label="Client"
              className="flex overflow-x-auto border-b border-white/10"
            >
              {TABS.map((t) => {
                const selected = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "inline-flex h-11 shrink-0 items-center gap-2 px-3 text-[13px] font-medium transition-colors sm:px-4 sm:text-[14px]",
                      selected
                        ? "border-b-2 border-white text-white"
                        : "border-b-2 border-transparent text-white/45 hover:text-white/80"
                    )}
                  >
                    <img
                      src={t.icon}
                      alt=""
                      width={14}
                      height={14}
                      className={cn(
                        "size-3.5 shrink-0 object-contain",
                        !selected && "opacity-55",
                      )}
                    />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              className="relative mt-3 overflow-hidden rounded-[2px] border border-white/10 bg-black/30"
            >
              <div className="absolute right-1 top-1 z-10">
                <CopyIconButton
                  value={activeConfig}
                  successLabel="Copied configuration"
                />
              </div>
              <CodeBlock
                key={tab}
                code={activeConfig}
                lang={activeTab.lang}
              />
            </div>
          </section>

          <section className="pb-4">
            <h3 className="mb-2 text-[14px] font-medium leading-5 text-white">
              Example prompts
            </h3>
            <ul className="divide-y divide-white/10 overflow-hidden rounded-[2px] border border-white/10 bg-transparent">
              {[
                "List all available icons",
                "Get the SVG for heroicons-academic-cap",
                'Search icons named "arrow"',
              ].map((prompt) => (
                <li
                  key={prompt}
                  className="px-4 py-3 text-[13px] leading-5 text-white/55"
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#333] px-3 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 min-w-[64px] rounded-[5px] px-4 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={addToCursor}
            className="inline-flex h-10 min-w-[64px] items-center justify-center gap-2 rounded-[5px] bg-white px-5 text-[14px] font-medium text-black transition-colors hover:bg-white/90"
          >
            <img
              src="/cursor.svg"
              alt=""
              width={14}
              height={16}
              className="brightness-0"
            />
            Add to Cursor
          </button>
        </div>
      </div>
    </Mask>
  );
}
