/**
 * Import the ~300k open-source SVG families from the 2026-10-08 gap research
 * (rounds 1 + 2). Reads scripts/data/aria-300k/manifest.json and the per-family
 * path lists under scripts/data/aria-300k/paths/.
 *
 * Same loose-SVG → pack:icons → icon-sets.ts flow as fetch:gap / fetch:p0.
 *
 *   bun run fetch:300k
 *   bun run fetch:300k -- --only lazycons-pro,ui-primitives
 *   bun run fetch:300k -- --force
 *   bun run fetch:300k -- --limit 5
 *   bun run fetch:300k -- --pack   # pack each family as it finishes (recommended)
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const execFileAsync = promisify(execFile);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(SCRIPT_DIR, "data/aria-300k");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");
const PATHS_DIR = path.join(DATA_DIR, "paths");
const ICONS_ROOT = path.join(process.cwd(), "icons");
const TMP = path.join(os.tmpdir(), "aria-300k-icons");
const REPORT = path.join(DATA_DIR, "import-report.json");
const ICON_SETS_FILE = path.join(process.cwd(), "src/lib/icon-sets.ts");
const CONCURRENCY = Math.max(1, Number(process.env.ARIA_300K_CONCURRENCY ?? 3));
const USER_AGENT = "AriaIconsImporter/1.0 (+https://icons.leularia.com; open-source icon catalogue)";

/** Keys that already had a fetch:p0 setId reserved but were never registered. */
const SET_ID_OVERRIDES: Record<string, string> = {
	"momentum-design_momentum-design": "momentum-icons",
	jcubic_Clarity: "clarity-icon-theme",
	"pop-os_icon-theme": "pop-os-icons",
	"snwh_faba-icon-theme": "faba-icons",
	"zayronxio_Mkos-Big-Sur": "mkos-big-sur-icons",
};

type FetchSpec = {
	type: string;
	repo?: string;
	package?: string;
	archive_url?: string | null;
	instructions?: string;
	page?: string;
};

type Family = {
	round: number;
	key: string;
	name: string;
	source_url: string;
	licence: string;
	copyleft: boolean;
	fetch: FetchSpec;
	selection_mode: string;
	theme_handling?: { rule?: string };
	include_regex: string | null;
	exclude_regex: string | null;
	svg_subpaths: string[];
	paths_file: string | null;
	paths_listed: number;
	new_unique: number;
	notes?: string;
};

type Manifest = {
	totals: Record<string, number>;
	families: Family[];
};

type StyleOut = {
	id: string;
	label: string;
	group: "line" | "solid";
	count: number;
};

type ReportEntry = {
	key: string;
	label: string;
	source: string;
	setId: string;
	license: string;
	copyleft: boolean;
	attribution?: string;
	status: "ok" | "skipped" | "empty" | "error" | "duplicate";
	count: number;
	expected: number;
	styles?: StyleOut[];
	note?: string;
	round: number;
};

type NamedSvg = { name: string; svg: string; style: string };

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

function setIdFromKey(key: string): string {
	if (SET_ID_OVERRIDES[key]) return SET_ID_OVERRIDES[key]!;
	if (key.startsWith("pling_")) return `pling-${key.slice(6)}`;
	if (key.startsWith("npm__")) {
		return kebab(key.slice(5).replace(/__/g, "-"));
	}
	if (key.startsWith("cm_")) return `commons-${kebab(key.slice(3))}`;
	if (key.startsWith("oga_")) return `oga-${kebab(key.slice(4).replace(/_merged$/, ""))}`;
	return kebab(key);
}

function isThemeFamily(family: Family) {
	if (family.selection_mode === "theme") return true;
	const rule = family.theme_handling?.rule ?? "";
	return /^freedesktop theme/i.test(rule);
}

function needsAttribution(licence: string) {
	return /CC-BY(?!-SA)|Creative Commons Attribution(?!.*ShareAlike)/i.test(licence);
}

async function run(cmd: string, args: string[], cwd?: string, timeout = 600_000) {
	const { stdout, stderr } = await execFileAsync(cmd, args, {
		cwd,
		timeout,
		maxBuffer: 512 * 1024 * 1024,
		env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_LFS_SKIP_SMUDGE: "1" },
	});
	return { stdout: String(stdout), stderr: String(stderr) };
}

async function fetchBuffer(url: string, timeoutMs = 300_000): Promise<Buffer> {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			signal: ctrl.signal,
			headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
			redirect: "follow",
		});
		if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
		return Buffer.from(await res.arrayBuffer());
	} finally {
		clearTimeout(timer);
	}
}

