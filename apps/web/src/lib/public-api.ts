import {
	type CopyFormat,
	formatIconExport,
} from "@/lib/icon-export";
import {
	aliasIconName,
	canonicalCollectionId,
	displayCollectionId,
	parsePublicIconId,
	toLegacyIconId,
	toPublicIconId,
} from "@/lib/icon-id";
import {
	getSetSummaries,
	searchIcons,
	type IconSearchResult,
} from "@/lib/icon-meta-index";
import { resolveIconSvgByName } from "@/lib/icon-resolve";
import { getAllIconSetConfigs, getAllIconSetIds } from "@/lib/icon-sources";
import { applySvgCustomize } from "@/lib/svg-customize";

export const PUBLIC_API_FORMATS = [
	"svg",
	"react",
	"react-native",
	"vue",
	"svelte",
	"solid",
	"flutter",
	"jsx",
	"html",
] as const;

export type PublicIconFormat = (typeof PUBLIC_API_FORMATS)[number];

export type PublicSearchParams = {
	query: string;
	collection?: string;
	style?: string;
	limit?: number;
	includeSvg?: boolean;
	prefer?: string;
};

export type PublicIconHit = {
	id: string;
	legacyId: string;
	set: string;
	name: string;
	styles: string[];
	tags?: string[];
	score: number;
	svg?: string;
};

export type PublicIconRecord = {
	id: string;
	legacyId: string;
	set: string;
	name: string;
	styleId: string;
	svg: string;
	width?: number;
	height?: number;
};

const MAX_BATCH = 20;

function matchesStyle(icon: IconSearchResult, style?: string): boolean {
	if (!style || style === "any") return true;
	const needle = style.toLowerCase();
	if (needle === "outline" || needle === "line") {
		return icon.styleIds.some(
			(id) => !/solid|fill|filled|bold|bulk/i.test(id),
		);
	}
	if (needle === "solid" || needle === "fill") {
		return icon.styleIds.some((id) => /solid|fill|filled|bold|bulk/i.test(id));
	}
	return icon.styleIds.some((id) => id.toLowerCase() === needle);
}

function toHit(icon: IconSearchResult): PublicIconHit {
	return {
		id: toPublicIconId(icon.setId, icon.name),
		legacyId: toLegacyIconId(icon.setId, icon.name),
		set: icon.setId,
		name: icon.name,
		styles: icon.styleIds,
		...(icon.tags ? { tags: icon.tags.slice(0, 12) } : {}),
		score: icon.score,
	};
}

export async function publicSearch(params: PublicSearchParams): Promise<{
	query: string;
	total: number;
	icons: PublicIconHit[];
}> {
	const query = params.query.trim();
	if (!query) return { query, total: 0, icons: [] };

	const setId = params.collection
		? canonicalCollectionId(params.collection)
		: undefined;

	if (setId) {
		const known = await getAllIconSetIds();
		if (!known.includes(setId)) {
			const error = new Error(
				`Unknown collection: ${params.collection}. Try lucide, tabler, mdi, ph, thesvg, …`,
			);
			error.name = "UnknownCollectionError";
			throw error;
		}
	}

	const { total, results } = await searchIcons({
		query,
		setId,
		limit: params.limit ?? 32,
	});
	let icons = results.filter((icon) => matchesStyle(icon, params.style)).map(toHit);

	const prefer = params.prefer ? canonicalCollectionId(params.prefer) : undefined;
	if (prefer && !setId) {
		icons = icons.slice().sort((a, b) => {
			const aHit = a.set === prefer || a.id.startsWith(`${displayCollectionId(prefer)}:`) ? 0 : 1;
			const bHit = b.set === prefer || b.id.startsWith(`${displayCollectionId(prefer)}:`) ? 0 : 1;
			return aHit - bHit || b.score - a.score;
		});
	}

	if (params.includeSvg) {
		const preview = icons.slice(0, 8);
		await Promise.all(
			preview.map(async (hit, index) => {
				const icon = await publicGetIcon(hit.id);
				if (icon) icons[index] = { ...hit, svg: icon.svg };
			}),
		);
	}

	return { query, total, icons };
}

async function resolveNamedIcon(
	setId: string,
	name: string,
	options?: { variant?: string; color?: string; size?: number },
): Promise<PublicIconRecord | null> {
	let resolved = await resolveIconSvgByName(setId, name, {
		variant: options?.variant,
	});
	if (!resolved) {
		const aliased = aliasIconName(name);
		if (aliased !== name) {
			resolved = await resolveIconSvgByName(setId, aliased, {
				variant: options?.variant,
			});
		}
	}
	if (!resolved) {
		const { results } = await searchIcons({ query: name, setId, limit: 8 });
		const exact = results.find(
			(r) => r.name.toLowerCase() === name.toLowerCase(),
		);
		if (exact) {
			resolved = await resolveIconSvgByName(setId, exact.name, {
				variant: options?.variant,
			});
		}
	}
	if (!resolved) return null;

	const svg = applySvgCustomize(resolved.svg, {
		color: options?.color,
		size: options?.size,
	});

	return {
		id: toPublicIconId(resolved.setId, resolved.name),
		legacyId: toLegacyIconId(resolved.setId, resolved.name),
		set: resolved.setId,
		name: resolved.name,
		styleId: resolved.styleId,
		svg,
	};
}

