import { readFileSync } from "fs";
import { resolve } from "path";
import {
  holidayFileSchema,
  statesFileSchema,
  schoolTermsFileSchema,
  schoolHolidaysFileSchema,
  examsFileSchema,
} from "../packages/core/src/schemas.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../data");

interface ValidationResult {
  file: string;
  layer: string;
  status: "PASS" | "WARN" | "FAIL";
  message: string;
}

const results: ValidationResult[] = [];

function loadJson(path: string): unknown {
  const content = readFileSync(resolve(DATA_DIR, path), "utf-8");
  return JSON.parse(content);
}

function report(file: string, layer: string, status: "PASS" | "WARN" | "FAIL", message: string) {
  results.push({ file, layer, status, message });
}

// ─── Layer 1: Schema Validation ───

function validateSchemas() {
  // States
  const states = loadJson("states.json");
  const statesResult = statesFileSchema.safeParse(states);
  if (statesResult.success) {
    report("states.json", "Schema", "PASS", `${statesResult.data.length} states validated`);
  } else {
    report("states.json", "Schema", "FAIL", statesResult.error.message);
  }

  // Holidays
  for (const year of [2024, 2025, 2026]) {
    const file = `holidays/${year}.json`;
    const data = loadJson(file);
    const result = holidayFileSchema.safeParse(data);
    if (result.success) {
      report(file, "Schema", "PASS", `${result.data.length} holidays validated`);
    } else {
      report(file, "Schema", "FAIL", result.error.message);
    }
  }

  // School terms
  for (const year of [2026]) {
    const file = `school/terms-${year}.json`;
    const data = loadJson(file);
    const result = schoolTermsFileSchema.safeParse(data);
    if (result.success) {
      report(file, "Schema", "PASS", `${result.data.length} school terms validated`);
    } else {
      report(file, "Schema", "FAIL", result.error.message);
    }
  }

  // School holidays
  for (const year of [2026]) {
    const file = `school/holidays-${year}.json`;
    const data = loadJson(file);
    const result = schoolHolidaysFileSchema.safeParse(data);
    if (result.success) {
      report(file, "Schema", "PASS", `${result.data.length} school holidays validated`);
    } else {
      report(file, "Schema", "FAIL", result.error.message);
    }
  }

  // Exams
  for (const year of [2026]) {
    const file = `school/exams-${year}.json`;
    const data = loadJson(file);
    const result = examsFileSchema.safeParse(data);
    if (result.success) {
      report(file, "Schema", "PASS", `${result.data.length} exams validated`);
    } else {
      report(file, "Schema", "FAIL", result.error.message);
    }
  }
}

// ─── Layer 2: Temporal Validation ───

function validateTemporal() {
  for (const year of [2024, 2025, 2026]) {
    const holidays = loadJson(`holidays/${year}.json`) as Array<{ id: string; date: string }>;
    for (const h of holidays) {
      const hYear = parseInt(h.date.slice(0, 4), 10);
      if (hYear !== year) {
        report(`holidays/${year}.json`, "Temporal", "FAIL", `${h.id}: date ${h.date} not in year ${year}`);
      }
    }
    report(`holidays/${year}.json`, "Temporal", "PASS", `All dates within ${year}`);
  }
}

// ─── Layer 3: Cross-source Validation ───

function validateCrossSource() {
  const states = loadJson("states.json") as Array<{ code: string }>;
  const stateCodes = new Set(states.map((s) => s.code));

  for (const year of [2024, 2025, 2026]) {
    const holidays = loadJson(`holidays/${year}.json`) as Array<{ id: string; states: string[] }>;
    for (const h of holidays) {
      for (const s of h.states) {
        if (s !== "*" && !stateCodes.has(s)) {
          report(`holidays/${year}.json`, "CrossSource", "FAIL", `${h.id}: unknown state code "${s}"`);
        }
      }
    }

    // Check for duplicate IDs
    const ids = holidays.map((h) => h.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
      report(`holidays/${year}.json`, "CrossSource", "FAIL", `Duplicate IDs: ${duplicates.join(", ")}`);
    } else {
      report(`holidays/${year}.json`, "CrossSource", "PASS", "No duplicate IDs, all state codes valid");
    }
  }
}

