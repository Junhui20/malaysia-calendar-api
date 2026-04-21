---
title: Holidays
description: List, filter, check, and find upcoming holidays. State-aware with cuti ganti support.
---

All holiday endpoints share the same response shape for a single holiday:

```ts
interface Holiday {
  id: string;                    // "2026-hari-raya-aidilfitri-1"
  date: string;                  // ISO "2026-03-21"
  endDate?: string;              // multi-day holidays
  name: {
    ms: string;
    en: string;
    zh?: string;
  };
  type: "federal" | "state" | "islamic" | "islamic_state" | "replacement" | "adhoc";
  status: "confirmed" | "tentative" | "announced" | "cancelled";
  states: string[];              // ["*"] = all, otherwise specific codes
  gazetteLevel: "P" | "N";
  gazetteRef?: string;           // "GN-33499"
  hijriDate?: string;            // "1 Syawal 1447"
  isReplacementFor?: string;     // links to original holiday id
  source: "jpm" | "jakim" | "state-gov" | "community" | "admin";
}
```

---

## GET /holidays

List all holidays matching the filters.

| Query | Type | Default | |
|---|---|---|---|
| `year` | `number` | current year | Four-digit year |
| `state` | `string` | — | Canonical code or alias; if omitted, only `states: ["*"]` entries are returned |
| `month` | `number` | — | `1`–`12` |
| `type` | `string` | — | See [holiday types](/docs/reference/holiday-types/) |
| `status` | `string` | `confirmed` | `confirmed`, `tentative`, `announced`, `cancelled` |

**Example**

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays?year=2026&state=selangor&month=3"
```

---

## GET /holidays/check

Resolve a single date against the calendar. Returns holiday + weekend + working-day + school-day status in one call.

| Query | Type | Required |
|---|---|---|
| `date` | `string` | ✓ ISO `YYYY-MM-DD` |
| `state` | `string` | ✓ |

**Example**

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays/check?date=2026-03-21&state=selangor"
```

Response:

```json
{
  "data": {
    "date": "2026-03-21",
    "dayOfWeek": "Saturday",
    "isHoliday": true,
    "isWeekend": true,
    "isWorkingDay": false,
    "isSchoolDay": false,
    "holidays": [...],
    "school": { "group": "B", "term": {...}, "holiday": null },
    "state": { "code": "selangor", "weekendDays": ["Saturday", "Sunday"], "group": "B" }
  }
}
```

---

## GET /holidays/today

Shortcut for today's status. Equivalent to `/holidays/check?date=today`.

| Query | Type | Required |
|---|---|---|
| `state` | `string` | ✓ |

---

## GET /holidays/next

Return the next N upcoming holidays.

| Query | Type | Default |
|---|---|---|
| `state` | `string` | — |
| `type` | `string` | — |
| `limit` | `number` | `1` |

---

## GET /holidays/between

Return all holidays whose `date` falls in `[start, end]` (inclusive).

| Query | Type | Required |
|---|---|---|
| `start` | `string` | ✓ |
| `end` | `string` | ✓ |
| `state` | `string` | — |

---

## GET /holidays/long-weekends

Return every stretch of 3+ consecutive non-working days in the year.

| Query | Type | Required |
|---|---|---|
| `year` | `number` | — (defaults to current) |
| `state` | `string` | ✓ |

Response item:

```json
{
  "startDate": "2026-03-20",
  "endDate": "2026-03-22",
  "totalDays": 3,
  "holidays": [...],
  "weekendDays": 1,
  "bridgeDaysNeeded": 0
}
```

Try it live: [Long Weekend Planner demo](/demo/long-weekends/).
