import * as p from "@clack/prompts";
import chalk from "chalk";
import { saveConfig } from "../config.ts";
import { defaultOutDir, detectFramework } from "../detect.ts";
import type { Framework } from "../types.ts";

interface InitOptions {
  yes?: boolean;
  framework?: Framework;
  outDir?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const detected = detectFramework();
  let framework = options.framework ?? detected;
  let outDir = options.outDir ?? defaultOutDir(framework);

  if (!options.yes && (!options.framework || !options.outDir)) {
    p.intro(chalk.bgCyan.black(" aria-icons init "));
    if (!options.framework) {
      const selected = await p.select({
        message: "Framework",
        initialValue: detected,
        options: [
          { value: "react", label: "React / Next.js" },
          { value: "vue", label: "Vue / Nuxt" },
          { value: "svelte", label: "Svelte / SvelteKit" },
          { value: "solid", label: "Solid" },
          { value: "react-native", label: "React Native / Expo" },
          { value: "flutter", label: "Flutter" },
          { value: "svg", label: "Raw SVG" },
        ],
      });
      if (p.isCancel(selected)) {
        p.cancel("Cancelled");
        process.exit(0);
      }
      framework = selected as Framework;
      outDir = options.outDir ?? defaultOutDir(framework);
    }
    if (!options.outDir) {
      const dir = await p.text({
        message: "Icons output directory",
        initialValue: outDir,
      });
      if (p.isCancel(dir)) {
        p.cancel("Cancelled");
        process.exit(0);
      }
      outDir = dir;
    }
  }

  const path = saveConfig({
    framework,
    outDir,
    defaultCollection: "lucide",
  });
  p.outro(`Wrote ${chalk.cyan(path)}\n\nNext: ${chalk.cyan("aria-icons add house")}`);
}
