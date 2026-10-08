import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";
import {
	compressIconPacksForDeploy,
	prepareProductionIcons,
} from "./scripts/prepare-production-icons";

/**
 * Next file-tracing lstats every `outputFileTracingIncludes` path while the
 * config module loads — before the async default export can fetch Iconify.
 * Ensure the gitignored iconify dir + index manifests exist synchronously.
 */
function ensureIconifyTracingStubs() {
	const dir = path.join(process.cwd(), "icons", "iconify");
	fs.mkdirSync(dir, { recursive: true });
	const collections = path.join(dir, "collections.json");
	const prefixes = path.join(dir, "prefixes.json");
	if (!fs.existsSync(collections)) {
		fs.writeFileSync(collections, "{}", "utf8");
	}
	if (!fs.existsSync(prefixes)) {
		fs.writeFileSync(prefixes, "[]", "utf8");
	}
}
ensureIconifyTracingStubs();

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki", "morphicons"],
	// Serverless functions are capped at 250 MB uncompressed. `/*` matches every
	// route (picomatch `contains`), so SVG bodies must NOT be on that glob —
	// that was packing ~485 MB into `/.well-known/mcp.json`. Vendored packs are
	// too big for any function (~450 MB gzipped), so on Vercel they're moved to
	// `public/icon-packs/` before tracing and fetched from the CDN at runtime.
	outputFileTracingIncludes: {
		"/api/**": [
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
		"/*": ["./icons/vendored/**/*", "./public/icon-packs/**/*"],
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
 *
 * The script is imported statically: Next only registers its `.ts` require hook
 * while this file loads, so a lazy `import()` inside this function can't
 * resolve `./scripts/*.ts` and fails with MODULE_NOT_FOUND on Vercel.
 */
export default async function config(): Promise<NextConfig> {
	ensureIconifyTracingStubs();
	const onVercel = process.env.VERCEL === "1" || process.env.FETCH_ICONS === "1";
	if (onVercel) {
		await prepareProductionIcons();
		await compressIconPacksForDeploy();
	}
	return nextConfig;
}
