import { Hono } from "hono";
import { holidaySchema } from "@catlabtech/mycal-core";
import { requireAdmin, unauthorized, notImplemented } from "../_shared.js";

export const adminRouter = new Hono();

// POST /admin/holidays — Add ad-hoc holiday
adminRouter.post("/holidays", async (c) => {
  if (!requireAdmin(c)) return unauthorized(c);

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

  // In production: write to KV immediately, then async commit to Git.
  // Persistence is not wired up yet, so we must not report a fake success.
  return notImplemented(
    c,
    "Adding holidays is not yet implemented — deploy with a KV binding to enable."
  );
});

// PATCH /admin/holidays/:id — Update holiday (e.g. confirm Islamic date)
adminRouter.patch("/holidays/:id", async (c) => {
  if (!requireAdmin(c)) return unauthorized(c);

  const body = await c.req.json();

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

  return notImplemented(
    c,
    "Updating holidays is not yet implemented — deploy with a KV binding to enable."
  );
});

// DELETE /admin/holidays/:id — Soft delete (set status to cancelled)
adminRouter.delete("/holidays/:id", async (c) => {
  if (!requireAdmin(c)) return unauthorized(c);

  return notImplemented(
    c,
    "Deleting holidays is not yet implemented — deploy with a KV binding to enable."
  );
});
