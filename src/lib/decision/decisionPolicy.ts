export const DECISION_POLICY_VERSION = "1.0.0";

export const decisionThresholds = {
  insufficient: {
    businessConfidence: 45,
    valuationConfidence: 35,
  },
  exitReview: {
    businessScoreMax: 29,
    businessConfidenceMin: 65,
    corroboratingEvidenceMin: 2,
  },
  reduceReview: {
    businessScoreMax: 44,
    businessConfidenceMin: 55,
    valuationRiskMin: 71,
    valuationConfidenceMin: 55,
  },
  watch: {
    businessScoreMax: 55,
    valuationRiskMin: 56,
    sentimentScoreMax: 44,
    marginalConfidence: 60,
  },
  strongHold: {
    businessScoreMin: 71,
    businessConfidenceMin: 75,
    valuationRiskMax: 44,
    valuationConfidenceMin: 60,
    sentimentScoreMin: 45,
    sentimentConfidenceMin: 50,
  },
  hold: {
    businessScoreMin: 56,
    businessConfidenceMin: 60,
    valuationRiskMax: 55,
    valuationConfidenceMin: 50,
  },
} as const;
