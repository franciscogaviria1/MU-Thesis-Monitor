import { isStale } from "@/lib/scoring/scoringUtils";
import type {
  AuditStatus,
  AuditSummary,
  SystemHealthSummary,
} from "@/types/audit";
import type { DecisionResult } from "@/types/decision";
import type { EvidenceItem } from "@/types/evidence";
import type { ManualMemoryDataEntry } from "@/types/manualMemoryData";
import type { MarketDataSnapshot } from "@/types/marketData";
import type { NewsFeedSnapshot } from "@/types/news";
import type { PersistenceStatus } from "@/types/persistence";
import type { ScoringResults } from "@/types/scoring";

const FRESHNESS_DAYS = {
  business_thesis_health: 90,
  valuation_risk: 30,
  market_sentiment: 14,
} as const;

interface BuildAuditSummaryInput {
  evidence: EvidenceItem[];
  scores: ScoringResults;
  decision: DecisionResult;
  asOf?: Date;
}

interface BuildSystemHealthInput {
  marketData: MarketDataSnapshot;
  news: NewsFeedSnapshot;
  manualEntries: ManualMemoryDataEntry[];
  storageAvailable: boolean;
  evidence: EvidenceItem[];
  decision: DecisionResult;
  aiAvailable: boolean;
  persistenceStatus?: PersistenceStatus;
  asOf?: Date;
}

export function buildAuditSummary({
  evidence,
  scores,
  decision,
  asOf = new Date(),
}: BuildAuditSummaryInput): AuditSummary {
  const usedIds = new Set(
    Object.values(scores).flatMap((score) =>
      score.evidenceUsed.map((item) => item.id),
    ),
  );
  const scoreEvidence = evidence.filter((item) => usedIds.has(item.id));
  const ignoredEvidence = evidence
    .filter((item) => !usedIds.has(item.id))
    .map((item) => ({
      evidence: item,
      reason: explainIgnoredEvidence(item, asOf),
    }));
  const confidenceReductionReasons = collectConfidenceReductionReasons(
    scores,
    decision,
  );

  return {
    scoreEvidence,
    ignoredEvidence,
    decisionSafeguards: collectDecisionSafeguards(decision, scores),
    confidenceReduced: confidenceReductionReasons.length > 0,
    confidenceReductionReasons,
    authorityStatements: [
      "AI explanation is optional.",
      "AI did not calculate the scores.",
      "AI did not calculate the decision label.",
      "The deterministic decision remains the authority.",
    ],
  };
}

export function buildSystemHealth({
  marketData,
  news,
  manualEntries,
  storageAvailable,
  evidence,
  decision,
  aiAvailable,
  persistenceStatus,
  asOf = new Date(),
}: BuildSystemHealthInput): SystemHealthSummary {
  const manualStatus = getManualMemoryStatus(
    manualEntries,
    storageAvailable,
    asOf,
  );
  const successfulUpdates = [
    marketData.status === "unavailable" ? null : marketData.lastUpdated,
    news.status === "unavailable" ? null : news.lastUpdated,
    manualStatus.status === "fresh" ? manualStatus.lastUpdated : null,
  ].filter((value): value is string => Boolean(value));

  return {
    marketData: {
      label: "Market data",
      status: marketData.status,
      detail: marketData.message,
      lastUpdated: marketData.lastUpdated,
    },
    newsData: {
      label: "News data",
      status: news.status,
      detail: news.message,
      lastUpdated: news.lastUpdated,
    },
    manualMemoryData: manualStatus,
    persistence: {
      label: "Local persistence",
      status: persistenceStatus?.available ? "fresh" : "unavailable",
      detail:
        persistenceStatus?.message ??
        "Local persistence status has not been checked.",
      lastUpdated: persistenceStatus?.available
        ? successfulUpdates[0] ?? null
        : null,
    },
    evidenceCount: evidence.length,
    aiAvailable,
    lastSuccessfulUpdate:
      successfulUpdates.sort(
        (left, right) => Date.parse(right) - Date.parse(left),
      )[0] ?? null,
    missingCriticalDataWarnings: collectCriticalWarnings(
      marketData,
      news,
      manualStatus.status,
      decision,
    ),
  };
}

function explainIgnoredEvidence(item: EvidenceItem, asOf: Date) {
  const freshnessDays = FRESHNESS_DAYS[item.affectedArea];

  if (item.analysisStatus === "manual_review_required") {
    return "Manual review is required before this item can affect a deterministic score.";
  }

  if (isStale(item, asOf, freshnessDays)) {
    return `Stale for ${formatArea(item.affectedArea)}; the current freshness window is ${freshnessDays} days.`;
  }

  if (
    item.evidenceType === "news" &&
    item.analysisStatus === "not_analyzed"
  ) {
    return "Raw news has not been directionally classified, so it cannot affect Market Sentiment.";
  }

  if (item.impactDirection === "unknown") {
    if (
      item.evidenceType === "market_data" &&
      item.title.toLowerCase().includes("drawdown")
    ) {
      return "The market drawdown record did not contain a usable deterministic percentage.";
    }

    if (
      item.evidenceType === "market_data" &&
      item.title.toLowerCase().includes("price available")
    ) {
      return "The market price record did not contain a usable deterministic daily change.";
    }

    return "Impact direction is unknown, so deterministic scoring cannot assign a contribution.";
  }

  if (
    item.affectedArea === "business_thesis_health" &&
    !matchesBusinessCategory(item)
  ) {
    return "The item does not match a configured Business Thesis Health category.";
  }

  return "The item was not selected by the current deterministic scoring rules.";
}

