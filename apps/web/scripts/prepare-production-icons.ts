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

/** Oversized vendored packs use Git LFS — ensure real blobs before gzip/deploy. */
async function ensureGitLfsPulled() {
	try {
		await run("git", ["lfs", "version"]);
	} catch {
		console.log("→ git-lfs not available — skip LFS pull");
		return;
	}
	try {
		console.log("→ Pulling Git LFS icon packs…");
		// Repo root may be monorepo parent when Vercel Root Directory is apps/web.
		await run("git", ["lfs", "pull", "--include", "apps/web/icons/vendored/**"]);
	} catch (error) {
		console.warn(
			"→ git lfs pull failed (continuing):",
			error instanceof Error ? error.message : error,
		);
	}
}

function looksLikeGitLfsPointer(buf: Buffer): boolean {
	if (buf.length > 300) return false;
	const head = buf.subarray(0, 64).toString("utf8");
	return head.startsWith("version https://git-lfs.github.com/spec/v1");
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
	await fs.mkdir(dir, { recursive: true });
	let entries: string[] = [];
	try {
		entries = await fs.readdir(dir);
	} catch {
		entries = [];
	}
	let prefixes = entries
		.filter(
			(f) =>
				f.endsWith(".json") &&
				f !== "collections.json" &&
				f !== "prefixes.json",
		)
		.map((f) => f.slice(0, -5))
		.sort();
	// When only the committed index manifests exist (pre-fetch), derive
	// prefixes from collections.json so the tracing include path is valid.
	if (prefixes.length === 0) {
		try {
			const collections = JSON.parse(
				await fs.readFile(path.join(dir, "collections.json"), "utf8"),
			) as Record<string, unknown>;
			prefixes = Object.keys(collections).sort();
		} catch {
			prefixes = [];
		}
	}
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
	await fs.mkdir(dir, { recursive: true });
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

async function iconifySetsPresent(): Promise<boolean> {
	const dir = path.join(process.cwd(), "icons", "iconify");
	try {
		const entries = await fs.readdir(dir);
		return entries.some(
			(f) =>
				f.endsWith(".json") &&
				f !== "collections.json" &&
				f !== "prefixes.json",
		);
	} catch {
		return false;
	}
}

export async function prepareProductionIcons() {
	const onVercel = process.env.VERCEL === "1" || process.env.FETCH_ICONS === "1";

	if (onVercel) {
		await ensureGitLfsPulled();
		await fs.mkdir(path.join(process.cwd(), "icons", "iconify"), {
			recursive: true,
		});
		const hasSets = await iconifySetsPresent();
		if (hasSets) {
			console.log("→ Iconify set JSON already present — skip fetch");
			await writePrefixesManifest();
		} else {
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
 * Vercel functions are capped at 250 MB uncompressed, and the vendored packs
 * are gigabytes of JSON (~450 MB even gzipped), so they can't ride along in any
 * function. Gzip them into `public/icon-packs/` and drop the raw files before
 * file tracing; deployed routes fetch the one pack they need from the CDN (see
 * `src/lib/icon-packed.ts`). theSVG is small, so it stays in the bundle as
 * `icons/thesvg.json.gz`. Local dev keeps plain JSON. Safe to run twice.
 */
export async function compressIconPacksForDeploy() {
	const targets: Array<{ from: string; to: string }> = [];
	const vendored = path.join(process.cwd(), "icons", "vendored");
	const staticPacks = path.join(process.cwd(), "public", "icon-packs");
	try {
		const entries = await fs.readdir(vendored);
		for (const file of entries) {
			if (!file.endsWith(".json") && !file.endsWith(".json.gz")) continue;
			targets.push({
				from: path.join(vendored, file),
				to: path.join(staticPacks, file.endsWith(".gz") ? file : `${file}.gz`),
			});
		}
	} catch {
		/* no vendored dir */
	}
	const thesvg = path.join(process.cwd(), "icons", "thesvg.json");
	try {
		await fs.access(thesvg);
		targets.push({ from: thesvg, to: `${thesvg}.gz` });
	} catch {
		/* already gzipped or absent */
	}
	if (targets.length > 0) await fs.mkdir(staticPacks, { recursive: true });

	let before = 0;
	let after = 0;
	let skippedPointers = 0;
	let gzipped = 0;
	for (const { from, to } of targets) {
		const raw = await fs.readFile(from);
		if (!from.endsWith(".gz") && looksLikeGitLfsPointer(raw)) {
			skippedPointers++;
			console.warn(
				`→ Skipping Git LFS pointer (not pulled): ${path.relative(process.cwd(), from)}`,
			);
			continue;
		}
		const compressed = from.endsWith(".gz") ? raw : await gzipAsync(raw, { level: 9 });
		await fs.writeFile(to, compressed);
		await fs.unlink(from);
		before += raw.length;
		after += compressed.length;
		gzipped++;
	}
	if (gzipped > 0) {
		console.log(
			`→ Gzipped ${gzipped} icon packs for deploy (${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB); vendored packs moved to public/icon-packs/`,
		);
	}
	if (skippedPointers > 0) {
		console.warn(
			`→ Left ${skippedPointers} LFS pointer pack(s) in place — enable Git LFS on the host or fix git lfs pull`,
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
