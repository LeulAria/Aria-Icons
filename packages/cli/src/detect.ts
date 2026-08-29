import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Framework } from "./types.ts";

type Pkg = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function readPackageJson(cwd: string): Pkg | null {
  const path = join(cwd, "package.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Pkg;
  } catch {
    return null;
  }
}

function hasDep(pkg: Pkg, name: string): boolean {
  return Boolean(pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
}

export function detectFramework(cwd = process.cwd()): Framework {
  if (existsSync(join(cwd, "pubspec.yaml"))) return "flutter";

  const pkg = readPackageJson(cwd);
  if (pkg) {
    if (hasDep(pkg, "react-native") || hasDep(pkg, "expo")) return "react-native";
    if (hasDep(pkg, "solid-js")) return "solid";
    if (hasDep(pkg, "svelte") || hasDep(pkg, "@sveltejs/kit")) return "svelte";
    if (hasDep(pkg, "vue") || hasDep(pkg, "nuxt")) return "vue";
    if (hasDep(pkg, "react") || hasDep(pkg, "next")) return "react";
  }
  return "react";
}

export function defaultOutDir(framework: Framework): string {
  switch (framework) {
    case "svelte":
      return "src/lib/icons";
    case "flutter":
      return "lib/icons";
    default:
      return "src/components/icons";
  }
}

export function detectImportAlias(cwd: string, outDir: string): string {
  const tsconfigPath = join(cwd, "tsconfig.json");
  const posixOut = outDir.replaceAll("\\", "/").replace(/^\.\//, "");

  if (existsSync(tsconfigPath)) {
    try {
      const raw = readFileSync(tsconfigPath, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "");
      const json = JSON.parse(raw) as { compilerOptions?: { paths?: Record<string, string[]> } };
      const paths = json.compilerOptions?.paths ?? {};
      if (paths["@/*"]?.[0]) {
        const mapped = paths["@/*"][0].replace(/^\.\//, "").replace(/\*$/, "");
        if (posixOut.startsWith(mapped)) {
          const rest = posixOut.slice(mapped.length).replace(/^\//, "");
          return rest ? `@/${rest}` : "@";
        }
      }
    } catch {
      // fall through
    }
  }

  return `./${posixOut}`.replace(/^\.\/src\//, "@/");
}
