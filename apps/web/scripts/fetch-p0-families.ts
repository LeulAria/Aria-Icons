/**
 * Import the combined P0 icon families that are not already vendored.
 *
 * Families already in ICON_SETS (same repo, or the same set under another
 * repo) are recorded as duplicates and skipped.
 *
 * Writes loose SVGs under icons/<setId>/<style>/ and registers them in
 * src/lib/icon-sets.ts between the P0_FAMILIES markers.
 *
 *   bun run fetch:p0
 *   bun run fetch:p0 -- --only lawnicons,blobmoji
 *   bun run fetch:p0 -- --force
 */
import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import JSZip from "jszip";

const execFileAsync = promisify(execFile);
const ICONS_ROOT = path.join(process.cwd(), "icons");
const TMP = path.join(os.tmpdir(), "aria-p0-icons");
const REPORT = path.join(os.tmpdir(), "aria-p0-report.json");
const ICON_SETS_FILE = path.join(process.cwd(), "src/lib/icon-sets.ts");
const ANIMATED_FILE = path.join(process.cwd(), "src/lib/animated-sets.ts");
const CONCURRENCY = 3;

type Pack = {
	label: string;
	repo: string;
	setId: string;
	/** Already vendored — do not import again. */
	duplicateOf?: string;
	/** Only these repo paths hold the icons (drops old versions, raster sizes, font copies). */
	include?: RegExp;
	/** Name and style from the repo path when the folders don't say; null drops the file. */
	classify?: (rel: string) => { name: string; style: string } | null;
	/**
	 * Collapse size and color-theme copies that share a filename.
	 * Symbolic icons stay separate from the color version.
	 */
	dedupe?: boolean;
	/** TSX/JSX fragments (no loose SVG). Each file becomes one icon. */
	componentInclude?: RegExp;
	fragmentViewBox?: string;
};

const OLICONS_STYLES: Record<string, string> = { o: "outline", f: "fill", so: "sharp-outline", sf: "sharp-fill" };

/** FreeDesktop themes: one color icon and, when present, its symbolic twin. */
function desktopIcon(rel: string): { name: string; style: string } | null {
	const base = path.basename(rel).replace(/\.svg$/i, "");
	if (!base || base.startsWith(".")) return null;
	const symbolic = /\/symbolic\//i.test(rel) || /-symbolic$/i.test(base);
	return { name: base.replace(/-symbolic$/i, ""), style: symbolic ? "symbolic" : "color" };
}

/** Desktop themes: every SVG except cursors, previews, and docs. Dedupe collapses sizes. */
const THEME_SVG =
	/^(?!.*(?:\/cursors?(?:\/|$)|\/previews?(?:\/|$)|\/templates?(?:\/|$)|\/debian\/|\/docs?(?:\/|$)|\/screenshots?(?:\/|$))).+\.svg$/i;

function themePack(label: string, repo: string, setId: string): Pack {
	return { label, repo, setId, include: THEME_SVG, dedupe: true, classify: desktopIcon };
}

/**
 * LibreOffice icon themes draw most commands at 16px (`sc_`), 24px (`lc_`)
 * and 32px (`cmd/32/`); each size is its own drawing, so sizes become styles.
 */
