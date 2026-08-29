import chalk from "chalk";
import { ApiError, getClient } from "../client.ts";
import { resolveProjectSettings } from "../config.ts";
import { trackUsage } from "../memory.ts";
import { scanProjectIcons } from "../scan.ts";
import type { Framework } from "../types.ts";
import { writeIconFile } from "../write.ts";

interface MigrateOptions {
  to?: string;
  dryRun?: boolean;
  dir?: string;
  framework?: Framework;
  outDir?: string;
  api?: string;
}

export async function migrateCommand(options: MigrateOptions): Promise<void> {
  const target = options.to ?? "lucide";
  const settings = resolveProjectSettings({
    framework: options.framework,
    outDir: options.outDir,
    api: options.api,
  });
  const client = getClient(settings.api);
  const icons = scanProjectIcons(process.cwd(), options.dir ?? "src");

  if (icons.length === 0) {
    console.log(chalk.yellow("No third-party icon imports found under src/."));
    return;
  }

  const stats = new Map<string, number>();
  for (const icon of icons) {
    stats.set(icon.library, (stats.get(icon.library) ?? 0) + 1);
  }
  console.log(chalk.bold(`Found ${icons.length} icon imports\n`));
  for (const [lib, count] of [...stats.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${lib.padEnd(28)} ${count}`);
  }

  if (!options.to) {
    console.log(chalk.dim(`\nMap them onto one collection:\n  aria-icons migrate --to lucide --dry-run`));
    return;
  }

  const unique = new Map<string, (typeof icons)[number]>();
  for (const icon of icons) {
    const key = `${icon.collection}:${icon.iconName}`;
    if (!unique.has(key)) unique.set(key, icon);
  }

  console.log(chalk.bold(`\n${unique.size} unique icons → ${target}\n`));

  const mappings: Array<{
    from: string;
    to: string;
    file: string;
    importName: string;
  }> = [];
  const missing: string[] = [];

  for (const icon of unique.values()) {
    const fromId = `${icon.collection}:${icon.iconName}`;
    try {
      const result = await client.equivalent(fromId, target);
      mappings.push({
        from: fromId,
        to: result.to.id,
        file: icon.file,
        importName: icon.importName,
      });
    } catch {
      missing.push(fromId);
    }
  }

  for (const map of mappings) {
    console.log(`  ${chalk.dim(map.from)}  →  ${chalk.cyan(map.to)}  ${chalk.dim(map.file)}`);
  }
  if (missing.length > 0) {
    console.log(chalk.yellow(`\nNo equivalent in ${target}:`));
    for (const id of missing) console.log(`  ${id}`);
  }

  if (options.dryRun) {
    console.log(
      chalk.dim(`\nDry run. Write files with:\n  aria-icons migrate --to ${target}`),
    );
    return;
  }

  try {
    for (const map of mappings) {
      const icon = await client.getIcon({ id: map.to });
      trackUsage(icon.set, icon.id);
      const written = writeIconFile({
        cwd: process.cwd(),
        outDir: settings.outDir,
        framework: settings.framework,
        icon,
      });
      console.log(
        `  ${written.alreadyExists ? chalk.yellow("exists") : chalk.green("wrote")}  ${written.filePath}`,
      );
    }
    console.log(
      chalk.dim(
        `\n${mappings.length} components in ${settings.outDir}. Swap imports to that folder when ready.`,
      ),
    );
  } catch (error) {
    console.error(chalk.red(error instanceof ApiError ? error.message : String(error)));
    process.exit(1);
  }
}
