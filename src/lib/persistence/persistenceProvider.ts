import type { ManualMemoryDataEntry } from "@/types/manualMemoryData";
import type {
  DailySnapshot,
  DailySnapshotInput,
} from "@/types/persistence";

export interface PersistenceProvider {
  initialize(): Promise<void>;
  getManualMemoryEntries(): Promise<ManualMemoryDataEntry[]>;
  upsertManualMemoryEntries(
    entries: ManualMemoryDataEntry[],
  ): Promise<void>;
  saveDailySnapshot(input: DailySnapshotInput): Promise<DailySnapshot>;
  getDecisionHistory(limit?: number): Promise<DailySnapshot[]>;
}
