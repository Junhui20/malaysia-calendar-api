import { useState } from "react";
import type { CheckDateResult } from "@mycal/core";
import { StatePicker } from "./StatePicker";
import { apiClient, apiBaseUrl } from "~/lib/api";
import styles from "./demo.module.css";

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function HolidayChecker() {
  const [date, setDate] = useState<string>("2026-03-21");
  const [state, setState] = useState<string>("selangor");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckDateResult | null>(null);

  const endpoint = `${apiBaseUrl}/holidays/check?date=${date}&state=${state}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiClient.check(date, state);
    setLoading(false);
    if (res.success) {
      setResult(res.data);
    } else {
      setError(`${res.error.code}: ${res.error.message}`);
      setResult(null);
    }
  }

  function setToday() {
    setDate(todayISO());
  }

  return (
    <div className={styles.panel}>
      <form onSubmit={onSubmit}>
        <div className={styles.controls}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="date">
              Date
            </label>
            <input
              id="date"
              type="date"
              className={styles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <StatePicker value={state} onChange={setState} />
          <div className={styles.field}>
            <span className={styles.label}>&nbsp;</span>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Checking…" : "Check date"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <button
            type="button"
            onClick={setToday}
            className={styles.pill}
            style={{ cursor: "pointer" }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDate("2026-03-21")}
            className={styles.pill}
            style={{ cursor: "pointer" }}
          >
            Hari Raya 2026
          </button>
          <button
            type="button"
            onClick={() => setDate("2026-08-31")}
            className={styles.pill}
            style={{ cursor: "pointer" }}
          >
            Merdeka 2026
          </button>
        </div>
        <code className={styles.endpointHint}>GET {endpoint}</code>
      </form>

      {error && <div className={styles.error} style={{ marginTop: "1rem" }}>{error}</div>}

      {result && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <span className={styles.resultTitle}>
              {result.date} &middot; {result.dayOfWeek}
            </span>
            <span className={styles.dim}>Group {result.state.group}</span>
          </div>
          <div className={styles.pillRow}>
            <span className={result.isHoliday ? `${styles.pill} ${styles.pillOn}` : styles.pill}>
              {result.isHoliday ? "✓ Holiday" : "Not a holiday"}
            </span>
            <span className={result.isWeekend ? `${styles.pill} ${styles.pillWarn}` : styles.pill}>
              {result.isWeekend ? "Weekend" : "Weekday"}
            </span>
            <span
              className={result.isWorkingDay ? `${styles.pill} ${styles.pillOn}` : styles.pill}
            >
              {result.isWorkingDay ? "✓ Working day" : "Non-working"}
            </span>
            <span className={result.isSchoolDay ? `${styles.pill} ${styles.pillOn}` : styles.pill}>
              {result.isSchoolDay ? "✓ School day" : "No school"}
            </span>
          </div>

          {result.holidays.length > 0 && (
            <ul className={styles.list}>
              {result.holidays.map((h) => (
                <li key={h.id} className={styles.listItem}>
                  <div className={styles.listMain}>
                    <div className={styles.listName}>{h.name.en}</div>
                    <div className={styles.listMeta}>
                      {h.name.ms}
                      {h.name.zh ? ` · ${h.name.zh}` : ""}
                      {h.hijriDate ? ` · ${h.hijriDate}` : ""}
                    </div>
                  </div>
                  <span className={styles.listTag}>{h.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
