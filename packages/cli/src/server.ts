import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { aliasIconId } from "./aliases.ts";
import { getClient } from "./client.ts";
import { resolveProjectSettings } from "./config.ts";
import { VERSION } from "./constants.ts";
import { resolveWriteCwd } from "./cwd.ts";
import { formatIcon } from "./format.ts";
import { getPreferredCollections, getRecentIcons, trackUsage } from "./memory.ts";
import { scanAriaIconFiles, scanProjectIcons, suggestStandard, summarizeLibraries } from "./scan.ts";
import type { Framework } from "./types.ts";
import { writeIconFile } from "./write.ts";

function textResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

function jsonResult(payload: unknown) {
  return textResult(JSON.stringify(payload, null, 2));
}

export async function runServer(): Promise<void> {
  const client = getClient();
  const server = new McpServer({
    name: "aria-icons",
    version: VERSION,
  });

  server.registerTool(
    "search_icons",
    {
      description:
        "Search 340k+ icons across Aria Icons collections. Returns ids like lucide:house for get_icon / add.",
      inputSchema: {
        query: z.string().describe("Search query, e.g. 'arrow', 'shopping cart'"),
        limit: z.number().min(1).max(999).default(32).describe("Max results"),
        collection: z.string().optional().describe("Filter by collection: lucide, tabler, mdi, ph, thesvg, …"),
        style: z.string().optional().describe("outline, solid, or a style id"),
      },
    },
    async ({ query, limit = 32, collection, style }) => {
      try {
        const data = await client.search({
          query,
          limit,
          collection,
          style,
          includeSvg: true,
          prefer: collection,
        });
        const prefs = getPreferredCollections();
        const note =
          prefs.length > 0
            ? `\n\n_Prioritized locally from your usage: ${prefs.slice(0, 3).join(", ")}_`
            : "";
        const list = data.icons
          .map((i) => `- \`${i.id}\`${i.svg ? `\n\`\`\`svg\n${i.svg}\n\`\`\`` : ""}`)
          .join("\n");
        return textResult(
          `Found ${data.total} icons (showing ${data.icons.length})\n\n${list}\n\nUse get_icon or add_icon_to_project with an id.${note}`,
        );
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Search failed", true);
      }
    },
  );

  server.registerTool(
    "get_icon",
    {
      description: "Get SVG + React/Vue/Svelte snippets for an icon id (lucide:house).",
      inputSchema: {
        icon_id: z.string().describe("Icon id, e.g. lucide:house"),
        color: z.string().optional(),
        size: z.number().optional(),
      },
    },
    async ({ icon_id, color, size }) => {
      try {
        const icon = await client.getIcon({ id: icon_id, color, size });
        trackUsage(icon.set, icon.id);
        return textResult(
          `# ${icon.id}\n\n**Set:** ${icon.set}  **Style:** ${icon.styleId}\n\n## SVG\n\n\`\`\`svg\n${icon.svg}\n\`\`\`\n\n## React\n\n\`\`\`tsx\n${formatIcon(icon.svg, icon.name, "react", icon.id)}\n\`\`\`\n\n## Vue\n\n\`\`\`vue\n${formatIcon(icon.svg, icon.name, "vue", icon.id)}\n\`\`\``,
        );
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Not found", true);
      }
    },
  );

  server.registerTool(
    "get_icon_svg",
    {
      description: "Get only the SVG string for an icon.",
      inputSchema: {
        icon_id: z.string(),
        color: z.string().optional(),
        size: z.number().optional(),
      },
    },
    async ({ icon_id, color, size }) => {
      try {
        const icon = await client.getIcon({ id: icon_id, color, size });
        trackUsage(icon.set, icon.id);
        return jsonResult({ id: icon.id, svg: icon.svg });
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Not found", true);
      }
    },
  );

  server.registerTool(
    "get_icon_component",
    {
      description: "Get a single-framework component for an icon.",
      inputSchema: {
        icon_id: z.string(),
        framework: z
          .enum(["react", "vue", "svelte", "solid", "flutter", "react-native", "svg"])
          .default("react"),
        color: z.string().optional(),
        size: z.number().optional(),
      },
    },
    async ({ icon_id, framework = "react", color, size }) => {
      try {
        const icon = await client.getIcon({ id: icon_id, color, size });
        trackUsage(icon.set, icon.id);
        return textResult(
          `\`\`\`${framework}\n${formatIcon(icon.svg, icon.name, framework, icon.id)}\n\`\`\``,
        );
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Not found", true);
      }
    },
  );

  server.registerTool(
    "get_icons",
    {
      description: "Batch-get up to 20 icons.",
      inputSchema: {
        icon_ids: z.array(z.string()).min(1).max(20),
        color: z.string().optional(),
        size: z.number().optional(),
      },
    },
    async ({ icon_ids, color, size }) => {
      try {
        const data = await client.getIcons(icon_ids, { color, size });
        for (const icon of data.icons) trackUsage(icon.set, icon.id);
        return jsonResult(data);
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Failed", true);
      }
    },
  );

  server.registerTool(
    "list_collections",
    {
      description: "List Aria Icons collections with icon counts.",
      inputSchema: {
        search: z.string().optional(),
        limit: z.number().optional(),
      },
    },
    async ({ search, limit }) => {
      try {
        const data = await client.collections({ search, limit });
        const list = data.collections
          .map((c) => `- **${c.shortId}** — ${c.label} (${c.count})`)
          .join("\n");
        return textResult(`# Collections\n\n${list}`);
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Failed", true);
      }
    },
  );

  server.registerTool(
    "find_similar_icons",
    {
      description: "Same icon in other collections, plus related names.",
      inputSchema: {
        icon_id: z.string(),
        limit: z.number().min(1).max(50).default(10),
      },
    },
    async ({ icon_id, limit = 10 }) => {
      try {
        const data = await client.similar(icon_id, limit);
        const list = data.icons.map((i) => `- \`${i.id}\``).join("\n");
        return textResult(`# Similar to \`${icon_id}\`\n\n${list || "None found."}`);
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Failed", true);
      }
    },
  );

  server.registerTool(
    "find_equivalent_icon",
    {
      description: "Map an icon to the closest match in a target collection.",
      inputSchema: {
        icon_id: z.string(),
        to: z.string().describe("Target collection, e.g. lucide"),
      },
    },
    async ({ icon_id, to }) => {
      try {
        const data = await client.equivalent(icon_id, to);
        return jsonResult(data);
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Failed", true);
      }
    },
  );

  server.registerTool(
    "recommend_icons",
    {
      description: "Recommend icons for a UI use case.",
      inputSchema: {
        use_case: z.string(),
        style: z.enum(["solid", "outline", "any"]).default("any"),
        limit: z.number().min(1).max(20).default(10),
      },
    },
    async ({ use_case, style = "any", limit = 10 }) => {
      try {
        const data = await client.search({
          query: use_case,
          style: style === "any" ? undefined : style,
          limit,
        });
        return textResult(
          `# ${use_case}\n\n${data.icons.map((i) => `- \`${i.id}\``).join("\n")}`,
        );
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Failed", true);
      }
    },
  );

  server.registerTool(
    "get_recent_icons",
    {
      description: "Icons this machine recently fetched via the CLI/MCP.",
      inputSchema: { limit: z.number().min(1).max(50).default(20) },
    },
    async ({ limit = 20 }) => {
      const recent = getRecentIcons(limit);
      if (recent.length === 0) return textResult("No recent icons yet.");
      return textResult(recent.map((e, i) => `${i + 1}. \`${e.iconId}\``).join("\n"));
    },
  );

  server.registerTool(
    "add_icon_to_project",
    {
      description:
        "Download an icon and write it into the project's icons folder (shadcn-style, no giant dependency). Detects framework unless provided.",
      inputSchema: {
        icon_id: z.string().describe("Icon id or search term, e.g. lucide:house or house"),
        iconId: z.string().optional().describe("Alias for icon_id"),
        framework: z
          .enum(["react", "vue", "svelte", "solid", "flutter", "react-native", "svg"])
          .optional(),
        out_dir: z.string().optional().describe("Relative output directory"),
        project_dir: z.string().optional().describe("Project root to write into"),
        variant: z.string().optional(),
        force: z.boolean().optional(),
      },
    },
    async ({ icon_id, iconId, framework, out_dir, project_dir, variant, force }) => {
      try {
        const settings = resolveProjectSettings({
          framework: framework as Framework | undefined,
          outDir: out_dir,
        });
        const token = icon_id || iconId || "";
        const resolvedId = token.includes(":")
          ? aliasIconId(token)
          : (await client.search({ query: token, limit: 5 })).icons[0]?.id;
        if (!resolvedId) return textResult(`No icon found for '${token}'`, true);
        const icon = await client.getIcon({ id: resolvedId, variant });
        trackUsage(icon.set, icon.id);
        const written = writeIconFile({
          cwd: resolveWriteCwd(project_dir),
          outDir: settings.outDir,
          framework: settings.framework,
          icon,
          force,
        });
        return textResult(
          `# ${written.alreadyExists ? "Already exists" : "Wrote"}\n\n**File:** ${written.filePath}\n**Component:** ${written.componentName}\n\n\`\`\`tsx\n${written.importStatement}\n\`\`\`\n\n<${written.componentName} />`,
        );
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Failed", true);
      }
    },
  );

  server.registerTool(
    "scan_project_icons",
    {
      description: "Scan the current project for third-party icon library usage.",
      inputSchema: {
        dir: z.string().default("src"),
      },
    },
    async ({ dir = "src" }) => {
      const icons = scanProjectIcons(process.cwd(), dir);
      if (icons.length === 0) return textResult("No third-party icon imports found.");
      const lines = icons.map((i) => `- ${i.file}: ${i.importName} (${i.library} → ${i.collection}:${i.iconName})`);
      return textResult(`# ${icons.length} icon imports\n\n${lines.join("\n")}`);
    },
  );

  server.registerTool(
    "list_icons",
    {
      description: "List collections, or page icon names in one set.",
      inputSchema: {
        set: z.string().optional(),
        collection: z.string().optional(),
        limit: z.number().optional(),
      },
    },
    async ({ set, collection, limit }) => {
      try {
        const id = set || collection;
        if (!id) {
          const data = await client.collections({ limit });
          return textResult(data.collections.map((c) => `- **${c.shortId}** — ${c.label} (${c.count})`).join("\n"));
        }
        const data = await client.search({ query: id, collection: id, limit: limit ?? 50 });
        return textResult(data.icons.map((i) => `- \`${i.id}\``).join("\n"));
      } catch (error) {
        return textResult(error instanceof Error ? error.message : "Failed", true);
      }
    },
  );

  server.registerTool(
    "doctor_project_icons",
    {
      description: "Audit third-party icon packages and Aria Icons source files in this project.",
      inputSchema: {
        dir: z.string().default("src"),
        project_dir: z.string().optional(),
      },
    },
    async ({ dir = "src", project_dir }) => {
      const cwd = resolveWriteCwd(project_dir);
      const settings = resolveProjectSettings();
      const third = scanProjectIcons(cwd, dir);
      const local = scanAriaIconFiles(cwd, settings.outDir);
      const stats = summarizeLibraries(third);
      const standard = suggestStandard(stats);
      return textResult(
        `# Doctor\n\nAria source files: ${local.length} in ${settings.outDir}\nThird-party imports: ${third.length}\nSuggested standard: ${standard}\n\n${local
          .slice(0, 20)
          .map((i) => `- ${i.iconId} → ${i.file}`)
          .join("\n")}`,
      );
    },
  );

  server.registerTool(
    "suggest_icon_set",
    {
      description: "Recommend a consistent collection from current project usage.",
      inputSchema: {
        dir: z.string().optional(),
        project_dir: z.string().optional(),
      },
    },
    async ({ dir, project_dir }) => {
      const cwd = resolveWriteCwd(project_dir);
      const stats = summarizeLibraries(scanProjectIcons(cwd, dir ?? "src"));
      return jsonResult({ suggested: suggestStandard(stats), libraries: stats });
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aria Icons MCP server running");
}
