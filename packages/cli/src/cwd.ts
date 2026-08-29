import { existsSync } from "node:fs";

function isNpxCache(dir: string): boolean {
  return dir.includes("_npx") || dir.includes(".npm/_npx") || dir.includes(".bun/install/cache");
}

/** Prefer the user's project over an npx extract / MCP server cache. */
export function resolveWriteCwd(explicit?: string): string {
  const candidates = [explicit, process.env.ARIA_ICONS_CWD, process.env.INIT_CWD, process.cwd()].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const dir of candidates) {
    if (!existsSync(dir)) continue;
    if (isNpxCache(dir)) continue;
    return dir;
  }

  return process.cwd();
}
