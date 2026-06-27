import { Hono } from "hono";
import { countBusinessDays, addBusinessDays, diffDays } from "@catlabtech/mycal-core";
import { getAllHolidays } from "../data.js";
import {
  badRequest,
  isValidISODate,
  resolveStateOrError,
  isResponse,
  MAX_RANGE_DAYS,
  MAX_ADD_DAYS,
} from "../_shared.js";

export const businessDaysRouter = new Hono();

// GET /business-days?start=2026-03-01&end=2026-03-31&state=selangor
businessDaysRouter.get("/", (c) => {
  const start = c.req.query("start");
  const end = c.req.query("end");

  if (!start || !end) {
    return badRequest(c, "MISSING_PARAMS", "start and end are required");
  }
  if (!isValidISODate(start) || !isValidISODate(end)) {
    return badRequest(c, "INVALID_DATE", "start and end must be valid YYYY-MM-DD dates");
  }
  if (start > end) {
    return badRequest(c, "INVALID_RANGE", "start must be on or before end");
  }
  if (diffDays(start, end) > MAX_RANGE_DAYS) {
    return badRequest(c, "RANGE_TOO_LARGE", `date range must not exceed ${MAX_RANGE_DAYS} days`);
  }

  const state = resolveStateOrError(c, c.req.query("state"));
  if (isResponse(state)) return state;

  const result = countBusinessDays(start, end, state, getAllHolidays());
  return c.json({ data: result, meta: { start, end, state: state.code } });
});

// GET /business-days/add?date=2026-03-01&days=10&state=selangor
businessDaysRouter.get("/add", (c) => {
  const date = c.req.query("date");
  const daysRaw = c.req.query("days");

  if (!date || daysRaw === undefined) {
    return badRequest(c, "MISSING_PARAMS", "date and days are required");
  }
  if (!isValidISODate(date)) {
    return badRequest(c, "INVALID_DATE", "date must be a valid YYYY-MM-DD date");
  }
  const days = Number(daysRaw);
  if (!Number.isInteger(days) || days < 0 || days > MAX_ADD_DAYS) {
    return badRequest(c, "INVALID_DAYS", `days must be an integer between 0 and ${MAX_ADD_DAYS}`);
  }

  const state = resolveStateOrError(c, c.req.query("state"));
  if (isResponse(state)) return state;

  const resultDate = addBusinessDays(date, days, state, getAllHolidays());
  return c.json({
    data: { startDate: date, businessDays: days, resultDate },
    meta: { state: state.code },
  });
});
