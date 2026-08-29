import { test, expect, describe } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { getAgentConfigs, getMcpServerConfig, getOpenCodeMcpConfig } from "./agents.ts";

describe("getAgentConfigs", () => {
  test("returns array of agent configs", () => {
    const configs = getAgentConfigs();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThan(0);
  });

  test("includes expected agents", () => {
    const names = getAgentConfigs().map((c) => c.name);
    expect(names).toContain("cursor");
    expect(names).toContain("claude-code");
    expect(names).toContain("windsurf");
    expect(names).toContain("vscode");
    expect(names).toContain("opencode");
    expect(names).toContain("antigravity");
  });

  test("each config has required properties", () => {
    for (const config of getAgentConfigs()) {
      expect(typeof config.name).toBe("string");
      expect(typeof config.displayName).toBe("string");
      expect(typeof config.configPath).toBe("string");
      expect(typeof config.projectConfigPath).toBe("string");
      expect(typeof config.detected).toBe("boolean");
    }
  });

  test("cursor config path is correct", () => {
    const cursor = getAgentConfigs().find((c) => c.name === "cursor");
    expect(cursor?.configPath).toBe(join(homedir(), ".cursor", "mcp.json"));
  });
});

describe("getMcpServerConfig", () => {
  test("stdio config uses npx aria-icons", () => {
    const config = getMcpServerConfig();
    expect(config["aria-icons"]).toHaveProperty("command", "npx");
    expect(config["aria-icons"]?.args).toContain("aria-icons");
  });

  test("http config uses a url", () => {
    const config = getMcpServerConfig("https://icons.leularia.com/api/mcp");
    expect(config["aria-icons"]).toHaveProperty("url");
  });
});

describe("getOpenCodeMcpConfig", () => {
  test("local command array", () => {
    const config = getOpenCodeMcpConfig();
    expect(config["aria-icons"]?.type).toBe("local");
    expect(config["aria-icons"]?.command).toContain("npx");
  });
});
