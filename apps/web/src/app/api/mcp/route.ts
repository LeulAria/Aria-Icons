import { NextRequest } from "next/server";
import { MCP_ERROR } from "@/lib/mcp/constants";
import {
	handleDiscover,
	handleResourcesList,
	handleResourcesRead,
	handleToolsCall,
	handleToolsList,
	ResourceError,
} from "@/lib/mcp/handlers";
import {
	isNotification,
	jsonResponse,
	jsonRpcError,
	type JsonRpcRequest,
	validateRequest,
} from "@/lib/mcp/protocol";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Param-*",
};

async function dispatchRequest(body: JsonRpcRequest) {
	switch (body.method) {
		case "server/discover":
			return handleDiscover();

		case "tools/list":
			return handleToolsList();

		case "tools/call": {
			const { name, arguments: args } = (body.params ?? {}) as {
				name: string;
				arguments?: Record<string, unknown>;
			};
			return await handleToolsCall(name, args);
		}

		case "resources/list":
			return handleResourcesList();

		case "resources/read": {
			const { uri } = (body.params ?? {}) as { uri: string };
			return await handleResourcesRead(uri);
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

		const validationError = validateRequest(req, body);
		if (validationError) {
			const status =
				validationError.error.code === MCP_ERROR.UNSUPPORTED_PROTOCOL_VERSION
					? 400
					: 400;
			return jsonResponse(validationError, status);
		}

		const result = await dispatchRequest(body);
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
 * GET is not supported in MCP 2026-07-28 Streamable HTTP.
 * Each request is an independent POST; there is no session SSE stream.
 */
export async function GET() {
	return jsonResponse(
		jsonRpcError(
			null,
			MCP_ERROR.METHOD_NOT_FOUND,
			"GET is not supported. Use POST for all MCP requests (protocol 2026-07-28).",
		),
		405,
	);
}
