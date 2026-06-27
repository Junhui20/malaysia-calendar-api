import { Hono } from "hono";
import { findLongWeekends, optimizeLeave } from "@catlabtech/mycal-core";
import { getHolidays } from "../data.js";
import {
  badRequest,
  resolveStateOrError,
  parseYearOrError,
  isResponse,
} from "../_shared.js";

export const longWeekendsRouter = new Hono();

// GET /holidays/long-weekends?year=2026&state=selangor
longWeekendsRouter.get("/", (c) => {
  const year = parseYearOrError(c, c.req.query("year"));
  if (isResponse(year)) return year;

  const state = resolveStateOrError(c, c.req.query("state"), { optional: true });
  if (isResponse(state)) return state;

  const longWeekends = findLongWeekends(year, state, getHolidays(year));
  return c.json({
    data: longWeekends,
    meta: { year, state: state.code, total: longWeekends.length },
  });
});

// GET /holidays/leave-optimizer?year=2026&state=selangor&maxLeave=3&limit=10
// "Spend up to N annual-leave days to get the longest possible break."
export const leaveOptimizerRouter = new Hono();

leaveOptimizerRouter.get("/", (c) => {
  const year = parseYearOrError(c, c.req.query("year"));
  if (isResponse(year)) return year;

  const maxLeaveRaw = c.req.query("maxLeave");
  const maxLeave = maxLeaveRaw === undefined ? 3 : Number(maxLeaveRaw);
  if (!Number.isInteger(maxLeave) || maxLeave < 1 || maxLeave > 10) {
    return badRequest(c, "INVALID_MAX_LEAVE", "maxLeave must be an integer between 1 and 10");
  }

  const state = resolveStateOrError(c, c.req.query("state"), { optional: true });
  if (isResponse(state)) return state;

  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 10), 1), 50);
  const all = optimizeLeave(year, state, getHolidays(year), maxLeave);

  return c.json({
    data: all.slice(0, limit),
    meta: { year, state: state.code, maxLeave, total: all.length },
  });
});
