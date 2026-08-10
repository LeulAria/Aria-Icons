import { buildIconIndex, readSvg } from "@/lib/icon-fs";
import { getIconSet } from "@/lib/icon-sets";
import { getIconSourceKind } from "@/lib/icon-sources";
import { loadIconifySet, renderIconifySvg } from "@/lib/iconify";
import { dedupedVariants, getTheSvgEntry } from "@/lib/thesvg";

export type ResolvedIconSvg = {
	setId: string;
	name: string;
	styleId: string;
	svg: string;
};

/**
 * Resolve an icon SVG by set id + icon name across all sources.
 * For theSVG brands an optional variant (e.g. "mono", "wordmark") can be
 * requested; defaults to the primary variant.
 */
export async function resolveIconSvgByName(
	setId: string,
	name: string,
	options?: { variant?: string },
): Promise<ResolvedIconSvg | null> {
	const kind = await getIconSourceKind(setId);
	if (!kind) return null;

	if (kind === "iconify") {
		const set = await loadIconifySet(setId);
		if (!set) return null;
		const svg = renderIconifySvg(set, name);
		if (!svg) return null;
		return { setId, name, styleId: "line", svg };
	}

	if (kind === "thesvg") {
		const entry = await getTheSvgEntry(name);
		if (!entry) return null;
		const variants = dedupedVariants(entry);
		if (variants.length === 0) return null;
		const chosen =
			(options?.variant
				? variants.find((v) => v.styleId === options.variant)
				: null) ?? variants[0];
		try {
			const svg = await readSvg(setId, chosen.filePath);
			return { setId, name, styleId: chosen.styleId, svg };
		} catch {
			return null;
		}
	}

	// Filesystem sets: scan each style index for a name match.
	const iconSet = getIconSet(setId);
	if (!iconSet) return null;
	for (const style of iconSet.styles) {
		try {
			const index = await buildIconIndex(setId, style.id);
			const icon = index.icons.find(
				(i) => i.name.toLowerCase() === name.toLowerCase(),
			);
			if (icon) {
				const svg = await readSvg(setId, icon.filePath);
				return { setId, name: icon.name, styleId: style.id, svg };
			}
		} catch {
			continue;
		}
	}
	return null;
}

/**
 * Parse an icon id like "lucide-icons-home" or "thesvg-github" into
 * { setId, name } using longest-prefix matching over known set ids
 * (set ids themselves contain hyphens, so a naive split breaks).
 */
export function parseIconId(
	iconId: string,
	knownSetIds: string[],
): { setId: string; name: string } | null {
	let best: { setId: string; name: string } | null = null;
	for (const setId of knownSetIds) {
		if (!iconId.startsWith(`${setId}-`)) continue;
		const name = iconId.slice(setId.length + 1);
		if (!name) continue;
		if (!best || setId.length > best.setId.length) {
			best = { setId, name };
		}
	}
	return best;
}
