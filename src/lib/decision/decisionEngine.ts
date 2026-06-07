import {
  DECISION_POLICY_VERSION,
  decisionThresholds,
} from "@/lib/decision/decisionPolicy";
import type { DecisionResult } from "@/types/decision";
import type { DecisionLabel } from "@/types/dashboard";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoreResult, ScoringResults } from "@/types/scoring";

interface DecisionEngineInput {
  scores: ScoringResults;
  evidence: EvidenceItem[];
  missingDataSignals?: string[];
  staleDataSignals?: string[];
}

export function calculateDecision({
  scores,
  evidence,
  missingDataSignals = [],
  staleDataSignals = [],
}: DecisionEngineInput): DecisionResult {
  const business = scores.business_thesis_health;
  const valuation = scores.valuation_risk;
  const sentiment = scores.market_sentiment;
  const evidenceUsed = resolveEvidenceUsed(scores, evidence);
  const warnings = collectWarnings({
    scores,
    evidence,
    missingDataSignals,
    staleDataSignals,
  });
  const corroboratingAdverseEvidence = evidenceUsed.filter(
    (item) =>
      item.impactDirection === "negative" &&
      item.sourceTier !== "tier_4" &&
      item.sourceTier !== "unknown",
  );
  const eligibleNonTierFourEvidence = evidenceUsed.filter(
    (item) =>
      item.sourceTier !== "tier_4" && item.sourceTier !== "unknown",
  );

  let label: DecisionLabel;
  const reasons: string[] = [];

  if (hasInsufficientCriticalEvidence(business, valuation)) {
    label = "Insufficient Evidence";
    reasons.push(
      "Business Thesis Health or Valuation Risk does not meet the minimum deterministic evidence and confidence gate.",
      "The system will not infer a review posture from missing critical inputs.",
    );
  } else if (
    business.score <= decisionThresholds.exitReview.businessScoreMax &&
    business.confidence >=
      decisionThresholds.exitReview.businessConfidenceMin &&
    corroboratingAdverseEvidence.length >=
      decisionThresholds.exitReview.corroboratingEvidenceMin
  ) {
    label = "Exit Review";
    reasons.push(
      `Business Thesis Health is materially adverse at ${business.score}/100 with ${business.confidence}% confidence.`,
      `${corroboratingAdverseEvidence.length} non-Tier-4 adverse evidence items corroborate the impairment.`,
    );
  } else if (
    business.score <= decisionThresholds.reduceReview.businessScoreMax &&
    business.confidence >=
      decisionThresholds.reduceReview.businessConfidenceMin
  ) {
    label =
      corroboratingAdverseEvidence.length > 0 ? "Reduce Review" : "Watch";
    reasons.push(
      `Business Thesis Health is weakening at ${business.score}/100.`,
      corroboratingAdverseEvidence.length > 0
        ? "Eligible non-Tier-4 evidence supports a higher-severity human review."
        : "Evidence quality limits the result to Watch; Tier 4 or unknown evidence cannot trigger Reduce Review.",
    );
  } else if (
    valuation.score >= decisionThresholds.reduceReview.valuationRiskMin &&
    valuation.confidence >=
      decisionThresholds.reduceReview.valuationConfidenceMin
  ) {
    label =
      eligibleNonTierFourEvidence.length > 0 ? "Reduce Review" : "Watch";
    reasons.push(
      `Valuation Risk is high at ${valuation.score}/100.`,
      eligibleNonTierFourEvidence.length > 0
        ? "Eligible non-Tier-4 adverse evidence supports a review of exposure."
        : "Valuation risk lacks eligible corroborating evidence for Reduce Review.",
    );
  } else if (
    business.score >= decisionThresholds.strongHold.businessScoreMin &&
    business.confidence >=
      decisionThresholds.strongHold.businessConfidenceMin &&
    valuation.score <= decisionThresholds.strongHold.valuationRiskMax &&
    valuation.confidence >=
      decisionThresholds.strongHold.valuationConfidenceMin &&
    sentiment.score >= decisionThresholds.strongHold.sentimentScoreMin &&
    sentiment.confidence >=
      decisionThresholds.strongHold.sentimentConfidenceMin &&
    warnings.length === 0
  ) {
    label = "Strong Hold";
    reasons.push(
      `Business Thesis Health is strongly supportive at ${business.score}/100.`,
      `Valuation Risk is acceptable at ${valuation.score}/100 and Market Sentiment is not materially adverse.`,
    );
  } else if (
    business.score >= decisionThresholds.hold.businessScoreMin &&
    business.confidence >=
      decisionThresholds.hold.businessConfidenceMin &&
    valuation.score <= decisionThresholds.hold.valuationRiskMax &&
    valuation.confidence >=
      decisionThresholds.hold.valuationConfidenceMin
  ) {
    label =
      sentiment.score <= decisionThresholds.watch.sentimentScoreMax ||
      sentiment.confidence < decisionThresholds.watch.marginalConfidence ||
      sentiment.status === "insufficient_evidence"
        ? "Watch"
        : "Hold";
    reasons.push(
      `Business Thesis Health remains supportive at ${business.score}/100.`,
      label === "Watch"
        ? "Weak or low-confidence Market Sentiment increases monitoring but cannot trigger Exit Review by itself."
        : `Valuation Risk remains within the Hold ceiling at ${valuation.score}/100.`,
    );
  } else {
    label = "Watch";
    reasons.push(
      "One or more scores are mixed, near a review threshold, or supported by marginal confidence.",
      `Business Thesis Health is ${business.score}/100, Valuation Risk is ${valuation.score}/100, and Market Sentiment is ${sentiment.score}/100.`,
    );
  }

  if (
    label === "Strong Hold" &&
    hasMissingCriticalData(scores, warnings)
  ) {
    label = "Hold";
    reasons.push(
      "Missing or stale critical data prevents Strong Hold under policy version 1.0.0.",
    );
  }

  return {
    label,
    confidence:
      label === "Insufficient Evidence"
        ? Math.min(49, decisionConfidence(scores))
        : decisionConfidence(scores),
    reasons: [
      ...reasons,
      `Decision policy version ${DECISION_POLICY_VERSION} applied deterministically.`,
    ],
    warnings,
    evidenceUsed,
  };
}

