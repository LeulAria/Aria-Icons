import chalk from "chalk";
import { ApiError, getClient } from "../client.ts";
import { formatIcon } from "../format.ts";
import { trackUsage } from "../memory.ts";
import type { IconFormat } from "../types.ts";

interface GetOptions {
  color?: string;
  size?: string;
  format?: string;
  json?: boolean;
  variant?: string;
  api?: string;
}

export async function getCommand(iconId: string, options: GetOptions): Promise<void> {
  const client = getClient(options.api);
  const size = options.size ? Number.parseInt(options.size, 10) : undefined;
  const format = (options.format ?? "svg").toLowerCase();

  try {
    const icon = await client.getIcon({
      id: iconId,
      color: options.color,
      size: Number.isFinite(size) ? size : undefined,
      variant: options.variant,
    });
    trackUsage(icon.set, icon.id);

    if (options.json || format === "json") {
      console.log(JSON.stringify(icon, null, 2));
      return;
    }

    if (format === "svg" || format === "html") {
      console.log(icon.svg);
      return;
    }

    console.log(formatIcon(icon.svg, icon.name, format as IconFormat, icon.id));
  } catch (error) {
    console.error(chalk.red(error instanceof ApiError ? error.message : String(error)));
    process.exit(1);
  }
}
