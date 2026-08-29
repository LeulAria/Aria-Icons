import chalk from "chalk";
import { ApiError, getClient } from "../client.ts";
import { loadConfig } from "../config.ts";

interface SearchOptions {
  prefix?: string;
  collection?: string;
  style?: string;
  limit?: string;
  json?: boolean;
  api?: string;
}

export async function searchCommand(query: string, options: SearchOptions): Promise<void> {
  const client = getClient(options.api);
  const config = loadConfig();
  const collection = options.collection ?? options.prefix;
  const limit = options.limit ? Number.parseInt(options.limit, 10) : 32;

  try {
    const data = await client.search({
      query,
      collection,
      style: options.style,
      limit: Number.isFinite(limit) ? limit : 32,
      prefer: collection ? undefined : config.defaultCollection,
    });

    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    if (data.icons.length === 0) {
      console.log(chalk.yellow("No icons found."));
      return;
    }

    console.log(chalk.bold(`Found ${data.total} icons (showing ${data.icons.length}):\n`));
    for (const icon of data.icons) {
      const [prefix, name] = icon.id.split(":");
      console.log(`  ${chalk.cyan(prefix)}:${chalk.white(name)}`);
    }
    console.log(chalk.dim(`\nGet one:  aria-icons get ${data.icons[0]?.id}`));
    console.log(chalk.dim(`Add one:  aria-icons add ${data.icons[0]?.id}`));
  } catch (error) {
    console.error(chalk.red(error instanceof ApiError ? error.message : String(error)));
    process.exit(1);
  }
}
