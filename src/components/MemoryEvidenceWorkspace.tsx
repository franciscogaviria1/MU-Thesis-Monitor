"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { EvidencePanel } from "@/components/EvidencePanel";
import { MemoryDataSection } from "@/components/MemoryDataSection";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ScoreCard } from "@/components/ScoreCard";
import { SectionHeading } from "@/components/SectionHeading";
import {
  createManualMemoryEntry,
  MANUAL_MEMORY_STORAGE_KEY,
  manualMemoryEntryToEvidence,
  parseStoredManualMemoryEntries,
} from "@/lib/manual-memory/manualMemoryService";
import { calculateDecision } from "@/lib/decision/decisionEngine";
import { calculateScores } from "@/lib/scoring/scoringEngine";
import type { ScoreArea } from "@/types/dashboard";
import type { EvidenceItem } from "@/types/evidence";
import type {
  ManualMemoryDataEntry,
  ManualMemoryDataInput,
} from "@/types/manualMemoryData";

interface MemoryEvidenceWorkspaceProps {
  baseEvidenceItems: EvidenceItem[];
  scoreAreas: ScoreArea[];
  scoreSectionTitle: string;
  scoreSectionDescription: string;
  evidenceTitle: string;
  evidenceDescription: string;
  calculatedAt: string;
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
  children,
}: MemoryEvidenceWorkspaceProps) {
  const [entries, setEntries] = useState<ManualMemoryDataEntry[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    let nextEntries: ManualMemoryDataEntry[] = [];
    let nextStorageAvailable = true;

    try {
      nextEntries = parseStoredManualMemoryEntries(
        window.localStorage.getItem(MANUAL_MEMORY_STORAGE_KEY),
      );
    } catch {
      nextStorageAvailable = false;
    }

    const hydrationTimer = window.setTimeout(() => {
      setEntries(nextEntries);
      setStorageAvailable(nextStorageAvailable);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
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

  function addEntry(input: ManualMemoryDataInput) {
    const nextEntries = [createManualMemoryEntry(input), ...entries];
    setEntries(nextEntries);

    try {
      window.localStorage.setItem(
        MANUAL_MEMORY_STORAGE_KEY,
        JSON.stringify(nextEntries),
      );
      setStorageAvailable(true);
      return true;
    } catch {
      setStorageAvailable(false);
      return false;
    }
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
