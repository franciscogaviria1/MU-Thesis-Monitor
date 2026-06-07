export type TrendWindowDays = 7 | 14 | 30;

export type TrendDirection =
  | "improving"
  | "weakening"
  | "stable"
  | "insufficient_data";

export type MetricTrendDirection = "up" | "down" | "flat";

export interface TrendChange {
  metric: string;
  startValue: number;
  endValue: number;
  change: number;
  direction: MetricTrendDirection;
  startLabel?: string;
  endLabel?: string;
}

export interface TrendAnalysis {
  windowDays: TrendWindowDays;
  direction: TrendDirection;
  confidence: number;
  summary: string;
  changes: TrendChange[];
  warnings: string[];
}
