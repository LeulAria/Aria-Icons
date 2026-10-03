/**
 * Drop vendored families that are too small to be useful, plus styles the
 * quality pass emptied, from src/lib/icon-sets.ts and icons/vendored/.
 *
 *   bun run prune:icons             # apply
 *   bun run prune:icons -- --dry-run
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { PackedSetFile } from "../src/lib/icon-packed";
import { packedSetPath } from "../src/lib/icon-packed";
import { ICON_SETS } from "../src/lib/icon-sets";

const MIN_ICONS = 5;
const ICON_SETS_FILE = path.join(process.cwd(), "src/lib/icon-sets.ts");

/**
 * Families removed even though they pass MIN_ICONS: Quill, MorphNext and Uber
 * Base Web on request; the avatar packs are avatar art and loose avatar parts,
 * not icons; 3dicons ships blurred filter renders of its 3D (PNG) artwork.
 */
const REMOVED = new Set([
	"quill-icons",
	"morphnext",
	"baseweb-icons",
	"avataaars",
	"bigheads",
	"multiavatar",
	"3dicons",
]);

const dryRun = process.argv.includes("--dry-run");

function entryRange(src: string, id: string) {
	const start = src.indexOf(`\t{\n\t\tid: "${id}",`);
	if (start === -1) return null;
	const end = src.indexOf("\n\t},", start);
	if (end === -1) return null;
	return { start, end: end + "\n\t},".length };
}

function dropStyle(entry: string, styleId: string) {
	const single = new RegExp(`\\n?[\\t ]*\\{ id: "${styleId}",[^\\n]*\\},?`);
	if (single.test(entry)) return entry.replace(single, "");
	const multi = new RegExp(`\\n[\\t ]*\\{\\n[\\t ]*id: "${styleId}",[\\s\\S]*?\\n[\\t ]*\\},?`);
	return entry.replace(multi, "");
}

async function main() {
	let src = await fs.readFile(ICON_SETS_FILE, "utf8");
	const removedSets: string[] = [];
	const removedStyles: string[] = [];

	for (const set of ICON_SETS) {
		let pack: PackedSetFile | null = null;
		try {
			pack = JSON.parse(await fs.readFile(packedSetPath(set.id), "utf8")) as PackedSetFile;
		} catch {
			continue; // loose / not packed: leave alone
		}
		const perStyle = new Map<string, number>();
		for (const icon of Object.values(pack.icons)) {
			perStyle.set(icon.styleId, (perStyle.get(icon.styleId) ?? 0) + 1);
		}
		const total = [...perStyle.values()].reduce((a, b) => a + b, 0);
		const range = entryRange(src, set.id);
		if (!range) continue;

		if (total < MIN_ICONS || REMOVED.has(set.id)) {
			src = src.slice(0, range.start) + src.slice(range.end + 1);
			removedSets.push(`${set.id} (${total})`);
			if (!dryRun) await fs.rm(packedSetPath(set.id), { force: true });
			continue;
		}

		let entry = src.slice(range.start, range.end);
		for (const style of set.styles) {
			if ((perStyle.get(style.id) ?? 0) > 0) continue;
			entry = dropStyle(entry, style.id);
			removedStyles.push(`${set.id}/${style.id}`);
		}
		src = src.slice(0, range.start) + entry + src.slice(range.end);
	}

	if (!dryRun) await fs.writeFile(ICON_SETS_FILE, src, "utf8");
	console.log(`Removed families: ${removedSets.join(", ") || "none"}`);
	console.log(`Removed empty styles: ${removedStyles.join(", ") || "none"}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
