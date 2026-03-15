// ─── Localized String ───

export interface LocalizedString {
  readonly ms: string;
  readonly en: string;
  readonly zh?: string;
}

// ─── Holiday Types ───

export type HolidayType =
  | "federal"
  | "state"
  | "islamic"
  | "islamic_state"
  | "replacement"
  | "adhoc";

export type HolidayStatus =
  | "confirmed"
  | "tentative"
  | "announced"
  | "cancelled";

export type GazetteLevel = "P" | "N"; // (P)ersekutuan or (N)egeri

export type HolidaySource =
  | "jpm"
  | "jakim"
  | "state-gov"
  | "community"
  | "admin";

export interface Holiday {
  readonly id: string;
  readonly date: string; // ISO 8601
  readonly endDate?: string;
  readonly name: LocalizedString;
  readonly type: HolidayType;
  readonly status: HolidayStatus;
  readonly states: readonly string[]; // ["*"] = all states
  readonly isPublicHoliday: boolean;
  readonly gazetteLevel: GazetteLevel;
  readonly isReplacementFor?: string;
  readonly hijriDate?: string;
  readonly gazetteRef?: string;
  readonly source: HolidaySource;
  readonly confirmedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── State Types ───

export type StateGroup = "A" | "B";

export interface WeekendConfig {
  readonly from: string; // ISO date
  readonly to: string | null; // null = current
  readonly weekendDays: readonly number[]; // 0=Sun, 6=Sat
  readonly group: StateGroup;
}

export type StateType = "state" | "federal_territory";

export interface State {
  readonly code: string;
  readonly aliases: readonly string[];
  readonly name: LocalizedString;
  readonly type: StateType;
  readonly weekendHistory: readonly WeekendConfig[];
  readonly group: StateGroup; // current group
}

// ─── School Calendar Types ───

export interface SchoolTermSegment {
  readonly startDate: string;
  readonly endDate: string;
  readonly schoolDays: number;
}

export interface SchoolTerm {
  readonly id: string;
  readonly year: number;
  readonly term: 1 | 2;
  readonly group: StateGroup;
  readonly segments: readonly SchoolTermSegment[];
  readonly totalSchoolDays: number;
  readonly startDate: string;
  readonly endDate: string;
}

export type SchoolHolidayType =
  | "cuti_penggal_1"
  | "cuti_pertengahan"
  | "cuti_penggal_2"
  | "cuti_akhir"
  | "cuti_perayaan_kpm";

export interface SchoolHoliday {
  readonly id: string;
  readonly year: number;
  readonly group: StateGroup;
  readonly type: SchoolHolidayType;
  readonly name: LocalizedString;
  readonly startDate: string;
  readonly endDate: string;
  readonly days: number;
  readonly states?: readonly string[];
  readonly excludeStates?: readonly string[];
  readonly remarks?: string;
}

// ─── Exam Types ───

export type ExamType =
  | "spm"
  | "stpm"
  | "muet"
  | "pt3"
  | "stam"
  | "other";

export type ExamSource = "kpm" | "mpm";

export interface Exam {
  readonly id: string;
  readonly year: number;
  readonly name: string;
  readonly fullName: LocalizedString;
  readonly type: ExamType;
  readonly startDate: string;
  readonly endDate?: string;
  readonly status: "confirmed" | "tentative";
  readonly resultsDate?: string;
  readonly source: ExamSource;
}

// ─── API Response Types ───

export interface CheckDateResult {
  readonly date: string;
  readonly dayOfWeek: string;
  readonly isHoliday: boolean;
  readonly isWeekend: boolean;
  readonly isWorkingDay: boolean;
  readonly isSchoolDay: boolean;
  readonly holidays: readonly Holiday[];
  readonly school: {
    readonly group: StateGroup;
    readonly term: SchoolTerm | null;
    readonly holiday: SchoolHoliday | null;
  } | null;
  readonly state: {
    readonly code: string;
    readonly weekendDays: readonly string[];
    readonly group: StateGroup;
  };
}

export interface BusinessDaysResult {
  readonly totalDays: number;
  readonly businessDays: number;
  readonly holidays: number;
  readonly weekendDays: number;
  readonly holidayList: readonly Holiday[];
}

export interface LongWeekend {
  readonly startDate: string;
  readonly endDate: string;
  readonly totalDays: number;
  readonly holidays: readonly Holiday[];
  readonly weekendDays: number;
  readonly bridgeDaysNeeded: number;
}

export interface ChangelogEntry {
  readonly timestamp: string;
  readonly event: string;
  readonly holidayId?: string;
  readonly examId?: string;
  readonly description: string;
  readonly changes?: Record<string, { from: unknown; to: unknown }>;
}
