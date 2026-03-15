import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimiter } from "./middleware/rate-limit.js";
import { cacheHeaders } from "./middleware/cache.js";
import { holidaysRouter } from "./routes/holidays.js";
import { statesRouter } from "./routes/states.js";
import { checkRouter } from "./routes/check.js";
import { longWeekendsRouter } from "./routes/long-weekends.js";
import { businessDaysRouter } from "./routes/business-days.js";
import { schoolRouter } from "./routes/school.js";
import { feedsRouter } from "./routes/feeds.js";
import { changelogRouter } from "./routes/changelog.js";
import { adminRouter } from "./routes/admin.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { docsRouter } from "./routes/docs.js";
import { handleCron } from "./cron/rss-monitor.js";
import { landingHTML } from "./landing.js";

// ─── V1 API ───
const v1 = new Hono();

// Middleware
v1.use("*", cors());
v1.use("*", rateLimiter);
v1.use("*", cacheHeaders());

// Routes
v1.route("/holidays", holidaysRouter);
v1.route("/holidays/check", checkRouter);
v1.route("/holidays/long-weekends", longWeekendsRouter);
v1.route("/states", statesRouter);
v1.route("/business-days", businessDaysRouter);
v1.route("/school", schoolRouter);
v1.route("/feed", feedsRouter);
v1.route("/changelog", changelogRouter);
v1.route("/admin", adminRouter);
v1.route("/webhooks", webhooksRouter);
v1.route("/docs", docsRouter);
v1.get("/openapi.json", (c) => {
  return docsRouter.fetch(new Request(new URL("/openapi.json", c.req.url)));
});

// V1 root
v1.get("/", (c) => {
  return c.json({
    name: "Malaysia Calendar API",
    version: "0.1.0",
    description: "Malaysia's most complete calendar API — public holidays, school calendar, exam schedules",
    docs: "/v1/docs",
    endpoints: {
      holidays: "/v1/holidays?year=2026&state=selangor",
      check: "/v1/holidays/check?date=2026-03-21&state=selangor",
      next: "/v1/holidays/next?state=selangor",
      between: "/v1/holidays/between?start=2026-01-01&end=2026-06-30&state=selangor",
      today: "/v1/holidays/today?state=selangor",
      longWeekends: "/v1/holidays/long-weekends?year=2026&state=selangor",
      businessDays: "/v1/business-days?start=2026-03-01&end=2026-03-31&state=selangor",
      addBusinessDays: "/v1/business-days/add?date=2026-03-01&days=10&state=selangor",
      states: "/v1/states",
      resolve: "/v1/states/resolve?q=kl",
      schoolTerms: "/v1/school/terms?year=2026&group=B",
      schoolHolidays: "/v1/school/holidays?year=2026&state=selangor",
      schoolExams: "/v1/school/exams?year=2026",
      isSchoolDay: "/v1/school/is-school-day?date=2026-03-21&state=selangor",
      icalFeed: "/v1/feed/ical/selangor",
      changelog: "/v1/changelog",
    },
    sources: "https://github.com/Junhui20/malaysia-calendar-api",
  });
});

// V1 404
v1.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: `Route ${c.req.path} not found` } }, 404);
});

// V1 error handler
v1.onError((err, c) => {
  console.error(err);
  return c.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }, 500);
});

// ─── Root App ───
const app = new Hono();

// Landing page
app.get("/", (c) => c.html(landingHTML));

// Mount v1
app.route("/v1", v1);

// Catch-all 404
app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: `Route ${c.req.path} not found. Try /v1 for the API root.` } }, 404);
});

// Export
export default {
  fetch: app.fetch,
  scheduled: handleCron,
};