function collectDecisionSafeguards(
  decision: DecisionResult,
  scores: ScoringResults,
) {
  const safeguards: string[] = [];

  if (decision.label === "Insufficient Evidence") {
    safeguards.push(
      "The insufficient-evidence gate prevented a stronger review label.",
    );
  }

  if (
    scores.business_thesis_health.status === "insufficient_evidence" ||
    scores.valuation_risk.status === "insufficient_evidence"
  ) {
    safeguards.push(
      "Missing critical Business Thesis Health or Valuation Risk coverage constrained the decision.",
    );
  }

  if (
    decision.reasons.some((reason) =>
      reason.includes("Tier 4 or unknown evidence"),
    )
  ) {
    safeguards.push(
      "Tier 4 or unknown evidence was prevented from triggering a severe review label.",
    );
  }

  if (
    decision.reasons.some((reason) =>
      reason.includes("cannot trigger Exit Review"),
    )
  ) {
    safeguards.push(
      "Market Sentiment weakness was prevented from triggering Exit Review by itself.",
    );
  }

  if (
    decision.reasons.some((reason) =>
      reason.includes("prevents Strong Hold"),
    )
  ) {
    safeguards.push(
      "Missing or stale critical data prevented Strong Hold.",
    );
  }

  return safeguards.length > 0
    ? safeguards
    : ["No additional decision safeguard changed the threshold result."];
}

function collectConfidenceReductionReasons(
  scores: ScoringResults,
  decision: DecisionResult,
) {
  const reasons: string[] = [];

  Object.entries(scores).forEach(([area, score]) => {
    if (score.status === "insufficient_evidence") {
      reasons.push(
        `${formatArea(area)} confidence is constrained by insufficient eligible evidence.`,
      );
    }
  });

  if (
    decision.warnings.some((warning) =>
      /stale|missing|unavailable|incomplete|insufficient/i.test(warning),
    )
  ) {
    reasons.push(
      "Missing, stale, unavailable, or incomplete data produced decision warnings.",
    );
  }

  return [...new Set(reasons)];
}

function getManualMemoryStatus(
  entries: ManualMemoryDataEntry[],
  storageAvailable: boolean,
  asOf: Date,
) {
  if (!storageAvailable) {
    return {
      label: "Manual memory data",
      status: "unavailable" as const,
      detail: "Browser storage is unavailable; manual entries may not persist.",
      lastUpdated: null,
    };
  }

  if (entries.length === 0) {
    return {
      label: "Manual memory data",
      status: "missing" as const,
      detail: "No manual memory observations are saved in this browser.",
      lastUpdated: null,
    };
  }

  const latest = [...entries].sort(
    (left, right) =>
      Date.parse(right.observedAt) - Date.parse(left.observedAt),
  )[0];
  const stale = isDateStale(latest.observedAt, asOf, 90);

  return {
    label: "Manual memory data",
    status: stale ? ("stale" as const) : ("fresh" as const),
    detail: stale
      ? "The latest manual memory observation is older than 90 days."
      : `${entries.length} manual memory observation${entries.length === 1 ? "" : "s"} available.`,
    lastUpdated: latest.observedAt,
  };
}

function collectCriticalWarnings(
  marketData: MarketDataSnapshot,
  news: NewsFeedSnapshot,
  manualStatus: AuditStatus,
  decision: DecisionResult,
) {
  const warnings: string[] = [];

  if (marketData.status !== "fresh") {
    warnings.push(`Market data is ${marketData.status}: ${marketData.message}`);
  }

  if (news.status !== "fresh") {
    warnings.push(`News data is ${news.status}: ${news.message}`);
  }

  if (manualStatus !== "fresh") {
    warnings.push(`Manual memory data is ${manualStatus}.`);
  }

  warnings.push(
    ...decision.warnings.filter((warning) =>
      /stale|missing|unavailable|incomplete|insufficient/i.test(warning),
    ),
  );

  return [...new Set(warnings)];
}

function matchesBusinessCategory(item: EvidenceItem) {
  const text = `${item.title} ${item.description}`.toLowerCase();

  return (
    (text.includes("dram") && !text.includes("hbm")) ||
    text.includes("hbm") ||
    text.includes("nand") ||
    text.includes("ai infrastructure") ||
    text.includes("data center") ||
    text.includes("data-center") ||
    ["supply", "capacity", "inventory", "capex"].some((term) =>
      text.includes(term),
    )
  );
}

function isDateStale(
  value: string,
  asOf: Date,
  freshnessDays: number,
) {
  const timestamp = Date.parse(value);
  return (
    Number.isNaN(timestamp) ||
    asOf.getTime() - timestamp > freshnessDays * 24 * 60 * 60 * 1000
  );
}

function formatArea(value: string) {
  return value
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
