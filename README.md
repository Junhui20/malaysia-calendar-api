# Malaysia Calendar API

> Malaysia 最完整的日曆 API — 公共假期 + 學校日曆 + 考試時間 + MCP Server

Malaysia's most complete calendar API — public holidays, school calendar, exam schedules, and MCP server for AI tools.

**Data source**: Official government gazette (JPM BKPP), JAKIM, KPM, MPM. Not scraped from third-party websites.

## Features

- **49 public holidays** for 2026 from official gazette (Warta Kerajaan) — federal + state-specific
- **16 states + 3 Federal Territories** with aliases (KL, JB, Penang, etc.)
- **Weekend-aware** — Kedah/Kelantan/Terengganu use Fri-Sat (Kumpulan A), all others use Sat-Sun (Kumpulan B), with Johor's historical switch tracked
- **Cuti ganti** (replacement holiday) auto-calculation per state weekend config
- **Business day calculator** — per-state, holiday-aware
- **School calendar** — terms, holidays, KPM cuti perayaan (Lampiran A/B/C)
- **Exam schedules** — SPM, STPM, MUET, PT3
- **iCal subscription feeds** — per-state `.ics` feeds
- **MCP Server** for AI agents — 12 tools for Claude, ChatGPT, and other assistants
- **TypeScript SDK** (`@mycal/sdk`) with typed responses
- **OpenAPI 3.1 spec** + interactive docs
- **Trilingual** — Bahasa Melayu, English, Chinese names (三语支持)

## Quick Start

```bash
# Clone and install
git clone https://github.com/Junhui20/malaysia-calendar-api.git
cd MalaysiaCalanderApi
pnpm install

# Build core library
pnpm --filter @mycal/core build

# Run API locally
cd packages/api && npx wrangler dev

# Validate data
pnpm validate

# Run tests
pnpm test
```

## API Examples

Base URL: `https://mycal-api.huijun00100101.workers.dev/v1`

### List holidays

```bash
# All holidays for Selangor in 2026
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays?year=2026&state=selangor"

# Islamic holidays only
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays?year=2026&type=islamic"

# March holidays for KL
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays?year=2026&state=KL&month=3"
```

### Check a date

```bash
# Is March 21 a holiday/weekend/working day?
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays/check?date=2026-03-21&state=KL"
```

Response:
```json
{
  "data": {
    "date": "2026-03-21",
    "dayOfWeek": "Saturday",
    "isHoliday": true,
    "isWeekend": true,
    "isWorkingDay": false,
    "isSchoolDay": false,
    "holidays": [
      {
        "id": "2026-hari-raya-aidilfitri-1",
        "name": { "ms": "Hari Raya Aidilfitri", "en": "Eid al-Fitr", "zh": "开斋节" },
        "type": "islamic",
        "status": "confirmed"
      }
    ]
  }
}
```

### Business days

```bash
# Count working days in March for Selangor
curl "https://mycal-api.huijun00100101.workers.dev/v1/business-days?start=2026-03-01&end=2026-03-31&state=selangor"

# Add 10 business days to a date
curl "https://mycal-api.huijun00100101.workers.dev/v1/business-days/add?date=2026-03-01&days=10&state=selangor"
```

### School calendar

```bash
# Is this a school day?
curl "https://mycal-api.huijun00100101.workers.dev/v1/school/is-school-day?date=2026-03-21&state=selangor"

# School holidays for Kumpulan B
curl "https://mycal-api.huijun00100101.workers.dev/v1/school/holidays?year=2026&group=B"

# Exam schedule
curl "https://mycal-api.huijun00100101.workers.dev/v1/school/exams?year=2026&type=spm"
```

### Next holiday

```bash
# Next holiday for Penang
curl "https://mycal-api.huijun00100101.workers.dev/v1/holidays/next?state=penang"
```

### State resolution

```bash
# Resolve alias
curl "https://mycal-api.huijun00100101.workers.dev/v1/states/resolve?q=kl"
# -> { "data": { "canonical": "kuala-lumpur", "group": "B" } }
```

## Full API Reference

| Endpoint | Description |
|----------|-------------|
| `GET /v1/holidays` | List holidays (filter by year, state, type, status, month) |
| `GET /v1/holidays/check` | Is this date a holiday/weekend/working day/school day? |
| `GET /v1/holidays/today` | Today's holiday status |
| `GET /v1/holidays/next` | Next upcoming holiday |
| `GET /v1/holidays/between` | Holidays in date range |
| `GET /v1/business-days` | Count business days between dates |
| `GET /v1/business-days/add` | Add N business days to a date |
| `GET /v1/states` | All 16 states + 3 FTs with weekend config |
| `GET /v1/states/resolve` | Resolve alias (KL, penang, jb) to canonical code |
| `GET /v1/school/terms` | School term dates + day counts |
| `GET /v1/school/holidays` | School holidays + KPM cuti perayaan |
| `GET /v1/school/exams` | SPM, STPM, MUET, PT3 schedule |
| `GET /v1/school/is-school-day` | Is this a school day? |
| `GET /v1/feed/ical/:state` | iCal subscription feed |

See the full [OpenAPI 3.1 spec](./openapi.yaml) for request/response schemas.

## SDK Usage

```typescript
import { MyCalClient } from "@mycal/sdk";

const cal = new MyCalClient();

// Check if a date is a working day
const result = await cal.check("2026-03-21", "selangor");
console.log(result.isWorkingDay); // false

// List holidays
const holidays = await cal.holidays({ year: 2026, state: "KL" });

// Business days
const workDays = await cal.businessDays("2026-03-01", "2026-03-31", "selangor");
console.log(workDays.businessDays); // 22

// School calendar
const terms = await cal.school.terms({ year: 2026, group: "B" });
const exams = await cal.school.exams({ year: 2026, type: "spm" });
const isSchool = await cal.school.isSchoolDay("2026-03-21", "selangor");
```

