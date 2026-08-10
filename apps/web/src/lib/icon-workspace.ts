export type WorkspaceIcon = {
  setId: string;
  styleId: string;
  filePath: string;
  name: string;
};

export type StoredWorkspaceIcon = WorkspaceIcon & {
  at: number;
};

const FAVORITES_KEY = "aria-icons:favorites";
const RECENT_KEY = "aria-icons:recent";
const MAX_RECENT = 48;

export function iconKey(icon: WorkspaceIcon) {
  return `${icon.setId}:${icon.styleId}:${icon.filePath}`;
}

function readList(key: string): StoredWorkspaceIcon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredWorkspaceIcon[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key: string, items: StoredWorkspaceIcon[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function getFavorites(): StoredWorkspaceIcon[] {
  return readList(FAVORITES_KEY);
}

export function getRecent(): StoredWorkspaceIcon[] {
  return readList(RECENT_KEY);
}

export function isFavorite(icon: WorkspaceIcon): boolean {
  const key = iconKey(icon);
  return getFavorites().some((item) => iconKey(item) === key);
}

export function toggleFavorite(icon: WorkspaceIcon): boolean {
  const key = iconKey(icon);
  const current = getFavorites();
  const exists = current.some((item) => iconKey(item) === key);
  if (exists) {
    writeList(
      FAVORITES_KEY,
      current.filter((item) => iconKey(item) !== key),
    );
    return false;
  }
  writeList(FAVORITES_KEY, [{ ...icon, at: Date.now() }, ...current]);
  return true;
}

export function pushRecent(icon: WorkspaceIcon) {
  const key = iconKey(icon);
  const next = [
    { ...icon, at: Date.now() },
    ...getRecent().filter((item) => iconKey(item) !== key),
  ].slice(0, MAX_RECENT);
  writeList(RECENT_KEY, next);
}

export function filterWorkspaceIcons(
  items: WorkspaceIcon[],
  query: string,
): WorkspaceIcon[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (icon) =>
      icon.name.toLowerCase().includes(q) ||
      icon.setId.toLowerCase().includes(q) ||
      icon.styleId.toLowerCase().includes(q),
  );
}
