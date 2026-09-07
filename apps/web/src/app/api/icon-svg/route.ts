import { NextResponse } from "next/server";
import {
	renderRequestedIconSvg,
	SVG_CACHE_CONTROL,
} from "@/lib/icon-svg-server";

export const runtime = "nodejs";

function svgResponse(svg: string) {
	return new NextResponse(svg, {
		status: 200,
		headers: {
			"content-type": "image/svg+xml; charset=utf-8",
			"cache-control": SVG_CACHE_CONTROL,
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

	const svg = await renderRequestedIconSvg({
		setId,
		styleId,
		filePath,
		size,
		strokeWidth: Number.isFinite(strokeWidth) ? strokeWidth : 1,
		color,
		group,
	});
	if (!svg) return NextResponse.json({ error: "Not found" }, { status: 404 });
	return svgResponse(svg);
}
