import { Hono } from "hono";
import {
  resolveStateCode,
  findHolidaysByDate,
  isWeekend,
  getDayOfWeekName,
  getWeekendDayNames,
  findSchoolTermByDate,
  findSchoolHolidayByDate,
  isSchoolDay as checkSchoolDay,
} from "@mycal/core";
import { getHolidays, getSchoolTerms, getSchoolHolidays, states } from "../data.js";

export const checkRouter = new Hono();

// GET /holidays/check?date=2026-03-21&state=selangor
checkRouter.get("/", (c) => {
  const date = c.req.query("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: { code: "INVALID_DATE", message: "Date must be in YYYY-MM-DD format" } }, 400);
  }

  const stateQuery = c.req.query("state");
  if (!stateQuery) {
    return c.json({ error: { code: "MISSING_STATE", message: "State parameter is required for /check" } }, 400);
  }

  const state = resolveStateCode(stateQuery, states);
  if (!state) {
    return c.json({ error: { code: "INVALID_STATE", message: `Unknown state "${stateQuery}"` } }, 400);
  }

  const year = Number(date.slice(0, 4));
  const holidays = getHolidays(year);
  const schoolTerms = getSchoolTerms(year);
  const schoolHols = getSchoolHolidays(year);

  const dayHolidays = findHolidaysByDate(date, holidays, state.code);
  const weekend = isWeekend(date, state);
  const isHoliday = dayHolidays.length > 0;
  const isWorkingDay = !weekend && !isHoliday;

  const schoolTerm = findSchoolTermByDate(date, schoolTerms, state.group);
  const schoolHoliday = findSchoolHolidayByDate(date, schoolHols, state.group, state.code);
  const schoolDay = checkSchoolDay(date, schoolTerms, schoolHols, state.group, isHoliday, weekend, state.code);

  return c.json({
    data: {
      date,
      dayOfWeek: getDayOfWeekName(date),
      isHoliday,
      isWeekend: weekend,
      isWorkingDay,
      isSchoolDay: schoolDay,
      holidays: dayHolidays,
      school: {
        group: state.group,
        term: schoolTerm ? { id: schoolTerm.id, term: schoolTerm.term, startDate: schoolTerm.startDate, endDate: schoolTerm.endDate } : null,
        holiday: schoolHoliday ? { id: schoolHoliday.id, name: schoolHoliday.name, type: schoolHoliday.type } : null,
      },
      state: {
        code: state.code,
        weekendDays: getWeekendDayNames(state, date),
        group: state.group,
      },
    },
  });
});
