import { Hono } from "hono";

export const webhooksRouter = new Hono();

// In-memory store (replace with D1 in production)
interface WebhookSubscription {
  readonly id: string;
  readonly url: string;
  readonly email: string;
  readonly events: readonly string[];
  readonly secret: string;
  readonly createdAt: string;
  readonly active: boolean;
}

const subscriptions = new Map<string, WebhookSubscription>();

const VALID_EVENTS = [
  "holiday.created",
  "holiday.updated",
  "holiday.status_changed",
  "holiday.cancelled",
  "holiday.replacement_created",
  "school.term_changed",
  "school.holiday_changed",
  "exam.date_changed",
  "exam.results_date_announced",
] as const;

function generateId(): string {
  return `wh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// POST /webhooks/subscribe
webhooksRouter.post("/subscribe", async (c) => {
  const body = await c.req.json();

  if (!body.url || !body.email) {
    return c.json(
      {
        error: {
          code: "MISSING_FIELDS",
          message: "url and email are required",
        },
      },
      400
    );
  }

  try {
    new URL(body.url);
  } catch {
    return c.json(
      { error: { code: "INVALID_URL", message: "url must be a valid URL" } },
      400
    );
  }

  const events = body.events ?? ["holiday.created", "holiday.updated", "holiday.status_changed"];
  const invalidEvents = events.filter(
    (e: string) => !VALID_EVENTS.includes(e as (typeof VALID_EVENTS)[number])
  );
  if (invalidEvents.length > 0) {
    return c.json(
      {
        error: {
          code: "INVALID_EVENTS",
          message: `Invalid events: ${invalidEvents.join(", ")}`,
          validEvents: VALID_EVENTS,
        },
      },
      400
    );
  }

  const id = generateId();
  const secret = generateSecret();

  const subscription: WebhookSubscription = {
    id,
    url: body.url,
    email: body.email,
    events,
    secret,
    createdAt: new Date().toISOString(),
    active: true,
  };

  subscriptions.set(id, subscription);

  return c.json(
    {
      data: {
        id,
        url: subscription.url,
        events: subscription.events,
        secret,
        createdAt: subscription.createdAt,
      },
      meta: {
        note: "Store the secret — it will be used to sign webhook payloads (HMAC-SHA256). It cannot be retrieved again.",
      },
    },
    201
  );
});

// DELETE /webhooks/:id
webhooksRouter.delete("/:id", (c) => {
  const id = c.req.param("id");
  const sub = subscriptions.get(id);

  if (!sub) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Webhook ${id} not found` } },
      404
    );
  }

  subscriptions.delete(id);
  return c.json({ data: { id, deleted: true } });
});

// GET /webhooks/:id/deliveries
webhooksRouter.get("/:id/deliveries", (c) => {
  const id = c.req.param("id");
  const sub = subscriptions.get(id);

  if (!sub) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Webhook ${id} not found` } },
      404
    );
  }

  // Delivery log would come from D1 in production
  return c.json({
    data: {
      webhookId: id,
      deliveries: [],
    },
    meta: { note: "Delivery logging requires D1 — not yet configured" },
  });
});
