/**
 * Import the Material Symbols weights Iconify doesn't carry.
 *
 * Iconify ships weight 400 (`material-symbols`) and weight 200
 * (`material-symbols-light`). Google publishes every weight as its own static
 * drawing; this pulls 100, 300, 500, 600 and 700 at the 24px optical size and
 * default grade, in Outlined / Rounded / Sharp, unfilled and filled.
 *
 * Icon names come from google/material-design-icons (symbols/web); SVGs come
 * from the Google Fonts CDN that serves the same files. Writes loose SVGs to
 * icons/material-symbols-<weight>/<style>/, ready for `bun run pack:icons`.
 *
 *   bun run fetch:material-symbols
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ICONS_ROOT = path.join(process.cwd(), "icons");
const CDN = "https://fonts.gstatic.com/s/i/short-term/release";
const WEIGHTS = [100, 300, 500, 600, 700] as const;
const STYLES = ["outlined", "rounded", "sharp"] as const;
const CONCURRENCY = 24;

async function iconNames(): Promise<string[]> {
	const { stdout: sha } = await execFileAsync("gh", [
		"api",
		"repos/google/material-design-icons/contents/symbols",
		"--jq",
		'.[] | select(.name=="web") | .sha',
	]);
	const { stdout } = await execFileAsync(
		"gh",
		["api", `repos/google/material-design-icons/git/trees/${sha.trim()}`, "--jq", ".tree[].path"],
		{ maxBuffer: 16 * 1024 * 1024 },
	);
	return stdout.split("\n").filter(Boolean).sort();
}

async function fetchSvg(url: string): Promise<string | null> {
	for (let attempt = 0; attempt < 4; attempt++) {
		try {
			const res = await fetch(url);
			if (res.status === 404) return null;
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const text = await res.text();
			return text.includes("<svg") ? text : null;
		} catch {
			await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
		}
	}
	return null;
}

async function main() {
	const names = await iconNames();
	console.log(`→ ${names.length.toLocaleString()} Material Symbols`);
	const jobs = names.flatMap((name) =>
		WEIGHTS.flatMap((weight) => STYLES.map((style) => ({ name, weight, style }))),
	);
	let cursor = 0;
	let written = 0;
	let missing = 0;
	await Promise.all(
		Array.from({ length: CONCURRENCY }, async () => {
			while (cursor < jobs.length) {
				const { name, weight, style } = jobs[cursor++]!;
				const base = `${CDN}/materialsymbols${style}/${name}`;
				const [plain, filled] = await Promise.all([
					fetchSvg(`${base}/wght${weight}/24px.svg`),
					fetchSvg(`${base}/wght${weight}fill1/24px.svg`),
				]);
				const file = `${name.replace(/_/g, "-")}.svg`;
				const setDir = path.join(ICONS_ROOT, `material-symbols-${weight}`);
				if (plain) {
					await fs.mkdir(path.join(setDir, style), { recursive: true });
					await fs.writeFile(path.join(setDir, style, file), plain, "utf8");
					written++;
				} else missing++;
				// Icons without a filled form serve the outline twice; keep one.
				if (filled && filled !== plain) {
					await fs.mkdir(path.join(setDir, `${style}-filled`), { recursive: true });
					await fs.writeFile(path.join(setDir, `${style}-filled`, file), filled, "utf8");
					written++;
				}
				if (cursor % 5000 < 1) console.log(`  ${cursor.toLocaleString()} / ${jobs.length.toLocaleString()}`);
			}
		}),
	);
	console.log(`✅ ${written.toLocaleString()} SVGs written (${missing} missing on the CDN)`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