function libreOfficeTheme(label: string, theme: string, setId: string): Pack {
	const root = `icon-themes/${theme}_svg/`;
	return {
		label,
		repo: "LibreOffice/core",
		setId,
		include: new RegExp(`^${root.replace(/\//g, "\\/")}.+\\.svg$`),
		classify: (rel) => {
			const file = path.basename(rel, ".svg");
			const local = rel.slice(root.length);
			if (/(^|\/)cmd\/32\//.test(local)) return { name: file, style: "32" };
			if (/^lc_/.test(file)) return { name: file.slice(3), style: "24" };
			if (/^sc_/.test(file)) return { name: file.slice(3), style: "16" };
			const parent = path.dirname(local).split("/").filter((p) => !/^(res|cmd|icons?)$/.test(p)).pop();
			return { name: parent ? `${parent}-${file}` : file, style: "misc" };
		},
	};
}

type StyleOut = {
	id: string;
	label: string;
	group: "line" | "solid";
	count: number;
};

type ReportEntry = {
	label: string;
	repo: string;
	setId: string;
	status: "ok" | "duplicate" | "empty" | "error";
	duplicateOf?: string;
	count: number;
	styles?: StyleOut[];
	animated?: boolean;
	note?: string;
};

const PACKS: Pack[] = [
	{ label: "Atlas Icons", repo: "Vectopus/Atlas-icons-font", setId: "atlas-icons", duplicateOf: "atlas-icons" },
	{ label: "Lawnicons", repo: "lawnchairlauncher/lawnicons", setId: "lawnicons" },
	{ label: "Trust Wallet Assets", repo: "trustwallet/assets", setId: "trust-wallet-assets" },
	{ label: "vscode-icons", repo: "vscode-icons/vscode-icons", setId: "vscode-icons" },
	{ label: "Visio Stencils", repo: "bhdicaire/visiostencils", setId: "visio-stencils" },
	{ label: "Blobmoji", repo: "c1710/blobmoji", setId: "blobmoji" },
	{ label: "HA Cupertino Icons", repo: "menahishayan/homeassistant-cupertino-icons", setId: "ha-cupertino-icons" },
	{ label: "selfh.st Icons", repo: "selfhst/icons", setId: "selfhst-icons" },
	{ label: "Simple Skill Icons", repo: "irfaan008/simple-skill-icons", setId: "simple-skill-icons" },
	{ label: "VS Code Material Icon Theme", repo: "PKief/vscode-material-icon-theme", setId: "vscode-material-icons" },
	{ label: "Catmoji", repo: "catmoji/catmoji", setId: "catmoji" },
	{ label: "MSR Icons", repo: "minka1902/msr-icons", setId: "msr-icons" },
	{ label: "Dashboard Icons", repo: "homarr-labs/dashboard-icons", setId: "dashboard-icons", duplicateOf: "dashboard-icons" },
	{ label: "emoji-data", repo: "iamcal/emoji-data", setId: "emoji-data" },
	{ label: "VK Icons", repo: "VKCOM/icons", setId: "vk-icons", duplicateOf: "vk-icons" },
	{ label: "Altrex Icons", repo: "altrex-ui/altrex-icons", setId: "altrex-icons" },
	{ label: "Neu Icons", repo: "neuicons/neu", setId: "neu-icons" },
	{ label: "Azure Visio Stencils", repo: "sandroasp/microsoft-integration-and-azure-stencils-pack-for-visio", setId: "azure-visio-stencils" },
	{ label: "Fomantic UI Icons", repo: "fomantic/Fomantic-UI", setId: "fomantic-icons" },
	{ label: "MS Emoji", repo: "zdalez/msemoji", setId: "msemoji" },
	{ label: "Papirus Icons", repo: "PapirusDevelopmentTeam/papirus_icons", setId: "papirus-icons" },
	{ label: "ProXIcons", repo: "ProgrammerKR/ProXIcons", setId: "proxicons", duplicateOf: "proxicons" },
	{ label: "Semantic UI Icons", repo: "Semantic-Org/Semantic-UI", setId: "semantic-ui-icons" },
	{ label: "KDesign Icons", repo: "kingdee/kdesign-icons", setId: "kdesign-icons" },
	{ label: "AirQo Icons", repo: "airqo-platform/airqo-api", setId: "airqo-icons" },
	{ label: "Iconoteka", repo: "iconoteka/iconoteka", setId: "iconoteka" },
	{ label: "LivelyIcons", repo: "livelyicons/icons", setId: "livelyicons" },
	{ label: "Adobe Spectrum", repo: "adobe/spectrum-css-workflow-icons", setId: "spectrum-icons", duplicateOf: "spectrum-icons" },
	{ label: "AnimateIcons", repo: "avijit07x/animateicons", setId: "animateicons" },
	{ label: "Calcite UI Icons", repo: "Esri/calcite-ui-icons", setId: "calcite-icons" },
	{ label: "Trinil", repo: "5e1y/trinil", setId: "trinil", duplicateOf: "trinil" },
	{ label: "coreIcons", repo: "mauriciospark/coreicons", setId: "coreicons" },
	{ label: "Country Flags", repo: "hjnilsson/country-flags", setId: "country-flags" },
	{ label: "Emblemicons", repo: "emblemicons/emblemicons", setId: "emblemicons", duplicateOf: "emblemicons" },
	{ label: "FamFamFam Silk", repo: "Simandara/famfamfam-silk-svg", setId: "famfamfam-silk", duplicateOf: "famfamfam-silk" },
	{ label: "HD Icons", repo: "xushier/hd-icons", setId: "hd-icons" },
	{ label: "Linearicons", repo: "cjpatoilo/linearicons", setId: "linearicons" },
	{ label: "Oracle Font APEX", repo: "oracle/font-apex", setId: "font-apex" },
	{ label: "Aegis Icons", repo: "aegis-icons/aegis-icons", setId: "aegis-icons", duplicateOf: "aegis-icons" },
	{ label: "File Icons", repo: "file-icons/icons", setId: "file-icons" },
	{ label: "KNX UF Iconset", repo: "mampfes/ha-knx-uf-iconset", setId: "knx-uf-icons" },
	{ label: "Rune Icons", repo: "runeicons/runeicons", setId: "rune-icons" },
	{ label: "Samsung One UI Icons", repo: "OneUIProject/oneui-icons", setId: "oneui-icons" },
	{ label: "MFG Labs Iconset", repo: "MfgLabs/mfglabs-iconset", setId: "mfglabs-icons" },
	{ label: "Fork Awesome", repo: "ForkAwesome/Fork-Awesome", setId: "fork-awesome", duplicateOf: "fork-awesome" },
	{ label: "Game Icon Pack", repo: "Nieobie/game-icon-pack", setId: "game-icon-pack", duplicateOf: "game-icon-pack" },
	{ label: "HashiCorp Flight", repo: "hashicorp/flight", setId: "flight-icons", duplicateOf: "flight-icons" },
	{ label: "LibreICONS", repo: "DennisSuitters/LibreICONS", setId: "libreicons" },
	{ label: "Lobe Icons", repo: "lobehub/lobe-icons", setId: "lobe-icons", duplicateOf: "lobe-icons" },
	{ label: "PokéSprite", repo: "msikma/pokesprite", setId: "pokesprite" },
	{ label: "Erxes Icons", repo: "erxes/erxes-icon", setId: "erxes-icons" },
	{ label: "ShopIcons", repo: "h2d2-design/h2d2-shopicons", setId: "shopicons" },
	{ label: "Linea Iconset", repo: "linea-io/Linea-Iconset", setId: "linea-icons" },
	{ label: "Blueprint", repo: "palantir/blueprint", setId: "blueprint-icons", duplicateOf: "blueprint-icons" },
	{ label: "Orange Icons", repo: "capybaraicons/orange-icons", setId: "orange-icons" },
	{ label: "SVGL", repo: "pheralb/svgl", setId: "svgl", duplicateOf: "svgl" },
	{ label: "Tech Stack Icon", repo: "yethura-424/tech_stack_icon", setId: "tech-stack-icons" },
	{ label: "Sketch Icons", repo: "garudatechnologydevelopers/sketch-icons", setId: "sketch-icons" },
	{ label: "Iconsans", repo: "mortezasabihi/iconsans", setId: "iconsans" },
	{ label: "ICONIC", repo: "YuheshPandian/ICONIC", setId: "iconic", duplicateOf: "iconic" },
	{ label: "Appstract", repo: "mirrorkeydev/appstract", setId: "appstract" },
	{ label: "Homelab Icons", repo: "loganmarchione/homelab-svg-assets", setId: "homelab-icons", duplicateOf: "homelab-icons" },
	{ label: "Iconspeck", repo: "moser-jose/iconspeck", setId: "iconspeck" },
	{ label: "Line MD", repo: "cyberalien/line-md", setId: "line-md" },
	{ label: "React Crypto Icons", repo: "shed3/react-crypto-icons", setId: "react-crypto-icons" },
	{ label: "doo-iconik", repo: "ajentik/doo-iconik", setId: "doo-iconik", duplicateOf: "doo-iconik" },
	{ label: "Disarto Icons", repo: "disarto/disarto-icons", setId: "disarto-icons" },
	{ label: "Forge Icon", repo: "Liberty-slug/forge-icon", setId: "forge-icon", duplicateOf: "forge-icon" },
	{ label: "Semi Icons", repo: "DouyinFE/semi-design", setId: "semi-icons", duplicateOf: "semi-icons" },
	{ label: "Cloudscape", repo: "cloudscape-design/components", setId: "cloudscape-icons", duplicateOf: "cloudscape-icons" },
	{ label: "AWS Icons", repo: "boyney123/awsicons", setId: "awsicons" },
	{ label: "Brightlayer UI Icons", repo: "etn-ccis/blui-icons", setId: "brightlayer-icons" },
	{ label: "Basil Icons", repo: "jonybekov/react-basil", setId: "basil-icons" },
	{ label: "Cryptocoins", repo: "allienworks/cryptocoins", setId: "cryptocoins" },
	{ label: "Microsoft Fabric Icons", repo: "fabrictools/fabric-icons", setId: "fabric-icons" },
	{ label: "Moving Icons", repo: "jis3r/icons", setId: "moving-icons" },
	{ label: "PatternFly", repo: "patternfly/patternfly-react", setId: "patternfly-icons", duplicateOf: "patternfly-icons" },
	{ label: "Rpg Awesome", repo: "nagoshiashumari/Rpg-Awesome", setId: "rpg-awesome" },
	{ label: "Sketchybar App Font", repo: "kvndrsslr/sketchybar-app-font", setId: "sketchybar-app-font" },
	{ label: "Super Tiny Icons", repo: "edent/SuperTinyIcons", setId: "super-tiny-icons", duplicateOf: "super-tiny-icons" },
	{ label: "Developer Icons", repo: "xandemon/developer-icons", setId: "developer-icons", duplicateOf: "developer-icons" },
	{ label: "PaymentFont", repo: "AlexanderPoellmann/PaymentFont", setId: "paymentfont", duplicateOf: "paymentfont" },
	{ label: "Payment Icons", repo: "aaronfagan/svg-credit-card-payment-icons", setId: "payment-icons", duplicateOf: "payment-icons" },
	{ label: "Browser Logos", repo: "alrra/browser-logos", setId: "browser-logos", duplicateOf: "browser-logos" },
	{ label: "Icoziv", repo: "thuongtruong109/icoziv", setId: "icoziv" },
	{ label: "Projectivy Icon Pack", repo: "sicmundus86/projectivyiconpack", setId: "projectivy-icons" },
	{ label: "OpenTiny Icons", repo: "opentiny/icons", setId: "opentiny-icons" },
	{ label: "Orbit Icons", repo: "kiwicom/orbit", setId: "orbit-icons" },
	{ label: "Monster Hunter Icons", repo: "othellorhin/mhw_icons_svg", setId: "mhw-icons" },
	{ label: "Frost Icon Theme", repo: "thissayantan/frost-icon-theme", setId: "frost-icons" },
	{ label: "Arashi Icon Set", repo: "0hstormy/arashi", setId: "arashi-icons" },
	{ label: "Suomi.fi Icons", repo: "vrk-kpa/suomifi-icons", setId: "suomifi-icons" },
	{ label: "Bootstrap Italia Icons", repo: "italia/bootstrap-italia", setId: "bootstrap-italia-icons" },
	{ label: "Bancos em SVG", repo: "tgentil/bancos-em-svg", setId: "bancos-svg" },
	{ label: "Buckaroo Payment Media", repo: "buckaroo-it/media", setId: "buckaroo-icons" },
	{ label: "Ontario Design System Icons", repo: "ongov/Ontario-Design-System", setId: "ontario-icons" },
	{ label: "Vigil Icons", repo: "vigilantkeno/vigil-icons", setId: "vigil-icons" },
	{ label: "Helldivers 2 Stratagems", repo: "nvigneux/helldivers-2-stratagems-icons-svg", setId: "helldivers-icons" },
	{ label: "WoW Icon Packs", repo: "kodewdle/iconpacks", setId: "wow-icon-packs" },
	{ label: "Windows XP Icon Pack", repo: "marchmountain/-windows-xp-high-resolution-icon-pack", setId: "windows-xp-icons" },
	{ label: "VS Code Iconset", repo: "be5invis/vscode-iconset", setId: "vscode-iconset" },
	{ label: "Illustration Foundry", repo: "iamtouchskyer/illustration-foundry", setId: "illustration-foundry" },
	{ label: "Duo Blazor Icons", repo: "ricardoboss/DuoBlazorIcons", setId: "duo-blazor-icons" },
	{ label: "CryptoFont", repo: "AlexanderPoellmann/CryptoFont", setId: "cryptofont" },
	{ label: "Proxy App Icon Set", repo: "arpicme/proxy-app-icon-set", setId: "proxy-app-icons" },
	{ label: "Snowboard Icon Pack", repo: "sunbelife/snowboard-iconpack-for-smartisan-os", setId: "snowboard-icons" },
	{ label: "PureIconPack", repo: "thewinds071/pureiconpack", setId: "pureiconpack" },
	{ label: "PureIconPack (morirain)", repo: "morirain/pureiconpack", setId: "pureiconpack-morirain" },
	{ label: "Idea Icon Pack", repo: "krasa/ideaiconpack", setId: "idea-icon-pack" },
	{ label: "Lombok Icons", repo: "codinglombok/lombokicons", setId: "lombok-icons" },
	{ label: "Android TV Icon Pack", repo: "hqn-scl/android-tv-minimalist-icon-pack", setId: "android-tv-icons" },
	{ label: "Monet Line Icons", repo: "dusk0531/monet-line-icon-package", setId: "monet-line-icons" },
	{ label: "Material OS Icon Pack", repo: "materialos/android-icon-pack", setId: "material-os-icons" },
	{ label: "OpenCanopy Icon Packs", repo: "blackosx/OpenCanopyIconPacks", setId: "opencanopy-icons" },
	{ label: "JustVector Icons", repo: "seich/justvector-icons-font", setId: "justvector-icons" },
	{ label: "Likeastore Icons", repo: "likeastore/likeastore-icons-pack", setId: "likeastore-icons" },
	{ label: "Microsoft 365 Icons", repo: "xb2016/microsoft-365-icons-pack", setId: "microsoft-365-icons" },
	{ label: "Bili Icon Pack", repo: "dashuchufang/bili_icon_pack", setId: "bili-icons" },
	{ label: "Hyperliquid Coin SVGs", repo: "zengdard/hyperliquid-coin-svgs", setId: "hyperliquid-icons" },
	{ label: "HH Iconpack", repo: "hunterhoch/hh_iconpack", setId: "hh-icons" },
	{ label: "Android Action Bar Icons", repo: "turbo87/android-action-bar-icon-pack-font", setId: "android-action-bar-icons" },
	{ label: "Scratch Icon Pack", repo: "iamareebjamal/scratch_icon_pack_source", setId: "scratch-icons" },
	{ label: "Counter-Strike Icons", repo: "juknum/counter-strike-icons", setId: "counter-strike-icons" },
	{ label: "Flow Icons", repo: "benjaminhalko/flow-icons-zed", setId: "flow-icons" },
	{ label: "Compose Canvas Icon Pack", repo: "worstkiller/jetpackcompose_canvas_icon_pack", setId: "compose-canvas-icons" },
	{ label: "Climacons", repo: "ghys/org.openhab.ui.iconset.climacons", setId: "climacons" },
	{ label: "Get It On Badges", repo: "nyxiereal/get-it-on", setId: "get-it-on-badges" },
	{ label: "Lovelace Weather Icons", repo: "scinos/lovelace-weather-icons", setId: "lovelace-weather-icons" },
	{ label: "Astroicons", repo: "marcmarine/astroicons", setId: "astroicons" },
	{ label: "HA Energy Node Icons", repo: "developer-simon/ha-energy-node-icons", setId: "ha-energy-icons" },
	{ label: "Analogue Pocket Drive Icons", repo: "random11x/analogue-pocket-drive-icon-set", setId: "analogue-pocket-icons" },
	{ label: "Pixel Vault", repo: "fanquanpp/pixel-vault", setId: "pixel-vault" },
	{ label: "NSW Design System Icons", repo: "digitalnsw/nsw-design-system", setId: "nsw-icons" },
	{ label: "taurbalaur SVG Icons", repo: "taurbalaur/svg-icons", setId: "taurbalaur-icons" },
	{ label: "Slate Free SVG Icons", repo: "evanwork34/slate-free-svg-icons", setId: "slate-icons" },
	{ label: "Orangeclock Icons", repo: "easyuxd/orangeclock-icons", setId: "orangeclock-icons" },
	{ label: "Circum Icons", repo: "Klarr-Agency/Circum-Icons", setId: "circum", duplicateOf: "circum" },
	{ label: "CoreUI Icons", repo: "coreui/coreui-icons", setId: "coreui-icons", duplicateOf: "cil" },
	{ label: "Fontisto", repo: "kenangundogan/fontisto", setId: "fontisto", duplicateOf: "fontisto" },
	{ label: "Foundation Icons", repo: "zurb/foundation-icon-fonts", setId: "foundation", duplicateOf: "foundation" },
	{ label: "Humbleicons", repo: "zraly/humbleicons", setId: "humbleicons", duplicateOf: "humbleicons" },
	{ label: "Elusive Icons", repo: "reduxframework/elusive-iconfont", setId: "elusive-icons", duplicateOf: "el" },
	{ label: "Cuida Icons", repo: "Sysvale/cuida-icons", setId: "cuida", duplicateOf: "cuida" },
	{ label: "Font-GIS", repo: "viglino/font-gis", setId: "font-gis", duplicateOf: "gis" },
	{ label: "Gilbarbara SVG Logos", repo: "gilbarbara/logos", setId: "gilbarbara-logos", duplicateOf: "logos" },
	{ label: "PlantUML SVG Logos", repo: "dev-details/plantuml-svg-logos", setId: "plantuml-svg-logos", duplicateOf: "logos" },
	{ label: "Firefox OS Icons", repo: "fxos-components/fxos-icons", setId: "fxos-icons" },
	{ label: "Geomicons Open", repo: "jxnblk/geomicons-open", setId: "geomicons" },
	{ label: "GovIcons", repo: "540co/govicons", setId: "govicons" },
	{ label: "Metro UI Icons", repo: "olton/metroui", setId: "metro-ui-icons" },
	{ label: "ThemeIsle Icons", repo: "Codeinwp/themeisle-icons", setId: "themeisle-icons" },
	{
		label: "Olicons",
		repo: "owlling/olicons",
		setId: "olicons",
		include: /^svg\/olicons_v2\.0\.1\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^ol-(.+)-(o|f|so|sf)\.svg$/.exec(path.basename(rel));
			return m ? { name: m[1]!, style: OLICONS_STYLES[m[2]!]! } : null;
		},
	},
	{
		label: "Weather Underground Icons",
		repo: "manifestinteractive/weather-underground-icons",
		setId: "weather-underground-icons",
		include: /^dist\/icons\/(black|solid-black)\/svg\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^dist\/icons\/(black|solid-black)\/svg\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[2]!, style: m[1] === "black" ? "color" : "solid" } : null;
		},
	},
	{ label: "SJJB Map Icons", repo: "jalbertbowden/ssjb-map-icons", setId: "sjjb-map-icons" },
	{ label: "La Capitaine Icon Theme", repo: "keeferrourke/la-capitaine-icon-theme", setId: "la-capitaine-icons" },
	{ label: "Tango Icon Theme", repo: "stephenc/tango-icon-theme", setId: "tango-icons", include: /^scalable\/.+\.svg$/ },
	{ label: "Zocial", repo: "smcllns/css-social-buttons", setId: "zocial", include: /^src\/[^/]+\.svg$/ },
	{ label: "Kamon", repo: "nota/kamon", setId: "kamon" },
	{ label: "Geomicons Open", repo: "jxnblk/geomicons-open", setId: "geomicons-open", duplicateOf: "geomicons" },
	{ label: "Open Iconic", repo: "iconic/open-iconic", setId: "oi", duplicateOf: "oi" },
	{ label: "Micon", repo: "xtoolkit/Micon", setId: "micon", duplicateOf: "fluent-mdl2" },
	{
		label: "File Icon Vectors",
		repo: "dmhendricks/file-icon-vectors",
		setId: "file-icon-vectors",
		include: /^dist\/icons\/(classic|vivid|square-o|high-contrast)\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^dist\/icons\/([^/]+)\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[2]!, style: m[1]! } : null;
		},
	},
	{ label: "Nataicons", repo: "afnizarnur/nataicons", setId: "nataicons", include: /^icons\/24x24\/[^/]+\.svg$/ },
	{ label: "Icon Brew", repo: "elrumo/icon-brew", setId: "icon-brew", include: /^app\/assets\/icons\/24px\/[^/]+\.svg$/ },
	{ label: "Dripicons", repo: "amitjakhu/dripicons", setId: "dripicons", include: /^SVG\/[^/]+\.svg$/ },
	{ label: "Badgen Icons", repo: "badgen/badgen-icons", setId: "badgen-icons", include: /^icons\/[^/]+\.svg$/ },
	{ label: "Elementor Icons", repo: "elementor/elementor-icons", setId: "elementor-icons" },
	{ label: "IcoFont", repo: "LuanHimmlisch/icofont", setId: "icofont" },
	{ label: "JTB Icons", repo: "marmooo/jtb-icons", setId: "jtb-icons" },
	{
		label: "Instructure UI Icons",
		repo: "instructure/instructure-ui",
		setId: "instructure-icons",
		include: /^packages\/ui-icons\/svg\/(Line|Solid|Custom)\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^packages\/ui-icons\/svg\/(Line|Solid|Custom)\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[2]!, style: m[1] === "Line" ? "line" : m[1] === "Solid" ? "solid" : "custom" } : null;
		},
	},
	{
		label: "Vitamix (Decathlon)",
		repo: "Decathlon/vitamin-web",
		setId: "vitamix",
		include: /^packages\/sources\/icons\/src\/generated\/vitamix\/svg\/[^/]+\.svg$/,
	},
	{ label: "Orchid Icons", repo: "orchidsoftware/icons", setId: "orchid-icons", include: /^svg\/[^/]+\.svg$/ },
	{ label: "Sanity Icons", repo: "sanity-io/icons", setId: "sanity-icons", include: /^packages\/icons\/export\/[^/]+\.svg$/ },
	{ label: "Toe Icons", repo: "javisperez/toe-icons", setId: "toe-icons", include: /^packages\/icons\/assets\/icons\/[^/]+\.svg$/ },
	{ label: "Zero Icons", repo: "leungwensen/svg-icon", setId: "zero-icons", include: /^dist\/trimmed-svg\/zero\/[^/]+\.svg$/ },
	{
		label: "VectorLogoZone",
		repo: "vectorlogozone/vectorlogozone",
		setId: "vectorlogozone",
		include: /^src\/content\/logos\/[^/]+\/[^/]+-icon\.svg$/,
		classify: (rel) => {
			const m = /^src\/content\/logos\/([^/]+)\/[^/]+-icon\.svg$/.exec(rel);
			return m ? { name: m[1]!, style: "color" } : null;
		},
	},
	{ label: "Bank Logos", repo: "icongo/bank-logos", setId: "bank-logos", include: /^logos\/.+\.svg$/ },
	{ label: "Power BI Icons", repo: "microsoft/PowerBI-Icons", setId: "powerbi-icons", include: /^SVG\/[^/]+\.svg$/ },
	{
		label: "Pe-icon-7-stroke",
		repo: "olimsaidov/pixeden-stroke-7-icon",
		setId: "pe-7-stroke",
		include: /^pe-icon-7-stroke\/svg\/[^/]+\.svg$/,
	},
	{ label: "Small-n-flat", repo: "paomedia/small-n-flat", setId: "small-n-flat", include: /^svg\/[^/]+\.svg$/ },
	{
		label: "Raivo Issuer Icons",
		repo: "raivo-otp/issuer-icons",
		setId: "issuer-icons",
		include: /^vectors\/[^/]+\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^vectors\/[^/]+\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[1]!, style: "color" } : null;
		},
	},
	{ label: "Microns", repo: "stephenhutchings/microns", setId: "microns", include: /^svg\/[^/]+\.svg$/ },
	{ label: "SVG Loaders", repo: "SamHerbert/SVG-Loaders", setId: "svg-loaders", include: /^svg-loaders\/[^/]+\.svg$/ },
	{
		label: "Azure Icon Collection",
		repo: "benc-uk/icon-collection",
		setId: "azure-icon-collection",
		include: /^(azure-icons|azure-cds|other)\/.+\.svg$/,
	},
	{
		label: "Inkscape Open Symbols",
		repo: "PanderMusubi/inkscape-open-symbols",
		setId: "inkscape-open-symbols",
		// Sheets that copy Bootstrap, Font Awesome, Material, Octicons, and the
		// other families already in the catalog are left out.
		include:
			/^(CircuiTikZ|genericons|gnome|nautic-alphabets|stateFace|suru-icons|taiga)\/.+\.svg$/,
		classify: (rel) => {
			const top = rel.split("/")[0] ?? "";
			if (top === "nautic-alphabets") {
				return { name: "icon", style: rel.includes("outline") ? "nautic-outline" : "nautic" };
			}
			const style =
				top === "CircuiTikZ" ? "circuitikz" : top === "stateFace" ? "stateface" : top === "suru-icons" ? "suru" : top.toLowerCase();
			return { name: "icon", style };
		},
	},
	{ label: "KDE Breeze Icons", repo: "KDE/breeze-icons", setId: "breeze-icons", include: /^icons\/(?!.*\/cursors\/).+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Ubuntu Yaru", repo: "ubuntu/yaru", setId: "yaru-icons", include: /^icons\/(?!.*\/cursors\/).+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "GNOME Adwaita", repo: "GNOME/adwaita-icon-theme", setId: "adwaita-icons", include: /^(Adwaita|src)\/(?!.*\/cursors\/).+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Elementary OS Icons", repo: "elementary/icons", setId: "elementary-icons", include: /^(actions|apps|categories|devices|emblems|emotes|mimes|places|status)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Tela Icon Theme", repo: "vinceliuice/Tela-icon-theme", setId: "tela-icons", include: /^(src|links)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "WhiteSur Icon Theme", repo: "vinceliuice/WhiteSur-icon-theme", setId: "whitesur-icons", include: /^(src|links)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Fluent Icon Theme", repo: "vinceliuice/Fluent-icon-theme", setId: "fluent-icon-theme", include: /^(src|links)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Qogir Icon Theme", repo: "vinceliuice/Qogir-icon-theme", setId: "qogir-icons", include: /^(src|links)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Vimix Icon Theme", repo: "vinceliuice/vimix-icon-theme", setId: "vimix-icons", include: /^(src|links)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Kora Icon Theme", repo: "bikass/kora", setId: "kora-icons", include: /^kora(-pgrey)?\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Numix Circle", repo: "numixproject/numix-icon-theme-circle", setId: "numix-circle", include: /^Numix-Circle(-Light)?\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Flat Remix Icons", repo: "daniruiz/flat-remix", setId: "flat-remix-icons", include: /^Flat-Remix-[^/]+\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "We10X Icon Theme", repo: "yeyushengfan258/We10X-icon-theme", setId: "we10x-icons", include: /^(src|links)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "McMojave Circle", repo: "vinceliuice/McMojave-circle", setId: "mcmojave-icons", include: /^(src|links)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Deepin Icon Theme", repo: "linuxdeepin/deepin-icon-theme", setId: "deepin-icons", include: /^(bloom|bloom-dark|bloom-classic|bloom-classic-dark|bloom-fantacy|vintage|Sea)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Candy Icons", repo: "EliverLara/candy-icons", setId: "candy-icons", include: /^(apps|devices|mimetypes|places|preferences|status)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Suru Plus", repo: "Gusbemacbe/suru-plus", setId: "suru-plus-icons", include: /^(Suru\+\+|eSuru\+\+|Suru\+\+-Light)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Paper Icon Theme", repo: "snwh/paper-icon-theme", setId: "paper-icons", include: /^(Paper|src)\/(?!.*\/cursors\/).+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Arc Icon Theme", repo: "Horst3180/arc-icon-theme", setId: "arc-icons", include: /^src\/(?!.*\/cursors\/).+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Moka Icon Theme", repo: "moka-project/moka-icon-theme", setId: "moka-icons", include: /^(src|Moka)\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Faenza Icon Theme", repo: "shlinux/faenza-icon-theme", setId: "faenza-icons", include: /^Faenza\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "Solana Token List", repo: "solana-labs/token-list", setId: "solana-token-icons", include: /^assets\/.+\.svg$/ },
	{ label: "Cosmos Chain Registry", repo: "cosmos/chain-registry", setId: "cosmos-chain-icons", include: /^(?:_non-cosmos\/)?[^_/][^/]*\/.+\.svg$/ },
	{ label: "Bioicons", repo: "duerrsimon/bioicons", setId: "bioicons", include: /^static\/icons\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	{ label: "CNCF Artwork", repo: "cncf/artwork", setId: "cncf-artwork", include: /^(projects|other)\/.+\.svg$/ },
	{
		label: "Web Awesome Icons",
		repo: "shoelace-style/webawesome",
		setId: "webawesome-icons",
		include: /^packages\/webawesome\/docs\/assets\/icons\/(chunk|jelly|utility)\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /icons\/(chunk|jelly|utility)\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[2]!, style: m[1] === "chunk" ? "solid" : m[1]! } : null;
		},
	},
	{ label: "Josemi Icons", repo: "jmjuanes/icons", setId: "josemi-icons", include: /^icons\/[^ /]+\.svg$/ },
	{
		label: "Serendie Symbols",
		repo: "serendie/serendie-symbols",
		setId: "serendie-symbols",
		include: /^assets\/(filled|outlined)\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^assets\/(filled|outlined)\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[2]!, style: m[1]! } : null;
		},
	},
	{
		label: "Icomo",
		repo: "zainadeel/icomo",
		setId: "icomo",
		include: /^src\/(icons|map)\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^src\/(icons|map)\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[2]!, style: m[1] === "map" ? "map" : "solid" } : null;
		},
	},
	{ label: "City Icons", repo: "anto1/city-icons", setId: "city-icons", include: /^public\/icons\/[^/]+\.svg$/ },
	{
		label: "PUXL Icons",
		repo: "bolonio/react-puxl-icons",
		setId: "puxl-icons",
		include: /^resources\/icons\/icon_[^/]+\.svg$/,
		classify: (rel) => ({ name: path.basename(rel, ".svg").replace(/^icon_/, ""), style: "solid" }),
	},
	{
		label: "Databricks Architecture Icons",
		repo: "oieduardorabelo/databricks-architecture-icons",
		setId: "databricks-icons",
		include: /^icons\/svg(-mono|-outline|-tile)?\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^icons\/svg(?:-(mono|outline|tile))?\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[2]!, style: m[1] ?? "color" } : null;
		},
	},
	{ label: "Charmed Icons", repo: "littensy/charmed-icons", setId: "charmed-icons", include: /^icons\/[^/]+\.svg$/ },
	{ label: "Open Crop Icons", repo: "openfarmcc/open-crop-icons", setId: "open-crop-icons", include: /^icons\/([^/]+)\/\1\.svg$/ },
	{
		label: "Soaring Symbols",
		repo: "soaring-symbols/soaring-symbols",
		setId: "soaring-symbols",
		include: /^assets\/[^/]+\/(icon|icon-mono|logo|logo-mono|tail)\.svg$/,
		classify: (rel) => {
			const m = /^assets\/([^/]+)\/([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[1]!, style: m[2]! } : null;
		},
	},
	{
		label: "Frog Emojis",
		repo: "Riesi/frog_emojis",
		setId: "frog-emojis",
		include: /^svg\/(other\/)?[^/]+\.svg$/,
		classify: (rel) => ({ name: path.basename(rel, ".svg").replace(/^U[0-9a-f]+-/i, ""), style: "color" }),
	},
	{
		label: "Moda Operandi Icons",
		repo: "ModaOperandi/icons",
		setId: "moda-icons",
		include: /^src\/svg\/(?!Logo)[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^src\/svg\/(.+?)_(\d+)\.svg$/.exec(rel);
			return m ? { name: m[1]!, style: m[2]! } : { name: path.basename(rel, ".svg"), style: "24" };
		},
	},
	{ label: "Scholar Icons", repo: "louisfacun/scholar-icons", setId: "scholar-icons", include: /^svgs\/[^/]+\.svg$/ },
	{
		label: "Sparkle Icons",
		repo: "slaylines/sparkle-icons",
		setId: "sparkle-icons",
		include: /^public\/icons\/[^/]+\.svg$/,
		classify: (rel) => {
			const m = /^public\/icons\/(.+)-(black|colored|light)\.svg$/.exec(rel);
			return m ? { name: m[1]!, style: m[2]! } : null;
		},
	},
	{
		label: "Analog Gothic",
		repo: "hastefuI/analog-gothic",
		setId: "analog-gothic",
		include: /^icons\/ag-[^/]+\.svg$/,
		classify: (rel) => ({ name: path.basename(rel, ".svg").replace(/^ag-/, ""), style: "solid" }),
	},
	{ label: "Dev Hearts", repo: "lukeocodes/dev-hearts", setId: "dev-hearts", include: /^src\/(?!germany_heart)[^/]+\.svg$/ },
	{
		label: "Chess Art",
		repo: "maurimo/chess-art",
		setId: "chess-art",
		include: /^(celtic|fantasy|spatial)\/[bknpqr]\.svg$/,
		classify: (rel) => {
			const pieces: Record<string, string> = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
			const m = /^([a-z]+)\/([bknpqr])\.svg$/.exec(rel);
			return m ? { name: `${m[1]}-${pieces[m[2]!]}`, style: "solid" } : null;
		},
	},
	{ label: "Thermal Comfort Icons", repo: "rautesamtr/thermal_comfort_icons", setId: "thermal-comfort-icons", include: /^svg\/[^/]+\.svg$/ },
	{
		label: "Orange Accessibility Icons",
		repo: "Orange-OpenSource/Accessibility-icons",
		setId: "orange-accessibility-icons",
		include: /^Usage mode_[^/]+\.svg$/,
		classify: (rel) => ({ name: path.basename(rel, ".svg").replace(/^Usage mode_/, ""), style: "solid" }),
	},
	{
		label: "IntelliJ Platform Icons",
		repo: "JetBrains/intellij-community",
		setId: "intellij-icons",
		// Light-theme 1x files only: `_dark` and `@2x` are theme/density copies.
		include: /^(?!.*(?:testData|\/tests?\/))(?!.*(?:_dark|@2x)\.svg$).+\.svg$/,
		classify: (rel) => {
			const name = kebab(path.basename(rel, ".svg"));
			if (!name) return null;
			const area = rel.split("/").slice(0, 2).join("-").replace(/^platform-icons$/, "");
			return {
				name: area && !/^platform-/.test(area) ? `${kebab(rel.split("/")[1] ?? "")}-${name}` : name,
				style: /\/expui\//.test(rel) ? "new-ui" : "classic",
			};
		},
	},
	// Second wave: themes, office suites, design systems, and symbol sets verified for licence and overlap.
	themePack("Gruvbox Plus Icons", "SylEleuth/gruvbox-plus-icon-pack", "gruvbox-plus-icons"),
	themePack("Hatter Icons", "Mibea/Hatter", "hatter-icons"),
	themePack("Adwaita++ Icons", "Bonandry/adwaita-plus", "adwaita-plus-icons"),
	themePack("Nordzy Icons", "MolassesLover/Nordzy-icon", "nordzy-icons"),
	themePack("Yaru++ Icons", "Bonandry/yaru-plus", "yaru-plus-icons"),
	themePack("Suru++ Ubuntu", "Bonandry/suru-plus-ubuntu", "suru-plus-ubuntu-icons"),
	themePack("Obsidian Icons", "madmaxms/iconpack-obsidian", "obsidian-icons"),
	themePack("Lila HD Icons", "ilnanny75/Lila-HD-Icon-Theme-Official", "lila-hd-icons"),
	themePack("Neo Candy Icons", "erikdubois/neo-candy-icons", "neo-candy-icons"),
	themePack("Halo Icons", "erikdubois/halo-icons", "halo-icons"),
	themePack("Masalla Icons", "masalla-art/masalla-icon-theme", "masalla-icons"),
	themePack("Evolvere Icons", "franksouza183/Evolvere-Icons", "evolvere-icons"),
	themePack("Pixie Icons", "maxtron95/pixie-icon-theme", "pixie-icons"),
	themePack("Yosa Max Icons", "freywazza/Yosa-Max-Git", "yosa-max-icons"),
	themePack("Mkos Big Sur Icons", "zayronxio/Mkos-Big-Sur", "mkos-big-sur-icons"),
	themePack("MoreWaita Icons", "somepaulo/MoreWaita", "morewaita-icons"),
	themePack("elementary Xfce Icons", "shimmerproject/elementary-xfce", "elementary-xfce-icons"),
	themePack("Shadow Icons", "rudrab/Shadow", "shadow-icons"),
	themePack("Zorin Icons", "ZorinOS/zorin-icon-themes", "zorin-icons"),
	themePack("Clarity Icon Theme", "jcubic/Clarity", "clarity-icon-theme"),
	themePack("Pop Icons", "pop-os/icon-theme", "pop-icons"),
	themePack("Faba Icons", "snwh/faba-icon-theme", "faba-icons"),
	themePack("FlatWoken Icons", "alecive/FlatWoken", "flatwoken-icons"),
	themePack("COSMIC Icons", "pop-os/cosmic-icons", "cosmic-icons"),
	themePack("Tau Hydrogen Icons", "tau-OS/tau-hydrogen", "tau-hydrogen-icons"),
	themePack("Plane Icons", "wfpaisa/plane-icon-theme", "plane-icons"),
	themePack("Luv Icons", "Nitrux/luv-icon-theme", "luv-icons"),
	themePack("Sevi Icons", "TaylanTatli/Sevi", "sevi-icons"),
	themePack("Chicago95 Icons", "grassmunk/Chicago95", "chicago95-icons"),
	themePack("Vertex Icons", "horst3180/vertex-icons", "vertex-icons"),
	themePack("Mato Icons", "flipflop97/Mato", "mato-icons"),
	themePack("Pocillo Icons", "UbuntuBudgie/pocillo", "pocillo-icons"),
	themePack("elementaryPlus Icons", "Manuel-Kehl/elementaryPlus", "elementary-plus-icons"),
	themePack("Boston Icons", "thecheis/Boston-Icons", "boston-icons"),
	themePack("Argon Icons", "stuarthayhurst/argon-icon-theme", "argon-icons"),
	themePack("Pixora Icons", "tsora1603/pixora-icons", "pixora-icons"),
	themePack("Suru Icons", "snwh/suru-icon-theme", "suru-icons"),
	{ label: "LibreOffice Yaru", repo: "ubuntu/libreoffice-style-yaru-fullcolor", setId: "libreoffice-yaru-icons", include: /^src\/.+\.svg$/, dedupe: true, classify: desktopIcon },
	libreOfficeTheme("LibreOffice Colibre", "colibre", "libreoffice-colibre"),
	libreOfficeTheme("LibreOffice Karasa Jaga", "karasa_jaga", "libreoffice-karasa-jaga"),
	libreOfficeTheme("LibreOffice Sukapura", "sukapura", "libreoffice-sukapura"),
	libreOfficeTheme("LibreOffice Elementary", "elementary", "libreoffice-elementary"),
	libreOfficeTheme("LibreOffice Sifr", "sifr", "libreoffice-sifr"),
	libreOfficeTheme("LibreOffice Breeze", "breeze", "libreoffice-breeze"),
	{
		label: "Atom Material Icons",
		repo: "AtomMaterialUI/a-file-icon-idea",
		setId: "atom-material-icons",
		include: /^common\/src\/main\/resources\/(icons|glyphs|outline|files|actions|settings)\/.+\.svg$/,
	},
	{
		label: "Momentum Icons",
		repo: "momentum-design/momentum-design",
		setId: "momentum-icons",
		include: /^packages\/assets\/icons\/src\/(core|colored)\/[^/]+\.svg$/,
	},
	{ label: "FreeCAD Icons", repo: "FreeCAD/FreeCAD", setId: "freecad-icons", include: /^src\/(Gui\/Icons|Mod\/.+\/[Ii]cons)\/.+\.svg$/ },
	{
		label: "IBM Carbon Pictograms",
		repo: "carbon-design-system/carbon",
		setId: "carbon-pictograms",
		include: /^packages\/pictograms\/src\/svg\/.+\.svg$/,
	},
	{ label: "SAP Icons", repo: "SAP/theming-base-content", setId: "sap-icons", include: /^content\/Base\/icons\/baseTheme\/img\/[^/]+\.svg$/ },
	{
		label: "SAP Horizon Icons",
		repo: "SAP/theming-base-content",
		setId: "sap-horizon-icons",
		include: /^content\/Base\/icons\/sap_horizon\/img\/[^/]+\.svg$/,
	},
	{ label: "QGIS Icons", repo: "qgis/QGIS", setId: "qgis-icons", include: /^images\/(themes\/default|svg)\/.+\.svg$/ },
	{ label: "Red Hat Icons", repo: "RedHat-UX/red-hat-icons", setId: "red-hat-icons", include: /^src\/(ui|standard|social|microns)\/.+\.svg$/ },
	{
		label: "Godot Editor Icons",
		repo: "godotengine/godot",
		setId: "godot-icons",
		include: /^(editor\/icons|scene\/theme\/icons|modules\/[^/]+\/icons)\/[^/]+\.svg$/,
	},
	{
		label: "Krita Icons",
		repo: "KDE/krita",
		setId: "krita-icons",
		include: /^krita\/pics\/(?!.*(-dark|_dark|Breeze-dark)\/)(?!branding\/).+\.svg$/,
	},
	{
		label: "KiCad Icons",
		repo: "KiCad/kicad-source-mirror",
		setId: "kicad-icons",
		include: /^resources\/bitmaps_png\/sources\/(light\/)?(?!dark\/)[^/]+(\/[^/]+)?\.svg$/,
	},
	{
		label: "Spectrum 2 Icons",
		repo: "adobe/react-spectrum",
		setId: "spectrum2-icons",
		include: /^packages\/@react-spectrum\/s2\/(s2wf-icons|ui-icons)\/[^/]+\.svg$/,
	},
	{ label: "Aksel Icons", repo: "navikt/aksel", setId: "aksel-icons", include: /^@navikt\/aksel-icons\/icons\/[^/]+\.svg$/ },
	{ label: "Gestalt Icons", repo: "pinterest/gestalt", setId: "gestalt-icons", include: /^packages\/gestalt\/src\/icons\/(compact\/)?[^/]+\.svg$/ },
	{ label: "Auro Icons", repo: "AlaskaAirlines/Icons", setId: "auro-icons", include: /^src\/icons\/.+\.svg$/ },
	{ label: "Mulberry Symbols", repo: "mulberrysymbols/mulberry-symbols", setId: "mulberry-symbols", include: /^EN\/.+\.svg$/ },
	{ label: "OpenMoji Black", repo: "hfg-gmuend/openmoji", setId: "openmoji-black", include: /^black\/svg\/[^/]+\.svg$/ },
	{
		label: "Mapillary Traffic Signs",
		repo: "mapillary/mapillary_sprite_source",
		setId: "mapillary-signs",
		include: /^package_(signs|objects)\/.+\.svg$/,
	},
	{
		label: "OSM Carto Symbols",
		repo: "openstreetmap-carto/openstreetmap-carto",
		setId: "osm-carto-symbols",
		include: /^symbols\/(?!shields\/).+\.svg$/,
	},
	{
		label: "NPS Map Symbols",
		repo: "nationalparkservice/symbol-library",
		setId: "nps-symbols",
		include: /^src\/standalone\/[^/]+-black-(14|22|30)\.svg$/,
		classify: (rel) => {
			const m = /\/([^/]+)-black-(14|22|30)\.svg$/.exec(rel);
			return m ? { name: m[1]!, style: m[2]! } : null;
		},
	},
	{ label: "Symbols (VS Code)", repo: "miguelsolorio/vscode-symbols", setId: "vscode-symbols", include: /^src\/icons\/.+\.svg$/ },
	{ label: "Bearded Icons", repo: "BeardedBear/bearded-icons", setId: "bearded-icons", include: /^src\/shared\/.+\.svg$/ },
	{ label: "Great Icons", repo: "EmmanuelBeziat/vscode-great-icons", setId: "great-icons", include: /^icons\/[^/]+\.svg$/ },
	{
		label: "Material Product Icons",
		repo: "PKief/vscode-material-product-icons",
		setId: "material-product-icons",
		include: /^icons\/[^/]+\.svg$/,
		// Files are named by their font codepoint: uEA01-explore.svg.
		classify: (rel) => ({ name: path.basename(rel, ".svg").replace(/^u[0-9a-f]{4,5}-/i, ""), style: "solid" }),
	},
	{
		label: "Simple Icons (VS Code)",
		repo: "LaurentTreguier/vscode-simple-icons",
		setId: "vscode-simple-icons",
		include: /^source\/(minimalistic-icons|simple-icons)\/.+\.svg$/,
		classify: (rel) => {
			const m = /^source\/(minimalistic|simple)-icons\/(?:.+\/)?([^/]+)\.svg$/.exec(rel);
			return m ? { name: m[2]!, style: m[1]! } : null;
		},
	},
	themePack("Colloid Icon Theme", "vinceliuice/Colloid-icon-theme", "colloid-icons"),
	themePack("Emerald Icon Theme", "vinceliuice/emerald-icon-theme", "emerald-icons"),
	themePack("MacTahoe Icon Theme", "vinceliuice/MacTahoe-icon-theme", "mactahoe-icons"),
	themePack("Tela Circle", "vinceliuice/Tela-circle-icon-theme", "tela-circle-icons"),
	themePack("BigSur Icon Theme", "yeyushengfan258/BigSur-icon-theme", "bigsur-icons"),
	themePack("BigSur Elegant", "yeyushengfan258/BigSur-Elegant-icon-theme", "bigsur-elegant-icons"),
	themePack("Bubble Icon Theme", "yeyushengfan258/Bubble-icon-theme", "bubble-icons"),
	themePack("Citrus Icon Theme", "yeyushengfan258/Citrus-icon-theme", "citrus-icons"),
	themePack("Fantasy Icon Theme", "yeyushengfan258/Fantasy-icon-theme", "fantasy-icons"),
	themePack("Glory Icon Theme", "yeyushengfan258/Glory-icon-theme", "glory-icons"),
	themePack("Honor Icon Theme", "yeyushengfan258/Honor-icon-theme-", "honor-icons"),
	themePack("Inverse Icon Theme", "yeyushengfan258/Inverse-icon-theme", "inverse-icons"),
	themePack("Lyra Icon Theme", "yeyushengfan258/Lyra-icon-theme", "lyra-icons"),
	themePack("McMuse Icon Theme", "yeyushengfan258/McMuse-icon-theme", "mcmuse-icons"),
	themePack("Miya Icon Theme", "yeyushengfan258/Miya-icon-theme", "miya-icons"),
	themePack("Pole Icon Theme", "yeyushengfan258/Pole-icon-theme", "pole-icons"),
	themePack("Reversal Icon Theme", "yeyushengfan258/Reversal-icon-theme", "reversal-icons"),
	themePack("Win10Sur Icon Theme", "yeyushengfan258/Win10Sur-icon-theme", "win10sur-icons"),
	themePack("Win11 Icon Theme", "yeyushengfan258/Win11-icon-theme", "win11-icons"),
	themePack("Zafiro Icons", "zayronxio/Zafiro-icons", "zafiro-icons"),
	themePack("OS Catalina Icons", "zayronxio/Os-Catalina-icons", "os-catalina-icons"),
	themePack("UOS Icons", "zayronxio/Uos-fulldistro-icons", "uos-icons"),
	themePack("Oranchelo Icon Theme", "zayronxio/oranchelo-icon-theme", "oranchelo-icons"),
	themePack("Color Flow Icons", "zayronxio/Color.Flow.Icons", "color-flow-icons"),
	themePack("Ketsa Icon Theme", "zayronxio/ketsa-icon-theme", "ketsa-icons"),
	themePack("Komps Icon Theme", "zayronxio/komps-icon-theme", "komps-icons"),
	themePack("Elementary KDE Icons", "zayronxio/Elementary-KDE-Icons", "elementary-kde-icons"),
	themePack("Mint L Icons", "linuxmint/mint-l-icons", "mint-l-icons"),
	themePack("Mint X Icons", "linuxmint/mint-x-icons", "mint-x-icons"),
	themePack("Mint Y Icons", "linuxmint/mint-y-icons", "mint-y-icons"),
	themePack("Numix", "numixproject/numix-icon-theme", "numix-icons"),
	themePack("Numix Square", "numixproject/numix-icon-theme-square", "numix-square"),
	themePack("Papirus Icon Theme", "PapirusDevelopmentTeam/papirus-icon-theme", "papirus-icon-theme"),
	themePack("Oxygen Icons", "KDE/oxygen-icons", "oxygen-icons"),
	themePack("MATE Icon Theme", "mate-desktop/mate-icon-theme", "mate-icons"),
	themePack("Flatery", "cbrnix/Flatery", "flatery-icons"),
	themePack("Newaita", "cbrnix/Newaita", "newaita-icons"),
	themePack("Newaita Reborn", "cbrnix/Newaita-reborn", "newaita-reborn"),
	themePack("Breeze Chameleon", "L4ki/Breeze-Chameleon-Icons", "breeze-chameleon"),
	themePack("Breeze Noir", "L4ki/Breeze-Noir-Icons", "breeze-noir"),
	themePack("Spectrum Color Icons", "L4ki/Spectrum-Color-Icons", "spectrum-color-icons"),
	themePack("Breeze openSUSE", "L4ki/Breeze-openSUSE-Icons", "breeze-opensuse"),
	themePack("Breeze Blur", "L4ki/Breeze-Blur-Glassy-Icons", "breeze-blur"),
	themePack("Breeze Blue", "L4ki/Breeze-Blue-Icons", "breeze-blue"),
	themePack("Breeze Splendent", "L4ki/Breeze-Splendent-Icons", "breeze-splendent"),
	themePack("Breeze Shamrock", "L4ki/Breeze-Shamrock-Icons", "breeze-shamrock"),
	themePack("Breeze Phoenix", "L4ki/Breeze-Phoenix-Icons", "breeze-phoenix"),
	themePack("Deepin Icons 2022", "zayronxio/Deepin-icons-2022", "deepin-2022-icons"),
	themePack("Deepin Plus Icons", "zayronxio/deepin-plus-all-icon-theme", "deepin-plus-icons"),
	themePack("Mignon Icon Theme", "igorfmoraes/Mignon-icon-theme", "mignon-icons"),
	themePack("Breeze KDE Story", "L4ki/Breeze-KDE-Story-Icons", "breeze-kde-story"),
	themePack("Breeze Honey", "L4ki/Breeze-Honey-Icons", "breeze-honey"),
	themePack("Breeze Inspiration", "L4ki/Breeze-Inspiration-Icons", "breeze-inspiration"),
	themePack("Breeze Red Black", "L4ki/Breeze-Red-Black-Icons", "breeze-red-black"),
	themePack("Breeze Orange", "L4ki/Breeze-Orange-Icons", "breeze-orange"),
	themePack("Breeze Colorful", "L4ki/Breeze-Chameleon-Colorful-Icons", "breeze-colorful"),
	themePack("Breeze Amethyst", "L4ki/Breeze-Chameleon-Amethyst-Icons", "breeze-amethyst"),
	themePack("Breeze Amore", "L4ki/Breeze-Amore-Icons", "breeze-amore"),
	themePack("Breeze Magenta", "L4ki/Breeze-Magenta-Icons", "breeze-magenta"),
	themePack("Breeze Cadet Blue", "L4ki/Breeze-Cadet-Blue-Icons", "breeze-cadet"),
];

