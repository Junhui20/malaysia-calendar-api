import type { Holiday, State, SchoolTerm, SchoolHoliday, Exam } from "@mycal/core";

import statesData from "../../../data/states.json";
import holidays2026 from "../../../data/holidays/2026.json";
import schoolTerms2026 from "../../../data/school/terms-2026.json";
import schoolHolidays2026 from "../../../data/school/holidays-2026.json";
import exams2026 from "../../../data/school/exams-2026.json";

export const states: readonly State[] = statesData as State[];

const holidaysByYear: Record<number, readonly Holiday[]> = {
  2026: holidays2026 as unknown as Holiday[],
};

const schoolTermsByYear: Record<number, readonly SchoolTerm[]> = {
  2026: schoolTerms2026 as unknown as SchoolTerm[],
};

const schoolHolidaysByYear: Record<number, readonly SchoolHoliday[]> = {
  2026: schoolHolidays2026 as unknown as SchoolHoliday[],
};

const examsByYear: Record<number, readonly Exam[]> = {
  2026: exams2026 as unknown as Exam[],
};

export function getHolidays(year: number): readonly Holiday[] {
  return holidaysByYear[year] ?? [];
}

export function getSchoolTerms(year: number): readonly SchoolTerm[] {
  return schoolTermsByYear[year] ?? [];
}

export function getSchoolHolidays(year: number): readonly SchoolHoliday[] {
  return schoolHolidaysByYear[year] ?? [];
}

export function getExams(year: number): readonly Exam[] {
  return examsByYear[year] ?? [];
}

export function getAvailableYears(): readonly number[] {
  return Object.keys(holidaysByYear).map(Number).sort();
}
