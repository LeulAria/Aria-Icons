/**
 * Vercel / CI prebuild: fetch theSVG + all Iconify sets, rebuild icons-meta.json,
 * then prune heavy Iconify set bodies so serverless bundles stay small.
 *
 * Runtime Iconify SVGs come from the Iconify API; theSVG + vendored JSON stay
 * on disk. Locally (non-VERCEL) this just regenerates the catalog from whatever
 * is already present.
 *
 *   bun run prebuild
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function run(command: string, args: string[]) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			stdio: "inherit",
			cwd: process.cwd(),
			env: process.env,
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
function runScript(script: string, args: string[] = []) {
	const tsxCli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
	return run(process.execPath, [tsxCli, script, ...args]);
}

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

	await runScript("scripts/generate-icons-meta.ts");

	if (onVercel) {
		await pruneIconifyBodies();
	}

	console.log("✅ Icon catalog ready for build");
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
