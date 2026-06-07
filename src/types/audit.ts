import type { EvidenceItem } from "@/types/evidence";

export type AuditStatus =
  | "fresh"
  | "stale"
  | "unavailable"
  | "missing";

export interface AuditStatusItem {
  label: string;
  status: AuditStatus;
  detail: string;
  lastUpdated: string | null;
}

export interface SystemHealthSummary {
  marketData: AuditStatusItem;
  newsData: AuditStatusItem;
  manualMemoryData: AuditStatusItem;
  persistence: AuditStatusItem;
  evidenceCount: number;
  aiAvailable: boolean;
  lastSuccessfulUpdate: string | null;
  missingCriticalDataWarnings: string[];
}

export interface IgnoredEvidenceItem {
  evidence: EvidenceItem;
  reason: string;
}

export interface AuditSummary {
  scoreEvidence: EvidenceItem[];
  ignoredEvidence: IgnoredEvidenceItem[];
  decisionSafeguards: string[];
  confidenceReduced: boolean;
  confidenceReductionReasons: string[];
  authorityStatements: string[];
}
