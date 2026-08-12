export const PROTOCOL_VERSION = "2026-07-28" as const;

export const SUPPORTED_VERSIONS = [PROTOCOL_VERSION] as const;

/** Handshake-based protocol revisions still used by Cursor and other clients. */
export const LEGACY_PROTOCOL_VERSIONS = [
	"2025-11-25",
	"2025-06-18",
	"2025-03-26",
	"2024-11-05",
] as const;

export const PREFERRED_LEGACY_VERSION = "2025-06-18" as const;

export function negotiateLegacyVersion(requested: unknown): string {
	if (
		typeof requested === "string" &&
		(LEGACY_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
	) {
		return requested;
	}
	return PREFERRED_LEGACY_VERSION;
}

export const SERVER_INFO = {
	name: "aria-icons",
	version: "1.0.0",
} as const;

export const SERVER_CAPABILITIES = {
	tools: {},
	resources: {},
} as const;

export const SERVER_INSTRUCTIONS =
	"Aria Icons MCP server: 340k+ icons across UI sets (lucide, heroicons, tabler, …), theSVG brand logos, and 200+ Iconify sets (ph, mdi, ri, logos, …). Use search_icons to find icons by keyword (searches names, brand titles, aliases, and categories), list_icons to browse sets, and get_icon_svg with an iconId like 'heroicons-academic-cap' or 'thesvg-github' to retrieve SVG content.";

/** Cache hints for static icon metadata (1 hour). */
export const LIST_CACHE = {
	ttlMs: 3_600_000,
	cacheScope: "public" as const,
};

/** Cache hints for individual icon SVG reads (24 hours). */
export const READ_CACHE = {
	ttlMs: 86_400_000,
	cacheScope: "public" as const,
};

export const MCP_ERROR = {
	HEADER_MISMATCH: -32_020,
	UNSUPPORTED_PROTOCOL_VERSION: -32_022,
	METHOD_NOT_FOUND: -32_601,
	INVALID_PARAMS: -32_602,
	INTERNAL_ERROR: -32_603,
	PARSE_ERROR: -32_700,
} as const;
