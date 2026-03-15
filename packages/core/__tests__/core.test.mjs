import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import {
  resolveStateCode,
  getStatesByGroup,
  isWeekend,
  getDayOfWeekName,
  nextWorkingDay,
  calculateReplacementHolidays,
  filterHolidays,
  findHolidaysByDate,
  findNextHoliday,
  countBusinessDays,
  findSchoolHolidayByDate,
  statesFileSchema,
  holidayFileSchema,
} from "../dist/index.js";

const __dirname2 = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname2, "../../../data");

const states = JSON.parse(readFileSync(resolve(DATA_DIR, "states.json"), "utf-8"));
const holidays2026 = JSON.parse(readFileSync(resolve(DATA_DIR, "holidays/2026.json"), "utf-8"));
const schoolHolidays = JSON.parse(readFileSync(resolve(DATA_DIR, "school/holidays-2026.json"), "utf-8"));

describe("state-resolver", () => {
  it("resolves by canonical code", () => {
    assert.equal(resolveStateCode("selangor", states)?.code, "selangor");
  });
  it("resolves by alias", () => {
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
    assert.equal(groupA.length, 3);
    assert.ok(groupA.map(s => s.code).includes("kedah"));
  });
});

describe("weekend", () => {
  const sel = states.find(s => s.code === "selangor");
  const kel = states.find(s => s.code === "kelantan");
  it("Sat/Sun weekend for Selangor (Group B)", () => {
    assert.equal(isWeekend("2026-03-21", sel), true);  // Sat
    assert.equal(isWeekend("2026-03-22", sel), true);  // Sun
    assert.equal(isWeekend("2026-03-23", sel), false);  // Mon
  });
  it("Fri/Sat weekend for Kelantan (Group A)", () => {
    assert.equal(isWeekend("2026-03-20", kel), true);  // Fri
    assert.equal(isWeekend("2026-03-21", kel), true);  // Sat
    assert.equal(isWeekend("2026-03-22", kel), false);  // Sun = working
  });
  it("day name", () => {
    assert.equal(getDayOfWeekName("2026-08-31"), "Monday");
  });
  it("next working day skips weekends + holidays", () => {
    const hd = new Set(["2026-03-23"]);
    assert.equal(nextWorkingDay("2026-03-22", sel, hd), "2026-03-24");
  });
});

describe("replacement", () => {
  it("creates replacement for weekend holiday", () => {
    const sel = states.find(s => s.code === "selangor");
    const reps = calculateReplacementHolidays(holidays2026, sel);
    const raya = reps.find(r => r.isReplacementFor === "2026-hari-raya-aidilfitri-1");
    assert.ok(raya, "Hari Raya Sat should have replacement");
    assert.equal(raya.type, "replacement");
  });
});

describe("filter", () => {
  it("filters by type", () => {
    const islamic = filterHolidays(holidays2026, { type: "islamic" });
    assert.ok(islamic.length > 0);
    assert.ok(islamic.every(h => h.type === "islamic"));
  });
  it("filters by state", () => {
    const sabah = filterHolidays(holidays2026, { state: "sabah" });
    assert.ok(sabah.some(h => h.name.en.includes("Kaamatan")));
    assert.ok(!sabah.some(h => h.name.en.includes("Gawai")));
  });
  it("finds by date", () => {
    const r = findHolidaysByDate("2026-08-31", holidays2026);
    assert.ok(r.some(h => h.name.en === "National Day"));
  });
  it("finds next holiday", () => {
    const next = findNextHoliday("2026-12-20", holidays2026);
    assert.ok(next.length > 0);
    assert.ok(next[0].date >= "2026-12-21");
  });
});

describe("business-days", () => {
  const sel = states.find(s => s.code === "selangor");
  it("counts Mon-Fri as 5 business days", () => {
    const r = countBusinessDays("2026-07-13", "2026-07-17", sel, holidays2026);
    assert.equal(r.businessDays, 5);
  });
  it("excludes weekends", () => {
    const r = countBusinessDays("2026-07-13", "2026-07-19", sel, holidays2026);
    assert.equal(r.totalDays, 7);
    assert.equal(r.weekendDays, 2);
    assert.equal(r.businessDays, 5);
  });
});

describe("school", () => {
  it("detects school holiday", () => {
    const h = findSchoolHolidayByDate("2026-05-25", schoolHolidays, "B");
    assert.ok(h);
    assert.equal(h.type, "cuti_pertengahan");
  });
  it("Sarawak excluded from Deepavali Nov 10", () => {
    const sel = findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "selangor");
    assert.ok(sel, "Selangor has Nov 10 KPM cuti");
    const swk = findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "sarawak");
    assert.equal(swk, null, "Sarawak excluded");
  });
});

describe("data integrity", () => {
  it("states.json schema valid", () => {
    assert.ok(statesFileSchema.safeParse(states).success);
  });
  it("holidays/2026.json schema valid", () => {
    assert.ok(holidayFileSchema.safeParse(holidays2026).success);
  });
  it("16 states", () => { assert.equal(states.length, 16); });
  it("49 holidays for 2026", () => { assert.equal(holidays2026.length, 49); });
});
