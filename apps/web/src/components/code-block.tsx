"use client";

import * as React from "react";
import { codeToHtml, type BundledLanguage } from "shiki";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  lang,
  className,
}: {
  code: string;
  lang: BundledLanguage;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [html, setHtml] = React.useState<string | null>(null);
  const theme = resolvedTheme === "light" ? "github-light-default" : "github-dark-default";

  React.useEffect(() => {
    let cancelled = false;

    codeToHtml(code, {
      lang,
      theme,
      transformers: [
        {
          line(node, line) {
            node.properties["data-line"] = String(line);
          },
        },
      ],
    })
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });

    return () => {
      cancelled = true;
    };
  }, [code, lang, theme]);

  if (!html) {
    return (
      <pre
        className={cn(
          "max-h-[180px] overflow-auto whitespace-pre-wrap break-all p-4 pr-11 font-mono text-[12px] leading-[1.55] text-foreground/70",
          className,
        )}
      >
        {code}
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "code-block max-h-[180px] overflow-auto text-[12px] leading-[1.55] [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:pr-11 [&_code]:font-mono",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
