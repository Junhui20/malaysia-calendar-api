import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { Holiday, State } from "../src/types.js";
import { resolveStateCode, getStatesByGroup } from "../src/state-resolver.js";
import { isWeekend, getDayOfWeekName, nextWorkingDay } from "../src/weekend.js";
import { calculateReplacementHolidays } from "../src/replacement.js";
import { filterHolidays, findHolidaysByDate, findNextHoliday } from "../src/filter.js";
import { countBusinessDays } from "../src/business-days.js";
import { findSchoolHolidayByDate } from "../src/school.js";
import { statesFileSchema, holidayFileSchema } from "../src/schemas.js";

const __dirname2 = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname2, "../../../data");

const states: State[] = JSON.parse(readFileSync(resolve(DATA_DIR, "states.json"), "utf-8"));
const holidays2026: Holiday[] = JSON.parse(readFileSync(resolve(DATA_DIR, "holidays/2026.json"), "utf-8"));
const schoolHolidays = JSON.parse(readFileSync(resolve(DATA_DIR, "school/holidays-2026.json"), "utf-8"));

// ─── State Resolver ───

describe("state-resolver", () => {
  it("resolves by canonical code", () => {
    const state = resolveStateCode("selangor", states);
    assert.equal(state?.code, "selangor");
  });

  it("resolves by alias (case insensitive)", () => {
    assert.equal(resolveStateCode("KL", states)?.code, "kuala-lumpur");
    assert.equal(resolveStateCode("penang", states)?.code, "pulau-pinang");
    assert.equal(resolveStateCode("jb", states)?.code, "johor");
    assert.equal(resolveStateCode("n9", states)?.code, "negeri-sembilan");
    assert.equal(resolveStateCode("kk", states)?.code, "sabah");
  });

  it("returns null for unknown code", () => {
    assert.equal(resolveStateCode("singapore", states), null);
  });

  it("gets states by group", () => {
    const groupA = getStatesByGroup("A", states);
    const codes = groupA.map((s) => s.code);
    assert.ok(codes.includes("kedah"));
    assert.ok(codes.includes("kelantan"));
    assert.ok(codes.includes("terengganu"));
    assert.equal(groupA.length, 3);
  });
});

// ─── Weekend ───

describe("weekend", () => {
  const selangor = states.find((s) => s.code === "selangor")!;
  const kelantan = states.find((s) => s.code === "kelantan")!;

  it("Saturday is weekend for Selangor (Group B)", () => {
    assert.equal(isWeekend("2026-03-21", selangor), true);  // Saturday
    assert.equal(isWeekend("2026-03-22", selangor), true);  // Sunday
    assert.equal(isWeekend("2026-03-23", selangor), false); // Monday
  });

  it("Friday is weekend for Kelantan (Group A)", () => {
    assert.equal(isWeekend("2026-03-20", kelantan), true);  // Friday
    assert.equal(isWeekend("2026-03-21", kelantan), true);  // Saturday
    assert.equal(isWeekend("2026-03-22", kelantan), false); // Sunday = working day
  });

  it("returns correct day name", () => {
    assert.equal(getDayOfWeekName("2026-03-21"), "Saturday");
    assert.equal(getDayOfWeekName("2026-08-31"), "Monday");
  });

  it("finds next working day skipping weekends and holidays", () => {
    const holidayDates = new Set(["2026-03-23"]); // Monday is holiday
    const result = nextWorkingDay("2026-03-22", selangor, holidayDates); // Sunday
    assert.equal(result, "2026-03-24"); // Tuesday
  });
});

// ─── Replacement Holidays ───

describe("replacement", () => {
  it("creates replacement when holiday falls on weekend", () => {
    const selangor = states.find((s) => s.code === "selangor")!;
    const replacements = calculateReplacementHolidays(holidays2026, selangor);

    // Hari Raya 2026-03-21 (Sat) and 2026-03-22 (Sun) should both get replacements
    const rayaReplacement = replacements.find((r) =>
      r.isReplacementFor === "2026-hari-raya-aidilfitri-1"
    );
    assert.ok(rayaReplacement, "Hari Raya Saturday should have replacement");
    assert.equal(rayaReplacement?.type, "replacement");
  });

  it("handles overlapping holidays on same date", () => {
    const selangor = states.find((s) => s.code === "selangor")!;
    const replacements = calculateReplacementHolidays(holidays2026, selangor);

    // 2026-02-01: Hari Wilayah (N) + Thaipusam (N) overlap for KL
    // 2026-05-31: Wesak (P) + Kaamatan (N) overlap for Sabah
    assert.ok(replacements.length > 0, "Should have at least one replacement");
  });
});

// ─── Filter ───

describe("filter", () => {
  it("filters by type", () => {
    const islamic = filterHolidays(holidays2026, { type: "islamic" });
    assert.ok(islamic.length > 0);
    assert.ok(islamic.every((h) => h.type === "islamic"));
  });

  it("filters by state", () => {
    const sabah = filterHolidays(holidays2026, { state: "sabah" });
    assert.ok(sabah.some((h) => h.name.en.includes("Kaamatan")));
    assert.ok(!sabah.some((h) => h.name.en.includes("Gawai")));
  });

  it("finds holidays by date", () => {
    const result = findHolidaysByDate("2026-08-31", holidays2026);
    assert.ok(result.some((h) => h.name.en === "National Day"));
  });

  it("finds next holiday", () => {
    const next = findNextHoliday("2026-12-20", holidays2026, undefined, undefined, 1);
    assert.ok(next.length > 0);
    assert.ok(next[0].date >= "2026-12-21");
  });
});

// ─── Business Days ───

describe("business-days", () => {
  const selangor = states.find((s) => s.code === "selangor")!;

  it("counts business days in a week with no holidays", () => {
    const result = countBusinessDays("2026-07-13", "2026-07-17", selangor, holidays2026);
    assert.equal(result.businessDays, 5);
    assert.equal(result.weekendDays, 0);
  });

  it("excludes weekends", () => {
    const result = countBusinessDays("2026-07-13", "2026-07-19", selangor, holidays2026);
    assert.equal(result.totalDays, 7);
    assert.equal(result.weekendDays, 2);
    assert.equal(result.businessDays, 5);
  });
});

// ─── School ───

describe("school", () => {
  it("detects school holiday by date", () => {
    const holiday = findSchoolHolidayByDate("2026-05-25", schoolHolidays, "B");
    assert.ok(holiday);
    assert.equal(holiday?.type, "cuti_pertengahan");
  });

  it("respects excludeStates for Deepavali Sarawak exception", () => {
    const regularState = findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "selangor");
    assert.ok(regularState, "Selangor should have Nov 10 holiday");

    const sarawak = findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "sarawak");
    assert.equal(sarawak, null, "Sarawak excluded from Nov 10, has own Nov 9");
  });
});

// ─── Data Integrity ───

describe("data integrity", () => {
  it("states.json passes schema", () => {
    const result = statesFileSchema.safeParse(states);
    assert.ok(result.success);
  });

  it("holidays/2026.json passes schema", () => {
    const result = holidayFileSchema.safeParse(holidays2026);
    assert.ok(result.success);
  });

  it("has all 16 states", () => {
    assert.equal(states.length, 16);
  });

  it("has at least 40 holidays for 2026", () => {
    assert.ok(holidays2026.length >= 40);
  });
});
