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
	/** SPDX-ish licence string for the vendored pack (from upstream). */
	license?: string;
	/** True when the upstream licence is copyleft (GPL/LGPL/CC-BY-SA/MPL/EPL/…). */
	copyleft?: boolean;
	/** Required attribution text or URL when the licence demands it (e.g. CC-BY). */
	attribution?: string;
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
	{
		id: "cloudscape-icons",
		label: "Cloudscape",
		homepage: "https://cloudscape.design/foundation/visual-foundation/iconography/",
		styles: [{ id: "line", label: "Icons", group: "line", roots: ["./"] }],
	},
	{
		id: "semi-icons",
		label: "Semi Icons",
		homepage: "https://semi.design/en-US/basic/icon",
		styles: [
			{ id: "line", label: "Stroked", group: "line", roots: ["line"] },
			{ id: "solid", label: "Filled", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "arco-icons",
		label: "Arco Icons",
		homepage: "https://arco.design/react/components/icon",
		styles: [
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "fill", label: "Fill", group: "solid", roots: ["fill"] },
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "evil-icons",
		label: "Evil Icons",
		homepage: "https://github.com/evil-icons/evil-icons",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "homelab-icons",
		label: "Homelab Icons",
		homepage: "https://github.com/loganmarchione/homelab-svg-assets",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "muffin-payment-icons",
		label: "Payment Icons (MPL)",
		homepage: "https://github.com/muffinresearch/payment-icons",
		styles: [
			{ id: "flat", label: "Flat", group: "solid", roots: ["flat"] },
			{ id: "mono", label: "Mono", group: "solid", roots: ["mono"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "single", label: "Single", group: "solid", roots: ["single"] },
		],
	},
	{
		id: "developer-icons",
		label: "Developer Icons",
		homepage: "https://github.com/xandemon/developer-icons",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "aegis-icons",
		label: "Aegis Icons",
		homepage: "https://github.com/aegis-icons/aegis-icons",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "forge-icon",
		label: "Forge Icon",
		homepage: "https://github.com/Liberty-slug/forge-icon",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "duma-icons",
		label: "Duma Icons",
		homepage: "https://github.com/DudychMarian/duma-icons",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "tinyglyphs",
		label: "TinyGlyphs",
		homepage: "https://github.com/madebyankur/tinyglyphs",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "kivex",
		label: "Kivex",
		homepage: "https://github.com/MotionMind2007/Kivex",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "proxicons",
		label: "ProXIcons",
		homepage: "https://github.com/ProgrammerKR/ProXIcons",
		styles: [
			{ id: "regular", label: "Regular", group: "line", roots: ["regular"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "logos", label: "Logos", group: "solid", roots: ["logos"] },
		],
	},
	{
		id: "emblemicons",
		label: "Emblemicons",
		homepage: "https://github.com/emblemicons/emblemicons",
		styles: [
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mobaicons",
		label: "MOBAIcons",
		homepage: "https://github.com/Artist-MOBAI/MOBAIcons",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "famfamfam-silk",
		label: "FamFamFam Silk",
		homepage: "https://github.com/Simandara/famfamfam-silk-svg",
		styles: [{ id: "solid", label: "Icons", group: "solid", roots: ["./"] }],
	},
	{
		id: "game-icon-pack",
		label: "Game Icon Pack",
		homepage: "https://github.com/Nieobie/game-icon-pack",
		styles: [{ id: "solid", label: "Icons", group: "solid", roots: ["./"] }],
	},
	{
		id: "jedd-icons",
		label: "Jedd Icons",
		homepage: "https://github.com/jedd-labs/jedd-icons",
		styles: [
			{ id: "stroke", label: "Stroke", group: "line", roots: ["stroke"] },
			{ id: "fill", label: "Fill", group: "solid", roots: ["fill"] },
		],
	},
	{
		id: "swm-icons",
		label: "SWM Icon Pack",
		homepage: "https://github.com/software-mansion-labs/swm-icon-pack-react",
		styles: [
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "curved", label: "Curved", group: "line", roots: ["curved"] },
			{ id: "broken", label: "Broken", group: "line", roots: ["broken"] },
		],
	},
	{
		id: "payment-methods-svg",
		label: "Payment Methods SVG",
		homepage: "https://github.com/Webkadabra/payment-methods-svg-pack",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "react-pay-icons",
		label: "React Pay Icons",
		homepage: "https://github.com/twltwl/react-pay-icons",
		styles: [{ id: "solid", label: "Logos", group: "solid", roots: ["./"] }],
	},
	{
		id: "global-bank-logos",
		label: "Global Bank Logos",
		homepage: "https://github.com/auraveni/global-bank-logos",
		styles: [
			{ id: "indian-bank", label: "Indian", group: "solid", roots: ["indian-bank"] },
			{
				id: "international-bank",
				label: "International",
				group: "solid",
				roots: ["international-bank"],
			},
		],
	},
	{
		id: "finmarks",
		label: "Finmarks",
		homepage: "https://github.com/Finmarks/finmarks",
		styles: [
			{ id: "icon", label: "Icon", group: "solid", roots: ["icon"] },
			{ id: "full", label: "Full", group: "solid", roots: ["full"] },
		],
	},
	{
		id: "terrane",
		label: "Terrane",
		homepage: "https://github.com/uxKero/terrane",
		styles: [{ id: "solid", label: "Maps", group: "solid", roots: ["./"] }],
	},
	{
		id: "rsuite-icons",
		label: "React Suite Icons",
		homepage: "https://github.com/rsuite/rsuite-icons",
		styles: [{ id: "solid", label: "Icons", group: "solid", roots: ["./"] }],
	},
	{
		id: "jetbrains-icons",
		label: "JetBrains Icons",
		homepage: "https://github.com/JetBrains/icons",
		styles: [
			{ id: "default", label: "Default", group: "line", roots: ["default"] },
			{ id: "12", label: "12px", group: "line", roots: ["12"] },
			{ id: "20", label: "20px", group: "line", roots: ["20"] },
		],
	},
	{
		id: "flight-icons",
		label: "HashiCorp Flight",
		homepage: "https://github.com/hashicorp/design-system",
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "24", label: "24", group: "line", roots: ["24"] },
		],
	},
	{
		id: "kendo-icons",
		label: "Kendo SVG Icons",
		homepage: "https://github.com/telerik/kendo-icons",
		styles: [
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "duotone", label: "Duotone", group: "solid", roots: ["duotone"] },
		],
	},
	{
		id: "hv-uikit-icons",
		label: "HV UI Kit Icons",
		homepage: "https://github.com/pentaho/hv-uikit-react",
		styles: [{ id: "line", label: "Icons", group: "line", roots: ["./"] }],
	},
	{
		id: "paste-icons",
		label: "Twilio Paste Icons",
		homepage: "https://github.com/twilio-labs/paste",
		styles: [{ id: "line", label: "Icons", group: "line", roots: ["./"] }],
	},
	{
		id: "koobiq-icons",
		label: "Koobiq Icons",
		homepage: "https://github.com/koobiq/icons",
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "24", label: "24", group: "line", roots: ["24"] },
			{ id: "32", label: "32", group: "line", roots: ["32"] },
			{ id: "48", label: "48", group: "line", roots: ["48"] },
			{ id: "64", label: "64", group: "line", roots: ["64"] },
		],
	},
	{
		id: "vk-icons",
		label: "VK Icons",
		homepage: "https://github.com/VKCOM/icons",
		styles: [
			{ id: "12", label: "12", group: "solid", roots: ["12"] },
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "20", label: "20", group: "solid", roots: ["20"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "28", label: "28", group: "solid", roots: ["28"] },
			{ id: "32", label: "32", group: "solid", roots: ["32"] },
			{ id: "34", label: "34", group: "solid", roots: ["34"] },
			{ id: "36", label: "36", group: "solid", roots: ["36"] },
			{ id: "40", label: "40", group: "solid", roots: ["40"] },
			{ id: "44", label: "44", group: "solid", roots: ["44"] },
			{ id: "48", label: "48", group: "solid", roots: ["48"] },
			{ id: "56", label: "56", group: "solid", roots: ["56"] },
			{ id: "64", label: "64", group: "solid", roots: ["64"] },
			{ id: "96", label: "96", group: "solid", roots: ["96"] },
		],
	},
	{
		id: "paymentfont",
		label: "PaymentFont",
		homepage: "https://github.com/AlexanderPoellmann/PaymentFont",
		styles: [{ id: "solid", label: "Icons", group: "solid", roots: ["./"] }],
	},
	{
		id: "doo-iconik",
		label: "doo-iconik",
		homepage: "https://github.com/ajentik/doo-iconik",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	{
		id: "doodle-icons",
		label: "Doodle Icons",
		homepage: "https://github.com/agilek/react-doodle-icons",
		styles: [{ id: "solid", label: "All", group: "solid", roots: ["./"] }],
	},
	{
		id: "eyecons",
		label: "Eyecons",
		homepage: "https://github.com/rubychilds/eyecons",
		styles: [{ id: "solid", label: "All", group: "solid", roots: ["./"] }],
	},
	{
		id: "next-icons",
		label: "Next Icons",
		homepage: "https://github.com/Next-Icons/next-icons",
		styles: [{ id: "line", label: "All", group: "line", roots: ["./"] }],
	},
	// P0_FAMILIES_START
	{
		id: "lawnicons",
		label: "Lawnicons",
		homepage: "https://github.com/lawnchairlauncher/lawnicons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "vscode-icons",
		label: "vscode-icons",
		homepage: "https://github.com/vscode-icons/vscode-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "blobmoji",
		label: "Blobmoji",
		homepage: "https://github.com/c1710/blobmoji",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "ha-cupertino-icons",
		label: "HA Cupertino Icons",
		homepage: "https://github.com/menahishayan/homeassistant-cupertino-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "selfhst-icons",
		label: "selfh.st Icons",
		homepage: "https://github.com/selfhst/icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vscode-material-icons",
		label: "VS Code Material Icon Theme",
		homepage: "https://github.com/PKief/vscode-material-icon-theme",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "catmoji",
		label: "Catmoji",
		homepage: "https://github.com/catmoji/catmoji",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "msr-icons",
		label: "MSR Icons",
		homepage: "https://github.com/minka1902/msr-icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "altrex-icons",
		label: "Altrex Icons",
		homepage: "https://github.com/altrex-ui/altrex-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "neu-icons",
		label: "Neu Icons",
		homepage: "https://github.com/neuicons/neu",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "azure-visio-stencils",
		label: "Azure Visio Stencils",
		homepage: "https://github.com/sandroasp/microsoft-integration-and-azure-stencils-pack-for-visio",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "msemoji",
		label: "MS Emoji",
		homepage: "https://github.com/zdalez/msemoji",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "flat", label: "Flat", group: "solid", roots: ["flat"] },
			{ id: "other", label: "Other", group: "solid", roots: ["other"] },
		],
	},
	{
		id: "papirus-icons",
		label: "Papirus Icons",
		homepage: "https://github.com/PapirusDevelopmentTeam/papirus_icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "semantic-ui-icons",
		label: "Semantic UI Icons",
		homepage: "https://github.com/Semantic-Org/Semantic-UI",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kdesign-icons",
		label: "KDesign Icons",
		homepage: "https://github.com/kingdee/kdesign-icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "airqo-icons",
		label: "AirQo Icons",
		homepage: "https://github.com/airqo-platform/airqo-api",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "iconoteka",
		label: "Iconoteka",
		homepage: "https://github.com/iconoteka/iconoteka",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "livelyicons",
		label: "LivelyIcons",
		homepage: "https://github.com/livelyicons/icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "animateicons",
		label: "AnimateIcons",
		homepage: "https://github.com/avijit07x/animateicons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "calcite-icons",
		label: "Calcite UI Icons",
		homepage: "https://github.com/Esri/calcite-ui-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "country-flags",
		label: "Country Flags",
		homepage: "https://github.com/hjnilsson/country-flags",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "hd-icons",
		label: "HD Icons",
		homepage: "https://github.com/xushier/hd-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "linearicons",
		label: "Linearicons",
		homepage: "https://github.com/cjpatoilo/linearicons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "font-apex",
		label: "Oracle Font APEX",
		homepage: "https://github.com/oracle/font-apex",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "file-icons",
		label: "File Icons",
		homepage: "https://github.com/file-icons/icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "rune-icons",
		label: "Rune Icons",
		homepage: "https://github.com/runeicons/runeicons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "oneui-icons",
		label: "Samsung One UI Icons",
		homepage: "https://github.com/OneUIProject/oneui-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "libreicons",
		label: "LibreICONS",
		homepage: "https://github.com/DennisSuitters/LibreICONS",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "erxes-icons",
		label: "Erxes Icons",
		homepage: "https://github.com/erxes/erxes-icon",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "shopicons",
		label: "ShopIcons",
		homepage: "https://github.com/h2d2-design/h2d2-shopicons",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "filled", label: "Filled", group: "solid", roots: ["filled"] },
			{ id: "light", label: "Light", group: "solid", roots: ["light"] },
			{ id: "regular", label: "Regular", group: "solid", roots: ["regular"] },
		],
	},
	{
		id: "linea-icons",
		label: "Linea Iconset",
		homepage: "https://github.com/linea-io/Linea-Iconset",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "orange-icons",
		label: "Orange Icons",
		homepage: "https://github.com/capybaraicons/orange-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "tech-stack-icons",
		label: "Tech Stack Icon",
		homepage: "https://github.com/yethura-424/tech_stack_icon",
		styles: [
			{ id: "dark", label: "Dark", group: "solid", roots: ["dark"] },
			{ id: "light", label: "Light", group: "solid", roots: ["light"] },
		],
	},
	{
		id: "sketch-icons",
		label: "Sketch Icons",
		homepage: "https://github.com/garudatechnologydevelopers/sketch-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "iconsans",
		label: "Iconsans",
		homepage: "https://github.com/mortezasabihi/iconsans",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "appstract",
		label: "Appstract",
		homepage: "https://github.com/mirrorkeydev/appstract",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "iconspeck",
		label: "Iconspeck",
		homepage: "https://github.com/moser-jose/iconspeck",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "line-md",
		label: "Line MD",
		homepage: "https://github.com/cyberalien/line-md",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "react-crypto-icons",
		label: "React Crypto Icons",
		homepage: "https://github.com/shed3/react-crypto-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "disarto-icons",
		label: "Disarto Icons",
		homepage: "https://github.com/disarto/disarto-icons",
		styles: [
			{ id: "regular", label: "Regular", group: "solid", roots: ["regular"] },
			{ id: "solid", label: "Fill", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "awsicons",
		label: "AWS Icons",
		homepage: "https://github.com/boyney123/awsicons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "brightlayer-icons",
		label: "Brightlayer UI Icons",
		homepage: "https://github.com/etn-ccis/blui-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "basil-icons",
		label: "Basil Icons",
		homepage: "https://github.com/jonybekov/react-basil",
		styles: [
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "solid", label: "Fill", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "cryptocoins",
		label: "Cryptocoins",
		homepage: "https://github.com/allienworks/cryptocoins",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "moving-icons",
		label: "Moving Icons",
		homepage: "https://github.com/jis3r/icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "rpg-awesome",
		label: "Rpg Awesome",
		homepage: "https://github.com/nagoshiashumari/Rpg-Awesome",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sketchybar-app-font",
		label: "Sketchybar App Font",
		homepage: "https://github.com/kvndrsslr/sketchybar-app-font",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "icoziv",
		label: "Icoziv",
		homepage: "https://github.com/thuongtruong109/icoziv",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "opentiny-icons",
		label: "OpenTiny Icons",
		homepage: "https://github.com/opentiny/icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "orbit-icons",
		label: "Orbit Icons",
		homepage: "https://github.com/kiwicom/orbit",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mhw-icons",
		label: "Monster Hunter Icons",
		homepage: "https://github.com/othellorhin/mhw_icons_svg",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "frost-icons",
		label: "Frost Icon Theme",
		homepage: "https://github.com/thissayantan/frost-icon-theme",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "arashi-icons",
		label: "Arashi Icon Set",
		homepage: "https://github.com/0hstormy/arashi",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "suomifi-icons",
		label: "Suomi.fi Icons",
		homepage: "https://github.com/vrk-kpa/suomifi-icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "bootstrap-italia-icons",
		label: "Bootstrap Italia Icons",
		homepage: "https://github.com/italia/bootstrap-italia",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "bancos-svg",
		label: "Bancos em SVG",
		homepage: "https://github.com/tgentil/bancos-em-svg",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "buckaroo-icons",
		label: "Buckaroo Payment Media",
		homepage: "https://github.com/buckaroo-it/media",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "ontario-icons",
		label: "Ontario Design System Icons",
		homepage: "https://github.com/ongov/Ontario-Design-System",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vigil-icons",
		label: "Vigil Icons",
		homepage: "https://github.com/vigilantkeno/vigil-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "helldivers-icons",
		label: "Helldivers 2 Stratagems",
		homepage: "https://github.com/nvigneux/helldivers-2-stratagems-icons-svg",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vscode-iconset",
		label: "VS Code Iconset",
		homepage: "https://github.com/be5invis/vscode-iconset",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "illustration-foundry",
		label: "Illustration Foundry",
		homepage: "https://github.com/iamtouchskyer/illustration-foundry",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "duo-blazor-icons",
		label: "Duo Blazor Icons",
		homepage: "https://github.com/ricardoboss/DuoBlazorIcons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "cryptofont",
		label: "CryptoFont",
		homepage: "https://github.com/AlexanderPoellmann/CryptoFont",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "proxy-app-icons",
		label: "Proxy App Icon Set",
		homepage: "https://github.com/arpicme/proxy-app-icon-set",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pureiconpack-morirain",
		label: "PureIconPack (morirain)",
		homepage: "https://github.com/morirain/pureiconpack",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "idea-icon-pack",
		label: "Idea Icon Pack",
		homepage: "https://github.com/krasa/ideaiconpack",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "material-os-icons",
		label: "Material OS Icon Pack",
		homepage: "https://github.com/materialos/android-icon-pack",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "justvector-icons",
		label: "JustVector Icons",
		homepage: "https://github.com/seich/justvector-icons-font",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "hyperliquid-icons",
		label: "Hyperliquid Coin SVGs",
		homepage: "https://github.com/zengdard/hyperliquid-coin-svgs",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "counter-strike-icons",
		label: "Counter-Strike Icons",
		homepage: "https://github.com/juknum/counter-strike-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "flow-icons",
		label: "Flow Icons",
		homepage: "https://github.com/benjaminhalko/flow-icons-zed",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "climacons",
		label: "Climacons",
		homepage: "https://github.com/ghys/org.openhab.ui.iconset.climacons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "get-it-on-badges",
		label: "Get It On Badges",
		homepage: "https://github.com/nyxiereal/get-it-on",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "lovelace-weather-icons",
		label: "Lovelace Weather Icons",
		homepage: "https://github.com/scinos/lovelace-weather-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "astroicons",
		label: "Astroicons",
		homepage: "https://github.com/marcmarine/astroicons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "ha-energy-icons",
		label: "HA Energy Node Icons",
		homepage: "https://github.com/developer-simon/ha-energy-node-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pixel-vault",
		label: "Pixel Vault",
		homepage: "https://github.com/fanquanpp/pixel-vault",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "nsw-icons",
		label: "NSW Design System Icons",
		homepage: "https://github.com/digitalnsw/nsw-design-system",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "taurbalaur-icons",
		label: "taurbalaur SVG Icons",
		homepage: "https://github.com/taurbalaur/svg-icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "slate-icons",
		label: "Slate Free SVG Icons",
		homepage: "https://github.com/evanwork34/slate-free-svg-icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "orangeclock-icons",
		label: "Orangeclock Icons",
		homepage: "https://github.com/easyuxd/orangeclock-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "fxos-icons",
		label: "Firefox OS Icons",
		homepage: "https://github.com/fxos-components/fxos-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "geomicons",
		label: "Geomicons Open",
		homepage: "https://github.com/jxnblk/geomicons-open",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "govicons",
		label: "GovIcons",
		homepage: "https://github.com/540co/govicons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "metro-ui-icons",
		label: "Metro UI Icons",
		homepage: "https://github.com/olton/metroui",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "themeisle-icons",
		label: "ThemeIsle Icons",
		homepage: "https://github.com/Codeinwp/themeisle-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "olicons",
		label: "Olicons",
		homepage: "https://github.com/owlling/olicons",
		styles: [
			{ id: "fill", label: "Fill", group: "solid", roots: ["fill"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "sharp-fill", label: "Sharp Fill", group: "solid", roots: ["sharp-fill"] },
			{ id: "sharp-outline", label: "Sharp Outline", group: "line", roots: ["sharp-outline"] },
		],
	},
	{
		id: "weather-underground-icons",
		label: "Weather Underground Icons",
		homepage: "https://github.com/manifestinteractive/weather-underground-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "solid", label: "Fill", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sjjb-map-icons",
		label: "SJJB Map Icons",
		homepage: "https://github.com/jalbertbowden/ssjb-map-icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "la-capitaine-icons",
		label: "La Capitaine Icon Theme",
		homepage: "https://github.com/keeferrourke/la-capitaine-icon-theme",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "tango-icons",
		label: "Tango Icon Theme",
		homepage: "https://github.com/stephenc/tango-icon-theme",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "zocial",
		label: "Zocial",
		homepage: "https://github.com/smcllns/css-social-buttons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kamon",
		label: "Kamon",
		homepage: "https://github.com/nota/kamon",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "file-icon-vectors",
		label: "File Icon Vectors",
		homepage: "https://github.com/dmhendricks/file-icon-vectors",
		styles: [
			{ id: "classic", label: "Classic", group: "solid", roots: ["classic"] },
			{ id: "high-contrast", label: "High Contrast", group: "solid", roots: ["high-contrast"] },
			{ id: "square-o", label: "Square O", group: "solid", roots: ["square-o"] },
			{ id: "vivid", label: "Vivid", group: "solid", roots: ["vivid"] },
		],
	},
	{
		id: "nataicons",
		label: "Nataicons",
		homepage: "https://github.com/afnizarnur/nataicons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "icon-brew",
		label: "Icon Brew",
		homepage: "https://github.com/elrumo/icon-brew",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "dripicons",
		label: "Dripicons",
		homepage: "https://github.com/amitjakhu/dripicons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "badgen-icons",
		label: "Badgen Icons",
		homepage: "https://github.com/badgen/badgen-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "elementor-icons",
		label: "Elementor Icons",
		homepage: "https://github.com/elementor/elementor-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "icofont",
		label: "IcoFont",
		homepage: "https://github.com/LuanHimmlisch/icofont",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "jtb-icons",
		label: "JTB Icons",
		homepage: "https://github.com/marmooo/jtb-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "instructure-icons",
		label: "Instructure UI Icons",
		homepage: "https://github.com/instructure/instructure-ui",
		styles: [
			{ id: "custom", label: "Custom", group: "line", roots: ["custom"] },
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Fill", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vitamix",
		label: "Vitamix (Decathlon)",
		homepage: "https://github.com/Decathlon/vitamin-web",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "orchid-icons",
		label: "Orchid Icons",
		homepage: "https://github.com/orchidsoftware/icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sanity-icons",
		label: "Sanity Icons",
		homepage: "https://github.com/sanity-io/icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "toe-icons",
		label: "Toe Icons",
		homepage: "https://github.com/javisperez/toe-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "zero-icons",
		label: "Zero Icons",
		homepage: "https://github.com/leungwensen/svg-icon",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vectorlogozone",
		label: "VectorLogoZone",
		homepage: "https://github.com/vectorlogozone/vectorlogozone",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "bank-logos",
		label: "Bank Logos",
		homepage: "https://github.com/icongo/bank-logos",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "powerbi-icons",
		label: "Power BI Icons",
		homepage: "https://github.com/microsoft/PowerBI-Icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pe-7-stroke",
		label: "Pe-icon-7-stroke",
		homepage: "https://github.com/olimsaidov/pixeden-stroke-7-icon",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "small-n-flat",
		label: "Small-n-flat",
		homepage: "https://github.com/paomedia/small-n-flat",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "issuer-icons",
		label: "Raivo Issuer Icons",
		homepage: "https://github.com/raivo-otp/issuer-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "microns",
		label: "Microns",
		homepage: "https://github.com/stephenhutchings/microns",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "svg-loaders",
		label: "SVG Loaders",
		homepage: "https://github.com/SamHerbert/SVG-Loaders",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "azure-icon-collection",
		label: "Azure Icon Collection",
		homepage: "https://github.com/benc-uk/icon-collection",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "inkscape-open-symbols",
		label: "Inkscape Open Symbols",
		homepage: "https://github.com/PanderMusubi/inkscape-open-symbols",
		styles: [
			{ id: "circuitikz", label: "Circuitikz", group: "solid", roots: ["circuitikz"] },
			{ id: "genericons", label: "Genericons", group: "solid", roots: ["genericons"] },
			{ id: "gnome", label: "Gnome", group: "solid", roots: ["gnome"] },
			{ id: "nautic", label: "Nautic", group: "line", roots: ["nautic"] },
			{ id: "nautic-outline", label: "Nautic Outline", group: "solid", roots: ["nautic-outline"] },
			{ id: "suru", label: "Suru", group: "solid", roots: ["suru"] },
			{ id: "taiga", label: "Taiga", group: "solid", roots: ["taiga"] },
		],
	},
	{
		id: "breeze-icons",
		label: "KDE Breeze Icons",
		homepage: "https://github.com/KDE/breeze-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "yaru-icons",
		label: "Ubuntu Yaru",
		homepage: "https://github.com/ubuntu/yaru",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "adwaita-icons",
		label: "GNOME Adwaita",
		homepage: "https://github.com/GNOME/adwaita-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "elementary-icons",
		label: "Elementary OS Icons",
		homepage: "https://github.com/elementary/icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "tela-icons",
		label: "Tela Icon Theme",
		homepage: "https://github.com/vinceliuice/Tela-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "whitesur-icons",
		label: "WhiteSur Icon Theme",
		homepage: "https://github.com/vinceliuice/WhiteSur-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "fluent-icon-theme",
		label: "Fluent Icon Theme",
		homepage: "https://github.com/vinceliuice/Fluent-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "qogir-icons",
		label: "Qogir Icon Theme",
		homepage: "https://github.com/vinceliuice/Qogir-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "vimix-icons",
		label: "Vimix Icon Theme",
		homepage: "https://github.com/vinceliuice/vimix-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "kora-icons",
		label: "Kora Icon Theme",
		homepage: "https://github.com/bikass/kora",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "numix-circle",
		label: "Numix Circle",
		homepage: "https://github.com/numixproject/numix-icon-theme-circle",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "flat-remix-icons",
		label: "Flat Remix Icons",
		homepage: "https://github.com/daniruiz/flat-remix",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "we10x-icons",
		label: "We10X Icon Theme",
		homepage: "https://github.com/yeyushengfan258/We10X-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mcmojave-icons",
		label: "McMojave Circle",
		homepage: "https://github.com/vinceliuice/McMojave-circle",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "deepin-icons",
		label: "Deepin Icon Theme",
		homepage: "https://github.com/linuxdeepin/deepin-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "candy-icons",
		label: "Candy Icons",
		homepage: "https://github.com/EliverLara/candy-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "suru-plus-icons",
		label: "Suru Plus",
		homepage: "https://github.com/Gusbemacbe/suru-plus",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "paper-icons",
		label: "Paper Icon Theme",
		homepage: "https://github.com/snwh/paper-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "moka-icons",
		label: "Moka Icon Theme",
		homepage: "https://github.com/moka-project/moka-icon-theme",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "faenza-icons",
		label: "Faenza Icon Theme",
		homepage: "https://github.com/shlinux/faenza-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "solana-token-icons",
		label: "Solana Token List",
		homepage: "https://github.com/solana-labs/token-list",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "cosmos-chain-icons",
		label: "Cosmos Chain Registry",
		homepage: "https://github.com/cosmos/chain-registry",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "bioicons",
		label: "Bioicons",
		homepage: "https://github.com/duerrsimon/bioicons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "cncf-artwork",
		label: "CNCF Artwork",
		homepage: "https://github.com/cncf/artwork",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "webawesome-icons",
		label: "Web Awesome Icons",
		homepage: "https://github.com/shoelace-style/webawesome",
		styles: [
			{ id: "jelly", label: "Jelly", group: "solid", roots: ["jelly"] },
			{ id: "solid", label: "Fill", group: "solid", roots: ["solid"] },
			{ id: "utility", label: "Utility", group: "solid", roots: ["utility"] },
		],
	},
	{
		id: "arc-icons",
		label: "Arc Icon Theme",
		homepage: "https://github.com/Horst3180/arc-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "colloid-icons",
		label: "Colloid Icon Theme",
		homepage: "https://github.com/vinceliuice/Colloid-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "emerald-icons",
		label: "Emerald Icon Theme",
		homepage: "https://github.com/vinceliuice/emerald-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mactahoe-icons",
		label: "MacTahoe Icon Theme",
		homepage: "https://github.com/vinceliuice/MacTahoe-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "tela-circle-icons",
		label: "Tela Circle",
		homepage: "https://github.com/vinceliuice/Tela-circle-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "bigsur-icons",
		label: "BigSur Icon Theme",
		homepage: "https://github.com/yeyushengfan258/BigSur-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "bigsur-elegant-icons",
		label: "BigSur Elegant",
		homepage: "https://github.com/yeyushengfan258/BigSur-Elegant-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "bubble-icons",
		label: "Bubble Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Bubble-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "fantasy-icons",
		label: "Fantasy Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Fantasy-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "glory-icons",
		label: "Glory Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Glory-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "inverse-icons",
		label: "Inverse Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Inverse-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "lyra-icons",
		label: "Lyra Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Lyra-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mcmuse-icons",
		label: "McMuse Icon Theme",
		homepage: "https://github.com/yeyushengfan258/McMuse-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "miya-icons",
		label: "Miya Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Miya-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "reversal-icons",
		label: "Reversal Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Reversal-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "win10sur-icons",
		label: "Win10Sur Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Win10Sur-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "win11-icons",
		label: "Win11 Icon Theme",
		homepage: "https://github.com/yeyushengfan258/Win11-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "zafiro-icons",
		label: "Zafiro Icons",
		homepage: "https://github.com/zayronxio/Zafiro-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "os-catalina-icons",
		label: "OS Catalina Icons",
		homepage: "https://github.com/zayronxio/Os-Catalina-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "uos-icons",
		label: "UOS Icons",
		homepage: "https://github.com/zayronxio/Uos-fulldistro-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "oranchelo-icons",
		label: "Oranchelo Icon Theme",
		homepage: "https://github.com/zayronxio/oranchelo-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "color-flow-icons",
		label: "Color Flow Icons",
		homepage: "https://github.com/zayronxio/Color.Flow.Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "ketsa-icons",
		label: "Ketsa Icon Theme",
		homepage: "https://github.com/zayronxio/ketsa-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "komps-icons",
		label: "Komps Icon Theme",
		homepage: "https://github.com/zayronxio/komps-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "elementary-kde-icons",
		label: "Elementary KDE Icons",
		homepage: "https://github.com/zayronxio/Elementary-KDE-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mint-l-icons",
		label: "Mint L Icons",
		homepage: "https://github.com/linuxmint/mint-l-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mint-x-icons",
		label: "Mint X Icons",
		homepage: "https://github.com/linuxmint/mint-x-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mint-y-icons",
		label: "Mint Y Icons",
		homepage: "https://github.com/linuxmint/mint-y-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "numix-icons",
		label: "Numix",
		homepage: "https://github.com/numixproject/numix-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "numix-square",
		label: "Numix Square",
		homepage: "https://github.com/numixproject/numix-icon-theme-square",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "papirus-icon-theme",
		label: "Papirus Icon Theme",
		homepage: "https://github.com/PapirusDevelopmentTeam/papirus-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "oxygen-icons",
		label: "Oxygen Icons",
		homepage: "https://github.com/KDE/oxygen-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mate-icons",
		label: "MATE Icon Theme",
		homepage: "https://github.com/mate-desktop/mate-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "flatery-icons",
		label: "Flatery",
		homepage: "https://github.com/cbrnix/Flatery",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "newaita-icons",
		label: "Newaita",
		homepage: "https://github.com/cbrnix/Newaita",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "newaita-reborn",
		label: "Newaita Reborn",
		homepage: "https://github.com/cbrnix/Newaita-reborn",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "breeze-chameleon",
		label: "Breeze Chameleon",
		homepage: "https://github.com/L4ki/Breeze-Chameleon-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "breeze-noir",
		label: "Breeze Noir",
		homepage: "https://github.com/L4ki/Breeze-Noir-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "spectrum-color-icons",
		label: "Spectrum Color Icons",
		homepage: "https://github.com/L4ki/Spectrum-Color-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "breeze-opensuse",
		label: "Breeze openSUSE",
		homepage: "https://github.com/L4ki/Breeze-openSUSE-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "breeze-blur",
		label: "Breeze Blur",
		homepage: "https://github.com/L4ki/Breeze-Blur-Glassy-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "breeze-blue",
		label: "Breeze Blue",
		homepage: "https://github.com/L4ki/Breeze-Blue-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "breeze-splendent",
		label: "Breeze Splendent",
		homepage: "https://github.com/L4ki/Breeze-Splendent-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "breeze-shamrock",
		label: "Breeze Shamrock",
		homepage: "https://github.com/L4ki/Breeze-Shamrock-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "breeze-phoenix",
		label: "Breeze Phoenix",
		homepage: "https://github.com/L4ki/Breeze-Phoenix-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "josemi-icons",
		label: "Josemi Icons",
		homepage: "https://github.com/jmjuanes/icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "serendie-symbols",
		label: "Serendie Symbols",
		homepage: "https://github.com/serendie/serendie-symbols",
		styles: [
			{ id: "filled", label: "Filled", group: "solid", roots: ["filled"] },
			{ id: "outlined", label: "Outlined", group: "line", roots: ["outlined"] },
		],
	},
	{
		id: "icomo",
		label: "Icomo",
		homepage: "https://github.com/zainadeel/icomo",
		styles: [
			{ id: "map", label: "Map", group: "solid", roots: ["map"] },
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "city-icons",
		label: "City Icons",
		homepage: "https://github.com/anto1/city-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "puxl-icons",
		label: "PUXL Icons",
		homepage: "https://github.com/bolonio/react-puxl-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "databricks-icons",
		label: "Databricks Architecture Icons",
		homepage: "https://github.com/oieduardorabelo/databricks-architecture-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "mono", label: "Mono", group: "solid", roots: ["mono"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "tile", label: "Tile", group: "solid", roots: ["tile"] },
		],
	},
	{
		id: "charmed-icons",
		label: "Charmed Icons",
		homepage: "https://github.com/littensy/charmed-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "open-crop-icons",
		label: "Open Crop Icons",
		homepage: "https://github.com/openfarmcc/open-crop-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "soaring-symbols",
		label: "Soaring Symbols",
		homepage: "https://github.com/soaring-symbols/soaring-symbols",
		styles: [
			{ id: "icon", label: "Icon", group: "solid", roots: ["icon"] },
			{ id: "icon-mono", label: "Icon Mono", group: "solid", roots: ["icon-mono"] },
			{ id: "logo", label: "Logo", group: "solid", roots: ["logo"] },
			{ id: "logo-mono", label: "Logo Mono", group: "solid", roots: ["logo-mono"] },
			{ id: "tail", label: "Tail", group: "solid", roots: ["tail"] },
		],
	},
	{
		id: "frog-emojis",
		label: "Frog Emojis",
		homepage: "https://github.com/Riesi/frog_emojis",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "moda-icons",
		label: "Moda Operandi Icons",
		homepage: "https://github.com/ModaOperandi/icons",
		styles: [
			{ id: "12", label: "12", group: "solid", roots: ["12"] },
			{ id: "14", label: "14", group: "solid", roots: ["14"] },
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "20", label: "20", group: "solid", roots: ["20"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "32", label: "32", group: "solid", roots: ["32"] },
			{ id: "36", label: "36", group: "solid", roots: ["36"] },
			{ id: "40", label: "40", group: "solid", roots: ["40"] },
			{ id: "44", label: "44", group: "solid", roots: ["44"] },
			{ id: "48", label: "48", group: "solid", roots: ["48"] },
			{ id: "60", label: "60", group: "solid", roots: ["60"] },
			{ id: "72", label: "72", group: "solid", roots: ["72"] },
		],
	},
	{
		id: "scholar-icons",
		label: "Scholar Icons",
		homepage: "https://github.com/louisfacun/scholar-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sparkle-icons",
		label: "Sparkle Icons",
		homepage: "https://github.com/slaylines/sparkle-icons",
		styles: [
			{ id: "black", label: "Black", group: "solid", roots: ["black"] },
			{ id: "colored", label: "Colored", group: "solid", roots: ["colored"] },
			{ id: "light", label: "Light", group: "solid", roots: ["light"] },
		],
	},
	{
		id: "analog-gothic",
		label: "Analog Gothic",
		homepage: "https://github.com/hastefuI/analog-gothic",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "dev-hearts",
		label: "Dev Hearts",
		homepage: "https://github.com/lukeocodes/dev-hearts",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "chess-art",
		label: "Chess Art",
		homepage: "https://github.com/maurimo/chess-art",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "thermal-comfort-icons",
		label: "Thermal Comfort Icons",
		homepage: "https://github.com/rautesamtr/thermal_comfort_icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "orange-accessibility-icons",
		label: "Orange Accessibility Icons",
		homepage: "https://github.com/Orange-OpenSource/Accessibility-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "intellij-icons",
		label: "IntelliJ Platform Icons",
		homepage: "https://github.com/JetBrains/intellij-community",
		styles: [
			{ id: "classic", label: "Classic", group: "solid", roots: ["classic"] },
			{ id: "new-ui", label: "New Ui", group: "solid", roots: ["new-ui"] },
		],
	},
	{
		id: "gruvbox-plus-icons",
		label: "Gruvbox Plus Icons",
		homepage: "https://github.com/SylEleuth/gruvbox-plus-icon-pack",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "hatter-icons",
		label: "Hatter Icons",
		homepage: "https://github.com/Mibea/Hatter",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "adwaita-plus-icons",
		label: "Adwaita++ Icons",
		homepage: "https://github.com/Bonandry/adwaita-plus",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "nordzy-icons",
		label: "Nordzy Icons",
		homepage: "https://github.com/MolassesLover/Nordzy-icon",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "yaru-plus-icons",
		label: "Yaru++ Icons",
		homepage: "https://github.com/Bonandry/yaru-plus",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "suru-plus-ubuntu-icons",
		label: "Suru++ Ubuntu",
		homepage: "https://github.com/Bonandry/suru-plus-ubuntu",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "obsidian-icons",
		label: "Obsidian Icons",
		homepage: "https://github.com/madmaxms/iconpack-obsidian",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "lila-hd-icons",
		label: "Lila HD Icons",
		homepage: "https://github.com/ilnanny75/Lila-HD-Icon-Theme-Official",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "neo-candy-icons",
		label: "Neo Candy Icons",
		homepage: "https://github.com/erikdubois/neo-candy-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "halo-icons",
		label: "Halo Icons",
		homepage: "https://github.com/erikdubois/halo-icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "masalla-icons",
		label: "Masalla Icons",
		homepage: "https://github.com/masalla-art/masalla-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "evolvere-icons",
		label: "Evolvere Icons",
		homepage: "https://github.com/franksouza183/Evolvere-Icons",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "libreoffice-colibre",
		label: "LibreOffice Colibre",
		homepage: "https://github.com/LibreOffice/core",
		styles: [
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "32", label: "32", group: "solid", roots: ["32"] },
			{ id: "misc", label: "Misc", group: "solid", roots: ["misc"] },
		],
	},
	{
		id: "libreoffice-karasa-jaga",
		label: "LibreOffice Karasa Jaga",
		homepage: "https://github.com/LibreOffice/core",
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "24", label: "24", group: "line", roots: ["24"] },
			{ id: "32", label: "32", group: "line", roots: ["32"] },
			{ id: "misc", label: "Misc", group: "solid", roots: ["misc"] },
		],
	},
	{
		id: "libreoffice-sukapura",
		label: "LibreOffice Sukapura",
		homepage: "https://github.com/LibreOffice/core",
		styles: [
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "32", label: "32", group: "solid", roots: ["32"] },
			{ id: "misc", label: "Misc", group: "solid", roots: ["misc"] },
		],
	},
	{
		id: "libreoffice-elementary",
		label: "LibreOffice Elementary",
		homepage: "https://github.com/LibreOffice/core",
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "24", label: "24", group: "line", roots: ["24"] },
			{ id: "32", label: "32", group: "line", roots: ["32"] },
			{ id: "misc", label: "Misc", group: "line", roots: ["misc"] },
		],
	},
	{
		id: "libreoffice-sifr",
		label: "LibreOffice Sifr",
		homepage: "https://github.com/LibreOffice/core",
		styles: [
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "32", label: "32", group: "solid", roots: ["32"] },
			{ id: "misc", label: "Misc", group: "solid", roots: ["misc"] },
		],
	},
	{
		id: "libreoffice-breeze",
		label: "LibreOffice Breeze",
		homepage: "https://github.com/LibreOffice/core",
		styles: [
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "32", label: "32", group: "solid", roots: ["32"] },
			{ id: "misc", label: "Misc", group: "solid", roots: ["misc"] },
		],
	},
	{
		id: "suru-icons",
		label: "Suru Icons",
		homepage: "https://github.com/snwh/suru-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "libreoffice-yaru-icons",
		label: "LibreOffice Yaru",
		homepage: "https://github.com/ubuntu/libreoffice-style-yaru-fullcolor",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "atom-material-icons",
		label: "Atom Material Icons",
		homepage: "https://github.com/AtomMaterialUI/a-file-icon-idea",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "carbon-pictograms",
		label: "IBM Carbon Pictograms",
		homepage: "https://github.com/carbon-design-system/carbon",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sap-icons",
		label: "SAP Icons",
		homepage: "https://github.com/SAP/theming-base-content",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sap-horizon-icons",
		label: "SAP Horizon Icons",
		homepage: "https://github.com/SAP/theming-base-content",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "red-hat-icons",
		label: "Red Hat Icons",
		homepage: "https://github.com/RedHat-UX/red-hat-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "aksel-icons",
		label: "Aksel Icons",
		homepage: "https://github.com/navikt/aksel",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "gestalt-icons",
		label: "Gestalt Icons",
		homepage: "https://github.com/pinterest/gestalt",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "auro-icons",
		label: "Auro Icons",
		homepage: "https://github.com/AlaskaAirlines/Icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mulberry-symbols",
		label: "Mulberry Symbols",
		homepage: "https://github.com/mulberrysymbols/mulberry-symbols",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "openmoji-black",
		label: "OpenMoji Black",
		homepage: "https://github.com/hfg-gmuend/openmoji",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "qgis-icons",
		label: "QGIS Icons",
		homepage: "https://github.com/qgis/QGIS",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "godot-icons",
		label: "Godot Editor Icons",
		homepage: "https://github.com/godotengine/godot",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "spectrum2-icons",
		label: "Spectrum 2 Icons",
		homepage: "https://github.com/adobe/react-spectrum",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mapillary-signs",
		label: "Mapillary Traffic Signs",
		homepage: "https://github.com/mapillary/mapillary_sprite_source",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "osm-carto-symbols",
		label: "OSM Carto Symbols",
		homepage: "https://github.com/openstreetmap-carto/openstreetmap-carto",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "nps-symbols",
		label: "NPS Map Symbols",
		homepage: "https://github.com/nationalparkservice/symbol-library",
		styles: [
			{ id: "14", label: "14", group: "solid", roots: ["14"] },
			{ id: "22", label: "22", group: "solid", roots: ["22"] },
			{ id: "30", label: "30", group: "solid", roots: ["30"] },
		],
	},
	{
		id: "krita-icons",
		label: "Krita Icons",
		homepage: "https://github.com/KDE/krita",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kicad-icons",
		label: "KiCad Icons",
		homepage: "https://github.com/KiCad/kicad-source-mirror",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "freecad-icons",
		label: "FreeCAD Icons",
		homepage: "https://github.com/FreeCAD/FreeCAD",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vscode-symbols",
		label: "Symbols (VS Code)",
		homepage: "https://github.com/miguelsolorio/vscode-symbols",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "bearded-icons",
		label: "Bearded Icons",
		homepage: "https://github.com/BeardedBear/bearded-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "great-icons",
		label: "Great Icons",
		homepage: "https://github.com/EmmanuelBeziat/vscode-great-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "material-product-icons",
		label: "Material Product Icons",
		homepage: "https://github.com/PKief/vscode-material-product-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vscode-simple-icons",
		label: "Simple Icons (VS Code)",
		homepage: "https://github.com/LaurentTreguier/vscode-simple-icons",
		styles: [
			{ id: "minimalistic", label: "Minimalistic", group: "line", roots: ["minimalistic"] },
			{ id: "simple", label: "Simple", group: "solid", roots: ["simple"] },
		],
	},
	{
		id: "withicons",
		label: "With Icons",
		homepage: "https://github.com/withevergrow/withicons",
		styles: [
			{ id: "anime", label: "Anime", group: "solid", roots: ["anime"] },
			{ id: "bauhaus", label: "Bauhaus", group: "solid", roots: ["bauhaus"] },
			{ id: "blueprint", label: "Blueprint", group: "line", roots: ["blueprint"] },
			{ id: "coquette", label: "Coquette", group: "solid", roots: ["coquette"] },
			{ id: "duo", label: "Duo", group: "solid", roots: ["duo"] },
			{ id: "engrave", label: "Engrave", group: "line", roots: ["engrave"] },
			{ id: "glass", label: "Glass", group: "solid", roots: ["glass"] },
			{ id: "gloss", label: "Gloss", group: "solid", roots: ["gloss"] },
			{ id: "gothic", label: "Gothic", group: "solid", roots: ["gothic"] },
			{ id: "kawaii", label: "Kawaii", group: "line", roots: ["kawaii"] },
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "luxe", label: "Luxe", group: "solid", roots: ["luxe"] },
			{ id: "pastel", label: "Pastel", group: "solid", roots: ["pastel"] },
			{ id: "pixel", label: "Pixel", group: "solid", roots: ["pixel"] },
			{ id: "plush", label: "Plush", group: "solid", roots: ["plush"] },
			{ id: "retro", label: "Retro", group: "solid", roots: ["retro"] },
			{ id: "sketch", label: "Sketch", group: "line", roots: ["sketch"] },
			{ id: "skeuo", label: "Skeuo", group: "line", roots: ["skeuo"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "sticker", label: "Sticker", group: "solid", roots: ["sticker"] },
		],
	},
	{
		id: "finicon",
		label: "Finicon",
		homepage: "https://www.npmjs.com/package/finicon",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "reicon-glass",
		label: "Reicon Glass",
		homepage: "https://github.com/dqev/reicon-glass",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "obra-icons",
		label: "Obra Icons",
		homepage: "https://github.com/Obra-Studio/obra-icons-mr",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "meya-icons",
		label: "Meya Icons",
		homepage: "https://github.com/nazmijavier/meya-icons",
		styles: [
			{ id: "duotone", label: "Duotone", group: "solid", roots: ["duotone"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
		],
	},
	{
		id: "iconimate",
		label: "Iconimate",
		homepage: "https://github.com/smammar100/Iconimate",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "itshover",
		label: "Its Hover",
		homepage: "https://github.com/itshover/itshover",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "mx-icons",
		label: "MX Icons",
		homepage: "https://github.com/ig-imanish/mx-icons",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "broken", label: "Broken", group: "line", roots: ["broken"] },
			{ id: "bulk", label: "Bulk", group: "solid", roots: ["bulk"] },
			{ id: "linear", label: "Linear", group: "line", roots: ["linear"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "twotone", label: "Twotone", group: "line", roots: ["twotone"] },
		],
	},
	{
		id: "koven-animated-icons",
		label: "Animated Icons (Koven Labs)",
		homepage: "https://github.com/kovenlabs/animated-icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "singularity-icons",
		label: "Singularity Icons",
		homepage: "https://github.com/singularityos-lab/singularity-themes",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	// P0_FAMILIES_END
	// GAP_300K_START
	{
		id: "albybarber-bettercons",
		label: "bettercons",
		homepage: "https://github.com/albybarber/bettercons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1306053",
		label: "CarbonBannerIcons",
		homepage: "https://www.opendesktop.org/p/1306053",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "penguin-fyi-ngui-blue-icon-theme",
		label: "NGUI Blue",
		homepage: "https://github.com/penguin-fyi/ngui-blue-icon-theme",
		license: "MIT",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "boolfly-chat-icons",
		label: "@boolfly.chat/icons",
		homepage: "https://www.npmjs.com/package/@boolfly.chat/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "xprateek-lazycons-pro",
		label: "Lazycons Pro",
		homepage: "https://github.com/xprateek/lazycons_pro",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "ui-primitives",
		label: "Alfa-Bank core-ds UI primitives (icons, glyphs, logos, flags)",
		homepage: "https://www.npmjs.com/package/ui-primitives",
		license: "MIT (package.json only; no LICENSE file in repo)",
		styles: [
			{ id: "glyph", label: "Glyph", group: "solid", roots: ["glyph"] },
			{ id: "icon", label: "Icon", group: "solid", roots: ["icon"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2158340",
		label: "Besgnulinux Circle",
		homepage: "https://www.opendesktop.org/p/2158340",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "secret-chest-papier",
		label: "Papier",
		homepage: "https://github.com/secret-chest/papier",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2049257",
		label: "Fekete",
		homepage: "https://www.opendesktop.org/p/2049257",
		license: "CC-BY (Pling licence field)",
		attribution: "https://www.opendesktop.org/p/2049257",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "kusaida-adwair",
		label: "Adwair",
		homepage: "https://github.com/kusaida/adwair",
		license: "GPL-3.0 (README)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "swisspost-design-system-icons",
		label: "Swiss Post design system icons",
		homepage: "https://www.npmjs.com/package/@swisspost/design-system-icons",
		license: "Apache-2.0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "momentum-icons",
		label: "Cisco Momentum Design icons",
		homepage: "https://github.com/momentum-design/momentum-design",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "glyphra-icons",
		label: "@glyphra/icons",
		homepage: "https://www.npmjs.com/package/@glyphra/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "fill", label: "Fill", group: "solid", roots: ["fill"] },
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2338310",
		label: "Slot Nord Dark Colorize Icons",
		homepage: "https://www.opendesktop.org/p/2338310",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "manjaro-contrib-artwork-icon-themes-vertex-maia-icon-themes",
		label: "Manjaro Vertex-Maia icon themes",
		homepage: "https://github.com/manjaro-contrib/artwork-icon-themes-vertex-maia-icon-themes",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2307303",
		label: "Besgnulinux paperbox icon theme",
		homepage: "https://www.opendesktop.org/p/2307303",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "nicklasvraa-novaos-nord-icons",
		label: "NovaOS Nord",
		homepage: "https://github.com/nicklasvraa/novaos-nord-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mdomlop-retrosmart-icon-theme",
		label: "Retrosmart",
		homepage: "https://github.com/mdomlop/retrosmart-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2150463",
		label: "Besgnulinux Colors",
		homepage: "https://www.opendesktop.org/p/2150463",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mblode-icons",
		label: "icons",
		homepage: "https://github.com/mblode/icons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "momentum-ui-icons-rebrand",
		label: "Cisco Momentum UI icons (rebrand)",
		homepage: "https://www.npmjs.com/package/@momentum-ui/icons-rebrand",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "sonakinci41-damadamas-icon-theme",
		label: "Damadamas",
		homepage: "https://github.com/sonakinci41/damadamas-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "brave-leo",
		label: "Brave Leo icons",
		homepage: "https://github.com/brave/leo",
		license: "MPL-2.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "sbb-esta-icons",
		label: "@sbb-esta/icons",
		homepage: "https://www.npmjs.com/package/@sbb-esta/icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "ju1464-simply-circles-icons",
		label: "Simply Circles",
		homepage: "https://github.com/ju1464/simply_circles_icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "plagamedicum-plaguesur-icon-theme",
		label: "PlagueSur",
		homepage: "https://github.com/plagamedicum/plaguesur-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2259284",
		label: "Bes Own Color Icon Theme",
		homepage: "https://www.opendesktop.org/p/2259284",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "linesty-project-linesty-icon-theme",
		label: "Linesty",
		homepage: "https://github.com/linesty-project/linesty-icon-theme",
		license: "GPL-3.0 / CC-BY-SA-4.0 (derived from Papirus + COSMIC)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "cluue-icons",
		label: "@cluue/icons",
		homepage: "https://www.npmjs.com/package/@cluue/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "filled", label: "Filled", group: "solid", roots: ["filled"] },
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1276635",
		label: "Sardi Ghost Flexible Archway",
		homepage: "https://www.opendesktop.org/p/1276635",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2316184",
		label: "TangoSVG V3  202507 blackysgate.de",
		homepage: "https://www.opendesktop.org/p/2316184",
		license: "CC0-1.0 (Pling licence field)",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "suru-plus-suru-plus-telinkrin",
		label: "Suru++ Telinkrin",
		homepage: "https://github.com/gusbemacbe/suru-plus-telinkrin",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "andrsrxn-icons",
		label: "icons",
		homepage: "https://github.com/andrsrxn/icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1012111",
		label: "Evolvere for mate",
		homepage: "https://www.opendesktop.org/p/1012111",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "next-core-brick-icons",
		label: "@next-core/brick-icons",
		homepage: "https://www.npmjs.com/package/@next-core/brick-icons",
		license: "GPL-3.0 (package.json)",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mjkim0727-stylish-icon-theme",
		label: "Stylish",
		homepage: "https://github.com/mjkim0727/stylish-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "musqz-beautysolar-icon-theme",
		label: "BeautySolar",
		homepage: "https://github.com/musqz/beautysolar-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "amckenna41-iso3166-flags",
		label: "ISO 3166-2 subdivision flags",
		homepage: "https://github.com/amckenna41/iso3166-flags",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "varlesh-elementary-add",
		label: "elementary-add",
		homepage: "https://github.com/varlesh/elementary-add",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "baitmooth-snow",
		label: "Snow icon pack",
		homepage: "https://github.com/baitmooth/snow",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "braniii-ameixa",
		label: "Ameixa",
		homepage: "https://github.com/braniii/ameixa",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "carlangazz-faience-ng-icon-theme",
		label: "faience-ng-icon-theme",
		homepage: "https://github.com/carlangazz/faience-ng-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "luceviasicons-luceviasicons",
		label: "luceviasicons",
		homepage: "https://github.com/luceviasicons/luceviasicons",
		license: "MIT",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "duotone", label: "Duotone", group: "solid", roots: ["duotone"] },
			{ id: "fill", label: "Fill", group: "solid", roots: ["fill"] },
			{ id: "light", label: "Light", group: "line", roots: ["light"] },
			{ id: "regular", label: "Regular", group: "line", roots: ["regular"] },
			{ id: "thin", label: "Thin", group: "line", roots: ["thin"] },
		],
	},
	{
		id: "meritite-union-input-prompts",
		label: "Meritite Union Input Prompts",
		homepage: "https://github.com/meritite-union/input-prompts",
		license: "CC0-1.0",
		styles: [
			{ id: "filled", label: "Filled", group: "solid", roots: ["filled"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "solid", roots: ["square"] },
		],
	},
	{
		id: "tamascsabi-diagonal-icon-theme",
		label: "Diagonal",
		homepage: "https://github.com/tamascsabi/diagonal-icon-theme",
		license: "CC-BY-4.0",
		attribution: "https://github.com/tamascsabi/diagonal-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "coinbase-cds",
		label: "Coinbase Design System (CDS) icons + pictograms",
		homepage: "https://github.com/coinbase/cds",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "salute-developers-plasma",
		label: "Salute Plasma / SDDS icons",
		homepage: "https://github.com/salute-developers/plasma",
		license: "MIT",
		styles: [
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sam-r-passmore-energy-icons",
		label: "energy-icons",
		homepage: "https://github.com/sam-r-passmore/energy-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "solid", roots: ["square"] },
		],
	},
	{
		id: "uiuxicons-core",
		label: "UI/UX Icons",
		homepage: "https://github.com/uiuxassets/uiuxicons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "solid", roots: ["square"] },
		],
	},
	{
		id: "visa-nova-icons-svg",
		label: "@visa/nova-icons-svg",
		homepage: "https://www.npmjs.com/package/@visa/nova-icons-svg",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "velkaja-vallunar-icons",
		label: "vallunar-icons",
		homepage: "https://github.com/velkaja/vallunar-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "mono", label: "Mono", group: "line", roots: ["mono"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "rickyzhangca-octicons-extended",
		label: "octicons-extended",
		homepage: "https://github.com/rickyzhangca/octicons-extended",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "eclipse-platform-eclipse-platform-images",
		label: "Eclipse Platform images",
		homepage: "https://github.com/eclipse-platform/eclipse.platform.images",
		license: "EPL-2.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sbb-esta-pictograms",
		label: "@sbb-esta/pictograms",
		homepage: "https://www.npmjs.com/package/@sbb-esta/pictograms",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "light", label: "Light", group: "line", roots: ["light"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "ubports-ubuntu-themes",
		label: "UBports Suru / Ubuntu themes",
		homepage: "https://github.com/ubports/ubuntu-themes",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "trimble-oss-modus-icons",
		label: "Trimble Modus icons",
		homepage: "https://github.com/trimble-oss/modus-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "admiral-ds-icons",
		label: "AdmiralDS icons",
		homepage: "https://www.npmjs.com/package/@admiral-ds/icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "slasharash-slashicon",
		label: "Slashicon",
		homepage: "https://github.com/slasharash/slashicon",
		license: "GPL-3.0+ (README only)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "aviala-design-icons",
		label: "@aviala-design/icons",
		homepage: "https://www.npmjs.com/package/@aviala-design/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "wix-ui-icons-common",
		label: "Wix UI icons",
		homepage: "https://www.npmjs.com/package/wix-ui-icons-common",
		license: "MIT (package.json)",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "openships-openbridge-icons",
		label: "@openships/openbridge-icons",
		homepage: "https://www.npmjs.com/package/@openships/openbridge-icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "rudrab-shadow",
		label: "Shadow",
		homepage: "https://github.com/rudrab/Shadow",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "elgato-icons",
		label: "Elgato icons",
		homepage: "https://github.com/elgatosf/icons",
		license: "MIT",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "solid", roots: ["square"] },
		],
	},
	{
		id: "shimmerproject-elementary-xfce",
		label: "elementary-xfce",
		homepage: "https://github.com/shimmerproject/elementary-xfce",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "gl-sixsixfive-dar-k-icons",
		label: "DarK icons",
		homepage: "https://gitlab.com/sixsixfive/DarK-icons",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "reactome-reactome-illustrations",
		label: "Reactome Icon Library",
		homepage: "https://reactome.org/icon-lib",
		license: "CC-BY-4.0 (reactome.org icon library; repo LICENSE is Apache-2.0)",
		attribution: "https://reactome.org/icon-lib",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "ju1464-dominus-funeral-icons",
		label: "Dominus Funeral",
		homepage: "https://github.com/ju1464/dominus_funeral_icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "harpoonwithaz-yamis-cosmic",
		label: "Yamis Cosmic",
		homepage: "https://github.com/harpoonwithaz/yamis-cosmic",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "freywazza-yosa-max-git",
		label: "Yosa Max",
		homepage: "https://github.com/freywazza/yosa-max-git",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2300468",
		label: "cyberpunk technotronic summer icon theme",
		homepage: "https://www.opendesktop.org/p/2300468",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "josm-josm",
		label: "JOSM images",
		homepage: "https://github.com/JOSM/josm",
		license: "GPL-2.0-or-later",
		copyleft: true,
		styles: [
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "line", roots: ["square"] },
		],
	},
	{
		id: "cryptofonts-cryptofont",
		label: "Cryptofont (SVG)",
		homepage: "https://www.npmjs.com/package/@cryptofonts/cryptofont",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "icon", label: "Icon", group: "line", roots: ["icon"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mjkim0727-palette-icon-theme",
		label: "Palette",
		homepage: "https://github.com/mjkim0727/palette-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "kawaii-icon-pack",
		label: "Kawaii icon pack",
		homepage: "https://github.com/hatip5656/kawaii-icon-pack",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "somepaulo-morewaita",
		label: "MoreWaita",
		homepage: "https://github.com/somepaulo/MoreWaita",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "zebra-fed-zeta-icons",
		label: "Zebra Zeta icons",
		homepage: "https://github.com/ZebraDevs/zeta-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "siemens-element-icons",
		label: "Siemens Element icons",
		homepage: "https://github.com/siemens/element-icons",
		license: "MIT",
		styles: [
			{ id: "icons", label: "All", group: "line", roots: ["icons"] },
		],
	},
	{
		id: "xenlism-wildfire",
		label: "Xenlism Wildfire",
		homepage: "https://github.com/xenlism/wildfire",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "darkomarko42-marwaita-icons",
		label: "Marwaita icons",
		homepage: "https://github.com/darkomarko42/marwaita-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2361829",
		label: "Besgnulinux Frame Icon Theme",
		homepage: "https://www.opendesktop.org/p/2361829",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "numixproject-android-icon-suite",
		label: "Numix Android icon suite",
		homepage: "https://github.com/numixproject/android-icon-suite",
		license: "GPL-2.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "jpmorganchase-salt-ds",
		label: "J.P. Morgan Salt DS icons",
		homepage: "https://github.com/jpmorganchase/salt-ds",
		license: "Apache-2.0",
		styles: [
			{ id: "light", label: "Light", group: "line", roots: ["light"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sulinos-milky-theme",
		label: "Milky (SulinOS)",
		homepage: "https://github.com/sulinos/milky-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "momentum-ui-icons",
		label: "Cisco Momentum UI icons (legacy)",
		homepage: "https://www.npmjs.com/package/@momentum-ui/icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "clarity-icon-theme",
		label: "Clarity icon theme (jcubic)",
		homepage: "https://github.com/jcubic/Clarity",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "justeattakeaway-pie-icons",
		label: "@justeattakeaway/pie-icons",
		homepage: "https://www.npmjs.com/package/@justeattakeaway/pie-icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "beautyline",
		label: "BeautyLine",
		homepage: "https://gitlab.com/garuda-linux/themes-and-settings/artwork/beautyline",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "gl-teams-design-icon-development-kit",
		label: "GNOME Icon Development Kit (symbolic)",
		homepage: "https://gitlab.gnome.org/Teams/Design/icon-development-kit",
		license: "CC0-1.0",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pec-development-team-pec-font-based-icons",
		label: "pec-font-based-icons",
		homepage: "https://github.com/pec-development-team/pec-font-based-icons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "yahoo-uds-icons",
		label: "@yahoo/uds-icons",
		homepage: "https://www.npmjs.com/package/@yahoo/uds-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pelagornis-refineui-system-icons",
		label: "RefineUI System Icons",
		homepage: "https://github.com/pelagornis/refineui-system-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "getflip-swirl-icons",
		label: "Flip Swirl icons",
		homepage: "https://www.npmjs.com/package/@getflip/swirl-icons",
		license: "MIT-style (LICENSE.md)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "maxtron95-pixie-icon-theme",
		label: "pixie-icon-theme",
		homepage: "https://github.com/maxtron95/pixie-icon-theme",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "loreanvictor-graphis",
		label: "Graphis (repo)",
		homepage: "https://github.com/loreanvictor/graphis",
		license: "MIT",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "regular", label: "Regular", group: "line", roots: ["regular"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vitor238-dx",
		label: "DX",
		homepage: "https://github.com/vitor238/dx",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "acronis-platform-icons",
		label: "@acronis-platform/icons",
		homepage: "https://www.npmjs.com/package/@acronis-platform/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pop-os-icons",
		label: "Pop icon theme",
		homepage: "https://github.com/pop-os/icon-theme",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "shopware-ag-meteor-icon-kit",
		label: "Shopware Meteor icon kit",
		homepage: "https://www.npmjs.com/package/@shopware-ag/meteor-icon-kit",
		license: "MIT",
		styles: [
			{ id: "regular", label: "Regular", group: "line", roots: ["regular"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sonic-de-sonic-oxygen-icons",
		label: "sonic-oxygen-icons",
		homepage: "https://github.com/sonic-de/sonic-oxygen-icons",
		license: "LGPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "survolog-rospo-icon-theme",
		label: "rospo-icon-theme",
		homepage: "https://github.com/survolog/rospo-icon-theme",
		license: "LGPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2055724",
		label: "Oxylite Icons",
		homepage: "https://www.opendesktop.org/p/2055724",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2286868",
		label: "Neon-Dreamscape",
		homepage: "https://www.opendesktop.org/p/2286868",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1281392",
		label: "Newaita-holidays",
		homepage: "https://www.opendesktop.org/p/1281392",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2068653",
		label: "Flight-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2068653",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "ui-style-kit-icons",
		label: "ui-style-kit-icons",
		homepage: "https://www.npmjs.com/package/ui-style-kit-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "phylopic-silhouettes-cc0-pdm-cc-by-only",
		label: "PhyloPic silhouettes (CC0 / PDM / CC-BY only)",
		homepage: "https://www.phylopic.org/",
		license: "CC0-1.0 / PDM-1.0 / CC-BY-3.0 / CC-BY-4.0 (per image; NC and SA images excluded)",
		attribution: "https://www.phylopic.org/",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "greenraccoon23-archdroid-icon-theme",
		label: "ArchDroid",
		homepage: "https://github.com/GreenRaccoon23/archdroid-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2154036",
		label: "Azure Glassy Dark Icons",
		homepage: "https://www.opendesktop.org/p/2154036",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "suru-plus-suru-plus-aspromauros",
		label: "Suru++ Asprómauros",
		homepage: "https://github.com/gusbemacbe/suru-plus-aspromauros",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "faba-icons",
		label: "Faba",
		homepage: "https://github.com/snwh/faba-icon-theme",
		license: "GPL-3.0 / CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mkos-big-sur-icons",
		label: "Mkos-Big-Sur",
		homepage: "https://github.com/zayronxio/Mkos-Big-Sur",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1012429",
		label: "Potenza 2.0",
		homepage: "https://www.opendesktop.org/p/1012429",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2091068",
		label: "Colorful-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2091068",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1349696",
		label: "Deepin-4All",
		homepage: "https://www.opendesktop.org/p/1349696",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "typo3-typo3-icons",
		label: "TYPO3 icons",
		homepage: "https://github.com/TYPO3/TYPO3.Icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kyndryl-design-system-shidoka-icons",
		label: "Kyndryl Shidoka icons",
		homepage: "https://github.com/kyndryl-design-system/shidoka-icons",
		license: "MIT",
		styles: [
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "48", label: "48", group: "solid", roots: ["48"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "rxlaboratory-rxui",
		label: "RxUI icons",
		homepage: "https://github.com/RxLaboratory/RxUI",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "huayralinux-huayra-icon-theme",
		label: "Huayra",
		homepage: "https://github.com/huayralinux/huayra-icon-theme",
		license: "GPL-2.0-or-later",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2156448",
		label: "Big Material UI [DEV]",
		homepage: "https://www.opendesktop.org/p/2156448",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "sit-onyx-icons",
		label: "Schwarz IT onyx icons",
		homepage: "https://www.npmjs.com/package/@sit-onyx/icons",
		license: "Apache-2.0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "gl-fresh-doctor-fairy-wren-icons",
		label: "FairyWren icons",
		homepage: "https://gitlab.com/FreshDoctor/FairyWren-Icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2114212",
		label: "Avalon-Icons [Plasma6 ready]",
		homepage: "https://www.opendesktop.org/p/2114212",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "maandree-simple-icon-theme",
		label: "simple-icon-theme",
		homepage: "https://github.com/maandree/simple-icon-theme",
		license: "ISC",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "scarlab-icons-icons",
		label: "@scarlab-icons/icons",
		homepage: "https://www.npmjs.com/package/@scarlab-icons/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "fill", label: "Fill", group: "solid", roots: ["fill"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "streetcomplete-street-complete",
		label: "StreetComplete icons",
		homepage: "https://github.com/streetcomplete/StreetComplete",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "regular", label: "Regular", group: "line", roots: ["regular"] },
			{ id: "round", label: "Round", group: "solid", roots: ["round"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vertigis-icons",
		label: "@vertigis/icons",
		homepage: "https://www.npmjs.com/package/@vertigis/icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "itsyndicate25-tern-mizu",
		label: "tern-mizu",
		homepage: "https://github.com/itsyndicate25/tern-mizu",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "ju1464-n-i-b-icons",
		label: "N.I.B.",
		homepage: "https://github.com/ju1464/n.i.b._icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "stratakit-icons",
		label: "iTwin StrataKit icons",
		homepage: "https://github.com/iTwin/stratakit",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "ebay-skin",
		label: "eBay Skin icons + flags",
		homepage: "https://github.com/eBay/skin",
		license: "MIT",
		styles: [
			{ id: "icon", label: "Icon", group: "line", roots: ["icon"] },
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kenney-input-prompts",
		label: "Kenney Input Prompts",
		homepage: "https://kenney.nl/assets/input-prompts",
		license: "CC0-1.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "ids-identity",
		label: "Infor Design System icons",
		homepage: "https://www.npmjs.com/package/ids-identity",
		license: "Apache-2.0",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2261872",
		label: "Bes Own Circle",
		homepage: "https://www.opendesktop.org/p/2261872",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "ui5-webcomponents-icons-business-suite",
		label: "@ui5/webcomponents-icons-business-suite",
		homepage: "https://www.npmjs.com/package/@ui5/webcomponents-icons-business-suite",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1327720",
		label: "Gruvbox icon theme",
		homepage: "https://www.opendesktop.org/p/1327720",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "hashicons",
		label: "Hashicons",
		homepage: "https://github.com/orcunsaltik/hashicons",
		license: "MIT",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "xenlism-storm",
		label: "Xenlism Storm",
		homepage: "https://github.com/xenlism/storm",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "univerjs-icons-svg",
		label: "Univer icons",
		homepage: "https://github.com/dream-num/univer-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1106957",
		label: "xane",
		homepage: "https://www.opendesktop.org/p/1106957",
		license: "LGPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "cryptofonts-cryptoicons",
		label: "Cryptofonts cryptoicons",
		homepage: "https://github.com/cryptofonts/cryptoicons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1012492",
		label: "Vamox Icons",
		homepage: "https://www.opendesktop.org/p/1012492",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2180417",
		label: "Aretha-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2180417",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "nitrux-luv-icon-theme",
		label: "Luv",
		homepage: "https://github.com/Nitrux/luv-icon-theme",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "naturacosmeticos-natds-icons",
		label: "Natura & Co natds icons",
		homepage: "https://www.npmjs.com/package/@naturacosmeticos/natds-icons",
		license: "ISC",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "stackoverflow-stacks-icons",
		label: "Stack Overflow Stacks icons",
		homepage: "https://github.com/StackExchange/Stacks-Icons",
		license: "Apache-2.0",
		styles: [
			{ id: "icon", label: "Icon", group: "solid", roots: ["icon"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "macintosh98-macos-3d-icons",
		label: "MacOS 3D Icons",
		homepage: "https://github.com/macintosh98/MacOS-3D-Icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "channel-io-bezier-icons",
		label: "Channel.io Bezier icons",
		homepage: "https://www.npmjs.com/package/@channel.io/bezier-icons",
		license: "Apache-2.0",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "solid", roots: ["square"] },
		],
	},
	{
		id: "pling-1719978",
		label: "Neon Icon",
		homepage: "https://www.opendesktop.org/p/1719978",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "bentley-icons-generic",
		label: "Bentley iTwin generic icons",
		homepage: "https://www.npmjs.com/package/@bentley/icons-generic",
		license: "CC-BY-3.0",
		attribution: "https://www.npmjs.com/package/@bentley/icons-generic",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "talend-icons",
		label: "Talend icons",
		homepage: "https://www.npmjs.com/package/@talend/icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2367714",
		label: "Besgnulinux Frame Circle Icon Theme",
		homepage: "https://www.opendesktop.org/p/2367714",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "blankon-packages-tebu-icon-theme",
		label: "tebu-icon-theme",
		homepage: "https://github.com/blankon-packages/tebu-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "scalable", label: "Scalable", group: "solid", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "gxde-os-deepin-icon-theme-community",
		label: "deepin-icon-theme-community",
		homepage: "https://github.com/gxde-os/deepin-icon-theme-community",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "24", label: "24", group: "line", roots: ["24"] },
			{ id: "48", label: "48", group: "line", roots: ["48"] },
			{ id: "scalable", label: "Scalable", group: "solid", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "domdfcoding-custom-wx-icons-humanity",
		label: "Humanity (Ubuntu) icons",
		homepage: "https://github.com/domdfcoding/custom_wx_icons_humanity",
		license: "GPL-2.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "haiilo-catalyst-icons",
		label: "Haiilo Catalyst icons",
		homepage: "https://github.com/haiilo/catalyst-icons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "stevodev-ardis-icon-theme",
		label: "ardis-icon-theme",
		homepage: "https://github.com/stevodev/ardis-icon-theme",
		license: "GPL-2.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "exawizards-exabase-design-system-icons",
		label: "exaBase design system icons",
		homepage: "https://www.npmjs.com/package/@exawizards/exabase-design-system-icons",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "pling-1324180",
		label: "Dexie icons",
		homepage: "https://www.opendesktop.org/p/1324180",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1403702",
		label: "Suru 4All",
		homepage: "https://www.opendesktop.org/p/1403702",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "clubmed-trident-icons",
		label: "Club Med Trident icons",
		homepage: "https://www.npmjs.com/package/@clubmed/trident-icons",
		license: "BSD-3-Clause (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kapowaz-square-flags",
		label: "Square flags",
		homepage: "https://github.com/kapowaz/square-flags",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "leapdev-gui-icons",
		label: "@leapdev/gui-icons",
		homepage: "https://www.npmjs.com/package/@leapdev/gui-icons",
		license: "ISC (package.json)",
		styles: [
			{ id: "filled", label: "Filled", group: "solid", roots: ["filled"] },
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "two-tone", label: "Two Tone", group: "solid", roots: ["two-tone"] },
		],
	},
	{
		id: "pling-1259356",
		label: "Milix Icon Theme",
		homepage: "https://www.opendesktop.org/p/1259356",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2221913",
		label: "Varied icon theme",
		homepage: "https://www.opendesktop.org/p/2221913",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2062351",
		label: "to the rescue",
		homepage: "https://www.opendesktop.org/p/2062351",
		license: "GPL-2.0-or-later (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "mozaic-ds-icons",
		label: "ADEO Mozaic icons",
		homepage: "https://www.npmjs.com/package/@mozaic-ds/icons",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1877058",
		label: "Rowaita icons",
		homepage: "https://www.opendesktop.org/p/1877058",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "atlaskit-icon-lab",
		label: "Atlassian icon-lab",
		homepage: "https://www.npmjs.com/package/@atlaskit/icon-lab",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "yeyushengfan258-citrus-icon-theme",
		label: "Citrus",
		homepage: "https://github.com/yeyushengfan258/citrus-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "qwd-icons",
		label: "QWeather icons",
		homepage: "https://github.com/qwd/Icons",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "pling-2363477",
		label: "eyeQ - KDE",
		homepage: "https://www.opendesktop.org/p/2363477",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "world-map-data",
		label: "World map country shapes",
		homepage: "https://github.com/stephanwagner/world-map-data",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "oberon-manjaro-deepin-iconthemes",
		label: "deepin-iconthemes",
		homepage: "https://github.com/oberon-manjaro/deepin-iconthemes",
		license: "LGPL-3.0",
		copyleft: true,
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "32", label: "32", group: "line", roots: ["32"] },
			{ id: "48", label: "48", group: "line", roots: ["48"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2339121",
		label: "Besgnulinux White Icon Theme",
		homepage: "https://www.opendesktop.org/p/2339121",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2128085",
		label: "BeautyDream",
		homepage: "https://www.opendesktop.org/p/2128085",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "yeyushengfan258-mcmuse-circle",
		label: "McMuse-circle",
		homepage: "https://github.com/yeyushengfan258/McMuse-circle",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1015854",
		label: "Treepata - High contrast",
		homepage: "https://www.opendesktop.org/p/1015854",
		license: "CC-BY (Pling licence field)",
		attribution: "https://www.opendesktop.org/p/1015854",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1574011",
		label: "[Discontinued] Breeze-Cinnamon",
		homepage: "https://www.opendesktop.org/p/1574011",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "bartaxyz-xyz-icon-set",
		label: "XYZ Icon Set",
		homepage: "https://github.com/bartaxyz/xyz-icon-set",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "infineon-infineon-icons",
		label: "Infineon icons",
		homepage: "https://github.com/Infineon/Infineon-Icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2360486",
		label: "Orango [Tango but Orange]",
		homepage: "https://www.opendesktop.org/p/2360486",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "amaury-lila-icons",
		label: "lila-icons",
		homepage: "https://github.com/amaury/lila-icons",
		license: "GPL-2.0",
		copyleft: true,
		styles: [
			{ id: "mono", label: "Mono", group: "line", roots: ["mono"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2039492",
		label: "L.T.F.2",
		homepage: "https://www.opendesktop.org/p/2039492",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "dls-icons",
		label: "dls-icons",
		homepage: "https://www.npmjs.com/package/dls-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "muqtxdir-yaru-remix",
		label: "Yaru Remix",
		homepage: "https://github.com/Muqtxdir/yaru-remix",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "megafon-ui-icons",
		label: "@megafon/ui-icons",
		homepage: "https://www.npmjs.com/package/@megafon/ui-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "swimlane-ngx-ui",
		label: "Swimlane ngx-ui icons",
		homepage: "https://github.com/swimlane/ngx-ui",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "sumup-oss-icons",
		label: "SumUp Circuit icons",
		homepage: "https://www.npmjs.com/package/@sumup-oss/icons",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "uilibrary-neon-icon",
		label: "Neon icons (UI Lib)",
		homepage: "https://github.com/uilibrary/neon-icon",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "toptal-picasso-icons",
		label: "@toptal/picasso-icons",
		homepage: "https://www.npmjs.com/package/@toptal/picasso-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "consta-design-system-icons",
		label: "Consta icons (Gazprom Neft)",
		homepage: "https://github.com/consta-design-system/icons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "test-me-icons",
		label: "@test--me/icons",
		homepage: "https://www.npmjs.com/package/@test--me/icons",
		license: "ISC (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "wwtdev-bsds-icons",
		label: "@wwtdev/bsds-icons",
		homepage: "https://www.npmjs.com/package/@wwtdev/bsds-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "epilot360-icons",
		label: "epilot icons",
		homepage: "https://www.npmjs.com/package/@epilot360/icons",
		license: "MIT",
		styles: [
			{ id: "icon", label: "Icon", group: "line", roots: ["icon"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "commons-nuvola-icons-sa",
		label: "Nuvola icons (Commons) [share-alike files]",
		homepage: "https://commons.wikimedia.org/wiki/Category:Nuvola_icons",
		license: "CC-BY-SA / GFDL / LGPL per file (Commons)",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "bookingjini-tech-bookingjini-icons",
		label: "bookingjini-icons",
		homepage: "https://github.com/bookingjini-tech/bookingjini-icons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "burtson-labs-icons",
		label: "Burtson Icons",
		homepage: "https://www.npmjs.com/package/@burtson-labs/icons",
		license: "ISC",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "line", roots: ["square"] },
		],
	},
	{
		id: "oslokommune-punkt-assets",
		label: "Oslo kommune Punkt icons",
		homepage: "https://www.npmjs.com/package/@oslokommune/punkt-assets",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "plasma-platform-icons",
		label: "@plasma-platform/icons",
		homepage: "https://www.npmjs.com/package/@plasma-platform/icons",
		license: "ISC (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "hpe-design-icons-svg",
		label: "HPE Design System icons",
		homepage: "https://www.npmjs.com/package/@hpe-design/icons-svg",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "taylantatli-sevi",
		label: "Sevi",
		homepage: "https://github.com/TaylanTatli/Sevi",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "funcfusion-mc-dp-icons",
		label: "Minecraft datapack icons (FuncFusion)",
		homepage: "https://github.com/funcfusion/mc-dp-icons",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "itwin-itwinui-icons",
		label: "iTwinUI icons",
		homepage: "https://www.npmjs.com/package/@itwin/itwinui-icons",
		license: "CC-BY-3.0",
		attribution: "https://www.npmjs.com/package/@itwin/itwinui-icons",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "vienna-deprecated-icons",
		label: "vienna.deprecated-icons",
		homepage: "https://www.npmjs.com/package/vienna.deprecated-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "jack-henry-jh-icons",
		label: "Jack Henry Forge icons",
		homepage: "https://www.npmjs.com/package/@jack-henry/jh-icons",
		license: "Apache-2.0",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "line", roots: ["square"] },
		],
	},
	{
		id: "pling-2158619",
		label: "Besot Haiku",
		homepage: "https://www.opendesktop.org/p/2158619",
		license: "CC0-1.0 (Pling licence field)",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "hcicons-svelte",
		label: "hcicons-svelte",
		homepage: "https://www.npmjs.com/package/hcicons-svelte",
		license: "BSD-3-Clause (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "dataloop-ai-icons",
		label: "@dataloop-ai/icons",
		homepage: "https://www.npmjs.com/package/@dataloop-ai/icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pierre-icons",
		label: "Pierre Computer icons",
		homepage: "https://github.com/pierrecomputer/icons",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "decisiv-iconix",
		label: "Decisiv Iconix",
		homepage: "https://www.npmjs.com/package/@decisiv/iconix",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "macintosh98-elementosh-icons",
		label: "Elementosh",
		homepage: "https://github.com/macintosh98/elementosh-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "blankon-packages-komodo-icon-theme",
		label: "komodo-icon-theme",
		homepage: "https://github.com/blankon-packages/komodo-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "24", label: "24", group: "line", roots: ["24"] },
			{ id: "scalable", label: "Scalable", group: "line", roots: ["scalable"] },
		],
	},
	{
		id: "flipflop97-mato",
		label: "Mato",
		homepage: "https://github.com/flipflop97/Mato",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "rescui-icons",
		label: "JetBrains RescUI icons",
		homepage: "https://www.npmjs.com/package/@rescui/icons",
		license: "Apache-2.0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "commons-iso-7010-safety-signs",
		label: "ISO 7010 safety signs (Commons redraws)",
		homepage: "https://commons.wikimedia.org/wiki/Category:ISO_7010_safety_signs",
		license: "Public domain / CC0 / CC-BY per file (Commons)",
		attribution: "https://commons.wikimedia.org/wiki/Category:ISO_7010_safety_signs",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2274271",
		label: "Adwaitaru",
		homepage: "https://www.opendesktop.org/p/2274271",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1485425",
		label: "KDE 1.1.2 Style Icons",
		homepage: "https://www.opendesktop.org/p/1485425",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "gl-teams-design-app-icon-requests",
		label: "GNOME App Icon Requests",
		homepage: "https://gitlab.gnome.org/Teams/Design/app-icon-requests",
		license: "CC0-1.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "penpot-penpot",
		label: "Penpot UI icons",
		homepage: "https://github.com/penpot/penpot",
		license: "MPL-2.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "literary-universe-svg-icons",
		label: "Literary Universe icons",
		homepage: "https://github.com/LiteraryUniverse/icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1531096",
		label: "[ENDED] Infinity Star/Dream",
		homepage: "https://www.opendesktop.org/p/1531096",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "witalihirsch-mono-icon-theme",
		label: "Mono icon theme",
		homepage: "https://github.com/witalihirsch/Mono-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "aasaam-brand-icons",
		label: "aasaam brand icons",
		homepage: "https://github.com/aasaam/brand-icons",
		license: "CC0-1.0 (logos are trademarks)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1307238",
		label: "GreenPeasIcons",
		homepage: "https://www.opendesktop.org/p/1307238",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "risklab-icons",
		label: "@risklab/icons",
		homepage: "https://www.npmjs.com/package/@risklab/icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "solus-project-evopop-icon-theme",
		label: "EvoPop",
		homepage: "https://github.com/solus-project/evopop-icon-theme",
		license: "CC-BY-4.0",
		attribution: "https://github.com/solus-project/evopop-icon-theme",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "joberror-visual-icons",
		label: "visual-icons",
		homepage: "https://github.com/joberror/visual-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "vexiza-meteo-icons",
		label: "Vexiza meteo icons",
		homepage: "https://www.npmjs.com/package/@vexiza/meteo-icons",
		license: "ISC (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "tau-os-tau-hydrogen",
		label: "tau-hydrogen",
		homepage: "https://github.com/tau-os/tau-hydrogen",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "navikt-ds-icons",
		label: "@navikt/ds-icons",
		homepage: "https://www.npmjs.com/package/@navikt/ds-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1385086",
		label: "Cinnamon",
		homepage: "https://www.opendesktop.org/p/1385086",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pine-ds-icons",
		label: "Kajabi Pine icons",
		homepage: "https://github.com/Kajabi/pine-icons",
		license: "MIT",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "wonderflow-symbols",
		label: "Wonderflow Wanda symbols",
		homepage: "https://www.npmjs.com/package/@wonderflow/symbols",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "duotone", label: "Duotone", group: "solid", roots: ["duotone"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "tully-t-sours",
		label: "Sours",
		homepage: "https://github.com/tully-t/sours",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "open-railway-map-open-railway-map-carto-css",
		label: "OpenRailwayMap symbols",
		homepage: "https://github.com/OpenRailwayMap/OpenRailwayMap-CartoCSS",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "iso-safety-signs-assets",
		label: "ISO 7010 safety signs",
		homepage: "https://github.com/karlnorling/iso-safety-signs",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "vygruppen-spor-icon",
		label: "@vygruppen/spor-icon",
		homepage: "https://www.npmjs.com/package/@vygruppen/spor-icon",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mjkim0727-pure-icon-theme",
		label: "Pure",
		homepage: "https://github.com/mjkim0727/pure-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "ribajs-iconset",
		label: "Riba.js iconset",
		homepage: "https://www.npmjs.com/package/@ribajs/iconset",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "wkelly1-ikono",
		label: "ikono",
		homepage: "https://github.com/wkelly1/ikono",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pathwright-pathicons",
		label: "@pathwright/pathicons",
		homepage: "https://www.npmjs.com/package/@pathwright/pathicons",
		license: "MIT (package.json)",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "cetec-design-system",
		label: "Cetec ERP icons",
		homepage: "https://github.com/Cetec-ERP/Cetec-Design-System",
		license: "MIT",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "line", roots: ["square"] },
		],
	},
	{
		id: "trendmicro-tmicon",
		label: "@trendmicro/tmicon",
		homepage: "https://www.npmjs.com/package/@trendmicro/tmicon",
		license: "MIT (package.json)",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "light", label: "Light", group: "line", roots: ["light"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "ilnanny-oxigen-svg-icons",
		label: "oxigen-svg-icons",
		homepage: "https://github.com/ilnanny/oxigen-svg-icons",
		license: "LGPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "gl-sira313-papirus-remix",
		label: "Papirus Remix (sira313)",
		homepage: "https://gitlab.com/sira313/papirus-remix",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "48", label: "48", group: "line", roots: ["48"] },
			{ id: "mono", label: "Mono", group: "line", roots: ["mono"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2192428",
		label: "Ars Dark Icons",
		homepage: "https://www.opendesktop.org/p/2192428",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "leit",
		label: "leit",
		homepage: "https://www.npmjs.com/package/leit",
		license: "MIT (package.json)",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "siliconapricot-neuwaita",
		label: "Neuwaita",
		homepage: "https://github.com/SiliconApricot/Neuwaita",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2227009",
		label: "Cool-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2227009",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "sva-icons",
		label: "sva-icons",
		homepage: "https://www.npmjs.com/package/sva-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "warp-ds-icons",
		label: "Warp DS icons (FINN/Schibsted)",
		homepage: "https://github.com/warp-ds/icons",
		license: "Apache-2.0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "fastrizwaan-martian-wheel",
		label: "Martian Wheel",
		homepage: "https://github.com/fastrizwaan/martian-wheel",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "dhis2-d2-icons",
		label: "@dhis2/d2-icons",
		homepage: "https://www.npmjs.com/package/@dhis2/d2-icons",
		license: "BSD-3-Clause (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "un-ocha-humanitarian-icons-2026-bdu",
		label: "OCHA Humanitarian Icons 2026",
		homepage: "https://github.com/UN-OCHA/humanitarian-icons-2026-BDU",
		license: "CC-BY-4.0",
		attribution: "https://github.com/UN-OCHA/humanitarian-icons-2026-BDU",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "welcome-ui-icons",
		label: "@welcome-ui/icons",
		homepage: "https://www.npmjs.com/package/@welcome-ui/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "bulk", label: "Bulk", group: "solid", roots: ["bulk"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "rocket-chat-fuselage",
		label: "Rocket.Chat Fuselage icons",
		homepage: "https://github.com/RocketChat/fuselage",
		license: "MIT",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "wyg-plus-icons-svg",
		label: "Wyg Plus icons",
		homepage: "https://github.com/wyg-plus/wyg-plus-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "neural-icons-core",
		label: "@neural-icons/core",
		homepage: "https://www.npmjs.com/package/@neural-icons/core",
		license: "MIT (package.json)",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "cho2-origami-icon-theme",
		label: "origami-icon-theme",
		homepage: "https://github.com/cho2/origami-icon-theme",
		license: "LGPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1683735",
		label: "Planet-Icons",
		homepage: "https://www.opendesktop.org/p/1683735",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1012265",
		label: "El Nuove",
		homepage: "https://www.opendesktop.org/p/1012265",
		license: "GPL-2.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "zorin-os-zorin-icon-themes",
		label: "Zorin icon themes",
		homepage: "https://github.com/ZorinOS/zorin-icon-themes",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1874184",
		label: "Mysterious World",
		homepage: "https://www.opendesktop.org/p/1874184",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "anatolia-icons-svg",
		label: "@anatolia-icons/svg",
		homepage: "https://www.npmjs.com/package/@anatolia-icons/svg",
		license: "MIT (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "ui5-webcomponents-icons-tnt",
		label: "@ui5/webcomponents-icons-tnt",
		homepage: "https://www.npmjs.com/package/@ui5/webcomponents-icons-tnt",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "edwardgushchin-stillglass-icon-theme",
		label: "StillGlass",
		homepage: "https://github.com/edwardgushchin/stillglass-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "emblematic-icons",
		label: "Pagar.me Emblematic icons",
		homepage: "https://github.com/pagarme/emblematic-icons",
		license: "CC-BY-4.0",
		attribution: "https://github.com/pagarme/emblematic-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "tsora1603-pixora-icons",
		label: "Pixora icons",
		homepage: "https://github.com/tsora1603/pixora-icons",
		license: "CC-BY-4.0",
		attribution: "https://github.com/tsora1603/pixora-icons",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "cb-mi7i-rewind",
		label: "Rewind icon theme",
		homepage: "https://codeberg.org/mi7i/rewind",
		license: "CC-BY-4.0",
		attribution: "https://codeberg.org/mi7i/rewind",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2355005",
		label: "eyeQ icon theme",
		homepage: "https://www.opendesktop.org/p/2355005",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "avastjs-cyber-icons",
		label: "Cyber icons",
		homepage: "https://github.com/avastjs/cyber-icons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "trendyol-baklava-icons",
		label: "Trendyol Baklava icons",
		homepage: "https://github.com/Trendyol/baklava-icons",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "dfds-ui-icons",
		label: "@dfds-ui/icons",
		homepage: "https://www.npmjs.com/package/@dfds-ui/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "coyoapp-icons",
		label: "COYO icons",
		homepage: "https://www.npmjs.com/package/@coyoapp/icons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2037378",
		label: "Goldy-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2037378",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "stuarthayhurst-argon-icon-theme",
		label: "Argon",
		homepage: "https://github.com/stuarthayhurst/argon-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "charcoal-ui-icon-files",
		label: "@charcoal-ui/icon-files",
		homepage: "https://www.npmjs.com/package/@charcoal-ui/icon-files",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "32", label: "32", group: "solid", roots: ["32"] },
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "vivareal-lina-icons",
		label: "Grupo ZAP Lina icons",
		homepage: "https://www.npmjs.com/package/@vivareal/lina-icons",
		license: "ISC (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2347839",
		label: "Bessurf Icon Theme",
		homepage: "https://www.opendesktop.org/p/2347839",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "ubuntu-mate-ubuntu-mate-artwork",
		label: "Ubuntu MATE artwork icons",
		homepage: "https://github.com/ubuntu-mate/ubuntu-mate-artwork",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1367824",
		label: "Neo Tango Remix",
		homepage: "https://www.opendesktop.org/p/1367824",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1191167",
		label: "Deepin Icons Collection",
		homepage: "https://www.opendesktop.org/p/1191167",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "dicehub-icons",
		label: "@dicehub/icons",
		homepage: "https://www.npmjs.com/package/@dicehub/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1167075",
		label: "Elementary-kde icons",
		homepage: "https://www.opendesktop.org/p/1167075",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "wfp-icons",
		label: "WFP icons",
		homepage: "https://github.com/wfp/carbon-icons",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2218562",
		label: "Coffee",
		homepage: "https://www.opendesktop.org/p/2218562",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "wfpaisa-plane-icon-theme",
		label: "Plane",
		homepage: "https://github.com/wfpaisa/plane-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "hig-icons",
		label: "@hig/icons",
		homepage: "https://www.npmjs.com/package/@hig/icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "regular", label: "Regular", group: "line", roots: ["regular"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kenney-cursor-pack",
		label: "Kenney Cursor Pack",
		homepage: "https://kenney.nl/assets/cursor-pack",
		license: "CC0-1.0",
		styles: [
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1527388",
		label: "CP3O-Jimin-Icons",
		homepage: "https://www.opendesktop.org/p/1527388",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1420499",
		label: "EFDark-IconsCream",
		homepage: "https://www.opendesktop.org/p/1420499",
		license: "GPL-2.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1275771",
		label: "Sardi-Flexible-Validus",
		homepage: "https://www.opendesktop.org/p/1275771",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "interaapps-flag-icons",
		label: "flag-icons",
		homepage: "https://github.com/interaapps/flag-icons",
		license: "CC0-1.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2316378",
		label: "WaterCooler Icons",
		homepage: "https://www.opendesktop.org/p/2316378",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1381893",
		label: "Rosa Humanity remix for KDE Plasma 5",
		homepage: "https://www.opendesktop.org/p/1381893",
		license: "GPL-2.0-or-later (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "heliux-org-ui-style",
		label: "Heliux UI icons",
		homepage: "https://www.npmjs.com/package/@heliux-org/ui-style",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "mk-icon-svg",
		label: "mk-icon-svg",
		homepage: "https://www.npmjs.com/package/mk-icon-svg",
		license: "MIT (package.json)",
		styles: [
			{ id: "filled", label: "Filled", group: "solid", roots: ["filled"] },
			{ id: "outlined", label: "Outlined", group: "line", roots: ["outlined"] },
			{ id: "twotone", label: "Twotone", group: "solid", roots: ["twotone"] },
		],
	},
	{
		id: "zhizhuo-icons",
		label: "Zhizhuo icons",
		homepage: "https://github.com/xxxlira/zhizhuo-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1217074",
		label: "Oxygen Classic [KDE 4.6.2]",
		homepage: "https://www.opendesktop.org/p/1217074",
		license: "LGPL-3.0 (Oxygen COPYING) (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2375500",
		label: "Besgnulinux hat icon theme",
		homepage: "https://www.opendesktop.org/p/2375500",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2303161",
		label: "Yet Another Monochrome Icon Set For KDE Plasma",
		homepage: "https://www.opendesktop.org/p/2303161",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "plone-pastanaga-icons",
		label: "pastanaga-icons",
		homepage: "https://github.com/plone/pastanaga-icons",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "moshiurrahmanadib-conflux-icon-theme",
		label: "Conflux",
		homepage: "https://github.com/moshiurrahmanadib/conflux-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "yeyushengfan258-honor-icon-theme",
		label: "Honor",
		homepage: "https://github.com/yeyushengfan258/Honor-icon-theme-",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "doc88-flux-icon",
		label: "Doc88 Flux icons",
		homepage: "https://github.com/doc88git/flux-icon",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1281798",
		label: "Breeze Chameleon Dark",
		homepage: "https://www.opendesktop.org/p/1281798",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1272855",
		label: "Darcwaita-Plus Icon Theme",
		homepage: "https://www.opendesktop.org/p/1272855",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1012338",
		label: "Victory Icon Theme",
		homepage: "https://www.opendesktop.org/p/1012338",
		license: "GPL-2.0-or-later (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "macintosh98-bigsur-originals",
		label: "BigSur Originals",
		homepage: "https://github.com/macintosh98/bigsur-originals",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2377121",
		label: "Haiku - Icons",
		homepage: "https://www.opendesktop.org/p/2377121",
		license: "MIT (Pling licence field)",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1241323",
		label: "Brisa SWL-X",
		homepage: "https://www.opendesktop.org/p/1241323",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "materialos-icons",
		label: "MaterialOS icons",
		homepage: "https://github.com/materialos/icons",
		license: "CC-BY-4.0",
		attribution: "https://github.com/materialos/icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1586828",
		label: "Grade-icon-theme",
		homepage: "https://www.opendesktop.org/p/1586828",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "r8bert-whiteshw",
		label: "whiteshw",
		homepage: "https://github.com/r8bert/whiteshw",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "scalable", label: "Scalable", group: "solid", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "shoplinedev-atlas-icons",
		label: "@shoplinedev/atlas-icons",
		homepage: "https://www.npmjs.com/package/@shoplinedev/atlas-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "godaddy-wordpress-coblocks-icons",
		label: "CoBlocks icons",
		homepage: "https://github.com/godaddy-wordpress/coblocks-icons",
		license: "GPL-2.0",
		copyleft: true,
		styles: [
			{ id: "icon", label: "Icon", group: "line", roots: ["icon"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "fonttools-region-flags",
		label: "region-flags",
		homepage: "https://github.com/fonttools/region-flags",
		license: "Public domain",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pleodigital-design-system-votey",
		label: "Pleo Digital Votey icons",
		homepage: "https://www.npmjs.com/package/@pleodigital/design-system-votey",
		license: "ISC (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mozilla-protocol-assets",
		label: "@mozilla-protocol/assets",
		homepage: "https://www.npmjs.com/package/@mozilla-protocol/assets",
		license: "MPL-2.0 (package.json)",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "fundamental-styles-fn-icons",
		label: "@fundamental-styles/fn-icons",
		homepage: "https://www.npmjs.com/package/@fundamental-styles/fn-icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "strapi-design-system",
		label: "Strapi design system icons",
		homepage: "https://github.com/strapi/design-system",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1012432",
		label: "gTango",
		homepage: "https://www.opendesktop.org/p/1012432",
		license: "CC-BY-SA (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "madebybowtie-flag-kit",
		label: "FlagKit",
		homepage: "https://github.com/madebybowtie/FlagKit",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1516492",
		label: "Shade of Z",
		homepage: "https://www.opendesktop.org/p/1516492",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "tailgrids-tailgrids",
		label: "TailGrids icons",
		homepage: "https://github.com/tailgrids/tailgrids",
		license: "MIT",
		styles: [
			{ id: "icons", label: "All", group: "line", roots: ["icons"] },
		],
	},
	{
		id: "luisrguerra-monday-icon-theme",
		label: "Monday icon theme",
		homepage: "https://github.com/luisrguerra/monday-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2165157",
		label: "Gaia",
		homepage: "https://www.opendesktop.org/p/2165157",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "polgubau-flags",
		label: "flags",
		homepage: "https://github.com/polgubau/flags",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1687796",
		label: "Cobalt-icons",
		homepage: "https://www.opendesktop.org/p/1687796",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "solace-ui-icons",
		label: "Solace UI icons",
		homepage: "https://www.npmjs.com/package/solace-ui-icons",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1706789",
		label: "The Asteroid Belt",
		homepage: "https://www.opendesktop.org/p/1706789",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "washingtonpost-wpds-assets",
		label: "Washington Post WPDS icons",
		homepage: "https://www.npmjs.com/package/@washingtonpost/wpds-assets",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2200291",
		label: "Colloid Pastel Icons Dark",
		homepage: "https://www.opendesktop.org/p/2200291",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "skyscanner-bpk-svgs",
		label: "@skyscanner/bpk-svgs",
		homepage: "https://www.npmjs.com/package/@skyscanner/bpk-svgs",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "shuyun-ep-team-icons",
		label: "@shuyun-ep-team/icons",
		homepage: "https://www.npmjs.com/package/@shuyun-ep-team/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "platformicons",
		label: "Sentry platformicons",
		homepage: "https://github.com/getsentry/platformicons",
		license: "OFL-1.1 (logos are trademarks)",
		styles: [
			{ id: "mono", label: "Mono", group: "line", roots: ["mono"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pollux-docaposte-icon-library",
		label: "@pollux-docaposte/icon-library",
		homepage: "https://www.npmjs.com/package/@pollux-docaposte/icon-library",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1230047",
		label: "Griffin Mono",
		homepage: "https://www.opendesktop.org/p/1230047",
		license: "CC-BY (Pling licence field)",
		attribution: "https://www.opendesktop.org/p/1230047",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1012303",
		label: "Yasis-Sky",
		homepage: "https://www.opendesktop.org/p/1012303",
		license: "GPL-2.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1936508",
		label: "Cold Metal - Icon Theme",
		homepage: "https://www.opendesktop.org/p/1936508",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "kenney-flag-pack",
		label: "Kenney Flag Pack",
		homepage: "https://kenney.nl/assets/flag-pack",
		license: "CC0-1.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "spark-ui-icons",
		label: "Leboncoin Spark UI icons",
		homepage: "https://www.npmjs.com/package/@spark-ui/icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1481977",
		label: "Bloom",
		homepage: "https://www.opendesktop.org/p/1481977",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1309734",
		label: "StarLabs-Squircle",
		homepage: "https://www.opendesktop.org/p/1309734",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "hopper-ui-svg-icons",
		label: "@hopper-ui/svg-icons",
		homepage: "https://www.npmjs.com/package/@hopper-ui/svg-icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "elvia-elvis-assets-icons",
		label: "@elvia/elvis-assets-icons",
		homepage: "https://www.npmjs.com/package/@elvia/elvis-assets-icons",
		license: "GPL-3.0-only (package.json)",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "cormullion-graphics",
		label: "cormullion graphics",
		homepage: "https://github.com/cormullion/graphics",
		license: "CC-BY-4.0",
		attribution: "https://github.com/cormullion/graphics",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "maximeallanic-m3e-gnome",
		label: "m3e-gnome",
		homepage: "https://github.com/maximeallanic/m3e-gnome",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2346341",
		label: "Slot Beauty Dark Icons",
		homepage: "https://www.opendesktop.org/p/2346341",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "zenmux-icons",
		label: "@zenmux/icons",
		homepage: "https://www.npmjs.com/package/@zenmux/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2359362",
		label: "Arcanum Icon theme",
		homepage: "https://www.opendesktop.org/p/2359362",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "varlesh-theia-icon-theme",
		label: "Theia",
		homepage: "https://github.com/varlesh/theia-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1502575",
		label: "Haptic Icons",
		homepage: "https://www.opendesktop.org/p/1502575",
		license: "Apache-2.0 (Pling licence field)",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "fishtank-icons",
		label: "@fishtank/icons",
		homepage: "https://www.npmjs.com/package/@fishtank/icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "swarm-icons",
		label: "Meetup Swarm icons",
		homepage: "https://www.npmjs.com/package/swarm-icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "kenney-board-game-icons",
		label: "Kenney Board Game Icons",
		homepage: "https://kenney.nl/assets/board-game-icons",
		license: "CC0-1.0",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kreativekorp-vexillo",
		label: "Kreative Vexillo (non-country flags)",
		homepage: "https://github.com/kreativekorp/vexillo",
		license: "Public Domain (flag images; code MPL-2.0)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "igorfmoraes-mignon-icon-theme",
		label: "Mignon",
		homepage: "https://github.com/igorfmoraes/mignon-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "zulip-zulip",
		label: "Zulip icons",
		homepage: "https://github.com/zulip/zulip",
		license: "Apache-2.0",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "numberslk-icons",
		label: "numbers.lk icons",
		homepage: "https://www.npmjs.com/package/@numberslk/icons",
		license: "BSD-3-Clause",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2377209",
		label: "Slot Ars Dark Icons",
		homepage: "https://www.opendesktop.org/p/2377209",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "mamolinux-sucharu-theme-icon",
		label: "sucharu-theme-icon",
		homepage: "https://github.com/mamolinux/sucharu-theme-icon",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "scalable", label: "Scalable", group: "line", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2351226",
		label: "Indigo Reality",
		homepage: "https://www.opendesktop.org/p/2351226",
		license: "CC0-1.0 (Pling licence field)",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "thecheis-boston-icons",
		label: "Boston icons",
		homepage: "https://github.com/heychrisd/Boston-Icons",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "public-information-symbols-assets",
		label: "@public-information-symbols/assets",
		homepage: "https://www.npmjs.com/package/@public-information-symbols/assets",
		license: "MIT (package.json)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "photon-icons",
		label: "photon-icons",
		homepage: "https://www.npmjs.com/package/photon-icons",
		license: "MPL-2.0 (package.json)",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "helpscout-hs-icons",
		label: "hs-icons",
		homepage: "https://github.com/helpscout/hs-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pop-os-cosmic-icons",
		label: "COSMIC icons",
		homepage: "https://github.com/pop-os/cosmic-icons",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "canonical-ds-assets",
		label: "Canonical design system assets",
		homepage: "https://www.npmjs.com/package/@canonical/ds-assets",
		license: "LGPL-3.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "pling-1289168",
		label: "Papirus Dark Grey",
		homepage: "https://www.opendesktop.org/p/1289168",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2297302",
		label: "SimpleArt",
		homepage: "https://www.opendesktop.org/p/2297302",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "traum-ferienwohnungen-fontfare",
		label: "Traum-Ferienwohnungen Fontfare",
		homepage: "https://www.npmjs.com/package/@traum-ferienwohnungen/fontfare",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "All", group: "line", roots: ["icons"] },
		],
	},
	{
		id: "helpful-places-dtpr-v2",
		label: "DTPR v2 pictograms",
		homepage: "https://github.com/helpful-places/dtpr-v2",
		license: "Apache-2.0 / CC-BY-4.0",
		attribution: "https://github.com/helpful-places/dtpr-v2",
		styles: [
			{ id: "light", label: "Light", group: "line", roots: ["light"] },
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "square", label: "Square", group: "line", roots: ["square"] },
		],
	},
	{
		id: "ibm-design-icons",
		label: "IBM Design icons (pre-Carbon)",
		homepage: "https://github.com/IBM-Design/icons",
		license: "CC-BY-4.0 AND Apache-2.0",
		attribution: "https://github.com/IBM-Design/icons",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2112373",
		label: "Infinity Glass Icon Theme",
		homepage: "https://www.opendesktop.org/p/2112373",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1844859",
		label: "Pop-Extended",
		homepage: "https://www.opendesktop.org/p/1844859",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1302751",
		label: "Epsilon Icons",
		homepage: "https://www.opendesktop.org/p/1302751",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2264971",
		label: "Besgnulinux Rainbow Icon Theme",
		homepage: "https://www.opendesktop.org/p/2264971",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pluralsight-icons",
		label: "Pluralsight icons",
		homepage: "https://www.npmjs.com/package/@pluralsight/icons",
		license: "Apache-2.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "mattiasrunge-cheser-icon-theme",
		label: "Cheser",
		homepage: "https://github.com/mattiasrunge/cheser-icon-theme",
		license: "CC-BY-SA-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "emeraldplatform-svg-icons",
		label: "@emeraldplatform/svg-icons",
		homepage: "https://www.npmjs.com/package/@emeraldplatform/svg-icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "wikimedia-codex-icons",
		label: "Wikimedia Codex icons (non-OOUI)",
		homepage: "https://github.com/wikimedia/design-codex",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1694405",
		label: "Gems",
		homepage: "https://www.opendesktop.org/p/1694405",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "cb-fediverse-iconography-pages",
		label: "Fediverse Iconography",
		homepage: "https://codeberg.org/FediverseIconography/pages",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "kenney-crosshair-pack",
		label: "Kenney Crosshair Pack",
		homepage: "https://kenney.nl/assets/crosshair-pack",
		license: "CC0-1.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "oreo-design-doodle-icons",
		label: "Doodle icons (Oreo)",
		homepage: "https://github.com/nicoletangnan/doodle-icons",
		license: "MIT",
		styles: [
			{ id: "icons", label: "All", group: "line", roots: ["icons"] },
		],
	},
	{
		id: "pling-1439286",
		label: "Polygon icons pack",
		homepage: "https://www.opendesktop.org/p/1439286",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2329877",
		label: "Besgnulinux sade icon theme",
		homepage: "https://www.opendesktop.org/p/2329877",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "arttvad9r-clay-kde-theme",
		label: "clay-kde-theme",
		homepage: "https://github.com/arttvad9r/clay-kde-theme",
		license: "LGPL-2.1",
		copyleft: true,
		styles: [
			{ id: "scalable", label: "Scalable", group: "line", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "palmetto-palmetto-design-tokens",
		label: "Palmetto design tokens icons",
		homepage: "https://www.npmjs.com/package/@palmetto/palmetto-design-tokens",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1367155",
		label: "PlasmaX icon theme",
		homepage: "https://www.opendesktop.org/p/1367155",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "3yourmind-yoco",
		label: "3YOURMIND yoco icons",
		homepage: "https://www.npmjs.com/package/@3yourmind/yoco",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2259441",
		label: "Zafiro Dracula",
		homepage: "https://www.opendesktop.org/p/2259441",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2326678",
		label: "Mint Breeze Light Icons",
		homepage: "https://www.opendesktop.org/p/2326678",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1678986",
		label: "Deepin Icons 2022",
		homepage: "https://www.opendesktop.org/p/1678986",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2187366",
		label: "rare html icon theme",
		homepage: "https://www.opendesktop.org/p/2187366",
		license: "CC0-1.0 (Pling licence field)",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "classicos-themes-classicos-2000-icons",
		label: "ClassicOS 2000 icons",
		homepage: "https://github.com/classicos-themes/classicos-2000-icons",
		license: "BSD-style permissive",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1971791",
		label: "Ubuntu Mono Dark Red",
		homepage: "https://www.opendesktop.org/p/1971791",
		license: "GPL-2.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2235807",
		label: "Tango3 Icons",
		homepage: "https://www.opendesktop.org/p/2235807",
		license: "GPL-2.0-or-later (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2123004",
		label: "Futura Icon Pack",
		homepage: "https://www.opendesktop.org/p/2123004",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1536500",
		label: "Beauty",
		homepage: "https://www.opendesktop.org/p/1536500",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1291816",
		label: "kfaenza outlined",
		homepage: "https://www.opendesktop.org/p/1291816",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2334119",
		label: "QuestX icon theme",
		homepage: "https://www.opendesktop.org/p/2334119",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "oga-cc0-food-icons",
		label: "CC0 Food Icons (OpenGameArt)",
		homepage: "https://opengameart.org/content/cc0-food-icons",
		license: "CC0",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "commons-nuvola-icons",
		label: "Nuvola icons (Commons)",
		homepage: "https://commons.wikimedia.org/wiki/Category:Nuvola_icons",
		license: "Public domain / CC0 / CC-BY per file (Commons)",
		attribution: "https://commons.wikimedia.org/wiki/Category:Nuvola_icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1012155",
		label: "droplineneu-n-recovered",
		homepage: "https://www.opendesktop.org/p/1012155",
		license: "GPL-2.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2351889",
		label: "Green-Blue",
		homepage: "https://www.opendesktop.org/p/2351889",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2071227",
		label: "Blip Icon Theme Gnome",
		homepage: "https://www.opendesktop.org/p/2071227",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2044661",
		label: "Silvery-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2044661",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1308605",
		label: "RevengeShip",
		homepage: "https://www.opendesktop.org/p/1308605",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1015855",
		label: "smoothX-Xfce",
		homepage: "https://www.opendesktop.org/p/1015855",
		license: "GPL-2.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "maxontorres-vscode-cold-boot-theme",
		label: "vscode-cold-boot-theme",
		homepage: "https://github.com/maxontorres/vscode-cold-boot-theme",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1799770",
		label: "Ilustraciones Beta",
		homepage: "https://www.opendesktop.org/p/1799770",
		license: "MIT (Pling licence field)",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "oxide-design-system",
		label: "Oxide design system icons",
		homepage: "https://www.npmjs.com/package/@oxide/design-system",
		license: "MPL-2.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "bi-digital-icons",
		label: "@bi-digital/icons",
		homepage: "https://www.npmjs.com/package/@bi-digital/icons",
		license: "MIT (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "accesibilidad-inclusion-pictogramas-dev",
		label: "pictogramas-dev",
		homepage: "https://github.com/accesibilidad-inclusion/pictogramas-dev",
		license: "MIT",
		styles: [
			{ id: "line", label: "Line", group: "line", roots: ["line"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1188272",
		label: "Antu Classic",
		homepage: "https://www.opendesktop.org/p/1188272",
		license: "LGPL-2.1 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2124270",
		label: "Purple-Accent-Icons",
		homepage: "https://www.opendesktop.org/p/2124270",
		license: "CC0-1.0 (Pling licence field)",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "domdfcoding-custom-wx-icons-adwaita",
		label: "custom_wx_icons_adwaita",
		homepage: "https://github.com/domdfcoding/custom_wx_icons_adwaita",
		license: "LGPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2339137",
		label: "Besgnulinux Black Icon Theme",
		homepage: "https://www.opendesktop.org/p/2339137",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "blackskorpio-home-weather-station",
		label: "home-weather-station",
		homepage: "https://github.com/blackskorpio/home-weather-station",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "viur-framework-viur-icons",
		label: "viur-icons",
		homepage: "https://github.com/viur-framework/viur-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1330383",
		label: "Hey icons",
		homepage: "https://www.opendesktop.org/p/1330383",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "hawaii-desktop-hawaii-icon-theme",
		label: "hawaii-icon-theme",
		homepage: "https://github.com/hawaii-desktop/hawaii-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1313204",
		label: "PearBlueDark",
		homepage: "https://www.opendesktop.org/p/1313204",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2011596",
		label: "Amy-Light-Icons",
		homepage: "https://www.opendesktop.org/p/2011596",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "igloo-ui-icons",
		label: "@igloo-ui/icons",
		homepage: "https://www.npmjs.com/package/@igloo-ui/icons",
		license: "Apache-2.0 (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1151321",
		label: "Oranchelo REMIX",
		homepage: "https://www.opendesktop.org/p/1151321",
		license: "LGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "cappuccinotogo-kokedera-icons-extension-vscode",
		label: "kokedera-icons-extension-vscode",
		homepage: "https://github.com/cappuccinotogo/kokedera-icons-extension-vscode",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "alfa-ui-primitives",
		label: "Alfa-Bank ui-primitives (legacy)",
		homepage: "https://www.npmjs.com/package/alfa-ui-primitives",
		license: "MIT (package.json only)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "svgedit",
		label: "svgedit",
		homepage: "https://www.npmjs.com/package/svgedit",
		license: "(MIT AND Apache-2.0 AND ISC AND LGPL-3.0-or-later AND X11) (package.json)",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "totakit-icons",
		label: "Totakit icons",
		homepage: "https://github.com/totakit/icons",
		license: "MIT",
		styles: [
			{ id: "bold", label: "Bold", group: "solid", roots: ["bold"] },
			{ id: "duotone", label: "Duotone", group: "solid", roots: ["duotone"] },
			{ id: "micro", label: "Micro", group: "line", roots: ["micro"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
			{ id: "thin", label: "Thin", group: "line", roots: ["thin"] },
		],
	},
	{
		id: "pling-2260309",
		label: "eDroid",
		homepage: "https://www.opendesktop.org/p/2260309",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "mr-breakfast-mrbreakfasts-free-prompts",
		label: "mrbreakfasts_free_prompts",
		homepage: "https://github.com/mr-breakfast/mrbreakfasts_free_prompts",
		license: "CC0-1.0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "oga-svg-inventory-icons",
		label: "SVG Inventory Icons (OpenGameArt)",
		homepage: "https://opengameart.org/content/svg-inventory-icons",
		license: "GPL 3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "professorblackman-ghicons",
		label: "ghicons",
		homepage: "https://github.com/professorblackman/ghicons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "oga-lucid-icon-pack",
		label: "Lucid Icon Pack (OpenGameArt)",
		homepage: "https://opengameart.org/content/lucid-icon-pack",
		license: "CC0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1386473",
		label: "Keepin icons",
		homepage: "https://www.opendesktop.org/p/1386473",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1299058",
		label: "OieIcons",
		homepage: "https://www.opendesktop.org/p/1299058",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "makin-things-weather-icons",
		label: "weather-icons",
		homepage: "https://github.com/makin-things/weather-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2028936",
		label: "Icy Mist",
		homepage: "https://www.opendesktop.org/p/2028936",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "rohan62442-cornucopia",
		label: "cornucopia",
		homepage: "https://github.com/rohan62442/cornucopia",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "scalable", label: "Scalable", group: "line", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "commons-crystal-clear-icons-sa",
		label: "Crystal Clear (Everaldo) icons [share-alike files]",
		homepage: "https://commons.wikimedia.org/wiki/Category:Crystal_Clear_icons",
		license: "CC-BY-SA / GFDL / LGPL per file (Commons)",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2168791",
		label: "Greeze",
		homepage: "https://www.opendesktop.org/p/2168791",
		license: "LGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "geo-mena-distill",
		label: "distill",
		homepage: "https://github.com/geo-mena/distill",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "dkanada-frost",
		label: "Frost (dkanada)",
		homepage: "https://github.com/dkanada/frost",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "samrenault-flagada",
		label: "flagada",
		homepage: "https://github.com/samrenault/flagada",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2343940",
		label: "Kutaisi-Icon",
		homepage: "https://www.opendesktop.org/p/2343940",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "oznogon-emptyepsilon-svg-icons",
		label: "emptyepsilon-svg-icons",
		homepage: "https://github.com/oznogon/emptyepsilon-svg-icons",
		license: "GPL-2.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1852344",
		label: "Mystique - Icon Theme",
		homepage: "https://www.opendesktop.org/p/1852344",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1878516",
		label: "Midnight",
		homepage: "https://www.opendesktop.org/p/1878516",
		license: "LGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1397764",
		label: "Neon Knights KDE",
		homepage: "https://www.opendesktop.org/p/1397764",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "rheinsullivan-islamic-icons",
		label: "Islamic Icons",
		homepage: "https://github.com/rheinsullivan/islamic-icons",
		license: "MIT",
		styles: [
			{ id: "32", label: "32", group: "solid", roots: ["32"] },
			{ id: "48", label: "48", group: "solid", roots: ["48"] },
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "fill", label: "Fill", group: "solid", roots: ["fill"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "bobojsza-iconpack-obsidian",
		label: "iconpack-obsidian",
		homepage: "https://github.com/bobojsza/iconpack-obsidian",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "openkylin-deepin-icon-theme",
		label: "deepin-icon-theme",
		homepage: "https://github.com/openkylin/deepin-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "16", label: "16", group: "solid", roots: ["16"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1290288",
		label: "Mint XFCE Black icon and Cursor Theme",
		homepage: "https://www.opendesktop.org/p/1290288",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2055336",
		label: "Bluish-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2055336",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2363195",
		label: "DeepinYouth-icons",
		homepage: "https://www.opendesktop.org/p/2363195",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "dhis2-ui-icons",
		label: "@dhis2/ui-icons",
		homepage: "https://www.npmjs.com/package/@dhis2/ui-icons",
		license: "BSD-3-Clause (package.json)",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1390301",
		label: "Breeze-Cheerful-Phantasy-Dark",
		homepage: "https://www.opendesktop.org/p/1390301",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "space-metaverse-space-ui",
		label: "space-ui",
		homepage: "https://github.com/space-metaverse/space-ui",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "collab-ui-icons",
		label: "Cisco Collab UI icons",
		homepage: "https://www.npmjs.com/package/@collab-ui/icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2357493",
		label: "Bes Heart Icon Theme",
		homepage: "https://www.opendesktop.org/p/2357493",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "garlus-glow-adwaita-icons",
		label: "Glow Adwaita",
		homepage: "https://github.com/garlus/glow-adwaita-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2248792",
		label: "Change theme color",
		homepage: "https://www.opendesktop.org/p/2248792",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1261886",
		label: "deepin plus all icon theme",
		homepage: "https://www.opendesktop.org/p/1261886",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1613712",
		label: "Grade-circle-icon-theme",
		homepage: "https://www.opendesktop.org/p/1613712",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2293974",
		label: "Orion Icon Theme - KDE",
		homepage: "https://www.opendesktop.org/p/2293974",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1217695",
		label: "winner harmonica Icon theme",
		homepage: "https://www.opendesktop.org/p/1217695",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "joaobborges-minimal-icons",
		label: "minimal-icons",
		homepage: "https://github.com/joaobborges/minimal-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2367270",
		label: "Focus Icons Themes",
		homepage: "https://www.opendesktop.org/p/2367270",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "tsipkens-aerosol-icon-project",
		label: "aerosol-icon-project",
		homepage: "https://github.com/tsipkens/aerosol-icon-project",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "codemouse92-vividityicons",
		label: "vividityicons",
		homepage: "https://github.com/codemouse92/vividityicons",
		license: "BSD-3-Clause",
		styles: [
			{ id: "scalable", label: "All", group: "line", roots: ["scalable"] },
		],
	},
	{
		id: "pling-2001728",
		label: "YaruPlasma Dark",
		homepage: "https://www.opendesktop.org/p/2001728",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "bodhidev-e-gtk-pro",
		label: "e-gtk-pro",
		homepage: "https://github.com/bodhidev/e-gtk-pro",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1725190",
		label: "FireMoon a Neon icon theme",
		homepage: "https://www.opendesktop.org/p/1725190",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1302053",
		label: "Icon theme oxygen customied",
		homepage: "https://www.opendesktop.org/p/1302053",
		license: "GPL-2.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "fuxi-zy-fx-svg-icons",
		label: "fx-svg-icons",
		homepage: "https://github.com/fuxi-zy/fx-svg-icons",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2370105",
		label: "DesertOrderIcons",
		homepage: "https://www.opendesktop.org/p/2370105",
		license: "MIT (Pling licence field)",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1496555",
		label: "OE3-Tryovel Icons",
		homepage: "https://www.opendesktop.org/p/1496555",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "kenney-ui-pack-sci-fi",
		label: "Kenney Ui Pack Sci Fi",
		homepage: "https://kenney.nl/assets/ui-pack-sci-fi",
		license: "CC0-1.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1233989",
		label: "Blue Manjaro icon pack",
		homepage: "https://www.opendesktop.org/p/1233989",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "enovale-ameixamore",
		label: "Ameixa More",
		homepage: "https://github.com/enovale/ameixamore",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2298611",
		label: "Monochrome Icons Using the Plasma Theme Color Scheme",
		homepage: "https://www.opendesktop.org/p/2298611",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "breadcrumbistaken-wobbly-icon-theme",
		label: "wobbly-icon-theme",
		homepage: "https://github.com/breadcrumbistaken/wobbly-icon-theme",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "kenney-ui-pack-adventure",
		label: "Kenney Ui Pack Adventure",
		homepage: "https://kenney.nl/assets/ui-pack-adventure",
		license: "CC0-1.0",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1964003",
		label: "Dexy-Color-Light-Icons",
		homepage: "https://www.opendesktop.org/p/1964003",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1331947",
		label: "Yaru extended icon theme 20.04",
		homepage: "https://www.opendesktop.org/p/1331947",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "numixproject-numix-folders",
		label: "Numix Folders",
		homepage: "https://github.com/numixproject/numix-folders",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1443117",
		label: "Bacares Icons for Gnome - DISCONTINUED",
		homepage: "https://www.opendesktop.org/p/1443117",
		license: "LGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2053446",
		label: "Tokyo Night Icons",
		homepage: "https://www.opendesktop.org/p/2053446",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "hasanagitunal-cybrcyanthemes",
		label: "cybrcyanthemes",
		homepage: "https://github.com/hasanagitunal/cybrcyanthemes",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1310034",
		label: "Flat Remix Dark Icons Collection Spring-Summer 2019",
		homepage: "https://www.opendesktop.org/p/1310034",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1361468",
		label: "Breeze-Noir-White-Blue Icons",
		homepage: "https://www.opendesktop.org/p/1361468",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1462976",
		label: "OE3-Icon Pack",
		homepage: "https://www.opendesktop.org/p/1462976",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "michalaferber-resources",
		label: "resources",
		homepage: "https://github.com/michalaferber/resources",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1298508",
		label: "Breeze Chameleon Light",
		homepage: "https://www.opendesktop.org/p/1298508",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1369130",
		label: "Apricity Icons",
		homepage: "https://www.opendesktop.org/p/1369130",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "sempostma-cc0-file-icons",
		label: "cc0-file-icons",
		homepage: "https://github.com/sempostma/cc0-file-icons",
		license: "CC0-1.0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "equinor-engineering-symbols",
		label: "engineering-symbols",
		homepage: "https://github.com/equinor/engineering-symbols",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1170761",
		label: "The Medieval Collection",
		homepage: "https://www.opendesktop.org/p/1170761",
		license: "CC-BY (Pling licence field)",
		attribution: "https://www.opendesktop.org/p/1170761",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "vukoz-oel-3d-forest-icons",
		label: "3d-forest-icons",
		homepage: "https://github.com/vukoz-oel/3d-forest-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "icons", label: "All", group: "line", roots: ["icons"] },
		],
	},
	{
		id: "pling-1976569",
		label: "Serene-Glass",
		homepage: "https://www.opendesktop.org/p/1976569",
		license: "LGPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1229784",
		label: "Breeze nosmall",
		homepage: "https://www.opendesktop.org/p/1229784",
		license: "LGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "gxde-os-gxde-icon-theme",
		label: "gxde-icon-theme",
		homepage: "https://github.com/gxde-os/gxde-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "24", label: "24", group: "solid", roots: ["24"] },
			{ id: "scalable", label: "Scalable", group: "solid", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1234339",
		label: "Dual",
		homepage: "https://www.opendesktop.org/p/1234339",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1260352",
		label: "Soda Icon Theme",
		homepage: "https://www.opendesktop.org/p/1260352",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "burhanilinux-b-icons",
		label: "b-icons",
		homepage: "https://github.com/burhanilinux/b-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "scalable", label: "Scalable", group: "solid", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1329940",
		label: "Simplexx",
		homepage: "https://www.opendesktop.org/p/1329940",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "rqtll-rqtll-components",
		label: "rqtll-components",
		homepage: "https://github.com/rqtll/rqtll-components",
		license: "MIT",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1535117",
		label: "Dessert",
		homepage: "https://www.opendesktop.org/p/1535117",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2144486",
		label: "Blu-red icons",
		homepage: "https://www.opendesktop.org/p/2144486",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2192424",
		label: "Ars Light Icons",
		homepage: "https://www.opendesktop.org/p/2192424",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2360095",
		label: "Elysia Icons",
		homepage: "https://www.opendesktop.org/p/2360095",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2300600",
		label: "Fluency",
		homepage: "https://www.opendesktop.org/p/2300600",
		license: "GPL-2.0-or-later (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1817498",
		label: "pacmanOS Montreal",
		homepage: "https://www.opendesktop.org/p/1817498",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "blackskorpio-qx-hexagon",
		label: "qx-hexagon",
		homepage: "https://github.com/blackskorpio/qx-hexagon",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "mk-icon",
		label: "mk-icon",
		homepage: "https://www.npmjs.com/package/mk-icon",
		license: "MIT (package.json)",
		styles: [
			{ id: "fill", label: "Fill", group: "solid", roots: ["fill"] },
			{ id: "outline", label: "Outline", group: "line", roots: ["outline"] },
		],
	},
	{
		id: "pling-1294006",
		label: "neon icons",
		homepage: "https://www.opendesktop.org/p/1294006",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "shaheenmedtech-clinexa-serenity",
		label: "clinexa-serenity",
		homepage: "https://github.com/shaheenmedtech/clinexa-serenity",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1348479",
		label: "Mondrian Icons",
		homepage: "https://www.opendesktop.org/p/1348479",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1176332",
		label: "Aether",
		homepage: "https://www.opendesktop.org/p/1176332",
		license: "LGPL-2.1 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "cantfindgeorge-es-de-iconic-theme-customized",
		label: "es-de-iconic-theme-customized",
		homepage: "https://github.com/cantfindgeorge/es-de-iconic-theme-customized",
		license: "CC0-1.0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1436567",
		label: "Infinity-Light-Icons",
		homepage: "https://www.opendesktop.org/p/1436567",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1541561",
		label: "Dracula Icons",
		homepage: "https://www.opendesktop.org/p/1541561",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1442564",
		label: "RR Circle Icon Pack",
		homepage: "https://www.opendesktop.org/p/1442564",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2313940",
		label: "Vinyl Icon Theme",
		homepage: "https://www.opendesktop.org/p/2313940",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "zeluizr-vtex-io-snippets",
		label: "vtex-io-snippets",
		homepage: "https://github.com/zeluizr/vtex-io-snippets",
		license: "MIT",
		styles: [
			{ id: "icons", label: "Icons", group: "solid", roots: ["icons"] },
		],
	},
	{
		id: "pling-1412411",
		label: "Blue-Zafiro-plus",
		homepage: "https://www.opendesktop.org/p/1412411",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1012412",
		label: "Old and Traditional Ubuntu 10.10 for nostalgists",
		homepage: "https://www.opendesktop.org/p/1012412",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "kvsun-kvs-icons",
		label: "kvs-icons",
		homepage: "https://github.com/kvsun/kvs-icons",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2102240",
		label: "Magna-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2102240",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1257656",
		label: "Deepin Icons for KDE Plasma",
		homepage: "https://www.opendesktop.org/p/1257656",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "keithdhedger-themes-and-icons",
		label: "themes-and-icons",
		homepage: "https://github.com/keithdhedger/themes-and-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2147305",
		label: "XFCE Kali Themes and Icons",
		homepage: "https://www.opendesktop.org/p/2147305",
		license: "GPL-2.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2205840",
		label: "Colloid Dracula Purple Dark Icons",
		homepage: "https://www.opendesktop.org/p/2205840",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1964004",
		label: "Dexy-Color-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/1964004",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1998755",
		label: "Elementary Kde",
		homepage: "https://www.opendesktop.org/p/1998755",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "devanthony038-fluent-icon-theme",
		label: "fluent-icon-theme",
		homepage: "https://github.com/devanthony038/fluent-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "rickhersd-neo-icons",
		label: "neo-icons",
		homepage: "https://github.com/rickhersd/neo-icons",
		license: "MIT",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2151189",
		label: "Besgnulinux Monochrome Icon Theme",
		homepage: "https://www.opendesktop.org/p/2151189",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2370870",
		label: "Black and white icons lines",
		homepage: "https://www.opendesktop.org/p/2370870",
		license: "CC0-1.0 (Pling licence field)",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1982094",
		label: "Wings-Light-Icons",
		homepage: "https://www.opendesktop.org/p/1982094",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1717303",
		label: "Shadows-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/1717303",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1336002",
		label: "Dexie-Korla",
		homepage: "https://www.opendesktop.org/p/1336002",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1567162",
		label: "Calm",
		homepage: "https://www.opendesktop.org/p/1567162",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "oga-gui-mobile-icons",
		label: "Gui Mobile Icons (OpenGameArt)",
		homepage: "https://opengameart.org/content/gui-mobile-icons",
		license: "CC0",
		styles: [
			{ id: "icons", label: "Icons", group: "line", roots: ["icons"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2110189",
		label: "Vivid-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2110189",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1002440",
		label: "Oxyfaenza",
		homepage: "https://www.opendesktop.org/p/1002440",
		license: "GPL-3.0 (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1208650",
		label: "Oxygen-473-II",
		homepage: "https://www.opendesktop.org/p/1208650",
		license: "LGPL-3.0 (Oxygen COPYING) (licence file in archive; Pling licence field empty)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2351141",
		label: "Midnight Sonata",
		homepage: "https://www.opendesktop.org/p/2351141",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "xentaos-xenta-x-icons",
		label: "xenta-x-icons",
		homepage: "https://github.com/xentaos/xenta-x-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "16", label: "16", group: "line", roots: ["16"] },
			{ id: "scalable", label: "Scalable", group: "line", roots: ["scalable"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2096958",
		label: "cyberpunk technotronic filled folders",
		homepage: "https://www.opendesktop.org/p/2096958",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1306077",
		label: "FF-Flamengo-RJ-BR",
		homepage: "https://www.opendesktop.org/p/1306077",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1307050",
		label: "Numix Blueberry",
		homepage: "https://www.opendesktop.org/p/1307050",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2239645",
		label: "Color Flow icons",
		homepage: "https://www.opendesktop.org/p/2239645",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1873545",
		label: "Shiny-Color-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/1873545",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "makdumibrohim-kiwori-icons",
		label: "kiwori-icons",
		homepage: "https://github.com/makdumibrohim/kiwori-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1380833",
		label: "One dark icons",
		homepage: "https://www.opendesktop.org/p/1380833",
		license: "CC-BY-SA (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1199881",
		label: "Delft",
		homepage: "https://www.opendesktop.org/p/1199881",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2324007",
		label: "Cosmictron - Cosmic DE",
		homepage: "https://www.opendesktop.org/p/2324007",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "kenney-board-game-info",
		label: "Kenney Board Game Info",
		homepage: "https://kenney.nl/assets/board-game-info",
		license: "CC0-1.0",
		styles: [
			{ id: "light", label: "Light", group: "line", roots: ["light"] },
			{ id: "solid", label: "Solid", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "cb-edlc-cy-icons",
		label: "cy_icons",
		homepage: "https://codeberg.org/EDLC/cy_icons",
		license: "CC-BY-4.0 (README badge only)",
		attribution: "https://codeberg.org/EDLC/cy_icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-2136240",
		label: "Gradient-KDE-Story-Blue-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2136240",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1506807",
		label: "Jelly-Ellie",
		homepage: "https://www.opendesktop.org/p/1506807",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1451799",
		label: "Milky Icon theme from SulinOS",
		homepage: "https://www.opendesktop.org/p/1451799",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1613713",
		label: "Bonny-Light-Icons",
		homepage: "https://www.opendesktop.org/p/1613713",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "grungefox-adwaitax-icon-theme",
		label: "adwaitax-icon-theme",
		homepage: "https://github.com/grungefox/adwaitax-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "pling-1483458",
		label: "Cyan-Breeze-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/1483458",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2334840",
		label: "Slot BonaFides Dark Icons",
		homepage: "https://www.opendesktop.org/p/2334840",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1990795",
		label: "Uos Dark [Deepin V20]",
		homepage: "https://www.opendesktop.org/p/1990795",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1967757",
		label: "Zafiro-Nord-Dark-Grey",
		homepage: "https://www.opendesktop.org/p/1967757",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1417419",
		label: "Humanities[green_mod]",
		homepage: "https://www.opendesktop.org/p/1417419",
		license: "GPL-2.0-or-later (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1883711",
		label: "FLAT MATERIAL ICON THEME 1.0",
		homepage: "https://www.opendesktop.org/p/1883711",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-2346407",
		label: "Commonality Sol",
		homepage: "https://www.opendesktop.org/p/2346407",
		license: "CC-BY (Pling licence field)",
		attribution: "https://www.opendesktop.org/p/2346407",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "oga-cc0-rune-icons",
		label: "CC0 Rune Icons (OpenGameArt)",
		homepage: "https://opengameart.org/content/cc0-rune-icons",
		license: "CC0",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1227736",
		label: "Griffin Ghost",
		homepage: "https://www.opendesktop.org/p/1227736",
		license: "CC-BY (Pling licence field)",
		attribution: "https://www.opendesktop.org/p/1227736",
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "phillipclaunch32-numix-icon-theme",
		label: "numix-icon-theme",
		homepage: "https://github.com/phillipclaunch32/numix-icon-theme",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2345718",
		label: "Slot Gray Dark Icons",
		homepage: "https://www.opendesktop.org/p/2345718",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "naykkalak-fenestra-weather-icons",
		label: "fenestra-weather-icons",
		homepage: "https://github.com/naykkalak/fenestra-weather-icons",
		license: "GPL-3.0",
		copyleft: true,
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "oga-new-icons-pack",
		label: "New Icons Pack (OpenGameArt)",
		homepage: "https://opengameart.org/content/new-icons-pack",
		license: "CC0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1384861",
		label: "Super flat remix",
		homepage: "https://www.opendesktop.org/p/1384861",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1182967",
		label: "Oranchelo Remix",
		homepage: "https://www.opendesktop.org/p/1182967",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1012504",
		label: "Humanities",
		homepage: "https://www.opendesktop.org/p/1012504",
		license: "LGPL-2.1 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "oga-dungeon-icons",
		label: "Dungeon icons (OpenGameArt)",
		homepage: "https://opengameart.org/content/dungeon-icons",
		license: "CC-BY-SA 4.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "hrdwrrsk-adwaita-xfce-icon-theme",
		label: "adwaita-xfce-icon-theme",
		homepage: "https://github.com/hrdwrrsk/adwaita-xfce-icon-theme",
		license: "GPL-2.0",
		copyleft: true,
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-1192944",
		label: "Papirus icons + Breeze action icons",
		homepage: "https://www.opendesktop.org/p/1192944",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1199796",
		label: "Exagonal",
		homepage: "https://www.opendesktop.org/p/1199796",
		license: "CC-BY (Pling licence field)",
		attribution: "https://www.opendesktop.org/p/1199796",
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "oga-activity-icons",
		label: "Activity Icons (OpenGameArt)",
		homepage: "https://opengameart.org/content/activity-icons",
		license: "GPL 3.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "oga-patreon-public-domain-art-tarot-arcana-icons",
		label: "Patreon Public Domain Art - Tarot Arcana Icons (OpenGameArt)",
		homepage: "https://opengameart.org/content/patreon-public-domain-art-tarot-arcana-icons",
		license: "CC0",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
		],
	},
	{
		id: "pling-2300624",
		label: "Slot-Multicolor-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/2300624",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-2234789",
		label: "Slot Light Icons",
		homepage: "https://www.opendesktop.org/p/2234789",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1898626",
		label: "Aura-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/1898626",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Icons", group: "solid", roots: ["color"] },
		],
	},
	{
		id: "pling-1654368",
		label: "Jolly-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/1654368",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1687609",
		label: "Relax-Dark-Icons",
		homepage: "https://www.opendesktop.org/p/1687609",
		license: "GPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "pling-1325154",
		label: "vitas icon theme",
		homepage: "https://www.opendesktop.org/p/1325154",
		license: "AGPL-3.0 (Pling licence field)",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	{
		id: "peteonrails-cathode-phosphor-icon-theme",
		label: "Cathode Phosphor",
		homepage: "https://github.com/peteonrails/cathode-phosphor-icon-theme",
		license: "CC-BY-SA-4.0",
		copyleft: true,
		styles: [
			{ id: "color", label: "Color", group: "solid", roots: ["color"] },
			{ id: "symbolic", label: "Symbolic", group: "line", roots: ["symbolic"] },
		],
	},
	// GAP_300K_END
	// Material Symbols weights Iconify doesn't carry (it has 200 and 400): bun run fetch:material-symbols
	{
		id: "material-symbols-100",
		label: "Material Symbols Thin 100",
		homepage: "https://fonts.google.com/icons",
		styles: [
			{ id: "outlined", label: "Outlined", group: "line", roots: ["outlined"] },
			{ id: "outlined-filled", label: "Outlined Filled", group: "solid", roots: ["outlined-filled"] },
			{ id: "rounded", label: "Rounded", group: "line", roots: ["rounded"] },
			{ id: "rounded-filled", label: "Rounded Filled", group: "solid", roots: ["rounded-filled"] },
			{ id: "sharp", label: "Sharp", group: "line", roots: ["sharp"] },
			{ id: "sharp-filled", label: "Sharp Filled", group: "solid", roots: ["sharp-filled"] },
		],
	},
	{
		id: "material-symbols-300",
		label: "Material Symbols Light 300",
		homepage: "https://fonts.google.com/icons",
		styles: [
			{ id: "outlined", label: "Outlined", group: "line", roots: ["outlined"] },
			{ id: "outlined-filled", label: "Outlined Filled", group: "solid", roots: ["outlined-filled"] },
			{ id: "rounded", label: "Rounded", group: "line", roots: ["rounded"] },
			{ id: "rounded-filled", label: "Rounded Filled", group: "solid", roots: ["rounded-filled"] },
			{ id: "sharp", label: "Sharp", group: "line", roots: ["sharp"] },
			{ id: "sharp-filled", label: "Sharp Filled", group: "solid", roots: ["sharp-filled"] },
		],
	},
	{
		id: "material-symbols-500",
		label: "Material Symbols Medium 500",
		homepage: "https://fonts.google.com/icons",
		styles: [
			{ id: "outlined", label: "Outlined", group: "line", roots: ["outlined"] },
			{ id: "outlined-filled", label: "Outlined Filled", group: "solid", roots: ["outlined-filled"] },
			{ id: "rounded", label: "Rounded", group: "line", roots: ["rounded"] },
			{ id: "rounded-filled", label: "Rounded Filled", group: "solid", roots: ["rounded-filled"] },
			{ id: "sharp", label: "Sharp", group: "line", roots: ["sharp"] },
			{ id: "sharp-filled", label: "Sharp Filled", group: "solid", roots: ["sharp-filled"] },
		],
	},
	{
		id: "material-symbols-600",
		label: "Material Symbols SemiBold 600",
		homepage: "https://fonts.google.com/icons",
		styles: [
			{ id: "outlined", label: "Outlined", group: "line", roots: ["outlined"] },
			{ id: "outlined-filled", label: "Outlined Filled", group: "solid", roots: ["outlined-filled"] },
			{ id: "rounded", label: "Rounded", group: "line", roots: ["rounded"] },
			{ id: "rounded-filled", label: "Rounded Filled", group: "solid", roots: ["rounded-filled"] },
			{ id: "sharp", label: "Sharp", group: "line", roots: ["sharp"] },
			{ id: "sharp-filled", label: "Sharp Filled", group: "solid", roots: ["sharp-filled"] },
		],
	},
	{
		id: "material-symbols-700",
		label: "Material Symbols Bold 700",
		homepage: "https://fonts.google.com/icons",
		styles: [
			{ id: "outlined", label: "Outlined", group: "line", roots: ["outlined"] },
			{ id: "outlined-filled", label: "Outlined Filled", group: "solid", roots: ["outlined-filled"] },
			{ id: "rounded", label: "Rounded", group: "line", roots: ["rounded"] },
			{ id: "rounded-filled", label: "Rounded Filled", group: "solid", roots: ["rounded-filled"] },
			{ id: "sharp", label: "Sharp", group: "line", roots: ["sharp"] },
			{ id: "sharp-filled", label: "Sharp Filled", group: "solid", roots: ["sharp-filled"] },
		],
	},
];

export function getIconSet(setId: string) {
	return ICON_SETS.find((s) => s.id === setId);
}


