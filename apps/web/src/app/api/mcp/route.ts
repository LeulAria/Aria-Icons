import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ListResourcesRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { NextRequest } from "next/server";
import { readSvg, buildIconIndex } from "@/lib/icon-fs";
import { ICON_SETS, type IconSetId } from "@/lib/icon-sets";
import iconsData from "../../../../icons-name.json";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cache for icons-name.json
let iconsNamesCache: typeof iconsData | null = null;

function getIconsNames() {
	if (!iconsNamesCache) {
		iconsNamesCache = iconsData;
	}
	return iconsNamesCache;
}

// Create MCP server instance with resources capability
const server = new Server(
	{
		name: "aria-icons",
		version: "1.0.0",
	},
	{
		capabilities: {
			tools: {},
			resources: {},
		},
	},
);

// Tool: list_icons - Returns all icon names organized by set
server.setRequestHandler(ListToolsRequestSchema, async () => {
	console.log("🎨 [MCP] Tools list requested");
	return {
		tools: [
			{
				name: "list_icons",
				description:
					"List all available icons organized by icon set. Returns a JSON object with icon set names as keys and arrays of icon names as values, plus a flat array of all icon identifiers.",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "get_icon_svg",
				description:
					"Get the SVG content for a specific icon. The icon identifier should be in the format 'setId-iconName' (e.g., 'heroicons-academic-cap').",
				inputSchema: {
					type: "object",
					properties: {
						iconId: {
							type: "string",
							description:
								"Icon identifier in format 'setId-iconName' (e.g., 'heroicons-academic-cap', 'lucide-icons-home')",
						},
					},
					required: ["iconId"],
				},
			},
		],
	};
});

// Tool: get_icon_svg - Returns SVG content for a specific icon
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;
	
	console.log(`🔧 [MCP] Tool called: ${name}`, args ? `with args: ${JSON.stringify(args)}` : "");

	if (name === "list_icons") {
		console.log("📋 [MCP] Listing all icons...");
		const iconsNames = getIconsNames();
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(iconsNames, null, 2),
				},
			],
		};
	}

	if (name === "get_icon_svg") {
		const iconId = args?.iconId as string | undefined;
		
		console.log(`🎯 [MCP] Getting SVG for icon: ${iconId}`);

		if (!iconId) {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({ error: "iconId is required" }),
					},
				],
				isError: true,
			};
		}

		// Parse icon identifier: "setId-iconName"
		const parts = iconId.split("-");
		if (parts.length < 2) {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							error: `Invalid icon identifier format. Expected 'setId-iconName' but got '${iconId}'`,
						}),
					},
				],
				isError: true,
			};
		}

		// Find the setId (first part) and reconstruct the icon name (rest)
		const setId = parts[0] as IconSetId;
		const iconName = parts.slice(1).join("-");

		// Validate setId
		const iconSet = ICON_SETS.find((set) => set.id === setId);
		if (!iconSet) {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							error: `Unknown icon set: ${setId}. Available sets: ${ICON_SETS.map((s) => s.id).join(", ")}`,
						}),
					},
				],
				isError: true,
			};
		}

		// Try to find the icon in any style of this set
		let foundIcon: { filePath: string; styleId: string } | null = null;

		for (const style of iconSet.styles) {
			try {
				const index = await buildIconIndex(setId, style.id);
				const icon = index.icons.find(
					(i) => i.name.toLowerCase() === iconName.toLowerCase(),
				);

				if (icon) {
					foundIcon = { filePath: icon.filePath, styleId: style.id };
					break;
				}
			} catch (error) {
				// Continue to next style
				continue;
			}
		}

		if (!foundIcon) {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							error: `Icon '${iconName}' not found in set '${setId}'`,
						}),
					},
				],
				isError: true,
			};
		}

		// Read and return SVG content
		try {
			const svgContent = await readSvg(setId, foundIcon.filePath);
			console.log(`✅ [MCP] Successfully retrieved SVG for ${iconId} (${setId}/${foundIcon.styleId})`);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							iconId,
							setId,
							iconName,
							styleId: foundIcon.styleId,
							svg: svgContent,
						}),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							error: `Failed to read SVG file: ${error instanceof Error ? error.message : String(error)}`,
						}),
					},
				],
				isError: true,
			};
		}
	}

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify({ error: `Unknown tool: ${name}` }),
			},
		],
		isError: true,
	};
});

