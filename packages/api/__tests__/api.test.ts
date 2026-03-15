/**
 * Integration tests for the Malaysia Calendar API.
 *
 * Run: cd packages/api && npx tsx __tests__/api.test.ts
 *
 * These test the Hono app directly (no network), using app.request().
 */

import assert from "node:assert/strict";
import app from "../src/index.js";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

async function fetchJson(path: string): Promise<{ status: number; body: any }> {
  const handler = (app as any).fetch;
  const res = await handler(new Request(`http://localhost${path}`));
  // Follow redirects manually
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    if (location) {
      const redirectRes = await handler(new Request(new URL(location, `http://localhost${path}`)));
      const body = await redirectRes.json();
      return { status: redirectRes.status, body };
    }
  }
  const body = await res.json();
  return { status: res.status, body };
}

async function fetchRaw(path: string): Promise<{ status: number; text: string; headers: Headers }> {
  const handler = (app as any).fetch;
  const res = await handler(new Request(`http://localhost${path}`));
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

async function main() {
  // ─── Root ───
  console.log("\n📋 Root");
  await test("GET / returns API info", async () => {
    const { status, body } = await fetchJson("/v1");
    assert.equal(status, 200);
    assert.equal(body.name, "Malaysia Calendar API");
    assert.ok(body.endpoints);
  });

  // ─── Holidays ───
  console.log("\n📋 Holidays");
  await test("GET /holidays?year=2026 returns holidays", async () => {
    const { status, body } = await fetchJson("/v1/holidays?year=2026");
    assert.equal(status, 200);
    assert.equal(body.meta.year, 2026);
    assert.ok(body.data.length >= 40);
  });

  await test("GET /holidays?year=2026&state=selangor filters by state", async () => {
    const { status, body } = await fetchJson("/v1/holidays?year=2026&state=selangor");
    assert.equal(status, 200);
    assert.ok(body.data.every((h: any) => h.states.includes("*") || h.states.includes("selangor")));
  });

  await test("GET /holidays?year=2026&type=islamic filters by type", async () => {
    const { status, body } = await fetchJson("/v1/holidays?year=2026&type=islamic");
    assert.equal(status, 200);
    assert.ok(body.data.every((h: any) => h.type === "islamic"));
  });

  await test("GET /holidays?year=9999 returns 404", async () => {
    const { status } = await fetchJson("/v1/holidays?year=9999");
    assert.equal(status, 404);
  });

  await test("GET /holidays?state=invalid returns 400", async () => {
    const { status, body } = await fetchJson("/v1/holidays?year=2026&state=invalid");
    assert.equal(status, 400);
    assert.equal(body.error.code, "INVALID_STATE");
  });

  await test("GET /holidays/next returns upcoming", async () => {
    const { status, body } = await fetchJson("/v1/holidays/next?state=selangor");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
  });

  await test("GET /holidays/between requires params", async () => {
    const { status } = await fetchJson("/v1/holidays/between");
    assert.equal(status, 400);
  });

  await test("GET /holidays/between with valid range", async () => {
    const { status, body } = await fetchJson("/v1/holidays/between?start=2026-01-01&end=2026-06-30&state=selangor");
    assert.equal(status, 200);
    assert.ok(body.data.length > 0);
    assert.ok(body.data.every((h: any) => h.date >= "2026-01-01" && h.date <= "2026-06-30"));
  });

  // ─── Check ───
  console.log("\n📋 Check");
  await test("GET /holidays/check returns full date intelligence", async () => {
    const { status, body } = await fetchJson("/v1/holidays/check?date=2026-03-21&state=selangor");
    assert.equal(status, 200);
    const d = body.data;
    assert.equal(d.date, "2026-03-21");
    assert.equal(d.dayOfWeek, "Saturday");
    assert.equal(d.isWeekend, true);
    assert.equal(d.isHoliday, true);
    assert.equal(d.isWorkingDay, false);
    assert.ok(d.holidays.length > 0);
    assert.ok(d.state);
    assert.ok(d.school);
  });

  await test("GET /holidays/check rejects missing date", async () => {
    const { status } = await fetchJson("/v1/holidays/check?state=selangor");
    assert.equal(status, 400);
  });

  await test("GET /holidays/check rejects missing state", async () => {
    const { status } = await fetchJson("/v1/holidays/check?date=2026-03-21");
    assert.equal(status, 400);
  });

  await test("GET /holidays/check accepts alias KL", async () => {
    const { status, body } = await fetchJson("/v1/holidays/check?date=2026-02-01&state=KL");
    assert.equal(status, 200);
    assert.equal(body.data.state.code, "kuala-lumpur");
    assert.equal(body.data.isHoliday, true); // Federal Territory Day + Thaipusam
  });

  // ─── States ───
  console.log("\n📋 States");
  await test("GET /states returns 16 states", async () => {
    const { status, body } = await fetchJson("/v1/states");
    assert.equal(status, 200);
    assert.equal(body.meta.total, 16);
  });

  await test("GET /states/resolve?q=penang resolves alias", async () => {
    const { status, body } = await fetchJson("/v1/states/resolve?q=penang");
    assert.equal(status, 200);
    assert.equal(body.data.canonical, "pulau-pinang");
  });

  await test("GET /states/resolve?q=xyz gives suggestions", async () => {
    const { status, body } = await fetchJson("/v1/states/resolve?q=xyz");
    assert.equal(status, 404);
    assert.equal(body.error.code, "STATE_NOT_FOUND");
  });

  // ─── Business Days ───
  console.log("\n📋 Business Days");
  await test("GET /business-days counts correctly", async () => {
    const { status, body } = await fetchJson("/v1/business-days?start=2026-07-13&end=2026-07-17&state=selangor");
    assert.equal(status, 200);
    assert.equal(body.data.businessDays, 5);
    assert.equal(body.data.totalDays, 5);
  });

  await test("GET /business-days/add calculates result date", async () => {
    const { status, body } = await fetchJson("/v1/business-days/add?date=2026-07-17&days=1&state=selangor");
    assert.equal(status, 200);
    assert.equal(body.data.resultDate, "2026-07-20"); // skip weekend → Monday
  });

  await test("GET /business-days requires all params", async () => {
    const { status } = await fetchJson("/v1/business-days?start=2026-01-01&end=2026-01-31");
    assert.equal(status, 400);
  });

  // ─── School ───
  console.log("\n📋 School");
  await test("GET /school/terms returns terms", async () => {
    const { status, body } = await fetchJson("/v1/school/terms?year=2026&group=B");
    assert.equal(status, 200);
    assert.ok(body.data.length > 0);
    assert.ok(body.data.every((t: any) => t.group === "B"));
  });

  await test("GET /school/holidays returns school holidays", async () => {
    const { status, body } = await fetchJson("/v1/school/holidays?year=2026&state=selangor");
    assert.equal(status, 200);
    assert.ok(body.data.length > 0);
  });

  await test("GET /school/exams returns exams", async () => {
    const { status, body } = await fetchJson("/v1/school/exams?year=2026");
    assert.equal(status, 200);
    assert.ok(body.data.length >= 3);
  });

  await test("GET /school/exams?type=spm filters by type", async () => {
    const { status, body } = await fetchJson("/v1/school/exams?year=2026&type=spm");
    assert.equal(status, 200);
    assert.ok(body.data.every((e: any) => e.type === "spm"));
  });

  await test("GET /school/is-school-day checks correctly", async () => {
    const { status, body } = await fetchJson("/v1/school/is-school-day?date=2026-03-21&state=selangor");
    assert.equal(status, 200);
    assert.equal(body.data.isSchoolDay, false); // Saturday + holiday
    assert.equal(body.data.isWeekend, true);
  });

  // ─── Feeds ───
  console.log("\n📋 Feeds");
  await test("GET /feed/ical/selangor returns iCal", async () => {
    const { status, text, headers } = await fetchRaw("/v1/feed/ical/selangor");
    assert.equal(status, 200);
    assert.ok(text.includes("BEGIN:VCALENDAR"));
    assert.ok(text.includes("BEGIN:VEVENT"));
    assert.ok(headers.get("content-type")?.includes("text/calendar"));
  });

  await test("GET /feed/rss returns RSS XML", async () => {
    const { status, text } = await fetchRaw("/v1/feed/rss");
    assert.equal(status, 200);
    assert.ok(text.includes("<rss"));
  });

  // ─── Changelog ───
  console.log("\n📋 Changelog");
  await test("GET /changelog returns entries", async () => {
    const { status, body } = await fetchJson("/v1/changelog");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
  });

  // ─── Long Weekends ───
  console.log("\n📋 Long Weekends");
  await test("GET /holidays/long-weekends returns long weekends", async () => {
    const { status, body } = await fetchJson("/v1/holidays/long-weekends?year=2026&state=selangor");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.every((lw: any) => lw.totalDays >= 3));
  });

  // ─── 404 ───
  console.log("\n📋 Error Handling");
  await test("Unknown route returns 404", async () => {
    const { status, text } = await fetchRaw("/v1/nonexistent");
    assert.equal(status, 404);
    assert.ok(text.includes("NOT_FOUND"));
  });

  // ─── 2025 Data ───
  console.log("\n📋 2025 Data");
  await test("GET /holidays?year=2025 returns 2025 data", async () => {
    const { status, body } = await fetchJson("/v1/holidays?year=2025");
    assert.equal(status, 200);
    assert.ok(body.data.length >= 25);
  });

  // ─── Report ───
  console.log(`\n${"─".repeat(40)}`);
  console.log(`Total: ${passed + failed} | ✅ ${passed} | ❌ ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
