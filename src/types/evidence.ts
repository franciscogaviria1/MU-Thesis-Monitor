export type EvidenceSourceTier =
  | "tier_1"
  | "tier_2"
  | "tier_3"
  | "tier_4"
  | "unknown";

export type EvidenceType =
  | "market_data"
  | "news"
  | "manual_input"
  | "filing"
  | "earnings"
  | "analyst_revision"
  | "memory_pricing";

export type EvidenceImpactDirection =
  | "positive"
  | "negative"
  | "neutral"
  | "unknown";

export type EvidenceAffectedArea =
  | "business_thesis_health"
  | "valuation_risk"
  | "market_sentiment";

export type EvidenceConfidence = "high" | "medium" | "low" | "unknown";

export type EvidenceAnalysisStatus =
  | "not_analyzed"
  | "analyzed"
  | "manual_review_required";

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  sourceName: string;
  sourceTier: EvidenceSourceTier;
  sourceUrl: string;
  observedAt: string;
  createdAt: string;
  evidenceType: EvidenceType;
  impactDirection: EvidenceImpactDirection;
  affectedArea: EvidenceAffectedArea;
  confidence: EvidenceConfidence;
  analysisStatus: EvidenceAnalysisStatus;
}
