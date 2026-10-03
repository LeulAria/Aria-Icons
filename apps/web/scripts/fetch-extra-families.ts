/**
 * Import open icon families that are not on Iconify.
 *
 * Writes loose SVGs under icons/<setId>/, ready for `bun run pack:icons -- --only vendored --delete`.
 *
 * Skipped on purpose (license forbids redistributing the pack, or no SVG source):
 * Untitled UI (no redistribute), Iconsax, Iconizer, Shopify Polaris, Susty (empty),
 * Elastic EUI (Elastic License), AWS/Azure architecture packs, Tetrisly (no SVG assets),
 * Scaleflex (personal-use-only), 3dicons (raster), React Kawaii (illustration components),
 * Moving Icons / Its Hover / LivelyIcons / useAnimations (animated TSX/JSON, not static SVG),
 * Geist Icons (archived; source blob not usable), Oxygen UI (only a handful of brand SVGs).
 * Doodle / Eyecons / Next Icons: --batch2-tsx (TSX→SVG extract).
 *
 * Run from apps/web:
 *   bun run fetch:extra           # original batch
 *   bun run fetch:extra -- --related
 *   bun run fetch:extra -- --batch2
 *   bun run fetch:extra -- --batch2-tsx
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

async function importCloudscape() {
	console.log("→ Cloudscape");
	const root = await sparseClone("cloudscape-design/components", "main", ["src/icon/icons"]);
	const dest = path.join(ICONS_ROOT, "cloudscape-icons");
	await fs.rm(dest, { recursive: true, force: true });
	const count = await copySvgTree(path.join(root, "src/icon/icons"), dest, new Set());
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importSemi() {
	console.log("→ Semi Icons");
	const root = await sparseClone("DouyinFE/semi-design", "main", ["packages/semi-icons/src/svgs"]);
	const destRoot = path.join(ICONS_ROOT, "semi-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = { line: new Set<string>(), solid: new Set<string>() };
	const src = path.join(root, "packages/semi-icons/src/svgs");
	let count = 0;
	for (const file of await fs.readdir(src)) {
		if (!file.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(path.join(src, file), "utf8");
		if (!raw.includes("<svg")) continue;
		const stroked = /_stroked\.svg$/i.test(file);
		const name = file.replace(/_stroked\.svg$/i, ".svg");
		await writeSvg(path.join(destRoot, stroked ? "line" : "solid"), name, raw, used[stroked ? "line" : "solid"]);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importArco() {
	console.log("→ Arco Icons");
	const root = await sparseClone("arco-design/arco-design", "main", ["icon/_svgs"]);
	const destRoot = path.join(ICONS_ROOT, "arco-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = new Map<string, Set<string>>();
	let count = 0;
	async function walk(dir: string) {
		for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
			const abs = path.join(dir, ent.name);
			if (ent.isDirectory()) {
				await walk(abs);
				continue;
			}
			if (!ent.name.toLowerCase().endsWith(".svg")) continue;
			const rel = path.relative(path.join(root, "icon/_svgs"), abs);
			const parts = rel.split(path.sep);
			const style = parts.length > 1 ? parts[parts.length - 2]! : "outline";
			const bucket = style === "outline" || style === "fill" || style === "color" ? style : "outline";
			const raw = await fs.readFile(abs, "utf8");
			if (!raw.includes("<svg")) continue;
			const set = used.get(bucket) ?? new Set<string>();
			used.set(bucket, set);
			await writeSvg(path.join(destRoot, bucket), ent.name, raw, set);
			count++;
		}
	}
	await walk(path.join(root, "icon/_svgs"));
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importEvil() {
	console.log("→ Evil Icons");
	const root = await sparseClone("evil-icons/evil-icons", "master", ["assets/icons"]);
	const dest = path.join(ICONS_ROOT, "evil-icons");
	await fs.rm(dest, { recursive: true, force: true });
	const used = new Set<string>();
	const src = path.join(root, "assets/icons");
	let count = 0;
	for (const file of await fs.readdir(src)) {
		if (!file.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(path.join(src, file), "utf8");
		if (!raw.includes("<svg")) continue;
		await writeSvg(dest, file.replace(/^ei-/i, ""), raw, used);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importHomelab() {
	console.log("→ Homelab Icons");
	const root = await sparseClone("loganmarchione/homelab-svg-assets", "main", ["assets"]);
	const dest = path.join(ICONS_ROOT, "homelab-icons");
	await fs.rm(dest, { recursive: true, force: true });
	const count = await copySvgTree(path.join(root, "assets"), dest, new Set());
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importMuffinPayment() {
	console.log("→ Payment Icons (MPL)");
	const root = await sparseClone("muffinresearch/payment-icons", "master", ["svg"]);
	const destRoot = path.join(ICONS_ROOT, "muffin-payment-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const style of ["flat", "mono", "outline", "single"]) {
		count += await copySvgTree(
			path.join(root, "svg", style),
			path.join(destRoot, style),
			new Set(),
		);
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importEmblemicons() {
	console.log("→ Emblemicons");
	const root = await sparseClone("emblemicons/emblemicons", "master", ["assets/svg"]);
	const destRoot = path.join(ICONS_ROOT, "emblemicons");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = { line: new Set<string>(), solid: new Set<string>() };
	let count = 0;
	for (const file of await fs.readdir(path.join(root, "assets/svg"))) {
		if (!file.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(path.join(root, "assets/svg", file), "utf8");
		if (!raw.includes("<svg")) continue;
		const filled = /-fill\.svg$/i.test(file);
		const name = file.replace(/-fill\.svg$/i, ".svg");
		await writeSvg(
			path.join(destRoot, filled ? "solid" : "line"),
			name,
			raw,
			used[filled ? "solid" : "line"],
		);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importProxicons() {
	console.log("→ ProXIcons");
	const root = await sparseClone("ProgrammerKR/ProXIcons", "main", ["svg"]);
	const destRoot = path.join(ICONS_ROOT, "proxicons");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const style of ["regular", "solid", "logos"] as const) {
		const used = new Set<string>();
		const src = path.join(root, "svg", style);
		for (const file of await fs.readdir(src)) {
			if (!file.toLowerCase().endsWith(".svg")) continue;
			const raw = await fs.readFile(path.join(src, file), "utf8");
			if (!raw.includes("<svg")) continue;
			const name = file.replace(/^px[ls]?-/i, "");
			await writeSvg(path.join(destRoot, style), name, raw, used);
			count++;
		}
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importFinmarks() {
	console.log("→ Finmarks");
	const root = await sparseClone("Finmarks/finmarks", "main", ["entities"]);
	const destRoot = path.join(ICONS_ROOT, "finmarks");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = { icon: new Set<string>(), full: new Set<string>() };
	let count = 0;
	const entities = path.join(root, "entities");
	for (const ent of await fs.readdir(entities, { withFileTypes: true })) {
		if (!ent.isDirectory()) continue;
		for (const style of ["icon", "full"] as const) {
			const file = path.join(entities, ent.name, `${style}.svg`);
			try {
				const raw = await fs.readFile(file, "utf8");
				if (!raw.includes("<svg")) continue;
				await writeSvg(path.join(destRoot, style), ent.name, raw, used[style]);
				count++;
			} catch {
				/* missing variant */
			}
		}
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importPaymentFont() {
	console.log("→ PaymentFont");
	const root = await sparseClone("AlexanderPoellmann/PaymentFont", "master", ["fonts"]);
	const dest = path.join(ICONS_ROOT, "paymentfont");
	await fs.rm(dest, { recursive: true, force: true });
	const used = new Set<string>();
	const raw = await fs.readFile(path.join(root, "fonts/paymentfont-webfont.svg"), "utf8");
	const glyphRe = /<glyph\b([^>]*)\/?>/g;
	let match: RegExpExecArray | null;
	let count = 0;
	while ((match = glyphRe.exec(raw))) {
		const attrs = match[1] ?? "";
		const name = /glyph-name="([^"]+)"/.exec(attrs)?.[1];
		const d = /(?:^|\s)d="([^"]+)"/.exec(attrs)?.[1];
		if (!name || !d) continue;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" fill="currentColor"><g transform="translate(0 960) scale(1 -1)"><path d="${d}"/></g></svg>`;
		await writeSvg(dest, name, svg, used);
		count++;
	}
	console.log(`  ${count.toLocaleString()} glyphs`);
}

