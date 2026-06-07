import type { DecisionLabel } from "@/types/dashboard";
import type { EvidenceItem } from "@/types/evidence";

export interface DecisionResult {
  label: DecisionLabel;
  confidence: number;
  reasons: string[];
  warnings: string[];
  evidenceUsed: EvidenceItem[];
}
