export interface Employee {
  [key: string]: string;
}

export interface WinnerRecord {
  round: number;
  roundLabel: string;
  winners: Employee[];
  timestamp: number;
}

export interface RoundConfig {
  id: string;
  label: string;
  count: number;
}

export interface AppConfig {
  nameColumn: string;
  idColumn: string;
  displayColumns: string[];
  rounds: RoundConfig[];
}

export type WSMessage =
  | { type: "START_DRAW"; roundId: string }
  | { type: "DRAW_RESULT"; roundId: string; roundLabel: string; winners: Employee[] }
  | { type: "SPINNING"; candidates: Employee[] }
  | { type: "RESET" };