## MCP Server

Connect the Malaysia Calendar API to Claude, ChatGPT, or any MCP-compatible AI assistant.

### Setup with Claude Desktop / Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "malaysia-calendar": {
      "command": "npx",
      "args": ["@mycal/mcp-server"]
    }
  }
}
```

### Available Tools (12)

| Tool | Description |
|------|-------------|
| `get_malaysia_holidays` | Get public holidays (filter by year, state, type) |
| `check_malaysia_holiday` | Check if a date is a holiday or working day |
| `next_malaysia_holiday` | Find the next upcoming holiday |
| `malaysia_business_days` | Count working days between two dates |
| `malaysia_long_weekends` | Find long weekends (3+ days) |
| `list_malaysia_states` | List all states with weekend config |
| `resolve_malaysia_state` | Resolve alias (KL, JB) to canonical code |
| `malaysia_holiday_changes` | Recent data changes |
| `malaysia_school_terms` | School term dates and day counts |
| `malaysia_school_holidays` | School holidays (cuti penggal, cuti perayaan) |
| `malaysia_exams` | SPM, STPM, MUET, PT3 exam schedule |
| `malaysia_is_school_day` | Check if a date is a school day |

## State Codes

| Code | Aliases | Group | Weekend |
|------|---------|-------|---------|
| `johor` | jhr, jb | B | Sat-Sun (was Fri-Sat 2014-2024) |
| `kedah` | kd, kdh | A | Fri-Sat |
| `kelantan` | kel, kb | A | Fri-Sat |
| `terengganu` | trg, kt | A | Fri-Sat |
| `perak` | prk, ipoh | B | Sat-Sun |
| `pulau-pinang` | penang, pg | B | Sat-Sun |
| `selangor` | sel, sgr | B | Sat-Sun |
| `negeri-sembilan` | ns, n9 | B | Sat-Sun |
| `melaka` | mlk, malacca | B | Sat-Sun |
| `pahang` | phg, kuantan | B | Sat-Sun |
| `perlis` | pls, kangar | B | Sat-Sun |
| `sabah` | sbh, kk | B | Sat-Sun |
| `sarawak` | swk, kuching | B | Sat-Sun |
| `kuala-lumpur` | kl | B | Sat-Sun |
| `wp-putrajaya` | putrajaya, pjy | B | Sat-Sun |
| `wp-labuan` | labuan, lbn | B | Sat-Sun |

State aliases are case-insensitive. Use `GET /v1/states/resolve?q=kl` to resolve any alias to the canonical code.

## Project Structure

```
malaysia-calendar-api/
├── data/                        # JSON data files (source of truth / 数据源)
│   ├── holidays/
│   │   ├── 2024.json            # Holiday data per year
│   │   ├── 2025.json
│   │   └── 2026.json
│   ├── school/
│   │   ├── terms-2026.json      # School terms (Kumpulan A + B)
│   │   ├── holidays-2026.json   # School holidays + KPM cuti perayaan
│   │   └── exams-2026.json      # SPM, STPM, MUET, PT3 schedules
│   ├── states.json              # 16 states + 3 FT, aliases, weekend history
│   └── known-fixed-holidays.json
├── packages/
│   ├── core/                    # Shared business logic (types, schemas, utils)
│   │   └── src/
│   │       ├── types.ts         # Holiday, State, SchoolTerm, Exam interfaces
│   │       ├── schemas.ts       # Zod validation schemas
│   │       ├── filter.ts        # Query filtering logic
│   │       ├── replacement.ts   # Cuti ganti calculation
│   │       ├── state-resolver.ts
│   │       ├── business-days.ts
│   │       └── school.ts        # School term/holiday/exam logic
│   ├── api/                     # Hono API on Cloudflare Workers
│   ├── mcp-server/              # MCP Server (12 tools)
│   └── sdk/                     # TypeScript client SDK (@mycal/sdk)
├── scripts/
│   ├── validate-data.ts         # 5-layer data validation pipeline
│   └── sync-to-kv.ts           # JSON -> Cloudflare KV denormalization
├── parsers/                     # Year-specific PDF layout adapters
├── openapi.yaml                 # OpenAPI 3.1 spec (spec-first)
├── pnpm-workspace.yaml
└── turbo.json
```

## Data Sources

All data is sourced from official Malaysian government publications:

| Source | Data | URL |
|--------|------|-----|
| **JPM BKPP** | Federal Gazette / Warta Kerajaan (public holidays) | kabinet.gov.my |
| **JAKIM** | Takwim Hijri-Miladi (Islamic calendar) | e-solat.gov.my |
| **KPM** | Kalendar Akademik / school calendar (Lampiran A/B/C) | moe.gov.my |
| **MPM** | STPM & MUET exam schedules | mpm.edu.my |
| **State Portals** | State-specific holidays (16 states) | *.gov.my |

Holiday data includes gazette references (e.g., `P.U.(B) 305/2025`) for traceability.

## Deploy

This API runs on **Cloudflare Workers** with KV for edge-cached reads.

```bash
# Build all packages
pnpm build

# Deploy API to Cloudflare Workers
cd packages/api
npx wrangler deploy

# Sync data to KV
npx tsx scripts/sync-to-kv.ts
```

### CI/CD

GitHub Actions handles:
1. **PR gate** — Zod schema validation + cross-source checks on every PR
2. **Deploy** — On merge to main: build, sync KV, purge CDN cache
3. **Daily scrape** — Government portal monitoring for updates
4. **Rukyah monitor** — Islamic date confirmation tracking

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to:
- Report a missing holiday or cuti peristiwa
- Fix data errors
- Add new features

## License

MIT
