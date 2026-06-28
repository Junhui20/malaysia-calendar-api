import type { Context, Next } from "hono";
import { lookupTier, TIER_LIMITS, type Env } from "../_shared.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_TRACKED_KEYS = 20_000; // bound the fallback map's memory

function clientKey(c: Context): string {
  // cf-connecting-ip is set by Cloudflare and cannot be spoofed by the client.
  // We deliberately do NOT trust X-Forwarded-For (attacker-controlled).
  return c.req.header("cf-connecting-ip") ?? "unknown";
}

function sweepExpired(now: number): void {
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export async function rateLimiter(c: Context, next: Next) {
  // Anonymous-first: a valid API key raises the per-minute limit and is bucketed
  // by key; otherwise we limit by IP at the anonymous tier.
  const tierInfo = await lookupTier(c);
  const tier = tierInfo?.tier ?? "anonymous";
  const limit = TIER_LIMITS[tier];
  const key = tierInfo ? `key:${tierInfo.keyId}` : clientKey(c);

  // Cloudflare's native binding has a config-fixed limit, so use it only for the
  // anonymous tier; keyed (higher-tier) callers go through the in-memory counter.
  const limiter = (c.env as Env | undefined)?.RATE_LIMITER;
  if (tier === "anonymous" && limiter) {
    const { success } = await limiter.limit({ key });
    if (!success) {
      c.header("Retry-After", "60");
      return c.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." } },
        429
      );
    }
    await next();
    return;
  }

  const now = Date.now();
  if (store.size > MAX_TRACKED_KEYS) sweepExpired(now);

  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(limit - 1));
    await next();
    return;
  }

  if (existing.count >= limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", "0");
    return c.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `Too many requests. Try again in ${retryAfter}s.`,
        },
      },
      429
    );
  }

  existing.count++;
  c.header("X-RateLimit-Limit", String(limit));
  c.header("X-RateLimit-Remaining", String(limit - existing.count));
  await next();
}
