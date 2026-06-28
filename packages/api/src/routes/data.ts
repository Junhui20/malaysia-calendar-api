import { Hono } from "hono";
import {
  states,
  getHolidays,
  getAvailableYears,
  getSchoolTerms,
  getSchoolHolidays,
  getExams,
} from "../data.js";
import { parseYearOrError, isResponse } from "../_shared.js";

export const dataRouter = new Hono();

// Open data is immutable reference data — cache hard at the edge/browser.
const IMMUTABLE = "public, max-age=86400, stale-while-revalidate=604800";

// GET /v1/data/manifest — what's available (the "index" of the open dataset)
dataRouter.get("/manifest", (c) => {
  c.header("Cache-Control", IMMUTABLE);
  return c.json({
    name: "mycal open data",
    description: "Raw, no-key, cacheable Malaysia calendar data — consume with zero SDK.",
    years: getAvailableYears(),
    states: states.length,
    files: {
      states: "/v1/data/states",
      holidaysByYear: "/v1/data/holidays/{year}",
      everything: "/v1/data/all",
    },
    license: "MIT",
    source: "https://github.com/Junhui20/malaysia-calendar-api",
  });
});

// GET /v1/data/states — raw states array (no response envelope)
dataRouter.get("/states", (c) => {
  c.header("Cache-Control", IMMUTABLE);
  return c.json(states);
});

// GET /v1/data/holidays/:year — raw holidays array for a year (gov.uk bank-holidays.json model)
dataRouter.get("/holidays/:year", (c) => {
  const year = parseYearOrError(c, c.req.param("year"));
  if (isResponse(year)) return year;
  c.header("Cache-Control", IMMUTABLE);
  return c.json(getHolidays(year));
});

// GET /v1/data/all — the whole dataset in one snapshot, keyed by year
dataRouter.get("/all", (c) => {
  c.header("Cache-Control", IMMUTABLE);
  const years = getAvailableYears();
  const byYear: Record<number, unknown> = {};
  for (const y of years) {
    byYear[y] = {
      holidays: getHolidays(y),
      schoolTerms: getSchoolTerms(y),
      schoolHolidays: getSchoolHolidays(y),
      exams: getExams(y),
    };
  }
  return c.json({ states, years: byYear, meta: { years, license: "MIT" } });
});
