import type { Holiday, State } from "./types.js";
import { isWeekend, nextWorkingDay } from "./weekend.js";

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

  // 1. Holidays falling on weekends
  for (const holiday of stateHolidays) {
    if (holiday.type === "replacement") continue;

    if (isWeekend(holiday.date, state)) {
      const allOccupied = new Set([...holidayDates, ...replacementDates]);
      const replacementDate = nextWorkingDay(holiday.date, state, allOccupied);

      replacementDates.add(replacementDate);
      replacements.push({
        id: `${holiday.id}-replacement`,
        date: replacementDate,
        name: {
          ms: `Cuti Ganti ${holiday.name.ms}`,
          en: `Replacement for ${holiday.name.en}`,
          zh: holiday.name.zh ? `补假 ${holiday.name.zh}` : undefined,
        },
        type: "replacement",
        status: holiday.status,
        states: [state.code],
        isPublicHoliday: true,
        gazetteLevel: holiday.gazetteLevel,
        isReplacementFor: holiday.id,
        source: holiday.source,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // 2. Overlapping holidays (same date, different holidays)
  const dateGroups = new Map<string, Holiday[]>();
  for (const h of stateHolidays) {
    if (h.type === "replacement") continue;
    const existing = dateGroups.get(h.date) ?? [];
    dateGroups.set(h.date, [...existing, h]);
  }

  for (const [, group] of dateGroups) {
    if (group.length <= 1) continue;

    // Federal (P) takes precedence; state (N) holiday gets replacement
    const stateHoliday = group.find((h) => h.gazetteLevel === "N");
    if (!stateHoliday) continue;

    // Skip if already has a replacement from weekend logic
    if (replacements.some((r) => r.isReplacementFor === stateHoliday.id)) continue;

    const allOccupied = new Set([...holidayDates, ...replacementDates]);
    const replacementDate = nextWorkingDay(stateHoliday.date, state, allOccupied);

    replacementDates.add(replacementDate);
    replacements.push({
      id: `${stateHoliday.id}-overlap-replacement`,
      date: replacementDate,
      name: {
        ms: `Cuti Ganti ${stateHoliday.name.ms}`,
        en: `Replacement for ${stateHoliday.name.en}`,
        zh: stateHoliday.name.zh
          ? `补假 ${stateHoliday.name.zh}`
          : undefined,
      },
      type: "replacement",
      status: stateHoliday.status,
      states: [state.code],
      isPublicHoliday: true,
      gazetteLevel: stateHoliday.gazetteLevel,
      isReplacementFor: stateHoliday.id,
      source: stateHoliday.source,
      createdAt: now,
      updatedAt: now,
    });
  }

  return replacements;
}
