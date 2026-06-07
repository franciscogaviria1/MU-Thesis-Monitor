import type {
  DailySnapshot,
  DailySnapshotInput,
} from "@/types/persistence";

export function createDailySnapshot(input: DailySnapshotInput): DailySnapshot {
  const date = input.createdAt.slice(0, 10);

  return {
    id: `daily:${date}`,
    createdAt: input.createdAt,
    businessThesisHealth: {
      score: input.scores.business_thesis_health.score,
      confidence: input.scores.business_thesis_health.confidence,
    },
    valuationRisk: {
      score: input.scores.valuation_risk.score,
      confidence: input.scores.valuation_risk.confidence,
    },
    marketSentiment: {
      score: input.scores.market_sentiment.score,
      confidence: input.scores.market_sentiment.confidence,
    },
    decision: {
      label: input.decision.label,
      confidence: input.decision.confidence,
    },
    keyReasons: input.decision.reasons.slice(0, 3),
    warnings: input.decision.warnings,
    evidenceIdsUsed: input.decision.evidenceUsed.map((item) => item.id),
  };
}
