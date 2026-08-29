export interface McpConfig {
  mcpServers?: Record<
    string,
    {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      url?: string;
    }
  >;
  mcp?: Record<
    string,
    {
      type: "local" | "remote";
      command?: string[];
      url?: string;
      enabled?: boolean;
      environment?: Record<string, string>;
      timeout?: number;
    }
  >;
}

export interface AgentConfig {
  name: string;
  displayName: string;
  configPath: string;
  projectConfigPath: string;
  detected: boolean;
}

export type ConfigScope = "global" | "project";

export interface InstallResult {
  agent: string;
  success: boolean;
  path: string;
  error?: string;
}

export type Framework =
  | "react"
  | "vue"
  | "svelte"
  | "solid"
  | "flutter"
  | "react-native"
  | "svg";

export type IconFormat =
  | "svg"
  | "react"
  | "vue"
  | "svelte"
  | "solid"
  | "flutter"
  | "react-native"
  | "jsx"
  | "html"
  | "json";

export interface AriaIconsConfig {
  framework?: Framework;
  outDir?: string;
  defaultCollection?: string;
  api?: string;
}

export interface SearchHit {
  id: string;
  legacyId: string;
  set: string;
  name: string;
  styles: string[];
  tags?: string[];
  score: number;
  svg?: string;
}

export interface IconRecord {
  id: string;
  legacyId: string;
  set: string;
  name: string;
  styleId: string;
  svg: string;
}
