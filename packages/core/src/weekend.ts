import type { State, WeekendConfig } from "./types.js";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// `weekendHistory` MUST be ordered newest-first: this returns the first config
// whose [from, to] range covers `date`, and the fallback below returns entry [0]
// (the most recent) when no range matches. The schema enforces a non-empty array.
export function getWeekendConfig(
  state: State,
  date: string
): WeekendConfig {
  for (const config of state.weekendHistory) {
    const from = config.from;
    const to = config.to;

    if (date >= from && (to === null || date <= to)) {
      return config;
    }
  }

  // Fallback: use first (most recent) config
  return state.weekendHistory[0];
}

export function isWeekend(date: string, state: State): boolean {
  const config = getWeekendConfig(state, date);
  const dayOfWeek = new Date(date + "T12:00:00Z").getUTCDay();
  return config.weekendDays.includes(dayOfWeek);
}

export function getDayOfWeekName(date: string): string {
  const dayIndex = new Date(date + "T12:00:00Z").getUTCDay();
  return DAY_NAMES[dayIndex];
}

export function getWeekendDayNames(state: State, date: string): readonly string[] {
  const config = getWeekendConfig(state, date);
  return config.weekendDays.map((d) => DAY_NAMES[d]);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nextWorkingDay(
  date: string,
  state: State,
  holidayDates: ReadonlySet<string>
): string {
  let candidate = addDays(date, 1);

  while (isWeekend(candidate, state) || holidayDates.has(candidate)) {
    candidate = addDays(candidate, 1);
  }

  return candidate;
}

export function diffDays(start: string, end: string): number {
  // Anchor at noon UTC (like every other date helper here) so whole-day
  // arithmetic is immune to the runtime timezone and DST. Parsing as
  // "YYYY-MM-DDT00:00:00" without a zone would use local time and could be
  // off by a day for contributors running outside UTC.
  const s = new Date(start + "T12:00:00Z").getTime();
  const e = new Date(end + "T12:00:00Z").getTime();
  return Math.round((e - s) / 86_400_000);
}
