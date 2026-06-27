import type { Holiday, State, BusinessDaysResult } from "./types.js";
import { addDays, isWeekend } from "./weekend.js";
import { groupHolidaysByDate } from "./filter.js";

// Hard backstop so a malformed or malicious caller cannot spin an unbounded
// loop. The HTTP layer validates and clamps inputs before reaching here; this
// also protects direct consumers of the library.
const MAX_SPAN_DAYS = 366 * 100; // ~100 years

export function countBusinessDays(
  start: string,
  end: string,
  state: State,
  holidays: readonly Holiday[]
): BusinessDaysResult {
  if (start > end) {
    throw new RangeError(`start (${start}) must be on or before end (${end})`);
  }

  // Index holidays by date once — O(D + H) instead of an O(H) scan per day.
  const holidayMap = groupHolidaysByDate(holidays, state.code);

  let businessDays = 0;
  let weekendCount = 0;
  let holidayCount = 0;
  let totalDays = 0;
  const holidayList: Holiday[] = [];
  const seenIds = new Set<string>();

  let current = start;
  while (current <= end) {
    if (++totalDays > MAX_SPAN_DAYS) {
      throw new RangeError(
        `date range exceeds the maximum span of ${MAX_SPAN_DAYS} days`
      );
    }

    const weekend = isWeekend(current, state);
    const dayHolidays = holidayMap.get(current);

    if (weekend) {
      weekendCount++;
    } else if (dayHolidays) {
      holidayCount++;
      for (const h of dayHolidays) {
        if (!seenIds.has(h.id)) {
          seenIds.add(h.id);
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

function assertValidStep(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${label} must be an integer (received ${value})`);
  }
  if (value < 0) {
    throw new RangeError(`${label} must be non-negative (received ${value})`);
  }
  if (value > MAX_SPAN_DAYS) {
    throw new RangeError(`${label} exceeds the maximum of ${MAX_SPAN_DAYS}`);
  }
}

export function addBusinessDays(
  startDate: string,
  daysToAdd: number,
  state: State,
  holidays: readonly Holiday[]
): string {
  assertValidStep(daysToAdd, "daysToAdd");
  const holidayMap = groupHolidaysByDate(holidays, state.code);

  let remaining = daysToAdd;
  let current = startDate;
  let guard = 0;
  while (remaining > 0) {
    if (++guard > MAX_SPAN_DAYS * 2) {
      throw new RangeError("addBusinessDays exceeded its iteration limit");
    }
    current = addDays(current, 1);
    if (!isWeekend(current, state) && !holidayMap.has(current)) {
      remaining--;
    }
  }
  return current;
}

export function subtractBusinessDays(
  startDate: string,
  daysToSubtract: number,
  state: State,
  holidays: readonly Holiday[]
): string {
  assertValidStep(daysToSubtract, "daysToSubtract");
  const holidayMap = groupHolidaysByDate(holidays, state.code);

  let remaining = daysToSubtract;
  let current = startDate;
  let guard = 0;
  while (remaining > 0) {
    if (++guard > MAX_SPAN_DAYS * 2) {
      throw new RangeError("subtractBusinessDays exceeded its iteration limit");
    }
    current = addDays(current, -1);
    if (!isWeekend(current, state) && !holidayMap.has(current)) {
      remaining--;
    }
  }
  return current;
}

export function isBusinessDay(
  date: string,
  state: State,
  holidays: readonly Holiday[]
): boolean {
  if (isWeekend(date, state)) return false;
  return !groupHolidaysByDate(holidays, state.code).has(date);
}

export function nextBusinessDay(
  date: string,
  state: State,
  holidays: readonly Holiday[]
): string {
  return addBusinessDays(date, 1, state, holidays);
}

export function previousBusinessDay(
  date: string,
  state: State,
  holidays: readonly Holiday[]
): string {
  return subtractBusinessDays(date, 1, state, holidays);
}
