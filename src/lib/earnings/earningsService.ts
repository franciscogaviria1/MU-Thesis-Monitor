import type { DecisionResult } from "@/types/decision";
import type {
  EarningsChecklistItem,
  EarningsCommentary,
  EarningsRecord,
  EarningsReviewSummary,
  PostEarningsInput,
} from "@/types/earnings";
import type {
  EvidenceAffectedArea,
  EvidenceImpactDirection,
  EvidenceItem,
} from "@/types/evidence";
import type { MarketDataSnapshot } from "@/types/marketData";
import type { NewsFeedSnapshot } from "@/types/news";
import type { ScoringResults } from "@/types/scoring";

interface CreateEarningsRecordInput {
  input: PostEarningsInput;
  decision: DecisionResult;
  scores: ScoringResults;
  now?: Date;
}

interface BuildChecklistInput {
  evidence: EvidenceItem[];
  marketData: MarketDataSnapshot;
  news: NewsFeedSnapshot;
  aiAvailable: boolean;
  auditWarnings: string[];
  manualReviewState: {
    memoryReviewed: boolean;
    auditReviewed: boolean;
  };
  asOf?: Date;
}

export function createEarningsRecord({
  input,
  decision,
  scores,
  now = new Date(),
}: CreateEarningsRecordInput): EarningsRecord {
  return {
    ...input,
    id: createRecordId(now),
    createdAt: now.toISOString(),
    preEarningsDecision: {
      label: decision.label,
      confidence: decision.confidence,
    },
    preEarningsScores: {
      businessThesisHealth: scoreSnapshot(
        scores.business_thesis_health,
      ),
      valuationRisk: scoreSnapshot(scores.valuation_risk),
      marketSentiment: scoreSnapshot(scores.market_sentiment),
    },
  };
}

export function earningsRecordToEvidence(
  record: EarningsRecord,
): EvidenceItem[] {
  const common = {
    sourceName: "Manual earnings review",
    sourceTier: "tier_3" as const,
    sourceUrl: record.sourceUrl,
    observedAt: toObservedAt(record.earningsDate),
    createdAt: record.createdAt,
    evidenceType: "earnings" as const,
    confidence: "medium" as const,
    analysisStatus: "analyzed" as const,
  };
  const evidence: EvidenceItem[] = [
    commentaryEvidence(
      record,
      "hbm",
      "HBM commentary",
      record.hbmCommentary,
      "business_thesis_health",
      common,
    ),
    commentaryEvidence(
      record,
      "dram",
      "DRAM commentary",
      record.dramCommentary,
      "business_thesis_health",
      common,
    ),
    commentaryEvidence(
      record,
      "margin",
      "Margin commentary",
      record.marginCommentary,
      "business_thesis_health",
      common,
    ),
    {
      ...common,
      id: `earnings:${record.id}:guidance`,
      title: `Earnings guidance ${record.guidanceDirection}`,
      description: buildGuidanceDescription(record),
      impactDirection: guidanceThesisImpact(record.guidanceDirection),
      affectedArea: "business_thesis_health",
      analysisStatus:
        record.guidanceDirection === "unclear"
          ? "manual_review_required"
          : "analyzed",
    },
    {
      ...common,
      id: `earnings:${record.id}:expectation-risk`,
      title: "Earnings expectation risk",
      description: `Guidance was ${record.guidanceDirection}; Valuation Risk uses higher values for greater expectation risk.`,
      impactDirection: valuationRiskImpact(record.guidanceDirection),
      affectedArea: "valuation_risk",
      analysisStatus:
        record.guidanceDirection === "unclear"
          ? "manual_review_required"
          : "analyzed",
    },
    {
      ...common,
      id: `earnings:${record.id}:results`,
      title: "Reported earnings versus expectations",
      description: buildResultsDescription(record),
      impactDirection: resultsImpact(record),
      affectedArea: "market_sentiment",
      analysisStatus:
        hasComparableExpectations(record)
          ? "analyzed"
          : "manual_review_required",
    },
  ];

  return evidence;
}

