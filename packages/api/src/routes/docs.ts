import { Hono } from "hono";

export const docsRouter = new Hono();

// GET /docs — Interactive API docs via Scalar
docsRouter.get("/", (c) => {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Malaysia Calendar API — Docs</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script id="api-reference" data-url="/v1/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
  return c.html(html);
});

// GET /openapi.json — Serve OpenAPI spec as JSON
docsRouter.get("/openapi.json", async (c) => {
  // In production, serve from R2 or bundled. For now, redirect to YAML endpoint.
  // The openapi.yaml is bundled at build time or served statically.
  return c.json({
    openapi: "3.1.0",
    info: {
      title: "Malaysia Calendar API",
      version: "0.1.0",
      description: "Malaysia's most complete calendar API. See /v1/docs for interactive documentation.",
    },
    servers: [{ url: "https://mycal-api.huijun00100101.workers.dev/v1" }],
    paths: {
      "/holidays": { get: { summary: "List holidays", tags: ["Holidays"] } },
      "/holidays/check": { get: { summary: "Check if date is holiday/working day", tags: ["Holidays"] } },
      "/holidays/today": { get: { summary: "Today's holiday status", tags: ["Holidays"] } },
      "/holidays/next": { get: { summary: "Next upcoming holiday", tags: ["Holidays"] } },
      "/holidays/between": { get: { summary: "Holidays in date range", tags: ["Holidays"] } },
      "/holidays/long-weekends": { get: { summary: "Long weekends analysis", tags: ["Holidays"] } },
      "/states": { get: { summary: "List all states", tags: ["States"] } },
      "/states/resolve": { get: { summary: "Resolve state alias", tags: ["States"] } },
      "/business-days": { get: { summary: "Count business days", tags: ["Business Days"] } },
      "/business-days/add": { get: { summary: "Add business days to date", tags: ["Business Days"] } },
      "/school/terms": { get: { summary: "School term dates", tags: ["School"] } },
      "/school/holidays": { get: { summary: "School holidays", tags: ["School"] } },
      "/school/exams": { get: { summary: "Exam schedule", tags: ["School"] } },
      "/school/is-school-day": { get: { summary: "Check if school day", tags: ["School"] } },
      "/feed/ical/{state}": { get: { summary: "iCal subscription feed", tags: ["Feeds"] } },
      "/changelog": { get: { summary: "Data change log", tags: ["Meta"] } },
    },
  });
});
