---
title: Changelog
description: Version history and data changes for MyCal.
---

For programmatic access to data changes, hit `GET /v1/changelog`. This page is a human-friendly summary of releases and schema changes.

## v0.1.0 — Initial release

- REST API with 14 endpoints
- TypeScript SDK (`@catlabtech/mycal-sdk`)
- MCP Server (`@catlabtech/mycal-mcp-server`) with 12 tools
- iCal subscription feeds per state
- Landing page, interactive demo, and developer docs site
- Data: 2024, 2025, 2026 public holidays; 2026 school calendar

## Data update policy

**Holiday data** is considered authoritative from the JPM gazette. When a new annual gazette is published (typically Aug–Oct of the preceding year):

1. Gazette PDF parsed into `data/holidays/<year>.json`
2. Zod schema + cross-source validation run
3. PR opened, reviewed, merged to main
4. CF Workers + KV redeployed automatically

**Cuti peristiwa** (ad-hoc holidays):

1. Announcement captured from official channels
2. Record added with `status: "announced"`
3. Upgraded to `"confirmed"` once gazette PDF appears
4. iCal feeds reflect the update within 6 hours

**Islamic holidays:**

- Published with `status: "tentative"` at the start of each year from JAKIM Takwim.
- Manually flipped to `"confirmed"` 1–2 days before each holiday once JAKIM announces rukyah results.

## Schema versioning

API responses are under `/v1/`. Breaking changes will go to `/v2/`. Additive changes (new fields, new endpoints) happen under `/v1/` without notice.

Current stable fields on `Holiday`:

```
id, date, endDate, name{ms,en,zh}, type, status,
states, isPublicHoliday, gazetteLevel, gazetteRef,
hijriDate, isReplacementFor, source, createdAt, updatedAt
```

## Recent data events

See `GET /v1/changelog` for the live list. Sample entries:

```json
[
  {
    "timestamp": "2025-12-15T02:30:00Z",
    "event": "holiday-added",
    "holidayId": "2026-nuzul-al-quran",
    "description": "Added state Nuzul Al-Quran for Selangor"
  },
  {
    "timestamp": "2025-12-01T00:00:00Z",
    "event": "data-ingested",
    "description": "Ingested JPM gazette GN-33499 for calendar year 2026"
  }
]
```
