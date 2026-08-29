export type Framework =
  | "react"
  | "vue"
  | "svelte"
  | "solid"
  | "flutter"
  | "react-native"
  | "svg";

export type IconFormat = Framework | "jsx" | "html" | "json";

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

export declare class AriaIconsClient {
  readonly apiUrl: string;
  constructor(apiUrl?: string);
  search(params: {
    query: string;
    collection?: string;
    style?: string;
    limit?: number;
    prefer?: string;
    includeSvg?: boolean;
  }): Promise<{ query: string; total: number; icons: SearchHit[] }>;
  getIcon(params: {
    id: string;
    color?: string;
    size?: number;
    variant?: string;
    format?: string;
  }): Promise<IconRecord>;
}

export declare function getClient(apiUrl?: string): AriaIconsClient;
export declare function formatIcon(
  svg: string,
  name: string,
  format: IconFormat,
  iconId?: string,
): string;
