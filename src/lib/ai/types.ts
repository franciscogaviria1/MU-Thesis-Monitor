import type { DecisionLabel } from "@/types/dashboard";
import type {
  EvidenceAffectedArea,
  EvidenceImpactDirection,
  EvidenceItem,
  EvidenceSourceTier,
} from "@/types/evidence";
import type { ScoringResults } from "@/types/scoring";

export type AIExplanationMode = "summary" | "challenge";

export interface AIExplanation {
  summary: string;
  bullCase: string[];
  bearCase: string[];
  contradictions: string[];
  uncertainties: string[];
  followUpChecks: string[];
}

export interface AISelectedEvidence {
  id: string;
  title: string;
  description: string;
  sourceName: string;
  sourceTier: EvidenceSourceTier;
  observedAt: string;
  impactDirection: EvidenceImpactDirection;
  affectedArea: EvidenceAffectedArea;
}

export interface AIExplanationInput {
  mode: AIExplanationMode;
  scores: {
    businessThesisHealth: AIExplanationScore;
    valuationRisk: AIExplanationScore;
    marketSentiment: AIExplanationScore;
  };
  decision: {
    label: DecisionLabel;
    confidence: number;
    reasons: string[];
    warnings: string[];
  };
  selectedEvidence: AISelectedEvidence[];
  missingOrStaleWarnings: string[];
}

export interface AIExplanationScore {
  score: number;
  confidence: number;
  reasons: string[];
}

export interface AIExplanationRequest {
  mode: AIExplanationMode;
  scores: ScoringResults;
  decision: {
    label: DecisionLabel;
    confidence: number;
    reasons: string[];
    warnings: string[];
    evidenceUsed: EvidenceItem[];
  };
  evidence: EvidenceItem[];
}

export type AIExplanationResult =
  | {
      status: "success";
      explanation: AIExplanation;
      generatedAt: string;
    }
  | {
      status: "unavailable" | "error";
      message: string;
    };
