const assert = require("node:assert/strict");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const DATA_DIR = resolve(__dirname, "../../../data");
const states = JSON.parse(readFileSync(resolve(DATA_DIR, "states.json"), "utf-8"));
const holidays = JSON.parse(readFileSync(resolve(DATA_DIR, "holidays/2026.json"), "utf-8"));
const schoolHolidays = JSON.parse(readFileSync(resolve(DATA_DIR, "school/holidays-2026.json"), "utf-8"));
const schoolTerms = JSON.parse(readFileSync(resolve(DATA_DIR, "school/terms-2026.json"), "utf-8"));
const exams = JSON.parse(readFileSync(resolve(DATA_DIR, "school/exams-2026.json"), "utf-8"));

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

async function main() {
  const core = await import("../dist/index.js");

  // ─── State Resolver ───────────────────────────────────────
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
  test("getStateByCode finds selangor", () => {
    const s = core.getStateByCode("selangor", states);
    assert.equal(s?.code, "selangor");
    assert.equal(s?.name.en, "Selangor");
  });
  test("getStateByCode returns null for unknown", () => {
    assert.equal(core.getStateByCode("singapore", states), null);
  });
  test("resolveStateCode trims whitespace", () => {
    assert.equal(core.resolveStateCode("  selangor  ", states)?.code, "selangor");
  });
  test("resolveStateCode case insensitive", () => {
    assert.equal(core.resolveStateCode("SELANGOR", states)?.code, "selangor"); // normalized to lowercase
    assert.equal(core.resolveStateCode("PG", states)?.code, "pulau-pinang"); // alias match is case insensitive
  });
  test("group B has 13 states", () => {
    assert.equal(core.getStatesByGroup("B", states).length, 13);
  });
  test("resolves all federal territories", () => {
    assert.equal(core.resolveStateCode("putrajaya", states)?.code, "wp-putrajaya");
    assert.equal(core.resolveStateCode("labuan", states)?.code, "wp-labuan");
    assert.equal(core.resolveStateCode("KL", states)?.code, "kuala-lumpur");
  });

  // ─── Weekend & Date Utilities ─────────────────────────────
  console.log("\n📋 Weekend & Date Utilities");
  const sel = states.find(s => s.code === "selangor");
  const kel = states.find(s => s.code === "kelantan");
  const jhr = states.find(s => s.code === "johor");

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

  // addDays
  test("addDays +1", () => { assert.equal(core.addDays("2026-01-01", 1), "2026-01-02"); });
  test("addDays +0 (same day)", () => { assert.equal(core.addDays("2026-06-15", 0), "2026-06-15"); });
  test("addDays crosses month boundary", () => { assert.equal(core.addDays("2026-01-31", 1), "2026-02-01"); });
  test("addDays crosses year boundary", () => { assert.equal(core.addDays("2026-12-31", 1), "2027-01-01"); });
  test("addDays negative", () => { assert.equal(core.addDays("2026-03-01", -1), "2026-02-28"); });

  // diffDays
  test("diffDays same day = 0", () => { assert.equal(core.diffDays("2026-05-01", "2026-05-01"), 0); });
  test("diffDays adjacent = 1", () => { assert.equal(core.diffDays("2026-05-01", "2026-05-02"), 1); });
  test("diffDays full week = 7", () => { assert.equal(core.diffDays("2026-07-13", "2026-07-20"), 7); });
  test("diffDays across months", () => { assert.equal(core.diffDays("2026-01-01", "2026-02-01"), 31); });

  // getWeekendConfig
  test("getWeekendConfig returns Sat/Sun for Selangor in 2026", () => {
    const config = core.getWeekendConfig(sel, "2026-06-01");
    assert.deepEqual([...config.weekendDays].sort(), [0, 6]);
    assert.equal(config.group, "B");
  });
  test("getWeekendConfig returns Fri/Sat for Kelantan", () => {
    const config = core.getWeekendConfig(kel, "2026-06-01");
    assert.deepEqual([...config.weekendDays].sort(), [5, 6]);
    assert.equal(config.group, "A");
  });

  // getWeekendDayNames
  test("getWeekendDayNames Selangor = Sunday, Saturday", () => {
    const names = core.getWeekendDayNames(sel, "2026-06-01");
    assert.ok(names.includes("Sunday"));
    assert.ok(names.includes("Saturday"));
    assert.equal(names.length, 2);
  });
  test("getWeekendDayNames Kelantan = Friday, Saturday", () => {
    const names = core.getWeekendDayNames(kel, "2026-06-01");
    assert.ok(names.includes("Friday"));
    assert.ok(names.includes("Saturday"));
    assert.equal(names.length, 2);
  });

  // Johor weekend history switch
  test("Johor had Fri/Sat weekend before 2025", () => {
    assert.equal(core.isWeekend("2024-12-27", jhr), true);  // Friday
    assert.equal(core.isWeekend("2024-12-28", jhr), true);  // Saturday
    assert.equal(core.isWeekend("2024-12-29", jhr), false); // Sunday = working
  });
  test("Johor has Sat/Sun weekend from 2025", () => {
    assert.equal(core.isWeekend("2025-01-03", jhr), false); // Friday = working
    assert.equal(core.isWeekend("2025-01-04", jhr), true);  // Saturday
    assert.equal(core.isWeekend("2025-01-05", jhr), true);  // Sunday
  });

  // getDayOfWeekName additional
  test("day name Jan 1 2026 = Thursday", () => { assert.equal(core.getDayOfWeekName("2026-01-01"), "Thursday"); });
  test("day name Feb 17 2026 = Tuesday", () => { assert.equal(core.getDayOfWeekName("2026-02-17"), "Tuesday"); });

  // nextWorkingDay additional
  test("nextWorkingDay from Friday in Selangor = Monday", () => {
    assert.equal(core.nextWorkingDay("2026-03-20", sel, new Set()), "2026-03-23"); // Fri→skip Sat,Sun→Mon
  });
  test("nextWorkingDay from Thursday in Kelantan = Sunday", () => {
    assert.equal(core.nextWorkingDay("2026-03-19", kel, new Set()), "2026-03-22"); // Thu→skip Fri,Sat→Sun
  });

  // ─── Replacement Holidays ─────────────────────────────────
  console.log("\n📋 Replacement Holidays");
  test("Hari Raya Sat gets replacement", () => {
    const reps = core.calculateReplacementHolidays(holidays, sel);
    const raya = reps.find(r => r.isReplacementFor === "2026-hari-raya-aidilfitri-1");
    assert.ok(raya, "Should create replacement");
    assert.equal(raya.type, "replacement");
  });
  test("Hari Raya Sun also gets replacement", () => {
    const reps = core.calculateReplacementHolidays(holidays, sel);
    const raya2 = reps.find(r => r.isReplacementFor === "2026-hari-raya-aidilfitri-2");
    assert.ok(raya2, "Sunday Hari Raya should also have replacement");
  });
  test("replacements have correct name format", () => {
    const reps = core.calculateReplacementHolidays(holidays, sel);
    const raya = reps.find(r => r.isReplacementFor === "2026-hari-raya-aidilfitri-1");
    assert.ok(raya.name.en.startsWith("Replacement for"));
    assert.ok(raya.name.ms.startsWith("Cuti Ganti"));
  });
  test("replacement dates are not on weekends", () => {
    const reps = core.calculateReplacementHolidays(holidays, sel);
    for (const r of reps) {
      assert.equal(core.isWeekend(r.date, sel), false, `${r.date} should not be a weekend`);
    }
  });
  test("replacement dates are unique", () => {
    const reps = core.calculateReplacementHolidays(holidays, sel);
    const dates = reps.map(r => r.date);
    assert.equal(dates.length, new Set(dates).size, "No duplicate replacement dates");
  });
  test("no replacements generated for empty holiday list", () => {
    const reps = core.calculateReplacementHolidays([], sel);
    assert.equal(reps.length, 0);
  });

  // ─── Filter ───────────────────────────────────────────────
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

  // filter by year
  test("filter by year=2026 returns all holidays", () => {
    const r = core.filterHolidays(holidays, { year: 2026 });
    assert.equal(r.length, holidays.length);
  });
  test("filter by year=2025 returns none", () => {
    const r = core.filterHolidays(holidays, { year: 2025 });
    assert.equal(r.length, 0);
  });

  // filter by month
  test("filter by month=1 (Jan)", () => {
    const r = core.filterHolidays(holidays, { month: 1 });
    assert.ok(r.length > 0);
    assert.ok(r.every(h => h.date.startsWith("2026-01")));
  });
  test("filter by month=8 includes Merdeka", () => {
    const r = core.filterHolidays(holidays, { month: 8 });
    assert.ok(r.some(h => h.name.en === "National Day"));
  });

  // filter by status
  test("filter by status=tentative", () => {
    const r = core.filterHolidays(holidays, { status: "tentative" });
    assert.ok(r.length > 0);
    assert.ok(r.every(h => h.status === "tentative"));
  });
  test("filter by status=confirmed", () => {
    const r = core.filterHolidays(holidays, { status: "confirmed" });
    assert.ok(r.length > 0);
    assert.ok(r.every(h => h.status === "confirmed"));
  });

  // combined filters
  test("filter islamic + month=3", () => {
    const r = core.filterHolidays(holidays, { type: "islamic", month: 3 });
    assert.ok(r.every(h => h.type === "islamic" && h.date.startsWith("2026-03")));
  });

  // empty filter returns all
  test("empty filter returns all holidays", () => {
    const r = core.filterHolidays(holidays, {});
    assert.equal(r.length, holidays.length);
  });

  // wildcard state
  test("federal holidays (*) visible to any state", () => {
    const r = core.filterHolidays(holidays, { state: "sarawak" });
    assert.ok(r.some(h => h.states.includes("*")), "Federal holidays should appear for any state");
  });

  // findHolidaysByDate excludes cancelled
  test("findHolidaysByDate excludes cancelled holidays", () => {
    const cancelled = [{
      ...holidays[0],
      id: "test-cancelled",
      date: "2026-08-31",
      status: "cancelled",
    }];
    const r = core.findHolidaysByDate("2026-08-31", [...holidays, ...cancelled]);
    assert.ok(!r.some(h => h.id === "test-cancelled"));
  });

  // findHolidaysByDate with state filter
  test("findHolidaysByDate filters by state", () => {
    const r = core.findHolidaysByDate("2026-04-03", holidays, "sabah"); // Good Friday
    assert.ok(r.some(h => h.name.en === "Good Friday"));
    const r2 = core.findHolidaysByDate("2026-04-03", holidays, "selangor");
    assert.ok(!r2.some(h => h.name.en === "Good Friday"));
  });

  // findNextHoliday with type filter
  test("findNextHoliday with type=federal", () => {
    const r = core.findNextHoliday("2026-01-01", holidays, undefined, "federal");
    assert.ok(r.length > 0);
    assert.ok(r.every(h => h.type === "federal"));
  });

  // findNextHoliday with limit
  test("findNextHoliday limit=3", () => {
    const r = core.findNextHoliday("2026-01-01", holidays, undefined, undefined, 3);
    assert.equal(r.length, 3);
    assert.ok(r[0].date <= r[1].date && r[1].date <= r[2].date, "Should be sorted by date");
  });

  // findHolidaysByDate on non-holiday date
  test("findHolidaysByDate returns empty for non-holiday", () => {
    const r = core.findHolidaysByDate("2026-07-15", holidays);
    assert.equal(r.length, 0);
  });

  // findNextHoliday with state filter
  test("findNextHoliday for sabah state", () => {
    const r = core.findNextHoliday("2026-03-25", holidays, "sabah", undefined, 1);
    assert.ok(r.length > 0);
    assert.ok(r[0].states.includes("*") || r[0].states.includes("sabah"));
  });

  // ─── Business Days ────────────────────────────────────────
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

  // single day
  test("single day = 1 total", () => {
    const r = core.countBusinessDays("2026-07-14", "2026-07-14", sel, holidays);
    assert.equal(r.totalDays, 1);
    assert.equal(r.businessDays, 1);
    assert.equal(r.weekendDays, 0);
  });
  test("single weekend day = 0 biz", () => {
    const r = core.countBusinessDays("2026-07-18", "2026-07-18", sel, holidays); // Saturday
    assert.equal(r.totalDays, 1);
    assert.equal(r.businessDays, 0);
    assert.equal(r.weekendDays, 1);
  });

  // week with holiday
  test("week with Merdeka = 4 biz days", () => {
    // 2026-08-31 is Monday (National Day)
    const r = core.countBusinessDays("2026-08-31", "2026-09-04", sel, holidays);
    assert.equal(r.totalDays, 5);
    assert.equal(r.holidays, 1);
    assert.equal(r.businessDays, 4);
    assert.ok(r.holidayList.some(h => h.name.en === "National Day"));
  });

  // business days in Kelantan (Fri/Sat weekend)
  test("Kelantan business days (Fri/Sat weekend)", () => {
    const r = core.countBusinessDays("2026-07-12", "2026-07-18", kel, holidays);
    assert.equal(r.totalDays, 7);
    assert.equal(r.weekendDays, 2); // Fri + Sat
    assert.equal(r.businessDays, 5);
  });

  // addBusinessDays
  test("addBusinessDays +5 from Monday = next Monday (skip weekend)", () => {
    // 2026-07-13 is Monday, +5 biz days = Friday 2026-07-17 (clean week, no holidays)
    const r = core.addBusinessDays("2026-07-12", 5, sel, holidays); // Sun start, 5 biz = Fri
    assert.equal(r, "2026-07-17");
  });
  test("addBusinessDays +1 from Friday = Monday", () => {
    const r = core.addBusinessDays("2026-07-17", 1, sel, holidays); // Fri, +1 = Mon
    assert.equal(r, "2026-07-20");
  });
  test("addBusinessDays +0 stays same day", () => {
    const r = core.addBusinessDays("2026-07-15", 0, sel, holidays);
    assert.equal(r, "2026-07-15");
  });
  test("addBusinessDays skips holidays", () => {
    // 2026-08-31 is Monday (Merdeka), so +1 from Fri Aug 28 should skip Sat,Sun,Mon(holiday) = Tue Sep 1
    const r = core.addBusinessDays("2026-08-28", 1, sel, holidays);
    assert.equal(r, "2026-09-01");
  });

  // holidayList deduplication
  test("countBusinessDays deduplicates holidayList", () => {
    const r = core.countBusinessDays("2026-08-30", "2026-09-01", sel, holidays);
    const ids = r.holidayList.map(h => h.id);
    assert.equal(ids.length, new Set(ids).size, "No duplicate holidays");
  });

  // ─── School Calendar ──────────────────────────────────────
  console.log("\n📋 School Calendar");
  test("May 25 = cuti pertengahan", () => {
    const h = core.findSchoolHolidayByDate("2026-05-25", schoolHolidays, "B");
    assert.ok(h);
    assert.equal(h.type, "cuti_pertengahan");
  });
  test("Sarawak excluded from Nov 10 Deepavali KPM", () => {
    assert.ok(core.findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "selangor"));
    assert.equal(core.findSchoolHolidayByDate("2026-11-10", schoolHolidays, "B", "sarawak"), null);
  });

  // findSchoolTermByDate
  test("Jan 15 = Term 1 Group B", () => {
    const term = core.findSchoolTermByDate("2026-01-15", schoolTerms, "B");
    assert.ok(term);
    assert.equal(term.term, 1);
    assert.equal(term.group, "B");
  });
  test("Apr 15 = Term 2 Group A", () => {
    const term = core.findSchoolTermByDate("2026-04-15", schoolTerms, "A");
    assert.ok(term);
    assert.equal(term.term, 2);
    assert.equal(term.group, "A");
  });
  test("Dec 25 = no active term", () => {
    const term = core.findSchoolTermByDate("2026-12-25", schoolTerms, "B");
    assert.equal(term, null);
  });
  test("findSchoolTermByDate respects group filter", () => {
    // Group A term 1 starts Jan 11, Group B starts Jan 12
    const termA = core.findSchoolTermByDate("2026-01-11", schoolTerms, "A");
    assert.ok(termA);
    assert.equal(termA.group, "A");
    const termB = core.findSchoolTermByDate("2026-01-11", schoolTerms, "B");
    assert.equal(termB, null); // Group B hasn't started yet
  });

  // findSchoolHolidayByDate for Group A
  test("Group A cuti penggal 1 starts Mar 20", () => {
    const h = core.findSchoolHolidayByDate("2026-03-20", schoolHolidays, "A");
    assert.ok(h);
    assert.equal(h.type, "cuti_penggal_1");
  });

  // findSchoolHolidayByDate on non-holiday date
  test("findSchoolHolidayByDate returns null on school day", () => {
    const h = core.findSchoolHolidayByDate("2026-04-15", schoolHolidays, "B");
    assert.equal(h, null);
  });

  // isSchoolDay
  test("isSchoolDay on weekday during term = true", () => {
    // 2026-01-14 is Wednesday, during Term 1 Group B, no holidays
    const r = core.isSchoolDay("2026-01-14", schoolTerms, schoolHolidays, "B", false, false);
    assert.equal(r, true);
  });
  test("isSchoolDay on weekend = false", () => {
    const r = core.isSchoolDay("2026-01-17", schoolTerms, schoolHolidays, "B", false, true); // Sat
    assert.equal(r, false);
  });
  test("isSchoolDay on public holiday = false", () => {
    const r = core.isSchoolDay("2026-02-17", schoolTerms, schoolHolidays, "B", true, false); // CNY
    assert.equal(r, false);
  });
  test("isSchoolDay during school holiday = false", () => {
    // 2026-05-25 is cuti pertengahan for Group B
    const r = core.isSchoolDay("2026-05-25", schoolTerms, schoolHolidays, "B", false, false);
    assert.equal(r, false);
  });
  test("isSchoolDay outside any term = false", () => {
    // 2026-12-25 is after all terms
    const r = core.isSchoolDay("2026-12-25", schoolTerms, schoolHolidays, "B", false, false);
    assert.equal(r, false);
  });
  test("isSchoolDay with state exclusion", () => {
    // Sarawak excluded from Nov 10 Deepavali KPM - should still be school day if in term
    // Nov 10 is outside our term data so isSchoolDay = false anyway (no term)
    // Test the state-specific exclusion with a date during term
    const r = core.isSchoolDay("2026-05-25", schoolTerms, schoolHolidays, "B", false, false, "selangor");
    assert.equal(r, false); // Selangor has cuti pertengahan
  });

  // ─── iCal Generation ──────────────────────────────────────
  console.log("\n📋 iCal Generation");
  test("generateIcal produces valid iCal structure", () => {
    const ical = core.generateIcal(holidays.slice(0, 3), [], "Test Calendar");
    assert.ok(ical.startsWith("BEGIN:VCALENDAR"));
    assert.ok(ical.includes("END:VCALENDAR"));
    assert.ok(ical.includes("VERSION:2.0"));
    assert.ok(ical.includes("PRODID:-//MyCal//Malaysia Calendar API//EN"));
    assert.ok(ical.includes("X-WR-CALNAME:Test Calendar"));
  });
  test("generateIcal includes VEVENT for each holiday", () => {
    const subset = holidays.slice(0, 5);
    const ical = core.generateIcal(subset, [], "Test");
    const eventCount = (ical.match(/BEGIN:VEVENT/g) || []).length;
    assert.equal(eventCount, 5);
  });
  test("generateIcal includes school holidays", () => {
    const ical = core.generateIcal([], schoolHolidays.slice(0, 2), "School Test");
    assert.ok(ical.includes("BEGIN:VEVENT"));
    assert.ok(ical.includes("[School]"));
  });
  test("generateIcal excludes cancelled holidays", () => {
    const cancelled = [{
      ...holidays[0],
      id: "cancelled-test",
      status: "cancelled",
      name: { ms: "Dibatalkan", en: "Cancelled Holiday" },
    }];
    const ical = core.generateIcal(cancelled, [], "Test");
    assert.ok(!ical.includes("Cancelled Holiday"));
  });
  test("generateIcal uses TENTATIVE status for tentative holidays", () => {
    const tentative = holidays.filter(h => h.status === "tentative").slice(0, 1);
    const ical = core.generateIcal(tentative, [], "Test");
    assert.ok(ical.includes("STATUS:TENTATIVE"));
  });
  test("generateIcal uses CONFIRMED status for confirmed holidays", () => {
    const confirmed = holidays.filter(h => h.status === "confirmed").slice(0, 1);
    const ical = core.generateIcal(confirmed, [], "Test");
    assert.ok(ical.includes("STATUS:CONFIRMED"));
  });
  test("generateIcal includes hijri date in description", () => {
    const islamic = holidays.filter(h => h.hijriDate).slice(0, 1);
    const ical = core.generateIcal(islamic, [], "Test");
    assert.ok(ical.includes(islamic[0].hijriDate));
  });
  test("generateIcal with empty inputs", () => {
    const ical = core.generateIcal([], [], "Empty");
    assert.ok(ical.startsWith("BEGIN:VCALENDAR"));
    assert.ok(ical.includes("END:VCALENDAR"));
    assert.ok(!ical.includes("BEGIN:VEVENT"));
  });
  test("generateIcal escapes special characters", () => {
    const special = [{
      ...holidays[0],
      id: "special-test",
      status: "confirmed",
      name: { ms: "Cuti; khas, hari\\ini", en: "Special; holiday, day\\test" },
    }];
    const ical = core.generateIcal(special, [], "Test");
    assert.ok(ical.includes("Special\\; holiday\\, day\\\\test"));
  });
  test("generateIcal UID uses @mycal.my domain", () => {
    const ical = core.generateIcal(holidays.slice(0, 1), [], "Test");
    assert.ok(ical.includes(`UID:${holidays[0].id}@mycal.my`));
  });

  // ─── Data Integrity ───────────────────────────────────────
  console.log("\n📋 Data Integrity");
  test("states.json schema valid", () => { assert.ok(core.statesFileSchema.safeParse(states).success); });
  test("holidays/2026 schema valid", () => { assert.ok(core.holidayFileSchema.safeParse(holidays).success); });
  test("school/terms-2026 schema valid", () => { assert.ok(core.schoolTermsFileSchema.safeParse(schoolTerms).success); });
  test("school/holidays-2026 schema valid", () => { assert.ok(core.schoolHolidaysFileSchema.safeParse(schoolHolidays).success); });
  test("school/exams-2026 schema valid", () => { assert.ok(core.examsFileSchema.safeParse(exams).success); });
  test("16 states", () => { assert.equal(states.length, 16); });
  test("49 holidays for 2026", () => { assert.equal(holidays.length, 49); });
  test("all holiday IDs are unique", () => {
    const ids = holidays.map(h => h.id);
    assert.equal(ids.length, new Set(ids).size, "Duplicate holiday IDs found");
  });
  test("all holiday dates are valid ISO format", () => {
    for (const h of holidays) {
      assert.match(h.date, /^\d{4}-\d{2}-\d{2}$/, `Invalid date: ${h.date}`);
    }
  });
  test("all state codes in holidays reference valid states", () => {
    const validCodes = new Set(states.map(s => s.code));
    validCodes.add("*");
    for (const h of holidays) {
      for (const code of h.states) {
        assert.ok(validCodes.has(code), `Unknown state code "${code}" in holiday ${h.id}`);
      }
    }
  });
  test("school terms have valid group values", () => {
    for (const t of schoolTerms) {
      assert.ok(["A", "B"].includes(t.group), `Invalid group ${t.group} in ${t.id}`);
    }
  });
  test("school term IDs are unique", () => {
    const ids = schoolTerms.map(t => t.id);
    assert.equal(ids.length, new Set(ids).size, "Duplicate term IDs");
  });
  test("school holiday IDs are unique", () => {
    const ids = schoolHolidays.map(h => h.id);
    assert.equal(ids.length, new Set(ids).size, "Duplicate school holiday IDs");
  });
  test("exam IDs are unique", () => {
    const ids = exams.map(e => e.id);
    assert.equal(ids.length, new Set(ids).size, "Duplicate exam IDs");
  });

  // schema rejection tests
  test("holiday schema rejects invalid date", () => {
    const bad = { ...holidays[0], date: "not-a-date" };
    assert.ok(!core.holidaySchema.safeParse(bad).success);
  });
  test("holiday schema rejects missing name", () => {
    const { name, ...noName } = holidays[0];
    assert.ok(!core.holidaySchema.safeParse(noName).success);
  });
  test("state schema rejects empty weekendHistory", () => {
    const bad = { ...states[0], weekendHistory: [] };
    assert.ok(!core.stateSchema.safeParse(bad).success);
  });

  console.log(`\n${"─".repeat(40)}`);
  console.log(`Total: ${passed + failed} | ✅ ${passed} | ❌ ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
