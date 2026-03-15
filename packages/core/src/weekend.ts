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
  const s = new Date(start + "T00:00:00").getTime();
  const e = new Date(end + "T00:00:00").getTime();
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}
