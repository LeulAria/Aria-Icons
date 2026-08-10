/**
 * Pack loose SVG icon sets into one JSON file per set (Iconify-style).
 *
 * Writes:
 *   icons/vendored/{setId}.json  — vendored UI sets
 *   icons/thesvg.json            — theSVG brands (metadata + svg bodies)
 *
 * Usage:
 *   bun run pack:icons                 # write packs, keep source folders
 *   bun run pack:icons -- --delete     # write packs, then remove source SVGs
 *   bun run pack:icons -- --only thesvg
 *   bun run pack:icons -- --only vendored
 */
import fs from "node:fs/promises";
import path from "node:path";
import { buildIconIndex } from "../src/lib/icon-fs";
import {
	type PackedIcon,
	type PackedSetFile,
	type TheSvgPackedRegistry,
	clearPackedIconCache,
	packedSetPath,
	packedTheSvgPath,
} from "../src/lib/icon-packed";
import { ICON_SETS } from "../src/lib/icon-sets";
import { THESVG_SET_ID } from "../src/lib/thesvg";

function shouldDelete() {
	return process.argv.includes("--delete");
}

function onlyFilter(): "all" | "thesvg" | "vendored" {
	const idx = process.argv.indexOf("--only");
	if (idx === -1) return "all";
	const value = process.argv[idx + 1];
	if (value === "thesvg" || value === "vendored") return value;
	return "all";
}

/** Prefer packed reads off; this script always reads loose files. */
async function forceReadLooseSvg(setId: string, filePath: string) {
	const setRootAbs = path.join(process.cwd(), "icons", setId);
	const abs = path.join(setRootAbs, filePath);
	const rel = path.relative(setRootAbs, abs);
	if (rel.startsWith("..") || path.isAbsolute(rel)) {
		throw new Error(`Invalid path: ${filePath}`);
	}
	return fs.readFile(abs, "utf8");
}

function compactSvg(svg: string) {
	return svg
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/\r\n/g, "\n")
		.replace(/\n[ \t]+/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{2,}/g, "\n")
		.trim();
}

async function readLucideTags(
	setRootAbs: string,
	filePath: string,
): Promise<string[] | undefined> {
	const jsonPath = path.join(
		setRootAbs,
		filePath.replace(/\.svg$/i, ".json"),
	);
	try {
		const raw = await fs.readFile(jsonPath, "utf8");
		const parsed = JSON.parse(raw) as {
			tags?: unknown;
			categories?: unknown;
			aliases?: unknown;
		};
		const tags = [
			...(Array.isArray(parsed.tags) ? parsed.tags : []),
			...(Array.isArray(parsed.categories) ? parsed.categories : []),
			...(Array.isArray(parsed.aliases) ? parsed.aliases : []),
		]
			.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
			.map((t) => t.trim().toLowerCase());
		return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
	} catch {
		return undefined;
	}
}

async function packVendoredSet(setId: string): Promise<{
	count: number;
	bytes: number;
}> {
	const set = ICON_SETS.find((s) => s.id === setId);
	if (!set) throw new Error(`Unknown set ${setId}`);

	const icons: Record<string, PackedIcon> = {};
	const setRootAbs = path.join(process.cwd(), "icons", setId);

	for (const style of set.styles) {
		const index = await buildIconIndex(setId, style.id);
		for (const icon of index.icons) {
			const raw = await forceReadLooseSvg(setId, icon.filePath);
			const entry: PackedIcon = {
				svg: compactSvg(raw),
				name: icon.name,
				styleId: style.id,
			};
			if (setId === "lucide-icons") {
				const tags = await readLucideTags(setRootAbs, icon.filePath);
				if (tags) entry.tags = tags;
			}
			icons[icon.filePath] = entry;
		}
	}

	const packed: PackedSetFile = { v: 1, prefix: setId, icons };
	const outPath = packedSetPath(setId);
	await fs.mkdir(path.dirname(outPath), { recursive: true });
	const json = JSON.stringify(packed);
	await fs.writeFile(outPath, json, "utf8");
	return { count: Object.keys(icons).length, bytes: Buffer.byteLength(json) };
}

