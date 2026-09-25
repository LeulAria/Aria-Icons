export type IconStyleGroup = "line" | "solid";
/** Line / Fill / Both / Animated toggle in the icon browser. */
export type IconStyleFilter = IconStyleGroup | "both" | "animated";

/**
 * Whole Iconify packs that are filled artwork and belong under Fill,
 * even when some glyphs were indexed as line (fill="none" heuristic).
 */
export const FORCE_FILL_SET_IDS = new Set<string>(["at-icons"]);

/**
 * Style/set ids are open strings: filesystem sets use the ids below, while
 * theSVG brand variants ("default", "mono", "wordmark", …) and Iconify sets
 * (prefixes like "ph", "mdi") are discovered dynamically.
 */
export type IconStyleId = string;
export type IconSetId = string;

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
	 * Only used by filesystem-backed sets.
	 */
	roots?: string[];
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
/** Curated UI sets — order here controls All Icons browse priority. */
export const ICON_SETS: IconSetConfig[] = [
	{
		id: "feathers",
		label: "Feather",
		homepage: "https://feathericons.com/",
		styles: [{ id: "line", label: "All", group: "line", roots: ["icons"] }],
	},
	{
		id: "basicons-line",
		label: "Basicons",
		homepage: "https://basicons.xyz/",
		styles: [{ id: "line", label: "Line", group: "line", roots: ["./"] }],
	},
	{
		id: "lucide-icons",
		label: "Lucide",
		homepage: "https://lucide.dev/icons",
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
		id: "heroicons",
		label: "Heroicons",
		homepage: "https://heroicons.com/",
		styles: [
			{ id: "outline", label: "Outline (24)", group: "line", roots: ["src/24/outline"] },
			{ id: "solid", label: "Solid (24)", group: "solid", roots: ["src/24/solid"] },
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
		styles: [{ id: "line", label: "All", group: "line", roots: ["src/svg"] }],
	},
	{
		id: "system-uicons",
		label: "System UIcons",
		homepage: "https://systemuicons.com/",
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
	{
		id: "bubbles",
		label: "Bubbles",
		homepage: "https://github.com/leemonade/bubbles",
		styles: [
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "heroicons-v1",
		label: "Heroicons v1",
		homepage: "https://github.com/tailwindlabs/heroicons/tree/v1.0.6",
		styles: [
			{ id: "outline", label: "Outline", group: "line", roots: ["src/outline"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["src/solid"] },
		],
	},
	{
		id: "atlas-icons",
		label: "Atlas Icons",
		homepage: "https://iconsatlas.com/",
		styles: [
			{ id: "thin", label: "Thin", group: "line", roots: ["thin"] },
			{ id: "regular", label: "Regular", group: "line", roots: ["regular"] },
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
		],
	},
	{
		id: "dashboard-icons",
		label: "Dashboard Icons",
		homepage: "https://dashboardicons.com",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "svgl",
		label: "SVGL",
		homepage: "https://svgl.app",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "light", label: "Light", group: "solid", roots: ["light"] },
			{ id: "dark", label: "Dark", group: "solid", roots: ["dark"] },
		],
	},
	{
		id: "lobe-icons",
		label: "Lobe Icons",
		homepage: "https://github.com/lobehub/lobe-icons",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "super-tiny-icons",
		label: "Super Tiny Icons",
		homepage: "https://github.com/edent/SuperTinyIcons",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "browser-logos",
		label: "Browser Logos",
		homepage: "https://github.com/alrra/browser-logos",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "themify-icons",
		label: "Themify Icons",
		homepage: "https://github.com/lykmapipo/themify-icons",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "spectrum-icons",
		label: "Adobe Spectrum",
		homepage: "https://github.com/adobe/spectrum-css-workflow-icons",
		styles: [{ id: "line", label: "Workflow", group: "line", roots: ["./"] }],
	},
	{
		id: "blueprint-icons",
		label: "Blueprint",
		homepage: "https://blueprintjs.com/docs/#icons",
		styles: [
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "20", label: "20", group: "solid", roots: ["20"] },
		],
	},
	{
		id: "patternfly-icons",
		label: "PatternFly",
		homepage: "https://www.patternfly.org/design-foundations/icons",
		styles: [{ id: "solid", label: "Icons", group: "solid", roots: ["./"] }],
	},
	{
		id: "atlaskit-icons",
		label: "Atlaskit",
		homepage: "https://atlassian.design/foundations/iconography",
		styles: [
			{ id: "core", label: "Core", group: "solid", roots: ["core"] },
			{ id: "editor", label: "Editor", group: "line", roots: ["editor"] },
			{ id: "emoji", label: "Emoji", group: "solid", roots: ["emoji"] },
			{ id: "jira", label: "Jira", group: "solid", roots: ["jira"] },
			{ id: "bitbucket", label: "Bitbucket", group: "solid", roots: ["bitbucket"] },
			{ id: "media-services", label: "Media", group: "solid", roots: ["media-services"] },
			{ id: "hipchat", label: "Hipchat", group: "solid", roots: ["hipchat"] },
		],
	},
	{
		id: "payment-icons",
		label: "Payment Icons",
		homepage: "https://github.com/aaronfagan/svg-credit-card-payment-icons",
		styles: [
			{ id: "flat", label: "Flat", group: "solid", roots: ["flat"] },
			{ id: "flat-rounded", label: "Flat Rounded", group: "solid", roots: ["flat-rounded"] },
			{ id: "logo", label: "Logo", group: "solid", roots: ["logo"] },
			{ id: "logo-border", label: "Logo Border", group: "solid", roots: ["logo-border"] },
			{ id: "mono", label: "Mono", group: "solid", roots: ["mono"] },
			{ id: "mono-outline", label: "Mono Outline", group: "line", roots: ["mono-outline"] },
		],
	},
	{
		id: "trinil",
		label: "Trinil",
		homepage: "https://github.com/5e1y/trinil",
		styles: [{ id: "line", label: "Line", group: "line", roots: ["./"] }],
	},
	{
		id: "vivid",
		label: "Vivid",
		homepage: "https://github.com/webkul/vivid",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "fork-awesome",
		label: "Fork Awesome",
		homepage: "https://github.com/ForkAwesome/Fork-Awesome",
		styles: [{ id: "solid", label: "Icons", group: "solid", roots: ["./"] }],
	},
	{
		id: "iconic",
		label: "ICONIC",
		homepage: "https://github.com/YuheshPandian/ICONIC",
		styles: [
			{ id: "dark", label: "Dark", group: "solid", roots: ["dark"] },
			{ id: "light", label: "Light", group: "solid", roots: ["light"] },
		],
	},
	{
		id: "country-flag-icons",
		label: "Country Flag Icons",
		homepage: "https://github.com/catamphetamine/country-flag-icons",
		styles: [{ id: "solid", label: "Flags", group: "solid", roots: ["./"] }],
	},
];

export function getIconSet(setId: string) {
	return ICON_SETS.find((s) => s.id === setId);
}


