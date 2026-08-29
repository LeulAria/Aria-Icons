import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CONFIG_FILE } from "./constants.ts";
import { defaultOutDir, detectFramework } from "./detect.ts";
import type { AriaIconsConfig, Framework } from "./types.ts";
import { writeJsonFile } from "./utils.ts";

export function configPath(cwd = process.cwd()): string {
  return join(cwd, CONFIG_FILE);
}

export function loadConfig(cwd = process.cwd()): AriaIconsConfig {
  const path = configPath(cwd);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as AriaIconsConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: AriaIconsConfig, cwd = process.cwd()): string {
  const path = configPath(cwd);
  writeJsonFile(path, config);
  return path;
}

export function resolveProjectSettings(overrides?: {
  framework?: Framework;
  outDir?: string;
  api?: string;
}): { framework: Framework; outDir: string; api?: string; defaultCollection?: string } {
  const file = loadConfig();
  const framework = overrides?.framework ?? file.framework ?? detectFramework();
  return {
    framework,
    outDir: overrides?.outDir ?? file.outDir ?? defaultOutDir(framework),
    api: overrides?.api ?? file.api,
    defaultCollection: file.defaultCollection,
  };
}
