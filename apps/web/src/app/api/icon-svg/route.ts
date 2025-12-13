import { NextResponse } from "next/server";
import { readSvg } from "@/lib/icon-fs";
import { getIconSet, type IconSetId, type IconStyleId } from "@/lib/icon-sets";

export const runtime = "nodejs";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const setId = url.searchParams.get("setId") as IconSetId | null;
	const styleId = url.searchParams.get("styleId") as IconStyleId | null;
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

	const set = getIconSet(setId);
	if (!set) return NextResponse.json({ error: "Unknown setId" }, { status: 400 });
	if (!set.styles.some((s) => s.id === styleId)) {
		return NextResponse.json({ error: "Unknown styleId for setId" }, { status: 400 });
	}

	// NOTE: styleId is validated above even though the SVG read only needs setId + filePath.
	// This ensures callers can't request arbitrary paths unless it's part of a known set/style.
	try {
		let svg = await readSvg(setId, filePath);

		// Apply size to the root element (if provided).
		if (size) {
			svg = svg.replace(
				/<svg\b([^>]*?)>/i,
				(_m, attrs: string) => {
					let next = attrs;
					if (/\bwidth=/.test(next)) next = next.replace(/\bwidth="[^"]*"/, `width="${size}"`);
					else next = ` width="${size}"` + next;

					if (/\bheight=/.test(next)) next = next.replace(/\bheight="[^"]*"/, `height="${size}"`);
					else next = ` height="${size}"` + next;

					return `<svg${next}>`;
				},
			);
		}

		// Default styling: make stroke width consistent unless caller overrides it.
		// This affects the gallery grid (which uses this route directly).
		svg = svg.replace(/\bstroke-width="[^"]*"/gi, `stroke-width="${strokeWidth}"`);
		svg = svg.replace(/\bstrokeWidth="[^"]*"/gi, `strokeWidth="${strokeWidth}"`);

		// Apply color unless the SVG explicitly uses `none`.
		svg = svg.replace(/\bstroke="(?!none)[^"]*"/gi, `stroke="${color}"`);
		svg = svg.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${color}"`);

		return new NextResponse(svg, {
			status: 200,
			headers: {
				"content-type": "image/svg+xml; charset=utf-8",
				"cache-control": "public, max-age=3600",
			},
		});
	} catch {
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	}
}