const NOISE =
	/(^|\/)(node_modules|dist|build|coverage|\.git|\.github|__tests__|__snapshots__|fixtures|vendor|pods)(\/|$)/i;
const DOC_NOISE =
	/(^|\/)(test|tests|docs|documentation|website|site|www|storybook|examples?|demo|demos|screenshots?|preview|previews|thumbnails?|mockups?)(\/|$)/i;
const STYLE_SEG =
	/^(outline|outlined|line|stroke|stroked|regular|thin|bold|light|dark|fill|filled|solid|duotone|two-tone|twotone|color|colored|colour|mono|monochrome|flat|logos|logo|rounded|sharp|broken|curved|bulk|\d{2})$/i;
const GENERIC_DIR =
	/^(svg|svgs|icons|icon|assets|src|images|img|glyphs|drawable|drawables|res|vector|vectors|static|public|media|packs?|sets?)$/i;
const GENERIC_FILE = /^(logo|icon|image|glyph|symbol|vector|artwork|default)$/i;

const LINE_STYLES = new Set([
	"outline",
	"sharp-outline",
	"outlined",
	"line",
	"stroke",
	"stroked",
	"thin",
	"linear",
	"symbolic",
]);
const SOLID_STYLES = new Set([
	"fill",
	"filled",
	"solid",
	"bold",
	"duotone",
	"two-tone",
	"twotone",
	"color",
	"colored",
	"colour",
	"logo",
	"logos",
	"flat",
	"bulk",
	"dark",
	"light",
	"mono",
	"monochrome",
]);

