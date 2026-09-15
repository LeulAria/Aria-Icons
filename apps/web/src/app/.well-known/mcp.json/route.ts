import {
	MCP_DISCOVERY_DOCUMENT,
	MCP_DISCOVERY_HEADERS,
} from "@/lib/mcp/discovery";

export const runtime = "nodejs";

/**
 * Public MCP discovery for directories (mcpub.dev, etc.) and clients.
 * GET https://icons.leularia.com/.well-known/mcp.json
 */
export async function GET() {
	return Response.json(MCP_DISCOVERY_DOCUMENT, {
		headers: MCP_DISCOVERY_HEADERS,
	});
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: MCP_DISCOVERY_HEADERS,
	});
}
