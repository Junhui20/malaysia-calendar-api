import { Hono } from "hono";
import {
  resolveStateCode,
  filterHolidays,
  filterSchoolHolidays,
  generateIcal,
  type Holiday,
} from "@catlabtech/mycal-core";
import { getHolidays, getSchoolHolidays, states } from "../data.js";

export const feedsRouter = new Hono();

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function holidaysToCsv(holidays: readonly Holiday[]): string {
  const header = "date,end_date,name_en,name_ms,type,status,states";
  const rows = holidays.map((h) =>
    [
      h.date,
      h.endDate ?? "",
      csvCell(h.name.en),
      csvCell(h.name.ms),
      h.type,
      h.status,
      csvCell(h.states.join("|")),
    ].join(",")
  );
  return [header, ...rows].join("\r\n") + "\r\n";
}

// GET /feed/ical/:state?year=2026&include=holidays
// Default feed = public holidays + school calendar; `include=holidays` drops school.
feedsRouter.get("/ical/:state", (c) => {
  const stateParam = c.req.param("state");
  const year = Number(c.req.query("year") ?? new Date().getFullYear());
  const includeSchool = c.req.query("include") !== "holidays";

  const state = resolveStateCode(stateParam, states);
  if (!state) {
    return c.json({ error: { code: "INVALID_STATE", message: `Unknown state "${stateParam}"` } }, 400);
  }

  const holidays = filterHolidays(getHolidays(year), { state: state.code });
  const schoolHols = includeSchool
    ? filterSchoolHolidays(getSchoolHolidays(year), state.group, state.code)
    : [];

  const calName = `Malaysia Holidays — ${state.name.en} ${year}`;
  const calDesc = `Public holidays${includeSchool ? " + school calendar" : ""} for ${state.name.en}, ${year} — mycal.my`;
  const ical = generateIcal(holidays, schoolHols, calName, calDesc);

  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="mycal-${state.code}-${year}.ics"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
});

// GET /feed/csv/:state?year=2026 — spreadsheet/HR-friendly export
feedsRouter.get("/csv/:state", (c) => {
  const stateParam = c.req.param("state");
  const year = Number(c.req.query("year") ?? new Date().getFullYear());

  const state = resolveStateCode(stateParam, states);
  if (!state) {
    return c.json({ error: { code: "INVALID_STATE", message: `Unknown state "${stateParam}"` } }, 400);
  }

  const holidays = filterHolidays(getHolidays(year), { state: state.code });
  return new Response(holidaysToCsv(holidays), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mycal-${state.code}-${year}.csv"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
});

// GET /feed/rss
feedsRouter.get("/rss", (c) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Malaysia Calendar API — Updates</title>
    <link>https://api.mycal.my</link>
    <description>Holiday data changes, cuti peristiwa announcements, Islamic date confirmations</description>
    <language>en-my</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
});
