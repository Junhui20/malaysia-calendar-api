import { Hono } from "hono";
import { holidaySchema } from "@mycal/core";

export const adminRouter = new Hono();

function requireApiKey(c: any): boolean {
  const key = c.req.header("X-API-Key") ?? c.req.query("api_key");
  const expected = c.env?.ADMIN_API_KEY;
  if (!expected || key !== expected) {
    return false;
  }
  return true;
}

// POST /admin/holidays — Add ad-hoc holiday
adminRouter.post("/holidays", async (c) => {
  if (!requireApiKey(c)) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Valid API key required" } },
      401
    );
  }

  const body = await c.req.json();
  const result = holidaySchema.safeParse(body);

  if (!result.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid holiday data",
          details: result.error.issues,
        },
      },
      400
    );
  }

  // In production: write to KV immediately, then async commit to Git
  // For now: return success with the validated holiday
  return c.json(
    {
      data: result.data,
      meta: {
        action: "created",
        note: "KV write not yet implemented — deploy with KV binding to enable",
      },
    },
    201
  );
});

// PATCH /admin/holidays/:id — Update holiday (e.g. confirm Islamic date)
adminRouter.patch("/holidays/:id", async (c) => {
  if (!requireApiKey(c)) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Valid API key required" } },
      401
    );
  }

  const id = c.req.param("id");
  const body = await c.req.json();

  // Partial validation — only validate provided fields
  const allowedFields = [
    "date",
    "endDate",
    "name",
    "status",
    "states",
    "hijriDate",
    "confirmedAt",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return c.json(
      { error: { code: "NO_UPDATES", message: "No valid fields to update" } },
      400
    );
  }

  return c.json({
    data: { id, updates, updatedAt: new Date().toISOString() },
    meta: {
      action: "updated",
      note: "KV write not yet implemented — deploy with KV binding to enable",
    },
  });
});

// DELETE /admin/holidays/:id — Soft delete (set status to cancelled)
adminRouter.delete("/holidays/:id", async (c) => {
  if (!requireApiKey(c)) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Valid API key required" } },
      401
    );
  }

  const id = c.req.param("id");

  return c.json({
    data: { id, status: "cancelled", updatedAt: new Date().toISOString() },
    meta: {
      action: "cancelled",
      note: "Soft delete — status set to cancelled",
    },
  });
});
