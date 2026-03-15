import { Hono } from "hono";
import {
  filterHolidays,
  findHolidaysByDate,
  findNextHoliday,
  resolveStateCode,
  type HolidayType,
  type HolidayStatus,
} from "@mycal/core";
import { getHolidays, states } from "../data.js";

export const holidaysRouter = new Hono();

// GET /holidays?year=2026&state=selangor&month=3&type=islamic&status=tentative
holidaysRouter.get("/", (c) => {
  const year = Number(c.req.query("year") ?? new Date().getFullYear());
  const stateQuery = c.req.query("state");
  const month = c.req.query("month") ? Number(c.req.query("month")) : undefined;
  const type = c.req.query("type") as HolidayType | undefined;
  const status = c.req.query("status") as HolidayStatus | undefined;

  const holidays = getHolidays(year);
  if (holidays.length === 0) {
    return c.json({ error: { code: "YEAR_NOT_FOUND", message: `No data for year ${year}` } }, 404);
  }

  let stateCode: string | undefined;
  if (stateQuery) {
    const resolved = resolveStateCode(stateQuery, states);
    if (!resolved) {
      return c.json({
        error: { code: "INVALID_STATE", message: `Unknown state "${stateQuery}". Use /states/resolve?q=${stateQuery} for suggestions.` },
      }, 400);
    }
    stateCode = resolved.code;
  }

  const filtered = filterHolidays(holidays, { year, month, state: stateCode, type, status });

  return c.json({
    data: filtered,
    meta: { total: filtered.length, year, state: stateCode ?? null, lastUpdated: new Date().toISOString() },
  });
});

// GET /holidays/today?state=selangor
holidaysRouter.get("/today", (c) => {
  const today = new Date().toISOString().slice(0, 10);
  const stateQuery = c.req.query("state");
  const year = Number(today.slice(0, 4));
  const holidays = getHolidays(year);

  let stateCode: string | undefined;
  if (stateQuery) {
    const resolved = resolveStateCode(stateQuery, states);
    if (resolved) stateCode = resolved.code;
  }

  const todayHolidays = findHolidaysByDate(today, holidays, stateCode);

  return c.json({
    data: { date: today, holidays: todayHolidays, isHoliday: todayHolidays.length > 0 },
    meta: { state: stateCode ?? null },
  });
});

// GET /holidays/next?state=selangor&type=islamic&limit=3
holidaysRouter.get("/next", (c) => {
  const today = new Date().toISOString().slice(0, 10);
  const stateQuery = c.req.query("state");
  const type = c.req.query("type") as HolidayType | undefined;
  const limit = Math.min(Number(c.req.query("limit") ?? 1), 10);
  const year = Number(today.slice(0, 4));

  let stateCode: string | undefined;
  if (stateQuery) {
    const resolved = resolveStateCode(stateQuery, states);
    if (resolved) stateCode = resolved.code;
  }

  const holidays = getHolidays(year);
  const next = findNextHoliday(today, holidays, stateCode, type, limit);

  return c.json({ data: next, meta: { afterDate: today, state: stateCode ?? null } });
});

// GET /holidays/between?start=2026-01-01&end=2026-06-30&state=selangor
holidaysRouter.get("/between", (c) => {
  const start = c.req.query("start");
  const end = c.req.query("end");

  if (!start || !end) {
    return c.json({ error: { code: "MISSING_PARAMS", message: "Both start and end are required" } }, 400);
  }

  const stateQuery = c.req.query("state");
  const year = Number(start.slice(0, 4));
  const holidays = getHolidays(year);

  let stateCode: string | undefined;
  if (stateQuery) {
    const resolved = resolveStateCode(stateQuery, states);
    if (resolved) stateCode = resolved.code;
  }

  const filtered = holidays.filter((h) => {
    if (h.date < start || h.date > end) return false;
    if (h.status === "cancelled") return false;
    if (stateCode && !h.states.includes("*") && !h.states.includes(stateCode)) return false;
    return true;
  });

  return c.json({
    data: filtered,
    meta: { total: filtered.length, start, end, state: stateCode ?? null },
  });
});
