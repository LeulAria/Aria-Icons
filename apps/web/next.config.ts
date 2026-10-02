import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki", "morphicons"],
	// Serverless functions are capped at 250 MB uncompressed. `/*` matches every
	// route (picomatch `contains`), so SVG bodies must NOT be on that glob —
	// that was packing ~485 MB into `/.well-known/mcp.json`. Vendored packs are
	// gzipped on Vercel before tracing; only routes that read SVGs include them.
	outputFileTracingIncludes: {
		"/api/**": [
			"./icons/vendored/**/*",
			"./icons/thesvg.json",
			"./icons/thesvg.json.gz",
			"./icons/iconify/*.json",
			"./public/icons-meta.json",
			"./public/icons-meta-index.json",
		],
		"/*": [
			"./icons/thesvg.json",
			"./icons/thesvg.json.gz",
			"./icons/iconify/collections.json",
			"./icons/iconify/prefixes.json",
			"./public/icons-meta.json",
			"./public/icons-meta-index.json",
		],
	},
	outputFileTracingExcludes: {
		"/.well-known/**": [
			"./icons/**/*",
			"./public/icons-meta.json",
			"./public/icons-meta-index.json",
			"./public/icons-meta/**/*",
		],
		"/changelog": ["./icons/**/*", "./public/icons-meta.json", "./public/icons-meta-index.json"],
		"/contribute": ["./icons/**/*", "./public/icons-meta.json", "./public/icons-meta-index.json"],
		"/ai": ["./icons/**/*"],
		"/api/ai": ["./icons/**/*"],
		"/api/github-stars": ["./icons/**/*"],
		"/api/rpc/**": ["./icons/**/*"],
		"/api/browse": [
			"./icons/vendored/**/*",
			"./icons/thesvg.json",
			"./icons/thesvg.json.gz",
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
	if (onVercel) {
		const { prepareProductionIcons, compressIconPacksForDeploy } = await import(
			"./scripts/prepare-production-icons"
		);
		if (!fs.existsSync(manifest)) {
			await prepareProductionIcons();
		}
		await compressIconPacksForDeploy();
	}
	return nextConfig;
}
