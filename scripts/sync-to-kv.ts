/**
 * Syncs JSON data files → Cloudflare KV (denormalized per-state keys).
 *
 * Usage: npx tsx scripts/sync-to-kv.ts [--dry-run]
 *
 * Requires: CLOUDFLARE_API_TOKEN and KV_NAMESPACE_ID env vars
 * Or use: npx wrangler kv key put --binding HOLIDAYS_KV <key> <value>
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname2 = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname2, "../data");

const DRY_RUN = process.argv.includes("--dry-run");
const YEARS = [2024, 2025, 2026];

interface KVEntry {
  readonly key: string;
  readonly value: string;
}

function loadJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(resolve(DATA_DIR, path), "utf-8"));
  } catch {
    return null;
  }
}

function buildKVEntries(): readonly KVEntry[] {
  const entries: KVEntry[] = [];

  // States config
  const states = loadJson("states.json") as Array<{ code: string }> | null;
  if (states) {
    entries.push({ key: "states:config", value: JSON.stringify(states) });
  }

  for (const year of YEARS) {
    // Full holiday list
    const holidays = loadJson(`holidays/${year}.json`) as Array<{
      states: string[];
      status: string;
    }> | null;
    if (!holidays) continue;

    entries.push({
      key: `holidays:${year}`,
      value: JSON.stringify(holidays),
    });

    // Per-state denormalized keys
    if (states) {
      for (const state of states) {
        const stateHolidays = holidays.filter(
          (h) =>
            h.status !== "cancelled" &&
            (h.states.includes("*") || h.states.includes(state.code))
        );
        entries.push({
          key: `holidays:${year}:${state.code}`,
          value: JSON.stringify(stateHolidays),
        });
      }
    }

    // School data
    const schoolTerms = loadJson(`school/terms-${year}.json`);
    if (schoolTerms) {
      entries.push({
        key: `school:terms:${year}`,
        value: JSON.stringify(schoolTerms),
      });
    }

    const schoolHolidays = loadJson(`school/holidays-${year}.json`);
    if (schoolHolidays) {
      entries.push({
        key: `school:holidays:${year}`,
        value: JSON.stringify(schoolHolidays),
      });
    }

    const exams = loadJson(`school/exams-${year}.json`);
    if (exams) {
      entries.push({
        key: `school:exams:${year}`,
        value: JSON.stringify(exams),
      });
    }
  }

  // Metadata
  entries.push({
    key: "meta:lastUpdated",
    value: new Date().toISOString(),
  });

  return entries;
}

async function uploadToKV(entries: readonly KVEntry[]) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const namespaceId = process.env.KV_NAMESPACE_ID;

  if (!accountId || !apiToken || !namespaceId) {
    console.error("Missing env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, KV_NAMESPACE_ID");
    console.log("Tip: use --dry-run to preview without uploading");
    process.exit(1);
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`;

  // KV bulk write accepts max 10,000 pairs, 100MB total
  const BATCH_SIZE = 100;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE).map((e) => ({
      key: e.key,
      value: e.value,
    }));

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`KV bulk write failed (batch ${i / BATCH_SIZE + 1}):`, body);
      process.exit(1);
    }

    console.log(`  Uploaded batch ${i / BATCH_SIZE + 1} (${batch.length} keys)`);
  }
}

// ─── Main ───

async function main() {
  const entries = buildKVEntries();

  console.log(`\n📦 KV Sync — ${entries.length} keys to upload`);
  console.log(`   Years: ${YEARS.join(", ")}`);

  if (DRY_RUN) {
    console.log("\n🔍 Dry run — keys that would be written:\n");
    for (const e of entries) {
      const sizeKB = (Buffer.byteLength(e.value) / 1024).toFixed(1);
      console.log(`  ${e.key}  (${sizeKB} KB)`);
    }
    console.log(`\n  Total: ${entries.length} keys`);
  } else {
    await uploadToKV(entries);
    console.log(`\n✅ Synced ${entries.length} keys to KV`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
