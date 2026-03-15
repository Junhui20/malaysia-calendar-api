import { Hono } from "hono";
import {
  resolveStateCode,
  findSchoolTermByDate,
  findSchoolHolidayByDate,
  findHolidaysByDate,
  isWeekend,
  isSchoolDay as checkSchoolDay,
  getDayOfWeekName,
  type StateGroup,
  type ExamType,
} from "@mycal/core";
import { getSchoolTerms, getSchoolHolidays, getExams, getHolidays, states } from "../data.js";

export const schoolRouter = new Hono();

function resolveGroup(c: any): { group: StateGroup; stateCode?: string } | null {
  const groupParam = c.req.query("group") as StateGroup | undefined;
  const stateQuery = c.req.query("state");

  if (stateQuery) {
    const state = resolveStateCode(stateQuery, states);
    if (!state) return null;
    return { group: state.group, stateCode: state.code };
  }

  if (groupParam && (groupParam === "A" || groupParam === "B")) {
    return { group: groupParam };
  }

  return { group: "B" }; // default
}

// GET /school/terms?year=2026&group=B
schoolRouter.get("/terms", (c) => {
  const year = Number(c.req.query("year") ?? new Date().getFullYear());
  const resolved = resolveGroup(c);

  if (!resolved) {
    return c.json({ error: { code: "INVALID_STATE", message: "Unknown state" } }, 400);
  }

  const terms = getSchoolTerms(year).filter((t) => t.group === resolved.group);

  return c.json({ data: terms, meta: { year, group: resolved.group, total: terms.length } });
});

// GET /school/holidays?year=2026&group=B
schoolRouter.get("/holidays", (c) => {
  const year = Number(c.req.query("year") ?? new Date().getFullYear());
  const resolved = resolveGroup(c);

  if (!resolved) {
    return c.json({ error: { code: "INVALID_STATE", message: "Unknown state" } }, 400);
  }

  const holidays = getSchoolHolidays(year).filter((h) => {
    if (h.group !== resolved.group) return false;
    if (resolved.stateCode && h.excludeStates?.includes(resolved.stateCode)) return false;
    if (h.states && resolved.stateCode && !h.states.includes(resolved.stateCode)) return false;
    return true;
  });

  return c.json({ data: holidays, meta: { year, group: resolved.group, total: holidays.length } });
});

// GET /school/exams?year=2026&type=spm
schoolRouter.get("/exams", (c) => {
  const year = Number(c.req.query("year") ?? new Date().getFullYear());
  const type = c.req.query("type") as ExamType | undefined;

  let exams = getExams(year);
  if (type) {
    exams = exams.filter((e) => e.type === type);
  }

  return c.json({ data: exams, meta: { year, total: exams.length } });
});

// GET /school/is-school-day?date=2026-03-21&state=selangor
schoolRouter.get("/is-school-day", (c) => {
  const date = c.req.query("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: { code: "INVALID_DATE", message: "Date must be YYYY-MM-DD" } }, 400);
  }

  const resolved = resolveGroup(c);
  if (!resolved) {
    return c.json({ error: { code: "INVALID_STATE", message: "Unknown state" } }, 400);
  }

  const year = Number(date.slice(0, 4));
  const holidays = getHolidays(year);
  const schoolTerms = getSchoolTerms(year);
  const schoolHols = getSchoolHolidays(year);

  // Need a state object for weekend check
  const stateObj = resolved.stateCode
    ? states.find((s) => s.code === resolved.stateCode)!
    : states.find((s) => s.group === resolved.group)!;

  const isHoliday = findHolidaysByDate(date, holidays, resolved.stateCode).length > 0;
  const weekend = isWeekend(date, stateObj);
  const schoolDay = checkSchoolDay(date, schoolTerms, schoolHols, resolved.group, isHoliday, weekend, resolved.stateCode);
  const schoolTerm = findSchoolTermByDate(date, schoolTerms, resolved.group);
  const schoolHoliday = findSchoolHolidayByDate(date, schoolHols, resolved.group, resolved.stateCode);

  return c.json({
    data: {
      date,
      dayOfWeek: getDayOfWeekName(date),
      isSchoolDay: schoolDay,
      isPublicHoliday: isHoliday,
      isWeekend: weekend,
      group: resolved.group,
      term: schoolTerm ? { id: schoolTerm.id, term: schoolTerm.term } : null,
      holiday: schoolHoliday ? { id: schoolHoliday.id, name: schoolHoliday.name, type: schoolHoliday.type } : null,
    },
  });
});
