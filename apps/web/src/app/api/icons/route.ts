import { NextResponse } from "next/server";
import { listAllIcons, listAllIconsMulti, listIcons, listIconsMulti } from "@/lib/icon-fs";
import { getIconSet, type IconSetId, type IconStyleId } from "@/lib/icon-sets";

export const runtime = "nodejs";

export async function GET(req: Request) {
	const url = new URL(req.url);
	const setIdRaw = url.searchParams.get("setId");
	const styleIdRaw = url.searchParams.get("styleId");
	const query = url.searchParams.get("q") ?? undefined;
	const offsetRaw = url.searchParams.get("offset");
	const limitRaw = url.searchParams.get("limit");

	if (!setIdRaw || !styleIdRaw) {
		return NextResponse.json(
			{ error: "Missing required params: setId, styleId" },
			{ status: 400 },
		);
	}

	// Special: `setId=all` aggregates all sets for a given group (`styleId=line|solid`).
	if (setIdRaw === "all") {
		if (styleIdRaw !== "line" && styleIdRaw !== "solid" && styleIdRaw !== "both") {
			return NextResponse.json(
				{ error: 'For setId="all", styleId must be "line", "solid", or "both"' },
				{ status: 400 },
			);
		}
		const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : 0;
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 200;
		const res =
			styleIdRaw === "both"
				? await listAllIconsMulti({
						groups: ["line", "solid"],
						query,
						offset,
						limit,
					})
				: await listAllIcons({
						group: styleIdRaw,
						query,
						offset,
						limit,
					});
		return NextResponse.json(res);
	}

	const setId = setIdRaw as IconSetId;
	const styleId = styleIdRaw as IconStyleId;

	const set = getIconSet(setId);
	if (!set) return NextResponse.json({ error: "Unknown setId" }, { status: 400 });

	if (styleIdRaw === "both") {
		const line = set.styles.find((s) => s.group === "line")?.id;
		const solid = set.styles.find((s) => s.group === "solid")?.id;
		const styleIds = [line, solid].filter(Boolean) as IconStyleId[];
		if (styleIds.length === 0) {
			return NextResponse.json(
				{ error: "No styles available for this set" },
				{ status: 400 },
			);
		}

		const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : 0;
		const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 200;
		const res = await listIconsMulti({ setId, styleIds, query, offset, limit });
		return NextResponse.json(res);
	}

	if (!set.styles.some((s) => s.id === styleId)) {
		return NextResponse.json({ error: "Unknown styleId for setId" }, { status: 400 });
	}

	const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : 0;
	const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 200;

	const res = await listIcons({ setId, styleId, query, offset, limit });
	return NextResponse.json(res);
}


