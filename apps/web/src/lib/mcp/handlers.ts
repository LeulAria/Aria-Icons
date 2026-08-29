import { parsePublicIconId, toPublicIconId } from "@/lib/icon-id";
import {
	getNamesBySet,
	getSetSummaries,
	listIconNames,
} from "@/lib/icon-meta-index";
import { resolveIconSvgByName } from "@/lib/icon-resolve";
import { getAllIconSetIds } from "@/lib/icon-sources";
import {
	formatPublicIcon,
	isPublicIconFormat,
	publicEquivalentIcon,
	publicGetIcon,
	publicGetIcons,
	publicListCollections,
	publicSearch,
	publicSimilarIcons,
	type PublicIconFormat,
} from "@/lib/public-api";
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
				prefix: {
					type: "string",
					description:
						"Alias for set. Friendly names work too: lucide, tabler, mdi.",
				},
				collection: {
					type: "string",
					description: "Alias for set/prefix.",
				},
				style: {
					type: "string",
					description: "Optional style filter: outline, solid, or a style id.",
				},
				limit: {
					type: "number",
					description: "Max results to return (default 24, max 999)",
				},
				include_svg: {
					type: "boolean",
					description: "Include SVG previews for the first results (default true).",
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
				icon_id: {
					type: "string",
					description: "Icon id, e.g. lucide:house (preferred)",
				},
				iconId: {
					type: "string",
					description:
						"Alias for icon_id. Also accepts legacy 'lucide-icons-house'.",
				},
				variant: {
					type: "string",
					description:
						"Optional brand variant for theSVG icons: default, mono, light, dark, wordmark, …",
				},
			},
		},
	},
	{
		name: "get_icon",
		description:
			"Get SVG plus metadata for an icon. Prefer this over get_icon_svg. Icon ids look like 'lucide:house' or 'mdi:account'.",
		inputSchema: {
			type: "object",
			properties: {
				icon_id: {
					type: "string",
					description: "Icon id ('lucide:house') or legacy ('lucide-icons-house')",
				},
				iconId: { type: "string", description: "Alias for icon_id" },
				color: { type: "string", description: "CSS color or currentColor" },
				size: { type: "number", description: "Size in pixels" },
				variant: { type: "string", description: "theSVG variant (mono, wordmark, …)" },
			},
		},
	},
	{
		name: "get_icon_component",
		description:
			"Get framework component source for an icon (react, vue, svelte, solid, flutter, react-native, svg).",
		inputSchema: {
			type: "object",
			properties: {
				icon_id: { type: "string", description: "Icon id, e.g. lucide:house" },
				iconId: { type: "string", description: "Alias for icon_id" },
				framework: {
					type: "string",
					description: "react | vue | svelte | solid | flutter | react-native | svg",
				},
				color: { type: "string" },
				size: { type: "number" },
			},
		},
	},
	{
		name: "get_icons",
		description: "Batch-fetch up to 20 icons. More efficient than multiple get_icon calls.",
		inputSchema: {
			type: "object",
			properties: {
				icon_ids: {
					type: "array",
					items: { type: "string" },
					description: "Array of icon ids (max 20)",
				},
				color: { type: "string" },
				size: { type: "number" },
			},
			required: ["icon_ids"],
		},
	},
	{
		name: "list_collections",
		description: "List icon collections with counts. Filter with search.",
		inputSchema: {
			type: "object",
			properties: {
				search: { type: "string", description: "Filter collections by name or id" },
				limit: { type: "number" },
			},
		},
	},
	{
		name: "find_similar_icons",
		description:
			"Find the same icon in other collections, plus related names.",
		inputSchema: {
			type: "object",
			properties: {
				icon_id: { type: "string", description: "e.g. lucide:house" },
				iconId: { type: "string" },
				limit: { type: "number" },
			},
		},
	},
	{
		name: "find_equivalent_icon",
		description:
			"Map an icon to the closest match in a target collection (used by migrate).",
		inputSchema: {
			type: "object",
			properties: {
				icon_id: { type: "string" },
				iconId: { type: "string" },
				to: {
					type: "string",
					description: "Target collection, e.g. lucide or tabler-icons",
				},
			},
			required: ["to"],
		},
	},
	{
		name: "recommend_icons",
		description: "Recommend icons for a UI use case (settings button, auth, navigation, …).",
		inputSchema: {
			type: "object",
			properties: {
				use_case: { type: "string", description: "What the icon is for" },
				style: { type: "string", description: "outline, solid, or any" },
				limit: { type: "number" },
			},
			required: ["use_case"],
		},
	},
	{
		name: "add_icon_to_project",
		description:
			"Prepare an icon component for the project. Remote HTTP cannot write the user's disk — returns file name, component source, and import. Local stdio MCP (`npx -y aria-icons`) writes the file.",
		inputSchema: {
			type: "object",
			properties: {
				icon_id: { type: "string", description: "lucide:house or house" },
				iconId: { type: "string" },
				framework: {
					type: "string",
					description: "react | vue | svelte | solid | flutter | react-native | svg",
				},
				out_dir: { type: "string" },
				variant: { type: "string" },
			},
			required: ["icon_id"],
		},
	},
	{
		name: "doctor_project_icons",
		description:
			"Remote servers cannot scan a local repo. Use stdio MCP or `aria-icons doctor`.",
		inputSchema: {
			type: "object",
			properties: {
				dir: { type: "string" },
			},
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

function readIconId(args: Record<string, unknown> | undefined): string {
	if (typeof args?.icon_id === "string") return args.icon_id;
	if (typeof args?.iconId === "string") return args.iconId;
	return "";
}

export async function handleToolsCall(
	name: string,
	args: Record<string, unknown> | undefined,
	era: ProtocolEra = "modern",
) {
	if (name === "search_icons") {
		const query = typeof args?.query === "string" ? args.query.trim() : "";
		if (!query) return toolErrorResult(era, "query is required");
		const collection =
			(typeof args?.collection === "string" && args.collection) ||
			(typeof args?.prefix === "string" && args.prefix) ||
			(typeof args?.set === "string" && args.set) ||
			undefined;
		const style = typeof args?.style === "string" ? args.style : undefined;
		const limit = typeof args?.limit === "number" ? args.limit : undefined;
		const includeSvg = args?.include_svg !== false;

		try {
			const result = await publicSearch({
				query,
				collection,
				style,
				limit,
				includeSvg,
				prefer: collection,
			});
			return toolJsonResult(era, {
				query: result.query,
				total: result.total,
				results: result.icons.map((r) => ({
					id: r.id,
					iconId: r.legacyId,
					icon_id: r.id,
					set: r.set,
					name: r.name,
					styles: r.styles,
					...(r.tags ? { tags: r.tags } : {}),
					score: r.score,
					...(r.svg ? { svg: r.svg } : {}),
				})),
				hint: "Use get_icon or add_icon_to_project with an id like lucide:house.",
			});
		} catch (error) {
			return toolErrorResult(
				era,
				error instanceof Error ? error.message : "Search failed",
			);
		}
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
		const iconId = readIconId(args);
		if (!iconId) {
			return toolErrorResult(era, "iconId is required");
		}

		const knownSetIds = await getAllIconSetIds();
		const parsed = parsePublicIconId(iconId, knownSetIds);
		if (!parsed) {
			return toolErrorResult(
				era,
				`Could not resolve '${iconId}' to a known icon set. Expected 'lucide:house' or 'setId-iconName'.`,
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
			id: toPublicIconId(resolved.setId, resolved.name),
			iconId,
			setId: resolved.setId,
			iconName: resolved.name,
			styleId: resolved.styleId,
			svg: resolved.svg,
		});
	}

	if (name === "get_icon") {
		const iconId = readIconId(args);
		if (!iconId) return toolErrorResult(era, "icon_id is required");
		const color = typeof args?.color === "string" ? args.color : undefined;
		const variant = typeof args?.variant === "string" ? args.variant : undefined;
		const size = typeof args?.size === "number" ? args.size : undefined;
		const icon = await publicGetIcon(iconId, { color, variant, size });
		if (!icon) return toolErrorResult(era, `Icon '${iconId}' not found`);
		return toolJsonResult(era, {
			...icon,
			react: await formatPublicIcon(icon, "react"),
			vue: await formatPublicIcon(icon, "vue"),
			svelte: await formatPublicIcon(icon, "svelte"),
			hint: "Copy the framework snippet you need, or use get_icon_component for one format.",
		});
	}

	if (name === "get_icon_component") {
		const iconId = readIconId(args);
		if (!iconId) return toolErrorResult(era, "icon_id is required");
		const frameworkRaw =
			typeof args?.framework === "string" ? args.framework.toLowerCase() : "react";
		const framework = frameworkRaw === "svg" ? "svg" : frameworkRaw;
		if (!isPublicIconFormat(framework) && framework !== "svg") {
			return toolErrorResult(
				era,
				"framework must be react, vue, svelte, solid, flutter, react-native, or svg",
			);
		}
		const color = typeof args?.color === "string" ? args.color : undefined;
		const size = typeof args?.size === "number" ? args.size : undefined;
		const icon = await publicGetIcon(iconId, { color, size });
		if (!icon) return toolErrorResult(era, `Icon '${iconId}' not found`);
		const format = (framework === "svg" ? "svg" : framework) as PublicIconFormat;
		const code = await formatPublicIcon(icon, format);
		return toolJsonResult(era, { ...icon, framework: format, code });
	}

	if (name === "get_icons") {
		const iconIds = Array.isArray(args?.icon_ids)
			? args.icon_ids.filter((id): id is string => typeof id === "string")
			: [];
		if (iconIds.length === 0) return toolErrorResult(era, "icon_ids is required");
		const color = typeof args?.color === "string" ? args.color : undefined;
		const size = typeof args?.size === "number" ? args.size : undefined;
		const result = await publicGetIcons(iconIds, { color, size });
		return toolJsonResult(era, result);
	}

	if (name === "list_collections") {
		const search = typeof args?.search === "string" ? args.search : undefined;
		const limit = typeof args?.limit === "number" ? args.limit : undefined;
		const result = await publicListCollections({ search, limit });
		return toolJsonResult(era, result);
	}

	if (name === "find_similar_icons") {
		const iconId = readIconId(args);
		if (!iconId) return toolErrorResult(era, "icon_id is required");
		const limit = typeof args?.limit === "number" ? args.limit : 10;
		const result = await publicSimilarIcons(iconId, limit);
		return toolJsonResult(era, result);
	}

	if (name === "find_equivalent_icon") {
		const iconId = readIconId(args);
		const to = typeof args?.to === "string" ? args.to : "";
		if (!iconId) return toolErrorResult(era, "icon_id is required");
		if (!to) return toolErrorResult(era, "to (target collection) is required");
		const icon = await publicEquivalentIcon(iconId, to);
		if (!icon) {
			return toolErrorResult(era, `No equivalent for '${iconId}' in '${to}'`);
		}
		return toolJsonResult(era, { from: iconId, to: icon });
	}

	if (name === "recommend_icons") {
		const useCase =
			typeof args?.use_case === "string" ? args.use_case.trim() : "";
		if (!useCase) return toolErrorResult(era, "use_case is required");
		const style = typeof args?.style === "string" ? args.style : undefined;
		const limit = typeof args?.limit === "number" ? args.limit : 10;
		const result = await publicSearch({
			query: useCase,
			style: style === "any" ? undefined : style,
			limit,
		});
		return toolJsonResult(era, {
			use_case: useCase,
			icons: result.icons,
		});
	}

	if (name === "add_icon_to_project") {
		const iconId = readIconId(args);
		if (!iconId) return toolErrorResult(era, "icon_id is required");
		const frameworkRaw =
			typeof args?.framework === "string" ? args.framework.toLowerCase() : "react";
		const framework = (frameworkRaw === "svg" ? "svg" : frameworkRaw) as PublicIconFormat;
		if (!isPublicIconFormat(framework) && frameworkRaw !== "svg") {
			return toolErrorResult(era, "framework must be react, vue, svelte, solid, flutter, react-native, or svg");
		}
		const variant = typeof args?.variant === "string" ? args.variant : undefined;
		const outDir =
			typeof args?.out_dir === "string" ? args.out_dir : "src/components/icons";
		const icon = await publicGetIcon(iconId, { variant });
		if (!icon) return toolErrorResult(era, `Icon '${iconId}' not found`);
		const format = (frameworkRaw === "svg" ? "svg" : framework) as PublicIconFormat;
		const code = await formatPublicIcon(icon, format);
		const ext =
			format === "vue" ? "vue" : format === "svelte" ? "svelte" : format === "svg" ? "svg" : "tsx";
		const fileBase = icon.name.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
		const component = icon.name
			.replace(/[^a-zA-Z0-9]+/g, " ")
			.trim()
			.split(/\s+/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join("");
		return toolJsonResult(era, {
			wrote: false,
			remote: true,
			id: icon.id,
			componentName: component || "Icon",
			fileName: `${fileBase}.${ext}`,
			outDir,
			code,
			importStatement: `import { ${component || "Icon"} } from "@/components/icons"`,
			hint: "Remote MCP cannot write files. Save `code` to outDir/fileName (and add a barrel export), or run `npx -y --package=aria-icons -- aria-icons add ${icon.id}` / use the stdio MCP.",
		});
	}

	if (name === "doctor_project_icons") {
		return toolJsonResult(era, {
			remote: true,
			hint: "This HTTP server cannot see your repo. Run `aria-icons doctor` or use the stdio MCP (`npx -y aria-icons`).",
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
