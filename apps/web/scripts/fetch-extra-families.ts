/**
 * Import open icon families that are not on Iconify.
 *
 * Writes loose SVGs under icons/<setId>/, ready for `bun run pack:icons -- --only vendored --delete`.
 *
 * Skipped on purpose (license forbids redistributing the pack, or no SVG source):
 * Untitled UI, Iconsax, Iconizer, Shopify Polaris, Susty (empty repo),
 * Elastic EUI (Elastic License), AWS/Azure architecture packs, Tetrisly, Doodle Icons.
 *
 * Run from apps/web: bun run fetch:extra
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ICONS_ROOT = path.join(process.cwd(), "icons");
const TMP = path.join(os.tmpdir(), "aria-extra-icons");

function kebab(input: string) {
	return input
		.replace(/\.svg$/i, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[_\s]+/g, "-")
		.replace(/[^a-z0-9-]+/gi, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase();
}

async function writeSvg(dir: string, name: string, svg: string, used: Set<string>) {
	let base = kebab(name);
	if (!base) return;
	let file = `${base}.svg`;
	let n = 2;
	while (used.has(file)) {
		file = `${base}-${n}.svg`;
		n++;
	}
	used.add(file);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, file), svg.trim() + "\n", "utf8");
}

async function sparseClone(repo: string, branch: string, folders: string[]) {
	const name = repo.split("/")[1]!;
	const dest = path.join(TMP, name);
	await fs.rm(dest, { recursive: true, force: true });
	await execFileAsync("git", [
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
	await execFileAsync("git", ["sparse-checkout", "set", ...folders], { cwd: dest });
	return dest;
}

async function download(url: string, dest: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`);
	await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function copySvgTree(srcDir: string, destDir: string, used: Set<string>) {
	const entries = await fs.readdir(srcDir, { withFileTypes: true });
	let count = 0;
	for (const ent of entries) {
		const abs = path.join(srcDir, ent.name);
		if (ent.isDirectory()) {
			count += await copySvgTree(abs, destDir, used);
			continue;
		}
		if (!ent.name.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(abs, "utf8");
		if (!raw.includes("<svg")) continue;
		await writeSvg(destDir, ent.name, raw, used);
		count++;
	}
	return count;
}

function classifyAtlasGlyph(name: string, all: Set<string>) {
	for (const weight of ["thin", "bold"] as const) {
		const suffix = `-${weight}`;
		if (!name.endsWith(suffix) || name === weight) continue;
		const stem = name.slice(0, -suffix.length).replace(/-+$/g, "");
		if (!stem) continue;
		if (
			all.has(stem) ||
			all.has(`${stem}-thin`) ||
			all.has(`${stem}-bold`) ||
			all.has(`${stem}--thin`) ||
			all.has(`${stem}--bold`)
		) {
			return { weight, stem };
		}
	}
	return { weight: "regular" as const, stem: name };
}

async function importAtlas() {
	console.log("→ Atlas Icons");
	const repo = await sparseClone("Vectopus/Atlas-icons-font", "main", ["packs"]);
	const destRoot = path.join(ICONS_ROOT, "atlas-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	const glyphs: { name: string; d: string }[] = [];
	const packs = path.join(repo, "packs");
	for (const pack of await fs.readdir(packs)) {
		const fontDir = path.join(packs, pack, "fonts");
		let files: string[] = [];
		try {
			files = await fs.readdir(fontDir);
		} catch {
			continue;
		}
		for (const file of files) {
			if (!file.endsWith(".svg")) continue;
			const raw = await fs.readFile(path.join(fontDir, file), "utf8");
			const glyphRe = /<glyph\b([^>]*)\/>/g;
			let match: RegExpExecArray | null;
			while ((match = glyphRe.exec(raw))) {
				const attrs = match[1] ?? "";
				const name = /glyph-name="([^"]+)"/.exec(attrs)?.[1];
				const d = /(?:^|\s)d="([^"]+)"/.exec(attrs)?.[1];
				if (!name || !d) continue;
				glyphs.push({ name, d });
			}
		}
	}
	const all = new Set(glyphs.map((g) => g.name));
	const used = new Map<string, Set<string>>();
	let count = 0;
	for (const glyph of glyphs) {
		const { weight, stem } = classifyAtlasGlyph(glyph.name, all);
		const dir = path.join(destRoot, weight);
		const set = used.get(weight) ?? new Set<string>();
		used.set(weight, set);
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor"><g transform="translate(0 960) scale(1 -1)"><path d="${glyph.d}"/></g></svg>`;
		await writeSvg(dir, stem, svg, set);
		count++;
	}
	console.log(`  ${count.toLocaleString()} glyphs`);
}

async function importFlat(
	label: string,
	repo: string,
	branch: string,
	sparse: string[],
	srcRel: string,
	setId: string,
	styleDir = ".",
) {
	console.log(`→ ${label}`);
	const root = await sparseClone(repo, branch, sparse);
	const dest = path.join(ICONS_ROOT, setId, styleDir);
	await fs.rm(path.join(ICONS_ROOT, setId), { recursive: true, force: true });
	const count = await copySvgTree(path.join(root, srcRel), dest, new Set());
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importSvgl() {
	console.log("→ SVGL");
	const root = await sparseClone("pheralb/svgl", "main", ["static/library"]);
	const destRoot = path.join(ICONS_ROOT, "svgl");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = {
		color: new Set<string>(),
		light: new Set<string>(),
		dark: new Set<string>(),
	};
	const files = await fs.readdir(path.join(root, "static/library"));
	let count = 0;
	for (const file of files) {
		if (!file.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(path.join(root, "static/library", file), "utf8");
		if (!raw.includes("<svg")) continue;
		let style: "color" | "light" | "dark" = "color";
		let name = file;
		if (/-light\.svg$/i.test(file)) {
			style = "light";
			name = file.replace(/-light\.svg$/i, ".svg");
		} else if (/-dark\.svg$/i.test(file)) {
			style = "dark";
			name = file.replace(/-dark\.svg$/i, ".svg");
		}
		await writeSvg(path.join(destRoot, style), name, raw, used[style]);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importBrowserLogos() {
	console.log("→ Browser Logos");
	const root = await sparseClone("alrra/browser-logos", "main", ["src"]);
	const dest = path.join(ICONS_ROOT, "browser-logos");
	await fs.rm(dest, { recursive: true, force: true });
	const used = new Set<string>();
	let count = 0;
	async function walk(dir: string) {
		for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
			const abs = path.join(dir, ent.name);
			if (ent.isDirectory()) {
				if (ent.name === "archive") continue;
				await walk(abs);
				continue;
			}
			if (!ent.name.toLowerCase().endsWith(".svg")) continue;
			const raw = await fs.readFile(abs, "utf8");
			if (!raw.includes("<svg")) continue;
			await writeSvg(dest, ent.name, raw, used);
			count++;
		}
	}
	await walk(path.join(root, "src"));
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importPayment() {
	console.log("→ Payment Icons");
	const root = await sparseClone("aaronfagan/svg-credit-card-payment-icons", "main", [
		"flat",
		"flat-rounded",
		"logo",
		"logo-border",
		"mono",
		"mono-outline",
	]);
	const destRoot = path.join(ICONS_ROOT, "payment-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const style of ["flat", "flat-rounded", "logo", "logo-border", "mono", "mono-outline"]) {
		count += await copySvgTree(path.join(root, style), path.join(destRoot, style), new Set());
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importIconic() {
	console.log("→ ICONIC");
	const root = await sparseClone("YuheshPandian/ICONIC", "main", ["icons"]);
	const destRoot = path.join(ICONS_ROOT, "iconic");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const style of ["dark", "light"]) {
		count += await copySvgTree(
			path.join(root, "icons", style),
			path.join(destRoot, style),
			new Set(),
		);
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

function spectrumName(file: string) {
	return file
		.replace(/\.svg$/i, "")
		.replace(/^S\d+_Icon_/i, "")
		.replace(/_\d+_[A-Za-z]+$/, "");
}

async function importSpectrum() {
	console.log("→ Adobe Spectrum");
	const root = await sparseClone("adobe/spectrum-css-workflow-icons", "main", ["icons/assets/svg"]);
	const dest = path.join(ICONS_ROOT, "spectrum-icons");
	await fs.rm(dest, { recursive: true, force: true });
	const used = new Set<string>();
	const src = path.join(root, "icons/assets/svg");
	let count = 0;
	for (const file of await fs.readdir(src)) {
		if (!file.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(path.join(src, file), "utf8");
		if (!raw.includes("<svg")) continue;
		await writeSvg(dest, spectrumName(file), raw, used);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importBlueprint() {
	console.log("→ Blueprint");
	const tgz = path.join(TMP, "blueprint-icons.tgz");
	await download("https://registry.npmjs.org/@blueprintjs/icons/-/icons-6.14.1.tgz", tgz);
	const extract = path.join(TMP, "blueprint-icons");
	await fs.rm(extract, { recursive: true, force: true });
	await fs.mkdir(extract, { recursive: true });
	await execFileAsync("tar", ["-xzf", tgz, "-C", extract]);
	const destRoot = path.join(ICONS_ROOT, "blueprint-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const size of ["16", "20"]) {
		const dir = path.join(extract, "package/lib/esm/generated", `${size}px`, "paths");
		const used = new Set<string>();
		for (const file of await fs.readdir(dir)) {
			if (!file.endsWith(".js")) continue;
			const raw = await fs.readFile(path.join(dir, file), "utf8");
			const body = /export default (\[[\s\S]*?\]);/.exec(raw)?.[1];
			if (!body) continue;
			const paths = JSON.parse(body) as string[];
			const d = paths
				.map((p) => `<path d="${p}"/>`)
				.join("");
			const vb = size === "16" ? "0 0 16 16" : "0 0 20 20";
			const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="currentColor">${d}</svg>`;
			await writeSvg(path.join(destRoot, size), file.replace(/\.js$/, ""), svg, used);
			count++;
		}
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importPatternfly() {
	console.log("→ PatternFly");
	const url =
		"https://raw.githubusercontent.com/patternfly/patternfly/main/src/icons/definitions/pficons.mjs";
	const res = await fetch(url);
	if (!res.ok) throw new Error(`PatternFly download failed ${res.status}`);
	const raw = await res.text();
	const json = raw.replace(/^export const pfIcons = /, "").replace(/;\s*$/, "");
	const icons = JSON.parse(json) as Record<
		string,
		{ width: number; height: number; svgPathData: string | string[] }
	>;
	const dest = path.join(ICONS_ROOT, "patternfly-icons");
	await fs.rm(dest, { recursive: true, force: true });
	const used = new Set<string>();
	let count = 0;
	for (const [name, icon] of Object.entries(icons)) {
		const paths = Array.isArray(icon.svgPathData) ? icon.svgPathData : [icon.svgPathData];
		const d = paths.map((p) => `<path d="${p}"/>`).join("");
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width} ${icon.height}" fill="currentColor">${d}</svg>`;
		await writeSvg(dest, name, svg, used);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importAtlaskit() {
	console.log("→ Atlaskit");
	const tgz = path.join(TMP, "atlaskit-icon.tgz");
	await download("https://registry.npmjs.org/@atlaskit/icon/-/icon-38.0.1.tgz", tgz);
	const extract = path.join(TMP, "atlaskit-icon");
	await fs.rm(extract, { recursive: true, force: true });
	await fs.mkdir(extract, { recursive: true });
	await execFileAsync("tar", ["-xzf", tgz, "-C", extract]);
	const src = path.join(extract, "package/svgs");
	const destRoot = path.join(ICONS_ROOT, "atlaskit-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = new Map<string, Set<string>>();
	let count = 0;
	async function walk(dir: string, style: string) {
		for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
			const abs = path.join(dir, ent.name);
			if (ent.isDirectory()) {
				await walk(abs, style === "root" ? ent.name : style);
				continue;
			}
			if (!ent.name.toLowerCase().endsWith(".svg")) continue;
			const bucket = style === "root" ? "core" : style;
			const raw = await fs.readFile(abs, "utf8");
			if (!raw.includes("<svg")) continue;
			const set = used.get(bucket) ?? new Set<string>();
			used.set(bucket, set);
			await writeSvg(path.join(destRoot, bucket), ent.name, raw, set);
			count++;
		}
	}
	await walk(src, "root");
	console.log(`  ${count.toLocaleString()} icons`);
}

async function main() {
	await fs.mkdir(TMP, { recursive: true });
	await importAtlas();
	await importFlat(
		"Dashboard Icons",
		"homarr-labs/dashboard-icons",
		"main",
		["svg"],
		"svg",
		"dashboard-icons",
	);
	await importSvgl();
	await importFlat(
		"Lobe Icons",
		"lobehub/lobe-icons",
		"master",
		["packages/static-svg/icons"],
		"packages/static-svg/icons",
		"lobe-icons",
	);
	await importFlat(
		"Super Tiny Icons",
		"edent/SuperTinyIcons",
		"master",
		["images/svg"],
		"images/svg",
		"super-tiny-icons",
	);
	await importBrowserLogos();
	await importFlat(
		"Themify Icons",
		"lykmapipo/themify-icons",
		"master",
		["SVG"],
		"SVG",
		"themify-icons",
	);
	await importSpectrum();
	await importBlueprint();
	await importPatternfly();
	await importAtlaskit();
	await importPayment();
	await importFlat("Trinil", "5e1y/trinil", "main", ["svg"], "svg", "trinil");
	await importFlat("Vivid", "webkul/vivid", "master", ["icons"], "icons", "vivid");
	await importFlat(
		"Fork Awesome",
		"ForkAwesome/Fork-Awesome",
		"master",
		["src/icons/svg"],
		"src/icons/svg",
		"fork-awesome",
	);
	await importIconic();
	await importFlat(
		"Country Flag Icons",
		"catamphetamine/country-flag-icons",
		"master",
		["flags/3x2"],
		"flags/3x2",
		"country-flag-icons",
	);
	console.log("Done.");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
