import fs from "node:fs/promises";
import path from "node:path";
import { buildIconIndex } from "../src/lib/icon-fs";
import { ICON_SETS } from "../src/lib/icon-sets";
import {
	buildIconifyTagMap,
	isIconifyLineIcon,
	isLogoOrColoredSet,
	listIconifyPrefixes,
	loadIconifyCollections,
	loadIconifySet,
} from "../src/lib/iconify";
import {
	dedupedVariants,
	loadTheSvgRegistry,
	THESVG_SET_ID,
} from "../src/lib/thesvg";

/**
 * Compact icon catalog for the browser + MCP search (format v3).
 *
 * icons entries are [setIdx, styleIdx, group (0=line,1=solid), name, filePath, tagIdx?]
 * - filePath is "" when it equals the icon name (Iconify sets) to save space.
 * - tagIdx points into the deduplicated `tagsList` table (many icons share the
 *   same category/alias tag arrays).
 *
 * Sources:
 * - Vendored sets (icons/vendored/{setId}.json — or loose SVGs before pack:icons)
 * - theSVG brand icons (icons/thesvg.json — run `bun run fetch:thesvg`)
 * - Iconify sets (icons/iconify/{prefix}.json — run `bun run fetch:iconify`)
 */
export type IconsMetaFile = {
	v: 3;
	generatedAt: string;
	sets: string[];
	styles: string[];
	icons: Array<[number, number, 0 | 1, string, string, number?]>;
	tagsList: string[][];
	counts: Record<string, Record<string, number>>;
};

async function readLucideTags(
	setRootAbs: string,
	filePath: string,
): Promise<string[] | null> {
	// Packed lucide set embeds tags on each icon entry.
	try {
		const { loadPackedSet } = await import("../src/lib/icon-packed");
		const packed = await loadPackedSet("lucide-icons");
		const tags = packed?.icons[filePath]?.tags;
		if (tags && tags.length > 0) return tags;
	} catch {
		/* fall through to loose sidecars */
	}

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
		return tags.length > 0 ? Array.from(new Set(tags)) : null;
	} catch {
		return null;
	}
}

function normalizeTags(values: string[]): string[] {
	return Array.from(
		new Set(
			values
				.filter((t) => typeof t === "string" && t.trim().length > 0)
				.map((t) => t.trim().toLowerCase()),
		),
	);
}

type Builder = {
	sets: string[];
	styleIndex: Map<string, number>;
	icons: IconsMetaFile["icons"];
	tagsList: string[][];
	tagsIndex: Map<string, number>;
	counts: IconsMetaFile["counts"];
	iconsNames: Record<string, string[]>;
	allIcons: Set<string>;
};

function styleIdx(b: Builder, styleId: string): number {
	let idx = b.styleIndex.get(styleId);
	if (idx == null) {
		idx = b.styleIndex.size;
		b.styleIndex.set(styleId, idx);
	}
	return idx;
}

function tagIdx(b: Builder, tags: string[]): number {
	const key = tags.join("\u0000");
	let idx = b.tagsIndex.get(key);
	if (idx == null) {
		idx = b.tagsList.length;
		b.tagsList.push(tags);
		b.tagsIndex.set(key, idx);
	}
	return idx;
}

function addIcon(
	b: Builder,
	params: {
		setId: string;
		styleId: string;
		group: 0 | 1;
		name: string;
		filePath: string;
		tags?: string[];
		nameSet: Set<string>;
	},
) {
	const { setId, styleId, group, name, filePath, tags, nameSet } = params;
	const setIdx = b.sets.indexOf(setId);
	const fp = filePath === name ? "" : filePath;
	const entry: IconsMetaFile["icons"][number] = [
		setIdx,
		styleIdx(b, styleId),
		group,
		name,
		fp,
	];
	if (tags && tags.length > 0) entry.push(tagIdx(b, tags));
	b.icons.push(entry);
	b.counts[setId][styleId] = (b.counts[setId][styleId] ?? 0) + 1;
	const normalizedName = name.toLowerCase();
	nameSet.add(normalizedName);
	b.allIcons.add(`${setId}-${normalizedName}`);
}

async function collectFsSets(b: Builder) {
	for (const iconSet of ICON_SETS) {
		const setId = iconSet.id;
		const nameSet = new Set<string>();
		b.counts[setId] = {};

		for (const style of iconSet.styles) {
			const group: 0 | 1 = style.group === "solid" ? 1 : 0;
			try {
				const index = await buildIconIndex(setId, style.id);
				for (const icon of index.icons) {
					let tags: string[] | undefined;
					if (setId === "lucide-icons") {
						const setRootAbs = path.join(process.cwd(), "icons", setId);
						tags = (await readLucideTags(setRootAbs, icon.filePath)) ?? undefined;
					}
					addIcon(b, {
						setId,
						styleId: style.id,
						group,
						name: icon.name,
						filePath: icon.filePath,
						tags,
						nameSet,
					});
				}
			} catch (error) {
				console.error(`Error processing ${setId}/${style.id}:`, error);
				b.counts[setId][style.id] = 0;
			}
		}

		b.iconsNames[setId] = Array.from(nameSet).sort();
	}
}

