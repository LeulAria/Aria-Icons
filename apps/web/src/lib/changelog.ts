export type ChangelogEntry = {
	date: string;
	version: string;
	title: string;
	tag: string;
	summary: string;
	removed?: string[];
	added?: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
	{
		date: "2026-08-13",
		version: "dual-era",
		title: "Cursor MCP compatibility",
		tag: "MCP",
		summary:
			"The remote MCP endpoint now speaks both the stateless `2026-07-28` protocol and the handshake-based protocol Cursor still uses. No session stickiness — `initialize` is answered in-request and then forgotten.",
		added: [
			"Added dual-era Streamable HTTP: Cursor `initialize` / `tools/list` / `tools/call` work without the new MCP headers.",
			"Added `ping` and `notifications/initialized` handling for handshake clients.",
			"Kept `server/discover` and per-request `_meta` validation for `2026-07-28` clients.",
		],
	},
	{
		date: "2026-08-09",
		version: "2026-07-28",
		title: "Stateless MCP architecture",
		tag: "MCP",
		summary:
			"Migrated the remote MCP server to protocol `2026-07-28`. Every request is now self-contained — no sessions, no handshake, ready for serverless deployment.",
		removed: [
			"Removed the `initialize` / `initialized` handshake in favor of per-request metadata.",
			"Removed `Mcp-Session-Id` and all session stickiness from the Streamable HTTP transport.",
			"Removed the GET SSE stream endpoint (deprecated HTTP+SSE transport).",
			"Removed the `@modelcontextprotocol/sdk` dependency and duplicated handler code.",
			"Dropped support for legacy protocol version `2024-11-05`.",
		],
		added: [
			"Added `server/discover` to advertise supported versions, capabilities, and server identity.",
			"Added per-request validation of `params._meta.io.modelcontextprotocol/protocolVersion`.",
			"Added required HTTP headers: `MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name`.",
			"Added `resultType: \"complete\"` on all JSON-RPC results.",
			"Added `io.modelcontextprotocol/serverInfo` in `_meta` on every response.",
			"Added cache hints (`ttlMs` + `cacheScope: \"public\"`) on discover, list, and read operations.",
			"Added spec error codes `-32020` (HeaderMismatch), `-32022` (UnsupportedProtocolVersion), and `-32601` (Method not found).",
		],
	},
	{
		date: "2025-12-13",
		version: "2024-11-05",
		title: "Initial MCP server",
		tag: "MCP",
		summary:
			"Shipped the first remote MCP endpoint for Aria Icons with tools and resources over Streamable HTTP using the legacy session-based protocol.",
		added: [
			"Added `POST /api/mcp` as a JSON-RPC endpoint for remote MCP clients.",
			"Added the `initialize` / `initialized` session handshake.",
			"Added tools: `list_icons` and `get_icon_svg`.",
			"Added resources for each icon set and a combined `all` resource.",
			"Added the MCP connect dialog in the UI.",
		],
	},
];
