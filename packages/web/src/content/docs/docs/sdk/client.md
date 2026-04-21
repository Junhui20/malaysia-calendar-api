---
title: Client Usage
description: All SDK methods with runnable TypeScript examples.
---

The SDK never throws. Every async method returns a `Result<T>`. This means no try/catch, and the compiler forces you to handle errors before accessing data.

## Check a single date

```ts
import { MyCalClient } from "@catlabtech/mycal-sdk";

const cal = new MyCalClient();

const result = await cal.check("2026-03-21", "selangor");

if (result.success) {
  console.log(result.data.isWorkingDay);    // false
  console.log(result.data.holidays[0].name.en); // "Eid al-Fitr"
} else {
  console.error(result.error.code, result.error.message);
}
```

## List holidays

```ts
const result = await cal.holidays({
  year: 2026,
  state: "kl",       // aliases are OK
  type: "federal",
});

if (result.success) {
  for (const holiday of result.data) {
    console.log(holiday.date, holiday.name.en);
  }
}
```

## Next holiday

```ts
const next = await cal.holidaysNext({ state: "penang", limit: 3 });
```

## Business days

```ts
// Count
const count = await cal.businessDays("2026-03-01", "2026-03-31", "selangor");
if (count.success) console.log(count.data.businessDays);  // 20

// Add
const added = await cal.addBusinessDays("2026-03-01", 10, "selangor");
if (added.success) console.log(added.data.resultDate);    // "2026-03-16"
```

## School calendar

```ts
const terms = await cal.schoolTerms({ year: 2026, group: "B" });
const holidays = await cal.schoolHolidays({ year: 2026, state: "selangor" });
const exams = await cal.exams({ year: 2026, type: "spm" });
const status = await cal.isSchoolDay("2026-03-21", { state: "selangor" });
```

## States

```ts
const allStates = await cal.states();
const resolved = await cal.resolveState("kl");
// { canonical: "kuala-lumpur", group: "B", ... }
```

## iCal URL

`icalUrl` is a sync helper — it just formats the URL, doesn't fetch:

```ts
const url = cal.icalUrl("selangor", 2026);
// → "https://.../v1/feed/ical/selangor?year=2026"
```

## Handling errors globally

If you prefer a central error handler, wrap the client:

```ts
async function unwrap<T>(p: Promise<Result<T>>): Promise<T> {
  const r = await p;
  if (!r.success) {
    throw new Error(`${r.error.code}: ${r.error.message}`);
  }
  return r.data;
}

// Usage
const holidays = await unwrap(cal.holidays({ year: 2026 }));
```

This trades the Result pattern for classic exceptions — pick whichever fits your codebase.
