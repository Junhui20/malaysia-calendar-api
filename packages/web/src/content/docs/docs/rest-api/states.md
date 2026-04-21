---
title: States
description: List all 16 states with weekend config and group, or resolve any alias to a canonical code.
---

## GET /states

Return every state and federal territory, with aliases, weekend history, and current group.

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/states"
```

Response item:

```ts
{
  code: "johor",
  aliases: ["jhr", "JHR", "jb", "JB", "johor-bahru"],
  name: { ms: "Johor", en: "Johor" },
  type: "state",
  group: "B",
  weekendHistory: [
    { from: "2025-01-01", to: null, weekendDays: [0, 6], group: "B" },
    { from: "2014-01-01", to: "2024-12-31", weekendDays: [5, 6], group: "A" },
    { from: "1900-01-01", to: "2013-12-31", weekendDays: [0, 6], group: "B" }
  ]
}
```

`weekendDays` follows the convention `0=Sunday, 6=Saturday`.

---

## GET /states/resolve

Resolve any alias (case-insensitive) to the canonical state record.

| Query | Type | Required |
|---|---|---|
| `q` | `string` | ✓ |

**Example**

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/states/resolve?q=KL"
```

Response:

```json
{
  "data": {
    "canonical": "kuala-lumpur",
    "name": { "ms": "Wilayah Persekutuan Kuala Lumpur", "en": "Kuala Lumpur" },
    "type": "federal_territory",
    "group": "B"
  }
}
```

If `q` doesn't match any state or alias, returns `404` with a `STATE_NOT_FOUND` error and a `suggestions` array of likely candidates.

See the [complete state codes reference](/docs/reference/state-codes/).
