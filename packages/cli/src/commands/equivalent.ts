import chalk from "chalk";
import { ApiError, getClient } from "../client.ts";

interface EquivalentOptions {
  to?: string;
  json?: boolean;
  api?: string;
}

export async function equivalentCommand(iconId: string, options: EquivalentOptions): Promise<void> {
  if (!options.to) {
    console.error(chalk.red("Pass --to <collection>, e.g. aria-icons equivalent lucide:house --to tabler"));
    process.exit(1);
  }
  const client = getClient(options.api);
  try {
    const data = await client.equivalent(iconId, options.to);
    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log(`${chalk.cyan(data.from)}  →  ${chalk.green(data.to.id)}`);
  } catch (error) {
    console.error(chalk.red(error instanceof ApiError ? error.message : String(error)));
    process.exit(1);
  }
}
