import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createDailySnapshot } from "@/lib/persistence/snapshotModel";
import { parseEarningsRecords } from "@/lib/earnings/earningsService";
import type { PersistenceProvider } from "@/lib/persistence/persistenceProvider";
import { parseManualMemoryEntries } from "@/lib/manual-memory/manualMemoryService";
import type { ManualMemoryDataEntry } from "@/types/manualMemoryData";
import type { EarningsRecord } from "@/types/earnings";
import type {
  DailySnapshot,
  DailySnapshotInput,
} from "@/types/persistence";

interface JsonRow {
  payload_json: string;
}

export class SQLitePersistenceProvider implements PersistenceProvider {
  private database: DatabaseSync | null = null;

  constructor(private readonly databasePath = defaultDatabasePath()) {}

  async initialize(): Promise<void> {
    const database = this.getDatabase();

    database.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS manual_memory_entries (
        id TEXT PRIMARY KEY,
        observed_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS earnings_records (
        id TEXT PRIMARY KEY,
        earnings_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS daily_snapshots (
        id TEXT PRIMARY KEY,
        snapshot_date TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        business_score INTEGER NOT NULL,
        business_confidence INTEGER NOT NULL,
        valuation_score INTEGER NOT NULL,
        valuation_confidence INTEGER NOT NULL,
        sentiment_score INTEGER NOT NULL,
        sentiment_confidence INTEGER NOT NULL,
        decision_label TEXT NOT NULL,
        decision_confidence INTEGER NOT NULL,
        key_reasons_json TEXT NOT NULL,
        warnings_json TEXT NOT NULL,
        evidence_ids_json TEXT NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS evidence_snapshots (
        snapshot_id TEXT NOT NULL,
        evidence_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY (snapshot_id, evidence_id)
      );
      CREATE TABLE IF NOT EXISTS score_snapshots (
        snapshot_id TEXT NOT NULL,
        area TEXT NOT NULL,
        score INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        PRIMARY KEY (snapshot_id, area)
      );
      CREATE TABLE IF NOT EXISTS decision_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        payload_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL
      );
    `);
  }

  async getManualMemoryEntries(): Promise<ManualMemoryDataEntry[]> {
    const rows = this.getDatabase()
      .prepare(
        "SELECT payload_json FROM manual_memory_entries ORDER BY observed_at DESC",
      )
      .all() as unknown as JsonRow[];

    return parseManualMemoryEntries(
      rows.flatMap((row) => safelyParseJson(row.payload_json)),
    );
  }

  async upsertManualMemoryEntries(
    entries: ManualMemoryDataEntry[],
  ): Promise<void> {
    const validEntries = parseManualMemoryEntries(entries);
    const statement = this.getDatabase().prepare(`
      INSERT INTO manual_memory_entries (
        id,
        observed_at,
        created_at,
        updated_at,
        payload_json
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        observed_at = excluded.observed_at,
        updated_at = excluded.updated_at,
        payload_json = excluded.payload_json
    `);
    const now = new Date().toISOString();

    validEntries.forEach((entry) => {
      statement.run(
        entry.id,
        entry.observedAt,
        now,
        now,
        JSON.stringify(entry),
      );
    });
  }

  async getEarningsRecords(): Promise<EarningsRecord[]> {
    const rows = this.getDatabase()
      .prepare(
        "SELECT payload_json FROM earnings_records ORDER BY earnings_date DESC, created_at DESC",
      )
      .all() as unknown as JsonRow[];

    return parseEarningsRecords(
      rows.flatMap((row) => safelyParseJson(row.payload_json)),
    );
  }

  async upsertEarningsRecord(record: EarningsRecord): Promise<void> {
    const validRecord = parseEarningsRecords([record])[0];
    if (!validRecord) {
      throw new Error("Invalid earnings record.");
    }

    const now = new Date().toISOString();
    this.getDatabase()
      .prepare(`
        INSERT INTO earnings_records (
          id,
          earnings_date,
          created_at,
          updated_at,
          payload_json
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          earnings_date = excluded.earnings_date,
          updated_at = excluded.updated_at,
          payload_json = excluded.payload_json
      `)
      .run(
        validRecord.id,
        validRecord.earningsDate,
        validRecord.createdAt,
        now,
        JSON.stringify(validRecord),
      );
  }

  async saveDailySnapshot(
    input: DailySnapshotInput,
  ): Promise<DailySnapshot> {
    const snapshot = createDailySnapshot(input);
    const snapshotDate = snapshot.createdAt.slice(0, 10);
    const database = this.getDatabase();

    try {
      database.exec("BEGIN");
      database
        .prepare(
          `
          INSERT INTO daily_snapshots (
            id,
            snapshot_date,
            created_at,
            business_score,
            business_confidence,
            valuation_score,
            valuation_confidence,
            sentiment_score,
            sentiment_confidence,
            decision_label,
            decision_confidence,
            key_reasons_json,
            warnings_json,
            evidence_ids_json,
            payload_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(snapshot_date) DO UPDATE SET
            id = excluded.id,
            created_at = excluded.created_at,
            business_score = excluded.business_score,
            business_confidence = excluded.business_confidence,
            valuation_score = excluded.valuation_score,
            valuation_confidence = excluded.valuation_confidence,
            sentiment_score = excluded.sentiment_score,
            sentiment_confidence = excluded.sentiment_confidence,
            decision_label = excluded.decision_label,
            decision_confidence = excluded.decision_confidence,
            key_reasons_json = excluded.key_reasons_json,
            warnings_json = excluded.warnings_json,
            evidence_ids_json = excluded.evidence_ids_json,
            payload_json = excluded.payload_json
        `,
        )
        .run(
          snapshot.id,
          snapshotDate,
          snapshot.createdAt,
          snapshot.businessThesisHealth.score,
          snapshot.businessThesisHealth.confidence,
          snapshot.valuationRisk.score,
          snapshot.valuationRisk.confidence,
          snapshot.marketSentiment.score,
          snapshot.marketSentiment.confidence,
          snapshot.decision.label,
          snapshot.decision.confidence,
          JSON.stringify(snapshot.keyReasons),
          JSON.stringify(snapshot.warnings),
          JSON.stringify(snapshot.evidenceIdsUsed),
          JSON.stringify(snapshot),
        );
      this.replaceChildRows(snapshot.id, input);
      database.exec("COMMIT");
      return snapshot;
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  async getDecisionHistory(limit = 14): Promise<DailySnapshot[]> {
    const rows = this.getDatabase()
      .prepare(
        "SELECT payload_json FROM daily_snapshots ORDER BY created_at DESC LIMIT ?",
      )
      .all(limit) as unknown as JsonRow[];

    return rows.flatMap((row) => {
      const parsed = safelyParseJson(row.payload_json);
      return isDailySnapshot(parsed) ? [parsed] : [];
    });
  }

  close() {
    this.database?.close();
    this.database = null;
  }

  private getDatabase() {
    if (!this.database) {
      mkdirSync(path.dirname(this.databasePath), { recursive: true });
      this.database = new DatabaseSync(this.databasePath);
    }

    return this.database;
  }

  private replaceChildRows(snapshotId: string, input: DailySnapshotInput) {
    const database = this.getDatabase();
    const childTables = [
      "evidence_snapshots",
      "score_snapshots",
      "decision_snapshots",
      "audit_snapshots",
    ];

    childTables.forEach((table) => {
      database.prepare(`DELETE FROM ${table} WHERE snapshot_id = ?`).run(snapshotId);
    });

    const evidenceStatement = database.prepare(
      "INSERT INTO evidence_snapshots (snapshot_id, evidence_id, payload_json) VALUES (?, ?, ?)",
    );
    input.evidence.forEach((item) => {
      evidenceStatement.run(snapshotId, item.id, JSON.stringify(item));
    });

    const scoreStatement = database.prepare(
      "INSERT INTO score_snapshots (snapshot_id, area, score, confidence, payload_json) VALUES (?, ?, ?, ?, ?)",
    );
    Object.entries(input.scores).forEach(([area, score]) => {
      scoreStatement.run(
        snapshotId,
        area,
        score.score,
        score.confidence,
        JSON.stringify(score),
      );
    });

    database
      .prepare(
        "INSERT INTO decision_snapshots (snapshot_id, label, confidence, payload_json) VALUES (?, ?, ?, ?)",
      )
      .run(
        snapshotId,
        input.decision.label,
        input.decision.confidence,
        JSON.stringify(input.decision),
      );

    database
      .prepare(
        "INSERT INTO audit_snapshots (snapshot_id, payload_json) VALUES (?, ?)",
      )
      .run(snapshotId, JSON.stringify(input.audit));
  }
}

function defaultDatabasePath() {
  return (
    process.env.MU_PERSISTENCE_PATH ??
    path.join(process.cwd(), "data", "mu-thesis-monitor.sqlite")
  );
}

function safelyParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isDailySnapshot(value: unknown): value is DailySnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Record<string, unknown>;
  return (
    typeof snapshot.id === "string" &&
    typeof snapshot.createdAt === "string" &&
    typeof snapshot.businessThesisHealth === "object" &&
    typeof snapshot.valuationRisk === "object" &&
    typeof snapshot.marketSentiment === "object" &&
    typeof snapshot.decision === "object" &&
    Array.isArray(snapshot.keyReasons) &&
    Array.isArray(snapshot.warnings) &&
    Array.isArray(snapshot.evidenceIdsUsed)
  );
}
