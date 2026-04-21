---
title: REST API Overview
description: Base URL, authentication, rate limits, response envelope, and the full endpoint index.
---

## Base URL

```
https://mycal-api.huijun00100101.workers.dev/v1
```

All responses are JSON. CORS is open (`Access-Control-Allow-Origin: *`), so you can call the API directly from the browser.

## Authentication

None required. Every public endpoint is readable without an API key.

## Rate limits

100 requests per minute per IP. Exceeding the limit returns HTTP 429 with an envelope:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 12s.",
    "retryAfter": 12
  }
}
```

For heavy read workloads, prefer the iCal feed or mirror the JSON data files from our [GitHub repo](https://github.com/Junhui20/malaysia-calendar-api) into your own storage.

## Response envelope

Every successful response is wrapped in a data envelope:

```json
{ "data": <payload>, "meta": { "..." } }
```

Errors use a matching error envelope:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "suggestions": [] } }
```

See [Errors](/docs/rest-api/errors/) for the full list of error codes.

## Caching

Read endpoints include `Cache-Control` headers tuned by request type:

| Request | TTL | Rationale |
|---------|-----|-----------|
| Current-year holidays | 1 hour | New cuti peristiwa might be announced |
| Past-year holidays | 24 hours | Historical data is stable |
| State list | 24 hours | Rarely changes |
| `/holidays/today` | 15 minutes | Same reason as current year |

## Full endpoint index

| Endpoint | Doc |
|----------|-----|
| `GET /v1/holidays` | [Holidays](/docs/rest-api/holidays/) |
| `GET /v1/holidays/check` | [Holidays](/docs/rest-api/holidays/) |
| `GET /v1/holidays/today` | [Holidays](/docs/rest-api/holidays/) |
| `GET /v1/holidays/next` | [Holidays](/docs/rest-api/holidays/) |
| `GET /v1/holidays/between` | [Holidays](/docs/rest-api/holidays/) |
| `GET /v1/holidays/long-weekends` | [Holidays](/docs/rest-api/holidays/) |
| `GET /v1/business-days` | [Business Days](/docs/rest-api/business-days/) |
| `GET /v1/business-days/add` | [Business Days](/docs/rest-api/business-days/) |
| `GET /v1/states` | [States](/docs/rest-api/states/) |
| `GET /v1/states/resolve` | [States](/docs/rest-api/states/) |
| `GET /v1/school/terms` | [School](/docs/rest-api/school/) |
| `GET /v1/school/holidays` | [School](/docs/rest-api/school/) |
| `GET /v1/school/exams` | [School](/docs/rest-api/school/) |
| `GET /v1/school/is-school-day` | [School](/docs/rest-api/school/) |
| `GET /v1/feed/ical/{state}` | [Feeds](/docs/rest-api/feeds/) |
| `GET /v1/changelog` | Data change log |
