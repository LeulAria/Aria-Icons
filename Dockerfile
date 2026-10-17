# Aria Icons MCP server (stdio) for Glama introspection and local Docker runs.
# Build from the repo root:
#   docker build -t aria-icons-mcp .
# Run (stdio; keep -i so JSON-RPC can speak over stdin/stdout):
#   docker run --rm -i aria-icons-mcp
#
# The CLI talks to the public Aria Icons API by default (https://icons.leularia.com).
# Override with ARIA_ICONS_API if needed. No secrets required for initialize / tools/list.

FROM oven/bun:1.2-alpine AS build
WORKDIR /app

COPY packages/cli/package.json ./
RUN bun install

COPY packages/cli/ ./
RUN bun run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER node

# Default command is the stdio MCP server (also `node dist/index.js mcp`).
ENTRYPOINT ["node", "dist/index.js"]
CMD ["mcp"]
