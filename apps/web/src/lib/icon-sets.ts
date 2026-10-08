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


