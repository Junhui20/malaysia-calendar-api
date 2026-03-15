import type { Context, Next } from "hono";

type CachePreset = "immutable" | "stable" | "dynamic" | "realtime";

const CACHE_PRESETS: Record<CachePreset, string> = {
  immutable: "public, max-age=86400",                                    // 24h — past/confirmed data
  stable: "public, max-age=3600, stale-while-revalidate=86400",          // 1h — may have tentative
  dynamic: "public, max-age=300, stale-while-revalidate=3600",           // 5min — today/next
  realtime: "public, max-age=60",                                        // 1min — feeds
};

function detectPreset(path: string, query: Record<string, string>): CachePreset {
  // Past year data is immutable
  const year = query.year ? Number(query.year) : undefined;
  if (year && year < new Date().getFullYear()) return "immutable";

  // Today/next endpoints are dynamic
  if (path.includes("/today") || path.includes("/next")) return "dynamic";

  // Feeds
  if (path.includes("/feed/")) return "realtime";

  // School terms/holidays rarely change
  if (path.includes("/school/terms") || path.includes("/school/holidays")) return "immutable";

  // Default for current year data
  return "stable";
}

export function cacheHeaders() {
  return async (c: Context, next: Next) => {
    await next();

    // Only cache successful GET responses
    if (c.req.method !== "GET" || c.res.status >= 400) return;

    // Skip if already has Cache-Control
    if (c.res.headers.get("Cache-Control")) return;

    const query: Record<string, string> = {};
    for (const [k, v] of new URL(c.req.url).searchParams) {
      query[k] = v;
    }

    const preset = detectPreset(c.req.path, query);
    c.header("Cache-Control", CACHE_PRESETS[preset]);
    c.header("Vary", "Accept-Encoding");
  };
}
