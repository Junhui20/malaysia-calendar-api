import { STATE_OPTIONS } from "~/lib/states";
import styles from "./demo.module.css";

interface Props {
  readonly value: string;
  readonly onChange: (code: string) => void;
  readonly id?: string;
  readonly label?: string;
}

export function StatePicker({ value, onChange, id = "state", label = "State" }: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {STATE_OPTIONS.map((s) => (
          <option key={s.code} value={s.code}>
            {s.label} (Group {s.group})
          </option>
        ))}
      </select>
    </div>
  );
}
