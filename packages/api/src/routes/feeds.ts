import { Hono } from "hono";
import { resolveStateCode, filterHolidays, generateIcal } from "@catlabtech/mycal-core";
import { getHolidays, getSchoolHolidays, states } from "../data.js";

export const feedsRouter = new Hono();

// GET /feed/ical/:state?year=2026
feedsRouter.get("/ical/:state", (c) => {
  const stateParam = c.req.param("state");
  const year = Number(c.req.query("year") ?? new Date().getFullYear());

  const state = resolveStateCode(stateParam, states);
  if (!state) {
    return c.json({ error: { code: "INVALID_STATE", message: `Unknown state "${stateParam}"` } }, 400);
  }

  const holidays = filterHolidays(getHolidays(year), { state: state.code });
  const schoolHols = getSchoolHolidays(year).filter((h) => {
    if (h.group !== state.group) return false;
    if (h.excludeStates?.includes(state.code)) return false;
    if (h.states && !h.states.includes(state.code)) return false;
    return true;
  });

  const calName = `Malaysia Holidays — ${state.name.en} ${year}`;
  const ical = generateIcal(holidays, schoolHols, calName);

  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="mycal-${state.code}-${year}.ics"`,
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
