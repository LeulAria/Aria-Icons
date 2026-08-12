import { NextRequest } from "next/server";
import { MCP_ERROR } from "@/lib/mcp/constants";
import {
	handleDiscover,
	handleInitialize,
	handleResourcesList,
	handleResourcesRead,
	handleToolsCall,
	handleToolsList,
	ResourceError,
} from "@/lib/mcp/handlers";
import {
	isModernRequest,
	isNotification,
	jsonResponse,
	jsonRpcError,
	type JsonRpcRequest,
	type ProtocolEra,
	validateRequest,
} from "@/lib/mcp/protocol";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id, Last-Event-ID, Mcp-Param-*",
};

async function dispatchRequest(body: JsonRpcRequest, era: ProtocolEra) {
	switch (body.method) {
		case "initialize":
			return handleInitialize(body.params?.protocolVersion);

		case "ping":
			return {};

		case "server/discover":
			return handleDiscover(era);

		case "tools/list":
			return handleToolsList(era);

		case "tools/call": {
			const { name, arguments: args } = (body.params ?? {}) as {
				name: string;
				arguments?: Record<string, unknown>;
			};
			return await handleToolsCall(name, args, era);
		}

		case "resources/list":
			return handleResourcesList(era);

		case "resources/read": {
			const { uri } = (body.params ?? {}) as { uri: string };
			return await handleResourcesRead(uri, era);
		}

		default:
			throw new MethodNotFoundError(body.method);
	}
}

class MethodNotFoundError extends Error {
	constructor(method: string) {
		super(`Method not found: ${method}`);
		this.name = "MethodNotFoundError";
	}
}

export async function POST(req: NextRequest) {
	let body: JsonRpcRequest | null = null;

	try {
		body = (await req.json()) as JsonRpcRequest;

		if (isNotification(body)) {
			return new Response(null, { status: 202, headers: CORS_HEADERS });
		}

		const era: ProtocolEra = isModernRequest(req, body) ? "modern" : "legacy";

		if (era === "modern") {
			const validationError = validateRequest(req, body);
			if (validationError) {
				return jsonResponse(validationError, 400);
			}
		}

		const result = await dispatchRequest(body, era);
		return jsonResponse({
			jsonrpc: "2.0",
			id: body.id ?? null,
			result,
		});
	} catch (error) {
		const id = body?.id ?? null;

		if (error instanceof MethodNotFoundError) {
			return jsonResponse(
				jsonRpcError(id, MCP_ERROR.METHOD_NOT_FOUND, error.message),
				404,
			);
		}

		if (error instanceof ResourceError) {
			return jsonResponse(
				jsonRpcError(id, MCP_ERROR.INVALID_PARAMS, error.message),
				200,
			);
		}

		console.error("[MCP] Error processing request:", error);
		return jsonResponse(
			jsonRpcError(
				id,
				MCP_ERROR.INTERNAL_ERROR,
				error instanceof Error ? error.message : "Internal error",
			),
			500,
		);
	}
}

export async function OPTIONS() {
	return new Response(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * Streamable HTTP GET (optional SSE stream) is unused: this server is
 * stateless and has no server-initiated notifications. Cursor and other
 * clients fall back to POST-only after 405.
 */
export async function GET() {
	return jsonResponse(
		jsonRpcError(
			null,
			MCP_ERROR.METHOD_NOT_FOUND,
			"GET is not supported. Use POST for JSON-RPC requests.",
		),
		405,
	);
}