async function fetchText(url: string, timeoutMs = 120_000): Promise<string> {
	return (await fetchBuffer(url, timeoutMs)).toString("utf8");
}

async function ensureDir(dir: string) {
	await fs.mkdir(dir, { recursive: true });
}

async function extractArchive(archivePath: string, dest: string) {
	await fs.rm(dest, { recursive: true, force: true });
	await ensureDir(dest);
	const lower = archivePath.toLowerCase();
	if (lower.endsWith(".zip")) {
		const buf = await fs.readFile(archivePath);
		const zip = await JSZip.loadAsync(buf);
		for (const [name, entry] of Object.entries(zip.files)) {
			if (entry.dir) continue;
			const out = path.join(dest, name);
			await ensureDir(path.dirname(out));
			await fs.writeFile(out, await entry.async("nodebuffer"));
		}
		return;
	}
	if (lower.endsWith(".tar.zst") || lower.endsWith(".tzst")) {
		await run("tar", ["--use-compress-program=zstd", "-xf", archivePath, "-C", dest]);
		return;
	}
	if (lower.endsWith(".tar.xz") || lower.endsWith(".txz")) {
		await run("tar", ["-xJf", archivePath, "-C", dest]);
		return;
	}
	if (lower.endsWith(".tar.bz2") || lower.endsWith(".tbz2")) {
		await run("tar", ["-xjf", archivePath, "-C", dest]);
		return;
	}
	if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz") || lower.endsWith(".tar")) {
		await run("tar", ["-xf", archivePath, "-C", dest]);
		return;
	}
	// Fall back to tar autodetection / unzip.
	try {
		await run("tar", ["-xf", archivePath, "-C", dest]);
	} catch {
		await run("unzip", ["-q", archivePath, "-d", dest]);
	}
}

/** Strip the single top-level folder GitHub/npm tarballs usually wrap. */
async function unwrapRoot(dir: string): Promise<string> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const real = entries.filter((e) => e.name !== "__MACOSX" && e.name !== ".DS_Store");
	if (real.length === 1 && real[0]!.isDirectory()) {
		return path.join(dir, real[0]!.name);
	}
	return dir;
}

async function downloadAndExtract(url: string, workDir: string): Promise<string> {
	await fs.rm(workDir, { recursive: true, force: true });
	await ensureDir(workDir);
	const extGuess = (() => {
		const clean = url.split("?")[0]!.toLowerCase();
		if (clean.endsWith(".zip")) return ".zip";
		if (clean.endsWith(".tar.xz") || clean.endsWith(".txz")) return ".tar.xz";
		if (clean.endsWith(".tar.zst")) return ".tar.zst";
		if (clean.endsWith(".tar.bz2")) return ".tar.bz2";
		if (clean.endsWith(".tgz") || clean.endsWith(".tar.gz")) return ".tar.gz";
		if (clean.endsWith(".tar")) return ".tar";
		return ".bin";
	})();
	const archivePath = path.join(workDir, `source${extGuess === ".bin" ? ".tar.gz" : extGuess}`);
	const buf = await fetchBuffer(url);
	// Detect zip by magic even when URL has no extension.
	const isZip = buf.length > 3 && buf[0] === 0x50 && buf[1] === 0x4b;
	const finalPath = isZip && !archivePath.endsWith(".zip") ? `${archivePath}.zip` : archivePath;
	await fs.writeFile(finalPath, buf);
	const extractDir = path.join(workDir, "extracted");
	await extractArchive(finalPath, extractDir);
	return unwrapRoot(extractDir);
}

async function loadPathList(family: Family): Promise<string[] | null> {
	if (!family.paths_file) return null;
	const base = path.basename(family.paths_file);
	const abs = path.join(PATHS_DIR, base);
	try {
		const text = await fs.readFile(abs, "utf8");
		return text
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter((l) => l && !l.startsWith("#"));
	} catch {
		return null;
	}
}

const STYLE_NAME_RE =
	/^(line|outline|outlined|solid|fill|filled|bold|light|thin|regular|duotone|twotone|two-tone|bulk|broken|color|mono|glyph|icons?|24|16|32|48|scalable|soft|sharp|round|rounded|square|mini|micro)$/i;

