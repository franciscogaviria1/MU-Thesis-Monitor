import type { EvidenceItem } from "@/types/evidence";

export type ThesisArea =
  | "Business Thesis Health"
  | "Valuation Risk"
  | "Market Sentiment";

export type EvidenceImpact = "positive" | "negative" | "neutral";

export type DecisionLabel =
  | "Strong Hold"
  | "Hold"
  | "Watch"
  | "Reduce Review"
  | "Exit Review"
  | "Insufficient Evidence";

export interface ScoreDriver {
  label: string;
  signal: string;
  direction: EvidenceImpact;
}

export interface ScoreArea {
  id: string;
  name: ThesisArea;
  shortName: string;
  score: number;
  status: string;
  summary: string;
  drivers: ScoreDriver[];
}

export interface CoverageMetric {
  label: string;
  value: number;
  detail: string;
}

export interface ConfidenceCoverage {
  title: string;
  description: string;
  metrics: CoverageMetric[];
  missingDataTitle: string;
  missingDataWarnings: string[];
  verifiedLabel: string;
  lastVerified: string;
}

export interface DecisionLogEntry {
  id: string;
  date: string;
  label: DecisionLabel;
  keyReason: string;
  confidence: number;
}

export interface DashboardData {
  appName: string;
  subtitle: string;
  nextEarningsDate: string;
  disclaimer: string;
  methodologyNote: string;
  scoreSectionTitle: string;
  scoreSectionDescription: string;
  scoreAreas: ScoreArea[];
  confidenceCoverage: ConfidenceCoverage;
  evidenceSectionTitle: string;
  evidenceSectionDescription: string;
  evidenceItems: EvidenceItem[];
  decisionLogTitle: string;
  decisionLogDescription: string;
  decisionLog: DecisionLogEntry[];
  footerNote: string;
}
