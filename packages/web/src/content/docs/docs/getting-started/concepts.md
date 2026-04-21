---
title: Core Concepts
description: Key concepts you'll see throughout the API — states, groups, weekends, gazette levels, and holiday statuses.
---

Reading the rest of the docs will make a lot more sense if you understand these five concepts first.

## States and Federal Territories

Malaysia has **13 states** (`state`) and **3 Federal Territories** (`federal_territory`): Kuala Lumpur, Putrajaya, and Labuan. For the API, all 16 are addressable by a canonical code:

```
johor, kedah, kelantan, terengganu, perak, pulau-pinang, selangor,
negeri-sembilan, melaka, pahang, perlis, sabah, sarawak,
kuala-lumpur, wp-putrajaya, wp-labuan
```

Every state has a list of **aliases** so informal codes work too. `kl` → `kuala-lumpur`, `jb` → `johor`, `penang` → `pulau-pinang`, and so on. See the [full reference](/docs/reference/state-codes/).

## Groups (Kumpulan A vs B)

Malaysia's states split into two **working-week groups**:

- **Kumpulan A** — weekend on **Friday & Saturday**. Applies to: Kedah, Kelantan, Terengganu, and Johor (2014–2024).
- **Kumpulan B** — weekend on **Saturday & Sunday**. Applies to everyone else, and Johor again from 2025.

When you call an endpoint with a `state` parameter, the API returns results correctly weighted for that state's weekend. Ask for business days in Kedah and Friday March 20 2026 is non-working; ask for Selangor and it's working.

The `group` field is also useful for school-calendar endpoints where the [KPM calendar](/docs/rest-api/school/) is published separately for Group A and Group B.

## Weekend history

States change group occasionally. Johor's switch from Kumpulan B → A in 2014, and back to B in 2025, are tracked in the `weekendHistory` array on each state record. If you query a date in 2020 for Johor you get Fri–Sat; query the same weekday in 2026 and you get Sat–Sun.

## Gazette levels

Every public holiday carries a `gazetteLevel` field:

- `"P"` — Persekutuan (federal gazette, applies to all states unless a state explicitly opts out)
- `"N"` — Negeri (state gazette, applies only to listed states)

Plus a `gazetteRef` string like `"GN-33499"` (JPM Government Notification number) pointing to the specific Warta Kerajaan entry. This is the **primary-source audit trail** — you can verify every holiday against the actual gazette.

## Holiday status

```
status: "confirmed" | "tentative" | "announced" | "cancelled"
```

- **confirmed** — published in the gazette with a specific date. Safe to rely on.
- **tentative** — date is derived from the Islamic calendar but not yet confirmed by JAKIM. Islamic holidays are typically `tentative` until 1–2 days before.
- **announced** — cuti peristiwa announced by PM or a state (e.g. post-election day).
- **cancelled** — a previously-published holiday that was later withdrawn.

For payroll and SLA systems, treat only `confirmed` as load-bearing. For UI display, show `tentative` but with a visible asterisk.

## Holiday types

```
type: "federal" | "state" | "islamic" | "islamic_state" | "replacement" | "adhoc"
```

- `federal` — nationwide, e.g. Hari Kebangsaan.
- `state` — observed in specific states only, e.g. Sultan of Selangor's Birthday.
- `islamic` — Islamic calendar holidays shared across all states.
- `islamic_state` — state-specific Islamic holidays (e.g. Awal Ramadan in some states only).
- `replacement` — cuti ganti automatically generated when a federal holiday lands on a weekend. Links to the original via `isReplacementFor`.
- `adhoc` — one-off cuti peristiwa.

Next: [REST API overview →](/docs/rest-api/overview/)
