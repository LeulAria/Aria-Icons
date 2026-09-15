import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki", "morphicons"],
	// Keep serverless traces small: vendored packs + theSVG + Iconify manifests.
	// Full Iconify set bodies are pruned on Vercel; icons load via Iconify API.
	outputFileTracingIncludes: {
		"/api/**": [
			"./icons/vendored/**/*",
			"./icons/thesvg.json",
			"./icons/iconify/collections.json",
			"./icons/iconify/prefixes.json",
		],
		"/*": [
			"./icons/vendored/**/*",
			"./icons/thesvg.json",
			"./icons/iconify/collections.json",
			"./icons/iconify/prefixes.json",
		],
	},
	async headers() {
		return [
			{
				source: "/install.sh",
				headers: [
					{
						key: "Content-Type",
						value: "text/plain; charset=utf-8",
					},
				],
			},
			{
				// Belt-and-suspenders for MCP discovery (route also sets these).
				source: "/.well-known/mcp.json",
				headers: [
					{
						key: "Access-Control-Allow-Origin",
						value: "*",
					},
					{
						key: "Access-Control-Allow-Methods",
						value: "GET, OPTIONS",
					},
					{
						key: "Cache-Control",
						value: "public, max-age=3600",
					},
				],
			},
		];
	},
};

export default nextConfig;
