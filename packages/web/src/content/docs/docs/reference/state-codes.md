---
title: State Codes Reference
description: All 16 states + 3 Federal Territories with canonical codes, aliases, weekend config, and group.
---

Every state and federal territory. The API accepts any alias (case-insensitive) in the `state` query parameter.

| Canonical | Type | Aliases | Group | Weekend |
|-----------|------|---------|-------|---------|
| `johor` | state | `jhr`, `jb`, `johor-bahru` | B | Sat-Sun (was Fri-Sat 2014-2024) |
| `kedah` | state | `kd`, `kdh`, `alor-setar` | A | Fri-Sat |
| `kelantan` | state | `kel`, `kb`, `kota-bharu` | A | Fri-Sat |
| `terengganu` | state | `trg`, `kt`, `kuala-terengganu` | A | Fri-Sat |
| `perak` | state | `prk`, `ipoh` | B | Sat-Sun |
| `pulau-pinang` | state | `penang`, `pg`, `pp` | B | Sat-Sun |
| `selangor` | state | `sel`, `sgr`, `shah-alam` | B | Sat-Sun |
| `negeri-sembilan` | state | `ns`, `n9`, `seremban` | B | Sat-Sun |
| `melaka` | state | `mlk`, `malacca` | B | Sat-Sun |
| `pahang` | state | `phg`, `kuantan` | B | Sat-Sun |
| `perlis` | state | `pls`, `kangar` | B | Sat-Sun |
| `sabah` | state | `sbh`, `kk`, `kota-kinabalu` | B | Sat-Sun |
| `sarawak` | state | `swk`, `kuching` | B | Sat-Sun |
| `kuala-lumpur` | federal_territory | `kl`, `wilayah-persekutuan` | B | Sat-Sun |
| `wp-putrajaya` | federal_territory | `putrajaya`, `pjy` | B | Sat-Sun |
| `wp-labuan` | federal_territory | `labuan`, `lbn` | B | Sat-Sun |

## Johor weekend history

Johor is unique — it switched twice:

| Period | Weekend | Group |
|--------|---------|-------|
| 1900 – 2013 | Sat–Sun | B |
| 2014 – 2024 | Fri–Sat | A |
| 2025 – present | Sat–Sun | B |

When you call a business-day endpoint for Johor with a date in 2020, the API uses the Fri–Sat rule for that era. For 2026 it uses Sat–Sun.

## Programmatic lookup

```bash
curl "https://mycal-api.huijun00100101.workers.dev/v1/states"
curl "https://mycal-api.huijun00100101.workers.dev/v1/states/resolve?q=kl"
```

See [REST API → States](/docs/rest-api/states/) for response shape.
