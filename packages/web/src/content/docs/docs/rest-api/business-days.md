---
title: Business Days
description: Count working days in a range, or add N business days to a date. State-aware.
---

Two endpoints, two modes: count or add. Both respect the state's weekend configuration and public holidays.

## GET /business-days

Count business days in a range.

| Query | Type | Required |
|---|---|---|
| `start` | `string` | ✓ ISO date |
| `end` | `string` | ✓ ISO date |
| `state` | `string` | ✓ |

**Example**

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/business-days?start=2026-03-01&end=2026-03-31&state=selangor"
```

Response:

```json
{
  "data": {
    "totalDays": 31,
    "businessDays": 20,
    "holidays": 2,
    "weekendDays": 9,
    "holidayList": [...]
  }
}
```

Note: `totalDays = businessDays + holidays + weekendDays`. A holiday on a weekend counts only as a holiday, not double-counted.

---

## GET /business-days/add

Add N business days to a start date. Negative N subtracts.

| Query | Type | Required |
|---|---|---|
| `date` | `string` | ✓ |
| `days` | `number` | ✓ `-365` to `365` |
| `state` | `string` | ✓ |

**Example**

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/business-days/add?date=2026-03-01&days=10&state=selangor"
```

Response:

```json
{
  "data": {
    "startDate": "2026-03-01",
    "businessDays": 10,
    "resultDate": "2026-03-16"
  }
}
```

## Use cases

- **SLA & delivery dates** — "guaranteed within 5 business days" computed correctly in Kedah (Fri–Sat weekends).
- **Invoicing** — invoice issued on March 1, due in 30 business days.
- **HR leave** — annual leave allocations computed over working days.
- **Finance** — T+3 settlement calculations that skip state-specific holidays.

Try it live: [Business Day Calculator demo](/demo/business-days/).