async function collectTheSvg(b: Builder) {
	const registry = await loadTheSvgRegistry();
	if (!registry) {
		console.log("ℹ theSVG registry not found — run `bun run fetch:thesvg` to include brand icons.");
		return;
	}

	b.sets.push(THESVG_SET_ID);
	b.counts[THESVG_SET_ID] = {};
	const nameSet = new Set<string>();

	for (const entry of registry.icons) {
		const tags = normalizeTags([
			entry.title,
			...entry.aliases,
			...entry.categories,
			...(entry.collection ? [entry.collection] : []),
		]);
		for (const variant of dedupedVariants(entry)) {
			addIcon(b, {
				setId: THESVG_SET_ID,
				styleId: variant.styleId,
				group: 1,
				name: entry.slug,
				filePath: variant.filePath,
				tags,
				nameSet,
			});
		}
	}

	b.iconsNames[THESVG_SET_ID] = Array.from(nameSet).sort();
	console.log(`   theSVG: ${registry.icons.length.toLocaleString()} brands indexed`);
}

/** Set ids already claimed by filesystem sets or theSVG — skip Iconify mirrors. */
const RESERVED_SET_IDS = new Set([
	...ICON_SETS.map((s) => s.id),
	THESVG_SET_ID,
	"thesvg-color",
]);

async function collectIconify(b: Builder) {
	const prefixes = await listIconifyPrefixes();
	if (prefixes.length === 0) {
		console.log("ℹ No Iconify sets found — run `bun run fetch:iconify` to include them.");
		return;
	}

	const collections = await loadIconifyCollections();
	let totalIcons = 0;
	let skipped = 0;
	let logoSets = 0;
	for (const prefix of prefixes) {
		if (RESERVED_SET_IDS.has(prefix) || b.sets.includes(prefix)) {
			skipped++;
			continue;
		}
		const set = await loadIconifySet(prefix);
		if (!set) continue;

		b.sets.push(prefix);
		b.counts[prefix] = {};
		const nameSet = new Set<string>();
		const tagMap = buildIconifyTagMap(set);
		// Logos / colored / emoji / flags always land under Fill — never Line.
		const forceFill = isLogoOrColoredSet(prefix, collections);
		if (forceFill) logoSets++;

		for (const [name, icon] of Object.entries(set.icons)) {
			if (icon.hidden) continue;
			const line = !forceFill && isIconifyLineIcon(icon.body);
			addIcon(b, {
				setId: prefix,
				styleId: line ? "line" : "solid",
				group: line ? 0 : 1,
				name,
				filePath: name,
				tags: tagMap.has(name) ? normalizeTags(tagMap.get(name)!) : undefined,
				nameSet,
			});
		}

		totalIcons += nameSet.size;
		b.iconsNames[prefix] = Array.from(nameSet).sort();
	}
	console.log(
		`   iconify: ${prefixes.length - skipped} sets, ${totalIcons.toLocaleString()} icons indexed (${logoSets} logo/color sets → Fill)${skipped ? ` (${skipped} reserved/duplicate skipped)` : ""}`,
	);
}

async function generate() {
	const b: Builder = {
		sets: ICON_SETS.map((s) => s.id),
		styleIndex: new Map(),
		icons: [],
		tagsList: [],
		tagsIndex: new Map(),
		counts: {},
		iconsNames: {},
		allIcons: new Set(),
	};

	await collectFsSets(b);
	await collectTheSvg(b);
	await collectIconify(b);

	b.icons.sort((a, c) => {
		const byName = a[3].localeCompare(c[3]);
		if (byName !== 0) return byName;
		const bySet = a[0] - c[0];
		if (bySet !== 0) return bySet;
		return a[1] - c[1];
	});

	const meta: IconsMetaFile = {
		v: 3,
		generatedAt: new Date().toISOString(),
		sets: b.sets,
		styles: Array.from(b.styleIndex.keys()),
		icons: b.icons,
		tagsList: b.tagsList,
		counts: b.counts,
	};

	const publicDir = path.join(process.cwd(), "public");
	await fs.mkdir(publicDir, { recursive: true });
	const metaPath = path.join(publicDir, "icons-meta.json");
	await fs.writeFile(metaPath, JSON.stringify(meta), "utf8");

	const namesOutput = {
		"icons-names": b.iconsNames,
		all: Array.from(b.allIcons).sort(),
	};
	const namesPath = path.join(process.cwd(), "icons-name.json");
	await fs.writeFile(namesPath, JSON.stringify(namesOutput), "utf-8");

	const metaStat = await fs.stat(metaPath);
	console.log(
		`✅ Generated public/icons-meta.json (${b.icons.length.toLocaleString()} icons, ${b.sets.length} sets, ${(metaStat.size / 1024 / 1024).toFixed(2)} MB)`,
	);
	console.log(
		`✅ Generated icons-name.json (${b.allIcons.size.toLocaleString()} unique names)`,
	);
}

generate().catch((error) => {
	console.error("Error generating icon metadata:", error);
	process.exit(1);
});
