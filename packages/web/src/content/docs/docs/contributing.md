---
title: Contributing
description: How to report a missing holiday, fix a data error, or add a feature.
---

The entire project is open source under MIT on [GitHub](https://github.com/Junhui20/malaysia-calendar-api). Data is stored as JSON in git — every change has an audit trail.

## Report a missing holiday

The fastest path is a [GitHub issue](https://github.com/Junhui20/malaysia-calendar-api/issues/new) with:

1. **The holiday** — name (Malay preferred) and date
2. **The scope** — federal, state-specific, or ad-hoc
3. **The gazette reference** — ideally a JPM Government Notification number (`GN-xxxxx`) or `P.U.(B) XXX/YYYY` citation
4. **A link** — the official PDF or announcement page

We'll verify against the gazette and either merge it or explain why it's not eligible.

## Fix a data error

### Small fix (typo, date off by one, wrong state)

Open a [pull request](https://github.com/Junhui20/malaysia-calendar-api/pulls):

1. Fork the repo.
2. Edit the relevant file under `data/holidays/<year>.json`.
3. Update the record's `updatedAt` timestamp.
4. Run `pnpm validate` to make sure schemas pass.
5. Commit with a message like `fix(2026): correct date for Selangor Sultan's Birthday`.
6. Open a PR with the gazette reference in the description.

### Bigger fix (schema change, new state rule, etc.)

Open an issue first so we can agree on the approach before you spend time coding.

## Add a feature

1. Open an issue describing the feature.
2. Wait for a thumbs-up before starting work (avoids duplicate effort).
3. Fork, branch, implement with tests.
4. Make sure `pnpm test` and `pnpm validate` both pass.
5. Open a PR.

Good first features to tackle (existing issues welcome):

- Parser scripts for new-year JPM, KPM, MPM PDFs (`scripts/parse-jpm-pdf.ts` etc.)
- State portal scrapers (`parsers/<state>/`)
- Additional SDK convenience methods
- Postgres/MySQL adapter for self-hosting

## Principles

- **Official sources only** — no third-party data ingestion
- **Backward compatibility** — v1 API shape is frozen
- **Types over defensive coding** — validate at boundaries with Zod, then trust the types
- **No silent fallbacks** — if data is wrong, fail loudly rather than serve a guess

See [CONTRIBUTING.md](https://github.com/Junhui20/malaysia-calendar-api/blob/main/CONTRIBUTING.md) in the repo for the latest version.