export function buildPreEarningsChecklist({
  evidence,
  marketData,
  news,
  aiAvailable,
  auditWarnings,
  manualReviewState,
  asOf = new Date(),
}: BuildChecklistInput): EarningsChecklistItem[] {
  return [
    evidenceChecklistItem(
      "memory-pricing",
      "Memory pricing updated",
      evidence,
      (item) => item.evidenceType === "memory_pricing",
      asOf,
      30,
    ),
    evidenceChecklistItem(
      "hbm-demand",
      "HBM demand evidence updated",
      evidence,
      (item) =>
        item.affectedArea === "business_thesis_health" &&
        `${item.title} ${item.description}`.toLowerCase().includes("hbm"),
      asOf,
      30,
    ),
    {
      id: "news",
      label: "News evidence updated",
      complete: news.status === "fresh" && news.items.length > 0,
      detail: news.message,
    },
    {
      id: "market",
      label: "Market data updated",
      complete: marketData.status === "fresh",
      detail: marketData.message,
    },
    {
      id: "manual-review",
      label: "Manual DRAM/HBM data reviewed",
      complete: manualReviewState.memoryReviewed,
      detail: "Manual confirmation required before earnings.",
      manual: true,
    },
    {
      id: "ai",
      label: "AI explanation optional",
      complete: aiAvailable,
      detail: aiAvailable
        ? "Optional explanation is available but not required."
        : "AI is unavailable; this does not block the earnings workflow.",
      optional: true,
    },
    {
      id: "audit",
      label: "Audit warnings reviewed",
      complete:
        auditWarnings.length === 0 || manualReviewState.auditReviewed,
      detail:
        auditWarnings.length === 0
          ? "No current audit warnings require review."
          : `${auditWarnings.length} warning${auditWarnings.length === 1 ? "" : "s"} require manual review.`,
      manual: auditWarnings.length > 0,
    },
  ];
}

export function buildEarningsReviewSummary(
  record: EarningsRecord,
): EarningsReviewSummary {
  const signals = [
    commentarySignal(record.hbmCommentary),
    commentarySignal(record.dramCommentary),
    commentarySignal(record.marginCommentary),
    guidanceSignal(record.guidanceDirection),
    resultsSignal(record),
  ].filter((signal): signal is number => signal !== null);
  const positive = signals.filter((signal) => signal > 0).length;
  const negative = signals.filter((signal) => signal < 0).length;
  const warnings: string[] = [];
  const manualReviewItems: string[] = [];

  if (!record.revenueExpectation) {
    warnings.push("Revenue expectation is missing; no revenue beat/miss was inferred.");
    manualReviewItems.push("Add or verify the revenue expectation.");
  }

  if (!record.epsExpectation) {
    warnings.push("EPS expectation is missing; no EPS beat/miss was inferred.");
    manualReviewItems.push("Add or verify the EPS expectation.");
  }

  if (record.guidanceDirection === "unclear") {
    manualReviewItems.push("Clarify the direction of management guidance.");
  }

  for (const [label, value] of [
    ["HBM", record.hbmCommentary],
    ["DRAM", record.dramCommentary],
    ["Margin", record.marginCommentary],
  ] as const) {
    if (value === "unclear") {
      manualReviewItems.push(`Clarify ${label} commentary.`);
    }
  }

  return {
    outcome:
      signals.length === 0
        ? "insufficient evidence"
        : positive > 0 && negative > 0
          ? "mixed evidence"
          : positive > negative
            ? "thesis strengthened"
            : negative > positive
              ? "thesis weakened"
              : "insufficient evidence",
    majorThesisChanges: buildMajorChanges(record),
    warnings,
    manualReviewItems,
  };
}

export function daysUntilEarnings(earningsDate: string, asOf = new Date()) {
  const target = Date.parse(`${earningsDate}T12:00:00.000Z`);

  if (Number.isNaN(target)) {
    return null;
  }

  const today = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate(),
    12,
  );
  return Math.ceil((target - today) / (24 * 60 * 60 * 1000));
}

export function parseEarningsRecords(value: unknown): EarningsRecord[] {
  return Array.isArray(value) ? value.filter(isEarningsRecord) : [];
}

function commentaryEvidence(
  record: EarningsRecord,
  suffix: string,
  title: string,
  commentary: EarningsCommentary,
  affectedArea: EvidenceAffectedArea,
  common: Omit<
    EvidenceItem,
    "id" | "title" | "description" | "impactDirection" | "affectedArea"
  >,
): EvidenceItem {
  return {
    ...common,
    id: `earnings:${record.id}:${suffix}`,
    title: `${title}: ${commentary}`,
    description: `${title} was recorded as ${commentary} for the ${record.earningsDate} earnings review.${record.notes ? ` ${record.notes}` : ""}`,
    impactDirection: commentaryImpact(commentary),
    affectedArea,
    analysisStatus:
      commentary === "unclear" ? "manual_review_required" : "analyzed",
  };
}

function evidenceChecklistItem(
  id: string,
  label: string,
  evidence: EvidenceItem[],
  matches: (item: EvidenceItem) => boolean,
  asOf: Date,
  freshnessDays: number,
): EarningsChecklistItem {
  const matching = evidence.filter(matches);
  const current = matching.some(
    (item) =>
      ageDays(item.observedAt, asOf) <= freshnessDays &&
      item.analysisStatus !== "manual_review_required",
  );

  return {
    id,
    label,
    complete: current,
    detail:
      matching.length === 0
        ? "No matching evidence is available."
        : current
          ? `Current evidence is available within ${freshnessDays} days.`
          : `Matching evidence is stale or requires review; freshness target is ${freshnessDays} days.`,
  };
}

