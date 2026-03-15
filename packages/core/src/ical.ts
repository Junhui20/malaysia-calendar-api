import type { Holiday, SchoolHoliday } from "./types.js";

function escapeIcal(text: string): string {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

function formatIcalDate(date: string): string {
  return date.replace(/-/g, "");
}

function holidayToVevent(h: Holiday): string {
  const dtstart = formatIcalDate(h.date);
  const dtend = h.endDate
    ? formatIcalDate(h.endDate)
    : formatIcalDate(h.date);

  return [
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${escapeIcal(h.name.en)}`,
    `DESCRIPTION:${escapeIcal(h.name.ms)}${h.hijriDate ? ` (${h.hijriDate})` : ""}`,
    `UID:${h.id}@mycal.my`,
    `STATUS:${h.status === "tentative" ? "TENTATIVE" : "CONFIRMED"}`,
    "END:VEVENT",
  ].join("\r\n");
}

function schoolHolidayToVevent(h: SchoolHoliday): string {
  return [
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${formatIcalDate(h.startDate)}`,
    `DTEND;VALUE=DATE:${formatIcalDate(h.endDate)}`,
    `SUMMARY:[School] ${escapeIcal(h.name.en)}`,
    `DESCRIPTION:${escapeIcal(h.name.ms)}`,
    `UID:${h.id}@mycal.my`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ].join("\r\n");
}

export function generateIcal(
  holidays: readonly Holiday[],
  schoolHolidays: readonly SchoolHoliday[],
  calendarName: string
): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyCal//Malaysia Calendar API//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n");

  const events = [
    ...holidays.filter((h) => h.status !== "cancelled").map(holidayToVevent),
    ...schoolHolidays.map(schoolHolidayToVevent),
  ].join("\r\n");

  return `${header}\r\n${events}\r\nEND:VCALENDAR\r\n`;
}
