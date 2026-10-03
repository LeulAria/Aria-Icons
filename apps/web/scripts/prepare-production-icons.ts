/**
 * Vercel / CI prebuild: fetch theSVG + all Iconify sets, rebuild icons-meta.json,
 * then prune heavy Iconify set bodies so serverless bundles stay small.
 *
 * Runtime Iconify SVGs come from the Iconify API. On Vercel, vendored packs and
 * theSVG are gzipped before file tracing so functions stay under 250 MB.
 * Locally (non-VERCEL) this just regenerates the catalog from whatever
 * is already present.
 *
 *   bun run prebuild
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { fileURLToPath } from "node:url";

const gzipAsync = promisify(gzip);

function run(command: string, args: string[], env: Partial<NodeJS.ProcessEnv> = {}) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: "inherit",
			cwd: process.cwd(),
			env: { ...process.env, ...env },
			shell: process.platform === "win32",
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
		});
	});
}

/** Run a repo script with the local tsx binary (Vercel calls `next build`, not `bun`). */
function runScript(
	script: string,
	args: string[] = [],
	env: Partial<NodeJS.ProcessEnv> = {},
) {
	const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
	return run(process.execPath, [tsxCli, script, ...args], env);
}

// The full catalog no longer fits in Node's default heap; Vercel build machines have 8 GB.
// tsx re-spawns node, so the limit has to go through NODE_OPTIONS rather than argv.
const CATALOG_HEAP_MB = process.env.ICONS_META_HEAP_MB ?? "6144";

async function writePrefixesManifest() {
	const dir = path.join(process.cwd(), "icons", "iconify");
	const entries = await fs.readdir(dir);
	const prefixes = entries
		.filter(
			(f) =>
				f.endsWith(".json") &&
				f !== "collections.json" &&
				f !== "prefixes.json",
		)
		.map((f) => f.slice(0, -5))
		.sort();
	await fs.writeFile(
		path.join(dir, "prefixes.json"),
		JSON.stringify(prefixes),
		"utf8",
	);
	console.log(
		`→ Wrote icons/iconify/prefixes.json (${prefixes.length} sets)`,
	);
	return prefixes.length;
}

async function pruneIconifyBodies() {
	const dir = path.join(process.cwd(), "icons", "iconify");
	const keep = new Set(["collections.json", "prefixes.json"]);
	const entries = await fs.readdir(dir);
	let removed = 0;
	for (const file of entries) {
		if (keep.has(file)) continue;
		if (!file.endsWith(".json")) continue;
		await fs.unlink(path.join(dir, file));
		removed++;
	}
	console.log(
		`→ Pruned ${removed} Iconify set files (kept collections.json + prefixes.json)`,
	);
}

function iconifyManifestPath() {
	return path.join(process.cwd(), "icons", "iconify", "collections.json");
}

export async function prepareProductionIcons() {
	const onVercel = process.env.VERCEL === "1" || process.env.FETCH_ICONS === "1";

	if (onVercel) {
		try {
			await fs.access(iconifyManifestPath());
			console.log("→ Iconify manifest already present — skip fetch");
		} catch {
			console.log("→ Production icon prepare: fetching theSVG + Iconify…");
			await runScript("scripts/fetch-thesvg.ts");
			await runScript("scripts/fetch-iconify.ts", ["--all"]);
			await writePrefixesManifest();
		}
	} else {
		console.log(
			"→ Local prebuild: regenerating catalog from existing icon sources…",
		);
		// Still refresh prefixes.json when local iconify sets exist.
		try {
			await writePrefixesManifest();
		} catch {
			console.log("   (no icons/iconify yet — skip prefixes manifest)");
		}
	}

	await runScript("scripts/generate-icons-meta.ts", [], {
		NODE_OPTIONS: [
			process.env.NODE_OPTIONS,
			`--max-old-space-size=${CATALOG_HEAP_MB}`,
		]
			.filter(Boolean)
			.join(" "),
	});

	if (onVercel) {
		await pruneIconifyBodies();
	}

	console.log("✅ Icon catalog ready for build");
}

/**
 * Vercel functions are capped at 250 MB uncompressed. Vendored packs are
 * hundreds of MB of JSON; gzip them (and drop the raw files) before file
 * tracing so only routes that read SVGs carry the smaller `.json.gz` bodies.
 * Local dev keeps plain JSON. Safe to run twice.
 */
export async function compressIconPacksForDeploy() {
	const targets: string[] = [];
	const vendored = path.join(process.cwd(), "icons", "vendored");
	try {
		const entries = await fs.readdir(vendored);
		for (const file of entries) {
			if (file.endsWith(".json")) targets.push(path.join(vendored, file));
		}
	} catch {
		/* no vendored dir */
	}
	const thesvg = path.join(process.cwd(), "icons", "thesvg.json");
	try {
		await fs.access(thesvg);
		targets.push(thesvg);
	} catch {
		/* already gzipped or absent */
	}

	let before = 0;
	let after = 0;
	for (const filePath of targets) {
		const raw = await fs.readFile(filePath);
		const compressed = await gzipAsync(raw, { level: 9 });
		await fs.writeFile(`${filePath}.gz`, compressed);
		await fs.unlink(filePath);
		before += raw.length;
		after += compressed.length;
	}
	if (targets.length > 0) {
		console.log(
			`→ Gzipped ${targets.length} icon packs for deploy (${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB)`,
		);
	}
}

const invokedDirectly = process.argv[1]
	? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
	: false;

if (invokedDirectly) {
	prepareProductionIcons().catch((error) => {
		console.error("prepare-production-icons failed:", error);
		process.exit(1);
	});
}
