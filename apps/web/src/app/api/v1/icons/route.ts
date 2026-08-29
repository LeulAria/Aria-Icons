import { apiJson, corsHeaders, publicGetIcons } from "@/lib/public-api";

export const runtime = "nodejs";

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: corsHeaders() });
}

function parseIds(req: Request, body?: { ids?: unknown; icon_ids?: unknown }) {
	const url = new URL(req.url);
	const fromQuery = url.searchParams.get("ids") ?? url.searchParams.get("icon_ids");
	if (fromQuery) {
		return fromQuery
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean);
	}
	const fromBody = body?.ids ?? body?.icon_ids;
	if (Array.isArray(fromBody)) {
		return fromBody.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
	}
	return [];
}

async function handle(req: Request, body?: { ids?: unknown; icon_ids?: unknown }) {
	const ids = parseIds(req, body);
	if (ids.length === 0) {
		return apiJson({ error: "Provide ids as a comma-separated query or JSON array (max 20)" }, 400, 0);
	}

	const url = new URL(req.url);
	const color =
		url.searchParams.get("color") ??
		(typeof body === "object" && body && "color" in (body as object)
			? String((body as { color?: string }).color)
			: undefined);
	const sizeRaw = url.searchParams.get("size");
	const size = sizeRaw ? Number.parseInt(sizeRaw, 10) : undefined;

	const result = await publicGetIcons(ids, {
		color: color || undefined,
		size: Number.isFinite(size) ? size : undefined,
	});
	return apiJson(result, 200, 120);
}

export async function GET(req: Request) {
	try {
		return await handle(req);
	} catch (error) {
		console.error("[api/v1/icons]", error);
		return apiJson({ error: "Failed to load icons" }, 500, 0);
	}
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as { ids?: unknown; icon_ids?: unknown; color?: string };
		return await handle(req, body);
	} catch (error) {
		console.error("[api/v1/icons]", error);
		return apiJson({ error: "Failed to load icons" }, 500, 0);
	}
}
