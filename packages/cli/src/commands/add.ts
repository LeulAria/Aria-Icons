import chalk from "chalk";
import { aliasIconId, aliasIconName } from "../aliases.ts";
import { ApiError, getClient } from "../client.ts";
import { resolveProjectSettings } from "../config.ts";
import { resolveWriteCwd } from "../cwd.ts";
import { trackUsage } from "../memory.ts";
import type { Framework } from "../types.ts";
import { writeIconFile } from "../write.ts";

interface AddOptions {
  framework?: Framework;
  outDir?: string;
  collection?: string;
  color?: string;
  size?: string;
  variant?: string;
  force?: boolean;
  api?: string;
}

async function resolveIconId(
  client: ReturnType<typeof getClient>,
  token: string,
  collection?: string,
): Promise<string> {
  const raw = token.includes("/") ? token.replace("/", ":") : token;
  if (raw.includes(":")) return aliasIconId(raw);

  const aliased = aliasIconName(raw);
  const result = await client.search({
    query: aliased,
    collection,
    limit: 8,
  });
  const exact = result.icons.find((i) => i.name.toLowerCase() === aliased.toLowerCase());
  const chosen = exact ?? result.icons[0];
  if (!chosen) {
    throw new ApiError(`No icon found for '${token}'`);
  }
  return chosen.id;
}

export async function addCommand(names: string[], options: AddOptions): Promise<void> {
  if (names.length === 0) {
    console.error(chalk.red("Pass at least one icon name or id, e.g. aria-icons add house"));
    process.exit(1);
  }

  const settings = resolveProjectSettings({
    framework: options.framework,
    outDir: options.outDir,
    api: options.api,
  });
  const client = getClient(settings.api);
  const collection = options.collection ?? settings.defaultCollection;
  const size = options.size ? Number.parseInt(options.size, 10) : undefined;
  const cwd = resolveWriteCwd();

  const written = [];
  const failures: string[] = [];

  for (const token of names) {
    try {
      const id = await resolveIconId(client, token, collection);
      const icon = await client.getIcon({
        id,
        color: options.color,
        size: Number.isFinite(size) ? size : undefined,
        variant: options.variant,
      });
      trackUsage(icon.set, icon.id);
      const result = writeIconFile({
        cwd,
        outDir: settings.outDir,
        framework: settings.framework,
        icon,
        force: options.force,
      });
      written.push(result);
      const mark = result.alreadyExists && !options.force ? chalk.yellow("exists") : chalk.green("wrote");
      console.log(`  ${mark}  ${chalk.cyan(result.filePath)}  ${chalk.dim(result.iconId)}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : String(error);
      failures.push(`${token}: ${message}`);
      console.error(`  ${chalk.red("fail")}  ${chalk.cyan(token)}  ${chalk.dim(message)}`);
    }
  }

  const first = written[0];
  if (first) {
    console.log(`\n${chalk.bold("Import")}\n  ${first.importStatement}`);
    console.log(`\n${chalk.bold("Usage")}\n  <${first.componentName} />`);
  }

  if (failures.length > 0) {
    console.error(chalk.red(`\n${failures.length} icon(s) failed, ${written.length} wrote.`));
    process.exit(1);
  }
}
