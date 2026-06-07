import { scoreBusinessThesisHealth } from "@/lib/scoring/businessThesisHealth";
import { scoreMarketSentiment } from "@/lib/scoring/marketSentiment";
import { scoreValuationRisk } from "@/lib/scoring/valuationRisk";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoringResults } from "@/types/scoring";

export function calculateScores(
  evidence: EvidenceItem[],
  asOf = new Date(),
): ScoringResults {
  return {
    business_thesis_health: scoreBusinessThesisHealth(evidence, asOf),
    valuation_risk: scoreValuationRisk(evidence, asOf),
    market_sentiment: scoreMarketSentiment(evidence, asOf),
  };
}
