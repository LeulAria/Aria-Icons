import * as p from "@clack/prompts";
import chalk from "chalk";
import { getMcpServerConfig, getOpenCodeMcpConfig } from "../agents.ts";
import { DEFAULT_API_URL } from "../constants.ts";

export function configCommand() {
  console.log();
  p.intro(chalk.bgBlue.black(" aria-icons config "));

  p.note(
    JSON.stringify({ mcpServers: getMcpServerConfig() }, null, 2),
    "Local MCP (Cursor, Claude, VS Code, Windsurf, Antigravity)",
  );
  p.note(
    JSON.stringify({ mcpServers: getMcpServerConfig(`${DEFAULT_API_URL}/api/mcp`) }, null, 2),
    "Remote HTTP MCP",
  );
  p.note(
    JSON.stringify({ mcp: getOpenCodeMcpConfig() }, null, 2),
    "OpenCode (local)",
  );

  p.note(
    [
      `${chalk.cyan("Cursor:")} ~/.cursor/mcp.json`,
      `${chalk.cyan("Claude Code:")} ~/.claude.json or ~/.claude/settings.json`,
      `${chalk.cyan("VS Code:")} ~/.vscode/mcp.json`,
      `${chalk.cyan("Windsurf:")} ~/.windsurf/mcp.json`,
      `${chalk.cyan("OpenCode:")} ~/.config/opencode/opencode.json`,
      `${chalk.cyan("Google Antigravity:")} ~/.gemini/antigravity/mcp_config.json`,
    ].join("\n"),
    "Config File Locations",
  );
  p.outro("Or run: aria-icons setup");
}
