import {
	apiJson,
	apiText,
	corsHeaders,
	formatPublicIcon,
	isPublicIconFormat,
	publicGetIcon,
	type PublicIconFormat,
} from "@/lib/public-api";

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

	const formatRaw = (url.searchParams.get("format") ?? "json").toLowerCase();
	const color = url.searchParams.get("color") ?? undefined;
	const variant = url.searchParams.get("variant") ?? undefined;
	const sizeRaw = url.searchParams.get("size");
	const size = sizeRaw ? Number.parseInt(sizeRaw, 10) : undefined;

	try {
		const icon = await publicGetIcon(id, {
			color,
			variant,
			size: Number.isFinite(size) ? size : undefined,
		});
		if (!icon) {
			return apiJson(
				{
					error: `Icon '${id}' not found. Use collection:name (e.g. lucide:house).`,
				},
				404,
				0,
			);
		}

		if (formatRaw === "json") {
			return apiJson(icon, 200, 300);
		}

		if (isPublicIconFormat(formatRaw)) {
			const body = await formatPublicIcon(icon, formatRaw as PublicIconFormat);
			const contentType =
				formatRaw === "svg" || formatRaw === "html"
					? "image/svg+xml; charset=utf-8"
					: "text/plain; charset=utf-8";
			return apiText(body, contentType);
		}

		return apiJson(
			{ error: `Unknown format '${formatRaw}'. Use json, svg, react, vue, svelte, solid, flutter, react-native.` },
			400,
			0,
		);
	} catch (error) {
		console.error("[api/v1/icon]", error);
		return apiJson({ error: "Failed to load icon" }, 500, 0);
	}
}
