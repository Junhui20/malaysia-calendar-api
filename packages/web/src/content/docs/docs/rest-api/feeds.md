---
title: iCal Feeds
description: Per-state iCal subscription feeds that auto-sync when holiday data updates.
---

MyCal publishes a live `.ics` feed per state. Subscribe once, and your calendar app (Google, Apple, Outlook) automatically picks up new holiday announcements on its next poll.

## GET /feed/ical/{state}

| Path param | Type | Required |
|---|---|---|
| `state` | `string` | ✓ canonical or alias |

| Query | Type | Default |
|---|---|---|
| `year` | `number` | All available years |

**Examples**

```
https://mycal-api.huijun00100101.workers.dev/v1/feed/ical/selangor
https://mycal-api.huijun00100101.workers.dev/v1/feed/ical/kl?year=2026
https://mycal-api.huijun00100101.workers.dev/v1/feed/ical/kelantan
```

## Response format

Standard RFC 5545 iCalendar with trilingual names in `SUMMARY` and `DESCRIPTION`:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyCal//Malaysia Calendar API//EN
X-WR-CALNAME:Selangor Public Holidays
X-WR-TIMEZONE:Asia/Kuala_Lumpur
REFRESH-INTERVAL;VALUE=DURATION:PT6H
X-PUBLISHED-TTL:PT6H
BEGIN:VEVENT
UID:2026-hari-raya-aidilfitri-1@mycal
DTSTART;VALUE=DATE:20260321
DTEND;VALUE=DATE:20260323
SUMMARY:Hari Raya Aidilfitri
DESCRIPTION:Eid al-Fitr · 开斋节
CATEGORIES:Islamic Holiday
STATUS:CONFIRMED
END:VEVENT
...
END:VCALENDAR
```

`X-WR-TIMEZONE` is always Asia/Kuala_Lumpur (UTC+8). Holidays are date-only events (all-day), so timezone doesn't affect display.

`REFRESH-INTERVAL` hints to calendar apps that they can poll every 6 hours. Most modern apps respect this; older Outlook clients poll daily regardless.

## Setup guides

- [Google Calendar](/docs/ical/google-calendar/)
- [Apple Calendar (iOS / macOS)](/docs/ical/apple-calendar/)
- [Outlook](/docs/ical/outlook/)

Or use the [iCal demo](/demo/ical/) to get a ready-to-click subscription link.
