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
};

export default nextConfig;
