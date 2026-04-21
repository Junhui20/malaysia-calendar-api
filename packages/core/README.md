# @catlabtech/mycal-core

Shared types, Zod schemas, and business logic for the **Malaysia Calendar API**. This is the underlying library used by [`@catlabtech/mycal-sdk`](https://www.npmjs.com/package/@catlabtech/mycal-sdk) and [`@catlabtech/mycal-mcp-server`](https://www.npmjs.com/package/@catlabtech/mycal-mcp-server).

> Most users should install the SDK or MCP server instead. Use `@catlabtech/mycal-core` directly only if you need the raw types, schemas, or pure business logic (e.g. for server-side implementations or custom runtimes).

## What's inside

- **TypeScript types** — `Holiday`, `State`, `SchoolTerm`, `SchoolHoliday`, `Exam`, `CheckDateResult`, `BusinessDaysResult`, `LongWeekend`, etc.
- **Zod schemas** — runtime validation matching the types exactly
- **State resolver** — alias → canonical state code (e.g. `kl` → `kuala-lumpur`)
- **Weekend logic** — per-state weekend history including Johor's 2014–2024 Fri–Sat switch
- **Business day calculations** — state-aware, holiday-aware
- **Cuti ganti generator** — replacement holiday logic per state rules
- **iCal generator** — RFC 5545 output with auto-refresh hints
- **School calendar logic** — term / holiday lookups for Kumpulan A and B

## Install

```bash
npm install @catlabtech/mycal-core
```

Node 18+. ESM only.

## Example

```ts
import {
  resolveStateCode,
  countBusinessDays,
  isWeekend,
  type Holiday,
  type State,
} from "@catlabtech/mycal-core";

// Alias resolution
const { canonical } = resolveStateCode("kl", allStates);  // "kuala-lumpur"

// Type-safe filtering
const federal = holidays.filter((h): h is Holiday => h.type === "federal");
```

## Documentation

- **Full docs:** [https://mycal-web.pages.dev/docs](https://mycal-web.pages.dev/docs)
- **Type reference:** [https://mycal-web.pages.dev/docs/sdk/reference](https://mycal-web.pages.dev/docs/sdk/reference)

## License

MIT — © catlab.tech

Issues and contributions: [github.com/Junhui20/malaysia-calendar-api](https://github.com/Junhui20/malaysia-calendar-api)
