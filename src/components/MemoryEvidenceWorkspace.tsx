"use client";

import { useEffect, useMemo, useState } from "react";
import { EvidencePanel } from "@/components/EvidencePanel";
import { MemoryDataSection } from "@/components/MemoryDataSection";
import {
  createManualMemoryEntry,
  MANUAL_MEMORY_STORAGE_KEY,
  manualMemoryEntryToEvidence,
  parseStoredManualMemoryEntries,
} from "@/lib/manual-memory/manualMemoryService";
import type { EvidenceItem } from "@/types/evidence";
import type {
  ManualMemoryDataEntry,
  ManualMemoryDataInput,
} from "@/types/manualMemoryData";

interface MemoryEvidenceWorkspaceProps {
  baseEvidenceItems: EvidenceItem[];
  evidenceTitle: string;
  evidenceDescription: string;
}

export function MemoryEvidenceWorkspace({
  baseEvidenceItems,
  evidenceTitle,
  evidenceDescription,
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
