# Implementation Plan: Malaysia Calendar API (v2 — Multi-Perspective Synthesis)

> Malaysia 最完整的日曆 API — 公共假期 + 學校日曆 + 考試時間 + MCP Server
> Synthesized from 3 analysis perspectives: Backend Architecture, API/DX Design, Data Pipeline Engineering

---

## Task Type
- [x] Backend (API + Data Pipeline + MCP Server)
- [ ] Frontend (deferred — landing page/docs site in later phase)
- [ ] Fullstack

---

## Technical Solution

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                              │
│  JPM PDF │ JAKIM │ KPM/MPM │ State Portals │ News RSS │ Admin│
└────────┬────────┬───────────┬──────────┬──────────┬─────────┘
         │        │           │          │          │
         v        v           v          v          v
┌─────────────────────────────────────────────────────────────┐
│              INGESTION & VALIDATION PIPELINE                 │
│  PDF Parser │ Scraper │ RSS Monitor │ Community Reports      │
│                    ↓                                         │
│  5-Layer Validation: Schema → Temporal → Cross-Source        │
│                      → Historical → Diff Review              │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              [NORMAL PATH]    [EMERGENCY PATH]
                    │            (cuti peristiwa)
                    v                 │
              Git JSON files          v
              (source of truth)  Admin API → KV (immediate)
                    │                 │
                    v                 v
              GitHub Actions    Git commit (async)
              CI + Deploy
                    │
                    v
┌─────────────────────────────────────────────────────────────┐
│              SERVING LAYER (Cloudflare Edge)                  │
│                                                               │
│  KV (denormalized per-state)  │  D1 (webhooks, analytics)   │
│  R2 (iCal feeds, exports)    │  CDN Cache (>95% hit rate)   │
└────────┬──────────┬───────────┬──────────┬──────────────────┘
         │          │           │          │
         v          v           v          v
┌─────────────────────────────────────────────────────────────┐
│              CONSUMERS                                       │
│  REST API │ MCP Server │ npm SDK │ iCal Feed │ Webhooks     │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack (Final Decision)

| Component | Choice | Rationale |
|-----------|--------|-----------|
| API Framework | **Hono** | 14KB, middleware composition, OpenAPI integration, portable to Node for MCP |
| Runtime | **Cloudflare Workers** | Zero cold start, global edge, generous free tier (100K req/day) |
| Data (source of truth) | **JSON in Git** | Audit trail, PR-based review, fork-friendly, zero cost |
| Data (read layer) | **Cloudflare KV** | Sub-ms edge reads, denormalized per-state keys |
| Relational data | **Cloudflare D1** | Webhook subscriptions, delivery logs, analytics (native to Workers) |
| Object storage | **Cloudflare R2** | iCal feeds, OpenAPI spec, exports |
| Monorepo | **pnpm workspaces + Turborepo** | |
| PDF parsing | **pdfjs-dist** | Positional text extraction for table reconstruction |
| Validation | **Zod** | Runtime + compile-time schema validation |
| CI/CD | **GitHub Actions** | Auto-scrape, validate, deploy |
| RSS monitoring | **Workers Cron Triggers** | Saves GitHub Actions minutes (1,800→450/month) |

---

## Data Schema (Final)