function kebab(input: string) {
	const out = input
		.replace(/\.svg$/i, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[_\s.]+/g, "-")
		.replace(/[^a-z0-9-]+/gi, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase();
	if (out) return out;
	let h = 0;
	for (const c of input) h = (Math.imul(h, 33) + c.charCodeAt(0)) >>> 0;
	return `icon-${h.toString(36)}`;
}

function sparsePattern(rel: string) {
	return `/${rel.replace(/([*?[\]])/g, "\\$1")}`;
}

async function run(cmd: string, args: string[], cwd?: string, timeout = 240_000) {
	const { stdout, stderr } = await execFileAsync(cmd, args, {
		cwd,
		timeout,
		maxBuffer: 128 * 1024 * 1024,
		env: {
			...process.env,
			GIT_TERMINAL_PROMPT: "0",
			GIT_LFS_SKIP_SMUDGE: "1",
		},
	});
	return { stdout: String(stdout), stderr: String(stderr) };
}

function spawnInput(cmd: string, args: string[], input: string, cwd: string, timeout = 600_000) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(cmd, args, {
			cwd,
			env: {
				...process.env,
				GIT_TERMINAL_PROMPT: "0",
				GIT_LFS_SKIP_SMUDGE: "1",
			},
		});
		let stderr = "";
		const timer = setTimeout(() => {
			child.kill("SIGKILL");
			reject(new Error(`${cmd} timed out`));
		}, timeout);
		child.stderr.on("data", (d) => {
			stderr += d.toString();
		});
		child.on("error", (err) => {
			clearTimeout(timer);
			reject(err);
		});
		child.on("close", (code) => {
			clearTimeout(timer);
			if (code === 0) resolve();
			else reject(new Error(stderr.trim() || `${cmd} exited ${code}`));
		});
		child.stdin.write(input);
		child.stdin.end();
	});
}

