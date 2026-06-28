import { Hono } from "hono";
import type { Context } from "hono";
import {
  requireAdmin,
  unauthorized,
  sha256hex,
  lookupTier,
  TIER_LIMITS,
  type Env,
  type ApiTier,
  type ApiKeyRecord,
} from "../_shared.js";

export const keysRouter = new Hono();

function keyStore(c: Context): KVNamespace | undefined {
  return (c.env as Env | undefined)?.API_KEYS;
}

function generateKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return "mycal_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function notEnabled(c: Context): Response {
  return c.json(
    { error: { code: "NOT_ENABLED", message: "API key store (KV binding API_KEYS) is not configured." } },
    503
  );
}

// POST /v1/keys — issue a key. Admin-gated for now (public self-serve needs
// email verification / captcha; see docs). Body: { tier?: "free"|"pro", label? }
keysRouter.post("/", async (c) => {
  if (!requireAdmin(c)) return unauthorized(c);
  const store = keyStore(c);
  if (!store) return notEnabled(c);

  const body = (await c.req.json().catch(() => ({}))) as { tier?: string; label?: string };
  const tier: ApiTier = body.tier === "pro" ? "pro" : "free";
  const key = generateKey();
  const hash = await sha256hex(key);
  const record: ApiKeyRecord = {
    tier,
    label: typeof body.label === "string" ? body.label.slice(0, 80) : undefined,
    createdAt: new Date().toISOString(),
  };
  await store.put(`key:${hash}`, JSON.stringify(record));

  return c.json(
    {
      data: { key, tier, label: record.label, createdAt: record.createdAt },
      meta: {
        note: "Store this key now — it cannot be retrieved again. Send it as 'Authorization: Bearer <key>'.",
        limitPerMinute: TIER_LIMITS[tier],
      },
    },
    201
  );
});

// GET /v1/keys/whoami — the tier the presented key resolves to (public)
keysRouter.get("/whoami", async (c) => {
  const info = await lookupTier(c);
  const tier = info?.tier ?? "anonymous";
  return c.json({ data: { tier, limitPerMinute: TIER_LIMITS[tier], keyed: info !== null } });
});

// DELETE /v1/keys — revoke a key (admin-gated). Body: { key }
keysRouter.delete("/", async (c) => {
  if (!requireAdmin(c)) return unauthorized(c);
  const store = keyStore(c);
  if (!store) return notEnabled(c);

  const body = (await c.req.json().catch(() => ({}))) as { key?: string };
  if (!body.key) {
    return c.json({ error: { code: "MISSING_KEY", message: "Provide the key to revoke." } }, 400);
  }
  await store.delete(`key:${await sha256hex(body.key)}`);
  return c.json({ data: { revoked: true } });
});
