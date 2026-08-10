/**
 * Fetch all brand icons from theSVG (https://thesvg.org) in one shot.
 *
 * Strategy: download the repo tarball (single ~30MB request — much faster than
 * 12k individual SVG requests), extract `public/icons/**` and the source
 * manifest `src/data/icons.json`, then write:
 *
 *   icons/thesvg/icons/{slug}/{variant}.svg   — the SVG files
 *   icons/thesvg/registry.json                — normalized metadata registry
 *
 * Run: bun run fetch:thesvg
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const TARBALL_URL =
	"https://codeload.github.com/glincker/thesvg/tar.gz/refs/heads/main";

/** Shape of entries in theSVG's src/data/icons.json manifest. */
type TheSvgManifestEntry = {
	slug: string;
	title: string;
	aliases?: string[];
	hex?: string;
	categories?: string[];
	/** variant key -> "/icons/{slug}/{file}.svg" */
	variants?: Record<string, string>;
	license?: string;
	url?: string;
	dateAdded?: string;
	collection?: string;
};

export type TheSvgRegistryEntry = {
	slug: string;
	title: string;
	aliases: string[];
	categories: string[];
	hex?: string;
	license?: string;
	url?: string;
	collection?: string;
	/** normalized variant key (kebab-case) -> file path relative to icons/thesvg (e.g. "icons/github/default.svg") */
	variants: Record<string, string>;
};

export type TheSvgRegistry = {
	v: 1;
	source: "https://github.com/glincker/thesvg";
	fetchedAt: string;
	icons: TheSvgRegistryEntry[];
};

function kebabCase(input: string) {
	return input
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase();
}

async function download(url: string, dest: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
	const buf = Buffer.from(await res.arrayBuffer());
	await fs.writeFile(dest, buf);
	return buf.byteLength;
}

async function main() {
	const started = Date.now();
	const destRoot = path.join(process.cwd(), "icons", "thesvg");
	const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "thesvg-"));

	try {
		console.log("→ Downloading theSVG tarball…");
		const tarPath = path.join(tmp, "thesvg.tar.gz");
		const bytes = await download(TARBALL_URL, tarPath);
		console.log(`  ${(bytes / 1024 / 1024).toFixed(1)} MB downloaded`);

		console.log("→ Extracting…");
		await execFileAsync("tar", ["-xzf", tarPath, "-C", tmp], {
			maxBuffer: 64 * 1024 * 1024,
		});

		const entries = await fs.readdir(tmp, { withFileTypes: true });
		const rootDir = entries.find(
			(e) => e.isDirectory() && e.name.startsWith("thesvg-"),
		);
		if (!rootDir) throw new Error("Could not locate extracted repo root");
		const repoRoot = path.join(tmp, rootDir.name);

		const manifestRaw = await fs.readFile(
			path.join(repoRoot, "src", "data", "icons.json"),
			"utf8",
		);
		const parsed = JSON.parse(manifestRaw) as
			| TheSvgManifestEntry[]
			| { icons: TheSvgManifestEntry[] };
		const manifest = Array.isArray(parsed) ? parsed : parsed.icons;
		if (!Array.isArray(manifest)) {
			throw new Error("Unexpected manifest shape in src/data/icons.json");
		}

		console.log(`→ Normalizing ${manifest.length.toLocaleString()} icons…`);
		let variantCount = 0;
		const icons: TheSvgRegistryEntry[] = [];
		for (const entry of manifest) {
			if (!entry.slug || !entry.variants) continue;
			const variants: Record<string, string> = {};
			for (const [key, value] of Object.entries(entry.variants)) {
				if (typeof value !== "string" || !value.endsWith(".svg")) continue;
				// "/icons/github/default.svg" -> "icons/github/default.svg"
				const rel = value.replace(/^\/+/, "");
				variants[kebabCase(key)] = rel;
			}
			if (Object.keys(variants).length === 0) continue;
			variantCount += Object.keys(variants).length;
			icons.push({
				slug: entry.slug,
				title: entry.title ?? entry.slug,
				aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
				categories: Array.isArray(entry.categories) ? entry.categories : [],
				...(entry.hex ? { hex: entry.hex } : {}),
				...(entry.license ? { license: entry.license } : {}),
				...(entry.url ? { url: entry.url } : {}),
				...(entry.collection ? { collection: entry.collection } : {}),
				variants,
			});
		}

		console.log("→ Installing SVG files…");
		await fs.rm(destRoot, { recursive: true, force: true });
		await fs.mkdir(destRoot, { recursive: true });
		const srcIconsDir = path.join(repoRoot, "public", "icons");
		const destIconsDir = path.join(destRoot, "icons");
		try {
			await fs.rename(srcIconsDir, destIconsDir);
		} catch {
			// Cross-device fallback.
			await fs.cp(srcIconsDir, destIconsDir, { recursive: true });
		}

		const registry: TheSvgRegistry = {
			v: 1,
			source: "https://github.com/glincker/thesvg",
			fetchedAt: new Date().toISOString(),
			icons,
		};
		await fs.writeFile(
			path.join(destRoot, "registry.json"),
			JSON.stringify(registry),
			"utf8",
		);

		const secs = ((Date.now() - started) / 1000).toFixed(1);
		console.log(
			`✅ theSVG: ${icons.length.toLocaleString()} icons, ${variantCount.toLocaleString()} variants → icons/thesvg (${secs}s)`,
		);
		console.log("→ Packing into icons/thesvg.json…");
		await execFileAsync(
			"bun",
			["run", "pack:icons", "--", "--only", "thesvg", "--delete"],
			{ cwd: process.cwd() },
		);
		console.log("   Next: bun run generate-icons");
	} finally {
		await fs.rm(tmp, { recursive: true, force: true });
	}
}

main().catch((error) => {
	console.error("fetch-thesvg failed:", error);
	process.exit(1);
});
