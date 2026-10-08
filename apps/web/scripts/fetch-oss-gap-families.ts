/**
 * Import the open-source icon families flagged in the 2026-10-08 X-reply gap report.
 *
 * Follows the same pipeline as fetch-p0-families.ts: write loose SVGs under
 * icons/<setId>/<style>/, register between the P0_FAMILIES markers in
 * src/lib/icon-sets.ts, and mark animated sets in src/lib/animated-sets.ts.
 *
 *   bun run fetch:gap
 *   bun run fetch:gap -- --only withicons,meya-icons
 *   bun run fetch:gap -- --force
 *
 * Skipped on purpose (see report written to /tmp/aria-gap-report.json):
 * - 3dicons: raster/Blender renders only (previously vendored then removed)
 * - Morphicons: morphing library, not an icon pack (already an Aria npm dep)
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ICONS_ROOT = path.join(process.cwd(), "icons");
const TMP = path.join(os.tmpdir(), "aria-gap-icons");
const REPORT = path.join(os.tmpdir(), "aria-gap-report.json");
const ICON_SETS_FILE = path.join(process.cwd(), "src/lib/icon-sets.ts");
const ANIMATED_FILE = path.join(process.cwd(), "src/lib/animated-sets.ts");

type StyleOut = {
	id: string;
	label: string;
	group: "line" | "solid";
	count: number;
};

type ReportEntry = {
	label: string;
	source: string;
	setId: string;
	license: string;
	status: "ok" | "skipped" | "empty" | "error";
	count: number;
	styles?: StyleOut[];
	animated?: boolean;
	note?: string;
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

async function run(cmd: string, args: string[], cwd?: string, timeout = 300_000) {
	const { stdout, stderr } = await execFileAsync(cmd, args, {
		cwd,
		timeout,
		maxBuffer: 256 * 1024 * 1024,
		env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_LFS_SKIP_SMUDGE: "1" },
	});
	return { stdout: String(stdout), stderr: String(stderr) };
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
	return /<(animate|animateTransform|animateMotion)\b|@keyframes|animation:/i.test(svg);
}

function groupFor(styleId: string, samples: string[]): "line" | "solid" {
	if (/^(line|outline|linear|stroke|regular|thin|light|broken)$/i.test(styleId)) return "line";
	if (/^(solid|fill|filled|bulk|bold|duo|duotone|color|glass|gloss|sticker|pixel|plush)$/i.test(styleId)) {
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

function jsxAttrsToSvg(attrs: string) {
	return attrs
		.replace(/\bstrokeWidth=/g, "stroke-width=")
		.replace(/\bstrokeLinecap=/g, "stroke-linecap=")
		.replace(/\bstrokeLinejoin=/g, "stroke-linejoin=")
		.replace(/\bstrokeDasharray=/g, "stroke-dasharray=")
		.replace(/\bfillRule=/g, "fill-rule=")
		.replace(/\bclipRule=/g, "clip-rule=")
		.replace(/\bclipPath=/g, "clip-path=")
		.replace(/=\{(?:color|fill|stroke)\}/g, '="currentColor"')
		.replace(/\{(?:color|fill|stroke)\}/g, "currentColor")
		.replace(/\s[\w:-]+=\{[^}]+\}/g, "");
}

function cleanMotionSvg(raw: string) {
	let svg = raw
		.replace(/<\/?(?:motion|m)\./g, (tag) => tag.replace(/(?:motion|m)\./, ""))
		.replace(/\{\s*\.\.\.(?:[^{}]|\{[^{}]*\})*\}/g, "")
		.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
		.replace(/\s[\w:-]+=\{\{[\s\S]*?\}\}/g, "")
		.replace(/\bclassName=\{`[\s\S]*?`\}/g, "")
		.replace(/\bclassName=\{[^}]+\}/g, "")
		.replace(/\bclassName="[^"]*"/g, "")
		.replace(/\bref=\{[^}]+\}/g, "")
		.replace(/\bon[A-Z]\w+=\{[^}]+\}/g, "")
		.replace(/\bstyle=\{\{[\s\S]*?\}\}/g, "")
		.replace(/=\{(?:color|fill|stroke)\}/g, '="currentColor"')
		.replace(/=\{size\}/g, '="24"')
		.replace(/=\{strokeWidth\}/g, '="2"')
		.replace(/\{(?:color|fill|stroke)\}/g, "currentColor")
		.replace(/\{size\}/g, "24")
		.replace(/\{strokeWidth\}/g, "2");
	svg = jsxAttrsToSvg(svg);
	svg = svg
		.replace(/\s[\w:-]+=\{`[\s\S]*?`\}/g, "")
		.replace(/\s[\w:-]+=\{[^}]+\}/g, "")
		.replace(/\{`[\s\S]*?`\}/g, "")
		.replace(/\{[^{}]*\}/g, "")
		.replace(/[`$]/g, "");
	return svg.replace(/\s{2,}/g, " ").replace(/\s+>/g, ">").replace(/>\s+</g, "><").trim();
}

function resolvePathConsts(raw: string) {
	const consts = new Map<string, string>();
	for (const m of raw.matchAll(
		/(?:const|let|var)\s+([A-Z][A-Z0-9_]*)\s*=\s*["'`]([^"'`]+)["'`]/g,
	)) {
		consts.set(m[1]!, m[2]!);
	}
	let out = raw;
	for (const [name, d] of consts) {
		out = out.replace(new RegExp(`\\bd=\\{${name}\\}`, "g"), `d="${d}"`);
		out = out.replace(new RegExp(`\\bd=\\{\\s*${name}\\s*\\}`, "g"), `d="${d}"`);
	}
	return out;
}

function wrapSvg(body: string, viewBox = "0 0 24 24", extras = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"') {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${extras}>${body}</svg>`;
}

async function sparseClone(repo: string, branch: string, folders: string[]) {
	const name = repo.split("/")[1]!;
	const dest = path.join(TMP, name);
	await fs.rm(dest, { recursive: true, force: true });
	await run("git", [
		"clone",
		"--depth",
		"1",
		"--filter=blob:none",
		"--sparse",
		"--branch",
		branch,
		`https://github.com/${repo}.git`,
		dest,
	]);
	if (folders.length) {
		// Cone mode only accepts directories — never pass LICENSE/README file paths.
		await run("git", ["sparse-checkout", "set", ...folders], dest);
	}
	return dest;
}

async function fetchGithubRaw(repo: string, branch: string, rel: string) {
	const url = `https://raw.githubusercontent.com/${repo}/${branch}/${rel}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
	return res.text();
}

async function npmPack(pkg: string, destDir: string) {
	await fs.rm(destDir, { recursive: true, force: true });
	await fs.mkdir(destDir, { recursive: true });
	const { stdout } = await run("npm", ["pack", pkg, "--pack-destination", destDir], destDir, 300_000);
	const tgz = stdout.trim().split("\n").pop()!.trim();
	const tgzPath = path.isAbsolute(tgz) ? tgz : path.join(destDir, tgz);
	await run("tar", ["-xzf", tgzPath, "-C", destDir]);
	return path.join(destDir, "package");
}

async function walkFiles(dir: string, pred: (name: string) => boolean): Promise<string[]> {
	const out: string[] = [];
	async function walk(abs: string) {
		let entries;
		try {
			entries = await fs.readdir(abs, { withFileTypes: true });
		} catch {
			return;
		}
		for (const ent of entries) {
			const next = path.join(abs, ent.name);
			if (ent.isDirectory()) {
				if (ent.name === "node_modules" || ent.name === ".git") continue;
				await walk(next);
			} else if (pred(ent.name)) {
				out.push(next);
			}
		}
	}
	await walk(dir);
	return out;
}

async function importWithicons(): Promise<ReportEntry> {
	const label = "With Icons";
	const setId = "withicons";
	const source = "https://www.npmjs.com/package/@withicons/static";
	console.log(`→ ${label}`);
	try {
		const pkg = await npmPack("@withicons/static", path.join(TMP, "withicons-static"));
		const license = await fs.readFile(path.join(pkg, "LICENSE"), "utf8").catch(() => "MIT");
		if (!/MIT/i.test(license) && !/Permission is hereby granted/i.test(license)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "npm package LICENSE is not MIT",
			};
		}
		const svgRoot = path.join(pkg, "dist/svg");
		const files = await walkFiles(svgRoot, (n) => n.toLowerCase().endsWith(".svg"));
		const items: NamedSvg[] = [];
		for (const abs of files) {
			const rel = path.relative(svgRoot, abs);
			const parts = rel.split(path.sep);
			if (parts.length < 2) continue;
			const style = parts[0]!;
			const name = path.basename(parts[parts.length - 1]!, ".svg");
			const svg = await fs.readFile(abs, "utf8");
			if (!svg.includes("<svg")) continue;
			items.push({ name, svg, style });
		}
		const packed = await materialize(setId, items);
		return {
			label,
			source: "https://github.com/withevergrow/withicons",
			setId,
			license: "MIT",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
			// Standalone SVGs from @withicons/static are static; motion lives in other packages.
			animated: packed.animated,
			note: packed.count
				? `from @withicons/static (${packed.count.toLocaleString()} standalone SVGs)`
				: "no SVGs in @withicons/static",
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importReiconGlass(): Promise<ReportEntry> {
	const label = "Reicon Glass";
	const setId = "reicon-glass";
	const source = "https://github.com/dqev/reicon-glass";
	console.log(`→ ${label}`);
	try {
		const root = await sparseClone("dqev/reicon-glass", "main", ["apps/web/src/data"]);
		const readme = await fetchGithubRaw("dqev/reicon-glass", "main", "README.md");
		if (!/MIT License|under the \[MIT License\]|License-MIT/i.test(readme)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "README does not clearly grant MIT; no LICENSE file in repo",
			};
		}
		const data = JSON.parse(
			await fs.readFile(path.join(root, "apps/web/src/data/icon-data.json"), "utf8"),
		) as { categories: Record<string, Record<string, { code?: string; tags?: string[] }>> };
		const items: NamedSvg[] = [];
		const used = new Set<string>();
		for (const [category, icons] of Object.entries(data.categories ?? {})) {
			for (const [name, icon] of Object.entries(icons ?? {})) {
				const code = icon?.code?.trim();
				if (!code || !/<path\b/i.test(code)) continue;
				let base = kebab(name);
				if (!base) continue;
				let final = base;
				let n = 2;
				while (used.has(final)) {
					final = `${base}-${n}`;
					n++;
				}
				used.add(final);
				const body = code.includes("<") ? code : `<path d="${code}" fill="currentColor"/>`;
				items.push({
					name: final,
					svg: wrapSvg(body, "0 0 24 24", 'fill="currentColor"'),
					style: "solid",
				});
				void category;
			}
		}
		const packed = await materialize(setId, items);
		return {
			label,
			source,
			setId,
			license: "MIT (README; no LICENSE file)",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
			note: "Path glyphs from icon-data.json; glass runtime effect is site-only",
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "MIT (README)",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importObra(): Promise<ReportEntry> {
	const label = "Obra Icons";
	const setId = "obra-icons";
	const source = "https://github.com/Obra-Studio/obra-icons-mr";
	console.log(`→ ${label}`);
	try {
		const root = await sparseClone("Obra-Studio/obra-icons-mr", "main", [
			"packages/website/src/lib/svgs",
		]);
		const license = await fetchGithubRaw(
			"Obra-Studio/obra-icons-mr",
			"main",
			"packages/obra-icons-react/LICENSE.md",
		);
		if (!/MIT/i.test(license)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "package LICENSE.md is not MIT",
			};
		}
		const svgDir = path.join(root, "packages/website/src/lib/svgs");
		const files = await walkFiles(svgDir, (n) => n.toLowerCase().endsWith(".svg"));
		const items: NamedSvg[] = [];
		for (const abs of files) {
			const svg = await fs.readFile(abs, "utf8");
			if (!svg.includes("<svg")) continue;
			items.push({ name: path.basename(abs, ".svg"), svg, style: "line" });
		}
		const packed = await materialize(setId, items);
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importMeya(): Promise<ReportEntry> {
	const label = "Meya Icons";
	const setId = "meya-icons";
	const source = "https://github.com/nazmijavier/meya-icons";
	console.log(`→ ${label}`);
	try {
		const root = await sparseClone("nazmijavier/meya-icons", "main", ["icons"]);
		const license = await fetchGithubRaw("nazmijavier/meya-icons", "main", "LICENSE");
		if (!/MIT License/i.test(license)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "LICENSE is not MIT",
			};
		}
		const items: NamedSvg[] = [];
		for (const style of ["outline", "duotone"] as const) {
			const dir = path.join(root, "icons", style);
			const files = await walkFiles(dir, (n) => n.toLowerCase().endsWith(".svg"));
			for (const abs of files) {
				const svg = await fs.readFile(abs, "utf8");
				if (!svg.includes("<svg")) continue;
				items.push({ name: path.basename(abs, ".svg"), svg, style });
			}
		}
		const packed = await materialize(setId, items);
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importFinicon(): Promise<ReportEntry> {
	const label = "Finicon";
	const setId = "finicon";
	const source = "https://www.npmjs.com/package/finicon";
	console.log(`→ ${label}`);
	try {
		const pkg = await npmPack("finicon", path.join(TMP, "finicon-pkg"));
		const readme = await fs.readFile(path.join(pkg, "README.md"), "utf8");
		if (!/^## License\s*\n\s*MIT\b/im.test(readme) && !/\bMIT\b/.test(readme)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "README does not clearly grant MIT",
			};
		}
		const ttf = path.join(pkg, "dist/finicon.ttf");
		await fs.access(ttf);
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
    if name.startswith(".") or name.startswith("glyph"):
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
		const script = path.join(TMP, "finicon-font2svg.py");
		await fs.writeFile(script, py, "utf8");
		try {
			await run("python3", ["-c", "import fontTools"]);
		} catch {
			await run("python3", ["-m", "pip", "install", "--user", "fonttools"], undefined, 180_000);
		}
		const { stdout } = await run("python3", [script, ttf], undefined, 180_000);
		const rows = JSON.parse(stdout) as { name: string; svg: string }[];
		const items = rows.map((r) => ({ name: r.name, svg: r.svg, style: "solid" }));
		const packed = await materialize(setId, items);
		return {
			label,
			source,
			setId,
			license: "MIT (README)",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
			note: "Extracted from finicon.ttf in the npm package",
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "MIT (README)",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importIconimate(): Promise<ReportEntry> {
	const label = "Iconimate";
	const setId = "iconimate";
	const source = "https://github.com/smammar100/Iconimate";
	console.log(`→ ${label}`);
	try {
		const root = await sparseClone("smammar100/Iconimate", "main", ["registry/icons"]);
		const license = await fetchGithubRaw("smammar100/Iconimate", "main", "LICENSE");
		if (!/MIT License/i.test(license)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "LICENSE is not MIT",
			};
		}
		const files = await walkFiles(path.join(root, "registry/icons"), (n) =>
			n.endsWith(".tsx") && !n.startsWith("_"),
		);
		const items: NamedSvg[] = [];
		for (const abs of files) {
			const original = await fs.readFile(abs, "utf8");
			let raw = resolvePathConsts(original);
			const svgMatch = /<svg\b[\s\S]*?<\/svg>/i.exec(raw);
			let svg: string | null = null;
			if (svgMatch) {
				svg = cleanMotionSvg(svgMatch[0]);
			} else {
				const consts = [
					...original.matchAll(
						/(?:const|let|var)\s+[A-Z][A-Z0-9_]*\s*=\s*["'`]([^"'`]+)["'`]/g,
					),
				]
					.map((m) => m[1]!)
					.filter((d) => /[MLHVCSQTAZmlhvcsqtaz]/.test(d) && d.length > 8);
				if (consts.length) {
					const body = consts
						.map(
							(d) =>
								`<path d="${d}" fill="currentColor"/>`,
						)
						.join("");
					svg = wrapSvg(body, "0 0 256 256", 'fill="currentColor"');
				}
			}
			if (!svg) continue;
			if (!svg.includes("<path") && !svg.includes("<circle")) continue;
			if (/[{}$]/.test(svg.replace(/<style\b[\s\S]*?<\/style>/gi, ""))) continue;
			items.push({
				name: path.basename(abs, ".tsx"),
				svg,
				style: "solid",
			});
		}
		const packed = await materialize(setId, items);
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
			animated: packed.animated,
			note: "Static rest glyphs extracted from registry (Phosphor-grid geometry; animation omitted)",
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importItsHover(): Promise<ReportEntry> {
	const label = "Its Hover";
	const setId = "itshover";
	const source = "https://github.com/itshover/itshover";
	console.log(`→ ${label}`);
	try {
		const root = await sparseClone("itshover/itshover", "master", ["icons"]);
		const license = await fetchGithubRaw("itshover/itshover", "master", "LICENSE");
		if (!/Apache License/i.test(license)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "LICENSE is not Apache-2.0",
			};
		}
		const files = await walkFiles(
			path.join(root, "icons"),
			(n) =>
				n.endsWith(".tsx") &&
				!/^(types|index|animate|utils)\.tsx$/i.test(n) &&
				!n.endsWith(".d.ts"),
		);
		const items: NamedSvg[] = [];
		for (const abs of files) {
			let raw = await fs.readFile(abs, "utf8");
			raw = resolvePathConsts(raw);
			const svgMatch = /<(?:motion\.)?svg\b[\s\S]*?<\/(?:motion\.)?svg>/i.exec(raw);
			if (!svgMatch) continue;
			const svg = cleanMotionSvg(svgMatch[0]);
			if (!/<path\b/i.test(svg)) continue;
			if (/[{}$`]/.test(svg.replace(/<style\b[\s\S]*?<\/style>/gi, ""))) continue;
			const base = path
				.basename(abs, ".tsx")
				.replace(/-icon$/i, "")
				.replace(/-brand-logo$/i, "")
				.replace(/-logo$/i, "");
			items.push({ name: base, svg, style: "line" });
		}
		const packed = await materialize(setId, items);
		return {
			label,
			source,
			setId,
			license: "Apache-2.0",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
			animated: packed.animated,
			note: "Static SVG extracted from motion components (hover animation omitted)",
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "Apache-2.0",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importMxIcons(): Promise<ReportEntry> {
	const label = "MX Icons";
	const setId = "mx-icons";
	const source = "https://github.com/ig-imanish/mx-icons";
	console.log(`→ ${label}`);
	try {
		const root = await sparseClone("ig-imanish/mx-icons", "main", ["src/icons/components"]);
		const license = await fetchGithubRaw("ig-imanish/mx-icons", "main", "LICENSE");
		if (!/MIT License/i.test(license)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "LICENSE is not MIT",
			};
		}
		const files = await walkFiles(path.join(root, "src/icons/components"), (n) =>
			/\.jsx$/i.test(n) && !/^index\./i.test(n),
		);
		const styleSuffix =
			/(Bold|Broken|Bulk|Linear|Outline|Twotone)$/;
		const items: NamedSvg[] = [];
		for (const abs of files) {
			const file = path.basename(abs, ".jsx");
			const m = styleSuffix.exec(file);
			if (!m) continue;
			const style = kebab(m[1]!);
			const name = kebab(file.slice(0, -m[1]!.length));
			const raw = await fs.readFile(abs, "utf8");
			const bodyMatch =
				/<(?:Icon|BaseIcon)\b[^>]*>([\s\S]*?)<\/(?:Icon|BaseIcon)>/i.exec(raw) ??
				null;
			if (!bodyMatch) continue;
			let body = bodyMatch[1] ?? "";
			body = jsxAttrsToSvg(body)
				.replace(/\{\s*\.\.\.[^}]+\}/g, "")
				.replace(/\s[\w:-]+=\{[^}]+\}/g, "")
				.replace(/\{[^{}]*\}/g, "")
				.trim();
			const shapes = body.match(
				/<(?:path|rect|circle|ellipse|line|polyline|polygon)\b[^>]*\/?>/gi,
			);
			if (!shapes?.length) continue;
			const filled = /Bulk|Bold/i.test(m[1]!);
			const svg = wrapSvg(
				shapes.join(""),
				"0 0 24 24",
				filled
					? 'fill="currentColor"'
					: 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"',
			);
			items.push({ name, svg, style });
		}
		const packed = await materialize(setId, items);
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importKoven(): Promise<ReportEntry> {
	const label = "Animated Icons (Koven Labs)";
	const setId = "koven-animated-icons";
	const source = "https://github.com/kovenlabs/animated-icons";
	console.log(`→ ${label}`);
	try {
		const root = await sparseClone("kovenlabs/animated-icons", "main", [
			"packages/animated-icons/src/icons",
		]);
		const license =
			(await fetchGithubRaw(
				"kovenlabs/animated-icons",
				"main",
				"packages/animated-icons/LICENSE",
			).catch(() => "")) ||
			(await fetchGithubRaw("kovenlabs/animated-icons", "main", "LICENSE"));
		if (!/MIT License/i.test(license)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "LICENSE is not MIT",
			};
		}
		const files = await walkFiles(path.join(root, "packages/animated-icons/src/icons"), (n) =>
			n.endsWith(".tsx"),
		);
		const items: NamedSvg[] = [];
		for (const abs of files) {
			let raw = await fs.readFile(abs, "utf8");
			raw = resolvePathConsts(raw);
			const pathTags = [
				...raw.matchAll(/<path\b([^>]*?)\s*\/?>/gi),
			];
			const resolved: string[] = [];
			for (const m of pathTags) {
				let attrs = jsxAttrsToSvg(m[1] ?? "");
				attrs = attrs
					.replace(/\sdata-part="[^"]*"/g, "")
					.replace(/\sstyle=\{\{[\s\S]*?\}\}/g, "")
					.replace(/\s[\w:-]+=\{[^}]+\}/g, "")
					.replace(/\{[^{}]*\}/g, "")
					.trim();
				if (!/\bd="/i.test(attrs)) continue;
				if (!/\bfill=/i.test(attrs) && !/\bstroke=/i.test(attrs)) {
					attrs += ' fill="none" stroke="currentColor"';
				}
				resolved.push(`<path ${attrs} />`);
			}
			if (!resolved.length) {
				// Fall back to first path-like string constant.
				const d = /(?:const|let|var)\s+[A-Z][A-Z0-9_]*\s*=\s*["'`]([^"'`]+)["'`]/g.exec(
					await fs.readFile(abs, "utf8"),
				)?.[1];
				if (!d || !/[MLHVCSQTAZmlhvcsqtaz]/.test(d)) continue;
				resolved.push(
					`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`,
				);
			}
			items.push({
				name: path.basename(abs, ".tsx"),
				svg: wrapSvg(resolved.join(""), "0 0 24 24"),
				style: "line",
			});
		}
		const packed = await materialize(setId, items);
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
			animated: packed.animated,
			note: "Static path geometry extracted from React icon modules",
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "MIT",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

async function importSingularity(): Promise<ReportEntry> {
	const label = "Singularity Icons";
	const setId = "singularity-icons";
	const source = "https://github.com/singularityos-lab/singularity-themes";
	console.log(`→ ${label}`);
	try {
		const root = await sparseClone("singularityos-lab/singularity-themes", "main", ["Singularity"]);
		const license = await fetchGithubRaw(
			"singularityos-lab/singularity-themes",
			"main",
			"LICENSE",
		);
		if (!/GNU GENERAL PUBLIC LICENSE/i.test(license) || !/Version 3/i.test(license)) {
			return {
				label,
				source,
				setId,
				license: "unknown",
				status: "skipped",
				count: 0,
				note: "LICENSE is not GPL-3.0",
			};
		}
		// Aria already vendors other GPL desktop themes (e.g. Papirus). Keep color + symbolic.
		const files = await walkFiles(path.join(root, "Singularity"), (n) =>
			n.toLowerCase().endsWith(".svg"),
		);
		const items: NamedSvg[] = [];
		const seen = new Map<string, string>();
		for (const abs of files) {
			const rel = path.relative(path.join(root, "Singularity"), abs);
			if (/\/(cursors?|previews?|templates?)(\/|$)/i.test(rel)) continue;
			const base = path.basename(abs, ".svg");
			const symbolic = /\/symbolic\//i.test(rel) || /-symbolic$/i.test(base);
			const name = base.replace(/-symbolic$/i, "");
			const style = symbolic ? "symbolic" : "color";
			const key = `${style}:${name}`;
			// Prefer scalable/ over sized raster-adjacent copies.
			const rank = /\/scalable\//i.test(rel) ? 0 : rel.length;
			const prev = seen.get(key);
			if (prev != null && Number(prev) <= rank) continue;
			seen.set(key, String(rank));
			const svg = await fs.readFile(abs, "utf8");
			if (!svg.includes("<svg")) continue;
			items.push({ name, svg, style });
		}
		// Dedupe keeping best rank: rebuild from last write wins with rank check above imperfectly.
		const best = new Map<string, NamedSvg>();
		for (const item of items) {
			best.set(`${item.style}:${item.name}`, item);
		}
		const packed = await materialize(setId, [...best.values()]);
		return {
			label,
			source,
			setId,
			license: "GPL-3.0",
			status: packed.count ? "ok" : "empty",
			count: packed.count,
			styles: packed.styles,
			note: "Desktop icon theme; GPL-3.0 like other Linux themes already in Aria (e.g. Papirus)",
		};
	} catch (err) {
		return {
			label,
			source,
			setId,
			license: "GPL-3.0",
			status: "error",
			count: 0,
			note: err instanceof Error ? err.message : String(err),
		};
	}
}

function skipped(label: string, source: string, setId: string, license: string, note: string): ReportEntry {
	return { label, source, setId, license, status: "skipped", count: 0, note };
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
\t\thomepage: "${entry.source.replace(/"/g, '\\"')}",
\t\tstyles: [
${styles}
\t\t],
\t},`;
}

async function register(ok: ReportEntry[]) {
	if (!ok.length) return;
	let src = await fs.readFile(ICON_SETS_FILE, "utf8");
	const end = src.indexOf("\t// P0_FAMILIES_END");
	if (end === -1) throw new Error("icon-sets.ts: P0_FAMILIES_END not found");
	const fresh = ok.filter((e) => !src.includes(`id: "${e.setId}"`));
	if (fresh.length) {
		src = `${src.slice(0, end)}${fresh.map(renderSet).join("\n")}\n${src.slice(end)}`;
		await fs.writeFile(ICON_SETS_FILE, src, "utf8");
	}
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

type Importer = () => Promise<ReportEntry>;

const IMPORTERS: { id: string; run: Importer }[] = [
	{ id: "withicons", run: importWithicons },
	{ id: "reicon-glass", run: importReiconGlass },
	{
		id: "3dicons",
		run: async () =>
			skipped(
				"3dicons",
				"https://github.com/realvjy/3dicons",
				"3dicons",
				"CC0-1.0",
				"No usable static SVGs — pack is 3D raster/Blender renders (previously added then removed for blurred artwork)",
			),
	},
	{ id: "obra-icons", run: importObra },
	{ id: "meya-icons", run: importMeya },
	{ id: "finicon", run: importFinicon },
	{ id: "iconimate", run: importIconimate },
	{
		id: "morphicons",
		run: async () =>
			skipped(
				"Morphicons",
				"https://github.com/guillermolg00/morphicons",
				"morphicons",
				"MIT",
				"Morphing library, not an icon pack; Aria already depends on morphicons for stroke morphing",
			),
	},
	{ id: "itshover", run: importItsHover },
	{ id: "mx-icons", run: importMxIcons },
	{ id: "koven-animated-icons", run: importKoven },
	{ id: "singularity-icons", run: importSingularity },
];

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
	let report: Record<string, ReportEntry> = {};
	try {
		report = JSON.parse(await fs.readFile(REPORT, "utf8")) as Record<string, ReportEntry>;
	} catch {
		report = {};
	}

	for (const item of IMPORTERS) {
		if (only && !only.has(item.id)) continue;
		if (!force && report[item.id]?.status === "ok") {
			console.log(`• ${item.id} already imported (${report[item.id]!.count})`);
			continue;
		}
		const entry = await item.run();
		report[item.id] = entry;
		if (entry.status === "ok") {
			console.log(`  ${entry.count.toLocaleString()} icons${entry.note ? ` — ${entry.note}` : ""}`);
		} else {
			console.log(`  ${entry.status} — ${entry.note ?? ""}`);
		}
		await fs.writeFile(REPORT, JSON.stringify(report, null, 2), "utf8");
	}

	const ok = Object.values(report).filter(
		(e) => e.status === "ok" && (e.styles?.length ?? 0) > 0,
	);
	await register(ok);

	const added = ok.reduce((n, e) => n + e.count, 0);
	console.log(
		`Done. ${ok.length} families added (${added.toLocaleString()} icons). Skipped: ${
			Object.values(report).filter((e) => e.status === "skipped").length
		}. Empty: ${Object.values(report).filter((e) => e.status === "empty").length}. Errors: ${
			Object.values(report).filter((e) => e.status === "error").length
		}.`,
	);
	console.log(`Report: ${REPORT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
