/**
 * MCP registry discovery document served at `/.well-known/mcp.json`.
 *
 * Shape follows the official MCP Registry `server.json` schema
 * (https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json).
 * Client config (`mcpServers`) is a different format — directories and
 * well-known discovery expect this registry manifest instead.
 */
export const MCP_DISCOVERY_DOCUMENT = {
	$schema:
		"https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
	name: "com.leularia/aria-icons",
	title: "Aria Icons",
	description:
		"340k SVG icons — browser, CLI (writes source), and MCP for Cursor/Claude.",
	version: "1.0.0",
	websiteUrl: "https://icons.leularia.com",
	repository: {
		url: "https://github.com/LeulAria/Aria-Icons",
		source: "github",
	},
	icons: [
		{
			src: "https://icons.leularia.com/logo.svg",
			mimeType: "image/svg+xml" as const,
			sizes: ["any"],
		},
	],
	remotes: [
		{
			type: "streamable-http" as const,
			url: "https://icons.leularia.com/api/mcp",
		},
	],
	packages: [
		{
			registryType: "npm",
			registryBaseUrl: "https://registry.npmjs.org",
			identifier: "aria-icons",
			version: "0.1.1",
			transport: {
				type: "stdio" as const,
			},
		},
	],
} as const;

export const MCP_DISCOVERY_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Accept",
	"Cache-Control": "public, max-age=3600",
} as const;
