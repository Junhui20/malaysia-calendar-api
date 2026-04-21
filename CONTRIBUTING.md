# Contributing to Malaysia Calendar API

Thank you for helping keep Malaysia's calendar data accurate! This guide covers how to report holidays, fix data, and contribute code.

## How to Report a Holiday

If you notice a missing holiday, incorrect date, or a newly announced **cuti peristiwa** (ad-hoc holiday), please open a GitHub Issue.

### What to include in your report

| Field | Required | Example |
|-------|----------|---------|
| Holiday name (BM + EN) | Yes | Hari Raya Aidilfitri / Eid al-Fitr |
| Date(s) | Yes | 2026-03-21 to 2026-03-22 |
| States affected | Yes | All states / Selangor only / KL, Putrajaya, Labuan |
| Official source URL | Yes | Link to government gazette, news article, or KPM circular |
| Type | Helpful | federal, state, islamic, replacement, adhoc |
| Gazette reference | Helpful | P.U.(B) 305/2025 |

### Issue template

```
**Holiday name (BM)**: Cuti Peristiwa sempena ...
**Holiday name (EN)**: Ad-hoc holiday for ...
**Date**: 2026-XX-XX
**States**: All / [list specific states]
**Source URL**: https://...
**Type**: adhoc / federal / state / replacement
**Notes**: (any additional context)
```

## How to Fix Data

Found an error in the holiday data? Here's how to submit a fix:

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/MalaysiaCalanderApi.git
cd MalaysiaCalanderApi
pnpm install
```

### 2. Edit the JSON data

All holiday data lives in the `data/` directory. Edit the relevant file:

- **Public holidays**: `data/holidays/{year}.json`
- **School terms**: `data/school/terms-{year}.json`
- **School holidays**: `data/school/holidays-{year}.json`
- **Exam schedules**: `data/school/exams-{year}.json`
- **State config**: `data/states.json`

### 3. Run validation

The project uses a 5-layer validation pipeline. Always run it before submitting:

```bash
# Validate all data files
npx tsx scripts/validate-data.ts
```

Validation checks:
1. **Schema** — Zod validates types, required fields, date formats
2. **Temporal** — Dates fall within the correct year, no impossible dates
3. **Cross-source** — No duplicate IDs, replacement holidays link to valid originals, state codes are valid
4. **Historical** — Known fixed holidays are present (Merdeka, Malaysia Day, etc.)
5. **Diff review** — Flags suspicious changes for human review

### 4. Submit a PR

```bash
git checkout -b fix/holiday-date-correction
git add data/
git commit -m "fix: correct date for Hari Raya Haji 2026"
git push origin fix/holiday-date-correction
```

Then open a Pull Request with:
- What was wrong
- What you changed
- Link to the official source confirming the correct data

## Data Format

### Holiday JSON structure

Each holiday entry in `data/holidays/{year}.json` follows this format:

```json
{
  "id": "2026-hari-kebangsaan",
  "date": "2026-08-31",
  "name": {
    "ms": "Hari Kebangsaan",
    "en": "National Day",
    "zh": "国庆日"
  },
  "type": "federal",
  "status": "confirmed",
  "states": ["*"],
  "isPublicHoliday": true,
  "gazetteLevel": "P",
  "source": "jpm",
  "gazetteRef": "GN-33499",
  "createdAt": "2025-08-28T00:00:00+08:00",
  "updatedAt": "2025-08-28T00:00:00+08:00"
}
```

**Key fields**:

| Field | Description |
|-------|-------------|
| `id` | Unique ID: `{year}-{slug}` |
| `date` | ISO 8601 date (`YYYY-MM-DD`) |
| `endDate` | Optional, for multi-day holidays |
| `name.ms` | Bahasa Melayu name (required) |
| `name.en` | English name (required) |
| `name.zh` | Chinese name (optional) |
| `type` | `federal`, `state`, `islamic`, `islamic_state`, `replacement`, `adhoc` |
| `status` | `confirmed`, `tentative`, `announced`, `cancelled` |
| `states` | `["*"]` for all states, or array of state codes like `["selangor", "kuala-lumpur"]` |
| `isPublicHoliday` | `true` if it is a gazetted public holiday |
| `gazetteLevel` | `"P"` = Persekutuan (federal), `"N"` = Negeri (state) |
| `isReplacementFor` | For cuti ganti: the `id` of the original holiday |
| `hijriDate` | Hijri date string for Islamic holidays (e.g., `"1 Syawal 1448"`) |
| `gazetteRef` | Gazette reference number (e.g., `"P.U.(B) 305/2025"`) |
| `source` | `jpm`, `jakim`, `state-gov`, `community`, `admin` |

### School holiday JSON structure

Each entry in `data/school/holidays-{year}.json`:

```json
{
  "id": "2026-cuti-pertengahan-penggal-1-B",
  "year": 2026,
  "group": "B",
  "type": "cuti_pertengahan",
  "name": {
    "ms": "Cuti Pertengahan Penggal 1",
    "en": "Mid-Term 1 Break"
  },
  "startDate": "2026-03-14",
  "endDate": "2026-03-22",
  "days": 9
}
```

**School groups**:
- **Kumpulan A**: Johor, Kedah, Kelantan, Terengganu
- **Kumpulan B**: All other states

### State codes

Use canonical state codes (lowercase, hyphenated): `johor`, `kedah`, `kelantan`, `terengganu`, `perak`, `pulau-pinang`, `selangor`, `negeri-sembilan`, `melaka`, `pahang`, `perlis`, `sabah`, `sarawak`, `kuala-lumpur`, `wp-putrajaya`, `wp-labuan`.

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Install and build

```bash
# Install dependencies
pnpm install

