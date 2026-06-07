"use server";

import {
  importManualMemoryEntries as importEntries,
  loadPersistentDashboardState as loadState,
  persistDailySnapshot,
  persistEarningsRecord as persistEarnings,
  persistManualMemoryEntry as persistEntry,
} from "@/lib/persistence/localPersistenceService";
import type { EarningsRecord } from "@/types/earnings";
import type { ManualMemoryDataEntry } from "@/types/manualMemoryData";
import type {
  DailySnapshotInput,
  PersistentDashboardState,
  PersistenceStatus,
} from "@/types/persistence";

export async function loadPersistentDashboardState(): Promise<PersistentDashboardState> {
  return loadState();
}

export async function importManualMemoryEntries(
  entries: ManualMemoryDataEntry[],
): Promise<PersistenceStatus> {
  return importEntries(entries);
}

export async function persistManualMemoryEntry(
  entry: ManualMemoryDataEntry,
): Promise<PersistenceStatus> {
  return persistEntry(entry);
}

export async function persistEarningsRecord(
  record: EarningsRecord,
): Promise<PersistenceStatus> {
  return persistEarnings(record);
}

export async function persistDailyDashboardSnapshot(
  input: DailySnapshotInput,
) {
  return persistDailySnapshot(input);
}
