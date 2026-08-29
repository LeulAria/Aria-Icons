import { apiJson, corsHeaders, publicSimilarIcons } from "@/lib/public-api";

export const runtime = "nodejs";

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const id = url.searchParams.get("id") ?? url.searchParams.get("iconId") ?? "";
	if (!id.trim()) {
		return apiJson({ error: "Missing required query param: id" }, 400, 0);
	}
	const limitRaw = url.searchParams.get("limit");
	const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 10;

	try {
		const result = await publicSimilarIcons(id, Number.isFinite(limit) ? limit : 10);
		return apiJson(result, 200, 120);
	} catch (error) {
		console.error("[api/v1/similar]", error);
		return apiJson({ error: "Failed to find similar icons" }, 500, 0);
	}
}