```typescript
// packages/core/src/types.ts

interface Holiday {
  id: string;                      // "2026-hari-raya-aidilfitri-1"
  date: string;                    // ISO 8601: "2026-03-21"
  endDate?: string;                // multi-day holidays
  name: {
    ms: string;                    // "Hari Raya Aidilfitri"
    en: string;                    // "Eid al-Fitr"
    zh?: string;                   // "开斋节"
  };
  type: "federal" | "state" | "islamic" | "islamic_state" | "replacement" | "adhoc";
  status: "confirmed" | "tentative" | "announced" | "cancelled";
  states: string[];                // ["*"] = all, ["johor","kedah"] = specific
  isPublicHoliday: boolean;
  gazetteLevel: "P" | "N";        // (P)ersekutuan or (N)egeri — from official gazette
  isReplacementFor?: string;       // links to original holiday id
  hijriDate?: string;              // "1 Syawal 1447"
  gazetteRef?: string;             // "P.U. (B) 305/2025" — gazette reference number
  source: "jpm" | "jakim" | "state-gov" | "community" | "admin";
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface State {
  code: string;                    // "selangor"
  aliases: string[];               // ["sel", "sgr", "SEL"] — for fuzzy resolution
  name: {
    ms: string;                    // "Selangor"
    en: string;                    // "Selangor"
  };
  type: "state" | "federal_territory";
  weekendHistory: WeekendConfig[]; // time-aware weekend config (Johor changed in 2014, 2025)
  group: "A" | "B";               // current group
}

interface WeekendConfig {
  from: string;                    // "2025-01-01"
  to: string | null;               // null = current
  weekendDays: number[];           // [0, 6] = Sun+Sat, [5, 6] = Fri+Sat
  group: "A" | "B";
}

// ─── School Calendar (Takwim Persekolahan) ───

interface SchoolTerm {
  id: string;                      // "2026-penggal-1-kumpulan-b"
  year: number;
  term: 1 | 2;
  group: "A" | "B";               // Kumpulan A (Kedah/Kelantan/Terengganu) vs B (all others)
  segments: SchoolTermSegment[];   // term split into monthly segments with day counts
  totalSchoolDays: number;
  startDate: string;
  endDate: string;
}

interface SchoolTermSegment {
  startDate: string;
  endDate: string;
  schoolDays: number;
}

interface SchoolHoliday {
  id: string;                      // "2026-cuti-pertengahan-kumpulan-b"
  year: number;
  group: "A" | "B";
  type: "cuti_penggal_1" | "cuti_pertengahan" | "cuti_penggal_2" | "cuti_akhir" | "cuti_perayaan_kpm";
  name: {
    ms: string;                    // "Cuti Pertengahan Tahun"
    en: string;                    // "Mid-Year Holiday"
  };
  startDate: string;
  endDate: string;
  days: number;
  states?: string[];               // per-state exceptions — e.g. Deepavali KPM cuti: all Kump B EXCEPT Sarawak
  excludeStates?: string[];        // e.g. ["sarawak"] — Sarawak has different date for this holiday
  remarks?: string;                // e.g. "Sarawak sahaja" for Gawai
}

interface Exam {
  id: string;                      // "2026-spm"
  year: number;
  name: string;                    // "SPM", "STPM Semester 1", "MUET Sesi 1", "PT3"
  fullName: {
    ms: string;                    // "Sijil Pelajaran Malaysia"
    en: string;                    // "Malaysian Certificate of Education"
  };
  type: "spm" | "stpm" | "muet" | "pt3" | "stam" | "other";
  startDate: string;
  endDate?: string;
  status: "confirmed" | "tentative";
  resultsDate?: string;            // e.g. "2027-03-31" for SPM 2026
  source: "kpm" | "mpm";
}
```

### State Code Aliases (Critical for DX)

```json
{
  "johor":          { "aliases": ["jhr", "JHR", "jb", "JB", "johor-bahru"] },
  "kedah":          { "aliases": ["kd", "KDH", "kdh", "alor-setar"] },
  "kelantan":       { "aliases": ["kel", "KEL", "kb", "KB", "kota-bharu"] },
  "terengganu":     { "aliases": ["trg", "TRG", "kt", "KT", "kuala-terengganu"] },
  "perak":          { "aliases": ["prk", "PRK", "ipoh"] },
  "pulau-pinang":   { "aliases": ["penang", "pg", "PG", "png", "pinang", "georgetown"] },
  "selangor":       { "aliases": ["sel", "SEL", "sgr", "SGR"] },
  "negeri-sembilan":{ "aliases": ["ns", "NS", "n9", "N9", "n.sembilan", "seremban"] },
  "melaka":         { "aliases": ["mlk", "MLK", "malacca", "melacca"] },
  "pahang":         { "aliases": ["phg", "PHG", "kuantan"] },
  "perlis":         { "aliases": ["pls", "PLS", "kangar"] },
  "sabah":          { "aliases": ["sbh", "SBH", "kk", "KK", "kota-kinabalu"] },
  "sarawak":        { "aliases": ["swk", "SWK", "kuching"] },
  "kuala-lumpur":   { "aliases": ["kl", "KL", "kualalumpur", "wp-kl", "wpkl"] },
  "wp-putrajaya":   { "aliases": ["putrajaya", "pjy", "PJY"] },
  "wp-labuan":      { "aliases": ["labuan", "lbn", "LBN"] }
}
```

API normalizes any alias to canonical code. `GET /states/resolve?q=kl` → `{ "canonical": "kuala-lumpur" }`.

---

## API Design (Final)

### Endpoints

