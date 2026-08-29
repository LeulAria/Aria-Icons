import { apiJson, corsHeaders, publicListCollections } from "@/lib/public-api";

export const runtime = "nodejs";

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const search = url.searchParams.get("search") ?? url.searchParams.get("q") ?? undefined;
	const limitRaw = url.searchParams.get("limit");
	const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

	try {
		const result = await publicListCollections({
			search: search ?? undefined,
			limit: Number.isFinite(limit) ? limit : undefined,
		});
		return apiJson(result, 200, 300);
	} catch (error) {
		console.error("[api/v1/collections]", error);
		return apiJson({ error: "Failed to list collections" }, 500, 0);
	}
}
