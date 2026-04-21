---
title: Holiday Types
description: The six holiday types and when each applies.
---

Every `Holiday` record has a `type` field. Six values:

## `federal`

Nationwide public holidays gazetted by the Prime Minister's Department (JPM). Applies to all 16 states and 3 FTs unless a specific state opts out (rare).

**Examples:** Hari Kebangsaan (31 Aug), Hari Malaysia (16 Sep), Labour Day (1 May).

## `state`

State-specific holidays. `states` array lists the affected states.

**Examples:** Sultan of Selangor's Birthday (Selangor only), Hari Nuzul Al-Quran in select states, Penang Governor's Birthday.

## `islamic`

Islamic calendar holidays shared across all states. Date derived from Takwim Hijri-Miladi (JAKIM).

**Examples:** Hari Raya Aidilfitri, Hari Raya Aidiladha, Awal Muharram, Maulidur Rasul, Israk Mikraj.

These often appear with `status: "tentative"` until 1–2 days before, when JAKIM confirms the Hijri date based on moon sighting.

## `islamic_state`

Islamic holidays that apply only to specific states.

**Examples:** Awal Ramadan in Johor, Kedah, Kelantan, Melaka, Negeri Sembilan, Pahang, Perak, Selangor, Terengganu (but not Sabah, Sarawak, or WP).

## `replacement`

**Cuti ganti** — automatically generated when a federal or state holiday falls on a weekend. Most states grant the next Monday (or next working day) as a replacement.

Replacement records carry `isReplacementFor` pointing to the original holiday's `id`. They have the same `states` scope as their parent.

Whether a replacement is granted depends on the state's gazette rules — the API handles this automatically based on each state's historical treatment.

## `adhoc`

One-off holidays announced by the PM or a state government that weren't on the annual gazette. Typically cuti peristiwa (special occasion holidays).

**Examples:** Post-election public holidays, sporting-event celebrations, significant national announcements.

`adhoc` holidays usually start as `status: "announced"` and flip to `"confirmed"` once gazetted.

## Combining type and status

The pair `(type, status)` tells you everything:

| Scenario | `type` | `status` |
|----------|--------|----------|
| Published in annual gazette | any non-replacement | `confirmed` |
| Auto-generated replacement | `replacement` | `confirmed` |
| Islamic holiday, date not yet confirmed by JAKIM | `islamic` / `islamic_state` | `tentative` |
| Just-announced cuti peristiwa | `adhoc` | `announced` |
| Previously-published holiday that was withdrawn | any | `cancelled` |
