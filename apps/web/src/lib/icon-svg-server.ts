import { readSvg } from "@/lib/icon-fs";
import { getIconSet } from "@/lib/icon-sets";
import { getIconSourceKind } from "@/lib/icon-sources";
import { applyLineStrokeWidth, shouldApplyStroke } from "@/lib/icon-stroke";
import { prefetchIconifyIcons, renderIconifyIcon } from "@/lib/iconify";

export type IconSvgRequest = {
	setId: string;
	styleId: string;
	filePath: string;
	size?: string | null;
	strokeWidth?: number;
	color?: string;
	group?: string | null;
};

function applySize(svg: string, size: string) {
	return svg.replace(/<svg\b([^>]*?)>/i, (_m, attrs: string) => {
		let next = attrs;
		if (!/\bviewBox\s*=/i.test(next)) {
			const width = next.match(/\bwidth="([0-9.]+)(?:px)?"/i)?.[1];
			const height = next.match(/\bheight="([0-9.]+)(?:px)?"/i)?.[1];
			if (width && height) next += ` viewBox="0 0 ${width} ${height}"`;
		}
		if (/\bwidth=/.test(next)) next = next.replace(/\bwidth="[^"]*"/, `width="${size}"`);
		else next = ` width="${size}"` + next;

		if (/\bheight=/.test(next)) next = next.replace(/\bheight="[^"]*"/, `height="${size}"`);
		else next = ` height="${size}"` + next;

		return `<svg${next}>`;
	});
}

/** Sets whose SVGs omit stroke/fill and are drawn as strokes (inherit from root). */
const STROKE_DEFAULT_SET_IDS = new Set(["ikonate"]);

/** Rewrite fill/stroke colors inside a CSS `style="..."` value (skip `none`). */
function tintCssStyleValue(style: string, color: string) {
	return style
		.replace(
			/(^|;)\s*fill\s*:\s*(?!none\b)[^;]*/gi,
			(_m, lead: string) => `${lead}fill:${color}`,
		)
		.replace(
			/(^|;)\s*stroke\s*:\s*(?!none\b)[^;]*/gi,
			(_m, lead: string) => `${lead}stroke:${color}`,
		)
		.replace(
			/(^|;)\s*color\s*:\s*(?!none\b)[^;]*/gi,
			(_m, lead: string) => `${lead}color:${color}`,
		);
}

/**
 * Tint filesystem SVGs for the dark UI. Many packs ship bare paths that default
 * to black fill; Ionicons often paint via style="stroke:#000"; Ikonate omits
 * presentation attrs entirely. Stroke width is applied separately.
 */
function tintFilesystemSvg(svg: string, color: string, setId: string) {
	let next = svg
		.replaceAll("currentColor", color)
		.replaceAll("currentcolor", color)
		.replace(/\bstyle=(["'])([\s\S]*?)\1/gi, (_m, quote: string, body: string) => {
			return `style=${quote}${tintCssStyleValue(body, color)}${quote}`;
		})
		.replace(/\bstroke="(?!none)[^"]*"/gi, `stroke="${color}"`)
		.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${color}"`);

	const hasStrokeAttr = /\bstroke=/i.test(next);
	const hasFillAttr = /\bfill=/i.test(next);
	const hasStylePaint = /style=(["'])[^"']*(?:stroke|fill)\s*:/i.test(next);

	if (STROKE_DEFAULT_SET_IDS.has(setId)) {
		next = next.replace(/<svg\b([^>]*?)>/i, (_m, attrs: string) => {
			const patched = attrs
				.replace(/\bfill="[^"]*"/gi, "")
				.replace(/\bstroke="[^"]*"/gi, "")
				.replace(/\bstroke-width="[^"]*"/gi, "")
				.replace(/\bstroke-linecap="[^"]*"/gi, "")
				.replace(/\bstroke-linejoin="[^"]*"/gi, "");
			return `<svg fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"${patched}>`;
		});
	} else if (!hasStrokeAttr && !hasFillAttr && !hasStylePaint) {
		next = next.replace(/<svg\b([^>]*?)>/i, (_m, attrs: string) => {
			return `<svg fill="${color}"${attrs}>`;
		});
	} else if (!hasFillAttr && !hasStylePaint) {
		next = next.replace(/<svg\b([^>]*?)>/i, (m, attrs: string) =>
			/\bfill=/.test(attrs) ? m : `<svg fill="${color}"${attrs}>`,
		);
	}

	return next;
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
		const svg = await renderIconifyIcon(req.setId, req.filePath, {
			...(req.size ? { size: req.size } : {}),
			color,
		});
		if (!svg) return null;
		return finishSvg(svg, strokeOpts);
	}

	if (kind === "fs") {
		const set = getIconSet(req.setId);
		if (!set) return null;
		if (!set.styles.some((s) => s.id === req.styleId)) return null;
	}

	try {
		let svg = await readSvg(req.setId, req.filePath);
		if (req.size) svg = applySize(svg, req.size);

		if (kind === "fs") {
			svg = tintFilesystemSvg(svg, color, req.setId);
		} else if (kind === "thesvg" && req.styleId === "mono") {
			svg = svg.replaceAll("currentColor", color);
			svg = svg.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${color}"`);
			svg = svg.replace(/<svg\b([^>]*?)>/i, (m, attrs: string) =>
				/\bfill=/.test(attrs) ? m : `<svg fill="${color}"${attrs}>`,
			);
		}

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