```
Base URL: https://api.mycal.my/v1

# Core Queries (all use query params for filtering)
GET  /holidays?year=2026                          # All federal holidays
GET  /holidays?year=2026&state=selangor            # Federal + state
GET  /holidays?year=2026&state=selangor&month=3    # Filter by month
GET  /holidays?year=2026&type=islamic              # Filter by type
GET  /holidays?year=2026&status=tentative          # Filter by status

# Smart Queries
GET  /holidays/check?date=2026-03-21&state=selangor  # Is this a working day?
GET  /holidays/next?state=selangor                    # Next upcoming holiday
GET  /holidays/between?start=2026-01-01&end=2026-06-30&state=selangor  # Range
GET  /holidays/today?state=selangor                   # Today's status
GET  /holidays/long-weekends?year=2026&state=selangor # Long weekend analysis

# Business Day Calculator
GET  /business-days?start=2026-03-01&end=2026-03-31&state=selangor  # Count working days
GET  /business-days/add?date=2026-03-01&days=10&state=selangor      # Add N business days

# Metadata
GET  /states                                # All states with weekend config + aliases
GET  /states/resolve?q=kl                   # Alias resolution
GET  /types                                 # Holiday type definitions
GET  /changelog                             # Data change log

# Feeds
GET  /feed/ical/:state                      # iCal subscription (stable URL)
GET  /feed/rss                              # RSS for data changes

# Webhooks
POST   /webhooks/subscribe                  # Subscribe (requires email)
DELETE /webhooks/:id                        # Unsubscribe
GET    /webhooks/:id/deliveries             # Delivery history

# Admin (API key protected)
POST   /admin/holidays                      # Add ad-hoc holiday (→ KV immediate + Git async)
PATCH  /admin/holidays/:id                  # Update (e.g. confirm Islamic date)
DELETE /admin/holidays/:id                  # Remove (soft delete → cancelled)

# School Calendar (Takwim Persekolahan — KPM)
GET  /school/terms?year=2026&group=B                    # School term dates + day counts
GET  /school/holidays?year=2026&group=B                 # School holidays (cuti penggal, cuti perayaan KPM)
GET  /school/exams?year=2026                            # Exam schedule (SPM, STPM, MUET, PT3)
GET  /school/exams?year=2026&type=spm                   # Filter by exam type
GET  /school/is-school-day?date=2026-03-21&state=selangor # Is this a school day? (auto-resolves state → group)
GET  /school/is-school-day?date=2026-03-21&group=B      # Also accepts group directly

# Docs
GET  /docs                                  # Interactive OpenAPI docs (Scalar UI)
GET  /openapi.json                          # OpenAPI spec
```

### `/check` Response (Working-Day Intelligence)

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
        "name": { "ms": "Hari Raya Aidilfitri", "en": "Eid al-Fitr" },
        "type": "islamic",
        "status": "confirmed"
      }
    ],
    "school": {
      "group": "B",
      "term": null,
      "holiday": {
        "id": "2026-cuti-penggal-1-kumpulan-b",
        "name": { "ms": "Cuti Penggal 1", "en": "Term 1 Break" },
        "type": "cuti_penggal_1"
      }
    },
    "state": {
      "code": "selangor",
      "weekendDays": ["Saturday", "Sunday"],
      "group": "B"
    }
  }
}
```

### Webhook Payload

```json
{
  "event": "holiday.created",
  "timestamp": "2026-03-14T10:30:00+08:00",
  "data": {
    "holiday": { "...full Holiday object..." },
    "changes": {
      "status": { "from": "tentative", "to": "confirmed" },
      "date": { "from": "2026-03-21", "to": "2026-03-22" }
    }
  }
}
```

Events:
- Holiday: `holiday.created`, `holiday.updated`, `holiday.status_changed`, `holiday.cancelled`, `holiday.replacement_created`
- School: `school.term_changed`, `school.holiday_changed`, `exam.date_changed`, `exam.results_date_announced`

---

## MCP Server Tools

```typescript
// 12 tools for AI consumption (8 holiday + 4 school)

Tool: get_malaysia_holidays
  Input: { year, state?, type?, status?, month? }
  Output: Holiday[]
  Description: "Get Malaysia public holidays. Covers all 16 states including Islamic holidays."

Tool: check_malaysia_holiday
  Input: { date, state? }
  Output: { isHoliday, isWeekend, isWorkingDay, holidays[] }
  Description: "Check if a specific date is a public holiday or working day in Malaysia."

Tool: next_malaysia_holiday
  Input: { state?, afterDate?, type? }
  Output: Holiday
  Description: "Find the next upcoming public holiday in Malaysia."

Tool: malaysia_business_days
  Input: { start, end, state }
  Output: { businessDays, totalDays, holidays[] }
  Description: "Count business/working days between two dates for a Malaysian state."

Tool: malaysia_long_weekends
  Input: { year, state? }
  Output: LongWeekend[]
  Description: "Find all long weekends (3+ consecutive non-working days) in Malaysia."

Tool: list_malaysia_states
  Input: {}
  Output: State[]
  Description: "List all Malaysian states with weekend configurations."

Tool: resolve_malaysia_state
  Input: { query }
  Output: State
  Description: "Resolve state name/alias (e.g. 'KL', 'Penang') to canonical code."

Tool: malaysia_holiday_changes
  Input: { since?, limit? }
  Output: ChangelogEntry[]
  Description: "Get recent changes to Malaysia holiday data (new holidays, confirmations, ad-hoc)."

// ─── School Calendar Tools (4 additional) ───

Tool: malaysia_school_terms
  Input: { year, group? }
  Output: SchoolTerm[]
  Description: "Get Malaysia school term dates and day counts. Group A = Kedah/Kelantan/Terengganu, Group B = all other states."

Tool: malaysia_school_holidays
  Input: { year, group? }
  Output: SchoolHoliday[]
  Description: "Get Malaysia school holidays including cuti penggal, mid-year break, year-end break, and KPM bonus holidays."

Tool: malaysia_exams
  Input: { year, type? }
  Output: Exam[]
  Description: "Get Malaysia public exam schedule — SPM, STPM, MUET, PT3. Includes results announcement dates."

