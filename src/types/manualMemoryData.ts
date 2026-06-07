import type { EvidenceSourceTier } from "@/types/evidence";

export type MemoryMetricCategory =
  | "server_dram_contract"
  | "dram_spot"
  | "hbm_demand"
  | "hbm_pricing"
  | "nand_pricing"
  | "other";

export type MemoryMetricDirection =
  | "rising"
  | "falling"
  | "flat"
  | "unknown";

export interface ManualMemoryDataEntry {
  id: string;
  metricName: string;
  category: MemoryMetricCategory;
  value: string;
  unit: string;
  direction: MemoryMetricDirection;
  period: string;
  sourceName: string;
  sourceTier: EvidenceSourceTier;
  sourceUrl?: string;
  observedAt: string;
  notes?: string;
}

export type ManualMemoryDataInput = Omit<
  ManualMemoryDataEntry,
  "id" | "observedAt"
>;
