import { resolveApiUrl } from "./constants.ts";
import type { IconRecord, SearchHit } from "./types.ts";

const SHORT_TO_SET: Record<string, string> = {
  lucide: "lucide-icons",
  tabler: "tabler-icons",
  feather: "feathers",
  hero: "heroicons",
  brands: "thesvg",
};

function toLegacyMcpId(id: string): string {
  if (!id.includes(":")) return id;
  const [collection, name] = id.split(":");
  const set = SHORT_TO_SET[collection ?? ""] ?? collection ?? "";
  return `${set}-${name}`;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type SearchParams = {
  query: string;
  collection?: string;
  style?: string;
  limit?: number;
  prefer?: string;
  includeSvg?: boolean;
};

export class AriaIconsClient {
  readonly apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = resolveApiUrl(apiUrl);
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      throw new ApiError(
        `Could not reach ${this.apiUrl}. Is the API running? ${error instanceof Error ? error.message : ""}`.trim(),
        0,
      );
    }

    if (res.status === 404 && !this.looksLikeLocal()) {
      return this.requestViaMcp<T>(path);
    }

    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
    }
    return body;
  }

  private looksLikeLocal(): boolean {
    return /localhost|127\.0\.0\.1/.test(this.apiUrl);
  }

  private async mcpCall(name: string, args: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${this.apiUrl}/api/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    });
    if (!res.ok) {
      throw new ApiError(`MCP fallback failed (${res.status})`, res.status);
    }
    const body = (await res.json()) as {
      result?: { content?: Array<{ text?: string }>; isError?: boolean };
    };
    const text = body.result?.content?.[0]?.text;
    if (!text) throw new ApiError("Empty MCP response", 502);
    const parsed = JSON.parse(text) as { error?: string };
    if (parsed.error || body.result?.isError) {
      throw new ApiError(parsed.error || text, 400);
    }
    return parsed;
  }

  private toHit(row: Record<string, unknown>): SearchHit {
    const set = String(row.set ?? row.setId ?? "");
    const name = String(row.name ?? "");
    const short = set.replace(/-icons$/, "").replace(/^lucide-icons$/, "lucide");
    const id = typeof row.id === "string" ? row.id : `${short}:${name}`;
    return {
      id,
      legacyId: typeof row.iconId === "string" ? row.iconId : `${set}-${name}`,
      set,
      name,
      styles: Array.isArray(row.styles) ? (row.styles as string[]) : [],
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : undefined,
      score: typeof row.score === "number" ? row.score : 0,
    };
  }

  private async requestViaMcp<T>(path: string): Promise<T> {
    const url = new URL(path, "https://fallback.local");
    const route = url.pathname;
    const q = url.searchParams;

    if (route === "/api/v1/search") {
      const payload = (await this.mcpCall("search_icons", {
        query: q.get("q") ?? "",
        collection: q.get("collection") ?? undefined,
        set: q.get("collection") ?? undefined,
        style: q.get("style") ?? undefined,
        limit: q.get("limit") ? Number(q.get("limit")) : undefined,
      })) as { query?: string; total?: number; results?: Record<string, unknown>[]; icons?: Record<string, unknown>[] };
      const rows = payload.results ?? payload.icons ?? [];
      return {
        query: payload.query ?? q.get("q") ?? "",
        total: payload.total ?? rows.length,
        icons: rows.map((row) => this.toHit(row)),
      } as T;
    }

    if (route === "/api/v1/icon") {
      const id = q.get("id") ?? "";
      try {
        const modern = (await this.mcpCall("get_icon", {
          icon_id: id,
          iconId: id,
          color: q.get("color") ?? undefined,
          variant: q.get("variant") ?? undefined,
          size: q.get("size") ? Number(q.get("size")) : undefined,
        })) as IconRecord & { error?: string };
        if (modern.svg && modern.id) return modern as T;
      } catch {
        // old HTTP MCP only has get_icon_svg
      }
      const legacy = (await this.mcpCall("get_icon_svg", {
        iconId: toLegacyMcpId(id),
        icon_id: id,
        variant: q.get("variant") ?? undefined,
      })) as { id?: string; iconId?: string; setId?: string; iconName?: string; styleId?: string; svg?: string };
      if (!legacy.svg) throw new ApiError(`Icon '${id}' not found`, 404);
      const set = legacy.setId ?? "unknown";
      const name = legacy.iconName ?? id.split(/[:/]/).pop() ?? id;
      return {
        id: legacy.id ?? `${set.replace(/-icons$/, "")}:${name}`,
        legacyId: legacy.iconId ?? `${set}-${name}`,
        set,
        name,
        styleId: legacy.styleId ?? "line",
        svg: legacy.svg,
      } as T;
    }

    if (route === "/api/v1/icons") {
      const ids = (q.get("ids") ?? "").split(",").filter(Boolean);
      const icons: IconRecord[] = [];
      const errors: { id: string; error: string }[] = [];
      for (const id of ids) {
        try {
          icons.push(await this.getIcon({ id }));
        } catch (error) {
          errors.push({ id, error: error instanceof Error ? error.message : "Failed" });
        }
      }
      return { icons, errors } as T;
    }

    if (route === "/api/v1/collections") {
      const payload = (await this.mcpCall("list_icons", {})) as {
        sets?: Array<{ id: string; count: number }>;
      };
      const collections = (payload.sets ?? []).map((set) => ({
        id: set.id,
        shortId: set.id.replace(/-icons$/, ""),
        label: set.id,
        homepage: null,
        count: set.count,
      }));
      return { total: collections.length, collections } as T;
    }

    if (route === "/api/v1/similar") {
      const payload = (await this.mcpCall("search_icons", {
        query: (q.get("id") ?? "").split(/[:/]/).pop(),
        limit: q.get("limit") ? Number(q.get("limit")) : 10,
      })) as { results?: Record<string, unknown>[]; icons?: Record<string, unknown>[] };
      const rows = payload.results ?? payload.icons ?? [];
      return { iconId: q.get("id") ?? "", icons: rows.map((row) => this.toHit(row)) } as T;
    }

    if (route === "/api/v1/equivalent") {
      const payload = (await this.mcpCall("search_icons", {
        query: (q.get("id") ?? "").split(/[:/]/).pop(),
        set: q.get("to") ?? undefined,
        collection: q.get("to") ?? undefined,
        limit: 5,
      })) as { results?: Record<string, unknown>[]; icons?: Record<string, unknown>[] };
      const rows = payload.results ?? payload.icons ?? [];
      const first = rows[0];
      if (!first) throw new ApiError("No equivalent found", 404);
      return { from: q.get("id") ?? "", to: this.toHit(first) } as T;
    }

    throw new ApiError(
      `API ${path} is not deployed yet. Redeploy apps/web, or run against a local server: --api http://localhost:3001`,
      404,
    );
  }

  async search(params: SearchParams): Promise<{ query: string; total: number; icons: SearchHit[] }> {
    const qs = new URLSearchParams({ q: params.query });
    if (params.collection) qs.set("collection", params.collection);
    if (params.style) qs.set("style", params.style);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.prefer) qs.set("prefer", params.prefer);
    if (params.includeSvg) qs.set("svg", "1");
    const data = await this.request<{ query: string; total: number; icons: SearchHit[] }>(
      `/api/v1/search?${qs}`,
    );
    if (params.prefer && !params.collection) {
      const prefer = params.prefer.toLowerCase();
      data.icons.sort((a, b) => {
        const aHit = a.set.toLowerCase().includes(prefer) || a.id.toLowerCase().startsWith(prefer) ? 0 : 1;
        const bHit = b.set.toLowerCase().includes(prefer) || b.id.toLowerCase().startsWith(prefer) ? 0 : 1;
        return aHit - bHit;
      });
    }
    return data;
  }

  async getIcon(params: {
    id: string;
    color?: string;
    size?: number;
    variant?: string;
    format?: string;
  }): Promise<IconRecord> {
    const qs = new URLSearchParams({ id: params.id, format: "json" });
    if (params.color) qs.set("color", params.color);
    if (params.size) qs.set("size", String(params.size));
    if (params.variant) qs.set("variant", params.variant);
    return this.request(`/api/v1/icon?${qs}`);
  }

  async getIcons(ids: string[], options?: { color?: string; size?: number }) {
    const qs = new URLSearchParams({ ids: ids.join(",") });
    if (options?.color) qs.set("color", options.color);
    if (options?.size) qs.set("size", String(options.size));
    return this.request<{ icons: IconRecord[]; errors: { id: string; error: string }[] }>(
      `/api/v1/icons?${qs}`,
    );
  }

  async collections(params?: { search?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.size ? `?${qs}` : "";
    return this.request<{
      total: number;
      collections: Array<{
        id: string;
        shortId: string;
        label: string;
        homepage: string | null;
        count: number;
      }>;
    }>(`/api/v1/collections${suffix}`);
  }

  async similar(id: string, limit = 10) {
    const qs = new URLSearchParams({ id, limit: String(limit) });
    return this.request<{ iconId: string; icons: SearchHit[] }>(`/api/v1/similar?${qs}`);
  }

  async equivalent(id: string, to: string) {
    const qs = new URLSearchParams({ id, to });
    return this.request<{ from: string; to: SearchHit }>(`/api/v1/equivalent?${qs}`);
  }
}

export function getClient(apiUrl?: string): AriaIconsClient {
  return new AriaIconsClient(apiUrl);
}
