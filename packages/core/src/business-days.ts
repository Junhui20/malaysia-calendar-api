import type { Holiday, State, BusinessDaysResult } from "./types.js";
import { addDays, isWeekend, diffDays } from "./weekend.js";
import { findHolidaysByDate } from "./filter.js";

export function countBusinessDays(
  start: string,
  end: string,
  state: State,
  holidays: readonly Holiday[]
): BusinessDaysResult {
  const totalDays = diffDays(start, end) + 1; // inclusive
  let businessDays = 0;
  let weekendCount = 0;
  let holidayCount = 0;
  const holidayList: Holiday[] = [];

  let current = start;
  while (current <= end) {
    const weekend = isWeekend(current, state);
    const dayHolidays = findHolidaysByDate(current, holidays, state.code);
    const isHoliday = dayHolidays.length > 0;

    if (weekend) {
      weekendCount++;
    } else if (isHoliday) {
      holidayCount++;
      for (const h of dayHolidays) {
        if (!holidayList.some((existing) => existing.id === h.id)) {
          holidayList.push(h);
        }
      }
    } else {
      businessDays++;
    }

    current = addDays(current, 1);
  }

  return {
    totalDays,
    businessDays,
    holidays: holidayCount,
    weekendDays: weekendCount,
    holidayList,
  };
}

export function addBusinessDays(
  startDate: string,
  daysToAdd: number,
  state: State,
  holidays: readonly Holiday[]
): string {
  let remaining = daysToAdd;
  let current = startDate;

  while (remaining > 0) {
    current = addDays(current, 1);
    const weekend = isWeekend(current, state);
    const isHoliday = findHolidaysByDate(current, holidays, state.code).length > 0;

    if (!weekend && !isHoliday) {
      remaining--;
    }
  }

  return current;
}