// Resources: List all available icon resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
	console.log("📚 [MCP] Resources list requested");
	const iconsNames = getIconsNames();
	const resources = [];

	// Create a resource for each icon set
	for (const [setId, iconNames] of Object.entries(iconsNames["icons-names"])) {
		resources.push({
			uri: `aria-icons://icons/${setId}`,
			name: `${setId} icons`,
			description: `All icons from the ${setId} icon set (${iconNames.length} icons)`,
			mimeType: "application/json",
		});
	}

	// Create a resource for all icons
	resources.push({
		uri: "aria-icons://icons/all",
		name: "All Icons",
		description: `All available icons from all sets (${iconsNames.all.length} total)`,
		mimeType: "application/json",
	});

	return { resources };
});

// Resources: Read a specific icon resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
	const { uri } = request.params;
	console.log(`📖 [MCP] Reading resource: ${uri}`);

	if (uri.startsWith("aria-icons://icons/")) {
		const path = uri.replace("aria-icons://icons/", "");
		const iconsNames = getIconsNames();

		if (path === "all") {
			return {
				contents: [
					{
						uri,
						mimeType: "application/json",
						text: JSON.stringify(iconsNames, null, 2),
					},
				],
			};
		}

		// Return icons for a specific set
		if (iconsNames["icons-names"][path]) {
			return {
				contents: [
					{
						uri,
						mimeType: "application/json",
						text: JSON.stringify(
							{
								setId: path,
								icons: iconsNames["icons-names"][path],
								count: iconsNames["icons-names"][path].length,
							},
							null,
							2,
						),
					},
				],
			};
		}

		// Try to get a specific icon SVG
		if (path.includes("/")) {
			const [setId, iconName] = path.split("/");
			const iconSet = ICON_SETS.find((set) => set.id === setId);
			if (iconSet) {
				for (const style of iconSet.styles) {
					try {
						const index = await buildIconIndex(setId, style.id);
						const icon = index.icons.find(
							(i) => i.name.toLowerCase() === iconName.toLowerCase(),
						);

						if (icon) {
							const svgContent = await readSvg(setId, icon.filePath);
							return {
								contents: [
									{
										uri,
										mimeType: "image/svg+xml",
										text: svgContent,
									},
								],
							};
						}
					} catch (error) {
						continue;
					}
				}
			}
		}

		return {
			contents: [
				{
					uri,
					mimeType: "text/plain",
					text: `Resource not found: ${uri}`,
				},
			],
			isError: true,
		};
	}

	return {
		contents: [
			{
				uri,
				mimeType: "text/plain",
				text: `Unknown resource URI: ${uri}`,
			},
		],
		isError: true,
	};
});

