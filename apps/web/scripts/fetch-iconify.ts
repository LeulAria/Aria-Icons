/**
 * Fetch Iconify icon sets (the data behind https://icones.js.org).
 *
 * Iconify stores each icon set as ONE compact JSON file (icon name -> SVG body)
 * instead of thousands of SVG files — that is what makes Icônes instant. We
 * mirror that: each set is a single file under icons/iconify/{prefix}.json and
 * SVGs are rendered on demand from the body string.
 *
 * Run:
 *   bun run fetch:iconify                    # curated default sets
 *   bun run fetch:iconify -- --sets ph,mdi   # specific sets
 *   bun run fetch:iconify -- --all           # all 200+ sets (heavy!)
 */
import fs from "node:fs/promises";
import path from "node:path";

const RAW_BASE = "https://raw.githubusercontent.com/iconify/icon-sets/master";
const CONCURRENCY = 6;

/**
 * Curated defaults: large, high-quality sets that complement the UI sets
 * already vendored under icons/ (lucide, tabler, heroicons, …).
 */
const DEFAULT_SETS = ["ph", "mdi", "ri", "carbon", "solar", "mingcute", "bi"];

/**
 * Iconify prefixes that duplicate sets already vendored as SVG files under
 * icons/ — skipped when fetching --all so icons don't appear twice.
 */
const VENDORED_DUPLICATES = new Set([
	"lucide",
	"tabler",
	"heroicons",
	"heroicons-outline",
	"heroicons-solid",
	"iconoir",
	"akar-icons",
	"system-uicons",
	"majesticons",
	"feather",
	"ion",
	"bytesize",
	"ci",
	// Iconify mirrors of theSVG — we vendor brands via fetch:thesvg instead.
	"thesvg",
	"thesvg-color",
]);

type CollectionsFile = Record<
	string,
	{ name: string; total: number; author?: { name?: string; url?: string } }
>;

function parseArgs(argv: string[]) {
	let all = false;
	let sets: string[] | null = null;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--all") all = true;
		else if (arg === "--sets") sets = (argv[++i] ?? "").split(",");
		else if (arg.startsWith("--sets=")) sets = arg.slice(7).split(",");
	}
	return {
		all,
		sets: sets?.map((s) => s.trim()).filter(Boolean) ?? null,
	};
}

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	return (await res.json()) as T;
}

async function main() {
	const started = Date.now();
	const { all, sets } = parseArgs(process.argv.slice(2));
	const destDir = path.join(process.cwd(), "icons", "iconify");
	await fs.mkdir(destDir, { recursive: true });

	console.log("→ Fetching Iconify collections index…");
	const collections = await fetchJson<CollectionsFile>(
		`${RAW_BASE}/collections.json`,
	);
	await fs.writeFile(
		path.join(destDir, "collections.json"),
		JSON.stringify(collections),
		"utf8",
	);

	const prefixes = all
		? Object.keys(collections).filter((p) => !VENDORED_DUPLICATES.has(p))
		: (sets ?? DEFAULT_SETS).filter((p) => {
				if (collections[p]) return true;
				console.warn(`  ⚠ Unknown set "${p}" — skipping`);
				return false;
			});

	console.log(`→ Downloading ${prefixes.length} sets (concurrency ${CONCURRENCY})…`);
	let totalIcons = 0;
	let failed = 0;
	let cursor = 0;

	async function worker() {
		while (cursor < prefixes.length) {
			const prefix = prefixes[cursor++];
			try {
				const set = await fetchJson<{ icons: Record<string, unknown> }>(
					`${RAW_BASE}/json/${prefix}.json`,
				);
				const count = Object.keys(set.icons ?? {}).length;
				totalIcons += count;
				await fs.writeFile(
					path.join(destDir, `${prefix}.json`),
					JSON.stringify(set),
					"utf8",
				);
				console.log(
					`  ✓ ${prefix} — ${collections[prefix]?.name ?? prefix} (${count.toLocaleString()} icons)`,
				);
			} catch (error) {
				failed++;
				console.error(`  ✗ ${prefix}: ${error instanceof Error ? error.message : error}`);
			}
		}
	}

	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, prefixes.length) }, worker),
	);

	const secs = ((Date.now() - started) / 1000).toFixed(1);
	console.log(
		`✅ Iconify: ${(prefixes.length - failed).toLocaleString()} sets, ${totalIcons.toLocaleString()} icons → icons/iconify (${secs}s)${failed ? ` — ${failed} failed` : ""}`,
	);
	console.log("   Next: bun run generate-icons");
}

main().catch((error) => {
	console.error("fetch-iconify failed:", error);
	process.exit(1);
});
