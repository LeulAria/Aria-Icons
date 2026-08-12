import {
	getNamesBySet,
	getSetSummaries,
	listIconNames,
	searchIcons,
} from "@/lib/icon-meta-index";
import { parseIconId, resolveIconSvgByName } from "@/lib/icon-resolve";
import { getAllIconSetIds } from "@/lib/icon-sources";
import {
	LIST_CACHE,
	READ_CACHE,
	SERVER_CAPABILITIES,
	SERVER_INFO,
	SERVER_INSTRUCTIONS,
	SUPPORTED_VERSIONS,
	negotiateLegacyVersion,
} from "./constants";
import { type ProtocolEra, wrapEraResult } from "./protocol";

const TOOLS = [
	{
		name: "search_icons",
		description:
			"Fuzzy-search icons across all sets by name and metadata (brand titles, aliases, categories). Returns ranked matches with icon ids usable with get_icon_svg. Prefer this over list_icons when looking for a specific icon.",
		inputSchema: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description:
						"Search terms, e.g. 'shopping cart', 'github', 'arrow right'",
				},
				set: {
					type: "string",
					description:
						"Optional set id to restrict the search (e.g. 'lucide-icons', 'thesvg', 'ph'). Omit to search everything.",
				},
				limit: {
					type: "number",
					description: "Max results to return (default 24, max 100)",
				},
			},
			required: ["query"],
		},
	},
	{
		name: "list_icons",
		description:
			"List available icons in an organized way. Without arguments, returns a summary of all icon sets with counts. Pass 'set' to page through the icon names of one set.",
		inputSchema: {
			type: "object",
			properties: {
				set: {
					type: "string",
					description: "Icon set id to list (e.g. 'heroicons', 'thesvg', 'mdi')",
				},
				offset: {
					type: "number",
					description: "Pagination offset (default 0)",
				},
				limit: {
					type: "number",
					description: "Max names per page (default 500, max 2000)",
				},
			},
		},
	},
	{
		name: "get_icon_svg",
		description:
			"Get the SVG content for a specific icon. The icon identifier should be in the format 'setId-iconName' (e.g., 'heroicons-academic-cap', 'thesvg-github', 'ph-acorn-bold'). For theSVG brand icons an optional 'variant' selects e.g. 'mono' or 'wordmark'.",
		inputSchema: {
			type: "object",
			properties: {
				iconId: {
					type: "string",
					description:
						"Icon identifier in format 'setId-iconName' (e.g., 'heroicons-academic-cap', 'lucide-icons-home', 'thesvg-github')",
				},
				variant: {
					type: "string",
					description:
						"Optional brand variant for theSVG icons: default, mono, light, dark, wordmark, …",
				},
			},
			required: ["iconId"],
		},
	},
] as const;

export function handleInitialize(requestedVersion: unknown) {
	return {
		protocolVersion: negotiateLegacyVersion(requestedVersion),
		capabilities: SERVER_CAPABILITIES,
		serverInfo: SERVER_INFO,
		instructions: SERVER_INSTRUCTIONS,
	};
}

export function handleDiscover(era: ProtocolEra = "modern") {
	return wrapEraResult(
		era,
		{
			supportedVersions: [...SUPPORTED_VERSIONS],
			capabilities: SERVER_CAPABILITIES,
			instructions: SERVER_INSTRUCTIONS,
		},
		LIST_CACHE,
	);
}

export function handleToolsList(era: ProtocolEra = "modern") {
	return wrapEraResult(
		era,
		{
			tools: [...TOOLS],
		},
		LIST_CACHE,
	);
}

function toolErrorResult(era: ProtocolEra, message: string) {
	return wrapEraResult(era, {
		content: [{ type: "text", text: JSON.stringify({ error: message }) }],
		isError: true,
	});
}

function toolJsonResult(era: ProtocolEra, payload: unknown) {
	return wrapEraResult(era, {
		content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
	});
}

