import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import {
  filterHolidays,
  findHolidaysByDate,
  findNextHoliday,
  resolveStateCode,
  isWeekend,
  getDayOfWeekName,
  getWeekendDayNames,
  countBusinessDays,
  findSchoolTermByDate,
  findSchoolHolidayByDate,
  isSchoolDay as checkSchoolDay,
  type Holiday,
  type State,
  type SchoolTerm,
  type SchoolHoliday,
  type Exam,
  type HolidayType,
  type StateGroup,
  type ExamType,
} from "@catlabtech/mycal-core";

// ─── Load Data ───

const __dirname2 = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname2, "../../../data");

const states: State[] = JSON.parse(readFileSync(resolve(DATA_DIR, "states.json"), "utf-8"));

function loadYear<T>(dir: string, year: number): T[] {
  try {
    return JSON.parse(readFileSync(resolve(DATA_DIR, dir, `${year}.json`), "utf-8"));
  } catch {
    return [];
  }
}

function loadSchool<T>(file: string, year: number): T[] {
  try {
    return JSON.parse(readFileSync(resolve(DATA_DIR, "school", `${file}-${year}.json`), "utf-8"));
  } catch {
    return [];
  }
}

// ─── MCP Server ───

const server = new McpServer({
  name: "Malaysia Calendar API",
  version: "0.1.0",
});

// Tool 1: get_malaysia_holidays
server.tool(
  "get_malaysia_holidays",
  "Get Malaysia public holidays. Covers all 16 states + 3 FTs including Islamic holidays with tentative/confirmed status.",
  {
    year: z.number().int().describe("Year (e.g. 2026)"),
    state: z.string().optional().describe("State code or alias (e.g. 'selangor', 'KL', 'penang')"),
    type: z.enum(["federal", "state", "islamic", "islamic_state", "replacement", "adhoc"]).optional(),
    status: z.enum(["confirmed", "tentative", "announced", "cancelled"]).optional(),
    month: z.number().int().min(1).max(12).optional(),
  },
  async ({ year, state, type, status, month }) => {
    const holidays = loadYear<Holiday>("holidays", year);
    let stateCode: string | undefined;
    if (state) {
      const resolved = resolveStateCode(state, states);
      stateCode = resolved?.code;
    }
    const filtered = filterHolidays(holidays, { year, month, state: stateCode, type: type as HolidayType, status });
    return { content: [{ type: "text", text: JSON.stringify({ total: filtered.length, holidays: filtered }, null, 2) }] };
  }
);

