import { readSvgEntry } from "@/lib/icon-fs";
import { getIconSet } from "@/lib/icon-sets";
import { getIconSourceKind } from "@/lib/icon-sources";
import { applyLineStrokeWidth, shouldApplyStroke } from "@/lib/icon-stroke";
import {
	isLogoOrColoredSet,
	loadIconifyCollections,
	prefetchIconifyIcons,
	renderIconifyIcon,
} from "@/lib/iconify";
import { classifyPaintMarkup, paintSvg, setSvgSize } from "@/lib/svg-paint";

export type IconSvgRequest = {
	setId: string;
	styleId: string;
	filePath: string;
	size?: string | null;
	strokeWidth?: number;
	color?: string;
	group?: string | null;
};

/** Sets whose SVGs omit stroke/fill and are drawn as strokes (inherit from root). */
const STROKE_DEFAULT_SET_IDS = new Set(["ikonate"]);

/**
 * Color sets drawn with near-black outline ink around colored fills. On the
 * dark UI the ink turns to the requested light color so outlines stay visible.
 */
const INK_SWAP_SET_IDS = new Set([
	"streamline-freehand-color",
	"streamline-color",
	"streamline-flex-color",
	"streamline-plump-color",
	"streamline-sharp-color",
	"streamline-ultimate-color",
	"streamline-cyber-color",
	"streamline-stickies-color",
]);

function strokeDefaults(svg: string) {
	return svg.replace(/<svg\b([^>]*?)>/i, (_m, attrs: string) => {
		const patched = attrs
			.replace(/(^|\s)(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin)="[^"]*"/gi, "")
			.trimEnd();
		return `<svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"${patched}>`;
	});
}

async function isIconifyColorSet(prefix: string) {
	return isLogoOrColoredSet(prefix, await loadIconifyCollections());
}

function finishSvg(
	svg: string,
	opts: { group: string | null; styleId: string; strokeWidth: number },
) {
	if (!shouldApplyStroke({ group: opts.group, styleId: opts.styleId, svg })) {
		return svg;
	}
	return applyLineStrokeWidth(svg, opts.strokeWidth);
}

export async function renderRequestedIconSvg(
	req: IconSvgRequest,
): Promise<string | null> {
	const color = req.color ?? "#000000";
	const strokeWidth = Number.isFinite(req.strokeWidth) ? (req.strokeWidth ?? 1) : 1;
	const group = req.group ?? null;
	const strokeOpts = { group, styleId: req.styleId, strokeWidth };

	const kind = await getIconSourceKind(req.setId);
	if (!kind) return null;

	if (kind === "iconify") {
		// Color sets keep their own palette; only mono icons inside them get tinted.
		const colored = await isIconifyColorSet(req.setId);
		let svg = await renderIconifyIcon(req.setId, req.filePath, {
			...(req.size ? { size: req.size } : {}),
			...(colored ? {} : { color }),
		});
		if (!svg) return null;
		if (colored) {
			svg = paintSvg(svg, classifyPaintMarkup(svg), color, {
				inkSwap: INK_SWAP_SET_IDS.has(req.setId),
			});
		}
		return finishSvg(svg, strokeOpts);
	}

	if (kind === "fs") {
		const set = getIconSet(req.setId);
		if (!set) return null;
		if (!set.styles.some((s) => s.id === req.styleId)) return null;
	}

	try {
		const entry = await readSvgEntry(req.setId, req.filePath);
		let svg = entry.svg;
		if (req.size) svg = setSvgSize(svg, req.size);
		if (STROKE_DEFAULT_SET_IDS.has(req.setId)) svg = strokeDefaults(svg);
		const paint = kind === "thesvg" && req.styleId === "mono" ? "mono" : entry.paint;
		svg = paintSvg(svg, paint, color);
		return finishSvg(svg, strokeOpts);
	} catch {
		return null;
	}
}

/** Warm Iconify bodies in one API call per prefix, then render every icon. */
export async function renderRequestedIconSvgs(
	reqs: IconSvgRequest[],
): Promise<(string | null)[]> {
	const byPrefix = new Map<string, string[]>();
	await Promise.all(
		reqs.map(async (req) => {
			const kind = await getIconSourceKind(req.setId);
			if (kind !== "iconify") return;
			const names = byPrefix.get(req.setId) ?? [];
			names.push(req.filePath);
			byPrefix.set(req.setId, names);
		}),
	);
	await Promise.all(
		[...byPrefix].map(([prefix, names]) => prefetchIconifyIcons(prefix, names)),
	);
	return Promise.all(reqs.map((req) => renderRequestedIconSvg(req)));
}

export const SVG_CACHE_CONTROL =
	"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";
