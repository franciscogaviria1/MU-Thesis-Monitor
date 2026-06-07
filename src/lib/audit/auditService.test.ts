import { describe, expect, it } from "vitest";
import {
  buildAuditSummary,
  buildSystemHealth,
} from "@/lib/audit/auditService";
import type { DecisionResult } from "@/types/decision";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoringResults } from "@/types/scoring";

const AS_OF = new Date("2026-06-07T16:00:00.000Z");

describe("audit service", () => {
  it("separates score evidence from ignored evidence", () => {
    const used = evidenceItem("used", {
      title: "HBM demand remains strong",
      affectedArea: "business_thesis_health",
      impactDirection: "positive",
    });
    const ignored = evidenceItem("ignored", {
      title: "Raw MU headline",
      evidenceType: "news",
      affectedArea: "market_sentiment",
      impactDirection: "unknown",
      analysisStatus: "not_analyzed",
    });
    const audit = buildAuditSummary({
      evidence: [used, ignored],
      scores: scoresWithUsedEvidence(used),
      decision: decision(),
      asOf: AS_OF,
    });

    expect(audit.scoreEvidence.map((item) => item.id)).toEqual(["used"]);
    expect(audit.ignoredEvidence[0].reason).toContain(
      "Raw news has not been directionally classified",
    );
  });

  it("explains stale and manual-review exclusions", () => {
    const stale = evidenceItem("stale", {
      title: "Old sentiment evidence",
      observedAt: "2026-05-01T12:00:00.000Z",
      affectedArea: "market_sentiment",
      impactDirection: "negative",
    });
    const review = evidenceItem("review", {
      title: "Pending analyst revision",
      affectedArea: "valuation_risk",
      impactDirection: "negative",
      analysisStatus: "manual_review_required",
    });
    const audit = buildAuditSummary({
      evidence: [stale, review],
      scores: emptyScores(),
      decision: decision(),
      asOf: AS_OF,
    });

    expect(audit.ignoredEvidence[0].reason).toContain(
      "freshness window is 14 days",
    );
    expect(audit.ignoredEvidence[1].reason).toContain(
      "Manual review is required",
    );
  });

  it("reports missing data confidence reduction and safeguards", () => {
    const audit = buildAuditSummary({
      evidence: [],
      scores: emptyScores(),
      decision: decision({
        label: "Insufficient Evidence",
        warnings: [
          "Valuation Risk has insufficient eligible evidence.",
          "Market data is unavailable.",
        ],
      }),
      asOf: AS_OF,
    });

    expect(audit.confidenceReduced).toBe(true);
    expect(audit.decisionSafeguards.join(" ")).toContain(
      "insufficient-evidence gate",
    );
    expect(audit.authorityStatements).toContain(
      "The deterministic decision remains the authority.",
    );
  });

  it("shows AI unavailable and provider warnings in system health", () => {
    const health = buildSystemHealth({
      marketData: {
        symbol: "MU",
        currency: "USD",
        currentPrice: null,
        dailyChangePercent: null,
        fiftyTwoWeekHigh: null,
        drawdownFromHighPercent: null,
        asOf: null,
        lastUpdated: null,
        providerName: "Alpha Vantage",
        status: "unavailable",
        message: "Market provider unavailable.",
      },
      news: {
        items: [],
        providerName: "GDELT",
        status: "stale",
        message: "Showing cached headlines.",
        lastUpdated: "2026-06-06T12:00:00.000Z",
      },
      manualEntries: [],
      storageAvailable: true,
      evidence: [],
      decision: decision(),
      aiAvailable: false,
      asOf: AS_OF,
    });

    expect(health.aiAvailable).toBe(false);
    expect(health.manualMemoryData.status).toBe("missing");
    expect(health.missingCriticalDataWarnings.join(" ")).toContain(
      "Market data is unavailable",
    );
    expect(health.missingCriticalDataWarnings.join(" ")).toContain(
      "News data is stale",
    );
  });
});

function scoresWithUsedEvidence(item: EvidenceItem): ScoringResults {
  return {
    ...emptyScores(),
    business_thesis_health: {
      score: 80,
      confidence: 70,
      reasons: [],
      evidenceUsed: [
        {
          id: item.id,
          title: item.title,
          sourceName: item.sourceName,
          observedAt: item.observedAt,
        },
      ],
      status: "current",
    },
  };
}

function emptyScores(): ScoringResults {
  return {
    business_thesis_health: scoreResult(),
    valuation_risk: scoreResult(),
    market_sentiment: scoreResult(),
  };
}

function scoreResult() {
  return {
    score: 50,
    confidence: 0,
    reasons: [],
    evidenceUsed: [],
    status: "insufficient_evidence" as const,
  };
}

function decision(
  overrides: Partial<DecisionResult> = {},
): DecisionResult {
  return {
    label: "Watch",
    confidence: 40,
    reasons: [],
    warnings: [],
    evidenceUsed: [],
    ...overrides,
  };
}

function evidenceItem(
  id: string,
  overrides: Partial<EvidenceItem>,
): EvidenceItem {
  return {
    id,
    title: "Synthetic evidence",
    description: "Synthetic evidence description.",
    sourceName: "Synthetic source",
    sourceTier: "tier_1",
    sourceUrl: "",
    observedAt: "2026-06-06T12:00:00.000Z",
    createdAt: "2026-06-06T12:00:00.000Z",
    evidenceType: "manual_input",
    impactDirection: "neutral",
    affectedArea: "business_thesis_health",
    confidence: "high",
    analysisStatus: "analyzed",
    ...overrides,
  };
}
