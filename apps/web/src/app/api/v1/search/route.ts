import {
	apiJson,
	corsHeaders,
	publicSearch,
} from "@/lib/public-api";

export const runtime = "nodejs";

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const query = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
	if (!query.trim()) {
		return apiJson({ error: "Missing required query param: q" }, 400, 0);
	}

	const collection =
		url.searchParams.get("collection") ??
		url.searchParams.get("prefix") ??
		url.searchParams.get("set") ??
		undefined;
	const style = url.searchParams.get("style") ?? undefined;
	const limitRaw = url.searchParams.get("limit");
	const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
	const includeSvg =
		url.searchParams.get("svg") === "1" ||
		url.searchParams.get("includeSvg") === "1";
	const prefer = url.searchParams.get("prefer") ?? undefined;

	try {
		const result = await publicSearch({
			query,
			collection,
			style,
			limit: Number.isFinite(limit) ? limit : undefined,
			includeSvg,
			prefer,
		});
		return apiJson(result, 200, 30);
	} catch (error) {
		if (error instanceof Error && error.name === "UnknownCollectionError") {
			return apiJson({ error: error.message }, 400, 0);
		}
		console.error("[api/v1/search]", error);
		return apiJson({ error: "Search failed" }, 500, 0);
	}
}
