---
title: Available Tools
description: All 12 MCP tools with parameters and natural-language prompts that trigger them.
---

Every tool below is automatically available to your AI client once the MCP server is set up. You don't call them directly — the AI picks the right tool based on your question.

## `get_malaysia_holidays`

List public holidays matching filters.

**Params:** `year?`, `state?`, `type?`, `status?`, `month?`

**Triggers on:** "list holidays in 2026 for Selangor", "what are the Islamic holidays this year"

## `check_malaysia_holiday`

Check if a specific date is a holiday, weekend, working day, or school day.

**Params:** `date` (required), `state` (required)

**Triggers on:** "is March 21 a holiday in KL?", "is next Monday a working day in Kedah?"

## `next_malaysia_holiday`

Find the next N upcoming holidays.

**Params:** `state?`, `type?`, `limit?` (default 1)

**Triggers on:** "when's the next public holiday?", "next 3 holidays in Penang"

## `malaysia_business_days`

Count working days in a range, or add business days to a date.

**Params:** `start`, `end`, `state` — or `date`, `days`, `state`

**Triggers on:** "how many business days in March for Selangor?", "10 business days from March 1"

## `malaysia_long_weekends`

Return all 3+ day non-working stretches in a year.

**Params:** `state` (required), `year?`

**Triggers on:** "long weekends in 2026", "when can I take a 4-day trip with minimum leave?"

## `list_malaysia_states`

Return all 16 states + 3 FTs with weekend config.

**Params:** none

**Triggers on:** "which states use Friday as weekend?", "list Malaysian states"

## `resolve_malaysia_state`

Resolve any alias (KL, JB, n9) to the canonical state code.

**Params:** `q` (required)

**Triggers on:** "what does 'jb' mean?", "what's the canonical code for Penang?"

## `malaysia_holiday_changes`

Recent additions/changes to holiday data — useful for tracking cuti peristiwa announcements.

**Params:** `since?`

**Triggers on:** "any new holidays announced recently?"

## `malaysia_school_terms`

KPM school term dates and school-day counts.

**Params:** `year?`, `group?`, `state?`

**Triggers on:** "when does the first school term end?", "school calendar for Selangor"

## `malaysia_school_holidays`

School holidays: cuti penggal, pertengahan, akhir, plus cuti perayaan.

**Params:** `year?`, `group?`, `state?`

**Triggers on:** "mid-term holidays 2026", "school holidays for Kelantan"

## `malaysia_exams`

SPM, STPM, MUET, PT3 exam schedules.

**Params:** `year?`, `type?`

**Triggers on:** "when is SPM 2026?", "MUET exam dates"

## `malaysia_is_school_day`

Check if a date is a school day for a given state/group.

**Params:** `date`, `state` or `group`

**Triggers on:** "is March 21 a school day in Selangor?"
