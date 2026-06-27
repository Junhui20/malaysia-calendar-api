import type { Holiday, HolidayType, HolidayStatus } from "./types.js";

export interface HolidayFilter {
  readonly year?: number;
  readonly month?: number;
  readonly state?: string;
  readonly type?: HolidayType;
  readonly status?: HolidayStatus;
}

export function filterHolidays(
  holidays: readonly Holiday[],
  filter: HolidayFilter
): readonly Holiday[] {
  return holidays.filter((h) => {
    if (filter.year !== undefined) {
      const year = parseInt(h.date.slice(0, 4), 10);
      if (year !== filter.year) return false;
    }

    if (filter.month !== undefined) {
      const month = parseInt(h.date.slice(5, 7), 10);
      if (month !== filter.month) return false;
    }

    if (filter.state !== undefined) {
      if (!h.states.includes("*") && !h.states.includes(filter.state)) {
        return false;
      }
    }

    if (filter.type !== undefined && h.type !== filter.type) return false;
    if (filter.status !== undefined && h.status !== filter.status) return false;

    return true;
  });
}

export function findHolidaysByDate(
  date: string,
  holidays: readonly Holiday[],
  stateCode?: string
): readonly Holiday[] {
  return holidays.filter((h) => {
    if (h.date !== date) return false;
    if (h.status === "cancelled") return false;
    if (stateCode && !h.states.includes("*") && !h.states.includes(stateCode)) {
      return false;
    }
    return true;
  });
}

/**
 * Index holidays by their ISO date for O(1) date lookups, skipping cancelled
 * holidays and (when `stateCode` is given) holidays that do not apply to that
 * state. Shared by the business-day and long-weekend scanners so they don't each
 * re-filter the array on every day.
 */
export function groupHolidaysByDate(
  holidays: readonly Holiday[],
  stateCode?: string
): Map<string, Holiday[]> {
  const map = new Map<string, Holiday[]>();
  for (const h of holidays) {
    if (h.status === "cancelled") continue;
    if (stateCode && !h.states.includes("*") && !h.states.includes(stateCode)) {
      continue;
    }
    const list = map.get(h.date);
    if (list) list.push(h);
    else map.set(h.date, [h]);
  }
  return map;
}

export function findNextHoliday(
  afterDate: string,
  holidays: readonly Holiday[],
  stateCode?: string,
  type?: HolidayType,
  limit: number = 1
): readonly Holiday[] {
  const filtered = holidays
    .filter((h) => {
      if (h.date <= afterDate) return false;
      if (h.status === "cancelled") return false;
      if (stateCode && !h.states.includes("*") && !h.states.includes(stateCode)) {
        return false;
      }
      if (type !== undefined && h.type !== type) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return filtered.slice(0, limit);
}
