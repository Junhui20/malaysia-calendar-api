// Client
export { MyCalClient } from "./client.js";
export type {
  MyCalClientOptions,
  HolidaysParams,
  HolidaysNextParams,
  SchoolTermsParams,
  SchoolHolidaysParams,
  ExamsParams,
  IsSchoolDayParams,
  HolidaysTodayResponse,
  AddBusinessDaysResponse,
  ResolveStateResponse,
  IsSchoolDayResponse,
} from "./client.js";

// Errors
export { MyCalApiError } from "./errors.js";
export type { Result, ApiError } from "./errors.js";

// Re-export all types from @catlabtech/mycal-core
export type {
  LocalizedString,
  Holiday,
  HolidayType,
  HolidayStatus,
  HolidaySource,
  GazetteLevel,
  State,
  StateGroup,
  StateType,
  WeekendConfig,
  SchoolTerm,
  SchoolTermSegment,
  SchoolHoliday,
  SchoolHolidayType,
  Exam,
  ExamType,
  ExamSource,
  CheckDateResult,
  BusinessDaysResult,
  LongWeekend,
  ChangelogEntry,
} from "@catlabtech/mycal-core";
