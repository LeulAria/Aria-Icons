import { NextResponse } from "next/server";
import { readSvg } from "@/lib/icon-fs";
import { getIconSet } from "@/lib/icon-sets";
import { getIconSourceKind } from "@/lib/icon-sources";
import { loadIconifySet, renderIconifySvg } from "@/lib/iconify";

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

function svgResponse(svg: string) {
	return new NextResponse(svg, {
		status: 200,
		headers: {
			"content-type": "image/svg+xml; charset=utf-8",
			"cache-control": "public, max-age=3600",
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

	// Iconify sets: render the SVG from the compact JSON body on demand.
	if (kind === "iconify") {
		const set = await loadIconifySet(setId);
		if (!set) return NextResponse.json({ error: "Unknown setId" }, { status: 400 });
		const svg = renderIconifySvg(set, filePath, {
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
			// Default styling: make stroke width consistent unless caller overrides it.
			svg = svg.replace(/\bstroke-width="[^"]*"/gi, `stroke-width="${strokeWidth}"`);
			svg = svg.replace(/\bstrokeWidth="[^"]*"/gi, `strokeWidth="${strokeWidth}"`);
			svg = svg.replace(/\bstroke="(?!none)[^"]*"/gi, `stroke="${color}"`);
			svg = svg.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${color}"`);
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
