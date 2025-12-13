import { createContext } from "@aria-icons/api/context";
import { appRouter } from "@aria-icons/api/routers/index";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { NextRequest } from "next/server";

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});
const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

async function handleRequest(req: NextRequest) {
	// Type assertion to handle Next.js version type mismatch in monorepo
	const reqAsAny = req as any;
	const rpcResult = await rpcHandler.handle(reqAsAny, {
		prefix: "/api/rpc",
		context: await createContext(reqAsAny),
	});
	if (rpcResult.response) return rpcResult.response;

	const apiResult = await apiHandler.handle(reqAsAny, {
		prefix: "/api/rpc/api-reference",
		context: await createContext(reqAsAny),
	});
	if (apiResult.response) return apiResult.response;

	return new Response("Not found", { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
