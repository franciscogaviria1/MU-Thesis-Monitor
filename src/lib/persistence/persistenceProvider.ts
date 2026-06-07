import type { ManualMemoryDataEntry } from "@/types/manualMemoryData";
import type { EarningsRecord } from "@/types/earnings";
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
  getEarningsRecords(): Promise<EarningsRecord[]>;
  upsertEarningsRecord(record: EarningsRecord): Promise<void>;
  saveDailySnapshot(input: DailySnapshotInput): Promise<DailySnapshot>;
  getDecisionHistory(limit?: number): Promise<DailySnapshot[]>;
}
