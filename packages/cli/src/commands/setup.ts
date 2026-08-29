import { existsSync } from "node:fs";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { getAgentConfigs, getMcpServerConfig, getOpenCodeMcpConfig } from "../agents.ts";
import { DEFAULT_API_URL } from "../constants.ts";
import type { AgentConfig, ConfigScope, InstallResult } from "../types.ts";
import { readJsonFile, shortenPath, writeJsonFile } from "../utils.ts";

const LOGO = `
  ${chalk.bold.white(" █████╗ ██████╗ ██╗ █████╗")}
  ${chalk.bold.white("██╔══██╗██╔══██╗██║██╔══██╗")}
  ${chalk.bold.white("███████║██████╔╝██║███████║")}
  ${chalk.bold.white("██╔══██║██╔══██╗██║██╔══██║")}
  ${chalk.bold.white("██║  ██║██║  ██║██║██║  ██║")}
  ${chalk.bold.white("╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝")}
  ${chalk.dim("Find any icon. Put it in your codebase.")}
`;

interface SetupOptions {
  yes?: boolean;
  agent?: string[];
  scope?: ConfigScope;
  transport?: "stdio" | "http";
}

export async function setupCommand(options: SetupOptions) {
  console.log(LOGO);
  p.intro(chalk.bgCyan.black(" setup "));

  const agents = getAgentConfigs();
  const detectedAgents = agents.filter((a) => a.detected);

  let scope: ConfigScope;
  if (options.scope) {
    if (options.scope !== "global" && options.scope !== "project") {
      p.log.error(`Invalid scope: ${options.scope}`);
      process.exit(1);
    }
    scope = options.scope;
  } else if (options.yes) {
    scope = "global";
  } else {
    const selectedScope = await p.select({
      message: "Select configuration scope",
      options: [
        { value: "global", label: "Global", hint: "Available in all projects" },
        { value: "project", label: "Project", hint: "Only for current project" },
      ],
    });
    if (p.isCancel(selectedScope)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
    scope = selectedScope as ConfigScope;
  }

  let transport: "stdio" | "http" = options.transport ?? "stdio";
  if (!options.transport && !options.yes) {
    const selected = await p.select({
      message: "MCP transport",
      options: [
        { value: "stdio", label: "Local CLI (npx aria-icons)", hint: "recommended" },
        { value: "http", label: "Remote HTTP", hint: `${DEFAULT_API_URL}/api/mcp` },
      ],
    });
    if (p.isCancel(selected)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
    transport = selected as "stdio" | "http";
  }

  let targetAgents: AgentConfig[];
  if (options.agent && options.agent.length > 0) {
    const validNames = agents.map((a) => a.name);
    const invalid = options.agent.filter((a) => !validNames.includes(a));
    if (invalid.length > 0) {
      p.log.error(`Invalid agents: ${invalid.join(", ")}`);
      p.log.info(`Valid agents: ${validNames.join(", ")}`);
      process.exit(1);
    }
    if (scope === "project" && options.agent.includes("antigravity")) {
      p.log.error("MCP servers in Antigravity can only be added globally");
      process.exit(1);
    }
    targetAgents = agents.filter((a) => options.agent!.includes(a.name));
  } else if (options.yes) {
    if (scope === "project") {
      const firstAgent = detectedAgents[0] || agents[0];
      targetAgents = firstAgent ? [firstAgent] : [];
    } else {
      targetAgents = detectedAgents.length > 0 ? detectedAgents : agents;
    }
    p.log.info(`Installing to: ${targetAgents.map((a) => chalk.cyan(a.displayName)).join(", ")}`);
  } else {
    const agentChoices = agents.map((a) => ({
      value: a.name,
      label: a.displayName,
      hint: a.detected ? chalk.green("detected") : chalk.dim("not detected"),
    }));
    const initialValues =
      scope === "project"
        ? (detectedAgents[0] ? [detectedAgents[0].name] : [agents[0]?.name].filter(Boolean) as string[])
        : detectedAgents.map((a) => a.name);
    const agentOptions =
      scope === "project" ? agentChoices.filter((a) => a.value !== "antigravity") : agentChoices;
    const selected = await p.multiselect({
      message: "Select agents to configure",
      options: agentOptions,
      initialValues,
      required: true,
    });
    if (p.isCancel(selected)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
    targetAgents = agents.filter((a) => (selected as string[]).includes(a.name));
  }

  if (targetAgents.length === 0) {
    p.log.warn("No agents selected");
    p.outro(chalk.yellow("Setup cancelled"));
    process.exit(0);
  }

  const getConfigPath = (agent: AgentConfig) =>
    scope === "project" ? agent.projectConfigPath : agent.configPath;

  const summaryLines = targetAgents.map((a) => {
    const configPath = getConfigPath(a);
    const exists = existsSync(configPath);
    const status = exists ? chalk.yellow("(will update)") : chalk.green("(will create)");
    return `  ${chalk.cyan(a.displayName)} → ${chalk.dim(shortenPath(configPath))} ${status}`;
  });
  p.note(summaryLines.join("\n"), `Installation Summary (${scope === "project" ? "Project" : "Global"} / ${transport})`);

  if (!options.yes) {
    const confirmed = await p.confirm({ message: "Proceed with installation?" });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
  }

  const spinner = p.spinner();
  spinner.start("Configuring MCP server...");

  const remoteUrl = transport === "http" ? `${DEFAULT_API_URL}/api/mcp` : undefined;
  const serverConfig = getMcpServerConfig(remoteUrl);
  const openCodeConfig = getOpenCodeMcpConfig(remoteUrl);
  const results: InstallResult[] = [];

  for (const agent of targetAgents) {
    const configPath = getConfigPath(agent);
    try {
      const config = readJsonFile(configPath);
      if (agent.name === "opencode") {
        config.mcp = { ...config.mcp, ...openCodeConfig };
      } else {
        config.mcpServers = { ...config.mcpServers, ...serverConfig };
      }
      writeJsonFile(configPath, config);
      results.push({ agent: agent.displayName, success: true, path: configPath });
    } catch (error) {
      results.push({
        agent: agent.displayName,
        success: false,
        path: configPath,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  spinner.stop("Configuration complete");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  if (successful.length > 0) {
    p.note(
      successful.map((r) => `  ${chalk.green("✓")} ${r.agent} → ${chalk.dim(shortenPath(r.path))}`).join("\n"),
      chalk.green(`Configured ${successful.length} agent(s)`),
    );
  }
  if (failed.length > 0) {
    p.log.error(chalk.red(`Failed to configure ${failed.length} agent(s)`));
    for (const r of failed) p.log.message(`  ${chalk.red("✗")} ${r.agent}: ${chalk.dim(r.error)}`);
  }

  p.note(
    `${chalk.dim("Try asking your AI:")}\n  ${chalk.cyan('"Search for a minimal outline calendar icon"')}\n  ${chalk.cyan('"Add lucide:house to this project"')}`,
    "Next Steps",
  );
  p.outro(chalk.green("Restart your editor to load the MCP server"));
}
