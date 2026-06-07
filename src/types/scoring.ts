import type { EvidenceAffectedArea, EvidenceItem } from "@/types/evidence";

export type ScoreEvidenceReference = Pick<
  EvidenceItem,
  "id" | "title" | "sourceName" | "observedAt"
>;

export interface ScoreResult {
  score: number;
  confidence: number;
  reasons: string[];
  evidenceUsed: ScoreEvidenceReference[];
  status: "current" | "insufficient_evidence";
}

export type ScoringResults = Record<EvidenceAffectedArea, ScoreResult>;