function commentaryImpact(
  commentary: EarningsCommentary,
): EvidenceImpactDirection {
  return commentary === "unclear" ? "unknown" : commentary;
}

function valuationRiskImpact(
  guidance: EarningsRecord["guidanceDirection"],
): EvidenceImpactDirection {
  switch (guidance) {
    case "raised":
      return "negative";
    case "lowered":
      return "positive";
    case "unchanged":
      return "neutral";
    case "unclear":
      return "unknown";
  }
}

function guidanceThesisImpact(
  guidance: EarningsRecord["guidanceDirection"],
): EvidenceImpactDirection {
  switch (guidance) {
    case "raised":
      return "positive";
    case "lowered":
      return "negative";
    case "unchanged":
      return "neutral";
    case "unclear":
      return "unknown";
  }
}

function resultsImpact(record: EarningsRecord): EvidenceImpactDirection {
  const revenue = compareNumbers(
    record.reportedRevenue,
    record.revenueExpectation,
  );
  const eps = compareNumbers(record.reportedEps, record.epsExpectation);
  const comparable = [revenue, eps].filter(
    (value): value is number => value !== null,
  );

  if (comparable.length === 0) return "unknown";
  const total = comparable.reduce((sum, value) => sum + value, 0);
  if (total > 0) return "positive";
  if (total < 0) return "negative";
  return "neutral";
}

function buildGuidanceDescription(record: EarningsRecord) {
  return `Management guidance was recorded as ${record.guidanceDirection}.${record.notes ? ` ${record.notes}` : ""}`;
}

function buildResultsDescription(record: EarningsRecord) {
  return [
    `Reported revenue: ${record.reportedRevenue}.`,
    record.revenueExpectation
      ? `Revenue expectation: ${record.revenueExpectation}.`
      : "Revenue expectation was not provided.",
    `Reported EPS: ${record.reportedEps}.`,
    record.epsExpectation
      ? `EPS expectation: ${record.epsExpectation}.`
      : "EPS expectation was not provided.",
  ].join(" ");
}

function hasComparableExpectations(record: EarningsRecord) {
  return (
    compareNumbers(record.reportedRevenue, record.revenueExpectation) !==
      null ||
    compareNumbers(record.reportedEps, record.epsExpectation) !== null
  );
}

function compareNumbers(reported: string, expected?: string) {
  if (!expected) return null;
  const reportedValue = parseNumber(reported);
  const expectedValue = parseNumber(expected);
  if (reportedValue === null || expectedValue === null) return null;
  if (reportedValue > expectedValue) return 1;
  if (reportedValue < expectedValue) return -1;
  return 0;
}

function parseNumber(value: string) {
  const normalized = value.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return normalized ? Number.parseFloat(normalized[0]) : null;
}

function commentarySignal(value: EarningsCommentary) {
  if (value === "positive") return 1;
  if (value === "negative") return -1;
  if (value === "neutral") return 0;
  return null;
}

function guidanceSignal(value: EarningsRecord["guidanceDirection"]) {
  if (value === "raised") return 1;
  if (value === "lowered") return -1;
  if (value === "unchanged") return 0;
  return null;
}

function resultsSignal(record: EarningsRecord) {
  const impact = resultsImpact(record);
  if (impact === "positive") return 1;
  if (impact === "negative") return -1;
  if (impact === "neutral") return 0;
  return null;
}

function buildMajorChanges(record: EarningsRecord) {
  return [
    `Guidance was ${record.guidanceDirection}.`,
    `HBM commentary was ${record.hbmCommentary}.`,
    `DRAM commentary was ${record.dramCommentary}.`,
    `Margin commentary was ${record.marginCommentary}.`,
  ];
}

function scoreSnapshot(score: ScoringResults["business_thesis_health"]) {
  return {
    score: score.score,
    confidence: score.confidence,
  };
}

function ageDays(value: string, asOf: Date) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return (asOf.getTime() - timestamp) / (24 * 60 * 60 * 1000);
}

function toObservedAt(date: string) {
  return `${date}T12:00:00.000Z`;
}

function createRecordId(now: Date) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `earnings-${now.getTime()}`;
}

function isEarningsRecord(value: unknown): value is EarningsRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.earningsDate === "string" &&
    typeof record.reportedRevenue === "string" &&
    typeof record.reportedEps === "string" &&
    ["raised", "lowered", "unchanged", "unclear"].includes(
      record.guidanceDirection as string,
    ) &&
    ["positive", "negative", "neutral", "unclear"].includes(
      record.hbmCommentary as string,
    ) &&
    ["positive", "negative", "neutral", "unclear"].includes(
      record.dramCommentary as string,
    ) &&
    ["positive", "negative", "neutral", "unclear"].includes(
      record.marginCommentary as string,
    ) &&
    typeof record.sourceUrl === "string" &&
    typeof record.preEarningsDecision === "object" &&
    typeof record.preEarningsScores === "object"
  );
}