export async function handleToolsCall(
	name: string,
	args: Record<string, unknown> | undefined,
	era: ProtocolEra = "modern",
) {
	if (name === "search_icons") {
		const query = typeof args?.query === "string" ? args.query.trim() : "";
		if (!query) return toolErrorResult(era, "query is required");
		const setId = typeof args?.set === "string" ? args.set : undefined;
		const limit = typeof args?.limit === "number" ? args.limit : undefined;

		if (setId) {
			const known = await getAllIconSetIds();
			if (!known.includes(setId)) {
				return toolErrorResult(
					era,
					`Unknown set: ${setId}. Available sets: ${known.join(", ")}`,
				);
			}
		}

		const { total, results } = await searchIcons({ query, setId, limit });
		return toolJsonResult(era, {
			query,
			total,
			results: results.map((r) => ({
				iconId: r.id,
				set: r.setId,
				name: r.name,
				styles: r.styleIds,
				...(r.tags ? { tags: r.tags.slice(0, 12) } : {}),
				score: r.score,
			})),
			hint: "Use get_icon_svg with an iconId to fetch the SVG.",
		});
	}

	if (name === "list_icons") {
		const setId = typeof args?.set === "string" ? args.set : undefined;

		if (!setId) {
			const summaries = await getSetSummaries();
			return toolJsonResult(era, {
				sets: Object.entries(summaries).map(([id, count]) => ({ id, count })),
				hint: "Pass { set: '<id>' } to list icon names for one set, or use search_icons to find icons by keyword.",
			});
		}

		const summaries = await getSetSummaries();
		if (!(setId in summaries)) {
			return toolErrorResult(
				era,
				`Unknown set: ${setId}. Available sets: ${Object.keys(summaries).join(", ")}`,
			);
		}

		const offset = Math.max(0, typeof args?.offset === "number" ? args.offset : 0);
		const limit = Math.max(
			1,
			Math.min(2000, typeof args?.limit === "number" ? args.limit : 500),
		);
		const page = await listIconNames(setId, offset, limit);
		return toolJsonResult(era, {
			set: setId,
			total: page.total,
			offset,
			icons: page.items,
			nextOffset: page.nextOffset,
		});
	}

	if (name === "get_icon_svg") {
		const iconId = args?.iconId as string | undefined;
		if (!iconId) {
			return toolErrorResult(era, "iconId is required");
		}

		const knownSetIds = await getAllIconSetIds();
		const parsed = parseIconId(iconId, knownSetIds);
		if (!parsed) {
			return toolErrorResult(
				era,
				`Could not resolve '${iconId}' to a known icon set. Expected format 'setId-iconName'. Available sets: ${knownSetIds.join(", ")}`,
			);
		}

		const variant =
			typeof args?.variant === "string" ? args.variant : undefined;
		const resolved = await resolveIconSvgByName(parsed.setId, parsed.name, {
			variant,
		});
		if (!resolved) {
			return toolErrorResult(
				era,
				`Icon '${parsed.name}' not found in set '${parsed.setId}'`,
			);
		}

		return toolJsonResult(era, {
			iconId,
			setId: resolved.setId,
			iconName: resolved.name,
			styleId: resolved.styleId,
			svg: resolved.svg,
		});
	}

	return toolErrorResult(era, `Unknown tool: ${name}`);
}

export async function handleResourcesList(era: ProtocolEra = "modern") {
	const summaries = await getSetSummaries();
	const resources = [];
	let total = 0;

	for (const [setId, count] of Object.entries(summaries)) {
		total += count;
		resources.push({
			uri: `aria-icons://icons/${setId}`,
			name: `${setId} icons`,
			description: `All icons from the ${setId} icon set (${count} icons)`,
			mimeType: "application/json",
		});
	}

	resources.push({
		uri: "aria-icons://icons/all",
		name: "All Icons",
		description: `All available icons from all sets (${total} total)`,
		mimeType: "application/json",
	});

	return wrapEraResult(era, { resources }, LIST_CACHE);
}

export async function handleResourcesRead(
	uri: string,
	era: ProtocolEra = "modern",
) {
	if (!uri.startsWith("aria-icons://icons/")) {
		throw new ResourceError(`Invalid resource URI: ${uri}`);
	}

	const path = uri.replace("aria-icons://icons/", "");

	if (path === "all") {
		const namesBySet = await getNamesBySet();
		return wrapEraResult(
			era,
			{
				contents: [
					{
						uri,
						mimeType: "application/json",
						text: JSON.stringify({ "icons-names": namesBySet }, null, 2),
					},
				],
			},
			READ_CACHE,
		);
	}

	if (path.includes("/")) {
		const [setId, iconName] = path.split("/");
		const resolved = await resolveIconSvgByName(setId, iconName);
		if (resolved) {
			return wrapEraResult(
				era,
				{
					contents: [
						{
							uri,
							mimeType: "image/svg+xml",
							text: resolved.svg,
						},
					],
				},
				READ_CACHE,
			);
		}
		throw new ResourceError(`Resource not found: ${uri}`);
	}

	const namesBySet = await getNamesBySet();
	if (namesBySet[path]) {
		return wrapEraResult(
			era,
			{
				contents: [
					{
						uri,
						mimeType: "application/json",
						text: JSON.stringify(
							{
								setId: path,
								icons: namesBySet[path],
								count: namesBySet[path].length,
							},
							null,
							2,
						),
					},
				],
			},
			READ_CACHE,
		);
	}

	throw new ResourceError(`Resource not found: ${uri}`);
}

export class ResourceError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ResourceError";
	}
}
