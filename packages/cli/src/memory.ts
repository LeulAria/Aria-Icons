import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface CollectionUsage {
  count: number;
  lastUsed: string;
}

export interface IconHistoryEntry {
  iconId: string;
  timestamp: string;
}

export interface Preferences {
  collections: Record<string, CollectionUsage>;
  history: IconHistoryEntry[];
}

const MAX_HISTORY_SIZE = 50;

const DEFAULT_PREFERENCES: Preferences = {
  collections: {},
  history: [],
};

export function getPreferencesPath(): string {
  return join(homedir(), ".aria-icons", "preferences.json");
}

export function loadPreferences(): Preferences {
  const path = getPreferencesPath();
  if (!existsSync(path)) return { ...DEFAULT_PREFERENCES };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as Preferences;
    return {
      collections: parsed.collections || {},
      history: parsed.history || [],
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: Preferences): void {
  const path = getPreferencesPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tempPath = `${path}.${process.pid}.tmp`;
  writeFileSync(tempPath, JSON.stringify(prefs, null, 2), "utf-8");
  renameSync(tempPath, path);
}

export function trackUsage(collectionPrefix: string, iconId?: string): void {
  try {
    const prefs = loadPreferences();
    const existing = prefs.collections[collectionPrefix];
    const now = new Date().toISOString();
    prefs.collections[collectionPrefix] = {
      count: (existing?.count || 0) + 1,
      lastUsed: now,
    };
    if (iconId) {
      prefs.history = prefs.history.filter((h) => h.iconId !== iconId);
      prefs.history.unshift({ iconId, timestamp: now });
      prefs.history = prefs.history.slice(0, MAX_HISTORY_SIZE);
    }
    savePreferences(prefs);
  } catch {
    // Preference tracking should never crash the CLI.
  }
}

export function getPreferredCollections(): string[] {
  return Object.entries(loadPreferences().collections)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([prefix]) => prefix);
}

export function getRecentIcons(limit = 20): IconHistoryEntry[] {
  return loadPreferences().history.slice(0, limit);
}

export function clearPreferences(): void {
  savePreferences({ ...DEFAULT_PREFERENCES });
}
