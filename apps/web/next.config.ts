import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

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
			"./icons/iconify/*.json",
		],
		"/*": [
			"./icons/vendored/**/*",
			"./icons/thesvg.json",
			"./icons/iconify/*.json",
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

/**
 * Vercel invokes `next build` directly, which skips the package `prebuild`
 * script. Iconify manifests are gitignored, so create them before file tracing
 * lstats `icons/iconify/collections.json`.
 */
export default async function config(): Promise<NextConfig> {
	const onVercel = process.env.VERCEL === "1" || process.env.FETCH_ICONS === "1";
	const manifest = path.join(process.cwd(), "icons", "iconify", "collections.json");
	if (onVercel && !fs.existsSync(manifest)) {
		const { prepareProductionIcons } = await import(
			"./scripts/prepare-production-icons"
		);
		await prepareProductionIcons();
	}
	return nextConfig;
}
