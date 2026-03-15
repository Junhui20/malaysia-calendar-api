import { Hono } from "hono";
import { resolveStateCode, countBusinessDays, addBusinessDays } from "@mycal/core";
import { getHolidays, states } from "../data.js";

export const businessDaysRouter = new Hono();

// GET /business-days?start=2026-03-01&end=2026-03-31&state=selangor
businessDaysRouter.get("/", (c) => {
  const start = c.req.query("start");
  const end = c.req.query("end");
  const stateQuery = c.req.query("state");

  if (!start || !end || !stateQuery) {
    return c.json({ error: { code: "MISSING_PARAMS", message: "start, end, and state are required" } }, 400);
  }

  const state = resolveStateCode(stateQuery, states);
  if (!state) {
    return c.json({ error: { code: "INVALID_STATE", message: `Unknown state "${stateQuery}"` } }, 400);
  }

  const year = Number(start.slice(0, 4));
  const holidays = getHolidays(year);
  const result = countBusinessDays(start, end, state, holidays);

  return c.json({ data: result, meta: { start, end, state: state.code } });
});

// GET /business-days/add?date=2026-03-01&days=10&state=selangor
businessDaysRouter.get("/add", (c) => {
  const date = c.req.query("date");
  const days = c.req.query("days");
  const stateQuery = c.req.query("state");

  if (!date || !days || !stateQuery) {
    return c.json({ error: { code: "MISSING_PARAMS", message: "date, days, and state are required" } }, 400);
  }

  const state = resolveStateCode(stateQuery, states);
  if (!state) {
    return c.json({ error: { code: "INVALID_STATE", message: `Unknown state "${stateQuery}"` } }, 400);
  }

  const year = Number(date.slice(0, 4));
  const holidays = getHolidays(year);
  const resultDate = addBusinessDays(date, Number(days), state, holidays);

  return c.json({ data: { startDate: date, businessDays: Number(days), resultDate }, meta: { state: state.code } });
});
