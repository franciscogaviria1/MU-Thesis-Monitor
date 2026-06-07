import type { DecisionLabel } from "@/types/dashboard";
import type { PersistedScoreSnapshot } from "@/types/persistence";

export type GuidanceDirection = "raised" | "lowered" | "unchanged" | "unclear";

export type EarningsCommentary =
  | "positive"
  | "negative"
  | "neutral"
  | "unclear";

export interface PostEarningsInput {
  earningsDate: string;
  reportedRevenue: string;
  revenueExpectation?: string;
  reportedEps: string;
  epsExpectation?: string;
  guidanceDirection: GuidanceDirection;
  hbmCommentary: EarningsCommentary;
  dramCommentary: EarningsCommentary;
  marginCommentary: EarningsCommentary;
  notes?: string;
  sourceUrl: string;
}

export interface EarningsRecord extends PostEarningsInput {
  id: string;
  createdAt: string;
  preEarningsDecision: {
    label: DecisionLabel;
    confidence: number;
  };
  preEarningsScores: {
    businessThesisHealth: PersistedScoreSnapshot;
    valuationRisk: PersistedScoreSnapshot;
    marketSentiment: PersistedScoreSnapshot;
  };
}

export type EarningsReviewOutcome =
  | "thesis strengthened"
  | "thesis weakened"
  | "mixed evidence"
  | "insufficient evidence";

export interface EarningsReviewSummary {
  outcome: EarningsReviewOutcome;
  majorThesisChanges: string[];
  warnings: string[];
  manualReviewItems: string[];
}

export interface EarningsChecklistItem {
  id: string;
  label: string;
  complete: boolean;
  detail: string;
  optional?: boolean;
  manual?: boolean;
}
