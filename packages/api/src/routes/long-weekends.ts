import { Hono } from "hono";
import {
  resolveStateCode,
  filterHolidays,
  isWeekend,
  addDays,
  type LongWeekend,
} from "@catlabtech/mycal-core";
import { getHolidays, states } from "../data.js";

export const longWeekendsRouter = new Hono();

// GET /holidays/long-weekends?year=2026&state=selangor
longWeekendsRouter.get("/", (c) => {
  const year = Number(c.req.query("year") ?? new Date().getFullYear());
  const stateQuery = c.req.query("state");

  const stateObj = stateQuery
    ? resolveStateCode(stateQuery, states)
    : states.find((s) => s.code === "kuala-lumpur")!;

  if (!stateObj) {
    return c.json(
      { error: { code: "INVALID_STATE", message: `Unknown state "${stateQuery}"` } },
      400
    );
  }

  const holidays = getHolidays(year);
  const stateHolidays = filterHolidays(holidays, { state: stateObj.code, year });
  const holidayDateMap = new Map(stateHolidays.map((h) => [h.date, h]));

  const longWeekends: LongWeekend[] = [];
  let current = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  while (current <= yearEnd) {
    const isNonWorking =
      isWeekend(current, stateObj) || holidayDateMap.has(current);

    if (!isNonWorking) {
      current = addDays(current, 1);
      continue;
    }

    // Found start of non-working streak
    const startDate = current;
    const streakHolidays = [];
    let weekendDays = 0;
    let totalDays = 0;

    while (current <= yearEnd) {
      const weekend = isWeekend(current, stateObj);
      const holiday = holidayDateMap.get(current);

      if (!weekend && !holiday) break;

      if (weekend) weekendDays++;
      if (holiday) streakHolidays.push(holiday);
      totalDays++;
      current = addDays(current, 1);
    }

    if (totalDays >= 3) {
      const endDate = addDays(current, -1);
      const bridgeDaysNeeded = Math.max(
        0,
        totalDays - weekendDays - streakHolidays.length
      );

      longWeekends.push({
        startDate,
        endDate,
        totalDays,
        holidays: streakHolidays,
        weekendDays,
        bridgeDaysNeeded,
      });
    }
  }

  return c.json({
    data: longWeekends,
    meta: { year, state: stateObj.code, total: longWeekends.length },
  });
});