async function writeSvg(dir: string, name: string, svg: string, used: Set<string>) {
	if (!svg.includes("<svg") || svg.length > 2_000_000) return false;
	if (/[{}$]/.test(svg.replace(/<style\b[\s\S]*?<\/style>/gi, ""))) return false;
	if (!/<(path|polygon|circle|rect|ellipse|polyline|line|use|image|text|g|animate)\b/i.test(svg)) {
		return false;
	}
	let base = kebab(name);
	let file = `${base}.svg`;
	let n = 2;
	while (used.has(file)) {
		file = `${base}-${n}.svg`;
		n++;
	}
	used.add(file);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, file), svg.trim() + "\n", "utf8");
	return true;
}

function looksAnimated(svg: string) {
	return /<animate\b|<animateTransform\b|<animateMotion\b|@keyframes|animation\s*:/i.test(svg);
}

function groupFor(styleId: string, samples: string[]): "line" | "solid" {
	if (LINE_STYLES.has(styleId)) return "line";
	if (SOLID_STYLES.has(styleId)) return "solid";
	let line = 0;
	let solid = 0;
	for (const svg of samples.slice(0, 16)) {
		const stroked = /stroke\s*=/.test(svg) && /fill\s*=\s*["']none["']/.test(svg);
		if (stroked) line++;
		else solid++;
	}
	return line > solid ? "line" : "solid";
}

function styleLabel(id: string, only: boolean, group: "line" | "solid") {
	if (only) return group === "line" ? "All" : "Icons";
	if (id === "line") return "Line";
	if (id === "solid") return "Fill";
	return id
		.split("-")
		.map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
		.join(" ");
}

function collapseVariants(paths: string[]) {
	const filtered = paths.filter((p) => !/frame|fps/i.test(p.split("/")[0] ?? ""));
	const groups = new Map<string, string[]>();
	for (const p of filtered) {
		const top = p.split("/")[0] ?? "";
		const list = groups.get(top) ?? [];
		list.push(p);
		groups.set(top, list);
	}
	const big = [...groups.entries()].filter(([, list]) => list.length >= 40);
	if (big.length < 2) return filtered;
	big.sort((a, b) => b[1].length - a[1].length);
	const biggest = big[0]![1].length;
	const similar = big.filter(([, list]) => list.length >= biggest * 0.8);
	const variantish = similar.filter(([name]) =>
		/svg|static|style|^main$|^assets$|^source$/i.test(name),
	);
	if (variantish.length < 2) return filtered;
	const rank = (name: string) => {
		if (/^(svg|svgs|icons|glyphs|source|assets)$/i.test(name)) return 0;
		if (/static/i.test(name)) return 1;
		if (/^main$/i.test(name)) return 4;
		return 2;
	};
	variantish.sort((a, b) => rank(a[0]) - rank(b[0]) || b[1].length - a[1].length);
	const keep = variantish[0]![0];
	const drop = new Set(variantish.map(([name]) => name).filter((name) => name !== keep));
	return filtered.filter((p) => !drop.has(p.split("/")[0] ?? ""));
}

function selectSvgPaths(all: string[]) {
	const svg = all.filter(
		(p) => p.toLowerCase().endsWith(".svg") && !p.toLowerCase().endsWith(".min.svg"),
	);
	const quiet = svg.filter((p) => !NOISE.test(p) && !DOC_NOISE.test(p));
	let base = quiet.length >= 8 ? quiet : svg.filter((p) => !DOC_NOISE.test(p) && !/(^|\/)node_modules(\/|$)/.test(p));
	base = collapseVariants(base);
	const focused = base.filter((p) => {
		const parts = p.split("/");
		const file = parts.pop() ?? "";
		const inIconDir = parts.some((seg) =>
			/^(icons?|svgs?|glyphs?|stencils?|emoji|badges?|logos?|flags?|sprites?|brands?|coins?|tokens?)$/i.test(
				seg,
			),
		);
		const iconFile = /logo|icon|badge|flag|emoji|glyph/i.test(file);
		return inIconDir || iconFile;
	});
	// A handful of "icon" filenames must not hide the rest of the set.
	let chosen =
		focused.length >= 8 && focused.length >= base.length * 0.4 ? focused : base;
	const loose = chosen.filter((p) => !/(^|\/)fonts?\//i.test(p) && !/webfont/i.test(p));
	if (loose.length >= 8) chosen = loose;
	return { allSvg: svg, chosen };
}

function selectVectorPaths(all: string[]) {
	return all.filter(
		(p) =>
			p.toLowerCase().endsWith(".xml") &&
			!NOISE.test(p) &&
			!DOC_NOISE.test(p) &&
			/icon|drawable|vector|svg/i.test(p),
	);
}

function selectComponentPaths(all: string[]) {
	return all.filter(
		(p) =>
			/\.(tsx|jsx|vue|svelte|ts|js|mjs)$/i.test(p) &&
			!/\.(test|spec|d)\.(tsx|jsx|ts|js|mjs)$/i.test(p) &&
			!NOISE.test(p) &&
			!DOC_NOISE.test(p) &&
			p
				.split("/")
				.slice(0, -1)
				.some((seg) => /^(icons?|glyphs?|svgs?)$/i.test(seg)),
	);
}

function selectFontPaths(all: string[]) {
	const fonts = all.filter(
		(p) =>
			/\.(ttf|otf|woff)$/i.test(p) &&
			!NOISE.test(p) &&
			!/italic|oblique/i.test(p) &&
			/icon|font|glyph|awesome|symbol/i.test(p),
	);
	if (fonts.length <= 6) return fonts;
	const preferred = fonts.filter((p) =>
		/regular|solid|fill|outline|linear|line|bold|light|400|500|icons?/i.test(p),
	);
	return (preferred.length ? preferred : fonts).slice(0, 4);
}

function selectZipPaths(all: string[]) {
	return all.filter(
		(p) =>
			/\.(zip|vssx|vsdx)$/i.test(p) &&
			!NOISE.test(p) &&
			/icon|svg|stencil|glyph|symbol/i.test(p),
	);
}

function styleOf(rel: string) {
	const parts = rel.split("/").slice(0, -1);
	for (let i = parts.length - 1; i >= 0; i--) {
		const seg = parts[i]!;
		if (STYLE_SEG.test(seg)) return kebab(seg.replace(/px$/i, ""));
	}
	return "";
}

function iconName(rel: string, prefixParent: boolean) {
	const parts = rel.split("/");
	const file = parts.pop()!.replace(/\.svg$/i, "");
	const parents = parts.filter((p) => !GENERIC_DIR.test(p) && !STYLE_SEG.test(p));
	if (GENERIC_FILE.test(file)) {
		const tail = parents.slice(-2);
		return tail.join("-") || file;
	}
	if (prefixParent && parents.length) return `${parents[parents.length - 1]}-${file}`;
	return file;
}

function basenameCollides(rels: string[]) {
	const bases = rels.map((p) => path.basename(p).toLowerCase());
	return new Set(bases).size < bases.length * 0.9;
}

function dedupeIconPaths(paths: string[], symlinks?: Set<string>) {
	const groups = new Map<string, string[]>();
	for (const p of paths) {
		if (!p.toLowerCase().endsWith(".svg")) continue;
		const base = path.basename(p).toLowerCase();
		const symbolic = /\/symbolic\//i.test(p) || /-symbolic\.svg$/i.test(p);
		const generic = /^(logo|icon|image|token|asset|symbol)(-\d+)?\.svg$/.test(base);
		const key = generic
			? `${symbolic ? "s" : "c"}:${path.dirname(p).toLowerCase()}/${base}`
			: `${symbolic ? "s" : "c"}:${base}`;
		const list = groups.get(key) ?? [];
		list.push(p);
		groups.set(key, list);
	}
	const rank = (p: string) => {
		let score = 100;
		if (/\/scalable\//i.test(p)) score = 0;
		else if (/\/(22|22x22)(\/|$)/i.test(p)) score = 20;
		else if (/\/(24|24x24)(\/|$)/i.test(p)) score = 30;
		else if (/\/(32|32x32)(\/|$)/i.test(p)) score = 40;
		else if (/\/(48|48x48)(\/|$)/i.test(p)) score = 50;
		else if (/\/(16|16x16)(\/|$)/i.test(p)) score = 60;
		else if (/\/(64|96|128|256|512)(x\d+)?\//i.test(p)) score = 80;
		if (symlinks?.has(p)) score += 40;
		if (/(^|\/)src\//.test(p)) score -= 1;
		if (/(^|\/)links\//.test(p)) score += 3;
		if (/kora-pgrey\//.test(p) || /\/vintage\//.test(p) || /Suru\+\+-Light\//.test(p)) score += 2;
		if (/eSuru\+\+\//.test(p) || /\/(bloom-dark|bloom-classic|bloom-classic-dark|bloom-fantacy|Sea)\//.test(p)) {
			score += 1;
		}
		return score + p.length / 100000;
	};
	const out: string[] = [];
	for (const list of groups.values()) {
		list.sort((a, b) => rank(a) - rank(b));
		out.push(list[0]!);
	}
	return out;
}

function fragmentToSvg(raw: string, viewBox: string) {
	const match = raw.match(/<g\b[\s\S]*<\/g>/i);
	if (!match) return null;
	const body = cleanSvgMarkup(match[0]);
	if (!/<(?:path|circle|rect|ellipse|polygon|polyline|line)\b/i.test(body)) return null;
	if (/[{}$]/.test(body)) return null;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">${body}</svg>`;
}

async function listTree(dir: string) {
	const { stdout } = await run("git", ["ls-tree", "-r", "-z", "HEAD"], dir, 180_000);
	const out: string[] = [];
	const symlinks = new Set<string>();
	for (const rec of stdout.split("\0")) {
		if (!rec) continue;
		const tab = rec.indexOf("\t");
		if (tab === -1) continue;
		const meta = rec.slice(0, tab);
		if (meta.startsWith("160000") || meta.includes("commit")) continue;
		const rel = rec.slice(tab + 1);
		out.push(rel);
		if (meta.startsWith("120000")) symlinks.add(rel);
	}
	return { paths: out, symlinks };
}

async function expandSymlinkTargets(dest: string, rels: string[]) {
	const extra: string[] = [];
	for (const rel of rels) {
		try {
			const target = await fs.readlink(path.join(dest, rel));
			const resolved = path.normalize(path.join(path.dirname(rel), target));
			if (resolved.startsWith("..") || path.isAbsolute(resolved)) continue;
			extra.push(resolved);
		} catch {
			/* regular file */
		}
	}
	return extra;
}

async function checkout(dir: string, rels: string[]) {
	if (rels.length === 0) return;
	const patterns = rels.map(sparsePattern).join("\n") + "\n";
	await spawnInput("git", ["sparse-checkout", "set", "--no-cone", "--stdin"], patterns, dir);
}

async function cloneRepo(repo: string, dest: string) {
	await fs.rm(dest, { recursive: true, force: true });
	await run(
		"git",
		[
			"clone",
			"--depth",
			"1",
			"--filter=blob:none",
			"--sparse",
			`https://github.com/${repo}.git`,
			dest,
		],
		undefined,
		300_000,
	);
}

function vectorToSvg(xml: string) {
	if (!/<vector[\s>]/.test(xml)) return null;
	const vw = /android:viewportWidth="([\d.]+)"/.exec(xml)?.[1] ?? "24";
	const vh = /android:viewportHeight="([\d.]+)"/.exec(xml)?.[1] ?? "24";
	const paths = [...xml.matchAll(/<path\b([^>]*)\/?>/g)];
	if (paths.length === 0) return null;
	const body = paths
		.map((m) => {
			const tag = m[1] ?? "";
			const d = /android:pathData="([^"]+)"/.exec(tag)?.[1];
			if (!d) return "";
			const fill = /android:fillColor="([^"]+)"/.exec(tag)?.[1];
			const stroke = /android:strokeColor="([^"]+)"/.exec(tag)?.[1];
			const sw = /android:strokeWidth="([^"]+)"/.exec(tag)?.[1] ?? "1";
			const transparent = !fill || /0{6,8}$/.test(fill.replace("#", ""));
			if (stroke && transparent) {
				return `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`;
			}
			const colored =
				fill &&
				!/^#(?:ff)?(?:000000|ffffff)$/i.test(fill) &&
				!/@android:color\/(?:black|white)$/i.test(fill);
			const paint = colored ? fill : "currentColor";
			return `<path d="${d}" fill="${paint}"/>`;
		})
		.filter(Boolean)
		.join("");
	if (!body) return null;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}">${body}</svg>`;
}

