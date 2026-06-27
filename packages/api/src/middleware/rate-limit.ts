import type { Context, Next } from "hono";
import type { Env } from "../_shared.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100; // 100 req/min for anonymous
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
  const key = clientKey(c);

  // Prefer Cloudflare's native, durable Rate Limiting binding when configured.
  // The in-memory map below is per-isolate (and thus only approximate across the
  // edge) — it is a best-effort fallback, not the primary control.
  const limiter = (c.env as Env | undefined)?.RATE_LIMITER;
  if (limiter) {
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
    c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
    c.header("X-RateLimit-Remaining", String(MAX_REQUESTS - 1));
    await next();
    return;
  }

  if (existing.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
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
  c.header("X-RateLimit-Limit", String(MAX_REQUESTS));
  c.header("X-RateLimit-Remaining", String(MAX_REQUESTS - existing.count));
  await next();
}