export async function publicGetIcon(
	iconId: string,
	options?: { variant?: string; color?: string; size?: number },
): Promise<PublicIconRecord | null> {
	const known = await getAllIconSetIds();
	const parsed = parsePublicIconId(iconId, known);
	if (!parsed) return null;
	return resolveNamedIcon(parsed.setId, parsed.name, options);
}

export async function publicGetIcons(
	iconIds: string[],
	options?: { color?: string; size?: number },
): Promise<{ icons: PublicIconRecord[]; errors: { id: string; error: string }[] }> {
	const ids = iconIds.slice(0, MAX_BATCH);
	const icons: PublicIconRecord[] = [];
	const errors: { id: string; error: string }[] = [];

	for (const id of ids) {
		const icon = await publicGetIcon(id, options);
		if (icon) icons.push(icon);
		else errors.push({ id, error: "Not found" });
	}

	return { icons, errors };
}

export async function publicListCollections(params?: {
	search?: string;
	limit?: number;
}) {
	const [configs, counts] = await Promise.all([
		getAllIconSetConfigs(),
		getSetSummaries(),
	]);
	const search = params?.search?.trim().toLowerCase();
	let collections = configs.map((config) => ({
		id: config.id,
		shortId: displayCollectionId(config.id),
		label: config.label,
		homepage: config.homepage ?? null,
		count: counts[config.id] ?? 0,
		styles: config.styles.map((s) => ({
			id: s.id,
			label: s.label,
			group: s.group,
		})),
	}));

	if (search) {
		collections = collections.filter(
			(c) =>
				c.id.toLowerCase().includes(search) ||
				c.label.toLowerCase().includes(search) ||
				(c.shortId ?? "").toLowerCase().includes(search),
		);
	}

	collections.sort((a, b) => b.count - a.count);
	const limit = Math.max(1, Math.min(500, params?.limit ?? 80));
	return {
		total: collections.length,
		collections: collections.slice(0, limit),
	};
}

export async function publicSimilarIcons(iconId: string, limit = 10) {
	const known = await getAllIconSetIds();
	const parsed = parsePublicIconId(iconId, known);
	if (!parsed) return { iconId, icons: [] as PublicIconHit[] };

	const { results } = await searchIcons({
		query: parsed.name,
		limit: Math.min(100, Math.max(limit * 4, 24)),
	});

	const exact: PublicIconHit[] = [];
	const related: PublicIconHit[] = [];
	for (const icon of results) {
		if (icon.setId === parsed.setId && icon.name === parsed.name) continue;
		const hit = toHit(icon);
		if (icon.name.toLowerCase() === parsed.name.toLowerCase()) exact.push(hit);
		else related.push(hit);
	}

	return {
		iconId: toPublicIconId(parsed.setId, parsed.name),
		icons: [...exact, ...related].slice(0, limit),
	};
}

export async function publicEquivalentIcon(iconId: string, target: string) {
	const known = await getAllIconSetIds();
	const parsed = parsePublicIconId(iconId, known);
	if (!parsed) return null;

	const setId = canonicalCollectionId(target);
	if (!known.includes(setId)) return null;

	const { results } = await searchIcons({
		query: parsed.name,
		setId,
		limit: 12,
	});
	const exact = results.find(
		(r) => r.name.toLowerCase() === parsed.name.toLowerCase(),
	);
	const chosen = exact ?? results[0];
	if (!chosen) return null;
	return toHit(chosen);
}

export async function formatPublicIcon(
	record: PublicIconRecord,
	format: PublicIconFormat,
): Promise<string> {
	if (format === "svg" || format === "html") return record.svg;
	return formatIconExport(record.svg, record.name, format as CopyFormat);
}

export function isPublicIconFormat(value: string): value is PublicIconFormat {
	return (PUBLIC_API_FORMATS as readonly string[]).includes(value);
}

export function corsHeaders(): Record<string, string> {
	return {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Accept",
	};
}

export function apiJson(data: unknown, status = 200, cacheSeconds = 60) {
	return Response.json(data, {
		status,
		headers: {
			...corsHeaders(),
			"Cache-Control": `public, max-age=${cacheSeconds}`,
		},
	});
}

export function apiText(body: string, contentType: string, status = 200) {
	return new Response(body, {
		status,
		headers: {
			...corsHeaders(),
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=300",
		},
	});
}
