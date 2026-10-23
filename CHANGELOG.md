# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.7] - 2026-10-23

### Fixed

- **Cuti ganti rule** (`calculateReplacementHolidays`, core 0.1.4) — a holiday is replaced only
  when it falls on the state's replaced weekday, not on any weekend day: Sunday in
  Saturday–Sunday states, Friday in Kedah (and Johor 2014–2024), Saturday in Kelantan and
  Terengganu. Previously a Saturday holiday in e.g. Selangor produced a phantom Monday off
  (CNY 2024 yielded 12 *and* 13 Feb). Two holidays on the same replaced day now share one
  replacement day, ad hoc holidays never roll forward, and a same-day clash on a weekend no
  longer rolls the state holiday forward.
- **Data: 2024–2027 reconciled against the official BKPP gazettes** (HKA PDFs on
  kabinet.gov.my), every row and state column:
  - 2027: the June preliminary file is now gazette-verified (Isra' Mi'raj and Thaipusam
    states, Melaka's 20 Feb holiday name, Hari Raya Puasa 3rd day for Melaka, Hol Sultan
    Iskandar 11 Jul); `isEstimated` dropped.
  - 2024: Deepavali 31 Oct (was 1 Nov), Maulidur Rasul 16 Sep (was 27 Sep), Awal Muharam
    7 Jul, Hol Sultan Iskandar 11 Aug; added 8 missing state holidays (Melaka 20 Feb,
    Arafah, Sultan of Kedah, the Penang/Melaka/Sabah/Sarawak governors' birthdays).
  - 2025: Awal Ramadan 2 Mar, Nuzul Al-Quran 18 Mar, Hol Sultan Iskandar 31 Jul; added
    8 missing holidays (incl. Hari Raya Puasa 3rd day for Melaka, Sultan of Perak).
  - 2024–2026: state lists fixed for state-only holidays previously marked nationwide
    (Thaipusam, Isra' Mi'raj, Nuzul Al-Quran, Hari Raya Qurban 2nd day), Deepavali excludes
    Sarawak, New Year excludes Perlis, World Heritage Day is Penang (not Melaka), 2026 Hari
    Raya Puasa 3rd day is Melaka only.

### Added

- `replacedWeekday` on each `states.json` weekend config, and `getReplacedWeekday()` (core).

## [0.1.6] - 2026-07-06

### Fixed

- Republished `@catlabtech/mycal-mcp-server`: the npm 0.1.5 artifact was accidentally
  packed from a stale June-28 `dist/` (a failed `turbo build` didn't stop the publish),
  so it shipped without the 0.1.5 cross-year fixes and data corrections. 0.1.5 is
  deprecated on npm; 0.1.6 is the real build.

## [0.1.5] - 2026-07-06

### Fixed

- **Cross-year holiday lookups** — `next_malaysia_holiday`, `malaysia_business_days`,
  `malaysia_long_weekends`, and `malaysia_leave_optimizer` (MCP), plus
  `GET /v1/holidays/next`, `/v1/holidays/between`, `/v1/holidays/long-weekends`, and
  `/v1/holidays/leave-optimizer` (API), now draw from all bundled years (2024–2027)
  instead of a single year, so queries near a year boundary no longer silently miss
  holidays.
- `findLongWeekends` (core) scans past the Dec 31 boundary so a long weekend straddling
  the new year is reported in full (attributed to the year it starts in, never
  double-counted).
- **Data:** added the missing additional federal public holiday for Hari Raya Aidilfitri
  on Friday 2026-03-20; flipped nine past 2026 Islamic holidays from `tentative` to
  `confirmed` after verifying each against the actual JAKIM/observed dates; extended
  `data/islamic-dates.json` with unconfirmed 2027 estimates.
- Admin mutation endpoints (`POST/PATCH/DELETE /v1/admin/holidays`) now return
  `501 Not Implemented` instead of fake success while KV persistence is unimplemented.
- API and MCP server report their real package versions instead of a hardcoded `0.1.1`.

### Changed

- School-calendar endpoints and MCP tools return an explicit
  `dataAvailable: false` + message for years without school data (currently only 2026
  ships) instead of silently empty results.
- Docs re-synced: CHANGELOG 0.1.4 feature set, README (13 MCP tools, full API reference),
  `openapi.yaml` (leave-optimizer, CSV feed, open-data, prayer-times, keys, webhooks
  paths), and `docs-internal/MCP-REGISTRY.md` (namespace resolution recorded).

## [0.1.4] - 2026-06-28

### Added

- **Open data** — `GET /v1/data/manifest`, `/v1/data/states`, `/v1/data/holidays/:year`, and
  `/v1/data/all`: raw, cacheable JSON snapshots of the calendar dataset (no API key, no
  response envelope) for zero-SDK consumption.
- **Prayer times** — `GET /v1/prayer-times/:zone` (JAKIM Waktu Solat times via
  api.waktusolat.app, MYT-formatted) and `GET /v1/prayer-times/zones` (the JAKIM zone
  directory).
- **API keys** — `POST /v1/keys` (admin-issued for now), `GET /v1/keys/whoami`, and
  `DELETE /v1/keys`, with anonymous-first tiered rate limiting. The key store stays
  inactive (anonymous-only) until an `API_KEYS` KV namespace is bound.
- Preliminary `data/holidays/2027.json` (49 entries) — fixed/statutory holidays confirmed;
  Islamic and lunar dates marked tentative + `isEstimated` pending the 2027 federal gazette.
  Wired into the API and MCP server.
- `LAUNCH.md`, `docs-internal/MCP-REGISTRY.md`, and `docs-internal/MULTI-LANG-SDKS.md` —
  launch copy (Show HN / r/malaysia / LinkedIn / dev.to / Product Hunt) and growth-pack
  reference docs.

### Changed

- `@catlabtech/mycal-mcp-server`: set `mcpName` / `server.json` name to `io.github.Junhui20/mycal`
  (the MCP Registry namespace is case-sensitive and must match the GitHub login `Junhui20`) and
  added `packages/mcp-server/server.json` for the official MCP Registry. (0.1.3 published the
  lowercase name, which the registry rejected.)

## [0.1.2] - 2026-06-28

### Added

- **Leave optimizer** — `optimizeLeave` (core), `GET /v1/holidays/leave-optimizer`, the
  `malaysia_leave_optimizer` MCP tool, and `client.leaveOptimizer()` in the SDK.
- **Feeds** — `GET /v1/feed/csv/:state` (spreadsheet export) and an `?include=holidays`
  iCal variant; iCal now emits machine-readable `CATEGORIES`, calendar colour/description,
  and a refresh interval.
- New **`/subscribe`** page with one-tap webcal "Add to Google/Apple/Outlook" buttons.
- Business-day helpers: `subtractBusinessDays`, `nextBusinessDay`, `previousBusinessDay`,
  `isBusinessDay`; plus optional `category` / `isEstimated` (Holiday) and `isoCode` (State).

### Fixed

- **Security:** bounded business-day inputs (CPU-DoS), constant-time header-only admin auth,
  SSRF-screened + admin-gated webhooks, no-store on `/admin` & `/webhooks`, iCal CRLF escaping,
  and a rate limiter that prefers Cloudflare's native binding (no longer trusts X-Forwarded-For).
- **MCP `npx`:** calendar data is bundled into the package, so an installed server no longer
  fails reading a non-shipped data directory.
- `diffDays` timezone bug (now anchored at noon-UTC).

### Changed

- Extracted `findLongWeekends` into core (de-duplicated from the API route and MCP server).

## [0.1.1] - 2026-04-22

### Added

- First public npm releases of the workspace packages under the `@catlabtech` scope:
  - `@catlabtech/mycal-core` — shared types, Zod schemas, and calendar/business-day logic.
  - `@catlabtech/mycal-sdk` — TypeScript client SDK for the REST API.
  - `@catlabtech/mycal-mcp-server` — MCP server exposing 13 calendar tools for AI agents.
- MIT `LICENSE` at the repository root and bundled inside each published package.
- npm package metadata (`author`, `repository`, `homepage`, `bugs`, `keywords`) for discoverability,
  plus `sideEffects: false` on `mycal-core` and an `mcpName` registry identifier on `mycal-mcp-server`.

### Changed

- Bumped the repository version to `0.1.1` to align with the published packages.
- Bumped `hono` to the latest 4.x range in `@mycal/api`.

### Removed

- Dropped the broken `parse:jpm` / `parse:kpm` / `parse:mpm` scripts that pointed at
  non-existent parser files.

## [0.1.0] - 2026-03-15

### Added

- Initial Malaysia Calendar API: public holidays, school calendar, exam schedules,
  business-day calculator, state resolver, iCal feeds, and OpenAPI 3.1 spec.

[Unreleased]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Junhui20/malaysia-calendar-api/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Junhui20/malaysia-calendar-api/releases/tag/v0.1.0
