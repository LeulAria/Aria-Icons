#!/usr/bin/env node
import { program } from "commander";
import { VERSION } from "./constants.ts";
import {
  addCommand,
  collectionsCommand,
  configCommand,
  doctorCommand,
  equivalentCommand,
  getCommand,
  initCommand,
  migrateCommand,
  searchCommand,
  setupCommand,
  similarCommand,
  suggestCommand,
} from "./commands/index.ts";
import { runServer } from "./server.ts";

program
  .name("aria-icons")
  .description("Find any icon. Put it in your codebase. Let AI use it.")
  .version(VERSION)
  .option("--api <url>", "Aria Icons API origin (or set ARIA_ICONS_API)")
  .hook("preAction", (thisCommand) => {
    const globals = thisCommand.optsWithGlobals() as { api?: string };
    if (globals.api) process.env.ARIA_ICONS_API = globals.api;
  });

program
  .command("search <query>")
  .description("Search icons across all collections")
  .option("-p, --prefix <prefix>", "Filter by collection (alias of --collection)")
  .option("-c, --collection <id>", "Filter by collection (lucide, tabler, mdi, …)")
  .option("--style <style>", "outline | solid | style id")
  .option("-l, --limit <number>", "Max results (default: 32)")
  .option("--json", "Output as JSON")
  .action(searchCommand);

program
  .command("get <icon-id>")
  .description("Print one icon (SVG by default)")
  .option("-c, --color <color>", "Icon color")
  .option("-s, --size <pixels>", "Icon size in pixels")
  .option("-f, --format <format>", "svg | react | vue | svelte | solid | flutter | react-native | json")
  .option("--variant <variant>", "theSVG brand variant")
  .option("--json", "Output metadata JSON")
  .action(getCommand);

program
  .command("add <icons...>")
  .description("Download icons into your project (no giant dependency)")
  .option("-f, --framework <framework>", "react | vue | svelte | solid | flutter | react-native | svg")
  .option("-o, --out-dir <dir>", "Output directory")
  .option("-c, --collection <id>", "Preferred collection when the name is not an id")
  .option("--color <color>", "Icon color")
  .option("--size <pixels>", "Icon size in pixels")
  .option("--variant <variant>", "theSVG brand variant (mono, wordmark, …)")
  .option("--force", "Overwrite existing icon files")
  .action(addCommand);

program
  .command("similar <icon-id>")
  .description("Same icon in other collections, plus related names")
  .option("-l, --limit <number>", "Max results")
  .option("--json", "Output as JSON")
  .action(similarCommand);

program
  .command("equivalent <icon-id>")
  .description("Map an icon onto a target collection")
  .option("--to <collection>", "Target collection (e.g. tabler)")
  .option("--json", "Output as JSON")
  .action(equivalentCommand);

program
  .command("migrate")
  .description("Map existing icon-library imports onto one Aria Icons collection")
  .option("--to <collection>", "Target collection (e.g. lucide)")
  .option("--dry-run", "Show the plan without writing files")
  .option("--dir <dir>", "Source directory to scan (default: src)")
  .option("-f, --framework <framework>", "Output framework")
  .option("-o, --out-dir <dir>", "Output directory")
  .action(migrateCommand);

program
  .command("doctor")
  .description("Audit icon usage in this repo")
  .option("--dir <dir>", "Source directory to scan (default: src)")
  .action(doctorCommand);

program
  .command("suggest [path]")
  .description("Recommend a consistent set from current usage")
  .option("--dir <dir>", "Source directory to scan")
  .action(suggestCommand);

program
  .command("init")
  .description("Write .aria-icons.json for this project")
  .option("-y, --yes", "Accept detected defaults")
  .option("-f, --framework <framework>", "react | vue | svelte | solid | flutter | react-native | svg")
  .option("-o, --out-dir <dir>", "Icons output directory")
  .action(initCommand);

program
  .command("setup")
  .description("Configure the MCP server for coding agents")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("-a, --agent <agents...>", "cursor, claude-code, opencode, windsurf, vscode, antigravity")
  .option("-s, --scope <scope>", "global or project (default: global)")
  .option("-t, --transport <transport>", "stdio or http (default: stdio)")
  .action(setupCommand);

program
  .command("config")
  .description("Show manual MCP configuration snippets")
  .action(configCommand);

program
  .command("collections")
  .description("List icon collections")
  .option("--search <query>", "Filter collections")
  .option("-l, --limit <number>", "Max collections")
  .option("--json", "Output as JSON")
  .action(collectionsCommand);

program
  .command("mcp")
  .description("Run the MCP server over stdio")
  .action(runServer);

program.action(async () => {
  await runServer();
});

program.parse();
