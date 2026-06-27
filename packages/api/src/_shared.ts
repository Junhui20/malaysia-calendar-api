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
