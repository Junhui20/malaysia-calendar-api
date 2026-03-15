import type { State } from "./types.js";

export function resolveStateCode(
  query: string,
  states: readonly State[]
): State | null {
  const normalized = query.toLowerCase().trim();

  for (const state of states) {
    if (state.code === normalized) return state;

    for (const alias of state.aliases) {
      if (alias.toLowerCase() === normalized) return state;
    }
  }

  return null;
}

export function getStateByCode(
  code: string,
  states: readonly State[]
): State | null {
  return states.find((s) => s.code === code) ?? null;
}

export function getStatesByGroup(
  group: "A" | "B",
  states: readonly State[]
): readonly State[] {
  return states.filter((s) => s.group === group);
}
