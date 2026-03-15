const assert = require("node:assert/strict");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const DATA_DIR = resolve(__dirname, "../../../data");
const states = JSON.parse(readFileSync(resolve(DATA_DIR, "states.json"), "utf-8"));
const holidays = JSON.parse(readFileSync(resolve(DATA_DIR, "holidays/2026.json"), "utf-8"));
const schoolHolidays = JSON.parse(readFileSync(resolve(DATA_DIR, "school/holidays-2026.json"), "utf-8"));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

async function main() {
  const core = await import("../dist/index.js");

  console.log("\n📋 State Resolver");
  test("resolves selangor", () => {
    assert.equal(core.resolveStateCode("selangor", states)?.code, "selangor");
  });
  test("resolves KL alias", () => {
    assert.equal(core.resolveStateCode("KL", states)?.code, "kuala-lumpur");
  });
  test("resolves penang alias", () => {
    assert.equal(core.resolveStateCode("penang", states)?.code, "pulau-pinang");
  });
  test("resolves jb alias", () => {
    assert.equal(core.resolveStateCode("jb", states)?.code, "johor");
  });
  test("resolves n9 alias", () => {
    assert.equal(core.resolveStateCode("n9", states)?.code, "negeri-sembilan");
  });
  test("resolves kk alias", () => {
    assert.equal(core.resolveStateCode("kk", states)?.code, "sabah");
  });
  test("returns null for unknown", () => {
    assert.equal(core.resolveStateCode("singapore", states), null);
  });
  test("group A = 3 states", () => {
    assert.equal(core.getStatesByGroup("A", states).length, 3);
  });

  console.log("\n📋 Weekend");
  const sel = states.find(s => s.code === "selangor");
  const kel = states.find(s => s.code === "kelantan");
  test("Sat weekend Selangor", () => { assert.equal(core.isWeekend("2026-03-21", sel), true); });
  test("Sun weekend Selangor", () => { assert.equal(core.isWeekend("2026-03-22", sel), true); });
  test("Mon NOT weekend Selangor", () => { assert.equal(core.isWeekend("2026-03-23", sel), false); });
  test("Fri weekend Kelantan", () => { assert.equal(core.isWeekend("2026-03-20", kel), true); });
  test("Sat weekend Kelantan", () => { assert.equal(core.isWeekend("2026-03-21", kel), true); });
  test("Sun NOT weekend Kelantan", () => { assert.equal(core.isWeekend("2026-03-22", kel), false); });
  test("day name Aug 31 = Monday", () => { assert.equal(core.getDayOfWeekName("2026-08-31"), "Monday"); });
  test("nextWorkingDay skips weekend+holiday", () => {
    assert.equal(core.nextWorkingDay("2026-03-22", sel, new Set(["2026-03-23"])), "2026-03-24");
  });

  console.log("\n📋 Replacement Holidays");
  test("Hari Raya Sat gets replacement", () => {
    const reps = core.calculateReplacementHolidays(holidays, sel);
    const raya = reps.find(r => r.isReplacementFor === "2026-hari-raya-aidilfitri-1");
    assert.ok(raya, "Should create replacement");
    assert.equal(raya.type, "replacement");
  });

  console.log("\n📋 Filter");
  test("filter type=islamic", () => {
    const r = core.filterHolidays(holidays, { type: "islamic" });
    assert.ok(r.length > 0);
    assert.ok(r.every(h => h.type === "islamic"));
  });
  test("sabah has Kaamatan, no Gawai", () => {
    const r = core.filterHolidays(holidays, { state: "sabah" });
    assert.ok(r.some(h => h.name.en.includes("Kaamatan")));
    assert.ok(!r.some(h => h.name.en.includes("Gawai")));
  });
  test("Aug 31 = National Day", () => {
    const r = core.findHolidaysByDate("2026-08-31", holidays);
    assert.ok(r.some(h => h.name.en === "National Day"));
  });
  test("next after Dec 20", () => {
    const r = core.findNextHoliday("2026-12-20", holidays);
    assert.ok(r.length > 0);
  });

  console.log("\n📋 Business Days");
  test("Mon-Fri = 5 biz days", () => {
    const r = core.countBusinessDays("2026-07-13", "2026-07-17", sel, holidays);
    assert.equal(r.businessDays, 5);
  });
  test("full week = 7 total, 2 weekend, 5 biz", () => {
    const r = core.countBusinessDays("2026-07-13", "2026-07-19", sel, holidays);
    assert.equal(r.totalDays, 7);
    assert.equal(r.weekendDays, 2);
    assert.equal(r.businessDays, 5);
  });

  console.log("\n📋 School");
  test("May 25 = cuti pertengahan", () => {
    const h = core.findSchoolHolidayByDate("2026-05-25", schoolHolidays, "B");
    assert.ok(h);
    assert.equal(h.type, "cuti_pertengahan");
  });
  test("Sarawak excluded from Nov 10 Deepavali KPM", () => {
    assert.ok(core.findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "selangor"));
    assert.equal(core.findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "sarawak"), null);
  });

  console.log("\n📋 Data Integrity");
  test("states.json schema valid", () => { assert.ok(core.statesFileSchema.safeParse(states).success); });
  test("holidays/2026 schema valid", () => { assert.ok(core.holidayFileSchema.safeParse(holidays).success); });
  test("16 states", () => { assert.equal(states.length, 16); });
  test("49 holidays for 2026", () => { assert.equal(holidays.length, 49); });

  console.log(`\n${"─".repeat(40)}`);
  console.log(`Total: ${passed + failed} | ✅ ${passed} | ❌ ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