function classifyPath(
	rel: string,
	theme: boolean,
	opts: { uniqueNames?: boolean } = {},
): { name: string; style: string } | null {
	const norm = rel.replace(/\\/g, "/");
	if (!/\.svg$/i.test(norm)) return null;
	const base = path.basename(norm).replace(/\.svg$/i, "");
	if (!base || base.startsWith(".")) return null;
	if (theme) {
		const symbolic = /\/symbolic\//i.test(norm) || /-symbolic$/i.test(base);
		return {
			name: kebab(base.replace(/-symbolic$/i, "")),
			style: symbolic ? "symbolic" : "color",
		};
	}
	// Flat: parent folder is often the style (`fill/foo.svg`). Some packs invert
	// that (`foo/Bold.svg`) — detect style-like basenames and swap.
	const parts = norm.split("/");
	const parent = parts.length >= 2 ? parts[parts.length - 2]! : "";
	if (STYLE_NAME_RE.test(base) && parent && !STYLE_NAME_RE.test(parent)) {
		return { name: kebab(parent), style: kebab(base) };
	}
	const styleHint = STYLE_NAME_RE.test(parent) ? kebab(parent) : "";
	// Path lists are already deduped; keep path-derived names so duplicate
	// basenames in different folders (e.g. button.svg) stay distinct.
	if (opts.uniqueNames) {
		const withoutStyle = styleHint
			? parts.filter((_, i) => i !== parts.length - 2).join("/")
			: norm;
		const stem = withoutStyle.replace(/\.svg$/i, "");
		return { name: kebab(stem), style: styleHint };
	}
	return { name: kebab(base), style: styleHint };
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
	await ensureDir(dir);
	await fs.writeFile(path.join(dir, file), svg.trim() + "\n", "utf8");
	return true;
}

function groupFor(styleId: string, samples: string[]): "line" | "solid" {
	if (/^(line|outline|outlined|linear|stroke|regular|thin|light|broken|symbolic|mono)$/i.test(styleId)) {
		return "line";
	}
	if (/^(solid|fill|filled|bulk|bold|duo|duotone|color|glass|gloss|sticker|pixel|plush|glyph)$/i.test(styleId)) {
		return "solid";
	}
	let fillHits = 0;
	for (const svg of samples.slice(0, 8)) {
		if (/fill="(?!none)[^"]+"/i.test(svg) && !/stroke="currentColor"/i.test(svg)) fillHits++;
	}
	return fillHits >= Math.ceil(samples.slice(0, 8).length / 2) ? "solid" : "line";
}

