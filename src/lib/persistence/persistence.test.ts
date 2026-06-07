import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { mergeManualMemoryEntries } from "@/lib/manual-memory/manualMemoryService";
import { SQLitePersistenceProvider } from "@/lib/persistence/sqlitePersistenceProvider";
import { createDailySnapshot } from "@/lib/persistence/snapshotModel";
import { loadPersistentDashboardStateWithProvider } from "@/lib/persistence/localPersistenceService";
import type { PersistenceProvider } from "@/lib/persistence/persistenceProvider";
import type { AuditSummary } from "@/types/audit";
import type { EarningsRecord } from "@/types/earnings";
import type { EvidenceItem } from "@/types/evidence";
import type { ManualMemoryDataEntry } from "@/types/manualMemoryData";
import type { DailySnapshotInput } from "@/types/persistence";

const tempDirectories: string[] = [];

afterEach(() => {
  tempDirectories.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

describe("local persistence", () => {
  it("creates the required daily snapshot shape", () => {
    const snapshot = createDailySnapshot(snapshotInput());

    expect(snapshot.id).toBe("daily:2026-06-07");
    expect(snapshot.businessThesisHealth).toEqual({
      score: 80,
      confidence: 70,
    });
    expect(snapshot.decision.label).toBe("Watch");
    expect(snapshot.evidenceIdsUsed).toEqual(["evidence-1"]);
  });

  it("persists manual data and daily decision history in SQLite", async () => {
    const provider = createProvider();
    const manualEntry = memoryEntry("memory-1");

    await provider.initialize();
    await provider.upsertManualMemoryEntries([manualEntry]);
    await provider.saveDailySnapshot({
      ...snapshotInput(),
      manualEntries: [manualEntry],
    });

    expect(await provider.getManualMemoryEntries()).toEqual([manualEntry]);
    const history = await provider.getDecisionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].decision.label).toBe("Watch");
    provider.close();
  });

  it("updates the same daily snapshot instead of duplicating it", async () => {
    const provider = createProvider();
    await provider.initialize();
    await provider.saveDailySnapshot(snapshotInput());
    await provider.saveDailySnapshot({
      ...snapshotInput(),
      decision: {
        ...snapshotInput().decision,
        label: "Hold",
      },
    });

    const history = await provider.getDecisionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].decision.label).toBe("Hold");
    provider.close();
  });

  it("persists post-earnings records in SQLite", async () => {
    const provider = createProvider();
    const record = earningsRecord();

    await provider.initialize();
    await provider.upsertEarningsRecord(record);

    expect(await provider.getEarningsRecords()).toEqual([record]);
    provider.close();
  });

  it("merges localStorage migration entries without deleting persisted data", () => {
    const persisted = memoryEntry("persisted");
    const legacy = memoryEntry("legacy");
    const merged = mergeManualMemoryEntries(
      [persisted],
      [legacy, persisted],
    );

    expect(merged.map((entry) => entry.id).sort()).toEqual([
      "legacy",
      "persisted",
    ]);
  });

  it("converts persistence failures into a non-crashing fallback state", async () => {
    const state = await loadPersistentDashboardStateWithProvider(
      new FailingPersistenceProvider(),
    );

    expect(state.status.available).toBe(false);
    expect(state.manualEntries).toEqual([]);
    expect(state.decisionHistory).toEqual([]);
  });
});

class FailingPersistenceProvider implements PersistenceProvider {
  async initialize(): Promise<void> {
    throw new Error("Synthetic persistence failure");
  }

  async getManualMemoryEntries(): Promise<ManualMemoryDataEntry[]> {
    throw new Error("Synthetic persistence failure");
  }

  async upsertManualMemoryEntries(): Promise<void> {
    throw new Error("Synthetic persistence failure");
  }

  async getEarningsRecords(): Promise<EarningsRecord[]> {
    throw new Error("Synthetic persistence failure");
  }

  async upsertEarningsRecord(): Promise<void> {
    throw new Error("Synthetic persistence failure");
  }

  async saveDailySnapshot(): Promise<never> {
    throw new Error("Synthetic persistence failure");
  }

  async getDecisionHistory(): Promise<never> {
    throw new Error("Synthetic persistence failure");
  }
}

function createProvider() {
  const directory = mkdtempSync(path.join(tmpdir(), "mu-persistence-"));
  tempDirectories.push(directory);
  return new SQLitePersistenceProvider(path.join(directory, "test.sqlite"));
}

function snapshotInput(): DailySnapshotInput {
  const evidence = evidenceItem();
  return {
    createdAt: "2026-06-07T16:00:00.000Z",
    scores: {
      business_thesis_health: scoreResult(80, 70, evidence),
      valuation_risk: scoreResult(50, 55),
      market_sentiment: scoreResult(45, 40),
    },
    decision: {
      label: "Watch",
      confidence: 57,
      reasons: ["Deterministic key reason."],
      warnings: ["Market data is stale."],
      evidenceUsed: [evidence],
    },
    evidence: [evidence],
    audit: auditSummary(evidence),
    manualEntries: [],
  };
}

function scoreResult(
  score: number,
  confidence: number,
  evidence?: EvidenceItem,
) {
  return {
    score,
    confidence,
    reasons: [],
    evidenceUsed: evidence
      ? [
          {
            id: evidence.id,
            title: evidence.title,
            sourceName: evidence.sourceName,
            observedAt: evidence.observedAt,
          },
        ]
      : [],
    status: "current" as const,
  };
}

function evidenceItem(): EvidenceItem {
  return {
    id: "evidence-1",
    title: "HBM demand evidence",
    description: "Synthetic evidence.",
    sourceName: "Synthetic source",
    sourceTier: "tier_1",
    sourceUrl: "",
    observedAt: "2026-06-07T12:00:00.000Z",
    createdAt: "2026-06-07T12:00:00.000Z",
    evidenceType: "manual_input",
    impactDirection: "positive",
    affectedArea: "business_thesis_health",
    confidence: "high",
    analysisStatus: "analyzed",
  };
}

function memoryEntry(id: string): ManualMemoryDataEntry {
  return {
    id,
    metricName: "HBM demand",
    category: "hbm_demand",
    value: "Strong",
    unit: "qualitative",
    direction: "rising",
    period: "Q3 2026",
    sourceName: "Synthetic source",
    sourceTier: "tier_1",
    observedAt: "2026-06-07T12:00:00.000Z",
  };
}

function auditSummary(evidence: EvidenceItem): AuditSummary {
  return {
    scoreEvidence: [evidence],
    ignoredEvidence: [],
    decisionSafeguards: ["Insufficient evidence gate."],
    confidenceReduced: true,
    confidenceReductionReasons: ["Missing valuation data."],
    authorityStatements: [
      "The deterministic decision remains the authority.",
    ],
  };
}

function earningsRecord(): EarningsRecord {
  return {
    id: "earnings-1",
    createdAt: "2026-06-07T12:00:00.000Z",
    earningsDate: "2026-06-24",
    reportedRevenue: "8.5",
    revenueExpectation: "8.2",
    reportedEps: "1.80",
    epsExpectation: "1.60",
    guidanceDirection: "raised",
    hbmCommentary: "positive",
    dramCommentary: "neutral",
    marginCommentary: "positive",
    sourceUrl: "https://investors.micron.com/",
    preEarningsDecision: {
      label: "Watch",
      confidence: 49,
    },
    preEarningsScores: {
      businessThesisHealth: { score: 80, confidence: 88 },
      valuationRisk: { score: 50, confidence: 0 },
      marketSentiment: { score: 50, confidence: 70 },
    },
  };
}
