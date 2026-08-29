import packageJson from "../package.json" with { type: "json" };

export const PACKAGE_NAME = "aria-icons";
export const VERSION = packageJson.version;
export const DEFAULT_API_URL = "https://icons.leularia.com";
export const CONFIG_FILE = ".aria-icons.json";

export function resolveApiUrl(override?: string): string {
  const fromEnv = process.env.ARIA_ICONS_API?.trim();
  const raw = (override ?? fromEnv ?? DEFAULT_API_URL).replace(/\/+$/, "");
  return raw;
}
