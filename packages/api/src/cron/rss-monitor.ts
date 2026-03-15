/**
 * RSS Monitor — Workers Cron Trigger
 *
 * Checks Malaysian news RSS feeds every 15 minutes for cuti peristiwa keywords.
 * When high-confidence match found, creates a candidate holiday for admin review.
 *
 * Configure in wrangler.toml under [triggers] with crons every 15 minutes.
 */

const RSS_FEEDS = [
  { name: "Bernama", url: "https://www.bernama.com/bm/rss/news.xml", lang: "ms" },
  { name: "Astro Awani", url: "https://www.astroawani.com/rss/latest", lang: "ms" },
  { name: "The Star", url: "https://www.thestar.com.my/rss/News", lang: "en" },
  { name: "Malay Mail", url: "https://www.malaymail.com/feed/rss/malaysia", lang: "en" },
] as const;

// HIGH confidence — auto-create candidate
const HIGH_KEYWORDS = [
  "cuti peristiwa",
  "hari kelepasan am tambahan",
  "cuti khas seluruh negara",
  "diisytiharkan sebagai cuti umum",
  "declare public holiday",
  "declares public holiday",
  "additional public holiday",
];

// MEDIUM confidence — flag for review
const MEDIUM_KEYWORDS = [
  "isytihar cuti",
  "mengumumkan cuti",
  "cuti sempena",
  "cuti hari mengundi",
  "cuti khas negeri",
  "special holiday declared",
  "replacement holiday",
];

// EXCLUSION — false positives
const EXCLUSION_KEYWORDS = [
  "tiada cuti",
  "bukan cuti umum",
  "cuti sakit",
  "cuti sekolah",
  "mungkin diisytiharkan",
  "belum diisytiharkan",
  "no public holiday",
  "not a public holiday",
];

interface RssItem {
  readonly title: string;
  readonly link: string;
  readonly pubDate: string;
  readonly source: string;
}

interface Candidate {
  readonly confidence: "high" | "medium";
  readonly item: RssItem;
  readonly matchedKeywords: readonly string[];
}

function extractItems(xml: string, source: string): readonly RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = content.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? content.match(/<title>(.*?)<\/title>/)?.[1]
      ?? "";
    const link = content.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
    const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

    items.push({ title, link, pubDate, source });
  }

  return items;
}

function analyzeItem(item: RssItem): Candidate | null {
  const text = item.title.toLowerCase();

  // Check exclusions first
  if (EXCLUSION_KEYWORDS.some((kw) => text.includes(kw))) {
    return null;
  }

  const highMatches = HIGH_KEYWORDS.filter((kw) => text.includes(kw));
  if (highMatches.length > 0) {
    return { confidence: "high", item, matchedKeywords: highMatches };
  }

  const mediumMatches = MEDIUM_KEYWORDS.filter((kw) => text.includes(kw));
  if (mediumMatches.length > 0) {
    return { confidence: "medium", item, matchedKeywords: mediumMatches };
  }

  return null;
}

export async function handleCron(
  _event: ScheduledEvent,
  _env: Record<string, unknown>,
  _ctx: ExecutionContext
): Promise<void> {
  console.log("[RSS Monitor] Starting scan...");

  const candidates: Candidate[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "MyCalBot/1.0 (+https://api.mycal.my)" },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        console.warn(`[RSS Monitor] ${feed.name}: HTTP ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const items = extractItems(xml, feed.name);

      // Only check items from last 2 hours
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const recentItems = items.filter((item) => {
        const pubTime = new Date(item.pubDate).getTime();
        return !isNaN(pubTime) && pubTime > twoHoursAgo;
      });

      for (const item of recentItems) {
        const candidate = analyzeItem(item);
        if (candidate) candidates.push(candidate);
      }

      console.log(
        `[RSS Monitor] ${feed.name}: ${items.length} items, ${recentItems.length} recent`
      );
    } catch (err) {
      console.error(`[RSS Monitor] ${feed.name} error:`, err);
    }
  }

  if (candidates.length > 0) {
    console.log(`[RSS Monitor] Found ${candidates.length} candidate(s):`);
    for (const c of candidates) {
      console.log(
        `  [${c.confidence.toUpperCase()}] ${c.item.source}: "${c.item.title}"`
      );
      console.log(`    Keywords: ${c.matchedKeywords.join(", ")}`);
      console.log(`    Link: ${c.item.link}`);
    }

    // In production: write candidates to KV/D1 for admin review
    // High confidence: auto-create draft holiday + notify admin
    // Medium confidence: just notify admin
  } else {
    console.log("[RSS Monitor] No candidates found.");
  }
}

// Type stubs for Workers Cron
interface ScheduledEvent {
  readonly scheduledTime: number;
  readonly cron: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