function extractGlyphs(raw: string) {
	const fontFace = /<font-face\b([^>]*)\/?>/.exec(raw)?.[1] ?? "";
	const units = /units-per-em="([^"]+)"/.exec(fontFace)?.[1] ?? "1024";
	const ascent = /ascent="([^"]+)"/.exec(fontFace)?.[1] ?? "960";
	const out: { name: string; svg: string }[] = [];
	const glyphRe = /<glyph\b([^>]*?)(?:\/>|>[\s\S]*?<\/glyph>)/g;
	let match: RegExpExecArray | null;
	while ((match = glyphRe.exec(raw))) {
		const attrs = match[1] ?? "";
		const name = /glyph-name="([^"]+)"/.exec(attrs)?.[1];
		const d = /(?:^|\s)d="([^"]+)"/.exec(attrs)?.[1];
		if (!name || !d || name.startsWith(".")) continue;
		out.push({
			name,
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${units} ${units}" fill="currentColor"><g transform="translate(0 ${ascent}) scale(1 -1)"><path d="${d}"/></g></svg>`,
		});
	}
	return out;
}

function splitSymbols(raw: string) {
	const symbols = [...raw.matchAll(/<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/gi)];
	if (symbols.length < 4) return null;
	const fallback = /viewBox="([^"]+)"/.exec(raw)?.[1] ?? "0 0 24 24";
	return symbols.map((m) => {
		const id = /id="([^"]+)"/.exec(m[1] ?? "")?.[1] ?? "icon";
		const vb = /viewBox="([^"]+)"/.exec(m[1] ?? "")?.[1] ?? fallback;
		return {
			name: id,
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${m[2]}</svg>`,
		};
	});
}

function stripJsxSpreads(svg: string) {
	return svg.replace(/\{\s*\.\.\.(?:[^{}]|\{[^{}]*\})*\}/g, "");
}

function cleanSvgMarkup(svg: string) {
	return stripJsxSpreads(svg)
		.replace(/<\/?(?:motion|m)\./g, (tag) => tag.replace(/(?:motion|m)\./, ""))
		.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
		.replace(/\s[\w:-]+=\{\{[\s\S]*?\}\}/g, "")
		.replace(/\{[^{}]*\}/g, "")
		.replace(/\s[\w:-]+=(?=[\s/>])/g, "")
		.replace(/\bref=\{[^}]+\}/g, "")
		.replace(/\bclassName=\{[^}]+\}/g, "")
		.replace(/\bclassName="[^"]*"/g, "")
		.replace(/=\{(?:color|fill|stroke)\}/g, '="currentColor"')
		.replace(/=\{size\}/g, '="24"')
		.replace(/\{(?:color|fill|stroke)\}/g, "currentColor")
		.replace(/\s[\w:-]+=\{[^}]+\}/g, "")
		.replace(/\bstrokeWidth=/g, "stroke-width=")
		.replace(/\bstrokeLinecap=/g, "stroke-linecap=")
		.replace(/\bstrokeLinejoin=/g, "stroke-linejoin=")
		.replace(/\bfillRule=/g, "fill-rule=")
		.replace(/\bclipRule=/g, "clip-rule=");
}

function extractShapeIcons(raw: string): { name?: string; svg: string }[] {
	const chunks = [
		...raw.matchAll(
			/export function (\w+)\s*\([\s\S]*?<BaseIcon\b[^>]*>([\s\S]*?)<\/BaseIcon>/g,
		),
	];
	const out: { name?: string; svg: string }[] = [];
	for (const match of chunks) {
		const body = (match[2] ?? "").replace(/\{\s*\.\.\.[^}]+\}/g, "");
		const shapes = body.match(/<(?:path|rect|circle|ellipse|line|polyline|polygon)\b[^>]*\/?>/g);
		if (!shapes?.length) continue;
		out.push({
			name: match[1],
			svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${shapes.join("")}</svg>`,
		});
	}
	return out;
}

