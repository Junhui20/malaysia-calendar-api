import type { Context } from "hono";
import {
  resolveStateCode,
  isValidISODate,
  timingSafeEqualString,
  type State,
} from "@catlabtech/mycal-core";
import { states } from "./data.js";

export { isValidISODate };

export const DEFAULT_STATE_CODE = "kuala-lumpur";
export const MAX_RANGE_DAYS = 366 * 5; // ~5 years per business-day range query
export const MAX_ADD_DAYS = 3650; // ~10 years per add/subtract
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

/** Cloudflare Worker bindings available on `c.env`. */
export interface Env {
  ADMIN_API_KEY?: string;
  RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  API_KEYS?: KVNamespace;
}

// ─── API key tiers ───
// Anonymous-first: no key required. A key just raises the per-minute limit.
export type ApiTier = "anonymous" | "free" | "pro";
export const TIER_LIMITS: Record<ApiTier, number> = {
  anonymous: 100,
  free: 1000,
  pro: 10000,
};

export interface ApiKeyRecord {
  readonly tier: ApiTier;
  readonly label?: string;
  readonly createdAt: string;
}

export async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function presentedKey(c: Context): string | undefined {
  const auth = c.req.header("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const xk = c.req.header("X-API-Key");
  return xk ?? undefined;
}

/**
 * Resolve the caller's tier from a presented `mycal_…` key (Bearer or X-API-Key)
 * by looking up its SHA-256 hash in KV. Returns null (→ anonymous) when there's
 * no KV binding, no key, or no match. Only `mycal_`-prefixed keys are looked up,
 * so the separate admin key never hits KV.
 */
export async function lookupTier(
  c: Context
): Promise<{ tier: ApiTier; keyId: string } | null> {
  const kv = (c.env as Env | undefined)?.API_KEYS;
  const key = presentedKey(c);
  if (!kv || !key || !key.startsWith("mycal_")) return null;
  const hash = await sha256hex(key);
  const raw = await kv.get(`key:${hash}`);
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as ApiKeyRecord;
    return { tier: rec.tier, keyId: hash.slice(0, 12) };
  } catch {
    return null;
  }
}

export function badRequest(c: Context, code: string, message: string): Response {
  return c.json({ error: { code, message } }, 400);
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

/**
 * Resolve a `?state=` query param to a State, or return a 400 Response.
 *
 * With `optional: true` an absent param falls back to DEFAULT_STATE, but an
 * explicitly-provided *unknown* state always 400s — a typo must never be
 * silently widened to all-state data (the inconsistency the old routes had).
 */
export function resolveStateOrError(
  c: Context,
  query: string | undefined,
  opts: { optional?: boolean; default?: string } = {}
): State | Response {
  if (!query) {
    if (!opts.optional) {
      return badRequest(c, "MISSING_STATE", "state parameter is required");
    }
    const fallback = resolveStateCode(opts.default ?? DEFAULT_STATE_CODE, states);
    if (!fallback) {
      return badRequest(c, "INVALID_STATE", "default state is not configured");
    }
    return fallback;
  }
  const resolved = resolveStateCode(query, states);
  if (!resolved) {
    return badRequest(c, "INVALID_STATE", `Unknown state "${query}"`);
  }
  return resolved;
}

/** Parse and bound a `?year=` query param (defends the year-scanning routes). */
export function parseYearOrError(
  c: Context,
  raw: string | undefined
): number | Response {
  const year = raw === undefined ? new Date().getUTCFullYear() : Number(raw);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return badRequest(
      c,
      "INVALID_YEAR",
      `year must be an integer between ${MIN_YEAR} and ${MAX_YEAR}`
    );
  }
  return year;
}

/**
 * Admin authentication: an `X-API-Key` header compared in constant time against
 * the `ADMIN_API_KEY` secret. Header-only (never a query param, which would leak
 * into logs/Referer) and fails closed when the secret is unset.
 */
export function requireAdmin(c: Context): boolean {
  const provided = c.req.header("X-API-Key");
  const expected = (c.env as Env | undefined)?.ADMIN_API_KEY;
  if (!expected || !provided) return false;
  return timingSafeEqualString(provided, expected);
}

export function unauthorized(c: Context): Response {
  return c.json(
    { error: { code: "UNAUTHORIZED", message: "Valid X-API-Key header required" } },
    401
  );
}