function styleLabel(styleId: string, alone: boolean, group: "line" | "solid") {
	if (alone) return group === "line" ? "All" : "Icons";
	return styleId
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

async function materialize(setId: string, items: NamedSvg[]) {
	const buckets = new Map<string, NamedSvg[]>();
	for (const item of items) {
		const style = item.style || "";
		const list = buckets.get(style) ?? [];
		list.push(item);
		buckets.set(style, list);
	}
	if (buckets.size === 1 && buckets.has("")) {
		const only = buckets.get("")!;
		const sample = only.slice(0, 8).map((i) => i.svg);
		const group = groupFor("icons", sample);
		const id = group === "line" ? "line" : "solid";
		buckets.set(id, only);
		buckets.delete("");
	}
	const destRoot = path.join(ICONS_ROOT, setId);
	await fs.rm(destRoot, { recursive: true, force: true });
	const stylesOut: StyleOut[] = [];
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
	return { count, styles: stylesOut };
}

async function resolveExisting(root: string, rel: string): Promise<string | null> {
	const norm = rel.replace(/\\/g, "/").replace(/^\.\//, "");
	const candidates = [path.join(root, norm)];
	const parts = norm.split("/");
	if (parts.length > 1) {
		candidates.push(path.join(root, parts.slice(1).join("/")));
	}
	// If root was not unwrapped, try root/<top>/<rel>
	try {
		const tops = await fs.readdir(root, { withFileTypes: true });
		for (const top of tops) {
			if (!top.isDirectory()) continue;
			candidates.push(path.join(root, top.name, norm));
			if (parts.length > 1 && parts[0] === top.name) {
				candidates.push(path.join(root, top.name, parts.slice(1).join("/")));
			}
		}
	} catch {
		/* ignore */
	}
	for (const abs of candidates) {
		try {
			await fs.access(abs);
			return abs;
		} catch {
			/* try next */
		}
	}
	return null;
}

function themeSizeRank(rel: string): number {
	const norm = rel.replace(/\\/g, "/");
	if (/\/scalable\//i.test(norm)) return 0;
	for (const [i, size] of ["22", "24", "32", "48", "16", "64", "128", "256", "512"].entries()) {
		if (new RegExp(`/(?:apps|actions|places|devices|mimetypes|categories|status|emblems)/${size}/`, "i").test(norm)) {
			return i + 1;
		}
		if (new RegExp(`/${size}/`, "i").test(norm)) return i + 1;
	}
	return 50;
}

async function collectFromTree(
	root: string,
	wanted: string[] | null,
	theme: boolean,
	include: RegExp | null,
	exclude: RegExp | null,
): Promise<NamedSvg[]> {
	const best = new Map<string, { item: NamedSvg; rank: number }>();
	const uniqueNames = Boolean(wanted?.length) && !theme;

	const takeAbs = async (abs: string, relForClassify: string) => {
		const norm = relForClassify.replace(/\\/g, "/").replace(/^\.\//, "");
		if (/\/(?:cursors?|previews?|templates?|debian|docs?|screenshots?)(\/|$)/i.test(norm)) return;
		if (include && !include.test(norm)) return;
		if (exclude && exclude.test(norm)) return;
		const classified = classifyPath(norm, theme, { uniqueNames });
		if (!classified) return;
		let svg: string;
		try {
			svg = await fs.readFile(abs, "utf8");
		} catch {
			return;
		}
		if (!svg.includes("<svg")) return;
		// Skip SVG font tables (glyph charts) — not usable icons.
		if (/<font(?:-face)?\b/i.test(svg) && !/<path\b/i.test(svg)) return;
		if (/<metadata>\s*\{/.test(svg) && !/<path\b/i.test(svg)) return;
		const key = `${classified.style}:${classified.name}`;
		const rank = theme ? themeSizeRank(norm) : 0;
		const prev = best.get(key);
		if (prev && prev.rank <= rank) return;
		best.set(key, {
			item: { name: classified.name, svg, style: classified.style },
			rank,
		});
	};

	if (wanted?.length) {
		for (const rel of wanted) {
			const abs = await resolveExisting(root, rel);
			if (abs) await takeAbs(abs, rel);
		}
		return [...best.values()].map((v) => v.item);
	}

	async function walk(abs: string, rel: string) {
		let entries;
		try {
			entries = await fs.readdir(abs, { withFileTypes: true });
		} catch {
			return;
		}
		for (const ent of entries) {
			if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "__MACOSX") continue;
			const nextAbs = path.join(abs, ent.name);
			const nextRel = rel ? `${rel}/${ent.name}` : ent.name;
			if (ent.isDirectory()) await walk(nextAbs, nextRel);
			else if (ent.name.toLowerCase().endsWith(".svg")) await takeAbs(nextAbs, nextRel);
		}
	}
	await walk(root, "");
	return [...best.values()].map((v) => v.item);
}

async function fetchGitFamily(family: Family, workDir: string): Promise<string> {
	const url =
		family.fetch.archive_url ||
		(family.fetch.repo
			? family.fetch.repo.replace(/\.git$/, "").replace(/https:\/\/github\.com\//, "https://codeload.github.com/") +
				"/tar.gz/HEAD"
			: null);
	if (!url) {
		// gitlab / other: try archive_url from instructions or clone
		const repo = family.fetch.repo ?? family.source_url;
		if (/gitlab\.com/i.test(repo)) {
			const m = repo.match(/gitlab\.com\/([^/]+\/[^/]+)/);
			if (m) {
				const archive = `https://gitlab.com/${m[1]}/-/archive/master/${m[1]!.split("/").pop()}-master.tar.gz`;
				return downloadAndExtract(archive, workDir);
			}
		}
		throw new Error("No archive_url/repo for git family");
	}
	try {
		return await downloadAndExtract(url, workDir);
	} catch (err) {
		// Some repos use main vs master in codeload HEAD; fall back to git clone.
		const repoUrl = family.fetch.repo ?? family.source_url;
		if (!/github\.com/i.test(repoUrl)) throw err;
		const dest = path.join(workDir, "clone");
		await fs.rm(dest, { recursive: true, force: true });
		await ensureDir(workDir);
		await run("git", ["clone", "--depth", "1", repoUrl.replace(/\.git$/, "") + ".git", dest], undefined, 600_000);
		return dest;
	}
}

async function fetchNpmFamily(family: Family, workDir: string): Promise<string> {
	const url =
		family.fetch.archive_url ||
		(family.fetch.package
			? (() => {
					const pkg = family.fetch.package!;
					const at = pkg.lastIndexOf("@");
					const name = at > 0 ? pkg.slice(0, at) : pkg;
					const ver = at > 0 ? pkg.slice(at + 1) : "latest";
					const enc = name.startsWith("@")
						? `%40${name.slice(1).replace("/", "%2F")}`
						: encodeURIComponent(name);
					const file = name.startsWith("@") ? name.split("/")[1] : name;
					return `https://registry.npmjs.org/${enc}/-/${file}-${ver}.tgz`;
				})()
			: null);
	if (!url) throw new Error("No npm archive_url/package");
	return downloadAndExtract(url, workDir);
}

async function fetchPlingFamily(family: Family, workDir: string): Promise<string> {
	const id = family.key.replace(/^pling_/, "");
	const api = `https://api.opendesktop.org/ocs/v1/content/data/${id}?format=json`;
	const json = JSON.parse(await fetchText(api)) as {
		data?: Array<Record<string, string | number | null>>;
	};
	const item = json.data?.[0];
	if (!item) throw new Error(`Pling content ${id} not found`);
	let link: string | null = null;
	for (let i = 1; i <= 12; i++) {
		const v = item[`downloadlink${i}`];
		if (typeof v === "string" && v.startsWith("http")) {
			link = v;
			break;
		}
	}
	if (!link) throw new Error(`Pling content ${id} has no download link`);
	return downloadAndExtract(link, workDir);
}

async function fetchArchiveFamily(family: Family, workDir: string): Promise<string> {
	if (!family.fetch.archive_url) throw new Error("archive family missing archive_url");
	return downloadAndExtract(family.fetch.archive_url, workDir);
}

async function fetchOpenGameArt(family: Family, workDir: string): Promise<string> {
	const page = family.fetch.page ?? family.source_url;
	const html = await fetchText(page);
	const links = new Set<string>();
	for (const m of html.matchAll(/https?:\/\/opengameart\.org\/sites\/default\/files\/[^"'\\\s]+\.(?:zip|tar\.gz|7z)/gi)) {
		links.add(m[0]!.replace(/&amp;/g, "&"));
	}
	for (const m of html.matchAll(/\/sites\/default\/files\/[^"'\\\s]+\.(?:zip|tar\.gz|7z)/gi)) {
		links.add(`https://opengameart.org${m[0]!.replace(/&amp;/g, "&")}`);
	}
	if (!links.size) throw new Error(`No downloadable archives on ${page}`);
	await fs.rm(workDir, { recursive: true, force: true });
	await ensureDir(workDir);
	const merged = path.join(workDir, "merged");
	await ensureDir(merged);
	let i = 0;
	for (const url of links) {
		i++;
		try {
			const sub = await downloadAndExtract(url, path.join(workDir, `part-${i}`));
			// Copy tree into merged, preserving relative layout when possible.
			await run("cp", ["-a", `${sub}/.`, merged]);
		} catch (err) {
			console.warn(`  ⚠ OGA archive failed ${url}: ${err instanceof Error ? err.message : err}`);
		}
	}
	return merged;
}

async function fetchWikimedia(family: Family, workDir: string): Promise<string> {
	const wanted = await loadPathList(family);
	if (!wanted?.length) throw new Error("Wikimedia family has no path list");
	await fs.rm(workDir, { recursive: true, force: true });
	const root = path.join(workDir, "files");
	await ensureDir(root);
	let ok = 0;
	let fail = 0;
	for (const rel of wanted) {
		const base = path.basename(rel);
		const candidates = [base, base.replace(/ /g, "_")];
		let wrote = false;
		for (const name of candidates) {
			const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}`;
			try {
				const buf = await fetchBuffer(url, 60_000);
				const text = buf.toString("utf8");
				if (!text.includes("<svg")) continue;
				const out = path.join(root, rel);
				await ensureDir(path.dirname(out));
				await fs.writeFile(out, buf);
				wrote = true;
				ok++;
				break;
			} catch {
				/* try next */
			}
		}
		if (!wrote) fail++;
	}
	if (!ok) throw new Error(`Wikimedia download failed for all files (${fail} misses)`);
	if (fail) console.warn(`  ⚠ Wikimedia: ${ok} ok, ${fail} missing`);
	return root;
}

async function fetchPhyloPic(workDir: string): Promise<NamedSvg[]> {
	await fs.rm(workDir, { recursive: true, force: true });
	await ensureDir(workDir);
	const buildJson = JSON.parse(await fetchText("https://api.phylopic.org/")) as {
		build?: number;
	};
	const build = buildJson.build;
	if (build == null) throw new Error("Could not resolve PhyloPic build number");

	type PhyloItem = {
		uuid?: string;
		_links?: {
			vectorFile?: { href?: string };
			contributor?: { title?: string };
			license?: { href?: string };
			self?: { href?: string };
		};
	};
	type PhyloPage = {
		_links?: { next?: { href?: string } | null };
		_embedded?: { items?: PhyloItem[] };
	};

	const items: NamedSvg[] = [];
	let href: string | null =
		`/images?build=${build}&embed_items=true&filter_license_nc=false&filter_license_sa=false&page=0`;
	let page = 0;
	const VECTOR_CONCURRENCY = 12;
	while (href) {
		const url = href.startsWith("http") ? href : `https://api.phylopic.org${href}`;
		const data = JSON.parse(await fetchText(url)) as PhyloPage;
		const embedded = data._embedded?.items ?? [];
		const jobs = embedded.map((img) => async () => {
			const selfHref = img._links?.self?.href ?? "";
			const uuid =
				img.uuid ||
				selfHref.match(/\/images\/([0-9a-f-]{36})/i)?.[1] ||
				img._links?.vectorFile?.href?.match(/\/images\/([0-9a-f-]{36})\//i)?.[1];
			const vector = img._links?.vectorFile?.href;
			if (!uuid || !vector) return null;
			const licenseHref = img._links?.license?.href ?? "";
			try {
				const svg = await fetchText(
					vector.startsWith("http") ? vector : `https://images.phylopic.org${vector}`,
					60_000,
				);
				if (!svg.includes("<svg")) return null;
				const contributor = img._links?.contributor?.title;
				const attr = contributor ? `PhyloPic / ${contributor}` : "PhyloPic";
				const stamped = svg.includes("<!--")
					? svg
					: `<!-- ${attr}; ${licenseHref || "see phylopic.org"} -->\n${svg}`;
				return { name: uuid, svg: stamped, style: "solid" } satisfies NamedSvg;
			} catch {
				return null;
			}
		});
		for (let i = 0; i < jobs.length; i += VECTOR_CONCURRENCY) {
			const batch = await Promise.all(jobs.slice(i, i + VECTOR_CONCURRENCY).map((fn) => fn()));
			for (const row of batch) if (row) items.push(row);
		}
		page++;
		const next = data._links?.next?.href ?? null;
		href = next;
		if (page % 20 === 0) console.log(`  … PhyloPic page ${page} (${items.length} svgs)`);
	}
	return items;
}

async function resolveTree(family: Family, workDir: string): Promise<string> {
	const t = family.fetch.type;
	if (t === "git") return fetchGitFamily(family, workDir);
	if (t === "npm") return fetchNpmFamily(family, workDir);
	if (t === "pling-ocs") return fetchPlingFamily(family, workDir);
	if (t === "archive") return fetchArchiveFamily(family, workDir);
	if (t === "opengameart") return fetchOpenGameArt(family, workDir);
	if (t === "wikimedia-commons") return fetchWikimedia(family, workDir);
	if (t === "other" || t === "api/other") {
		throw new Error(`Unsupported fetch type ${t} (handled specially or skipped)`);
	}
	throw new Error(`Unknown fetch type ${t}`);
}

function escapeTsString(s: string) {
	return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderSet(entry: ReportEntry) {
	const styles = (entry.styles ?? [])
		.map(
			(s) =>
				`\t\t\t{ id: "${s.id}", label: "${escapeTsString(s.label)}", group: "${s.group}", roots: ["${s.id}"] },`,
		)
		.join("\n");
	const licenseLine = entry.license
		? `\n\t\tlicense: "${escapeTsString(entry.license)}",`
		: "";
	const copyleftLine = entry.copyleft ? `\n\t\tcopyleft: true,` : "";
	const attributionLine = entry.attribution
		? `\n\t\tattribution: "${escapeTsString(entry.attribution)}",`
		: "";
	return `\t{
\t\tid: "${entry.setId}",
\t\tlabel: "${escapeTsString(entry.label)}",
\t\thomepage: "${escapeTsString(entry.source)}",${licenseLine}${copyleftLine}${attributionLine}
\t\tstyles: [
${styles}
\t\t],
\t},`;
}

async function register(ok: ReportEntry[]) {
	if (!ok.length) return;
	let src = await fs.readFile(ICON_SETS_FILE, "utf8");
	const startMark = "\t// GAP_300K_START";
	const endMark = "\t// GAP_300K_END";
	const block = `${startMark}\n${ok.map(renderSet).join("\n")}\n${endMark}`;
	if (src.includes(startMark) && src.includes(endMark)) {
		src = src.replace(/\t\/\/ GAP_300K_START[\s\S]*?\t\/\/ GAP_300K_END/, block);
	} else {
		const end = src.indexOf("\t// P0_FAMILIES_END");
		if (end === -1) throw new Error("icon-sets.ts: P0_FAMILIES_END not found");
		const insertAt = end + "\t// P0_FAMILIES_END".length;
		src = `${src.slice(0, insertAt)}\n${block}${src.slice(insertAt)}`;
	}
	// Avoid duplicate top-level ids outside our block when re-running.
	await fs.writeFile(ICON_SETS_FILE, src, "utf8");
}

async function packSet(setId: string) {
	const bunBin = process.env.BUN_BIN || "bun";
	await run(
		bunBin,
		["run", "pack:icons", "--", "--delete", "--only", setId],
		process.cwd(),
		3_600_000,
	);
}

async function importFamily(
	family: Family,
	existingIds: Set<string>,
	opts: { force: boolean },
): Promise<ReportEntry> {
	const setId = setIdFromKey(family.key);
	const attribution = needsAttribution(family.licence) ? family.source_url : undefined;
	const base: Omit<ReportEntry, "status" | "count" | "styles" | "note"> = {
		key: family.key,
		label: family.name,
		source: family.source_url,
		setId,
		license: family.licence,
		copyleft: family.copyleft,
		attribution,
		expected: family.new_unique,
		round: family.round,
	};

	if (existingIds.has(setId) && !opts.force) {
		return {
			...base,
			status: "duplicate",
			count: 0,
			note: `set id ${setId} already registered in ICON_SETS`,
		};
	}

	console.log(`→ [${family.round}] ${family.name} (${setId}, expect ${family.new_unique})`);
	const workDir = path.join(TMP, createHash("sha1").update(family.key).digest("hex").slice(0, 12));

	try {
		if (family.key === "nih_bioart") {
			return {
				...base,
				status: "skipped",
				count: 0,
				note: "NIH BioArt requires per-id authenticated file API; not automated in this importer",
			};
		}

		let items: NamedSvg[];
		if (family.fetch.type === "api/other" && family.key.startsWith("phylopic")) {
			items = await fetchPhyloPic(workDir);
		} else {
			const root = await resolveTree(family, workDir);
			const wanted = await loadPathList(family);
			const include = family.include_regex ? new RegExp(family.include_regex) : null;
			const exclude = family.exclude_regex ? new RegExp(family.exclude_regex) : null;
			const theme = isThemeFamily(family);
			let resolvedWanted = 0;
			if (wanted?.length) {
				for (const rel of wanted) {
					if (await resolveExisting(root, rel)) resolvedWanted++;
				}
			}
			items = await collectFromTree(root, wanted, theme, include, exclude);
			// Fall back only when the path list does not resolve against the
			// fetched tree (layout changed / unwrap). Never expand beyond a
			// path list that is present but filtered out as non-icons.
			if (wanted?.length && resolvedWanted === 0) {
				const fallback: NamedSvg[] = [];
				const subroots =
					family.svg_subpaths?.length > 0
						? family.svg_subpaths.map((s) => path.join(root, s))
						: [root];
				for (const sub of subroots) {
					try {
						await fs.access(sub);
					} catch {
						continue;
					}
					fallback.push(...(await collectFromTree(sub, null, theme, include, exclude)));
				}
				if (!fallback.length) {
					fallback.push(...(await collectFromTree(root, null, theme, include, exclude)));
				}
				if (fallback.length) items = fallback;
			}
		}

		const packed = await materialize(setId, items);
		if (!packed.count) {
			return {
				...base,
				status: "empty",
				count: 0,
				note: "no usable SVGs after fetch/filter",
			};
		}
		return {
			...base,
			status: "ok",
			count: packed.count,
			styles: packed.styles,
			note:
				packed.count === family.new_unique
					? undefined
					: `got ${packed.count} vs research ${family.new_unique}`,
		};
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		const unreachable = /HTTP 404|ENOTFOUND|404|not found|gone|403/i.test(msg);
		return {
			...base,
			status: unreachable ? "skipped" : "error",
			count: 0,
			note: msg.slice(0, 500),
		};
	} finally {
		await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
	}
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
	const out = new Array<R>(items.length);
	let next = 0;
	async function worker() {
		for (;;) {
			const i = next++;
			if (i >= items.length) return;
			out[i] = await fn(items[i]!, i);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
	return out;
}

let reportWriteChain: Promise<void> = Promise.resolve();
function queueReportWrite(report: Record<string, ReportEntry>) {
	reportWriteChain = reportWriteChain.then(async () => {
		await fs.writeFile(REPORT, JSON.stringify(report, null, 2), "utf8");
	});
	return reportWriteChain;
}

function parseArgs() {
	const force = process.argv.includes("--force");
	const doPack = process.argv.includes("--pack");
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
	const limitIdx = process.argv.indexOf("--limit");
	const limit = limitIdx === -1 ? null : Number(process.argv[limitIdx + 1]);
	return { force, doPack, only, limit: Number.isFinite(limit) ? limit : null };
}

async function main() {
	const { force, doPack, only, limit } = parseArgs();
	const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8")) as Manifest;
	await ensureDir(TMP);

	const iconSetsSrc = await fs.readFile(ICON_SETS_FILE, "utf8");
	const existingIds = new Set(
		[...iconSetsSrc.matchAll(/\{\s*id:\s*"([^"]+)",\s*\n\s*label:/g)].map((m) => m[1]!),
	);

	let report: Record<string, ReportEntry> = {};
	try {
		report = JSON.parse(await fs.readFile(REPORT, "utf8")) as Record<string, ReportEntry>;
	} catch {
		report = {};
	}

	let families = [...manifest.families].sort((a, b) => b.new_unique - a.new_unique);
	if (only) {
		families = families.filter((f) => {
			const sid = setIdFromKey(f.key);
			return only.has(f.key.toLowerCase()) || only.has(sid.toLowerCase());
		});
	}
	if (limit != null) families = families.slice(0, limit);

	console.log(
		`Importing ${families.length} families (concurrency ${CONCURRENCY})${doPack ? " with per-family pack" : ""}…`,
	);

	// Sequential per-family for pack mode (disk + resvg); parallel fetch otherwise.
	const runOne = async (family: Family) => {
		const setId = setIdFromKey(family.key);
		if (!force && report[family.key]?.status === "ok") {
			console.log(`• ${family.key} already imported (${report[family.key]!.count})`);
			return report[family.key]!;
		}
		const entry = await importFamily(family, existingIds, { force });
		if (entry.status === "ok") {
			existingIds.add(entry.setId);
			console.log(
				`  ✓ ${entry.count.toLocaleString()} icons${entry.note ? ` — ${entry.note}` : ""}`,
			);
			if (doPack) {
				// Register before pack so ICON_SETS knows the styles.
				await register(
					Object.values({ ...report, [family.key]: entry }).filter(
						(e) => e.status === "ok" && (e.styles?.length ?? 0) > 0,
					),
				);
				try {
					await packSet(setId);
				} catch (err) {
					entry.note = `${entry.note ? entry.note + "; " : ""}pack failed: ${
						err instanceof Error ? err.message : err
					}`;
					console.warn(`  ⚠ pack failed for ${setId}: ${entry.note}`);
				}
			}
		} else {
			console.log(`  ${entry.status} — ${entry.note ?? ""}`);
		}
		report[family.key] = entry;
		await queueReportWrite(report);
		return entry;
	};

	if (doPack || CONCURRENCY === 1) {
		for (const family of families) await runOne(family);
	} else {
		await mapPool(families, CONCURRENCY, async (family) => runOne(family));
	}
	await reportWriteChain;

	const ok = Object.values(report).filter((e) => e.status === "ok" && (e.styles?.length ?? 0) > 0);
	await register(ok);

	const added = ok.reduce((n, e) => n + e.count, 0);
	const skipped = Object.values(report).filter((e) => e.status === "skipped" || e.status === "duplicate");
	const empty = Object.values(report).filter((e) => e.status === "empty");
	const errors = Object.values(report).filter((e) => e.status === "error");
	const copyleftIcons = ok.filter((e) => e.copyleft).reduce((n, e) => n + e.count, 0);
	const permissiveIcons = added - copyleftIcons;

	console.log(
		`Done. ${ok.length} families ok (${added.toLocaleString()} icons). ` +
			`copyleft=${copyleftIcons.toLocaleString()} permissive=${permissiveIcons.toLocaleString()}. ` +
			`Skipped=${skipped.length} empty=${empty.length} errors=${errors.length}.`,
	);
	console.log(`Report: ${REPORT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
