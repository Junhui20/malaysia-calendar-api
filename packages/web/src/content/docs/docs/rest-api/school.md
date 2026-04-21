---
title: School Calendar
description: KPM school terms, cuti penggal, cuti perayaan, and MPM exam schedules.
---

The school calendar follows the Kementerian Pendidikan Malaysia (KPM) publication "Kalendar Akademik Sekolah", with separate schedules for **Kumpulan A** (Kedah, Kelantan, Terengganu, Johor historically) and **Kumpulan B** (everyone else).

## GET /school/terms

List school terms. Two terms per year with multiple segments separated by mid-term holidays.

| Query | Type | Required |
|---|---|---|
| `year` | `number` | — |
| `group` | `"A"` / `"B"` | — |
| `state` | `string` | — (implies `group`) |

Response item:

```ts
{
  id: "2026-term-1-B",
  year: 2026,
  term: 1,
  group: "B",
  segments: [
    { startDate: "2026-01-05", endDate: "2026-03-13", schoolDays: 50 },
    { startDate: "2026-03-23", endDate: "2026-05-22", schoolDays: 45 }
  ],
  totalSchoolDays: 95,
  startDate: "2026-01-05",
  endDate: "2026-05-22"
}
```

---

## GET /school/holidays

School holidays: `cuti_penggal_1`, `cuti_pertengahan`, `cuti_penggal_2`, `cuti_akhir`, and `cuti_perayaan_kpm` (festive holidays per Lampiran A/B/C).

| Query | Type | Required |
|---|---|---|
| `year` | `number` | — |
| `group` | `"A"` / `"B"` | — |
| `state` | `string` | — |

---

## GET /school/exams

National exam schedules from KPM (SPM, PT3) and MPM (STPM, MUET).

| Query | Type | Required |
|---|---|---|
| `year` | `number` | — |
| `type` | `string` | — `spm`, `stpm`, `muet`, `pt3`, `stam`, `other` |

Response item:

```ts
{
  id: "2026-spm",
  year: 2026,
  name: "SPM 2026",
  type: "spm",
  startDate: "2026-11-02",
  endDate: "2026-12-04",
  status: "confirmed",
  resultsDate: "2027-03-15",
  source: "kpm"
}
```

---

## GET /school/is-school-day

Resolve a single date to school-day status.

| Query | Type | Required |
|---|---|---|
| `date` | `string` | ✓ |
| `state` / `group` | `string` | one of them |

Response:

```ts
{
  date: "2026-03-21",
  dayOfWeek: "Saturday",
  isSchoolDay: false,        // weekend
  isPublicHoliday: true,
  isWeekend: true,
  group: "B",
  term: { id: "2026-term-1-B", term: 1 },
  holiday: null
}
```

## Data limitations

- **2024 and 2025 school data is not included** — only the current/future academic year is maintained. Historical school calendars have low demand.
- The school calendar is a national publication with three Lampiran (A/B/C) that adjust festive holiday dates by region. The API exposes these via the `states` / `excludeStates` fields on each `SchoolHoliday` record.
