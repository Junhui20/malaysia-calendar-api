const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const DATA_DIR = resolve(__dirname, "../../../data");

// Dynamic import for ESM dist
async function loadCore() {
  return await import("../dist/index.js");
}

const states = JSON.parse(readFileSync(resolve(DATA_DIR, "states.json"), "utf-8"));
const holidays2026 = JSON.parse(readFileSync(resolve(DATA_DIR, "holidays/2026.json"), "utf-8"));
const schoolHolidays = JSON.parse(readFileSync(resolve(DATA_DIR, "school/holidays-2026.json"), "utf-8"));

describe("state-resolver", () => {
  it("resolves by canonical code", async () => {
    const { resolveStateCode } = await loadCore();
    assert.equal(resolveStateCode("selangor", states)?.code, "selangor");
  });
  it("resolves aliases: KL, penang, jb, n9, kk", async () => {
    const { resolveStateCode } = await loadCore();
    assert.equal(resolveStateCode("KL", states)?.code, "kuala-lumpur");
    assert.equal(resolveStateCode("penang", states)?.code, "pulau-pinang");
    assert.equal(resolveStateCode("jb", states)?.code, "johor");
    assert.equal(resolveStateCode("n9", states)?.code, "negeri-sembilan");
    assert.equal(resolveStateCode("kk", states)?.code, "sabah");
  });
  it("returns null for unknown", async () => {
    const { resolveStateCode } = await loadCore();
    assert.equal(resolveStateCode("singapore", states), null);
  });
  it("group A has 3 states", async () => {
    const { getStatesByGroup } = await loadCore();
    const a = getStatesByGroup("A", states);
    assert.equal(a.length, 3);
  });
});

describe("weekend", () => {
  it("Sat/Sun weekend for Selangor", async () => {
    const { isWeekend } = await loadCore();
    const sel = states.find(s => s.code === "selangor");
    assert.equal(isWeekend("2026-03-21", sel), true);   // Sat
    assert.equal(isWeekend("2026-03-22", sel), true);   // Sun
    assert.equal(isWeekend("2026-03-23", sel), false);  // Mon
  });
  it("Fri/Sat weekend for Kelantan", async () => {
    const { isWeekend } = await loadCore();
    const kel = states.find(s => s.code === "kelantan");
    assert.equal(isWeekend("2026-03-20", kel), true);   // Fri
    assert.equal(isWeekend("2026-03-21", kel), true);   // Sat
    assert.equal(isWeekend("2026-03-22", kel), false);  // Sun = working
  });
  it("getDayOfWeekName", async () => {
    const { getDayOfWeekName } = await loadCore();
    assert.equal(getDayOfWeekName("2026-08-31"), "Monday");
  });
  it("nextWorkingDay skips weekends + holidays", async () => {
    const { nextWorkingDay } = await loadCore();
    const sel = states.find(s => s.code === "selangor");
    assert.equal(nextWorkingDay("2026-03-22", sel, new Set(["2026-03-23"])), "2026-03-24");
  });
});

describe("replacement", () => {
  it("creates replacement for Hari Raya on Saturday", async () => {
    const { calculateReplacementHolidays } = await loadCore();
    const sel = states.find(s => s.code === "selangor");
    const reps = calculateReplacementHolidays(holidays2026, sel);
    const raya = reps.find(r => r.isReplacementFor === "2026-hari-raya-aidilfitri-1");
    assert.ok(raya, "Should have replacement for Sat Hari Raya");
    assert.equal(raya.type, "replacement");
  });
});

describe("filter", () => {
  it("filters by type=islamic", async () => {
    const { filterHolidays } = await loadCore();
    const r = filterHolidays(holidays2026, { type: "islamic" });
    assert.ok(r.length > 0);
    assert.ok(r.every(h => h.type === "islamic"));
  });
  it("filters by state=sabah includes Kaamatan, excludes Gawai", async () => {
    const { filterHolidays } = await loadCore();
    const r = filterHolidays(holidays2026, { state: "sabah" });
    assert.ok(r.some(h => h.name.en.includes("Kaamatan")));
    assert.ok(!r.some(h => h.name.en.includes("Gawai")));
  });
  it("findHolidaysByDate for Merdeka", async () => {
    const { findHolidaysByDate } = await loadCore();
    const r = findHolidaysByDate("2026-08-31", holidays2026);
    assert.ok(r.some(h => h.name.en === "National Day"));
  });
  it("findNextHoliday after Dec 20", async () => {
    const { findNextHoliday } = await loadCore();
    const r = findNextHoliday("2026-12-20", holidays2026);
    assert.ok(r.length > 0);
  });
});

describe("business-days", () => {
  it("Mon-Fri = 5 business days", async () => {
    const { countBusinessDays } = await loadCore();
    const sel = states.find(s => s.code === "selangor");
    const r = countBusinessDays("2026-07-13", "2026-07-17", sel, holidays2026);
    assert.equal(r.businessDays, 5);
  });
  it("full week = 5 business + 2 weekend", async () => {
    const { countBusinessDays } = await loadCore();
    const sel = states.find(s => s.code === "selangor");
    const r = countBusinessDays("2026-07-13", "2026-07-19", sel, holidays2026);
    assert.equal(r.totalDays, 7);
    assert.equal(r.weekendDays, 2);
    assert.equal(r.businessDays, 5);
  });
});

describe("school", () => {
  it("detects mid-year holiday", async () => {
    const { findSchoolHolidayByDate } = await loadCore();
    const h = findSchoolHolidayByDate("2026-05-25", schoolHolidays, "B");
    assert.ok(h);
    assert.equal(h.type, "cuti_pertengahan");
  });
  it("Sarawak excluded from Deepavali Nov 10", async () => {
    const { findSchoolHolidayByDate } = await loadCore();
    assert.ok(findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "selangor"));
    assert.equal(findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "sarawak"), null);
  });
});

describe("data-integrity", () => {
  it("states.json valid", async () => {
    const { statesFileSchema } = await loadCore();
    assert.ok(statesFileSchema.safeParse(states).success);
  });
  it("holidays/2026.json valid", async () => {
    const { holidayFileSchema } = await loadCore();
    assert.ok(holidayFileSchema.safeParse(holidays2026).success);
  });
  it("16 states", () => { assert.equal(states.length, 16); });
  it("49 holidays", () => { assert.equal(holidays2026.length, 49); });
});
