---
title: Google Calendar
description: Subscribe Google Calendar to a per-state MyCal feed. Auto-syncs forever.
---

## Fastest path (recommended)

Use the [iCal feed generator](/demo/ical/) — pick your state, hit "Add to Google Calendar", done.

## Manual setup

1. Open [Google Calendar](https://calendar.google.com) on desktop.
2. In the left sidebar, click **+** next to "Other calendars".
3. Choose **From URL**.
4. Paste your feed URL. For Selangor:
   ```
   https://mycal-api.huijun00100101.workers.dev/v1/feed/ical/selangor
   ```
5. Click **Add calendar**. The new calendar appears under "Other calendars" as "Selangor Public Holidays".

## What happens

- Google Calendar polls the feed roughly every 12–24 hours (Google controls the interval; there's no way to force faster).
- Holidays show up as all-day events.
- Trilingual names appear in the event description.

## Subscribe to just one year

Append `?year=2026` to limit the feed:

```
https://mycal-api.huijun00100101.workers.dev/v1/feed/ical/selangor?year=2026
```

## Remove the calendar

Click the ⋮ menu next to the calendar name → "Unsubscribe". This removes it for the current Google account only.

## Why it's not instant for new cuti peristiwa

Google's poll interval is long (12–24h). If you need faster updates — for example on the eve of a cuti peristiwa announcement — hit the `/holidays` REST endpoint directly, or use the `malaysia_holiday_changes` MCP tool from an AI assistant.
