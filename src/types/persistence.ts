import type { AuditSummary } from "@/types/audit";
import type { DecisionLabel } from "@/types/dashboard";
import type { EvidenceItem } from "@/types/evidence";
import type { ManualMemoryDataEntry } from "@/types/manualMemoryData";
import type { ScoringResults } from "@/types/scoring";

export interface PersistenceStatus {
  available: boolean;
  message: string;
}

export interface PersistedScoreSnapshot {
  score: number;
  confidence: number;
}

export interface DailySnapshot {
  id: string;
  createdAt: string;
  businessThesisHealth: PersistedScoreSnapshot;
  valuationRisk: PersistedScoreSnapshot;
  marketSentiment: PersistedScoreSnapshot;
  decision: {
    label: DecisionLabel;
    confidence: number;
  };
  keyReasons: string[];
  warnings: string[];
  evidenceIdsUsed: string[];
}

export interface DailySnapshotInput {
  createdAt: string;
  scores: ScoringResults;
  decision: {
    label: DecisionLabel;
    confidence: number;
    reasons: string[];
    warnings: string[];
    evidenceUsed: EvidenceItem[];
  };
  evidence: EvidenceItem[];
  audit: AuditSummary;
  manualEntries: ManualMemoryDataEntry[];
}

export interface PersistentDashboardState {
  status: PersistenceStatus;
  manualEntries: ManualMemoryDataEntry[];
  decisionHistory: DailySnapshot[];
}
