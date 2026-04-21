---
title: Errors
description: Error envelope, error codes, and retry guidance.
---

Every error response follows the same envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description.",
    "suggestions": ["optional", "hints"]
  }
}
```

HTTP status codes follow REST conventions: `4xx` for client errors, `5xx` for server errors.

## Error codes

| HTTP | Code | When | Retry? |
|------|------|------|--------|
| 400 | `VALIDATION_ERROR` | Invalid query parameter (malformed date, bad enum, etc.) | No — fix the request |
| 404 | `STATE_NOT_FOUND` | Unknown state code / alias | No — use `suggestions` |
| 404 | `NOT_FOUND` | Unknown route | No |
| 404 | `HOLIDAY_NOT_FOUND` | Specific ID lookup missed | No |
| 429 | `RATE_LIMITED` | Exceeded 60 req/min | Yes, after `retryAfter` seconds |
| 500 | `INTERNAL_ERROR` | Server bug | Yes, with backoff |
| 503 | `SERVICE_UNAVAILABLE` | Data layer offline | Yes, with backoff |

## Examples

### Validation

```bash
curl "…/v1/holidays/check?date=NOT-A-DATE&state=selangor"
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format. Expected YYYY-MM-DD.",
    "suggestions": ["2026-03-21"]
  }
}
```

### State resolution

```bash
curl "…/v1/states/resolve?q=panang"
```

```json
{
  "error": {
    "code": "STATE_NOT_FOUND",
    "message": "No state matches 'panang'.",
    "suggestions": ["pulau-pinang", "pahang"]
  }
}
```

### Rate limiting

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 12s.",
    "retryAfter": 12
  }
}
```

The response also carries a `Retry-After: 12` header.

## SDK error handling

The TypeScript SDK returns a `Result` envelope instead of throwing, so you handle errors with a simple `if` check. See [SDK Client Usage](/docs/sdk/client/).
