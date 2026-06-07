import {
  average,
  buildScoreResult,
  isStale,
  knownImpactEvidence,
} from "@/lib/scoring/scoringUtils";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoreResult } from "@/types/scoring";

const FRESHNESS_DAYS = 30;
const EXPECTED_INPUTS = 3;

export function scoreValuationRisk(
  evidence: EvidenceItem[],
  asOf: Date,
): ScoreResult {
  const relevantEvidence = evidence.filter(
    (item) =>
      item.affectedArea === "valuation_risk" ||
      item.evidenceType === "analyst_revision",
  );
  const directionalEvidence = knownImpactEvidence(
    relevantEvidence,
    asOf,
    FRESHNESS_DAYS,
  );
  const drawdownEvidence = relevantEvidence.flatMap((item) => {
    if (
      !item.title.toLowerCase().includes("drawdown") ||
      item.analysisStatus === "manual_review_required" ||
      isStale(item, asOf, FRESHNESS_DAYS)
    ) {
      return [];
    }

    const drawdown = parseFirstPercent(item.description);
    return drawdown === null
      ? []
      : [{ evidence: item, score: drawdownRiskScore(Math.abs(drawdown)) }];
  });
  const scoredEvidence = uniqueScoredEvidence([
    ...directionalEvidence,
    ...drawdownEvidence,
  ]);
  const coverage = Math.min(
    100,
    (scoredEvidence.length / EXPECTED_INPUTS) * 100,
  );
  const score = average(scoredEvidence.map((item) => item.score));
  const reasons =
    scoredEvidence.length === 0
      ? [
          "No current valuation or analyst evidence can be scored; the result remains at the neutral risk baseline.",
          "Unavailable market data lowers confidence but is not treated as high valuation risk.",
        ]
      : [
          ...scoredEvidence.map(
            ({ evidence: item, score: itemScore }) =>
              `${item.title} contributes ${Math.round(itemScore)}/100 valuation risk.`,
          ),
          coverage < 60
            ? "Valuation coverage is below the 60% evidence threshold, so the result is provisional."
            : "Valuation coverage meets the minimum evidence threshold.",
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

function drawdownRiskScore(drawdownPercent: number) {
  if (drawdownPercent < 10) return 80;
  if (drawdownPercent < 20) return 65;
  if (drawdownPercent < 35) return 45;
  return 30;
}

function parseFirstPercent(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?%/);
  return match ? Number.parseFloat(match[0]) : null;
}

function uniqueScoredEvidence(
  evidence: ReturnType<typeof knownImpactEvidence>,
) {
  return [...new Map(evidence.map((item) => [item.evidence.id, item])).values()];
}
