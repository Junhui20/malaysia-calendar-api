---
title: Type Reference
description: Full type definitions re-exported by @catlabtech/mycal-sdk.
---

All types listed here are re-exported from `@catlabtech/mycal-core`. Import them directly from `@catlabtech/mycal-sdk`:

```ts
import type {
  Holiday, HolidayType, HolidayStatus,
  State, StateGroup, StateType,
  SchoolTerm, SchoolHoliday, SchoolHolidayType,
  Exam, ExamType,
  CheckDateResult, BusinessDaysResult, LongWeekend,
  LocalizedString,
} from "@catlabtech/mycal-sdk";
```

## LocalizedString

```ts
interface LocalizedString {
  readonly ms: string;
  readonly en: string;
  readonly zh?: string;
}
```

## Holiday

```ts
interface Holiday {
  readonly id: string;
  readonly date: string;           // ISO YYYY-MM-DD
  readonly endDate?: string;
  readonly name: LocalizedString;
  readonly type: HolidayType;
  readonly status: HolidayStatus;
  readonly states: readonly string[];  // ["*"] = all
  readonly isPublicHoliday: boolean;
  readonly gazetteLevel: "P" | "N";
  readonly isReplacementFor?: string;
  readonly hijriDate?: string;
  readonly gazetteRef?: string;
  readonly source: "jpm" | "jakim" | "state-gov" | "community" | "admin";
  readonly createdAt: string;
  readonly updatedAt: string;
}
```

## State

```ts
interface State {
  readonly code: string;
  readonly aliases: readonly string[];
  readonly name: LocalizedString;
  readonly type: "state" | "federal_territory";
  readonly group: "A" | "B";
  readonly weekendHistory: readonly WeekendConfig[];
}

interface WeekendConfig {
  readonly from: string;
  readonly to: string | null;
  readonly weekendDays: readonly number[]; // 0=Sun, 6=Sat
  readonly group: "A" | "B";
}
```

## CheckDateResult

```ts
interface CheckDateResult {
  readonly date: string;
  readonly dayOfWeek: string;
  readonly isHoliday: boolean;
  readonly isWeekend: boolean;
  readonly isWorkingDay: boolean;
  readonly isSchoolDay: boolean;
  readonly holidays: readonly Holiday[];
  readonly school: {
    readonly group: "A" | "B";
    readonly term: SchoolTerm | null;
    readonly holiday: SchoolHoliday | null;
  } | null;
  readonly state: {
    readonly code: string;
    readonly weekendDays: readonly string[];
    readonly group: "A" | "B";
  };
}
```

## BusinessDaysResult

```ts
interface BusinessDaysResult {
  readonly totalDays: number;
  readonly businessDays: number;
  readonly holidays: number;
  readonly weekendDays: number;
  readonly holidayList: readonly Holiday[];
}
```

## LongWeekend

```ts
interface LongWeekend {
  readonly startDate: string;
  readonly endDate: string;
  readonly totalDays: number;
  readonly holidays: readonly Holiday[];
  readonly weekendDays: number;
  readonly bridgeDaysNeeded: number;
}
```

## SchoolTerm

```ts
interface SchoolTerm {
  readonly id: string;
  readonly year: number;
  readonly term: 1 | 2;
  readonly group: "A" | "B";
  readonly segments: readonly SchoolTermSegment[];
  readonly totalSchoolDays: number;
  readonly startDate: string;
  readonly endDate: string;
}

interface SchoolTermSegment {
  readonly startDate: string;
  readonly endDate: string;
  readonly schoolDays: number;
}
```

## SchoolHoliday

```ts
interface SchoolHoliday {
  readonly id: string;
  readonly year: number;
  readonly group: "A" | "B";
  readonly type: SchoolHolidayType;
  readonly name: LocalizedString;
  readonly startDate: string;
  readonly endDate: string;
  readonly days: number;
  readonly states?: readonly string[];
  readonly excludeStates?: readonly string[];
  readonly remarks?: string;
}

type SchoolHolidayType =
  | "cuti_penggal_1"
  | "cuti_pertengahan"
  | "cuti_penggal_2"
  | "cuti_akhir"
  | "cuti_perayaan_kpm";
```

## Exam

```ts
interface Exam {
  readonly id: string;
  readonly year: number;
  readonly name: string;
  readonly fullName: LocalizedString;
  readonly type: "spm" | "stpm" | "muet" | "pt3" | "stam" | "other";
  readonly startDate: string;
  readonly endDate?: string;
  readonly status: "confirmed" | "tentative";
  readonly resultsDate?: string;
  readonly source: "kpm" | "mpm";
}
```
