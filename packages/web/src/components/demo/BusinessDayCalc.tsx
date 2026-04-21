import { useState } from "react";
import type { BusinessDaysResult } from "@catlabtech/mycal-core";
import { StatePicker } from "./StatePicker";
import { apiClient, apiBaseUrl } from "~/lib/api";
import styles from "./demo.module.css";

type Mode = "count" | "add";

export function BusinessDayCalc() {
  const [mode, setMode] = useState<Mode>("count");
  const [state, setState] = useState<string>("selangor");
  const [start, setStart] = useState<string>("2026-03-01");
  const [end, setEnd] = useState<string>("2026-03-31");
  const [date, setDate] = useState<string>("2026-03-01");
  const [days, setDays] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [countResult, setCountResult] = useState<BusinessDaysResult | null>(null);
  const [addResult, setAddResult] = useState<{ resultDate: string; businessDays: number } | null>(
    null,
  );

  const endpoint =
    mode === "count"
      ? `${apiBaseUrl}/business-days?start=${start}&end=${end}&state=${state}`
      : `${apiBaseUrl}/business-days/add?date=${date}&days=${days}&state=${state}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCountResult(null);
    setAddResult(null);

    if (mode === "count") {
      const res = await apiClient.businessDays(start, end, state);
      if (res.success) setCountResult(res.data);
      else setError(`${res.error.code}: ${res.error.message}`);
    } else {
      const res = await apiClient.addBusinessDays(date, days, state);
      if (res.success) setAddResult({ resultDate: res.data.resultDate, businessDays: res.data.businessDays });
      else setError(`${res.error.code}: ${res.error.message}`);
    }
    setLoading(false);
  }

  return (
    <div className={styles.panel}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button
          type="button"
          onClick={() => setMode("count")}
          className={`${styles.pill} ${mode === "count" ? styles.pillOn : ""}`}
          style={{ cursor: "pointer" }}
        >
          Count days
        </button>
        <button
          type="button"
          onClick={() => setMode("add")}
          className={`${styles.pill} ${mode === "add" ? styles.pillOn : ""}`}
          style={{ cursor: "pointer" }}
        >
          Add days
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div className={styles.controls}>
          {mode === "count" ? (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="start">Start</label>
                <input
                  id="start"
                  type="date"
                  className={styles.input}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="end">End</label>
                <input
                  id="end"
                  type="date"
                  className={styles.input}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="date">From date</label>
                <input
                  id="date"
                  type="date"
                  className={styles.input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="days">Business days</label>
                <input
                  id="days"
                  type="number"
                  className={styles.input}
                  value={days}
                  min={-365}
                  max={365}
                  onChange={(e) => setDays(Number(e.target.value))}
                  required
                />
              </div>
            </>
          )}
          <StatePicker value={state} onChange={setState} />
          <div className={styles.field}>
            <span className={styles.label}>&nbsp;</span>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Calculating…" : "Calculate"}
            </button>
          </div>
        </div>
        <code className={styles.endpointHint}>GET {endpoint}</code>
      </form>

      {error && <div className={styles.error} style={{ marginTop: "1rem" }}>{error}</div>}

      {countResult && (
        <div className={styles.result}>
          <div className={styles.pillRow}>
            <span className={`${styles.pill} ${styles.pillOn}`}>
              {countResult.businessDays} business days
            </span>
            <span className={styles.pill}>{countResult.totalDays} total days</span>
            <span className={styles.pill}>{countResult.weekendDays} weekend days</span>
            <span className={styles.pill}>{countResult.holidays} holidays</span>
          </div>
          {countResult.holidayList.length > 0 && (
            <ul className={styles.list}>
              {countResult.holidayList.map((h) => (
                <li key={h.id} className={styles.listItem}>
                  <div className={styles.listMain}>
                    <div className={styles.listName}>{h.name.en}</div>
                    <div className={styles.listMeta}>{h.date}</div>
                  </div>
                  <span className={styles.listTag}>{h.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {addResult && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <span className={styles.resultTitle}>Result: {addResult.resultDate}</span>
            <span className={styles.dim}>{addResult.businessDays} business days</span>
          </div>
        </div>
      )}
    </div>
  );
}
