export interface StateOption {
  readonly code: string;
  readonly label: string;
  readonly group: "A" | "B";
}

export const STATE_OPTIONS: readonly StateOption[] = [
  { code: "johor", label: "Johor", group: "B" },
  { code: "kedah", label: "Kedah", group: "A" },
  { code: "kelantan", label: "Kelantan", group: "A" },
  { code: "terengganu", label: "Terengganu", group: "A" },
  { code: "perak", label: "Perak", group: "B" },
  { code: "pulau-pinang", label: "Pulau Pinang (Penang)", group: "B" },
  { code: "selangor", label: "Selangor", group: "B" },
  { code: "negeri-sembilan", label: "Negeri Sembilan", group: "B" },
  { code: "melaka", label: "Melaka", group: "B" },
  { code: "pahang", label: "Pahang", group: "B" },
  { code: "perlis", label: "Perlis", group: "B" },
  { code: "sabah", label: "Sabah", group: "B" },
  { code: "sarawak", label: "Sarawak", group: "B" },
  { code: "kuala-lumpur", label: "W.P. Kuala Lumpur", group: "B" },
  { code: "wp-putrajaya", label: "W.P. Putrajaya", group: "B" },
  { code: "wp-labuan", label: "W.P. Labuan", group: "B" },
];

export function findState(code: string): StateOption | undefined {
  return STATE_OPTIONS.find((s) => s.code === code);
}