async function packTheSvg(): Promise<{ count: number; bytes: number } | null> {
	// Always read the loose registry so we don't round-trip an existing pack.
	const registryPath = path.join(
		process.cwd(),
		"icons",
		THESVG_SET_ID,
		"registry.json",
	);
	let registry: {
		fetchedAt: string;
		icons: TheSvgPackedRegistry["icons"];
	};
	try {
		registry = JSON.parse(await fs.readFile(registryPath, "utf8")) as {
			fetchedAt: string;
			icons: TheSvgPackedRegistry["icons"];
		};
	} catch {
		console.log("ℹ theSVG registry not found — skip (run bun run fetch:thesvg)");
		return null;
	}

	const svgs: Record<string, string> = {};
	const setRoot = path.join(process.cwd(), "icons", THESVG_SET_ID);
	let count = 0;

	for (const entry of registry.icons) {
		for (const relPath of Object.values(entry.variants)) {
			if (svgs[relPath]) continue;
			const abs = path.join(setRoot, relPath);
			try {
				svgs[relPath] = compactSvg(await fs.readFile(abs, "utf8"));
				count++;
			} catch {
				console.warn(`  ⚠ missing SVG: ${relPath}`);
			}
		}
	}

	const packed: TheSvgPackedRegistry = {
		v: 2,
		source: "https://github.com/glincker/thesvg",
		fetchedAt: registry.fetchedAt,
		icons: registry.icons,
		svgs,
	};

	const outPath = packedTheSvgPath();
	const json = JSON.stringify(packed);
	await fs.writeFile(outPath, json, "utf8");
	return { count, bytes: Buffer.byteLength(json) };
}

async function rmDirIfExists(dir: string) {
	try {
		await fs.rm(dir, { recursive: true, force: true });
	} catch {
		/* ignore */
	}
}

function clearIconFsIndexCache() {
	const g = globalThis as unknown as { __ariaIconIndexCache?: Map<string, unknown> };
	g.__ariaIconIndexCache?.clear();
	const t = globalThis as unknown as {
		__ariaTheSvgCache?: { loaded: boolean; registry: null; bySlug: null };
	};
	if (t.__ariaTheSvgCache) {
		t.__ariaTheSvgCache.loaded = false;
		t.__ariaTheSvgCache.registry = null;
		t.__ariaTheSvgCache.bySlug = null;
	}
}

async function main() {
	const del = shouldDelete();
	const only = onlyFilter();
	clearPackedIconCache();
	clearIconFsIndexCache();

	let totalIcons = 0;
	let totalBytes = 0;

	if (only !== "thesvg") {
	console.log(`→ Packing vendored icon sets${del ? " (will delete sources)" : ""}…`);

	for (const set of ICON_SETS) {
		const setDir = path.join(process.cwd(), "icons", set.id);
		try {
			await fs.access(setDir);
		} catch {
			// Already packed / missing loose sources — skip if pack exists.
			try {
				await fs.access(packedSetPath(set.id));
				console.log(`   ${set.id}: already packed, no loose folder`);
				continue;
			} catch {
				console.log(`   ${set.id}: missing — skip`);
				continue;
			}
		}

		// Prefer rebuilding from loose SVGs: drop any existing pack + caches.
		try {
			await fs.unlink(packedSetPath(set.id));
		} catch {
			/* none */
		}
		clearPackedIconCache();
		clearIconFsIndexCache();

		const { count, bytes } = await packVendoredSet(set.id);
		totalIcons += count;
		totalBytes += bytes;
		console.log(
			`   ${set.id}: ${count.toLocaleString()} icons → ${(bytes / 1024 / 1024).toFixed(2)} MB`,
		);

		if (del) {
			await rmDirIfExists(setDir);
			console.log(`     🗑 removed icons/${set.id}/`);
		}
	}
	} // end vendored

	if (only !== "vendored") {
	console.log("→ Packing theSVG…");
	// Prefer loose registry+SVGs when present.
	const thesvgDir = path.join(process.cwd(), "icons", THESVG_SET_ID);
	let hasLooseTheSvg = false;
	try {
		await fs.access(path.join(thesvgDir, "registry.json"));
		hasLooseTheSvg = true;
	} catch {
		hasLooseTheSvg = false;
	}

	if (hasLooseTheSvg) {
		clearPackedIconCache();
		const result = await packTheSvg();
		if (result) {
			totalIcons += result.count;
			totalBytes += result.bytes;
			console.log(
				`   thesvg: ${result.count.toLocaleString()} SVGs → ${(result.bytes / 1024 / 1024).toFixed(2)} MB`,
			);
			if (del) {
				await rmDirIfExists(thesvgDir);
				console.log("     🗑 removed icons/thesvg/");
			}
		}
	} else {
		try {
			await fs.access(packedTheSvgPath());
			console.log("   thesvg: already packed (icons/thesvg.json)");
		} catch {
			console.log("   thesvg: not found — skip");
		}
	}
	} // end thesvg

	console.log(
		`✅ Packed ${totalIcons.toLocaleString()} icons into ${(totalBytes / 1024 / 1024).toFixed(2)} MB of JSON`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