Tool: malaysia_is_school_day
  Input: { date, state?, group? }
  Output: { isSchoolDay, isSchoolHoliday, isPublicHoliday, isWeekend, term?, holiday? }
  Description: "Check if a date is a school day in Malaysia. Accepts state (auto-resolves to group) or group directly. Combines public holidays, school holidays, and weekend status."
```

---

## Cuti Peristiwa Detection System

### 4-Layer Detection (by speed)

| Layer | Channel | Latency | Implementation |
|-------|---------|---------|----------------|
| **L4** | Admin/Community manual report | **~15 min** | GitHub Issue template + Admin API |
| **L2** | News RSS monitoring | **~30 min** | Workers Cron (every 15 min) |
| **L1** | Government portal scrape | **~4 hours** | GitHub Actions (daily) |
| **L3** | Social media | **deferred** | Not worth API cost vs community |

### Keyword Dictionary (Malay)

**HIGH confidence** (auto-create candidate):
- `cuti peristiwa`
- `hari kelepasan am tambahan`
- `cuti khas seluruh negara`
- `diisytiharkan sebagai cuti umum`

**MEDIUM confidence** (require context):
- `isytihar cuti` + subject (PM/MB/CM)
- `mengumumkan cuti` + subject
- `cuti sempena` + event detail
- `cuti hari mengundi`
- `cuti khas negeri [state]`

**EXCLUSION keywords** (filter out):
- `tiada cuti`, `bukan cuti umum`, `cuti sakit`, `cuti sekolah`, `mungkin diisytiharkan`

### Emergency Path Timeline

```
T+0min:   PM announces cuti peristiwa
T+5min:   News agencies publish
T+10min:  Community member sees it, creates GitHub Issue / pings admin
T+15min:  Admin verifies source, calls POST /admin/holidays
T+16min:  KV updated, API serving new holiday immediately
T+20min:  CDN cache purged globally
T+25min:  Webhook notifications delivered
T+30min:  Git commit created (audit trail)
T+60min:  RSS monitor confirms (backup verification)
```

---

## Replacement Holiday (Cuti Ganti) Algorithm

```pseudo
function calculateReplacements(holidays, state):
  weekendConfig = getWeekendConfig(state, holiday.date)  // time-aware lookup

  for each holiday in holidays:
    if isWeekend(holiday.date, weekendConfig):
      replacement = nextWorkingDay(holiday.date, weekendConfig, holidays)
      create ReplacementHoliday(
        date: replacement,
        isReplacementFor: holiday.id,
        name: "Cuti Ganti " + holiday.name.ms
      )

  // Handle overlapping holidays (same date, different holidays)
  for each dateGroup where count > 1:
    // Federal takes precedence; state holiday gets replacement
    stateHoliday = dateGroup.find(h => h.gazetteLevel === "N")
    if stateHoliday:
      create ReplacementHoliday for stateHoliday
```

**Johor weekend history** (must be year-aware):
```
Before 2014-01-01: Group B (Sat-Sun)
2014-01-01 to 2024-12-31: Group A (Fri-Sat)
2025-01-01 onwards: Group B (Sat-Sun)
```

---

## KV Storage Strategy (Denormalized)

```
# Public Holidays
holidays:2026                    → all holidays for 2026 (full)
holidays:2026:selangor           → federal + Selangor-specific (pre-computed)
holidays:2026:kedah              → federal + Kedah-specific (pre-computed)
... (1 full + 19 per-state keys per year)

# School Calendar
school:terms:2026                → all terms for 2026 (Kumpulan A + B)
school:holidays:2026             → all school holidays for 2026 (Kumpulan A + B)
school:exams:2026                → all exam schedules for 2026

