/**
 * Run the icon quality pass (scripts/lib/icon-quality.ts) over packed sets in
 * place: repair markup, classify paint, drop broken icons, collapse duplicates.
 *
 *   bun run repair:icons                      # every vendored pack
 *   bun run repair:icons -- --only bubbles,awsicons
 *   bun run repair:icons -- --dry-run         # report only, write nothing
 *
 * Writes a per-set report to $TMPDIR/aria-repair-report.json.
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { PackedSetFile } from "../src/lib/icon-packed";
import { packedSetPath } from "../src/lib/icon-packed";
import { initRenderer, type RefineReport, refineIcons } from "./lib/icon-quality";

const REPORT = path.join(os.tmpdir(), "aria-repair-report.json");
const VENDORED = path.join(process.cwd(), "icons", "vendored");

function argValue(flag: string) {
	const idx = process.argv.indexOf(flag);
	return idx === -1 ? null : (process.argv[idx + 1] ?? null);
}

const dryRun = process.argv.includes("--dry-run");

async function repairSet(setId: string): Promise<RefineReport> {
	const file = packedSetPath(setId);
	const pack = JSON.parse(await fs.readFile(file, "utf8")) as PackedSetFile;
	const { icons, report } = refineIcons(pack.icons);
	if (!dryRun) {
		const next: PackedSetFile = { ...pack, icons };
		await fs.writeFile(file, JSON.stringify(next), "utf8");
	}
	return report;
}

/** Child mode: repair the given sets and print one JSON report line each. */
async function child(ids: string[]) {
	await initRenderer();
	for (const id of ids) {
		const report = await repairSet(id);
		process.stdout.write(`${JSON.stringify({ id, report })}\n`);
	}
}

function runChild(id: string): Promise<{ id: string; report?: RefineReport; error?: string }> {
	return new Promise((resolve) => {
		const tsx = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
		const args = [tsx, __filename, "--child", id, ...(dryRun ? ["--dry-run"] : [])];
		const proc = spawn(process.execPath, args, {
			env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
			stdio: ["ignore", "pipe", "pipe"],
		});
		let out = "";
		let err = "";
		proc.stdout.on("data", (d) => (out += d));
		proc.stderr.on("data", (d) => (err += d));
		proc.on("close", (code) => {
			const line = out.trim().split("\n").pop();
			try {
				resolve(JSON.parse(line ?? ""));
			} catch {
				resolve({ id, error: `exit ${code}: ${err.trim().split("\n").slice(-3).join(" ")}` });
			}
		});
	});
}

async function main() {
	const childIds = argValue("--child");
	if (childIds) return child(childIds.split(","));

	const only = argValue("--only")?.split(",").filter(Boolean);
	const files = await fs.readdir(VENDORED);
	const sized = await Promise.all(
		files
			.filter((f) => f.endsWith(".json"))
			.map(async (f) => ({ id: f.slice(0, -5), size: (await fs.stat(path.join(VENDORED, f))).size })),
	);
	const todo = sized
		.filter((s) => !only || only.includes(s.id))
		.sort((a, b) => b.size - a.size)
		.map((s) => s.id);

	const jobs = Number(argValue("--jobs") ?? Math.max(1, os.cpus().length - 2));
	const results: Record<string, RefineReport | { error: string }> = {};
	let cursor = 0;
	await Promise.all(
		Array.from({ length: Math.min(jobs, todo.length) }, async () => {
			while (cursor < todo.length) {
				const id = todo[cursor++]!;
				const res = await runChild(id);
				if (res.report) {
					results[id] = res.report;
					const r = res.report;
					console.log(
						`${id}: ${r.before} → ${r.after} (dup ${r.rejected.duplicate}, markup ${r.rejected.markup}, text ${r.rejected.text}, raster ${r.rejected.raster}, blank ${r.rejected.blank}, solid ${r.rejected.solid})`,
					);
				} else {
					results[id] = { error: res.error ?? "unknown" };
					console.log(`${id}: FAILED ${res.error}`);
				}
			}
		}),
	);

	await fs.writeFile(REPORT, JSON.stringify(results, null, 2), "utf8");
	const ok = Object.values(results).filter((r): r is RefineReport => "after" in r);
	const before = ok.reduce((n, r) => n + r.before, 0);
	const after = ok.reduce((n, r) => n + r.after, 0);
	console.log(`Done. ${ok.length} sets, ${before.toLocaleString()} → ${after.toLocaleString()} icons. Report: ${REPORT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
