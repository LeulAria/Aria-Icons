import { NextResponse } from "next/server";
import {
	renderRequestedIconSvgs,
	type IconSvgRequest,
	SVG_CACHE_CONTROL,
} from "@/lib/icon-svg-server";

export const runtime = "nodejs";

const MAX_BATCH = 32;

type BatchItem = {
	setId?: unknown;
	styleId?: unknown;
	filePath?: unknown;
	size?: unknown;
	strokeWidth?: unknown;
	color?: unknown;
	group?: unknown;
};

function parseItem(item: BatchItem): IconSvgRequest | null {
	if (
		typeof item.setId !== "string" ||
		typeof item.styleId !== "string" ||
		typeof item.filePath !== "string"
	) {
		return null;
	}
	const strokeWidth =
		typeof item.strokeWidth === "number"
			? item.strokeWidth
			: Number.parseFloat(String(item.strokeWidth ?? "1"));
	return {
		setId: item.setId,
		styleId: item.styleId,
		filePath: item.filePath,
		size: typeof item.size === "string" || typeof item.size === "number"
			? String(item.size)
			: null,
		strokeWidth: Number.isFinite(strokeWidth) ? strokeWidth : 1,
		color: typeof item.color === "string" ? item.color : "#000000",
		group: typeof item.group === "string" ? item.group : null,
	};
}

export async function POST(req: Request) {
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const raw = (body as { items?: unknown })?.items;
	if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_BATCH) {
		return NextResponse.json(
			{ error: `Expected 1–${MAX_BATCH} items` },
			{ status: 400 },
		);
	}

	const items = raw.map((item) => parseItem(item as BatchItem));
	if (items.some((item) => item == null)) {
		return NextResponse.json({ error: "Invalid item" }, { status: 400 });
	}

	const svgs = await renderRequestedIconSvgs(items as IconSvgRequest[]);
	return NextResponse.json(
		{ svgs },
		{
			headers: {
				"cache-control": SVG_CACHE_CONTROL,
			},
		},
	);
}
