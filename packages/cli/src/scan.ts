import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { toKebabCase } from "./utils.ts";

const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".git",
  ".turbo",
  "coverage",
  ".svelte-kit",
  "out",
]);

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte", ".mjs", ".cjs"]);

export type DetectedIcon = {
  file: string;
  library: string;
  collection: string;
  importName: string;
  iconName: string;
  specifier: string;
};

export type LibraryStats = {
  library: string;
  collection: string;
  count: number;
};

const LIBRARY_MAP: Array<{
  test: (spec: string) => boolean;
  library: string;
  collection: string;
  toName: (imported: string) => string;
}> = [
  {
    test: (s) => s === "lucide-react" || s === "lucide-vue-next" || s === "lucide-svelte",
    library: "lucide-react",
    collection: "lucide",
    toName: (n) =>
      pascalToKebab(n.replace(/Icon$/, "").replace(/([A-Za-z])(\d+)$/, "$1-$2")),
  },
  {
    test: (s) => s.startsWith("@heroicons/"),
    library: "@heroicons",
    collection: "heroicons",
    toName: (n) => pascalToKebab(n.replace(/Icon$/, "")),
  },
  {
    test: (s) => s.startsWith("@tabler/icons"),
    library: "@tabler/icons-react",
    collection: "tabler",
    toName: (n) => pascalToKebab(n.replace(/^Icon/, "")),
  },
  {
    test: (s) => s.startsWith("@phosphor-icons/") || s === "phosphor-react",
    library: "phosphor",
    collection: "ph",
    toName: pascalToKebab,
  },
  {
    test: (s) => s.startsWith("react-icons/fa"),
    library: "react-icons/fa",
    collection: "fa6-solid",
    toName: (n) => pascalToKebab(n.replace(/^Fa/, "")),
  },
  {
    test: (s) => s.startsWith("react-icons/md"),
    library: "react-icons/md",
    collection: "mdi",
    toName: (n) => pascalToKebab(n.replace(/^Md/, "")),
  },
  {
    test: (s) => s.startsWith("react-icons/hi"),
    library: "react-icons/hi",
    collection: "heroicons",
    toName: (n) => pascalToKebab(n.replace(/^Hi2?/, "")),
  },
  {
    test: (s) => s.startsWith("react-icons/tb"),
    library: "react-icons/tb",
    collection: "tabler",
    toName: (n) => pascalToKebab(n.replace(/^Tb/, "")),
  },
  {
    test: (s) => s.startsWith("react-icons/lu"),
    library: "react-icons/lu",
    collection: "lucide",
    toName: (n) => pascalToKebab(n.replace(/^Lu/, "")),
  },
  {
    test: (s) => s.startsWith("react-icons/ri"),
    library: "react-icons/ri",
    collection: "ri",
    toName: (n) => pascalToKebab(n.replace(/^Ri/, "")),
  },
  {
    test: (s) => s === "@mui/icons-material" || s.startsWith("@mui/icons-material/"),
    library: "@mui/icons-material",
    collection: "mdi",
    toName: pascalToKebab,
  },
];

function pascalToKebab(name: string): string {
  return toKebabCase(name);
}

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) walk(full, files);
    else if (SOURCE_EXT.has(extname(entry))) files.push(full);
  }
  return files;
}

function extname(file: string): string {
  const i = file.lastIndexOf(".");
  return i >= 0 ? file.slice(i) : "";
}

const NAMED_IMPORT =
  /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+["']([^"']+)["']/g;

export function scanProjectIcons(root = process.cwd(), relDir = "src"): DetectedIcon[] {
  const start = join(root, relDir);
  const files = walk(existsSync(start) ? start : root);
  const found: DetectedIcon[] = [];

  for (const file of files) {
    let source: string;
    try {
      source = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    NAMED_IMPORT.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = NAMED_IMPORT.exec(source))) {
      const specifier = match[3] ?? "";
      const mapped = LIBRARY_MAP.find((lib) => lib.test(specifier));
      if (!mapped) continue;
      const names = (match[1] ?? match[2] ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.replace(/^type\s+/, "").split(/\s+as\s+/).pop()!.trim())
        .filter((n) => n && n !== "type");

      for (const importName of names) {
        const original = importName.includes(" as ")
          ? importName.split(" as ")[0]!
          : importName;
        found.push({
          file: relative(root, file),
          library: mapped.library,
          collection: mapped.collection,
          importName: original,
          iconName: mapped.toName(original),
          specifier,
        });
      }
    }
  }

  return found;
}

export function summarizeLibraries(icons: DetectedIcon[]): LibraryStats[] {
  const map = new Map<string, LibraryStats>();
  for (const icon of icons) {
    const current = map.get(icon.library);
    if (current) current.count += 1;
    else {
      map.set(icon.library, {
        library: icon.library,
        collection: icon.collection,
        count: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function findUnusedImports(root = process.cwd(), relDir = "src"): DetectedIcon[] {
  const icons = scanProjectIcons(root, relDir);
  const unused: DetectedIcon[] = [];
  const byFile = new Map<string, DetectedIcon[]>();
  for (const icon of icons) {
    const list = byFile.get(icon.file) ?? [];
    list.push(icon);
    byFile.set(icon.file, list);
  }
  for (const [file, list] of byFile) {
    let source = "";
    try {
      source = readFileSync(join(root, file), "utf-8");
    } catch {
      continue;
    }
    for (const icon of list) {
      const rest = source.replace(
        /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+["']([^"']+)["']/g,
        "",
      );
      const used = new RegExp(`\\b${icon.importName}\\b`).test(rest);
      if (!used) unused.push(icon);
    }
  }
  return unused;
}

export type LocalAriaIcon = {
  file: string;
  iconId: string;
  collection: string;
  name: string;
};

const ARIA_HEADER =
  /(?:^\/\/\s*|<!--\s*)([a-z0-9-]+):([a-z0-9-]+)(?:\s*-->)?/im;

export function scanAriaIconFiles(root = process.cwd(), outDir = "src/components/icons"): LocalAriaIcon[] {
  const start = join(root, outDir);
  if (!existsSync(start)) return [];
  const files = walk(start);
  const found: LocalAriaIcon[] = [];
  for (const file of files) {
    let source = "";
    try {
      source = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const match = source.match(ARIA_HEADER);
    if (!match?.[1] || !match[2]) continue;
    found.push({
      file: relative(root, file),
      iconId: `${match[1]}:${match[2]}`,
      collection: match[1],
      name: match[2],
    });
  }
  return found;
}

export function suggestStandard(stats: LibraryStats[]): string {
  if (stats.length === 0) return "lucide";
  const lucide = stats.find((s) => s.collection === "lucide");
  if (lucide && lucide.count >= (stats[0]?.count ?? 0) * 0.4) return "lucide";
  return stats[0]?.collection ?? "lucide";
}
