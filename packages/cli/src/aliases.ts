/** Lucide and other common rename / shorthand → catalog name. */
export const ICON_NAME_ALIASES: Record<string, string> = {
  "more-horizontal": "ellipsis",
  "more-vert": "ellipsis-vertical",
  "more-vertical": "ellipsis-vertical",
  filter: "list-filter",
  home: "house",
};

export function aliasIconName(name: string): string {
  return ICON_NAME_ALIASES[name.toLowerCase()] ?? name;
}

export function aliasIconId(id: string): string {
  const colon = id.indexOf(":");
  if (colon <= 0) return id;
  const collection = id.slice(0, colon);
  const name = id.slice(colon + 1);
  return `${collection}:${aliasIconName(name)}`;
}
