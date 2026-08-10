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

async function main() {
	const onVercel = process.env.VERCEL === "1" || process.env.FETCH_ICONS === "1";

	if (onVercel) {
		console.log("→ Production icon prepare: fetching theSVG + Iconify…");
		await run("bun", ["run", "fetch:thesvg"]);
		await run("bun", ["run", "fetch:iconify", "--", "--all"]);
		await writePrefixesManifest();
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

	await run("bun", ["run", "generate-icons"]);

	if (onVercel) {
		await pruneIconifyBodies();
	}

	console.log("✅ Icon catalog ready for build");
}

main().catch((error) => {
	console.error("prepare-production-icons failed:", error);
	process.exit(1);
});
