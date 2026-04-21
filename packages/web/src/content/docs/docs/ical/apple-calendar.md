---
title: Apple Calendar
description: Subscribe Apple Calendar on iOS or macOS to a MyCal iCal feed.
---

## macOS

1. Open the **Calendar** app.
2. Menu: **File** → **New Calendar Subscription…** (`⌥⌘S`).
3. Paste the feed URL, e.g.:
   ```
   https://mycal-api.huijun00100101.workers.dev/v1/feed/ical/selangor
   ```
4. Click **Subscribe**.
5. In the next dialog, set **Auto-refresh** to "Every hour" or "Every day". Uncheck "Remove alerts" if you want any alerts the feed provides (MyCal feeds don't carry alerts).
6. Click **OK**.

## iOS / iPadOS

1. Open **Settings** → **Calendar** → **Accounts** → **Add Account**.
2. Choose **Other** → **Add Subscribed Calendar**.
3. Paste the feed URL.
4. Tap **Next**, then **Save**.

Alternatively — quickest — open the `webcal://` URL directly:

```
webcal://mycal-api.huijun00100101.workers.dev/v1/feed/ical/selangor
```

iOS will prompt to subscribe automatically. The [iCal feed generator](/demo/ical/) provides a ready-to-tap webcal link.

## Refresh interval

Apple Calendar respects the `REFRESH-INTERVAL` hint in the feed (6 hours), but lets you override via Auto-refresh. For most people, the default is fine.

## Trilingual display

The event title is the English name. The Malay and Chinese names appear in the event notes. Open a holiday event to see:

```
Eid al-Fitr

Hari Raya Aidilfitri · 开斋节
```
