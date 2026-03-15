# Malaysia Calendar API 🇲🇾

Malaysia's most complete calendar API — public holidays, school calendar, exam schedules, and MCP server for AI tools.

**Data source**: Official government gazette (JPM BKPP), JAKIM, KPM, MPM. Not scraped from third-party websites.

## Features

- **49 holidays** for 2026 from official gazette (Warta Kerajaan)
- **16 states + 3 Federal Territories** with per-state holidays
- **Islamic holidays** with `tentative` / `confirmed` status tracking
- **Cuti ganti** (replacement holidays) auto-calculated per state weekend config
- **Kumpulan A/B** weekend support (Fri-Sat vs Sat-Sun)
- **School calendar** — terms, holidays, KPM bonus days (Lampiran A/B/C)
- **Exam schedules** — SPM, STPM, MUET, PT3
- **Business day calculator** — per state, holiday-aware
- **iCal feeds** — subscribe per state
- **MCP Server** — 12 tools for Claude, ChatGPT, and other AI assistants
- **Trilingual** — Bahasa Melayu, English, Chinese names

## Quick Start

### REST API

```bash
# All holidays for Selangor in 2026
curl https://api.mycal.my/v1/holidays?year=2026&state=selangor

# Is March 21 a working day?
curl https://api.mycal.my/v1/holidays/check?date=2026-03-21&state=selangor

# Business days in March
curl https://api.mycal.my/v1/business-days?start=2026-03-01&end=2026-03-31&state=selangor

# School holidays
curl https://api.mycal.my/v1/school/holidays?year=2026&state=selangor

# Exam schedule
curl https://api.mycal.my/v1/school/exams?year=2026

# Resolve state alias
curl https://api.mycal.my/v1/states/resolve?q=kl
# → { "canonical": "kuala-lumpur", "group": "B" }
```

### MCP Server (for AI tools)

Add to your Claude Desktop / Claude Code config:

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

12 tools available: `get_malaysia_holidays`, `check_malaysia_holiday`, `next_malaysia_holiday`, `malaysia_business_days`, `malaysia_long_weekends`, `list_malaysia_states`, `resolve_malaysia_state`, `malaysia_holiday_changes`, `malaysia_school_terms`, `malaysia_school_holidays`, `malaysia_exams`, `malaysia_is_school_day`.

## API Endpoints

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
| `GET /v1/school/holidays` | School holidays + KPM bonus days |
| `GET /v1/school/exams` | SPM, STPM, MUET, PT3 schedule |
| `GET /v1/school/is-school-day` | Is this a school day? |
| `GET /v1/feed/ical/:state` | iCal subscription feed |

## State Codes

| Code | Aliases | Group | Weekend |
|------|---------|-------|---------|
| `johor` | jhr, jb | B | Sat-Sun |
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

## Data Sources

All data from official Malaysian government sources:

- **JPM BKPP** — Federal Gazette (Warta Kerajaan) for public holidays
- **JAKIM** — Islamic calendar (Takwim Hijri-Miladi)
- **KPM** — School calendar (Kalendar Akademik)
- **MPM** — Exam schedules (STPM, MUET)
- **16 State Government Portals** — State-specific holidays

## Development

```bash
# Install
pnpm install

# Build core
cd packages/core && pnpm build

# Run API locally
cd packages/api && pnpm dev

# Run tests
cd packages/core && pnpm test

# Validate data
pnpm validate
```

## Project Structure

```
├── data/               # JSON holiday + school data (source of truth)
├── packages/
│   ├── core/           # Shared types, schemas, business logic
│   ├── api/            # Hono API (Cloudflare Workers)
│   └── mcp-server/     # MCP Server for AI tools
├── scripts/            # PDF parsers, data validation
└── parsers/            # Year-specific PDF layout adapters
```

## License

MIT
