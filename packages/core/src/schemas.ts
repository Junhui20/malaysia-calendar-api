import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO 8601 date (YYYY-MM-DD)");

const localizedString = z.object({
  ms: z.string().min(1),
  en: z.string().min(1),
  zh: z.string().optional(),
});

// ─── Holiday Schema ───

export const holidayTypeSchema = z.enum([
  "federal",
  "state",
  "islamic",
  "islamic_state",
  "replacement",
  "adhoc",
]);

export const holidayStatusSchema = z.enum([
  "confirmed",
  "tentative",
  "announced",
  "cancelled",
]);

export const gazetteLevelSchema = z.enum(["P", "N"]);

export const holidaySourceSchema = z.enum([
  "jpm",
  "jakim",
  "state-gov",
  "community",
  "admin",
]);

export const holidaySchema = z.object({
  id: z.string().min(1),
  date: isoDate,
  endDate: isoDate.optional(),
  name: localizedString,
  type: holidayTypeSchema,
  status: holidayStatusSchema,
  states: z.array(z.string().min(1)).min(1),
  isPublicHoliday: z.boolean(),
  gazetteLevel: gazetteLevelSchema,
  isReplacementFor: z.string().optional(),
  hijriDate: z.string().optional(),
  gazetteRef: z.string().optional(),
  source: holidaySourceSchema,
  confirmedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const holidayFileSchema = z.array(holidaySchema);

// ─── State Schema ───

export const stateGroupSchema = z.enum(["A", "B"]);

export const weekendConfigSchema = z.object({
  from: isoDate,
  to: isoDate.nullable(),
  weekendDays: z.array(z.number().int().min(0).max(6)),
  group: stateGroupSchema,
});

export const stateSchema = z.object({
  code: z.string().min(1),
  aliases: z.array(z.string()),
  name: localizedString,
  type: z.enum(["state", "federal_territory"]),
  weekendHistory: z.array(weekendConfigSchema).min(1),
  group: stateGroupSchema,
});

export const statesFileSchema = z.array(stateSchema);

// ─── School Calendar Schemas ───

export const schoolTermSegmentSchema = z.object({
  startDate: isoDate,
  endDate: isoDate,
  schoolDays: z.number().int().min(0),
});

export const schoolTermSchema = z.object({
  id: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  term: z.union([z.literal(1), z.literal(2)]),
  group: stateGroupSchema,
  segments: z.array(schoolTermSegmentSchema).min(1),
  totalSchoolDays: z.number().int().min(0),
  startDate: isoDate,
  endDate: isoDate,
});

export const schoolHolidayTypeSchema = z.enum([
  "cuti_penggal_1",
  "cuti_pertengahan",
  "cuti_penggal_2",
  "cuti_akhir",
  "cuti_perayaan_kpm",
]);

export const schoolHolidaySchema = z.object({
  id: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  group: stateGroupSchema,
  type: schoolHolidayTypeSchema,
  name: localizedString,
  startDate: isoDate,
  endDate: isoDate,
  days: z.number().int().min(1),
  states: z.array(z.string()).optional(),
  excludeStates: z.array(z.string()).optional(),
  remarks: z.string().optional(),
});

export const schoolTermsFileSchema = z.array(schoolTermSchema);
export const schoolHolidaysFileSchema = z.array(schoolHolidaySchema);

// ─── Exam Schema ───

export const examTypeSchema = z.enum([
  "spm",
  "stpm",
  "muet",
  "pt3",
  "stam",
  "other",
]);

export const examSchema = z.object({
  id: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  name: z.string().min(1),
  fullName: localizedString,
  type: examTypeSchema,
  startDate: isoDate,
  endDate: isoDate.optional(),
  status: z.enum(["confirmed", "tentative"]),
  resultsDate: isoDate.optional(),
  source: z.enum(["kpm", "mpm"]),
});

export const examsFileSchema = z.array(examSchema);
