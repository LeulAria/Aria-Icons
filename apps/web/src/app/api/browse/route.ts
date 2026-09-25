import { browseIcons } from "@/lib/icon-meta-index";
import type { IconStyleFilter } from "@/lib/icon-sets";

export const runtime = "nodejs";

const STYLES = new Set(["line", "solid", "both", "animated"]);

export async function GET(req: Request) {
	const url = new URL(req.url);
	const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
	const limit = Number.parseInt(url.searchParams.get("limit") ?? "96", 10);
	const style = url.searchParams.get("style") ?? "both";
	const styleGroup = (STYLES.has(style) ? style : "both") as IconStyleFilter;

	try {
		const result = await browseIcons({
			query: url.searchParams.get("q") ?? "",
			collection: url.searchParams.get("collection") ?? "all",
			styleGroup,
			styleId: url.searchParams.get("styleId") ?? "both",
			offset: Number.isFinite(offset) ? offset : 0,
			limit: Number.isFinite(limit) ? limit : 96,
		});
		return Response.json(result, {
			headers: {
				"cache-control": "public, max-age=60, stale-while-revalidate=300",
			},
		});
	} catch (error) {
		console.error("[api/browse]", error);
		return Response.json({ error: "Browse failed" }, { status: 500 });
	}
}
