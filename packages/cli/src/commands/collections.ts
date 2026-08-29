import chalk from "chalk";
import { ApiError, getClient } from "../client.ts";

interface CollectionsOptions {
  search?: string;
  limit?: string;
  json?: boolean;
  api?: string;
}

export async function collectionsCommand(options: CollectionsOptions): Promise<void> {
  const client = getClient(options.api);
  const limit = options.limit ? Number.parseInt(options.limit, 10) : 40;
  try {
    const data = await client.collections({
      search: options.search,
      limit: Number.isFinite(limit) ? limit : 40,
    });
    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log(chalk.bold(`\n${data.total} collections (showing ${data.collections.length})\n`));
    for (const col of data.collections) {
      const short = col.shortId !== col.id ? chalk.dim(` (${col.id})`) : "";
      console.log(`  ${chalk.cyan(col.shortId.padEnd(18))} ${String(col.count).padStart(7)}  ${col.label}${short}`);
    }
  } catch (error) {
    console.error(chalk.red(error instanceof ApiError ? error.message : String(error)));
    process.exit(1);
  }
}
