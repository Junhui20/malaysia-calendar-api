---
title: Outlook
description: Add a MyCal iCal feed to Outlook (desktop or web).
---

## Outlook Web / Microsoft 365

1. Open [outlook.office.com/calendar](https://outlook.office.com/calendar/).
2. Left sidebar: **Add calendar** → **Subscribe from web**.
3. Paste the feed URL:
   ```
   https://mycal-api.huijun00100101.workers.dev/v1/feed/ical/selangor
   ```
4. Give it a name ("Malaysia Holidays - Selangor") and pick a color.
5. Click **Import**.

## Outlook for Desktop (Windows / Mac)

Outlook desktop reads from the same Microsoft account. If you subscribed on outlook.com (above), it'll sync down automatically. To add it directly in desktop:

1. **Add Calendar** → **From Internet**.
2. Paste the feed URL.
3. Click **OK**.

## Refresh behavior

Outlook's refresh interval on subscribed web calendars is longer than Apple or Google — typically once a day. For time-critical holiday updates, hit the [REST API](/docs/rest-api/holidays/) directly.

## Known quirks

- Outlook strips some `X-` properties, so the `X-WR-CALNAME` we set (e.g. "Selangor Public Holidays") may be ignored in favor of whatever name you typed at subscribe time.
- Event descriptions appear as the full trilingual string.
