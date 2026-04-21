import { Hono } from "hono";

export const docsRouter = new Hono();

const DOCS_SITE = "https://mycal-web.pages.dev/docs";

// GET /v1/docs — redirect to the full documentation site
docsRouter.get("/", (c) => c.redirect(`${DOCS_SITE}/rest-api/overview/`, 302));

// GET /v1/openapi.json — serve the OpenAPI spec summary. Full spec lives in openapi.yaml at repo root.
docsRouter.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.1.0",
    info: {
      title: "Malaysia Calendar API",
      version: "0.1.0",
      description:
        "Malaysia's most complete calendar API. See https://mycal-web.pages.dev/docs for interactive documentation.",
      contact: { url: "https://github.com/Junhui20/malaysia-calendar-api" },
      license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
    },
    servers: [{ url: "https://mycal-api.huijun00100101.workers.dev/v1" }],
    externalDocs: { url: DOCS_SITE, description: "Full MyCal documentation" },
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
