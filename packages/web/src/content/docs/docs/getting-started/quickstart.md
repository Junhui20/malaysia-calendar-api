---
title: Quick Start
description: Make your first API call in under 30 seconds.
---

The production base URL is:

```
https://mycal-api.huijun00100101.workers.dev/v1
```

No signup, no API key. Rate-limited to 60 requests per minute per IP.

## Your first call

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
    "holidays": [
      {
        "id": "2026-hari-raya-aidilfitri-1",
        "name": { "ms": "Hari Raya Aidilfitri", "en": "Eid al-Fitr", "zh": "开斋节" },
        "type": "islamic",
        "status": "confirmed",
        "states": ["*"]
      }
    ]
  }
}
```

## Common recipes

### List all holidays for a state in 2026

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays?year=2026&state=selangor"
```

### Today's holiday status

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays/today?state=kl"
```

### Next upcoming holiday

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays/next?state=penang&limit=3"
```

### Count working days

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/business-days?start=2026-03-01&end=2026-03-31&state=selangor"
```

### Find long weekends

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays/long-weekends?year=2026&state=selangor"
```

## State aliases

Use any of these in the `state` query parameter. All case-insensitive:

| Canonical | Aliases |
|-----------|---------|
| `kuala-lumpur` | `kl` |
| `pulau-pinang` | `penang`, `pg` |
| `johor` | `jhr`, `jb` |
| `negeri-sembilan` | `ns`, `n9` |
| `sabah` | `sbh`, `kk` |

See the [full state codes reference](/docs/reference/state-codes/) for all 19.

## Next steps

- Browse the [REST API reference](/docs/rest-api/overview/) for every endpoint
- Install the [TypeScript SDK](/docs/sdk/installation/) for JS/TS projects
- Wire up the [MCP Server](/docs/mcp-server/what-is-mcp/) for AI agents
- Subscribe to an [iCal feed](/docs/ical/google-calendar/) for your calendar app