function hasInsufficientCriticalEvidence(
  business: ScoreResult,
  valuation: ScoreResult,
) {
  return (
    business.status === "insufficient_evidence" ||
    valuation.status === "insufficient_evidence" ||
    business.confidence <
      decisionThresholds.insufficient.businessConfidence ||
    valuation.confidence <
      decisionThresholds.insufficient.valuationConfidence
  );
}

function collectWarnings({
  scores,
  evidence,
  missingDataSignals = [],
  staleDataSignals = [],
}: DecisionEngineInput) {
  const warnings = [...missingDataSignals, ...staleDataSignals];

  Object.entries(scores).forEach(([area, result]) => {
    if (result.status === "insufficient_evidence") {
      warnings.push(`${formatArea(area)} has insufficient eligible evidence.`);
    }
  });

  evidence.forEach((item) => {
    const title = item.title.toLowerCase();

    if (
      item.analysisStatus === "manual_review_required" ||
      title.includes("unavailable") ||
      title.includes("stale") ||
      title.includes("incomplete")
    ) {
      warnings.push(`${item.title}: ${item.description}`);
    }
  });

  return [...new Set(warnings)];
}

function hasMissingCriticalData(
  scores: ScoringResults,
  warnings: string[],
) {
  return (
    scores.business_thesis_health.status === "insufficient_evidence" ||
    scores.valuation_risk.status === "insufficient_evidence" ||
    warnings.length > 0
  );
}

function resolveEvidenceUsed(
  scores: ScoringResults,
  evidence: EvidenceItem[],
) {
  const ids = new Set(
    Object.values(scores).flatMap((result) =>
      result.evidenceUsed.map((item) => item.id),
    ),
  );

  return evidence.filter((item) => ids.has(item.id));
}

function decisionConfidence(scores: ScoringResults) {
  return Math.round(
    scores.business_thesis_health.confidence * 0.5 +
      scores.valuation_risk.confidence * 0.3 +
      scores.market_sentiment.confidence * 0.2,
  );
}

function formatArea(value: string) {
  return value
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
