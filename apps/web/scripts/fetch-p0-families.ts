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
};

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
	{ label: "3dicons", repo: "realvjy/3dicons", setId: "3dicons" },
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
	{ label: "Discord Badge Vault", repo: "dakshitgamerz-lgtm/discord-badge-vault", setId: "discord-badges" },
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
	{ label: "Quill Icons", repo: "deriv-com/quill-icons-park", setId: "quill-icons" },
	{ label: "Hyperliquid Coin SVGs", repo: "zengdard/hyperliquid-coin-svgs", setId: "hyperliquid-icons" },
	{ label: "HH Iconpack", repo: "hunterhoch/hh_iconpack", setId: "hh-icons" },
	{ label: "MorphNext", repo: "kicknext/morphnext", setId: "morphnext" },
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
	{ label: "HA Akentner Icons", repo: "akentner/hass-akentner-icons", setId: "ha-akentner-icons" },
	{ label: "Orangeclock Icons", repo: "easyuxd/orangeclock-icons", setId: "orangeclock-icons" },
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
	"outlined",
	"line",
	"stroke",
	"stroked",
	"thin",
	"linear",
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
	if (/[{}$]/.test(svg)) return false;
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

async function listTree(dir: string) {
	const { stdout } = await run("git", ["ls-tree", "-r", "-z", "HEAD"], dir, 180_000);
	const out: string[] = [];
	for (const rec of stdout.split("\0")) {
		if (!rec) continue;
		const tab = rec.indexOf("\t");
		if (tab === -1) continue;
		const meta = rec.slice(0, tab);
		if (meta.startsWith("160000") || meta.includes("commit")) continue;
		out.push(rec.slice(tab + 1));
	}
	return out;
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
	const tree = await listTree(dest);
	const { allSvg, chosen } = selectSvgPaths(tree);
	let items: NamedSvg[] = [];
	let note: string | undefined;

	if (chosen.length >= 1) {
		await checkout(dest, chosen);
		items = await importLoose(dest, chosen, readNamedFile);
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
