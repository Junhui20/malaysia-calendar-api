# @catlabtech/mycal-sdk

TypeScript client SDK for the **Malaysia Calendar API** — public holidays, school calendar, exam schedules, and business day calculator for all 16 states + 3 Federal Territories.

> Data sourced from the official Malaysian government gazette (JPM BKPP), JAKIM, KPM, and MPM.

## Install

```bash
npm install @catlabtech/mycal-sdk
# or
pnpm add @catlabtech/mycal-sdk
```

Node 18+. ESM only. Uses platform `fetch`.

## Quick start

```ts
import { MyCalClient } from "@catlabtech/mycal-sdk";

const cal = new MyCalClient();

// Is March 21, 2026 a working day in Selangor?
const result = await cal.check("2026-03-21", "selangor");

if (result.success) {
  console.log(result.data.isWorkingDay);       // false (it's Hari Raya Aidilfitri)
  console.log(result.data.holidays[0].name.en); // "Eid al-Fitr"
} else {
  console.error(result.error.code, result.error.message);
}
```

No signup, no API key. The client defaults to the public production API.

## Why a Result pattern?

Every async method returns `Result<T>` — a tagged union of success or error. The compiler forces you to handle errors before accessing data, which means no forgotten `try/catch`, no unexpected exceptions.

```ts
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; status: number } };
```

If you prefer classic exceptions, wrap the client with a one-line `unwrap()` helper (example in docs).

## What you get

### Holidays

```ts
await cal.holidays({ year: 2026, state: "kl" });            // list
await cal.holidaysToday("selangor");                        // today's status
await cal.holidaysNext({ state: "penang", limit: 3 });      // next N upcoming
await cal.holidaysBetween("2026-03-01", "2026-03-31", "kl"); // range
await cal.check("2026-03-21", "selangor");                  // single date
```

### Business days (state-aware)

```ts
await cal.businessDays("2026-03-01", "2026-03-31", "selangor");
await cal.addBusinessDays("2026-03-01", 10, "selangor");
```

Respects Kumpulan A (Kedah/Kelantan/Terengganu use Fri–Sat) vs Kumpulan B weekends, plus state-level public holidays.

### School calendar

```ts
await cal.schoolTerms({ year: 2026, group: "B" });
await cal.schoolHolidays({ year: 2026, state: "selangor" });
await cal.exams({ year: 2026, type: "spm" });
await cal.isSchoolDay("2026-03-21", { state: "selangor" });
```

### States

```ts
await cal.states();                       // all 16 states + 3 FTs
await cal.resolveState("kl");             // alias → canonical code
```

### iCal feed URL

```ts
cal.icalUrl("selangor", 2026);            // formatted URL for subscription
```

## Features

- **16 states + 3 Federal Territories** with correct weekend config
- **Smart aliases** — `kl`, `jb`, `penang`, `n9`, `kk` — all auto-resolve
- **Cuti ganti** — replacement holidays auto-calculated
- **Trilingual** — every holiday has Bahasa Melayu, English, and Chinese (中文) names
- **Gazette references** — every record links back to the official Warta Kerajaan
- **Islamic calendar** — Hijri dates from JAKIM Takwim
- **School calendar** — KPM terms, cuti penggal, cuti perayaan for Kumpulan A and B
- **Exam dates** — SPM, STPM, MUET, PT3

## Documentation

Full API reference, examples, and guides: **[https://mycal-web.pages.dev/docs](https://mycal-web.pages.dev/docs)**

Try the interactive demo: **[https://mycal-web.pages.dev/demo](https://mycal-web.pages.dev/demo)**

## Related packages

- **[`@catlabtech/mycal-mcp-server`](https://www.npmjs.com/package/@catlabtech/mycal-mcp-server)** — MCP server exposing 12 tools for Claude, ChatGPT, and other AI agents
- **[`@catlabtech/mycal-core`](https://www.npmjs.com/package/@catlabtech/mycal-core)** — shared types and schemas

## License

MIT — © catlab.tech

Issues and contributions: [github.com/Junhui20/malaysia-calendar-api](https://github.com/Junhui20/malaysia-calendar-api)
