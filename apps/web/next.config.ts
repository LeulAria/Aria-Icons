import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki"],
	// Include packed icon JSON in serverless function traces so /api/icon-svg
	// and MCP can read them at runtime on Vercel.
	outputFileTracingIncludes: {
		"/api/**": ["./icons/vendored/**/*", "./icons/thesvg.json", "./icons/iconify/**/*"],
		"/*": ["./icons/vendored/**/*", "./icons/thesvg.json", "./icons/iconify/**/*"],
	},
};

export default nextConfig;
