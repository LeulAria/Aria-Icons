import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname } from "node:path";
import type { McpConfig } from "./types.ts";

export function shortenPath(fullPath: string): string {
  const home = homedir();
  const cwd = process.cwd();
  if (fullPath.startsWith(cwd)) {
    return "." + fullPath.slice(cwd.length);
  }
  if (fullPath.startsWith(home)) {
    return fullPath.replace(home, "~");
  }
  return fullPath;
}

export function readJsonFile(path: string): McpConfig {
  try {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf-8")) as McpConfig;
    }
  } catch {
    // File doesn't exist or is invalid JSON
  }
  return {};
}

export function writeJsonFile(path: string, data: unknown): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

export function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function toKebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function toSnakeCase(name: string): string {
  return toKebabCase(name).replace(/-/g, "_");
}