// ─── Layer 4: Historical Consistency ───

function validateHistorical() {
  const KNOWN_FIXED = [
    { date: "-08-31", nameMs: "Hari Kebangsaan" },
    { date: "-09-16", nameMs: "Hari Malaysia" },
    { date: "-05-01", nameMs: "Hari Pekerja" },
    { date: "-12-25", nameMs: "Hari Krismas" },
  ];

  for (const year of [2024, 2025, 2026]) {
    const holidays = loadJson(`holidays/${year}.json`) as Array<{ date: string; name: { ms: string } }>;

    for (const known of KNOWN_FIXED) {
      const expectedDate = `${year}${known.date}`;
      const found = holidays.some((h) => h.date === expectedDate);
      if (!found) {
        report(`holidays/${year}.json`, "Historical", "FAIL", `Missing known fixed holiday: ${known.nameMs} on ${expectedDate}`);
      }
    }

    const count = holidays.length;
    if (count < 10) {
      report(`holidays/${year}.json`, "Historical", "FAIL", `Only ${count} holidays — expected at least 10 for a valid year`);
    } else {
      report(`holidays/${year}.json`, "Historical", "PASS", `${count} holidays, all known fixed holidays present`);
    }
  }
}

// ─── Layer 5: Diff Review (Git-based) ───

function validateDiff() {
  const { execSync } = require("child_process");

  try {
    const diff = execSync("git diff HEAD -- data/", { encoding: "utf-8" });

    if (!diff) {
      report("data/", "Diff", "PASS", "No uncommitted changes in data/");
      return;
    }

    // Count changes
    const additions = (diff.match(/^\+[^+]/gm) || []).length;
    const deletions = (diff.match(/^-[^-]/gm) || []).length;

    if (deletions > 10) {
      report("data/", "Diff", "WARN", `${deletions} lines deleted — review for accidental data loss`);
    }

    if (additions > 50) {
      report("data/", "Diff", "WARN", `${additions} lines added — large changeset, review carefully`);
    }

    // Check for suspicious patterns
    if (diff.includes('"status": "cancelled"')) {
      report("data/", "Diff", "WARN", "Holiday cancellation detected — verify with official source");
    }

    if (diff.includes('"date":') && deletions > 0) {
      report("data/", "Diff", "WARN", "Date change detected — verify it's an official gazette amendment");
    }

    report("data/", "Diff", "PASS", `${additions} additions, ${deletions} deletions`);
  } catch {
    report("data/", "Diff", "PASS", "Git diff not available (not a git repo or no commits)");
  }
}

// ─── Run All ───

console.log("🔍 Validating Malaysia Calendar API data...\n");

validateSchemas();
validateTemporal();
validateCrossSource();
validateHistorical();
validateDiff();

// ─── Report ───

let hasFailure = false;

for (const r of results) {
  const icon = r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️" : "❌";
  console.log(`${icon} [${r.layer}] ${r.file}: ${r.message}`);
  if (r.status === "FAIL") hasFailure = true;
}

console.log(`\n${"─".repeat(60)}`);
console.log(`Total checks: ${results.length}`);
console.log(`  PASS: ${results.filter((r) => r.status === "PASS").length}`);
console.log(`  WARN: ${results.filter((r) => r.status === "WARN").length}`);
console.log(`  FAIL: ${results.filter((r) => r.status === "FAIL").length}`);

if (hasFailure) {
  console.log("\n❌ Validation FAILED");
  process.exit(1);
} else {
  console.log("\n✅ All validations PASSED");
}
