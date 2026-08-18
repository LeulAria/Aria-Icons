import { NextResponse } from "next/server";
import { readSvg } from "@/lib/icon-fs";
import { getIconSet } from "@/lib/icon-sets";
import { getIconSourceKind } from "@/lib/icon-sources";
import { renderIconifyIcon } from "@/lib/iconify";
import { applyLineStrokeWidth, shouldApplyStroke } from "@/lib/icon-stroke";

export const runtime = "nodejs";

function applySize(svg: string, size: string) {
	return svg.replace(/<svg\b([^>]*?)>/i, (_m, attrs: string) => {
		let next = attrs;
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

function svgResponse(svg: string) {
	return new NextResponse(svg, {
		status: 200,
		headers: {
			"content-type": "image/svg+xml; charset=utf-8",
			"cache-control": "public, max-age=300, must-revalidate",
			vary: "Accept",
		},
	});
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const setId = url.searchParams.get("setId");
	const styleId = url.searchParams.get("styleId");
	const filePath = url.searchParams.get("filePath");
	const strokeWidthRaw = url.searchParams.get("strokeWidth") ?? "1";
	const strokeWidth = Number.parseFloat(strokeWidthRaw);
	const color = url.searchParams.get("color") ?? "#000000";
	const size = url.searchParams.get("size");
	const group = url.searchParams.get("group");

	if (!setId || !styleId || !filePath) {
		return NextResponse.json(
			{ error: "Missing required params: setId, styleId, filePath" },
			{ status: 400 },
		);
	}

	const kind = await getIconSourceKind(setId);
	if (!kind) return NextResponse.json({ error: "Unknown setId" }, { status: 400 });

	const strokeOpts = {
		group,
		styleId,
		strokeWidth: Number.isFinite(strokeWidth) ? strokeWidth : 1,
	};

	if (kind === "iconify") {
		const svg = await renderIconifyIcon(setId, filePath, {
			...(size ? { size } : {}),
			color,
		});
		if (!svg) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return svgResponse(finishSvg(svg, strokeOpts));
	}

	if (kind === "fs") {
		const set = getIconSet(setId);
		if (!set) return NextResponse.json({ error: "Unknown setId" }, { status: 400 });
		if (!set.styles.some((s) => s.id === styleId)) {
			return NextResponse.json({ error: "Unknown styleId for setId" }, { status: 400 });
		}
	}

	try {
		let svg = await readSvg(setId, filePath);

		if (size) svg = applySize(svg, size);

		if (kind === "fs") {
			svg = tintFilesystemSvg(svg, color, setId);
		} else if (kind === "thesvg" && styleId === "mono") {
			svg = svg.replaceAll("currentColor", color);
			svg = svg.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${color}"`);
			svg = svg.replace(/<svg\b([^>]*?)>/i, (m, attrs: string) =>
				/\bfill=/.test(attrs) ? m : `<svg fill="${color}"${attrs}>`,
			);
		}

		return svgResponse(finishSvg(svg, strokeOpts));
	} catch {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}
}
