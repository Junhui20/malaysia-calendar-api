import { useState } from "react";
import { StatePicker } from "./StatePicker";
import { apiClient, apiBaseUrl } from "~/lib/api";
import styles from "./demo.module.css";

export function IcalGenerator() {
  const [state, setState] = useState<string>("selangor");
  const [year, setYear] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const feedUrl = apiClient.icalUrl(state, year ? Number(year) : undefined);
  const webcalUrl = feedUrl.replace(/^https?:/, "webcal:");
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}`;

  async function copyToClipboard() {
    await navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.controls}>
        <StatePicker value={state} onChange={setState} />
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ical-year">Year (optional)</label>
          <select
            id="ical-year"
            className={styles.select}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      <div className={styles.result}>
        <div className={styles.resultHeader}>
          <span className={styles.resultTitle}>Your feed URL</span>
        </div>
        <code className={styles.endpointHint}>{feedUrl}</code>

        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            marginTop: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button onClick={copyToClipboard} className={styles.submit} type="button">
            {copied ? "✓ Copied!" : "Copy URL"}
          </button>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener"
            className={styles.submit}
            style={{ background: "var(--text)", textDecoration: "none" }}
          >
            Add to Google Calendar
          </a>
          <a
            href={webcalUrl}
            className={styles.submit}
            style={{ background: "var(--text)", textDecoration: "none" }}
          >
            Add to Apple Calendar
          </a>
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "1rem", lineHeight: 1.55 }}>
          Subscribed calendars auto-sync when the feed updates — no manual refresh needed.
          For Outlook and other clients, copy the URL above and paste into your calendar's "Add
          by URL" option.
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>
          Endpoint: <code>GET {apiBaseUrl}/feed/ical/{state}</code>
        </p>
      </div>
    </div>
  );
}
