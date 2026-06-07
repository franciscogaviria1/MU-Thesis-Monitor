import type {
  EvidenceConfidence,
  EvidenceItem,
  EvidenceSourceTier,
} from "@/types/evidence";
import type {
  ManualMemoryDataEntry,
  ManualMemoryDataInput,
  MemoryMetricCategory,
  MemoryMetricDirection,
} from "@/types/manualMemoryData";

export const MANUAL_MEMORY_STORAGE_KEY = "mu-thesis-monitor:memory-data:v1";

const categories: MemoryMetricCategory[] = [
  "server_dram_contract",
  "dram_spot",
  "hbm_demand",
  "hbm_pricing",
  "nand_pricing",
  "other",
];

const directions: MemoryMetricDirection[] = [
  "rising",
  "falling",
  "flat",
  "unknown",
];

const sourceTiers: EvidenceSourceTier[] = [
  "tier_1",
  "tier_2",
  "tier_3",
  "tier_4",
  "unknown",
];

export function createManualMemoryEntry(
  input: ManualMemoryDataInput,
): ManualMemoryDataEntry {
  return {
    ...input,
    id: createEntryId(),
    observedAt: new Date().toISOString(),
  };
}

export function manualMemoryEntryToEvidence(
  entry: ManualMemoryDataEntry,
): EvidenceItem {
  return {
    id: `manual-memory:${entry.id}`,
    title: `${entry.metricName}: ${entry.value} ${entry.unit}`.trim(),
    description: buildDescription(entry),
    sourceName: entry.sourceName,
    sourceTier: entry.sourceTier,
    sourceUrl: entry.sourceUrl ?? "",
    observedAt: entry.observedAt,
    createdAt: entry.observedAt,
    evidenceType: entry.category === "other" ? "manual_input" : "memory_pricing",
    impactDirection: impactForDirection(entry.direction),
    affectedArea: "business_thesis_health",
    confidence: confidenceForTier(entry.sourceTier),
    analysisStatus: "not_analyzed",
  };
}

export function parseStoredManualMemoryEntries(
  serialized: string | null,
): ManualMemoryDataEntry[] {
  if (!serialized) {
    return [];
  }

  try {
    const value: unknown = JSON.parse(serialized);

    if (!Array.isArray(value)) {
      return [];
    }

    return parseManualMemoryEntries(value);
  } catch {
    return [];
  }
}

export function parseManualMemoryEntries(
  value: unknown,
): ManualMemoryDataEntry[] {
  return Array.isArray(value) ? value.filter(isManualMemoryEntry) : [];
}

export function mergeManualMemoryEntries(
  primary: ManualMemoryDataEntry[],
  fallback: ManualMemoryDataEntry[],
) {
  return [...new Map([...primary, ...fallback].map((entry) => [entry.id, entry])).values()].sort(
    (left, right) =>
      Date.parse(right.observedAt) - Date.parse(left.observedAt),
  );
}

function buildDescription(entry: ManualMemoryDataEntry) {
  const base = `${formatCategory(entry.category)} was entered for ${entry.period} with a ${entry.direction} direction.`;
  return entry.notes ? `${base} ${entry.notes}` : base;
}

function confidenceForTier(tier: EvidenceSourceTier): EvidenceConfidence {
  switch (tier) {
    case "tier_1":
      return "high";
    case "tier_2":
      return "medium";
    case "tier_3":
      return "low";
    case "tier_4":
    case "unknown":
      return "unknown";
  }
}

function impactForDirection(
  direction: MemoryMetricDirection,
): EvidenceItem["impactDirection"] {
  switch (direction) {
    case "rising":
      return "positive";
    case "falling":
      return "negative";
    case "flat":
      return "neutral";
    case "unknown":
      return "unknown";
  }
}

function isManualMemoryEntry(value: unknown): value is ManualMemoryDataEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === "string" &&
    typeof entry.metricName === "string" &&
    categories.includes(entry.category as MemoryMetricCategory) &&
    typeof entry.value === "string" &&
    typeof entry.unit === "string" &&
    directions.includes(entry.direction as MemoryMetricDirection) &&
    typeof entry.period === "string" &&
    typeof entry.sourceName === "string" &&
    sourceTiers.includes(entry.sourceTier as EvidenceSourceTier) &&
    (entry.sourceUrl === undefined || typeof entry.sourceUrl === "string") &&
    typeof entry.observedAt === "string" &&
    (entry.notes === undefined || typeof entry.notes === "string")
  );
}

function createEntryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatCategory(category: MemoryMetricCategory) {
  return category.replaceAll("_", " ");
}
