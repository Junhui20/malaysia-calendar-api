import type { Holiday, SchoolHoliday } from "./types.js";

function escapeIcal(text: string): string {
  // RFC 5545 §3.3.11: escape backslash, semicolon and comma, then fold every
  // newline form (CRLF, lone CR, lone LF) to the literal "\n" sequence so a
  // stray carriage return cannot break the ICS line structure.
  return text
    .replace(/[\\;,]/g, (c) => `\\${c}`)
    .replace(/\r\n|\r|\n/g, "\\n");
}

function formatIcalDate(date: string): string {
  return date.replace(/-/g, "");
}

// Machine-readable CATEGORIES (RFC 5545 §3.8.1.2) — the main thing Google's bare
// Malaysia calendar lacks, where holiday type/scope is buried in free-text.
function holidayCategories(h: Holiday): string {
  const cats = ["Public Holiday"];
  switch (h.type) {
    case "federal":
      cats.push("Federal");
      break;
    case "state":
      cats.push("State");
      break;
    case "islamic":
    case "islamic_state":
      cats.push("Religious", "Islamic");
      break;
    case "replacement":
      cats.push("Replacement");
      break;
    case "adhoc":
      cats.push("Ad-hoc");
      break;
  }
  if (h.status === "tentative") cats.push("Tentative");
  return cats.map(escapeIcal).join(",");
}

function holidayToVevent(h: Holiday): string {
  const dtstart = formatIcalDate(h.date);
  const dtend = h.endDate ? formatIcalDate(h.endDate) : formatIcalDate(h.date);

  return [
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${escapeIcal(h.name.en)}`,
    `DESCRIPTION:${escapeIcal(h.name.ms)}${h.hijriDate ? ` (${h.hijriDate})` : ""}`,
    `CATEGORIES:${holidayCategories(h)}`,
    `UID:${h.id}@mycal.my`,
    "TRANSP:TRANSPARENT",
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
    "CATEGORIES:School Holiday",
    `UID:${h.id}@mycal.my`,
    "TRANSP:TRANSPARENT",
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ].join("\r\n");
}

export function generateIcal(
  holidays: readonly Holiday[],
  schoolHolidays: readonly SchoolHoliday[],
  calendarName: string,
  calendarDescription = "Malaysian public holidays and school calendar — mycal.my"
): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyCal//Malaysia Calendar API//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    `NAME:${escapeIcal(calendarName)}`, // RFC 7986
    `X-WR-CALDESC:${escapeIcal(calendarDescription)}`,
    `DESCRIPTION:${escapeIcal(calendarDescription)}`, // RFC 7986
    "X-WR-TIMEZONE:Asia/Kuala_Lumpur",
    "COLOR:forestgreen", // RFC 7986 (CSS3 colour name)
    "X-APPLE-CALENDAR-COLOR:#22C55E",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ].join("\r\n");

  const events = [
    ...holidays.filter((h) => h.status !== "cancelled").map(holidayToVevent),
    ...schoolHolidays.map(schoolHolidayToVevent),
  ].join("\r\n");

  return `${header}\r\n${events}\r\nEND:VCALENDAR\r\n`;
}
