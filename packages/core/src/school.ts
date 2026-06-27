import type { SchoolTerm, SchoolHoliday, StateGroup } from "./types.js";

export function findSchoolTermByDate(
  date: string,
  terms: readonly SchoolTerm[],
  group: StateGroup
): SchoolTerm | null {
  return (
    terms.find(
      (t) => t.group === group && date >= t.startDate && date <= t.endDate
    ) ?? null
  );
}

export function findSchoolHolidayByDate(
  date: string,
  holidays: readonly SchoolHoliday[],
  group: StateGroup,
  stateCode?: string
): SchoolHoliday | null {
  return (
    holidays.find((h) => {
      if (h.group !== group) return false;
      if (date < h.startDate || date > h.endDate) return false;

      // Check state-level exceptions
      if (stateCode && h.excludeStates?.includes(stateCode)) return false;
      if (h.states && !h.states.includes(stateCode ?? "")) return false;

      return true;
    }) ?? null
  );
}

/**
 * List the school holidays that apply to a group (and optionally a specific
 * state, honouring `states`/`excludeStates` overrides). Shared by the REST
 * `/school/holidays` and iCal feed routes so the filter logic lives in one place.
 */
export function filterSchoolHolidays(
  holidays: readonly SchoolHoliday[],
  group: StateGroup,
  stateCode?: string
): readonly SchoolHoliday[] {
  return holidays.filter((h) => {
    if (h.group !== group) return false;
    if (stateCode && h.excludeStates?.includes(stateCode)) return false;
    if (h.states && stateCode && !h.states.includes(stateCode)) return false;
    return true;
  });
}

export function isSchoolDay(
  date: string,
  terms: readonly SchoolTerm[],
  schoolHolidays: readonly SchoolHoliday[],
  group: StateGroup,
  isPublicHoliday: boolean,
  isWeekendDay: boolean,
  stateCode?: string
): boolean {
  if (isWeekendDay) return false;
  if (isPublicHoliday) return false;

  const schoolHoliday = findSchoolHolidayByDate(
    date,
    schoolHolidays,
    group,
    stateCode
  );
  if (schoolHoliday) return false;

  const term = findSchoolTermByDate(date, terms, group);
  return term !== null;
}
