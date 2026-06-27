import type { Holiday, State } from "./types.js";
import { isWeekend, nextWorkingDay } from "./weekend.js";

/**
 * Build the synthetic "Cuti Ganti" (replacement) holiday for a `source` holiday
 * that has been rolled forward to `replacementDate`. Centralised so the
 * weekend-clash and same-day-overlap paths cannot drift apart.
 */
function makeReplacement(
  source: Holiday,
  replacementDate: string,
  stateCode: string,
  idSuffix: string,
  now: string
): Holiday {
  return {
    id: `${source.id}-${idSuffix}`,
    date: replacementDate,
    name: {
      ms: `Cuti Ganti ${source.name.ms}`,
      en: `Replacement for ${source.name.en}`,
      zh: source.name.zh ? `补假 ${source.name.zh}` : undefined,
    },
    type: "replacement",
    status: source.status,
    states: [stateCode],
    isPublicHoliday: true,
    gazetteLevel: source.gazetteLevel,
    isReplacementFor: source.id,
    source: source.source,
    createdAt: now,
    updatedAt: now,
  };
}

export function calculateReplacementHolidays(
  holidays: readonly Holiday[],
  state: State
): readonly Holiday[] {
  const stateHolidays = holidays.filter(
    (h) =>
      h.status !== "cancelled" &&
      (h.states.includes("*") || h.states.includes(state.code))
  );

  const holidayDates = new Set(stateHolidays.map((h) => h.date));
  const replacementDates = new Set<string>();
  const replacements: Holiday[] = [];
  const now = new Date().toISOString();

  // 1. Holidays that fall on a weekend roll forward to the next working day.
  for (const holiday of stateHolidays) {
    if (holiday.type === "replacement") continue;
    if (!isWeekend(holiday.date, state)) continue;

    const occupied = new Set([...holidayDates, ...replacementDates]);
    const replacementDate = nextWorkingDay(holiday.date, state, occupied);
    replacementDates.add(replacementDate);
    replacements.push(
      makeReplacement(holiday, replacementDate, state.code, "replacement", now)
    );
  }

  // 2. Two holidays on the same date: the federal (gazette "P") holiday takes the
  //    day, so the state-level (gazette "N") holiday is the one rolled forward.
  const dateGroups = new Map<string, Holiday[]>();
  for (const h of stateHolidays) {
    if (h.type === "replacement") continue;
    const existing = dateGroups.get(h.date) ?? [];
    dateGroups.set(h.date, [...existing, h]);
  }

  for (const [, group] of dateGroups) {
    if (group.length <= 1) continue;

    const stateHoliday = group.find((h) => h.gazetteLevel === "N");
    if (!stateHoliday) continue;

    // Skip if the weekend pass already produced a replacement for it.
    if (replacements.some((r) => r.isReplacementFor === stateHoliday.id)) continue;

    const occupied = new Set([...holidayDates, ...replacementDates]);
    const replacementDate = nextWorkingDay(stateHoliday.date, state, occupied);
    replacementDates.add(replacementDate);
    replacements.push(
      makeReplacement(
        stateHoliday,
        replacementDate,
        state.code,
        "overlap-replacement",
        now
      )
    );
  }

  return replacements;
}
