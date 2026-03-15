import { Hono } from "hono";
import { cors } from "hono/cors";
import { holidaysRouter } from "./routes/holidays.js";
import { statesRouter } from "./routes/states.js";
import { checkRouter } from "./routes/check.js";
import { businessDaysRouter } from "./routes/business-days.js";
import { schoolRouter } from "./routes/school.js";
import { feedsRouter } from "./routes/feeds.js";

const app = new Hono().basePath("/v1");

// Middleware
app.use("*", cors());

// Routes
app.route("/holidays", holidaysRouter);
app.route("/holidays/check", checkRouter);
app.route("/states", statesRouter);
app.route("/business-days", businessDaysRouter);
app.route("/school", schoolRouter);
app.route("/feed", feedsRouter);

// Root
app.get("/", (c) => {
  return c.json({
    name: "Malaysia Calendar API",
    version: "0.1.0",
    description: "Malaysia's most complete calendar API — public holidays, school calendar, exam schedules",
    endpoints: {
      holidays: "/v1/holidays?year=2026&state=selangor",
      check: "/v1/holidays/check?date=2026-03-21&state=selangor",
      next: "/v1/holidays/next?state=selangor",
      between: "/v1/holidays/between?start=2026-01-01&end=2026-06-30&state=selangor",
      today: "/v1/holidays/today?state=selangor",
      businessDays: "/v1/business-days?start=2026-03-01&end=2026-03-31&state=selangor",
      states: "/v1/states",
      resolve: "/v1/states/resolve?q=kl",
      schoolTerms: "/v1/school/terms?year=2026&group=B",
      schoolHolidays: "/v1/school/holidays?year=2026&state=selangor",
      schoolExams: "/v1/school/exams?year=2026",
      isSchoolDay: "/v1/school/is-school-day?date=2026-03-21&state=selangor",
    },
    sources: "https://github.com/user/MalaysiaCalendarApi",
  });
});

// 404
app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: `Route ${c.req.path} not found` } }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }, 500);
});

export default app;