async function importDooIconik() {
	console.log("→ doo-iconik");
	const root = await sparseClone("ajentik/doo-iconik", "main", ["packages/core/src"]);
	const dest = path.join(ICONS_ROOT, "doo-iconik");
	await fs.rm(dest, { recursive: true, force: true });
	const used = new Set<string>();
	const raw = await fs.readFile(path.join(root, "packages/core/src/icon-data.ts"), "utf8");
	const entryRe =
		/"([^"]+)":\s*\{\s*viewBox:\s*"([^"]+)",\s*paths:\s*\[([^\]]*)\]([\s\S]*?)(?=\n\s*"[^"]+":\s*\{|\n\};)/g;
	let match: RegExpExecArray | null;
	let count = 0;
	while ((match = entryRe.exec(raw))) {
		const name = match[1]!;
		const viewBox = match[2]!;
		const pathsBlock = match[3]!;
		const rest = match[4] ?? "";
		const paths = [...pathsBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
		if (paths.length === 0) continue;
		const body = paths.map((d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
		const circles = [...rest.matchAll(/\{\s*cx:\s*([\d.]+),\s*cy:\s*([\d.]+),\s*r:\s*([\d.]+)\s*\}/g)]
			.map((m) => `<circle cx="${m[1]}" cy="${m[2]}" r="${m[3]}" fill="none" stroke="currentColor" stroke-width="1.5"/>`)
			.join("");
		const lines = [
			...rest.matchAll(
				/\{\s*x1:\s*([\d.]+),\s*y1:\s*([\d.]+),\s*x2:\s*([\d.]+),\s*y2:\s*([\d.]+)\s*\}/g,
			),
		]
			.map(
				(m) =>
					`<line x1="${m[1]}" y1="${m[2]}" x2="${m[3]}" y2="${m[4]}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
			)
			.join("");
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">${body}${circles}${lines}</svg>`;
		await writeSvg(dest, name, svg, used);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importVkIcons() {
	console.log("→ VK Icons");
	const root = await sparseClone("VKCOM/icons", "master", ["packages/icons/src/svg"]);
	const destRoot = path.join(ICONS_ROOT, "vk-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	const svgRoot = path.join(root, "packages/icons/src/svg");
	for (const size of await fs.readdir(svgRoot)) {
		const abs = path.join(svgRoot, size);
		const st = await fs.stat(abs);
		if (!st.isDirectory()) continue;
		count += await copySvgTree(abs, path.join(destRoot, size), new Set());
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importFlightIcons() {
	console.log("→ HashiCorp Flight Icons");
	const root = await sparseClone("hashicorp/design-system", "main", [
		"packages/flight-icons/svg",
	]);
	const destRoot = path.join(ICONS_ROOT, "flight-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = {
		"16": new Set<string>(),
		"24": new Set<string>(),
	};
	let count = 0;
	const src = path.join(root, "packages/flight-icons/svg");
	for (const file of await fs.readdir(src)) {
		if (!file.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(path.join(src, file), "utf8");
		if (!raw.includes("<svg")) continue;
		const size = file.endsWith("-24.svg") ? "24" : "16";
		const name = file.replace(/-1[64]\.svg$/i, "");
		await writeSvg(path.join(destRoot, size), name, raw, used[size]);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importKendo() {
	console.log("→ Kendo SVG Icons");
	const root = await sparseClone("telerik/kendo-icons", "develop", ["src/telerik-icons"]);
	const destRoot = path.join(ICONS_ROOT, "kendo-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const style of ["outline", "solid", "duotone"]) {
		count += await copySvgTree(
			path.join(root, "src/telerik-icons", style),
			path.join(destRoot, style),
			new Set(),
		);
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importSwm() {
	console.log("→ SWM Icon Pack");
	const root = await sparseClone("software-mansion-labs/swm-icon-pack-react", "main", [
		"icons",
	]);
	const destRoot = path.join(ICONS_ROOT, "swm-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const style of ["outline", "curved", "broken"]) {
		try {
			count += await copySvgTree(
				path.join(root, "icons", style),
				path.join(destRoot, style),
				new Set(),
			);
		} catch {
			/* style missing */
		}
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importJedd() {
	console.log("→ Jedd Icons");
	const root = await sparseClone("jedd-labs/jedd-icons", "main", ["icons"]);
	const destRoot = path.join(ICONS_ROOT, "jedd-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const style of ["stroke", "fill"]) {
		count += await copySvgTree(
			path.join(root, "icons", style),
			path.join(destRoot, style),
			new Set(),
		);
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importGlobalBankLogos() {
	console.log("→ Global Bank Logos");
	const root = await sparseClone("auraveni/global-bank-logos", "main", ["assets/bank"]);
	const destRoot = path.join(ICONS_ROOT, "global-bank-logos");
	await fs.rm(destRoot, { recursive: true, force: true });
	let count = 0;
	for (const style of ["indian-bank", "international-bank"]) {
		count += await copySvgTree(
			path.join(root, "assets/bank", style),
			path.join(destRoot, style),
			new Set(),
		);
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importJetbrains() {
	console.log("→ JetBrains Icons");
	const root = await sparseClone("JetBrains/icons", "master", ["src"]);
	const destRoot = path.join(ICONS_ROOT, "jetbrains-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = {
		default: new Set<string>(),
		"12": new Set<string>(),
		"20": new Set<string>(),
	};
	let count = 0;
	for (const file of await fs.readdir(path.join(root, "src"))) {
		if (!file.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(path.join(root, "src", file), "utf8");
		if (!raw.includes("<svg")) continue;
		let style: "default" | "12" | "20" = "default";
		let name = file;
		if (/-12px\.svg$/i.test(file)) {
			style = "12";
			name = file.replace(/-12px\.svg$/i, ".svg");
		} else if (/-20px\.svg$/i.test(file)) {
			style = "20";
			name = file.replace(/-20px\.svg$/i, ".svg");
		}
		await writeSvg(path.join(destRoot, style), name, raw, used[style]);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importKoobiq() {
	console.log("→ Koobiq Icons");
	const root = await sparseClone("koobiq/icons", "main", ["packages/icons/svg"]);
	const destRoot = path.join(ICONS_ROOT, "koobiq-icons");
	await fs.rm(destRoot, { recursive: true, force: true });
	const used = new Map<string, Set<string>>();
	let count = 0;
	for (const file of await fs.readdir(path.join(root, "packages/icons/svg"))) {
		if (!file.toLowerCase().endsWith(".svg")) continue;
		const raw = await fs.readFile(path.join(root, "packages/icons/svg", file), "utf8");
		if (!raw.includes("<svg")) continue;
		const m = /_(\d+)\.svg$/i.exec(file);
		const size = m?.[1] ?? "24";
		const name = file.replace(/_\d+\.svg$/i, "");
		const set = used.get(size) ?? new Set<string>();
		used.set(size, set);
		await writeSvg(path.join(destRoot, size), name, raw, set);
		count++;
	}
	console.log(`  ${count.toLocaleString()} icons`);
}

async function importBatch2() {
	await importFlat(
		"Developer Icons",
		"xandemon/developer-icons",
		"main",
		["icons"],
		"icons",
		"developer-icons",
	);
	await importFlat(
		"Aegis Icons",
		"aegis-icons/aegis-icons",
		"master",
		["icons"],
		"icons",
		"aegis-icons",
	);
	await importFlat(
		"Forge Icon",
		"Liberty-slug/forge-icon",
		"main",
		["icons-svg"],
		"icons-svg",
		"forge-icon",
	);
	await importFlat(
		"Duma Icons",
		"DudychMarian/duma-icons",
		"main",
		["icons/SVG"],
		"icons/SVG",
		"duma-icons",
	);
	await importFlat(
		"TinyGlyphs",
		"madebyankur/tinyglyphs",
		"main",
		["icons"],
		"icons",
		"tinyglyphs",
	);
	await importFlat("Kivex", "MotionMind2007/Kivex", "main", ["icons"], "icons", "kivex");
	await importProxicons();
	await importEmblemicons();
	await importFlat(
		"MOBAIcons",
		"Artist-MOBAI/MOBAIcons",
		"main",
		["icons"],
		"icons",
		"mobaicons",
	);
	await importFlat(
		"FamFamFam Silk SVG",
		"Simandara/famfamfam-silk-svg",
		"main",
		["icons"],
		"icons",
		"famfamfam-silk",
	);
	await importFlat(
		"Game Icon Pack",
		"Nieobie/game-icon-pack",
		"main",
		["svg/no-padding"],
		"svg/no-padding",
		"game-icon-pack",
	);
	await importJedd();
	await importSwm();
	await importFlat(
		"Payment Methods SVG",
		"Webkadabra/payment-methods-svg-pack",
		"main",
		["src/assets"],
		"src/assets",
		"payment-methods-svg",
	);
	await importFlat(
		"React Pay Icons",
		"twltwl/react-pay-icons",
		"master",
		["IconsSource"],
		"IconsSource",
		"react-pay-icons",
	);
	await importGlobalBankLogos();
	await importFinmarks();
	await importFlat("Terrane", "uxKero/terrane", "main", ["icons"], "icons", "terrane");
	await importFlat(
		"React Suite Icons",
		"rsuite/rsuite-icons",
		"main",
		["src/svg"],
		"src/svg",
		"rsuite-icons",
	);
	await importJetbrains();
	await importFlightIcons();
	await importKendo();
	await importFlat(
		"HV UI Kit Icons",
		"pentaho/hv-uikit-react",
		"master",
		["packages/icons/assets"],
		"packages/icons/assets",
		"hv-uikit-icons",
	);
	await importFlat(
		"Twilio Paste Icons",
		"twilio-labs/paste",
		"main",
		["packages/paste-icons/svg"],
		"packages/paste-icons/svg",
		"paste-icons",
	);
	await importKoobiq();
	await importVkIcons();
	await importPaymentFont();
	await importDooIconik();
}

const JSX_ATTR_TO_SVG: Record<string, string> = {
	strokeWidth: "stroke-width",
	strokeLinecap: "stroke-linecap",
	strokeLinejoin: "stroke-linejoin",
	strokeDasharray: "stroke-dasharray",
	strokeDashoffset: "stroke-dashoffset",
	strokeMiterlimit: "stroke-miterlimit",
	strokeOpacity: "stroke-opacity",
	fillOpacity: "fill-opacity",
	fillRule: "fill-rule",
	clipPath: "clip-path",
	clipRule: "clip-rule",
	fontFamily: "font-family",
	fontSize: "font-size",
	fontWeight: "font-weight",
	stopColor: "stop-color",
	stopOpacity: "stop-opacity",
	colorInterpolation: "color-interpolation",
	colorInterpolationFilters: "color-interpolation-filters",
};

function tsxToSvg(raw: string): string | null {
	const match = /<svg\b[\s\S]*?<\/svg>/i.exec(raw);
	if (!match) return null;
	let svg = match[0];
	svg = svg
		.replace(/\{\s*\.\.\.(?:props|rest)\s*\}/g, "")
		.replace(/\bref=\{[^}]+\}/g, "")
		.replace(/\bclassName=\{[^}]+\}/g, "")
		.replace(/\bclassName="[^"]*"/g, "")
		.replace(/=\{color\}/g, '="currentColor"')
		.replace(/=\{size\}/g, '="24"')
		.replace(/=\{strokeWidth\}/g, '="1.5"')
		.replace(/\{color\}/g, "currentColor")
		.replace(/\{size\}/g, "24")
		.replace(/\{strokeWidth\}/g, "1.5");
	for (const [jsx, svgAttr] of Object.entries(JSX_ATTR_TO_SVG)) {
		svg = svg.replace(new RegExp(`\\b${jsx}=`, "g"), `${svgAttr}=`);
	}
	svg = svg
		.replace(/\s{2,}/g, " ")
		.replace(/\s+>/g, ">")
		.replace(/>\s+</g, "><")
		.trim();
	if (!svg.includes("<svg")) return null;
	return svg;
}

async function collectTsxFiles(dir: string): Promise<string[]> {
	const out: string[] = [];
	async function walk(abs: string) {
		for (const ent of await fs.readdir(abs, { withFileTypes: true })) {
			const next = path.join(abs, ent.name);
			if (ent.isDirectory()) {
				await walk(next);
				continue;
			}
			if (ent.name.toLowerCase().endsWith(".tsx")) out.push(next);
		}
	}
	await walk(dir);
	return out;
}

function tsxIconName(file: string) {
	return path
		.basename(file, ".tsx")
		.replace(/Icon$/i, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[_\s]+/g, "-")
		.toLowerCase();
}

async function importTsxIconPack(opts: {
	label: string;
	repo: string;
	branch: string;
	sparse: string[];
	srcRel: string;
	setId: string;
}) {
	console.log(`→ ${opts.label}`);
	const root = await sparseClone(opts.repo, opts.branch, opts.sparse);
	const dest = path.join(ICONS_ROOT, opts.setId);
	await fs.rm(dest, { recursive: true, force: true });
	const used = new Set<string>();
	let count = 0;
	let skipped = 0;
	for (const file of await collectTsxFiles(path.join(root, opts.srcRel))) {
		const raw = await fs.readFile(file, "utf8");
		const svg = tsxToSvg(raw);
		if (!svg) {
			skipped++;
			continue;
		}
		await writeSvg(dest, tsxIconName(file), svg, used);
		count++;
	}
	console.log(
		`  ${count.toLocaleString()} icons` +
			(skipped ? ` (${skipped} skipped)` : ""),
	);
}

async function importBatch2Tsx() {
	await importTsxIconPack({
		label: "Doodle Icons",
		repo: "agilek/react-doodle-icons",
		branch: "main",
		sparse: ["src/icons"],
		srcRel: "src/icons",
		setId: "doodle-icons",
	});
	await importTsxIconPack({
		label: "Eyecons",
		repo: "rubychilds/eyecons",
		branch: "main",
		sparse: ["src/icons"],
		srcRel: "src/icons",
		setId: "eyecons",
	});
	await importTsxIconPack({
		label: "Next Icons",
		repo: "Next-Icons/next-icons",
		branch: "main",
		sparse: ["src/icons"],
		srcRel: "src/icons",
		setId: "next-icons",
	});
}

async function main() {
	await fs.mkdir(TMP, { recursive: true });
	if (process.argv.includes("--related")) {
		await importCloudscape();
		await importSemi();
		await importArco();
		await importEvil();
		await importHomelab();
		await importMuffinPayment();
		console.log("Done.");
		return;
	}
	if (process.argv.includes("--batch2-tsx")) {
		await importBatch2Tsx();
		console.log("Done.");
		return;
	}
	if (process.argv.includes("--batch2")) {
		await importBatch2();
		console.log("Done.");
		return;
	}
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
