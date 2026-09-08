"use client";

import * as React from "react";
import { Check, ChevronDown, Copy, X } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { Mask } from "@/components/ui/mask";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BundledLanguage } from "shiki";
import {
  CLI_RUNNER_PREFIX,
  CLI_RUNNERS,
  type CliRunner,
} from "@/lib/icon-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ClientTab = "cursor" | "claude" | "opencode" | "codex";
type InstallRunner = CliRunner | "bash";

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

const INSTALL_RUNNERS: { id: InstallRunner; label: string; logo?: string }[] = [
  ...CLI_RUNNERS,
  { id: "bash", label: "bash", logo: "/package-managers/bash.svg" },
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
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:text-foreground"
    >
      {copied ? <Check className="size-4 text-foreground" /> : <Copy className="size-4" />}
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
  const [cliRunner, setCliRunner] = React.useState<InstallRunner>("npx");
  const [origin, setOrigin] = React.useState("https://icons.leularia.com");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const cliCommand =
    cliRunner === "bash"
      ? `curl -fsSL ${origin}/install.sh | bash`
      : `${CLI_RUNNER_PREFIX[cliRunner]} setup`;

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
    const name = encodeURIComponent("aria-icons");
    const encoded = encodeURIComponent(base64Config);
    window.location.href = `cursor://anysphere.cursor-deeplink/mcp/install?name=${name}&config=${encoded}`;
  };

  return (
    <Mask
      open={open}
      onOpenChange={onOpenChange}
      dismissible
      variant="blur"
      className="flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        className={cn(
          "relative flex max-h-[min(640px,calc(100vh-2rem))] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl",
          "border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-100"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcp-dialog-title"
      >
        <div className="flex shrink-0 items-start gap-2 border-b border-border px-2 pl-6 pt-4 pb-4">
          <div className="min-w-0 flex-1 py-2 pr-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.svg"
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0"
              />
              <h2
                id="mcp-dialog-title"
                className="text-[18px] font-semibold leading-7 tracking-tight text-foreground"
              >
                Connect Aria Icons
              </h2>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-foreground/50">
              Remote MCP, or install the CLI with npx, bunx, or a bash one-liner.
            </p>
          </div>
          <div className="pr-1.5 pt-1.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-2">
          <section className="pb-5">
            <h3 className="mb-2 text-[14px] font-medium leading-5 text-foreground">
              Server URL
            </h3>
            <div className="flex h-12 items-center gap-1 rounded-[2px] border border-border bg-transparent pl-4 pr-1.5">
              <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground/80">
                {mcpUrl}
              </code>
              <CopyIconButton
                value={mcpUrl}
                successLabel="Copied server URL"
              />
            </div>
          </section>

          <section className="pb-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[14px] font-medium leading-5 text-foreground">
                Install CLI
              </h3>
              <InstallRunnerDropdown
                value={cliRunner}
                onChange={setCliRunner}
              />
            </div>
            <div className="relative overflow-hidden rounded-[2px] border border-border bg-background/30">
              <div className="absolute right-1 top-1 z-10">
                <CopyIconButton
                  value={cliCommand}
                  successLabel="Copied install command"
                />
              </div>
              <CodeBlock
                key={cliCommand}
                code={cliCommand}
                lang="bash"
                className="code-block-wrap max-h-none overflow-x-hidden p-3 pr-11 text-[13px] [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-0 [&_.line::before]:mr-2.5 [&_.line::before]:w-auto [&_.line::before]:content-['$']! [&_.line::before]:text-foreground/35"
              />
            </div>
          </section>

          <section className="pb-5">
            <h3 className="mb-1 text-[14px] font-medium leading-5 text-foreground">
              Manual setup
            </h3>

            <div
              role="tablist"
              aria-label="Client"
              className="relative flex overflow-x-auto border-b border-border"
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
                      "relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-[13px] font-medium transition-colors sm:px-4 sm:text-[14px]",
                      selected
                        ? "text-foreground shadow-[inset_0_-2px_0_0_currentColor]"
                        : "text-foreground/45 hover:text-foreground/80",
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
              className="relative mt-3 overflow-hidden rounded-[2px] border border-border bg-background/30"
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
            <h3 className="mb-2 text-[14px] font-medium leading-5 text-foreground">
              Example prompts
            </h3>
            <ul className="divide-y divide-border overflow-hidden rounded-[2px] border border-border bg-transparent">
              {[
                "Search for a minimal outline calendar icon",
                "Get lucide:house as a React component",
                "Add lucide:house to this project",
              ].map((prompt) => (
                <li
                  key={prompt}
                  className="px-4 py-3 text-[13px] leading-5 text-foreground/55"
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-3 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 min-w-[64px] rounded-[5px] px-4 text-[14px] font-medium text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={addToCursor}
            className="inline-flex h-10 min-w-[64px] items-center justify-center gap-2 rounded-[5px] bg-foreground px-5 text-[14px] font-medium text-background transition-colors hover:bg-foreground/90"
          >
            <img
              src="/cursor.svg"
              alt=""
              width={14}
              height={16}
              className="brightness-0 invert dark:invert-0"
            />
            Add to Cursor
          </button>
        </div>
      </div>
    </Mask>
  );
}

function InstallRunnerDropdown({
  value,
  onChange,
}: {
  value: InstallRunner;
  onChange: (value: InstallRunner) => void;
}) {
  const selected =
    INSTALL_RUNNERS.find((item) => item.id === value) ?? INSTALL_RUNNERS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Install runner"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[2px] border border-border bg-foreground/[0.04] px-2.5 text-[12px] text-foreground/80 transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
        >
          {selected?.logo ? (
            <img
              src={selected.logo}
              alt=""
              className="size-3.5 shrink-0 object-contain"
            />
          ) : null}
          <span className="font-mono">{selected?.label}</span>
          <ChevronDown className="size-3 shrink-0 text-foreground/40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[8rem] border-border bg-popover/90 text-foreground backdrop-blur-md"
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as InstallRunner)}
        >
          {INSTALL_RUNNERS.map((item) => (
            <DropdownMenuRadioItem
              key={item.id}
              value={item.id}
              className="gap-2 text-[12px] text-foreground/75"
            >
              {item.logo ? (
                <img
                  src={item.logo}
                  alt=""
                  className="size-3.5 shrink-0 object-contain"
                />
              ) : null}
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