# Metadata
states:config                    → states.json with aliases + weekend history
meta:lastUpdated                 → timestamp
meta:changelog                   → recent changes array
```

~25 KV keys per year. 3 years = ~75 keys. Well within free tier.

---

## Project Structure (Final)

```
malaysia-calendar-api/
├── data/
│   ├── holidays/
│   │   ├── 2024.json
│   │   ├── 2025.json
│   │   └── 2026.json
│   ├── school/                      # ⭐ NEW: School calendar data
│   │   ├── terms-2026.json          # School terms (Kumpulan A + B)
│   │   ├── holidays-2026.json       # School holidays + KPM cuti perayaan
│   │   └── exams-2026.json          # SPM, STPM, MUET, PT3 schedules
│   ├── states.json                  # 16 states + 3 FT, aliases, weekend history
│   ├── islamic-dates.json           # JAKIM takwim reference
│   ├── known-fixed-holidays.json    # regression test data
│   └── schema.json                  # JSON Schema
├── packages/
│   ├── core/                       # ⭐ CRITICAL: shared business logic
│   │   ├── src/
│   │   │   ├── types.ts            # Holiday, State, HolidayType
│   │   │   ├── schemas.ts          # Zod validation schemas
│   │   │   ├── filter.ts           # Query filtering logic
│   │   │   ├── replacement.ts      # Cuti ganti calculation
│   │   │   ├── weekend.ts          # Weekend config utilities (time-aware)
│   │   │   ├── state-resolver.ts   # Alias → canonical code
│   │   │   ├── business-days.ts    # Working day calculator
│   │   │   ├── school.ts           # ⭐ NEW: School term/holiday logic
│   │   │   ├── ical.ts             # iCal generation
│   │   │   └── hijri.ts            # Hijri date utilities
│   │   ├── __tests__/
│   │   └── package.json
│   ├── api/                        # Hono API (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── holidays.ts
│   │   │   │   ├── states.ts
│   │   │   │   ├── check.ts
│   │   │   │   ├── business-days.ts
│   │   │   │   ├── school.ts        # ⭐ NEW: /school/* routes
│   │   │   │   ├── feeds.ts
│   │   │   │   ├── webhooks.ts
│   │   │   │   └── admin.ts
│   │   │   ├── middleware/
│   │   │   │   ├── cors.ts
│   │   │   │   ├── rate-limit.ts
│   │   │   │   └── cache.ts
│   │   │   └── cron/
│   │   │       └── rss-monitor.ts  # Workers Cron for news monitoring
│   │   ├── wrangler.toml
│   │   └── package.json
│   ├── mcp-server/                 # MCP Server (npm package)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── tools/
│   │   │       ├── get-holidays.ts
│   │   │       ├── check-holiday.ts
│   │   │       ├── next-holiday.ts
│   │   │       ├── business-days.ts
│   │   │       ├── long-weekends.ts
│   │   │       ├── list-states.ts
│   │   │       ├── resolve-state.ts
│   │   │       ├── holiday-changes.ts
│   │   │       ├── school-terms.ts    # ⭐ NEW
│   │   │       ├── school-holidays.ts
│   │   │       ├── exams.ts
│   │   │       └── is-school-day.ts
│   │   └── package.json
│   └── sdk/                        # npm: @catlabtech/mycal-sdk
│       ├── src/
│       │   ├── index.ts
│       │   ├── client.ts
│       │   ├── types.ts            # re-exported from core
│       │   └── errors.ts           # typed error codes (Result<T> pattern)
│       └── package.json
├── scripts/
│   ├── parse-jpm-pdf.ts            # Year-specific JPM PDF parser
│   ├── parse-jakim-takwim.ts       # JAKIM Islamic calendar parser
│   ├── parse-kpm-calendar.ts       # ⭐ NEW: KPM Kalendar Akademik PDF parser
│   ├── parse-mpm-exams.ts          # ⭐ NEW: MPM exam schedule PDF parser
│   ├── validate-data.ts            # 5-layer validation pipeline
│   ├── sync-to-kv.ts              # Deploy: JSON → KV denormalization
│   ├── generate-ical.ts           # Generate iCal feeds → R2
│   └── generate-openapi.ts        # Generate OpenAPI spec
├── parsers/                         # Year-specific PDF layout adapters (format changes yearly)
│   ├── jpm-2024.ts                  #   scripts/parse-*.ts = main parser logic
│   ├── jpm-2025.ts                  #   parsers/*-{year}.ts = column mapping + date format per year
│   ├── jpm-2026.ts
│   ├── kpm-2025.ts
│   └── kpm-2026.ts
├── .github/
│   ├── workflows/
│   │   ├── validate.yml            # PR gate: schema + cross-validation
│   │   ├── deploy.yml              # On merge: sync KV + R2 + purge CDN
│   │   ├── scrape-portals.yml      # Daily: government portal check
│   │   └── rukyah-monitor.yml      # Triggered: Islamic date confirmation
│   └── ISSUE_TEMPLATE/
│       └── report-holiday.yml      # Community cuti peristiwa reporting
├── openapi.yaml                    # ⭐ Spec-first: drives SDK types, docs, MCP schemas (root for easy access)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Validation Pipeline (5 Layers)

| Layer | What it checks | Failure = |
|-------|---------------|-----------|
| 1. Schema | Zod: types, required fields, date formats | Block merge |
| 2. Temporal | Dates within correct year, no past-date additions for current year | Block merge |
| 3. Cross-source | No duplicates, replacement holidays link to valid originals, state codes valid | Block merge |
| 4. Historical | Known fixed holidays present (Merdeka Aug 31, Malaysia Day Sep 16, etc.) | Block merge |
| 5. Diff review | Shows what changed since last version, flags suspicious changes | Warn (human review) |

**Known fixed holidays regression test** (must be present every year):

| Holiday | Date | States |
|---------|------|--------|
| Hari Kebangsaan | 31 August | All |
| Hari Malaysia | 16 September | All |
| Hari Pekerja | 1 May | All |
| Hari Krismas | 25 December | All |
| Hari Wilayah Persekutuan | 1 February | WP KL, WP Putrajaya, WP Labuan only |

---

## Implementation Steps

