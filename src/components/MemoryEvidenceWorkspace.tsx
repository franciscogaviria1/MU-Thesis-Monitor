"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuditSummaryPanel } from "@/components/AuditSummaryPanel";
import { DecisionHistory } from "@/components/DecisionHistory";
import { EvidencePanel } from "@/components/EvidencePanel";
import { AIExplanationPanel } from "@/components/AIExplanationPanel";
import { MemoryDataSection } from "@/components/MemoryDataSection";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ScoreCard } from "@/components/ScoreCard";
import { SectionHeading } from "@/components/SectionHeading";
import { SystemHealth } from "@/components/SystemHealth";
import { TrendSummary } from "@/components/TrendSummary";
import {
  createManualMemoryEntry,
  MANUAL_MEMORY_STORAGE_KEY,
  manualMemoryEntryToEvidence,
  mergeManualMemoryEntries,
  parseStoredManualMemoryEntries,
} from "@/lib/manual-memory/manualMemoryService";
import {
  importManualMemoryEntries,
  loadPersistentDashboardState,
  persistDailyDashboardSnapshot,
  persistManualMemoryEntry,
} from "@/app/actions/persistence";
import { calculateDecision } from "@/lib/decision/decisionEngine";
import {
  buildAuditSummary,
  buildSystemHealth,
} from "@/lib/audit/auditService";
import { calculateScores } from "@/lib/scoring/scoringEngine";
import type { ScoreArea } from "@/types/dashboard";
import type { EvidenceItem } from "@/types/evidence";
import type {
  ManualMemoryDataEntry,
  ManualMemoryDataInput,
} from "@/types/manualMemoryData";
import type { MarketDataSnapshot } from "@/types/marketData";
import type { NewsFeedSnapshot } from "@/types/news";
import type {
  DailySnapshot,
  PersistenceStatus,
} from "@/types/persistence";

interface MemoryEvidenceWorkspaceProps {
  baseEvidenceItems: EvidenceItem[];
  scoreAreas: ScoreArea[];
  scoreSectionTitle: string;
  scoreSectionDescription: string;
  evidenceTitle: string;
  evidenceDescription: string;
  calculatedAt: string;
  marketData: MarketDataSnapshot;
  news: NewsFeedSnapshot;
  aiAvailable: boolean;
  children: ReactNode;
}

