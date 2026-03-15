import { Hono } from "hono";

export const changelogRouter = new Hono();

// Static changelog entries — in production, these would come from D1/KV
const CHANGELOG = [
  {
    timestamp: "2025-08-28T00:00:00+08:00",
    event: "data.published",
    description: "Initial 2026 holiday data published from JPM gazette GN-33499/33500/33501",
  },
  {
    timestamp: "2025-08-28T00:00:00+08:00",
    event: "data.published",
    description: "2026 school calendar published from KPM Kalendar Akademik",
  },
  {
    timestamp: "2025-08-28T00:00:00+08:00",
    event: "data.published",
    description: "2026 exam schedule published (SPM, STPM) from KPM/MPM",
  },
];

// GET /changelog?limit=10&since=2025-01-01
changelogRouter.get("/", (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const since = c.req.query("since");

  let entries = CHANGELOG;

  if (since) {
    entries = entries.filter((e) => e.timestamp >= since);
  }

  return c.json({
    data: entries.slice(0, limit),
    meta: { total: entries.length, limit },
  });
});