### Phase 1: Foundation (Week 1-2)
1. Init monorepo (pnpm + turbo) + Git repo
2. Write `openapi.yaml` spec (spec-first approach)
3. Define Zod schemas in `packages/core` (Holiday + SchoolTerm + SchoolHoliday + Exam)
4. Create `data/states.json` with all 16 states + 3 FT, aliases, weekend history
5. Parse JPM gazette PDFs (2024-2026) → `data/holidays/{year}.json`
6. Parse JAKIM takwim → `data/islamic-dates.json`
7. Parse KPM Kalendar Akademik PDF → `data/school/terms-{year}.json` + `data/school/holidays-{year}.json`
8. Parse MPM exam schedules → `data/school/exams-{year}.json`
9. Build 5-layer validation pipeline (`scripts/validate-data.ts`)
10. Manual curation: verify all data against gazette/KPM text (we have the raw text!)
11. Unit tests for core: replacement calc, weekend utils, state resolver, business days, school day check
   - **Deliverable**: Validated JSON data for 2024-2026 (holidays + school calendar + exams)

### Phase 2: Core API (Week 2-3)
12. Hono API scaffolding on Cloudflare Workers
13. Implement `scripts/sync-to-kv.ts` (JSON → denormalized KV keys, including school data)
14. Implement core routes: `/holidays`, `/states`, `/states/resolve`
15. Implement smart queries: `/check` (with working-day), `/next`, `/between`, `/today`
16. Implement `/business-days` calculator
17. Implement `/school/terms`, `/school/holidays`, `/school/exams`, `/school/is-school-day`
18. Rate limiting middleware + CORS + cache headers
19. Deploy pipeline: GitHub Actions → validate → sync KV → purge CDN
20. Integration tests against deployed API
    - **Deliverable**: Live API at api.mycal.my/v1 with holiday + school endpoints

### Phase 3: Feeds & Notifications (Week 3-4)
21. iCal feed generation → R2 (`/feed/ical/:state`) — includes school holidays
22. RSS feed for data changes
23. Changelog endpoint
24. D1 schema for webhook subscriptions
25. Webhook subscribe/unsubscribe endpoints
26. Webhook delivery via Cloudflare Queues (retry logic)
27. HMAC signature on webhook payloads
    - **Deliverable**: iCal feeds (with school holidays), webhooks working

### Phase 4: Detection Pipeline (Week 4-5)
28. Workers Cron: RSS keyword monitor (every 15 min)
29. GitHub Actions: government portal scraper (daily)
30. GitHub Issue template for community reporting
31. Admin API endpoints: POST/PATCH /admin/holidays → KV immediate + Git async
32. CDN cache purge on emergency updates
33. Rukyah monitoring workflow (triggered before Islamic holidays)
    - **Deliverable**: < 2hr cuti peristiwa detection pipeline

### Phase 5: MCP Server + SDK (Week 5-6)
34. MCP Server: 12 tools using `packages/core` (8 holiday + 4 school)
35. Publish MCP server to npm (`npx @catlabtech/mycal-mcp-server`)
36. SDK: TypeScript client with Result<T> pattern, typed errors, built-in cache
37. SDK includes school calendar methods: `cal.school.terms()`, `cal.school.holidays()`, `cal.school.exams()`, `cal.school.isSchoolDay()`
38. Publish SDK to npm (`@catlabtech/mycal-sdk`)
39. Generate SDK types from OpenAPI spec
    - **Deliverable**: Working MCP server + npm SDK