export function MemoryEvidenceWorkspace({
  baseEvidenceItems,
  scoreAreas,
  scoreSectionTitle,
  scoreSectionDescription,
  evidenceTitle,
  evidenceDescription,
  calculatedAt,
  marketData,
  news,
  aiAvailable,
  children,
}: MemoryEvidenceWorkspaceProps) {
  const [entries, setEntries] = useState<ManualMemoryDataEntry[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>({
      available: false,
      message: "Checking local persistence...",
    });
  const [decisionHistory, setDecisionHistory] = useState<DailySnapshot[]>([]);
  const [persistenceReady, setPersistenceReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydratePersistence() {
      let localEntries: ManualMemoryDataEntry[] = [];
      let nextStorageAvailable = true;

      try {
        localEntries = parseStoredManualMemoryEntries(
          window.localStorage.getItem(MANUAL_MEMORY_STORAGE_KEY),
        );
      } catch {
        nextStorageAvailable = false;
      }

      const persistentState = await loadPersistentDashboardState();
      const mergedEntries = mergeManualMemoryEntries(
        persistentState.manualEntries,
        localEntries,
      );

      if (cancelled) return;

      setEntries(mergedEntries);
      setStorageAvailable(nextStorageAvailable);
      setPersistenceStatus(persistentState.status);
      setDecisionHistory(persistentState.decisionHistory);
      setPersistenceReady(true);

      if (localEntries.length > 0 && persistentState.status.available) {
        const migrationStatus =
          await importManualMemoryEntries(localEntries);
        if (!cancelled) {
          setPersistenceStatus(migrationStatus);
        }
      }
    }

    void hydratePersistence();
    return () => {
      cancelled = true;
    };
  }, []);

  const evidenceItems = useMemo(
    () =>
      [...entries.map(manualMemoryEntryToEvidence), ...baseEvidenceItems].sort(
        (left, right) =>
          Date.parse(right.observedAt) - Date.parse(left.observedAt),
      ),
    [baseEvidenceItems, entries],
  );
  const scores = useMemo(
    () => calculateScores(evidenceItems, new Date(calculatedAt)),
    [calculatedAt, evidenceItems],
  );
  const decision = useMemo(
    () => calculateDecision({ scores, evidence: evidenceItems }),
    [evidenceItems, scores],
  );
  const audit = useMemo(
    () =>
      buildAuditSummary({
        evidence: evidenceItems,
        scores,
        decision,
        asOf: new Date(calculatedAt),
      }),
    [calculatedAt, decision, evidenceItems, scores],
  );
  const systemHealth = useMemo(
    () =>
      buildSystemHealth({
        marketData,
        news,
        manualEntries: entries,
        storageAvailable,
        evidence: evidenceItems,
        decision,
        aiAvailable,
        persistenceStatus,
        asOf: new Date(calculatedAt),
      }),
    [
      aiAvailable,
      calculatedAt,
      decision,
      entries,
      evidenceItems,
      marketData,
      news,
      persistenceStatus,
      storageAvailable,
    ],
  );

  useEffect(() => {
    if (!persistenceReady || !persistenceStatus.available) {
      return;
    }

    let cancelled = false;

    async function saveSnapshot() {
      const result = await persistDailyDashboardSnapshot({
        createdAt: calculatedAt,
        scores,
        decision,
        evidence: evidenceItems,
        audit,
        manualEntries: entries,
      });

      if (!cancelled) {
        setPersistenceStatus(result.status);
        if (result.status.available) {
          setDecisionHistory(result.decisionHistory);
        }
      }
    }

    void saveSnapshot();
    return () => {
      cancelled = true;
    };
  }, [
    audit,
    calculatedAt,
    decision,
    entries,
    evidenceItems,
    persistenceReady,
    persistenceStatus.available,
    scores,
  ]);

  async function addEntry(input: ManualMemoryDataInput) {
    const entry = createManualMemoryEntry(input);
    const nextEntries = [entry, ...entries];
    setEntries(nextEntries);
    let fallbackSaved = false;

    try {
      window.localStorage.setItem(
        MANUAL_MEMORY_STORAGE_KEY,
        JSON.stringify(nextEntries),
      );
      setStorageAvailable(true);
      fallbackSaved = true;
    } catch {
      setStorageAvailable(false);
    }

    const status = await persistManualMemoryEntry(entry);
    setPersistenceStatus(status);

    return {
      persisted: status.available,
      message: status.available
        ? "Memory data saved to local SQLite and added to evidence."
        : fallbackSaved
          ? "SQLite persistence is unavailable. The entry remains in this session and localStorage fallback."
          : "Persistence is unavailable. The entry remains in this page session.",
    };
  }

  return (
    <>
      <section className="score-section" aria-labelledby="scorecard-title">
        <SectionHeading
          title={scoreSectionTitle}
          description={scoreSectionDescription}
        />
        <div className="score-grid">
          {scoreAreas.map((area, index) => (
            <ScoreCard
              key={area.id}
              area={area}
              result={scores[scoreKey(area.id)]}
              index={index}
            />
          ))}
        </div>
      </section>

      <RecommendationPanel decision={decision} />

      <AIExplanationPanel
        scores={scores}
        decision={decision}
        evidence={evidenceItems}
        aiAvailable={aiAvailable}
      />

      <SystemHealth health={systemHealth} />
      <AuditSummaryPanel audit={audit} />
      <TrendSummary
        snapshots={decisionHistory}
        persistenceAvailable={persistenceStatus.available}
      />
      <DecisionHistory
        snapshots={decisionHistory}
        persistenceAvailable={persistenceStatus.available}
      />

      {children}

      <MemoryDataSection
        entries={entries}
        onAddEntry={addEntry}
        storageAvailable={storageAvailable}
      />
      <EvidencePanel
        title={evidenceTitle}
        description={evidenceDescription}
        items={evidenceItems}
      />
    </>
  );
}

function scoreKey(areaId: string) {
  switch (areaId) {
    case "business-thesis":
      return "business_thesis_health" as const;
    case "valuation-risk":
      return "valuation_risk" as const;
    case "market-sentiment":
      return "market_sentiment" as const;
    default:
      throw new Error(`Unsupported score area: ${areaId}`);
  }
}
