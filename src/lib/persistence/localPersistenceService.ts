import { SQLitePersistenceProvider } from "@/lib/persistence/sqlitePersistenceProvider";
import type { PersistenceProvider } from "@/lib/persistence/persistenceProvider";
import { parseManualMemoryEntries } from "@/lib/manual-memory/manualMemoryService";
export { createDailySnapshot } from "@/lib/persistence/snapshotModel";
import type { ManualMemoryDataEntry } from "@/types/manualMemoryData";
import type {
  DailySnapshot,
  DailySnapshotInput,
  PersistentDashboardState,
  PersistenceStatus,
} from "@/types/persistence";

const HISTORY_LIMIT = 14;

let provider: PersistenceProvider | null = null;

export async function loadPersistentDashboardState(): Promise<PersistentDashboardState> {
  return loadPersistentDashboardStateWithProvider(getProvider());
}

export async function loadPersistentDashboardStateWithProvider(
  activeProvider: PersistenceProvider,
): Promise<PersistentDashboardState> {
  try {
    await activeProvider.initialize();
    const [manualEntries, decisionHistory] = await Promise.all([
      activeProvider.getManualMemoryEntries(),
      activeProvider.getDecisionHistory(HISTORY_LIMIT),
    ]);

    return {
      status: availableStatus(),
      manualEntries,
      decisionHistory,
    };
  } catch {
    return unavailableState();
  }
}

export async function importManualMemoryEntries(
  entries: ManualMemoryDataEntry[],
): Promise<PersistenceStatus> {
  const validEntries = parseManualMemoryEntries(entries);

  if (validEntries.length === 0) {
    return availableStatus("No valid manual memory entries needed import.");
  }

  try {
    const activeProvider = getProvider();
    await activeProvider.initialize();
    await activeProvider.upsertManualMemoryEntries(validEntries);
    return availableStatus(
      `${validEntries.length} manual memory entr${validEntries.length === 1 ? "y" : "ies"} imported locally.`,
    );
  } catch {
    return unavailableStatus();
  }
}

export async function persistManualMemoryEntry(
  entry: ManualMemoryDataEntry,
): Promise<PersistenceStatus> {
  return importManualMemoryEntries([entry]);
}

export async function persistDailySnapshot(
  input: DailySnapshotInput,
): Promise<{
  status: PersistenceStatus;
  snapshot: DailySnapshot | null;
  decisionHistory: DailySnapshot[];
}> {
  try {
    const activeProvider = getProvider();
    await activeProvider.initialize();
    await activeProvider.upsertManualMemoryEntries(input.manualEntries);
    const snapshot = await activeProvider.saveDailySnapshot(input);
    const decisionHistory = await activeProvider.getDecisionHistory(
      HISTORY_LIMIT,
    );

    return {
      status: availableStatus("Daily snapshot saved locally."),
      snapshot,
      decisionHistory,
    };
  } catch {
    return {
      status: unavailableStatus(),
      snapshot: null,
      decisionHistory: [],
    };
  }
}

function getProvider() {
  provider ??= new SQLitePersistenceProvider();
  return provider;
}

function availableStatus(message = "Local SQLite persistence is available.") {
  return { available: true, message };
}

function unavailableStatus() {
  return {
    available: false,
    message:
      "Local persistence is unavailable. Current session data will remain in memory and localStorage fallback when possible.",
  };
}

function unavailableState(): PersistentDashboardState {
  return {
    status: unavailableStatus(),
    manualEntries: [],
    decisionHistory: [],
  };
}
