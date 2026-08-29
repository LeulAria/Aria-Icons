import chalk from "chalk";
import {
  scanProjectIcons,
  suggestStandard,
  summarizeLibraries,
} from "../scan.ts";

interface SuggestOptions {
  dir?: string;
}

export async function suggestCommand(target: string | undefined, options: SuggestOptions): Promise<void> {
  if (target && /\.(png|jpe?g|webp|gif)$/i.test(target)) {
    console.log(
      chalk.yellow(
        "Screenshot suggestions are not in this CLI yet. Point at a source folder instead:\n  aria-icons suggest src/",
      ),
    );
    return;
  }

  const dir = target ?? options.dir ?? "src";
  const icons = scanProjectIcons(process.cwd(), dir);
  const stats = summarizeLibraries(icons);
  const standard = suggestStandard(stats);

  if (icons.length === 0) {
    console.log(chalk.yellow(`No icon usage found in ${dir}/.`));
    return;
  }

  const counts = new Map<string, number>();
  for (const icon of icons) {
    counts.set(icon.iconName, (counts.get(icon.iconName) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16);

  console.log(chalk.bold(`\nYour project uses:\n`));
  for (const [name, count] of ranked) {
    console.log(`  ${String(count).padStart(3)} × ${name}`);
  }

  console.log(chalk.bold(`\nRecommended consistent set:\n  ${chalk.cyan(standard)}\n`));
  console.log("  " + ranked.map(([name]) => name).join("\n  "));
  console.log(chalk.dim(`\n  aria-icons migrate --to ${standard} --dry-run\n`));
}
