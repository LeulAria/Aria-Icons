import chalk from "chalk";
import { resolveProjectSettings } from "../config.ts";
import {
  findUnusedImports,
  scanAriaIconFiles,
  scanProjectIcons,
  suggestStandard,
  summarizeLibraries,
} from "../scan.ts";

interface DoctorOptions {
  dir?: string;
}

export async function doctorCommand(options: DoctorOptions): Promise<void> {
  const dir = options.dir ?? "src";
  const icons = scanProjectIcons(process.cwd(), dir);
  const stats = summarizeLibraries(icons);
  const unused = findUnusedImports(process.cwd(), dir);
  const settings = resolveProjectSettings();
  const standard = suggestStandard(stats);
  const local = scanAriaIconFiles(process.cwd(), settings.outDir);

  const uniqueNames = new Set(icons.map((i) => i.iconName));
  const collections = new Set(stats.map((s) => s.collection));
  const localSets = new Set(local.map((i) => i.collection));

  console.log(chalk.bold("\n  ARIA ICONS\n"));

  if (local.length > 0) {
    console.log(
      `${chalk.green("  ✓")} ${local.length} Aria Icons source files in ${chalk.cyan(settings.outDir)}`,
    );
    console.log(
      chalk.dim(
        `    ${[...localSets].join(", ")} · ${local
          .slice(0, 6)
          .map((i) => i.iconId)
          .join(", ")}${local.length > 6 ? "…" : ""}`,
      ),
    );
  } else {
    console.log(chalk.dim(`  ○ No files yet in ${settings.outDir}`));
    console.log(chalk.dim(`    Add icons with: aria-icons add house`));
  }

  if (icons.length === 0) {
    console.log(chalk.green("  ✓") + " No third-party icon packages detected");
    console.log("");
    return;
  }

  console.log(`${chalk.green("  ✓")} ${icons.length} third-party icon imports`);
  if (collections.size > 1) {
    console.log(`${chalk.yellow("  ⚠")} ${collections.size} different icon collections`);
  } else {
    console.log(`${chalk.green("  ✓")} 1 icon collection (${[...collections][0]})`);
  }
  if (unused.length > 0) {
    console.log(`${chalk.yellow("  ⚠")} ${unused.length} unused icon imports`);
  }
  const dupes = icons.length - uniqueNames.size;
  if (dupes > 0) {
    console.log(`${chalk.yellow("  ⚠")} ${dupes} duplicate icon names across files`);
  }

  console.log(chalk.dim("\n  Libraries"));
  for (const row of stats) {
    console.log(`    ${row.library.padEnd(28)} ${String(row.count).padStart(4)}   → ${row.collection}`);
  }

  console.log(`\n  Suggested standard:  ${chalk.cyan(standard)}`);
  console.log(chalk.dim(`  Project icons dir:   ${settings.outDir} (${settings.framework})\n`));
  console.log(`  Run:\n    ${chalk.cyan(`aria-icons migrate --to ${standard} --dry-run`)}\n`);
}