// Tool 2: check_malaysia_holiday
server.tool(
  "check_malaysia_holiday",
  "Check if a specific date is a public holiday, weekend, or working day in Malaysia. Returns holiday details, school day status. Use when user asks 'is X a holiday?', 'do I work on X?'.",
  {
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD format"),
    state: z.string().optional().describe("State code or alias"),
  },
  async ({ date, state: stateQuery }) => {
    const stateObj = stateQuery ? resolveStateCode(stateQuery, states) : states.find(s => s.code === "kuala-lumpur")!;
    if (!stateObj) return { content: [{ type: "text", text: `Unknown state: ${stateQuery}` }] };

    const year = parseInt(date.slice(0, 4));
    const holidays = loadYear<Holiday>("holidays", year);
    const schoolTerms = loadSchool<SchoolTerm>("terms", year);
    const schoolHols = loadSchool<SchoolHoliday>("holidays", year);

    const dayHolidays = findHolidaysByDate(date, holidays, stateObj.code);
    const weekend = isWeekend(date, stateObj);
    const isHoliday = dayHolidays.length > 0;
    const schoolDay = checkSchoolDay(date, schoolTerms, schoolHols, stateObj.group, isHoliday, weekend, stateObj.code);

    const result = {
      date,
      dayOfWeek: getDayOfWeekName(date),
      isHoliday,
      isWeekend: weekend,
      isWorkingDay: !weekend && !isHoliday,
      isSchoolDay: schoolDay,
      holidays: dayHolidays.map(h => ({ name: h.name, type: h.type, status: h.status })),
      state: { code: stateObj.code, group: stateObj.group },
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 3: next_malaysia_holiday
server.tool(
  "next_malaysia_holiday",
  "Find the next upcoming public holiday in Malaysia. Use when user asks 'when is the next holiday?'.",
  {
    state: z.string().optional().describe("State code or alias"),
    afterDate: z.string().optional().describe("Find holidays after this date (YYYY-MM-DD). Defaults to today."),
    type: z.enum(["federal", "state", "islamic", "islamic_state", "replacement", "adhoc"]).optional(),
    count: z.number().int().min(1).max(10).optional().describe("Number of holidays to return (default 1)"),
  },
  async ({ state, afterDate, type, count }) => {
    const after = afterDate ?? new Date().toISOString().slice(0, 10);
    const year = parseInt(after.slice(0, 4));
    const holidays = loadYear<Holiday>("holidays", year);
    const stateCode = state ? resolveStateCode(state, states)?.code : undefined;
    const next = findNextHoliday(after, holidays, stateCode, type as HolidayType, count ?? 1);
    return { content: [{ type: "text", text: JSON.stringify(next, null, 2) }] };
  }
);

// Tool 4: malaysia_business_days
server.tool(
  "malaysia_business_days",
  "Count business/working days between two dates for a Malaysian state. Excludes weekends and public holidays.",
  {
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Start date"),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("End date"),
    state: z.string().describe("State code or alias"),
  },
  async ({ start, end, state: stateQuery }) => {
    const stateObj = resolveStateCode(stateQuery, states);
    if (!stateObj) return { content: [{ type: "text", text: `Unknown state: ${stateQuery}` }] };
    const year = parseInt(start.slice(0, 4));
    const holidays = loadYear<Holiday>("holidays", year);
    const result = countBusinessDays(start, end, stateObj, holidays);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 5: malaysia_long_weekends
server.tool(
  "malaysia_long_weekends",
  "Find all long weekends (3+ consecutive non-working days) in Malaysia for a given year.",
  {
    year: z.number().int().describe("Year"),
    state: z.string().optional().describe("State code or alias (default: kuala-lumpur)"),
  },
  async ({ year, state }) => {
    const stateObj = state ? resolveStateCode(state, states) : states.find(s => s.code === "kuala-lumpur")!;
    if (!stateObj) return { content: [{ type: "text", text: `Unknown state` }] };

    const holidays = loadYear<Holiday>("holidays", year);
    const stateHolidays = filterHolidays(holidays, { state: stateObj.code, year });
    const holidayDates = new Set(stateHolidays.map(h => h.date));

    const longWeekends: Array<{ start: string; end: string; days: number; holidays: string[] }> = [];
    let current = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    while (current <= yearEnd) {
      if (!isWeekend(current, stateObj) && !holidayDates.has(current)) {
        const d = new Date(current + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + 1);
        current = d.toISOString().slice(0, 10);
        continue;
      }

      const start = current;
      const hols: string[] = [];
      let count = 0;
      while (current <= yearEnd && (isWeekend(current, stateObj) || holidayDates.has(current))) {
        if (holidayDates.has(current)) {
          const h = stateHolidays.find(h => h.date === current);
          if (h) hols.push(h.name.en);
        }
        count++;
        const d = new Date(current + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + 1);
        current = d.toISOString().slice(0, 10);
      }

      if (count >= 3) {
        const d = new Date(current + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() - 1);
        longWeekends.push({ start, end: d.toISOString().slice(0, 10), days: count, holidays: hols });
      }
    }

    return { content: [{ type: "text", text: JSON.stringify({ total: longWeekends.length, longWeekends }, null, 2) }] };
  }
);

// Tool 6: list_malaysia_states
server.tool(
  "list_malaysia_states",
  "List all 16 Malaysian states + 3 Federal Territories with weekend configurations and group assignments.",
  {},
  async () => {
    const summary = states.map(s => ({
      code: s.code, name: s.name.en, type: s.type, group: s.group,
      weekendDays: getWeekendDayNames(s, "2026-01-01"),
    }));
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

// Tool 7: resolve_malaysia_state
server.tool(
  "resolve_malaysia_state",
  "Resolve a state name or alias (e.g. 'KL', 'Penang', 'JB') to the canonical state code.",
  { query: z.string().describe("State name or alias to resolve") },
  async ({ query }) => {
    const state = resolveStateCode(query, states);
    if (!state) return { content: [{ type: "text", text: `No state matching "${query}". Available: ${states.map(s => s.code).join(", ")}` }] };
    return { content: [{ type: "text", text: JSON.stringify({ canonical: state.code, name: state.name, group: state.group }, null, 2) }] };
  }
);

// Tool 8: malaysia_holiday_changes
server.tool(
  "malaysia_holiday_changes",
  "Get recent changes to Malaysia holiday data (new holidays, confirmations, ad-hoc announcements).",
  { limit: z.number().int().optional().describe("Max entries (default 10)") },
  async ({ limit }) => {
    return { content: [{ type: "text", text: JSON.stringify({ message: "Changelog not yet populated. Data is current as of gazette GN-33499/33500/33501 (28 Aug 2025).", entries: [] }, null, 2) }] };
  }
);

// Tool 9: malaysia_school_terms
server.tool(
  "malaysia_school_terms",
  "Get Malaysia school term dates and day counts. Group A = Kedah/Kelantan/Terengganu, Group B = all other states.",
  {
    year: z.number().int().describe("Year"),
    group: z.enum(["A", "B"]).optional().describe("School group (default B)"),
  },
  async ({ year, group }) => {
    const g = (group ?? "B") as StateGroup;
    const terms = loadSchool<SchoolTerm>("terms", year).filter(t => t.group === g);
    return { content: [{ type: "text", text: JSON.stringify({ group: g, total: terms.length, terms }, null, 2) }] };
  }
);

// Tool 10: malaysia_school_holidays
server.tool(
  "malaysia_school_holidays",
  "Get Malaysia school holidays including cuti penggal, mid-year break, year-end break, and KPM bonus holidays.",
  {
    year: z.number().int().describe("Year"),
    group: z.enum(["A", "B"]).optional().describe("School group (default B)"),
  },
  async ({ year, group }) => {
    const g = (group ?? "B") as StateGroup;
    const hols = loadSchool<SchoolHoliday>("holidays", year).filter(h => h.group === g);
    return { content: [{ type: "text", text: JSON.stringify({ group: g, total: hols.length, holidays: hols }, null, 2) }] };
  }
);

// Tool 11: malaysia_exams
server.tool(
  "malaysia_exams",
  "Get Malaysia public exam schedule — SPM, STPM, MUET, PT3. Includes results announcement dates.",
  {
    year: z.number().int().describe("Year"),
    type: z.enum(["spm", "stpm", "muet", "pt3", "stam", "other"]).optional(),
  },
  async ({ year, type }) => {
    let exams = loadSchool<Exam>("exams", year);
    if (type) exams = exams.filter(e => e.type === type);
    return { content: [{ type: "text", text: JSON.stringify({ total: exams.length, exams }, null, 2) }] };
  }
);

// Tool 12: malaysia_is_school_day
server.tool(
  "malaysia_is_school_day",
  "Check if a date is a school day in Malaysia. Accepts state (auto-resolves to group) or group directly. Combines public holidays, school holidays, and weekend status.",
  {
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD"),
    state: z.string().optional().describe("State code or alias (auto-resolves to group)"),
    group: z.enum(["A", "B"]).optional().describe("School group directly"),
  },
  async ({ date, state: stateQuery, group: groupParam }) => {
    let stateObj: State | undefined;
    let g: StateGroup;

    if (stateQuery) {
      stateObj = resolveStateCode(stateQuery, states) ?? undefined;
      if (!stateObj) return { content: [{ type: "text", text: `Unknown state: ${stateQuery}` }] };
      g = stateObj.group;
    } else {
      g = (groupParam ?? "B") as StateGroup;
      stateObj = states.find(s => s.group === g);
    }

    const year = parseInt(date.slice(0, 4));
    const holidays = loadYear<Holiday>("holidays", year);
    const schoolTerms = loadSchool<SchoolTerm>("terms", year);
    const schoolHols = loadSchool<SchoolHoliday>("holidays", year);

    const isHoliday = findHolidaysByDate(date, holidays, stateObj?.code).length > 0;
    const weekend = stateObj ? isWeekend(date, stateObj) : false;
    const schoolDay = checkSchoolDay(date, schoolTerms, schoolHols, g, isHoliday, weekend, stateObj?.code);
    const term = findSchoolTermByDate(date, schoolTerms, g);
    const schoolHoliday = findSchoolHolidayByDate(date, schoolHols, g, stateObj?.code);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          date, dayOfWeek: getDayOfWeekName(date), isSchoolDay: schoolDay,
          isPublicHoliday: isHoliday, isWeekend: weekend, group: g,
          term: term ? { id: term.id, term: term.term } : null,
          holiday: schoolHoliday ? { id: schoolHoliday.id, name: schoolHoliday.name, type: schoolHoliday.type } : null,
        }, null, 2),
      }],
    };
  }
);

// ─── Start Server ───

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
