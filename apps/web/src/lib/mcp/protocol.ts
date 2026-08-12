import { NextRequest } from "next/server";
import {
	MCP_ERROR,
	PROTOCOL_VERSION,
	SERVER_INFO,
	SUPPORTED_VERSIONS,
} from "./constants";

export type JsonRpcRequest = {
	jsonrpc: "2.0";
	id?: string | number | null;
	method: string;
	params?: Record<string, unknown> & {
		_meta?: RequestMeta;
	};
};

export type RequestMeta = {
	"io.modelcontextprotocol/protocolVersion"?: string;
	"io.modelcontextprotocol/clientInfo"?: {
		name: string;
		version: string;
	};
	"io.modelcontextprotocol/clientCapabilities"?: Record<string, unknown>;
};

export type JsonRpcError = {
	jsonrpc: "2.0";
	id: string | number | null;
	error: {
		code: number;
		message: string;
		data?: unknown;
	};
};

export type ProtocolEra = "modern" | "legacy";

export type JsonRpcSuccess<T> = {
	jsonrpc: "2.0";
	id: string | number | null;
	result: T;
};

function decodeHeaderValue(value: string): string {
	const match = value.match(/^=\?base64\?(.+)\?=$/);
	if (match) {
		return Buffer.from(match[1], "base64").toString("utf-8");
	}
	return value;
}

export function getHeader(req: NextRequest, name: string): string | null {
	return req.headers.get(name) ?? req.headers.get(name.toLowerCase());
}

export function getRequestMeta(body: JsonRpcRequest): RequestMeta {
	return (body.params?._meta as RequestMeta | undefined) ?? {};
}

export function completeResult<T extends Record<string, unknown>>(
	result: T,
): T & {
	resultType: "complete";
	_meta: { "io.modelcontextprotocol/serverInfo": typeof SERVER_INFO };
} {
	return {
		...result,
		resultType: "complete",
		_meta: {
			"io.modelcontextprotocol/serverInfo": SERVER_INFO,
		},
	};
}

export function wrapEraResult<T extends Record<string, unknown>>(
	era: ProtocolEra,
	result: T,
	cache?: { ttlMs: number; cacheScope: "public" | "private" },
): Record<string, unknown> {
	if (era === "modern") {
		return completeResult({ ...result, ...cache });
	}
	return result;
}

/**
 * Modern (2026-07-28) clients send per-request `_meta` / protocol headers.
 * Cursor and other handshake clients send `initialize` first and omit those.
 */
export function isModernRequest(
	req: NextRequest,
	body: JsonRpcRequest,
): boolean {
	if (
		body.method === "initialize" ||
		body.method === "ping" ||
		body.method === "notifications/initialized" ||
		body.method === "initialized"
	) {
		return false;
	}

	const meta = getRequestMeta(body);
	const metaVersion = meta["io.modelcontextprotocol/protocolVersion"];
	const headerVersion = getHeader(req, "MCP-Protocol-Version");

	return (
		metaVersion === PROTOCOL_VERSION ||
		headerVersion === PROTOCOL_VERSION ||
		body.method === "server/discover"
	);
}

export function jsonRpcError(
	id: string | number | null,
	code: number,
	message: string,
	data?: unknown,
): JsonRpcError {
	return {
		jsonrpc: "2.0",
		id,
		error: { code, message, ...(data !== undefined ? { data } : {}) },
	};
}

export function jsonResponse(
	body: JsonRpcError | JsonRpcSuccess<Record<string, unknown>>,
	status = 200,
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers":
				"Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id, Last-Event-ID, Mcp-Param-*",
		},
	});
}

export function validateRequest(
	req: NextRequest,
	body: JsonRpcRequest,
): JsonRpcError | null {
	const id = body.id ?? null;
	const meta = getRequestMeta(body);
	const headerVersion = getHeader(req, "MCP-Protocol-Version");
	const metaVersion = meta["io.modelcontextprotocol/protocolVersion"];

	if (!headerVersion) {
		return jsonRpcError(
			id,
			MCP_ERROR.HEADER_MISMATCH,
			"Missing required header: MCP-Protocol-Version",
		);
	}

	if (!metaVersion) {
		return jsonRpcError(
			id,
			MCP_ERROR.HEADER_MISMATCH,
			"Missing required field: params._meta.io.modelcontextprotocol/protocolVersion",
		);
	}

	if (headerVersion !== metaVersion) {
		return jsonRpcError(
			id,
			MCP_ERROR.HEADER_MISMATCH,
			`Header mismatch: MCP-Protocol-Version header '${headerVersion}' does not match body value '${metaVersion}'`,
		);
	}

	if (
		!SUPPORTED_VERSIONS.includes(
			metaVersion as (typeof SUPPORTED_VERSIONS)[number],
		)
	) {
		return jsonRpcError(
			id,
			MCP_ERROR.UNSUPPORTED_PROTOCOL_VERSION,
			"Unsupported protocol version",
			{ supported: [...SUPPORTED_VERSIONS], requested: metaVersion },
		);
	}

	const mcpMethod = getHeader(req, "Mcp-Method");
	if (!mcpMethod) {
		return jsonRpcError(
			id,
			MCP_ERROR.HEADER_MISMATCH,
			"Missing required header: Mcp-Method",
		);
	}

	if (mcpMethod !== body.method) {
		return jsonRpcError(
			id,
			MCP_ERROR.HEADER_MISMATCH,
			`Header mismatch: Mcp-Method header '${mcpMethod}' does not match body value '${body.method}'`,
		);
	}

	if (body.method === "tools/call") {
		const toolName = body.params?.name;
		const headerName = getHeader(req, "Mcp-Name");
		if (!headerName) {
			return jsonRpcError(
				id,
				MCP_ERROR.HEADER_MISMATCH,
				"Missing required header: Mcp-Name",
			);
		}
		if (decodeHeaderValue(headerName) !== toolName) {
			return jsonRpcError(
				id,
				MCP_ERROR.HEADER_MISMATCH,
				`Header mismatch: Mcp-Name header '${headerName}' does not match body value '${String(toolName)}'`,
			);
		}
	}

	if (body.method === "resources/read") {
		const uri = body.params?.uri;
		const headerName = getHeader(req, "Mcp-Name");
		if (!headerName) {
			return jsonRpcError(
				id,
				MCP_ERROR.HEADER_MISMATCH,
				"Missing required header: Mcp-Name",
			);
		}
		if (decodeHeaderValue(headerName) !== uri) {
			return jsonRpcError(
				id,
				MCP_ERROR.HEADER_MISMATCH,
				`Header mismatch: Mcp-Name header '${headerName}' does not match body value '${String(uri)}'`,
			);
		}
	}

	return null;
}

export function isNotification(body: JsonRpcRequest): boolean {
	return body.id === undefined || body.id === null;
}

export { PROTOCOL_VERSION };
