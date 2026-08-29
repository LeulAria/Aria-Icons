import { apiJson, corsHeaders, publicEquivalentIcon } from "@/lib/public-api";

export const runtime = "nodejs";

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const id = url.searchParams.get("id") ?? url.searchParams.get("iconId") ?? "";
	const target =
		url.searchParams.get("to") ??
		url.searchParams.get("collection") ??
		url.searchParams.get("target") ??
		"";
	if (!id.trim() || !target.trim()) {
		return apiJson(
			{ error: "Missing required query params: id and to (target collection)" },
			400,
			0,
		);
	}

	try {
		const icon = await publicEquivalentIcon(id, target);
		if (!icon) {
			return apiJson(
				{ error: `No equivalent for '${id}' in collection '${target}'` },
				404,
				0,
			);
		}
		return apiJson({ from: id, to: icon }, 200, 120);
	} catch (error) {
		console.error("[api/v1/equivalent]", error);
		return apiJson({ error: "Failed to find equivalent icon" }, 500, 0);
	}
}
