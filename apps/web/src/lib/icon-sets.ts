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
		id: "baseweb-icons",
		label: "Uber Base Web Icons",
		homepage: "https://github.com/uber/baseweb",
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
		id: "3dicons",
		label: "3dicons",
		homepage: "https://github.com/realvjy/3dicons",
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
		id: "discord-badges",
		label: "Discord Badge Vault",
		homepage: "https://github.com/dakshitgamerz-lgtm/discord-badge-vault",
		styles: [
			{ id: "line", label: "All", group: "line", roots: ["line"] },
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
		id: "bili-icons",
		label: "Bili Icon Pack",
		homepage: "https://github.com/dashuchufang/bili_icon_pack",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
		],
	},
	{
		id: "quill-icons",
		label: "Quill Icons",
		homepage: "https://github.com/deriv-com/quill-icons-park",
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
		id: "morphnext",
		label: "MorphNext",
		homepage: "https://github.com/kicknext/morphnext",
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
		id: "ha-akentner-icons",
		label: "HA Akentner Icons",
		homepage: "https://github.com/akentner/hass-akentner-icons",
		styles: [
			{ id: "solid", label: "Icons", group: "solid", roots: ["solid"] },
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
	// P0_FAMILIES_END
];

export function getIconSet(setId: string) {
	return ICON_SETS.find((s) => s.id === setId);
}