# Build core library
pnpm --filter @catlabtech/mycal-core build

# Build all packages
pnpm build

# Run API locally
cd packages/api && pnpm dev

# Run tests
pnpm test

# Validate data files
pnpm validate
```

### Project scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all packages (via Turborepo) |
| `pnpm test` | Run all tests |
| `pnpm validate` | Run 5-layer data validation |
| `pnpm parse:jpm` | Parse JPM gazette PDF |
| `pnpm parse:kpm` | Parse KPM school calendar PDF |
| `pnpm parse:mpm` | Parse MPM exam schedule PDF |

## Cuti Peristiwa (Ad-hoc Holiday)

Cuti peristiwa are emergency public holidays declared at short notice, often for national celebrations (e.g., winning a sports tournament) or state-level events. These need to be added quickly.

### How the emergency path works

```
PM/MB/CM announces cuti peristiwa
  -> News agencies publish
  -> Community member sees it
  -> Opens GitHub Issue (with source URL)
  -> Maintainer verifies and merges
  -> API updated within hours
```

### How you can help

1. **Monitor news** for keywords: `cuti peristiwa`, `cuti khas`, `hari kelepasan am tambahan`
2. **Open an Issue** immediately with the source URL
3. If you can, **submit a PR** directly with the holiday added to the correct year's JSON file

### High-confidence keywords (Malay)

These phrases almost always indicate an ad-hoc public holiday:
- `cuti peristiwa`
- `hari kelepasan am tambahan`
- `cuti khas seluruh negara`
- `diisytiharkan sebagai cuti umum`

### Medium-confidence keywords (need context)

These may indicate a holiday but require verification:
- `isytihar cuti` (when said by PM/MB/CM)
- `mengumumkan cuti`
- `cuti sempena` + event description
- `cuti hari mengundi` (election day)
- `cuti khas negeri [state name]`

## Code Style

- **TypeScript** throughout — strict mode enabled
- **Immutability** — all interfaces use `readonly` properties, never mutate data in-place
- **Small files** — aim for 200-400 lines per file, 800 max
- **Error handling** — handle errors explicitly, provide clear messages
- **Validation** — validate all input at system boundaries using Zod schemas
- **No hardcoded values** — use constants or config files

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Deepavali 2027 holiday data
fix: correct Hari Raya Haji date for 2026
docs: update API examples in README
chore: bump zod to v3.25
data: add KPM school calendar for 2027
```

## Questions?

Open a GitHub Issue or Discussion. We're happy to help!
