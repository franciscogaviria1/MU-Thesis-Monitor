import {
  average,
  buildScoreResult,
  isStale,
  knownImpactEvidence,
} from "@/lib/scoring/scoringUtils";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoreResult } from "@/types/scoring";

const FRESHNESS_DAYS = 14;
const EXPECTED_INPUTS = 3;

export function scoreMarketSentiment(
  evidence: EvidenceItem[],
  asOf: Date,
): ScoreResult {
  const relevantEvidence = evidence.filter(
    (item) =>
      item.affectedArea === "market_sentiment" ||
      (item.evidenceType === "market_data" &&
        item.title.toLowerCase().includes("price available")),
  );
  const directionalEvidence = knownImpactEvidence(
    relevantEvidence,
    asOf,
    FRESHNESS_DAYS,
  );
  const priceEvidence = relevantEvidence.flatMap((item) => {
    if (
      item.evidenceType !== "market_data" ||
      !item.title.toLowerCase().includes("price available") ||
      item.analysisStatus === "manual_review_required" ||
      isStale(item, asOf, FRESHNESS_DAYS)
    ) {
      return [];
    }

    const dailyChange = parseDailyChange(item.description);
    return dailyChange === null
      ? []
      : [{ evidence: item, score: dailyChangeScore(dailyChange) }];
  });
  const scoredEvidence = uniqueScoredEvidence([
    ...directionalEvidence,
    ...priceEvidence,
  ]);
  const coverage = Math.min(
    100,
    (scoredEvidence.length / EXPECTED_INPUTS) * 100,
  );
  const score = average(scoredEvidence.map((item) => item.score));
  const reasons =
    scoredEvidence.length === 0
      ? [
          "No current, directionally classified sentiment evidence is available; the score remains at the neutral baseline.",
          "Raw, not-analyzed headlines do not move Market Sentiment.",
        ]
      : [
          ...scoredEvidence.map(
            ({ evidence: item, score: itemScore }) =>
              `${item.title} contributes ${Math.round(itemScore)}/100 market sentiment.`,
          ),
          coverage < 60
            ? "Sentiment coverage is below the 60% evidence threshold, so the result is provisional."
            : "Sentiment coverage meets the minimum evidence threshold.",
        ];

  return buildScoreResult({
    scoredEvidence,
    relevantEvidence,
    score,
    coverage,
    reasons,
    asOf,
    freshnessDays: FRESHNESS_DAYS,
  });
}

function dailyChangeScore(changePercent: number) {
  if (changePercent > 2) return 70;
  if (changePercent > 0.5) return 60;
  if (changePercent < -2) return 30;
  if (changePercent < -0.5) return 40;
  return 50;
}

function parseDailyChange(value: string) {
  const match = value.match(/daily change of ([+-]?\d+(?:\.\d+)?)%/i);
  return match ? Number.parseFloat(match[1]) : null;
}

function uniqueScoredEvidence(
  evidence: ReturnType<typeof knownImpactEvidence>,
) {
  return [...new Map(evidence.map((item) => [item.evidence.id, item])).values()];
}