// Handle GET requests (SSE stream for MCP)
export async function GET(req: NextRequest) {
	console.log("🌐 [MCP] GET request received - SSE connection initiated");
	// For GET requests, we'll set up SSE stream
	// This is a simplified version - full SSE support would require streaming response
	const stream = new ReadableStream({
		async start(controller) {
			// Send initial SSE event
			const encoder = new TextEncoder();
			controller.enqueue(encoder.encode(": connected\n\n"));
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}

// Handle POST requests (JSON-RPC)
export async function POST(req: NextRequest) {
	console.log("🚀 [MCP] ========================================");
	console.log("🚀 [MCP] POST request received to /api/mcp");
	console.log("🚀 [MCP] ========================================");
	
	let body: any = null;
	try {
		body = await req.json();
		
		console.log("📥 [MCP] Request method:", body?.method || "unknown");
		console.log("📥 [MCP] Request ID:", body?.id || "none");
		if (body?.method === "tools/call") {
			console.log("📥 [MCP] Tool name:", body?.params?.name);
			console.log("📥 [MCP] Tool arguments:", JSON.stringify(body?.params?.arguments || {}));
		}

		// Handle the request through the server
		// Process JSON-RPC messages manually
		let response: any = null;

		// Handle initialize request
		if (body.method === "initialize") {
			response = {
				jsonrpc: "2.0",
				id: body.id,
				result: {
					protocolVersion: "2024-11-05",
					capabilities: {
						tools: {},
						resources: {},
					},
					serverInfo: {
						name: "aria-icons",
						version: "1.0.0",
					},
				},
			};
		} else if (body.method === "initialized") {
			// Handle initialized notification (no response needed for notifications)
			response = null;
		} else {
			// Process other requests
			try {
				// Create a request object matching the schema
				const request = {
					jsonrpc: "2.0" as const,
					id: body.id,
					method: body.method,
					params: body.params || {},
				};

				// Route to appropriate handler - implement handlers directly
				if (body.method === "tools/list") {
					console.log("🎨 [MCP] Tools list requested");
					const result = {
						tools: [
							{
								name: "list_icons",
								description:
									"List all available icons organized by icon set. Returns a JSON object with icon set names as keys and arrays of icon names as values, plus a flat array of all icon identifiers.",
								inputSchema: {
									type: "object",
									properties: {},
								},
							},
							{
								name: "get_icon_svg",
								description:
									"Get the SVG content for a specific icon. The icon identifier should be in the format 'setId-iconName' (e.g., 'heroicons-academic-cap').",
								inputSchema: {
									type: "object",
									properties: {
										iconId: {
											type: "string",
											description:
												"Icon identifier in format 'setId-iconName' (e.g., 'heroicons-academic-cap', 'lucide-icons-home')",
										},
									},
									required: ["iconId"],
								},
							},
						],
					};
					response = {
						jsonrpc: "2.0",
						id: body.id,
						result,
					};
				} else if (body.method === "resources/list") {
					console.log("📚 [MCP] Resources list requested");
					const iconsNames = getIconsNames();
					const resources = [];

					for (const [setId, iconNames] of Object.entries(iconsNames["icons-names"])) {
						resources.push({
							uri: `aria-icons://icons/${setId}`,
							name: `${setId} icons`,
							description: `All icons from the ${setId} icon set (${iconNames.length} icons)`,
							mimeType: "application/json",
						});
					}

					resources.push({
						uri: "aria-icons://icons/all",
						name: "All Icons",
						description: `All available icons from all sets (${iconsNames.all.length} total)`,
						mimeType: "application/json",
					});

					response = {
						jsonrpc: "2.0",
						id: body.id,
						result: { resources },
					};
				} else if (body.method === "resources/read") {
					const { uri } = body.params || {};
					console.log(`📖 [MCP] Reading resource: ${uri}`);

					if (uri && uri.startsWith("aria-icons://icons/")) {
						const path = uri.replace("aria-icons://icons/", "");
						const iconsNames = getIconsNames();

						if (path === "all") {
							response = {
								jsonrpc: "2.0",
								id: body.id,
								result: {
									contents: [
										{
											uri,
											mimeType: "application/json",
											text: JSON.stringify(iconsNames, null, 2),
										},
									],
								},
							};
						} else if (iconsNames["icons-names"][path]) {
							response = {
								jsonrpc: "2.0",
								id: body.id,
								result: {
									contents: [
										{
											uri,
											mimeType: "application/json",
											text: JSON.stringify(
												{
													setId: path,
													icons: iconsNames["icons-names"][path],
													count: iconsNames["icons-names"][path].length,
												},
												null,
												2,
											),
										},
									],
								},
							};
						} else {
							// Try to get a specific icon SVG
							if (path.includes("/")) {
								const [setId, iconName] = path.split("/");
								const iconSet = ICON_SETS.find((set) => set.id === setId);
								if (iconSet) {
									let foundIcon: { filePath: string; styleId: string } | null = null;

									for (const style of iconSet.styles) {
										try {
											const index = await buildIconIndex(setId, style.id);
											const icon = index.icons.find(
												(i) => i.name.toLowerCase() === iconName.toLowerCase(),
											);

											if (icon) {
												foundIcon = { filePath: icon.filePath, styleId: style.id };
												break;
											}
										} catch (error) {
											continue;
										}
									}

									if (foundIcon) {
										const svgContent = await readSvg(setId, foundIcon.filePath);
										response = {
											jsonrpc: "2.0",
											id: body.id,
											result: {
												contents: [
													{
														uri,
														mimeType: "image/svg+xml",
														text: svgContent,
													},
												],
											},
										};
									} else {
										response = {
											jsonrpc: "2.0",
											id: body.id,
											error: {
												code: -32602,
												message: `Resource not found: ${uri}`,
											},
										};
									}
								} else {
									response = {
										jsonrpc: "2.0",
										id: body.id,
										error: {
											code: -32602,
											message: `Resource not found: ${uri}`,
										},
									};
								}
							} else {
								response = {
									jsonrpc: "2.0",
									id: body.id,
									error: {
										code: -32602,
										message: `Resource not found: ${uri}`,
									},
								};
							}
						}
					} else {
						response = {
							jsonrpc: "2.0",
							id: body.id,
							error: {
								code: -32602,
								message: `Invalid resource URI: ${uri}`,
							},
						};
					}
				} else if (body.method === "tools/call") {
					const { name, arguments: args } = body.params || {};
					console.log(
						`🔧 [MCP] Tool called: ${name}`,
						args ? `with args: ${JSON.stringify(args)}` : "",
					);

					if (name === "list_icons") {
						console.log("📋 [MCP] Listing all icons...");
						const iconsNames = getIconsNames();
						response = {
							jsonrpc: "2.0",
							id: body.id,
							result: {
								content: [
									{
										type: "text",
										text: JSON.stringify(iconsNames, null, 2),
									},
								],
							},
						};
					} else if (name === "get_icon_svg") {
						const iconId = args?.iconId as string | undefined;
						console.log(`🎯 [MCP] Getting SVG for icon: ${iconId}`);

						if (!iconId) {
							response = {
								jsonrpc: "2.0",
								id: body.id,
								error: {
									code: -32602,
									message: "iconId is required",
								},
							};
						} else {
							const parts = iconId.split("-");
							if (parts.length < 2) {
								response = {
									jsonrpc: "2.0",
									id: body.id,
									error: {
										code: -32602,
										message: `Invalid icon identifier format. Expected 'setId-iconName' but got '${iconId}'`,
									},
								};
							} else {
								const setId = parts[0] as IconSetId;
								const iconName = parts.slice(1).join("-");

								const iconSet = ICON_SETS.find((set) => set.id === setId);
								if (!iconSet) {
									response = {
										jsonrpc: "2.0",
										id: body.id,
										error: {
											code: -32602,
											message: `Unknown icon set: ${setId}`,
										},
									};
								} else {
									let foundIcon: { filePath: string; styleId: string } | null = null;

									for (const style of iconSet.styles) {
										try {
											const index = await buildIconIndex(setId, style.id);
											const icon = index.icons.find(
												(i) => i.name.toLowerCase() === iconName.toLowerCase(),
											);

											if (icon) {
												foundIcon = { filePath: icon.filePath, styleId: style.id };
												break;
											}
										} catch (error) {
											continue;
										}
									}

									if (!foundIcon) {
										response = {
											jsonrpc: "2.0",
											id: body.id,
											error: {
												code: -32602,
												message: `Icon '${iconName}' not found in set '${setId}'`,
											},
										};
									} else {
										try {
											const svgContent = await readSvg(setId, foundIcon.filePath);
											console.log(
												`✅ [MCP] Successfully retrieved SVG for ${iconId} (${setId}/${foundIcon.styleId})`,
											);
											response = {
												jsonrpc: "2.0",
												id: body.id,
												result: {
													content: [
														{
															type: "text",
															text: JSON.stringify({
																iconId,
																setId,
																iconName,
																styleId: foundIcon.styleId,
																svg: svgContent,
															}),
														},
													],
												},
											};
										} catch (error) {
											response = {
												jsonrpc: "2.0",
												id: body.id,
												error: {
													code: -32603,
													message: `Failed to read SVG file: ${error instanceof Error ? error.message : String(error)}`,
												},
											};
										}
									}
								}
							}
						}
					} else {
						response = {
							jsonrpc: "2.0",
							id: body.id,
							error: {
								code: -32601,
								message: `Unknown tool: ${name}`,
							},
						};
					}
				} else {
					throw new Error(`Unknown method: ${body.method}`);
				}
			} catch (error: any) {
				console.error("❌ [MCP] Error processing request:", error);
				response = {
					jsonrpc: "2.0",
					id: body.id,
					error: {
						code: error.code || -32603,
						message: error.message || "Internal error",
						data: error.data,
					},
				};
			}
		}
		
		console.log("📤 [MCP] Response sent successfully");
		console.log("🚀 [MCP] ========================================\n");

		// Don't send response for notifications (like "initialized")
		if (response === null) {
			return new Response(null, { status: 200 });
		}

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
			},
		});
	} catch (error) {
		console.error("❌ [MCP] Error processing request:", error);
		console.log("🚀 [MCP] ========================================\n");
		return new Response(
			JSON.stringify({
				jsonrpc: "2.0",
				id: body?.id ?? null,
				error: {
					code: -32700,
					message: "Parse error",
					data: error instanceof Error ? error.message : String(error),
				},
			}),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
	return new Response(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}

