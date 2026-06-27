import type { Holiday, State, LongWeekend, LeaveSuggestion } from "./types.js";
import { addDays, diffDays, isWeekend } from "./weekend.js";
import { groupHolidaysByDate } from "./filter.js";

/**
 * Natural long weekends for a state in a given year: runs of 3+ consecutive
 * non-working days (weekend days and/or public holidays) that need no leave.
 *
 * Shared by the REST `/holidays/long-weekends` route and the MCP server so the
 * two cannot diverge.
 */
export function findLongWeekends(
  year: number,
  state: State,
  holidays: readonly Holiday[]
): LongWeekend[] {
  const holidayMap = groupHolidaysByDate(holidays, state.code);
  const isOff = (d: string) => isWeekend(d, state) || holidayMap.has(d);

  const yearEnd = `${year}-12-31`;
  const result: LongWeekend[] = [];

  let current = `${year}-01-01`;
  while (current <= yearEnd) {
    if (!isOff(current)) {
      current = addDays(current, 1);
      continue;
    }

    const startDate = current;
    const streakHolidays: Holiday[] = [];
    let weekendDays = 0;
    let totalDays = 0;

    while (current <= yearEnd && isOff(current)) {
      if (isWeekend(current, state)) weekendDays++;
      const hs = holidayMap.get(current);
      if (hs) streakHolidays.push(...hs);
      totalDays++;
      current = addDays(current, 1);
    }

    if (totalDays >= 3) {
      result.push({
        startDate,
        endDate: addDays(current, -1),
        totalDays,
        holidays: streakHolidays,
        weekendDays,
        bridgeDaysNeeded: 0, // natural long weekend — no leave required
      });
    }
  }

  return result;
}

/**
 * Leave optimizer: where can you spend up to `maxLeave` working days to chain
 * weekends and public holidays into the longest possible continuous break?
 *
 * Returns suggestions sorted by efficiency (days off gained per leave day spent),
 * then by total length. Each suggestion's `leaveDates` are the exact working days
 * to request off — e.g. "take 2026-09-14 & 2026-09-15 → 2026-09-12…2026-09-16".
 */
export function optimizeLeave(
  year: number,
  state: State,
  holidays: readonly Holiday[],
  maxLeave = 3
): LeaveSuggestion[] {
  if (!Number.isInteger(maxLeave) || maxLeave < 1) return [];

  const holidayMap = groupHolidaysByDate(holidays, state.code);
  const isOff = (d: string) => isWeekend(d, state) || holidayMap.has(d);
  const yearEnd = `${year}-12-31`;

  const suggestions: LeaveSuggestion[] = [];

  let s = `${year}-01-01`;
  while (s <= yearEnd) {
    // A break starts on an off-day whose previous day is a working day.
    if (!isOff(s) || isOff(addDays(s, -1))) {
      s = addDays(s, 1);
      continue;
    }

    let leave = 0;
    let d = s;
    while (d <= yearEnd) {
      if (!isOff(d)) {
        leave++;
        if (leave > maxLeave) break;
      }

      const next = addDays(d, 1);
      // Window [s..d] is a complete break when it ends on an off-day followed by
      // a working day, and at least one leave day was spent inside it.
      if (leave >= 1 && isOff(d) && !isOff(next)) {
        const leaveDates: string[] = [];
        const within: Holiday[] = [];
        let c = s;
        while (c <= d) {
          if (!isOff(c)) leaveDates.push(c);
          const hs = holidayMap.get(c);
          if (hs) within.push(...hs);
          c = addDays(c, 1);
        }
        const totalDays = diffDays(s, d) + 1;
        suggestions.push({
          startDate: s,
          endDate: d,
          totalDays,
          leaveDates,
          leaveCost: leaveDates.length,
          efficiency: Math.round((totalDays / leaveDates.length) * 100) / 100,
          holidays: within,
        });
      }

      d = next;
    }

    s = addDays(s, 1);
  }

  suggestions.sort(
    (a, b) =>
      b.efficiency - a.efficiency ||
      b.totalDays - a.totalDays ||
      a.startDate.localeCompare(b.startDate)
  );

  // Collapse duplicate windows (the same break can be reached from one start).
  const seen = new Set<string>();
  return suggestions.filter((x) => {
    const key = `${x.startDate}:${x.endDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
