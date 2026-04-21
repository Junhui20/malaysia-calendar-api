import { useState } from "react";
import type { LongWeekend } from "@catlabtech/mycal-core";
import { StatePicker } from "./StatePicker";
import { apiBaseUrl } from "~/lib/api";
import styles from "./demo.module.css";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1].filter((y) => y >= 2024 && y <= 2026);

export function LongWeekendPlanner() {
  const [state, setState] = useState<string>("selangor");
  const [year, setYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<readonly LongWeekend[] | null>(null);

  const endpoint = `${apiBaseUrl}/holidays/long-weekends?year=${year}&state=${state}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const body = await res.json();
      if (!res.ok || body.error) {
        setError(body.error?.message ?? `HTTP ${res.status}`);
        setResults(null);
      } else {
        setResults(body.data ?? body);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setResults(null);
    }
    setLoading(false);
  }

  function formatRange(w: LongWeekend): string {
    const start = new Date(w.startDate);
    const end = new Date(w.endDate);
    const sameMonth = start.getMonth() === end.getMonth();
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return sameMonth
      ? `${start.toLocaleDateString("en-MY", opts)} – ${end.getDate()}`
      : `${start.toLocaleDateString("en-MY", opts)} – ${end.toLocaleDateString("en-MY", opts)}`;
  }

  return (
    <div className={styles.panel}>
      <form onSubmit={onSubmit}>
        <div className={styles.controls}>
          <StatePicker value={state} onChange={setState} />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="year">
              Year
            </label>
            <select
              id="year"
              className={styles.select}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.concat([2026]).filter((v, i, a) => a.indexOf(v) === i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>&nbsp;</span>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Finding…" : "Find long weekends"}
            </button>
          </div>
        </div>
        <code className={styles.endpointHint}>GET {endpoint}</code>
      </form>

      {error && <div className={styles.error} style={{ marginTop: "1rem" }}>{error}</div>}

      {results && results.length === 0 && (
        <div className={styles.emptyState}>No long weekends found for this combination.</div>
      )}

      {results && results.length > 0 && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <span className={styles.resultTitle}>{results.length} long weekends found</span>
          </div>
          <ul className={styles.list}>
            {results.map((w, i) => (
              <li key={i} className={styles.listItem}>
                <div className={styles.listMain}>
                  <div className={styles.listName}>{formatRange(w)}</div>
                  <div className={styles.listMeta}>
                    {w.totalDays} days
                    {w.bridgeDaysNeeded > 0 ? ` · ${w.bridgeDaysNeeded} bridge day(s) needed` : ""}
                    {w.holidays.length > 0
                      ? ` · ${w.holidays.map((h) => h.name.en).join(", ")}`
                      : ""}
                  </div>
                </div>
                <span className={styles.listTag}>{w.totalDays}d</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