### Phase 6: Docs & Launch (Week 6-7)
40. Interactive API docs at `/docs` (Scalar UI from OpenAPI spec)
41. Landing page (simple, can be static)
42. README with quickstart examples
43. Contributing guide (how to report holidays, submit data fixes)
44. Announce to Malaysian dev communities
    - **Deliverable**: Public launch

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `openapi.yaml` | Create | Spec-first: drives SDK types, docs, MCP schemas |
| `data/states.json` | Create | 16 states + 3 FT with aliases + weekend history |
| `data/holidays/2026.json` | Create | Parsed from JPM gazette (we have the raw text) |
| `data/school/terms-2026.json` | Create | Parsed from KPM Kalendar Akademik PDF |
| `data/school/holidays-2026.json` | Create | School holidays + KPM cuti perayaan tambahan |
| `data/school/exams-2026.json` | Create | SPM, STPM, MUET, PT3 exam schedules from KPM/MPM |
| `packages/core/src/types.ts` | Create | Holiday, State, SchoolTerm, SchoolHoliday, Exam interfaces |
| `packages/core/src/replacement.ts` | Create | Cuti ganti calculation (time-aware weekends) |
| `packages/core/src/state-resolver.ts` | Create | Alias normalization |
| `packages/core/src/business-days.ts` | Create | Working day calculator |
| `packages/core/src/school.ts` | Create | School term/holiday/exam logic + is-school-day |
| `packages/api/src/index.ts` | Create | Hono API entry point |
| `packages/api/src/routes/school.ts` | Create | /school/* routes |
| `packages/api/src/cron/rss-monitor.ts` | Create | Workers Cron for cuti peristiwa detection |
| `packages/api/src/routes/admin.ts` | Create | Emergency path: KV-first + Git-async |
| `packages/mcp-server/src/index.ts` | Create | MCP Server with 12 tools (8 holiday + 4 school) |
| `scripts/parse-kpm-calendar.ts` | Create | KPM Kalendar Akademik PDF parser |
| `scripts/parse-mpm-exams.ts` | Create | MPM exam schedule PDF parser |
| `scripts/validate-data.ts` | Create | 5-layer validation pipeline |
| `scripts/sync-to-kv.ts` | Create | JSON → denormalized KV per state |

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| JPM PDF format changes yearly | Parser breaks | Year-specific adapters (`parsers/jpm-{year}.ts`), LLM-assisted fallback, manual path |
| Islamic date shifts last-minute (rukyah) | Wrong data served | `tentative` status + rukyah monitoring window (7-10 PM MYT on 29th prev Hijri month) + auto-recalculate replacements on shift |
| Cuti peristiwa missed | Incomplete data | 4-layer detection + community reporting + < 2hr SLA |
| Weekend config changes (Johor precedent) | Wrong replacement holidays | Time-aware `weekendHistory[]` in state config |
| GitHub Actions minutes limit (2000/mo free) | Pipeline stops | RSS on Workers Cron (saves 1400 min/mo), portal scrape daily not 4x |
| Stale CDN cache after emergency update | Old data served | Admin API purges CDN via Cloudflare API immediately |
| Malicious PRs with wrong data | Data integrity | Zod CI gate + CODEOWNERS + branch protection + known-holidays regression |
| State code confusion (KL vs kuala-lumpur) | Bad DX | Alias resolution layer + `/states/resolve` endpoint |
| KPM calendar PDF format changes | School data parser breaks | Year-specific adapter (same pattern as JPM) |
| SPM/STPM dates announced late | Incomplete exam data | `status: "tentative"` until KPM/MPM confirms |
| KPM mid-year calendar amendments | Stale school data | Monitor KPM Surat Siaran for pindaan (amendments) |

---

## Monitoring & Observability

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Portal scrape success | < 80% for 24h | Investigate portal change |
| RSS feed freshness | No items 12h from Bernama | Check feed URL |
| Candidate → publication time | > 90 min | Escalate to admin |
| Webhook delivery failure | > 10% per subscriber | Check endpoint health |
| Validation failure on CI | Any | Block merge, investigate |
| Rukyah window missed | No confirmation by 11 PM MYT | Manual check |
| KPM Surat Siaran pindaan detected | New/amended PDF on moe.gov.my | Re-parse school data, create PR |
| MPM exam schedule update detected | New PDF on mpm.edu.my | Re-parse exam data, create PR |

---

## Caching Strategy

| Endpoint | Cache-Control |
|----------|--------------|
| `/holidays?year=2025` (past, all confirmed) | `public, max-age=86400` (24h) |
| `/holidays?year=2026` (may have tentative) | `public, max-age=3600, stale-while-revalidate=86400` |
| `/holidays/today` | `public, max-age=300` (5min) |
| `/holidays/check` | `public, max-age=3600` |
| Data with `status: tentative` | `max-age=1800` (30min) |
| `/school/terms`, `/school/holidays` | `public, max-age=86400` (24h — rarely changes) |
| `/school/exams` (may have tentative) | `public, max-age=3600` |
| `/school/is-school-day` | `public, max-age=3600` |

---

## Rate Limiting

| Tier | Limit | Requirement |
|------|-------|-------------|
| Anonymous | 100 req/min, 1000/day | None |
| Free API key | 1000 req/min, unlimited/day | Email registration |

---

## Official Data Sources (42 total — all government/official only)

### 一、公共假期 (Cuti Umum) — Federal Level

| # | Source | URL | Data | Format | Update |
|---|--------|-----|------|--------|--------|
| 1 | **JPM BKPP — Akta dan Warta** | kabinet.gov.my/akta-dan-warta/ | Annual gazette + amendment warta + ad-hoc warta | PDF | ~Aug yearly + ad-hoc |
| 2 | **JPM BKPP — Hari Kelepasan Am** | kabinet.gov.my/hari-kelepasan-am/ | Holiday overview (2020-2026) | PDF | Yearly |
| 3 | **Akta 369 (Malay)** | kabinet.gov.my (PDF) | Holidays Act 1951 — legal framework | PDF | On amendment |
| 4 | **Act 369 (English)** | kabinet.gov.my (PDF) | Same in English | PDF | On amendment |
| 5 | **Holidays Ordinance Sabah (Cap.56)** | kabinet.gov.my (PDF) | Sabah holiday law | PDF | On amendment |
| 6 | **Public Holidays Ordinance Sarawak (Cap.8)** | kabinet.gov.my (PDF) | Sarawak holiday law | PDF | On amendment |
| 7 | **MyGOV Portal** | malaysia.gov.my/portal/content/147 | Official holiday list | HTML | Yearly |

### 二、Islamic Calendar

| # | Source | URL | Data | Format | Update |
|---|--------|-----|------|--------|--------|
| 8 | **JAKIM e-Solat — Takwim Hijri Miladi** | e-solat.gov.my | Hijri-Miladi mapping | PDF | Yearly |
| 9 | **Jabatan Mufti WP — Tarikh Penting Islam** | muftiwp.gov.my | Islamic important dates (predicted) | PDF | Yearly |
| 10 | **JAKIM — Keputusan Rukyah** | jakim.gov.my | Moon sighting confirmation | HTML/news | Per Islamic month |

### 三、State Government Portals (16 States + 3 FT)

| # | State | URL |
|---|-------|-----|
| 11 | Johor | johor.gov.my/rakyat/cuti-umum-2 |
| 12 | Kedah | kedah.gov.my |
| 13 | Kelantan | kelantan.gov.my |
| 14 | Terengganu | terengganu.gov.my |
| 15 | Perak | perak.gov.my |
| 16 | Pulau Pinang | penang.gov.my |
| 17 | Selangor | selangor.gov.my |
| 18 | Negeri Sembilan | ns.gov.my |
| 19 | Melaka | melaka.gov.my |
| 20 | Pahang | pahang.gov.my |
| 21 | Perlis | perlis.gov.my |
| 22 | Sabah | sabah.gov.my |
| 23 | Sarawak | sarawak.gov.my |
| 24 | WP KL + Putrajaya | kwp.gov.my |
| 25 | WP Labuan | kwp.gov.my |

### 四、學校日曆 + 考試 (Takwim Persekolahan + Peperiksaan)

| # | Source | URL | Data | Format | Update |
|---|--------|-----|------|--------|--------|
| 26 | **KPM — Kalendar Akademik (Surat Siaran)** | moe.gov.my/takwim | School terms, holidays, KPM cuti perayaan (Lampiran A/B/C) | PDF | ~Oct yearly |
| 27 | **KPM — Kalendar Akademik PDF (direct)** | moe.gov.my/storage/.../Kalendar Akademik {year}.pdf | Same, direct PDF link | PDF | Yearly |
| 28 | **BKPP JPM — Kalendar Persekolahan** | kabinet.gov.my | Mirror of school calendar | PDF | Yearly |
| 29 | **KPM — Takwim Peperiksaan** | moe.gov.my/takwim | SPM, PT3 exam dates | PDF | ~Jun yearly |
| 30 | **MPM — STPM Calendar** | mpm.edu.my/en/pautan-pantas/kalendar-peperiksaan/stpm-{year} | STPM Sem 1/2/3 full dates + registration | PDF | Yearly |
| 31 | **MPM — MUET** | mpm.edu.my | MUET exam dates | PDF | Yearly |
| 32 | **KPM — Takwim IPG** | moe.gov.my/takwim | Teacher training college calendar | PDF | Yearly |
| 33 | **KPM — Takwim Matrikulasi** | moe.gov.my/takwim | Matriculation calendar | PDF | Yearly |

### 五、Cuti Peristiwa Detection (News RSS)

| # | Source | URL | Language |
|---|--------|-----|----------|
| 34 | **Bernama** (national news agency) | bernama.com | MS/EN |
| 35 | **MalaysiaGazette** | malaysiagazette.com | MS |
| 36 | **Berita Harian** | bharian.com.my | MS |
| 37 | **The Star** | thestar.com.my | EN |
| 38 | **New Straits Times** | nst.com.my | EN |
| 39 | **Malay Mail** | malaymail.com | EN |
| 40 | **Astro Awani** | astroawani.com | MS/EN |
| 41 | **Sinar Harian** | sinarharian.com.my | MS |
| 42 | **Free Malaysia Today** | freemalaysiatoday.com | EN |

**Key finding**: The gazette PDF structure is parseable (confirmed via `pdftotext`). The 2026 gazette contains:
- Jadual No. 33499: Federal holidays (marked `*` for Islamic = tentative)
- Jadual No. 33500: State holidays per state
- Jadual No. 33501: Combined federal + state (marked `(P)` Persekutuan / `(N)` Negeri)

**Key finding**: KPM Kalendar Akademik PDF is also parseable via `pdftotext`. Contains:
- Lampiran A: Kumpulan A terms + school days count
- Lampiran B: Kumpulan B terms + school days count
- Lampiran C: KPM cuti perayaan tambahan (bonus holidays per festival, different per Kumpulan)

---

## Out of Scope

The following are explicitly **not** covered by this API:

- **Private / International school calendars** — different academic systems (IB, Cambridge, etc.)
- **University / Polytechnic / IPT calendars** — each institution sets its own schedule
- **TASKA / TADIKA (nursery/kindergarten) calendars** — no standardized national calendar
- **Civil servant leave (PSD circular)** — overlaps with public holidays but has additional rules
- **Historical holidays before 2024** — may be added later as community contribution
- **Non-Malaysian territories** — e.g. Singapore, Brunei (even though culturally similar)

---

## SESSION_ID

- CODEX_SESSION: N/A (codeagent-wrapper not installed)
- GEMINI_SESSION: N/A (codeagent-wrapper not installed)
- CLAUDE_AGENTS: Backend Architect + API/DX Specialist + Data Pipeline Engineer (3-agent analysis)
