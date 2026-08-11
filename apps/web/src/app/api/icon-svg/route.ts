import { NextResponse } from "next/server";
import { readSvg } from "@/lib/icon-fs";
import { getIconSet } from "@/lib/icon-sets";
import { getIconSourceKind } from "@/lib/icon-sources";
import { renderIconifyIcon } from "@/lib/iconify";

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
 * Only remap UI stroke widths (Feather-style 1–4). Ionicons outlines use
 * stroke-width="32" in a 512 viewBox — crushing those to 1 makes them vanish.
 */
function remapStrokeWidthAttr(value: string, strokeWidth: string) {
	const num = Number.parseFloat(value);
	if (!Number.isFinite(num) || num > 4) return value;
	if (/px$/i.test(value.trim())) return `${strokeWidth}px`;
	return strokeWidth;
}

/**
 * Tint filesystem SVGs for the dark UI. Many packs ship bare paths that default
 * to black fill; Ionicons often paint via style="stroke:#000"; Ikonate omits
 * presentation attrs entirely.
 */
function tintFilesystemSvg(
	svg: string,
	color: string,
	strokeWidth: string,
	setId: string,
) {
	let next = svg
		.replaceAll("currentColor", color)
		.replaceAll("currentcolor", color)
		// Inline styles beat presentation attributes — must rewrite these.
		.replace(/\bstyle=(["'])([\s\S]*?)\1/gi, (_m, quote: string, body: string) => {
			return `style=${quote}${tintCssStyleValue(body, color)}${quote}`;
		})
		.replace(/\bstroke-width="([^"]*)"/gi, (_m, value: string) => {
			return `stroke-width="${remapStrokeWidthAttr(value, strokeWidth)}"`;
		})
		.replace(/\bstrokeWidth="([^"]*)"/gi, (_m, value: string) => {
			return `strokeWidth="${remapStrokeWidthAttr(value, strokeWidth)}"`;
		})
		.replace(/\bstroke="(?!none)[^"]*"/gi, `stroke="${color}"`)
		.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${color}"`);

	const hasStrokeAttr = /\bstroke=/i.test(next);
	const hasFillAttr = /\bfill=/i.test(next);
	const hasStylePaint = /style=(["'])[^"']*(?:stroke|fill)\s*:/i.test(next);

	if (STROKE_DEFAULT_SET_IDS.has(setId)) {
		// Force stroke paint on the root so bare Ikonate paths render white.
		next = next.replace(/<svg\b([^>]*?)>/i, (_m, attrs: string) => {
			let patched = attrs
				.replace(/\bfill="[^"]*"/gi, "")
				.replace(/\bstroke="[^"]*"/gi, "")
				.replace(/\bstroke-width="[^"]*"/gi, "")
				.replace(/\bstroke-linecap="[^"]*"/gi, "")
				.replace(/\bstroke-linejoin="[^"]*"/gi, "");
			return `<svg fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${patched}>`;
		});
	} else if (!hasStrokeAttr && !hasFillAttr && !hasStylePaint) {
		// Ionicons solid (and similar): bare paths inherit root fill.
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

function svgResponse(svg: string) {
	return new NextResponse(svg, {
		status: 200,
		headers: {
			"content-type": "image/svg+xml; charset=utf-8",
			// Colored per request — avoid sticky black/untinted browser caches.
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
	const strokeWidth = url.searchParams.get("strokeWidth") ?? "1";
	const color = url.searchParams.get("color") ?? "#000000";
	const size = url.searchParams.get("size");

	if (!setId || !styleId || !filePath) {
		return NextResponse.json(
			{ error: "Missing required params: setId, styleId, filePath" },
			{ status: 400 },
		);
	}

	const kind = await getIconSourceKind(setId);
	if (!kind) return NextResponse.json({ error: "Unknown setId" }, { status: 400 });

	// Iconify sets: local JSON when present, else Iconify API (Vercel prune).
	if (kind === "iconify") {
		const svg = await renderIconifyIcon(setId, filePath, {
			...(size ? { size } : {}),
			color,
		});
		if (!svg) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return svgResponse(svg);
	}

	if (kind === "fs") {
		const set = getIconSet(setId);
		if (!set) return NextResponse.json({ error: "Unknown setId" }, { status: 400 });
		if (!set.styles.some((s) => s.id === styleId)) {
			return NextResponse.json({ error: "Unknown styleId for setId" }, { status: 400 });
		}
	}

	// fs + thesvg: read the SVG file from disk (readSvg guards path traversal).
	try {
		let svg = await readSvg(setId, filePath);

		if (size) svg = applySize(svg, size);

		if (kind === "fs") {
			svg = tintFilesystemSvg(svg, color, strokeWidth, setId);
		} else if (kind === "thesvg" && styleId === "mono") {
			// Mono brand variants are meant to inherit the surrounding color;
			// other brand variants keep their official colors untouched.
			svg = svg.replaceAll("currentColor", color);
			svg = svg.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${color}"`);
			// Many mono SVGs omit fill entirely (default black) — set it on the
			// root so bare paths inherit the requested color.
			svg = svg.replace(/<svg\b([^>]*?)>/i, (m, attrs: string) =>
				/\bfill=/.test(attrs) ? m : `<svg fill="${color}"${attrs}>`,
			);
		}

		return svgResponse(svg);
	} catch {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}
}