function extractEmbeddedSvgs(raw: string): { name?: string; svg: string }[] {
	raw = raw.replace(/<\/?(?:motion|m)\./g, (tag) => tag.replace(/(?:motion|m)\./, ""));
	const named = [
		...raw.matchAll(
			/(?:\[\s*["']([^"']+)["']\s*\]|(?:export\s+const\s+)?([A-Za-z0-9_-]+))\s*[:=]\s*`?\s*(<svg\b[\s\S]*?<\/svg>)/g,
		),
	];
	if (named.length >= 3) {
		return named.map((m) => ({
			name: m[1] || m[2],
			svg: cleanSvgMarkup(m[3] ?? ""),
		}));
	}
	return [...raw.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)].map((m) => ({
		svg: cleanSvgMarkup(m[0]),
	}));
}

type NamedSvg = { name: string; svg: string; style: string };

async function readNamedFile(abs: string, rel: string, prefixParent: boolean): Promise<NamedSvg[]> {
	let raw: string;
	try {
		raw = await fs.readFile(abs, "utf8");
	} catch {
		return [];
	}
	if (raw.startsWith("version https://git-lfs.github.com/spec/v1")) return [];
	const style = styleOf(rel);
	if (raw.includes("<glyph") && raw.includes("glyph-name")) {
		const glyphs = extractGlyphs(raw);
		if (glyphs.length >= 4) {
			return glyphs.map((g) => ({ name: g.name, svg: g.svg, style }));
		}
	}
	const symbols = splitSymbols(raw);
	if (symbols) return symbols.map((s) => ({ name: s.name, svg: s.svg, style }));
	if (!raw.includes("<svg")) return [];
	return [{ name: iconName(rel, prefixParent), svg: raw, style }];
}

async function importLoose(
	root: string,
	rels: string[],
	reader: (abs: string, rel: string, prefix: boolean) => Promise<NamedSvg[]>,
) {
	const prefix = basenameCollides(rels);
	const named: NamedSvg[] = [];
	for (const rel of rels) {
		named.push(...(await reader(path.join(root, rel), rel, prefix)));
	}
	return named;
}

let fontToolsReady: boolean | null = null;

async function ensureFontTools() {
	if (fontToolsReady != null) return fontToolsReady;
	try {
		await run("python3", ["-c", "import fontTools"]);
		fontToolsReady = true;
	} catch {
		try {
			await run("python3", ["-m", "pip", "install", "--user", "fonttools"], undefined, 180_000);
			fontToolsReady = true;
		} catch {
			fontToolsReady = false;
		}
	}
	return fontToolsReady;
}

async function fontToSvgs(file: string): Promise<NamedSvg[]> {
	if (!(await ensureFontTools())) return [];
	const py = `
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
font = TTFont(sys.argv[1])
gs = font.getGlyphSet()
upem = font["head"].unitsPerEm
ascent = font["hhea"].ascent
out = []
for name in font.getGlyphOrder():
    if name.startswith("."):
        continue
    pen = SVGPathPen(gs)
    tpen = TransformPen(pen, (1, 0, 0, -1, 0, ascent))
    gs[name].draw(tpen)
    d = pen.getCommands()
    if not d or not d.strip():
        continue
    d = d.replace("&", "&amp;").replace('"', "&quot;")
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {upem} {upem}" fill="currentColor"><path d="{d}"/></svg>'
    out.append({"name": name, "svg": svg})
print(json.dumps(out))
`;
	const script = path.join(TMP, "font2svg.py");
	await fs.writeFile(script, py, "utf8");
	try {
		const { stdout } = await run("python3", [script, file], undefined, 180_000);
		const rows = JSON.parse(stdout) as { name: string; svg: string }[];
		const style = styleOf(file) || kebab(path.basename(file).replace(/\.(ttf|otf|woff)$/i, ""));
		return rows.map((r) => ({ name: r.name, svg: r.svg, style: STYLE_SEG.test(style) ? style : "solid" }));
	} catch {
		return [];
	}
}

async function zipToSvgs(file: string): Promise<NamedSvg[]> {
	const buf = await fs.readFile(file);
	let zip: JSZip;
	try {
		zip = await JSZip.loadAsync(buf);
	} catch {
		return [];
	}
	const rels: string[] = [];
	const texts = new Map<string, string>();
	for (const [name, entry] of Object.entries(zip.files)) {
		if (entry.dir || !name.toLowerCase().endsWith(".svg")) continue;
		if (NOISE.test(name) || DOC_NOISE.test(name)) continue;
		const text = await entry.async("string");
		rels.push(name);
		texts.set(name, text);
	}
	if (rels.length === 0) return [];
	const prefix = basenameCollides(rels);
	const out: NamedSvg[] = [];
	for (const rel of rels) {
		const raw = texts.get(rel) ?? "";
		const style = styleOf(rel);
		const symbols = splitSymbols(raw);
		if (symbols) {
			out.push(...symbols.map((s) => ({ name: s.name, svg: s.svg, style })));
			continue;
		}
		if (!raw.includes("<svg")) continue;
		out.push({ name: iconName(rel, prefix), svg: raw, style });
	}
	return out;
}

async function materialize(setId: string, items: NamedSvg[]) {
	const buckets = new Map<string, NamedSvg[]>();
	const styled = items.filter((i) => i.style);
	const styles = new Set(styled.map((i) => i.style));
	const split = styles.size >= 2 && styled.length >= items.length * 0.7;
	for (const item of items) {
		const key = split ? item.style || "other" : "";
		const list = buckets.get(key) ?? [];
		list.push(item);
		buckets.set(key, list);
	}
	if (buckets.size === 1 && buckets.has("")) {
		const only = buckets.get("")!;
		const sample = only.slice(0, 16).map((i) => i.svg);
		const group = groupFor("icons", sample);
		const id = group === "line" ? "line" : "solid";
		buckets.set(id, only);
		buckets.delete("");
	}
	const destRoot = path.join(ICONS_ROOT, setId);
	await fs.rm(destRoot, { recursive: true, force: true });
	const stylesOut: StyleOut[] = [];
	let animatedHits = 0;
	let sampled = 0;
	for (const [id, list] of buckets) {
		const styleId = id || "solid";
		const used = new Set<string>();
		const dir = path.join(destRoot, styleId);
		let count = 0;
		const samples: string[] = [];
		for (const item of list) {
			const ok = await writeSvg(dir, item.name, item.svg, used);
			if (!ok) continue;
			count++;
			if (samples.length < 16) samples.push(item.svg);
			if (sampled < 24) {
				sampled++;
				if (looksAnimated(item.svg)) animatedHits++;
			}
		}
		if (count === 0) continue;
		const group = groupFor(styleId, samples);
		stylesOut.push({
			id: styleId,
			label: styleLabel(styleId, buckets.size === 1, group),
			group,
			count,
		});
	}
	stylesOut.sort((a, b) => a.id.localeCompare(b.id));
	const count = stylesOut.reduce((n, s) => n + s.count, 0);
	return {
		count,
		styles: stylesOut,
		animated: sampled > 0 && animatedHits / sampled >= 0.25,
	};
}

async function importPack(pack: Pack): Promise<ReportEntry> {
	const dest = path.join(TMP, pack.setId);
	await cloneRepo(pack.repo, dest);
	const listed = await listTree(dest);
	const tree = listed.paths;
	const selected = selectSvgPaths(tree);
	const allSvg = selected.allSvg;
	const include = pack.include;
	let chosen = include ? tree.filter((p) => include.test(p)) : selected.chosen;
	if (pack.dedupe) chosen = dedupeIconPaths(chosen, listed.symlinks);
	let items: NamedSvg[] = [];
	let note: string | undefined;

	if (chosen.length >= 1) {
		await checkout(dest, chosen);
		if (pack.dedupe) {
			const extras = await expandSymlinkTargets(dest, chosen);
			if (extras.length) await checkout(dest, [...chosen, ...extras]);
		}
		const classify = pack.classify;
		const reader = classify
			? async (abs: string, rel: string, prefix: boolean) => {
					const target = classify(rel);
					if (!target) return [];
					const read = await readNamedFile(abs, rel, prefix);
					return read.map((item) => ({
						...item,
						style: target.style || item.style,
						...(read.length === 1 ? { name: target.name } : {}),
					}));
				}
			: readNamedFile;
		items = await importLoose(dest, chosen, reader);
	}

	if (pack.componentInclude) {
		const components = tree.filter((p) => pack.componentInclude!.test(p));
		if (components.length) {
			await checkout(dest, components);
			const viewBox = pack.fragmentViewBox ?? "0 0 24 24";
			const named: NamedSvg[] = [];
			for (const rel of components) {
				const raw = await fs.readFile(path.join(dest, rel), "utf8").catch(() => "");
				const svg = fragmentToSvg(raw, viewBox);
				if (!svg) continue;
				const parts = rel.split("/");
				const file = parts.pop()!.replace(/\.(tsx|jsx)$/i, "");
				if (/^(index|colors)$/i.test(file)) continue;
				const parents = parts.filter((p) => !/^(src|avatar)$/i.test(p));
				named.push({ name: [...parents, file].join("-"), svg, style: "pieces" });
			}
			if (named.length > items.length) items = named;
		}
	}

	if (items.length < 3) {
		const vectors = selectVectorPaths(tree);
		if (vectors.length >= 3) {
			await checkout(dest, vectors);
			const prefix = basenameCollides(vectors);
			const named: NamedSvg[] = [];
			for (const rel of vectors) {
				let raw = "";
				try {
					raw = await fs.readFile(path.join(dest, rel), "utf8");
				} catch {
					continue;
				}
				const svg = vectorToSvg(raw);
				if (!svg) continue;
				named.push({ name: iconName(rel, prefix), svg, style: styleOf(rel) });
			}
			if (named.length > items.length) items = named;
		}
	}

	if (items.length < 50) {
		const components = selectComponentPaths(tree);
		if (components.length > items.length) {
			await checkout(dest, components.slice(0, 8000));
			const named: NamedSvg[] = [];
			for (const rel of components) {
				let raw = "";
				try {
					const st = await fs.stat(path.join(dest, rel));
					if (st.size > 40_000_000) continue;
					raw = await fs.readFile(path.join(dest, rel), "utf8");
				} catch {
					continue;
				}
				const extracted = extractEmbeddedSvgs(raw);
				if (extracted.length === 0) extracted.push(...extractShapeIcons(raw));
				const base = path.basename(rel).replace(/\.(tsx|jsx|vue|svelte|ts|js|mjs)$/i, "");
				extracted.forEach((item, i) => {
					named.push({
						name: item.name ?? (extracted.length === 1 ? base : `${base}-${i + 1}`),
						svg: item.svg,
						style: styleOf(rel),
					});
				});
			}
			if (named.length > items.length) items = named;
		}
	}

	if (items.length < 3) {
		const fonts = selectFontPaths(tree);
		const fontSvgs = allSvg.filter((p) => /(^|\/)fonts?\//i.test(p) || /webfont/i.test(p));
		const toFetch = [...new Set([...fontSvgs, ...fonts])];
		if (toFetch.length) {
			await checkout(dest, toFetch);
			const named: NamedSvg[] = [];
			for (const rel of fontSvgs) {
				const raw = await fs.readFile(path.join(dest, rel), "utf8").catch(() => "");
				for (const g of extractGlyphs(raw)) {
					named.push({ name: g.name, svg: g.svg, style: styleOf(rel) || "solid" });
				}
			}
			if (named.length < 3) {
				for (const rel of fonts) {
					named.push(...(await fontToSvgs(path.join(dest, rel))));
				}
			}
			if (named.length > items.length) items = named;
		}
	}

	if (items.length < 3) {
		const zips = selectZipPaths(tree).slice(0, 40);
		if (zips.length) {
			await checkout(dest, zips);
			const named: NamedSvg[] = [];
			for (const rel of zips) {
				named.push(...(await zipToSvgs(path.join(dest, rel))));
			}
			if (named.length > items.length) {
				items = named;
				note = `from ${zips.length} archive(s)`;
			}
		}
	}

	await fs.rm(dest, { recursive: true, force: true });

	if (items.length < 1) {
		const top = new Map<string, number>();
		for (const p of allSvg) {
			const dir = p.split("/").slice(0, 2).join("/") || ".";
			top.set(dir, (top.get(dir) ?? 0) + 1);
		}
		const hint = [...top.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([d, n]) => `${d} (${n})`)
			.join(", ");
		return {
			label: pack.label,
			repo: pack.repo,
			setId: pack.setId,
			status: "empty",
			count: 0,
			note: hint ? `no usable icons; svg dirs: ${hint}` : "no svg, vector, font, or component icons",
		};
	}

	const packed = await materialize(pack.setId, items);
	if (packed.count < 1) {
		return {
			label: pack.label,
			repo: pack.repo,
			setId: pack.setId,
			status: "empty",
			count: 0,
			note: "files found but none were valid SVG icons",
		};
	}
	return {
		label: pack.label,
		repo: pack.repo,
		setId: pack.setId,
		status: "ok",
		count: packed.count,
		styles: packed.styles,
		animated: packed.animated,
		note,
	};
}

async function loadReport(): Promise<Record<string, ReportEntry>> {
	try {
		return JSON.parse(await fs.readFile(REPORT, "utf8")) as Record<string, ReportEntry>;
	} catch {
		return {};
	}
}

let reportChain: Promise<void> = Promise.resolve();

function saveReport(report: Record<string, ReportEntry>) {
	const snapshot = JSON.stringify(report, null, 2);
	reportChain = reportChain.then(() => fs.writeFile(REPORT, snapshot, "utf8"));
	return reportChain;
}

function renderSet(entry: ReportEntry) {
	const styles = (entry.styles ?? [])
		.map(
			(s) =>
				`\t\t\t{ id: "${s.id}", label: "${s.label}", group: "${s.group}", roots: ["${s.id}"] },`,
		)
		.join("\n");
	return `\t{
\t\tid: "${entry.setId}",
\t\tlabel: "${entry.label.replace(/"/g, '\\"')}",
\t\thomepage: "https://github.com/${entry.repo}",
\t\tstyles: [
${styles}
\t\t],
\t},`;
}

async function register(report: Record<string, ReportEntry>) {
	// `--only` must not rewrite families already registered in the file.
	if (process.argv.includes("--only")) {
		let src = await fs.readFile(ICON_SETS_FILE, "utf8");
		const end = src.indexOf("\t// P0_FAMILIES_END");
		if (end === -1) throw new Error("icon-sets.ts: P0_FAMILIES_END not found");
		const fresh = PACKS.map((p) => report[p.setId]).filter(
			(e): e is ReportEntry =>
				!!e &&
				e.status === "ok" &&
				(e.styles?.length ?? 0) > 0 &&
				!src.includes(`id: "${e.setId}"`),
		);
		if (fresh.length) {
			src = `${src.slice(0, end)}${fresh.map(renderSet).join("\n")}\n${src.slice(end)}`;
			await fs.writeFile(ICON_SETS_FILE, src, "utf8");
		}
		const animatedIds = fresh.filter((e) => e.animated).map((e) => e.setId);
		if (animatedIds.length) {
			let anim = await fs.readFile(ANIMATED_FILE, "utf8");
			for (const id of animatedIds) {
				if (anim.includes(`"${id}"`)) continue;
				anim = anim.replace(
					/export const ANIMATED_SET_IDS = new Set\(\[/,
					`export const ANIMATED_SET_IDS = new Set([\n\t"${id}",`,
				);
			}
			await fs.writeFile(ANIMATED_FILE, anim, "utf8");
		}
		return;
	}
	const ok = PACKS.map((p) => report[p.setId]).filter(
		(e): e is ReportEntry => !!e && e.status === "ok" && (e.styles?.length ?? 0) > 0,
	);
	const block = ["\t// P0_FAMILIES_START", ...ok.map(renderSet), "\t// P0_FAMILIES_END"].join("\n");
	let src = await fs.readFile(ICON_SETS_FILE, "utf8");
	if (src.includes("// P0_FAMILIES_START")) {
		src = src.replace(/\t\/\/ P0_FAMILIES_START[\s\S]*?\t\/\/ P0_FAMILIES_END/, block);
	} else {
		const marker = "\nexport function getIconSet";
		const idx = src.indexOf(marker);
		if (idx === -1) throw new Error("icon-sets.ts: getIconSet not found");
		const close = src.lastIndexOf("];", idx);
		if (close === -1) throw new Error("icon-sets.ts: array close not found");
		src = `${src.slice(0, close)}${block}\n${src.slice(close)}`;
	}
	await fs.writeFile(ICON_SETS_FILE, src, "utf8");

	const animatedIds = ok.filter((e) => e.animated).map((e) => e.setId);
	if (animatedIds.length) {
		let anim = await fs.readFile(ANIMATED_FILE, "utf8");
		for (const id of animatedIds) {
			if (anim.includes(`"${id}"`)) continue;
			anim = anim.replace(
				/export const ANIMATED_SET_IDS = new Set\(\[/,
				`export const ANIMATED_SET_IDS = new Set([\n\t"${id}",`,
			);
		}
		await fs.writeFile(ANIMATED_FILE, anim, "utf8");
	}
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
	let cursor = 0;
	await Promise.all(
		Array.from({ length: Math.min(n, items.length) }, async () => {
			while (cursor < items.length) {
				const item = items[cursor++]!;
				await fn(item);
			}
		}),
	);
}

async function main() {
	const force = process.argv.includes("--force");
	const onlyIdx = process.argv.indexOf("--only");
	const only =
		onlyIdx === -1
			? null
			: new Set(
					(process.argv[onlyIdx + 1] ?? "")
						.split(",")
						.map((s) => s.trim().toLowerCase())
						.filter(Boolean),
				);
	await fs.mkdir(TMP, { recursive: true });
	const report = await loadReport();
	const todo = PACKS.filter((p) => {
		if (only && !only.has(p.setId) && !only.has(p.repo.toLowerCase())) return false;
		return true;
	});

	await pool(todo, CONCURRENCY, async (pack) => {
		if (pack.duplicateOf) {
			report[pack.setId] = {
				label: pack.label,
				repo: pack.repo,
				setId: pack.setId,
				status: "duplicate",
				duplicateOf: pack.duplicateOf,
				count: 0,
				note: `already vendored as ${pack.duplicateOf}`,
			};
			console.log(`= ${pack.label} duplicate of ${pack.duplicateOf}`);
			await saveReport(report);
			return;
		}
		if (!force && report[pack.setId]?.status === "ok") {
			console.log(`• ${pack.label} already imported (${report[pack.setId]!.count})`);
			return;
		}
		console.log(`→ ${pack.label}`);
		try {
			const entry = await importPack(pack);
			report[pack.setId] = entry;
			if (entry.status === "ok") {
				console.log(`  ${entry.count.toLocaleString()} icons${entry.note ? ` (${entry.note})` : ""}`);
			} else {
				console.log(`  empty — ${entry.note ?? ""}`);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message.split("\n")[0] : String(err);
			report[pack.setId] = {
				label: pack.label,
				repo: pack.repo,
				setId: pack.setId,
				status: "error",
				count: 0,
				note: message.slice(0, 400),
			};
			console.log(`  error — ${message.slice(0, 240)}`);
		}
		await saveReport(report);
	});

	await register(report);

	const ok = Object.values(report).filter((e) => e.status === "ok");
	const added = ok.reduce((n, e) => n + e.count, 0);
	console.log(
		`Done. ${ok.length} families, ${added.toLocaleString()} icons. Duplicates skipped: ${
			Object.values(report).filter((e) => e.status === "duplicate").length
		}. Empty: ${Object.values(report).filter((e) => e.status === "empty").length}. Errors: ${
			Object.values(report).filter((e) => e.status === "error").length
		}.`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
