---
title: Data Sources
description: Primary-source gazette references for every piece of data in MyCal.
---

MyCal sources every record from official Malaysian government publications. Every holiday record carries a `gazetteRef` field pointing back to the exact Warta Kerajaan entry.

## Jabatan Perdana Menteri (JPM)

**What:** Federal and state public holidays.

**Source:** JPM BKPP gazette notifications published on [kabinet.gov.my/hari-kelepasan-am](https://www.kabinet.gov.my/hari-kelepasan-am/).

**Format:** MyCal stores `gazetteRef` as the JPM Government Notification number (`GN-xxxxx`). Each annual gazette typically has three documents:

- **GN-33499 (Federal)** — federal holidays for the following year
- **GN-33500 (State)** — state-specific holidays
- **GN-33501 (Combined)** — consolidated federal+state reference, entries marked (P) Persekutuan or (N) Negeri

JPM publications sometimes cite `P.U.(A)` (Federal Law) or `P.U.(B)` (Federal Notification) numbers as well — both refer to the same underlying gazette series, but MyCal standardises on the GN number.

## JAKIM

**What:** Islamic (Hijri) calendar dates for all Islamic public holidays.

**Source:** Takwim Hijri-Miladi at [e-solat.gov.my/web/muqaddimah.php](https://www.e-solat.gov.my/web/muqaddimah.php).

**Important:** JAKIM publishes the Takwim year in advance with tentative dates, then confirms each Islamic month's start based on moon sighting (rukyah) — usually 1–2 days before. This is why Islamic holidays often have `status: "tentative"` until close to the date.

## KPM (Kementerian Pendidikan Malaysia)

**What:** School calendar — term dates, cuti penggal, cuti perayaan (Lampiran A/B/C).

**Source:** Annual "Kalendar Akademik" PDF published at [moe.gov.my](https://www.moe.gov.my/).

**Structure:** Separate tables for Kumpulan A (Kedah, Kelantan, Terengganu) and Kumpulan B (rest). Each year carries three Lampiran for festive-holiday state adjustments.

## MPM (Majlis Peperiksaan Malaysia)

**What:** STPM and MUET exam schedules.

**Source:** [mpm.edu.my](https://www.mpm.edu.my/).

PT3 and SPM schedules come from KPM directly.

## State Government Portals

**What:** State-specific public holidays, especially Sultan/YDPB birthdays and state-level Islamic holidays.

**Sources:** 16 separate `.gov.my` portals. MyCal cross-references these against the consolidated JPM state gazette to catch any state-level adjustments.

## What's NOT a source

- Third-party holiday sites (timeanddate.com, office-holidays.com, etc.) — these often have errors for state-specific holidays and weekend configs.
- Social media announcements — tracked as signals but not authoritative.
- Wikipedia — good for historical context, not for published dates.

## Auditing a record

Pick any Holiday from the API. The `gazetteRef` field gives you the exact document to look up:

```json
{
  "id": "2026-hari-kebangsaan",
  "date": "2026-08-31",
  "name": { "en": "National Day", "ms": "Hari Kebangsaan" },
  "gazetteLevel": "P",
  "gazetteRef": "GN-33499",
  "source": "jpm"
}
```

Search `GN-33499` on the JPM gazette portal and you'll find the corresponding PDF.
