// Types
export type {
  LocalizedString,
  Holiday,
  HolidayType,
  HolidayCategory,
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
  LeaveSuggestion,
  ChangelogEntry,
} from "./types.js";

// Schemas
export {
  holidaySchema,
  holidayCategorySchema,
  holidayFileSchema,
  stateSchema,
  statesFileSchema,
  schoolTermSchema,
  schoolTermsFileSchema,
  schoolHolidaySchema,
  schoolHolidaysFileSchema,
  examSchema,
  examsFileSchema,
} from "./schemas.js";

// State resolution
export {
  resolveStateCode,
  getStateByCode,
  getStatesByGroup,
} from "./state-resolver.js";

// Weekend utilities
export {
  getWeekendConfig,
  isWeekend,
  getDayOfWeekName,
  getWeekendDayNames,
  addDays,
  nextWorkingDay,
  diffDays,
} from "./weekend.js";

// Holiday filtering
export {
  filterHolidays,
  findHolidaysByDate,
  findNextHoliday,
  groupHolidaysByDate,
} from "./filter.js";
export type { HolidayFilter } from "./filter.js";

// Replacement holiday calculation
export { calculateReplacementHolidays } from "./replacement.js";

// Business days
export {
  countBusinessDays,
  addBusinessDays,
  subtractBusinessDays,
  isBusinessDay,
  nextBusinessDay,
  previousBusinessDay,
} from "./business-days.js";

// Long weekends & leave optimization
export { findLongWeekends, optimizeLeave } from "./long-weekend.js";

// Input validation & request-safety utilities
export {
  isValidISODate,
  timingSafeEqualString,
  isSafePublicHttpsUrl,
} from "./validation.js";

// School calendar
export {
  findSchoolTermByDate,
  findSchoolHolidayByDate,
  filterSchoolHolidays,
  isSchoolDay,
} from "./school.js";

// iCal generation
export { generateIcal } from "./ical.js";

// Hijri utilities
export {
  HIJRI_MONTHS,
  ISLAMIC_HOLIDAY_DATES,
  parseHijriDate,
  formatHijriDate,
} from "./hijri.js";
export type { HijriMonth } from "./hijri.js";
