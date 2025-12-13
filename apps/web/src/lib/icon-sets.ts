export type IconStyleGroup = "line" | "solid";

export type IconStyleId =
	| "line"
	| "solid"
	| "outline"
	| "filled"
	| "regular"
	| "sharp"
	| "rounded";

export type IconSetId =
	| "akar-icons"
	| "basicons-line"
	| "bytesize-icons"
	| "coolicons"
	| "feathers"
	| "heroicons"
	| "iconicicons"
	| "iconoir"
	| "iconpack"
	| "ikonate"
	| "ionicons"
	| "lucide-icons"
	| "majesticons"
	| "system-uicons"
	| "tabler-icons"
	| "icons";

export type IconSetStyle = {
	id: IconStyleId;
	label: string;
	/**
	 * High-level grouping used by the UI toggle (Line vs Fill).
	 * Some sets only have one group.
	 */
	group: IconStyleGroup;
	/**
	 * Roots are paths relative to the icon set folder on disk.
	 * Each root will be searched recursively for `.svg`.
	 */
	roots: string[];
};

export type IconSetConfig = {
	id: IconSetId;
	label: string;
	homepage?: string;
	styles: IconSetStyle[];
};

/**
 * Folder name -> metadata + "where to find SVGs" per style.
 *
 * NOTE: You mentioned you have a list of links to match these folders.
 * If you paste that list, I can update the `homepage` values to match it exactly.
 */
export const ICON_SETS: IconSetConfig[] = [
	{
		id: "basicons-line",
		label: "Basicons",
		homepage: "https://basicons.xyz/",
		styles: [{ id: "line", label: "Line", group: "line", roots: ["./"] }],
	},
	{
		id: "tabler-icons",
		label: "Tabler Icons",
		homepage: "https://tabler.io/icons",
		styles: [
			{ id: "outline", label: "Outline", group: "line", roots: ["icons/outline"] },
			{ id: "filled", label: "Filled", group: "solid", roots: ["icons/filled"] },
		],
	},
	{
		id: "iconoir",
		label: "Iconoir",
		homepage: "https://iconoir.com/",
		styles: [
			{ id: "regular", label: "Regular", group: "line", roots: ["icons/regular"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["icons/solid"] },
		],
	},
	{
		id: "icons",
		label: "Icons (local copy)",
		styles: [
			{ id: "regular", label: "Regular", group: "line", roots: ["regular"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "lucide-icons",
		label: "Lucide",
		homepage: "https://lucide.dev/icons",
		styles: [{ id: "line", label: "Line", group: "line", roots: ["./"] }],
	},
	{
		id: "heroicons",
		label: "Heroicons",
		homepage: "https://heroicons.com/",
		styles: [
			{ id: "outline", label: "Outline (24)", group: "line", roots: ["src/24/outline"] },
			{ id: "solid", label: "Solid (24)", group: "solid", roots: ["src/24/solid"] },
		],
	},
	{
		id: "majesticons",
		label: "Majesticons",
		homepage: "https://www.majesticons.com/",
		styles: [
			{ id: "line", label: "Line", group: "line", roots: ["icons/line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["icons/solid"] },
		],
	},
	{
		id: "coolicons",
		label: "Coolicons",
		homepage: "https://coolicons.cool/",
		styles: [{ id: "line", label: "All", group: "line", roots: ["coolicons SVG"] }],
	},
	{
		id: "akar-icons",
		label: "Akar Icons",
		homepage: "https://akaricons.com/",
		styles: [{ id: "line", label: "All", group: "line", roots: ["svg"] }],
	},
	{
		id: "system-uicons",
		label: "System UIcons",
		homepage: "https://systemuicons.com/",
		styles: [{ id: "line", label: "All", group: "line", roots: ["icons"] }],
	},
	{
		id: "feathers",
		label: "Feather",
		homepage: "https://feathericons.com/",
		styles: [{ id: "line", label: "All", group: "line", roots: ["icons"] }],
	},
	{
		id: "bytesize-icons",
		label: "Bytesize",
		homepage: "https://github.com/danklammer/bytesize-icons",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "ikonate",
		label: "Ikonate",
		homepage: "https://ikonate.com/",
		styles: [{ id: "line", label: "All", group: "line", roots: ["icons"] }],
	},
	{
		id: "iconicicons",
		label: "Iconic Icons",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "ionicons",
		label: "Ionicons",
		homepage: "https://ionic.io/ionicons",
		styles: [{ id: "line", label: "All", group: "line", roots: ["svg"] }],
	},
	{
		id: "iconpack",
		label: "Iconpack",
		styles: [{ id: "line", label: "All", group: "line", roots: ["source"] }],
	},
];

export function getIconSet(setId: string) {
	return ICON_SETS.find((s) => s.id === setId);
}


