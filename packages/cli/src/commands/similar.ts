import chalk from "chalk";
import { ApiError, getClient } from "../client.ts";

interface SimilarOptions {
  limit?: string;
  json?: boolean;
  api?: string;
}

export async function similarCommand(iconId: string, options: SimilarOptions): Promise<void> {
  const client = getClient(options.api);
  const limit = options.limit ? Number.parseInt(options.limit, 10) : 10;
  try {
    const data = await client.similar(iconId, Number.isFinite(limit) ? limit : 10);
    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log(chalk.bold(`Similar to ${iconId}\n`));
    for (const icon of data.icons) console.log(`  ${chalk.cyan(icon.id)}`);
  } catch (error) {
    console.error(chalk.red(error instanceof ApiError ? error.message : String(error)));
    process.exit(1);
  }
}
