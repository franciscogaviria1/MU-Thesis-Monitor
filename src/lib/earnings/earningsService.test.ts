import { describe, expect, it } from "vitest";
import {
  buildEarningsReviewSummary,
  buildPreEarningsChecklist,
  createEarningsRecord,
  earningsRecordToEvidence,
} from "@/lib/earnings/earningsService";
import type { DecisionResult } from "@/types/decision";
import type { EarningsRecord } from "@/types/earnings";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoringResults } from "@/types/scoring";

const AS_OF = new Date("2026-06-07T12:00:00.000Z");

describe("earnings workflow", () => {
  it("calculates deterministic pre-earnings checklist state", () => {
    const checklist = buildPreEarningsChecklist({
      evidence: [
        evidenceItem("memory", "DRAM memory pricing"),
        evidenceItem("hbm", "HBM demand update"),
      ],
      marketData: {
        symbol: "MU",
        currency: "USD",
        currentPrice: 120,
        dailyChangePercent: 1,
        fiftyTwoWeekHigh: 130,
        drawdownFromHighPercent: 7.7,
        asOf: "2026-06-07",
        lastUpdated: "2026-06-07T11:00:00.000Z",
        providerName: "Alpha Vantage",
        status: "fresh",
        message: "Market data is current.",
      },
      news: {
        items: [
          {
            id: "news-1",
            title: "MU headline",
            sourceName: "Reuters",
            sourceTier: "tier_2",
            publishedAt: "2026-06-07T10:00:00.000Z",
            url: "https://example.com/news",
            relatedAreas: ["market_sentiment"],
            rawProvider: "test",
            analysisStatus: "not_analyzed",
          },
        ],
        providerName: "Test news",
        status: "fresh",
        message: "News is current.",
        lastUpdated: "2026-06-07T11:00:00.000Z",
      },
      aiAvailable: false,
      auditWarnings: ["Valuation evidence is missing."],
      manualReviewState: {
        memoryReviewed: true,
        auditReviewed: false,
      },
      asOf: AS_OF,
    });

    expect(item(checklist, "memory-pricing").complete).toBe(true);
    expect(item(checklist, "hbm-demand").complete).toBe(true);
    expect(item(checklist, "manual-review").complete).toBe(true);
    expect(item(checklist, "ai").optional).toBe(true);
    expect(item(checklist, "audit").complete).toBe(false);
  });

  it("converts post-earnings input into normalized earnings evidence", () => {
    const evidence = earningsRecordToEvidence(earningsRecord());

    expect(evidence.length).toBeGreaterThanOrEqual(6);
    expect(evidence.every((item) => item.evidenceType === "earnings")).toBe(
      true,
    );
    expect(new Set(evidence.map((item) => item.affectedArea))).toEqual(
      new Set([
        "business_thesis_health",
        "valuation_risk",
        "market_sentiment",
      ]),
    );
  });

  it("creates negative thesis evidence when guidance is lowered", () => {
    const evidence = earningsRecordToEvidence(
      earningsRecord({ guidanceDirection: "lowered" }),
    );
    const guidance = evidence.find((item) => item.id.endsWith(":guidance"));

    expect(guidance?.impactDirection).toBe("negative");
    expect(guidance?.affectedArea).toBe("business_thesis_health");
  });

  it("creates positive business evidence for positive HBM commentary", () => {
    const evidence = earningsRecordToEvidence(
      earningsRecord({ hbmCommentary: "positive" }),
    );
    const hbm = evidence.find((item) => item.id.endsWith(":hbm"));

    expect(hbm?.impactDirection).toBe("positive");
    expect(hbm?.affectedArea).toBe("business_thesis_health");
  });

  it("handles missing expectations without inventing results", () => {
    const record = earningsRecord({
      revenueExpectation: undefined,
      epsExpectation: undefined,
    });
    const summary = buildEarningsReviewSummary(record);
    const results = earningsRecordToEvidence(record).find((item) =>
      item.id.endsWith(":results"),
    );

    expect(summary.warnings).toContain(
      "Revenue expectation is missing; no revenue beat/miss was inferred.",
    );
    expect(summary.warnings).toContain(
      "EPS expectation is missing; no EPS beat/miss was inferred.",
    );
    expect(results?.impactDirection).toBe("unknown");
    expect(results?.analysisStatus).toBe("manual_review_required");
  });

  it("captures the pre-earnings deterministic decision and scores", () => {
    const record = createEarningsRecord({
      input: earningsRecord(),
      decision: decision(),
      scores: scores(),
      now: AS_OF,
    });

    expect(record.preEarningsDecision).toEqual({
      label: "Watch",
      confidence: 49,
    });
    expect(record.preEarningsScores.businessThesisHealth.score).toBe(80);
  });
});

function item(
  checklist: ReturnType<typeof buildPreEarningsChecklist>,
  id: string,
) {
  const found = checklist.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing checklist item ${id}`);
  return found;
}

function earningsRecord(
  overrides: Partial<EarningsRecord> = {},
): EarningsRecord {
  return {
    id: "earnings-1",
    createdAt: "2026-06-07T12:00:00.000Z",
    earningsDate: "2026-06-24",
    reportedRevenue: "8.5",
    revenueExpectation: "8.2",
    reportedEps: "1.80",
    epsExpectation: "1.60",
    guidanceDirection: "raised",
    hbmCommentary: "positive",
    dramCommentary: "neutral",
    marginCommentary: "positive",
    notes: "Synthetic earnings review.",
    sourceUrl: "https://investors.micron.com/",
    preEarningsDecision: {
      label: "Watch",
      confidence: 49,
    },
    preEarningsScores: {
      businessThesisHealth: { score: 80, confidence: 88 },
      valuationRisk: { score: 50, confidence: 0 },
      marketSentiment: { score: 50, confidence: 70 },
    },
    ...overrides,
  };
}

function evidenceItem(id: string, title: string): EvidenceItem {
  return {
    id,
    title,
    description: title,
    sourceName: "Synthetic source",
    sourceTier: "tier_1",
    sourceUrl: "",
    observedAt: "2026-06-06T12:00:00.000Z",
    createdAt: "2026-06-06T12:00:00.000Z",
    evidenceType: "memory_pricing",
    impactDirection: "positive",
    affectedArea: "business_thesis_health",
    confidence: "high",
    analysisStatus: "analyzed",
  };
}

function decision(): DecisionResult {
  return {
    label: "Watch",
    confidence: 49,
    reasons: [],
    warnings: [],
    evidenceUsed: [],
  };
}

function scores(): ScoringResults {
  return {
    business_thesis_health: score(80, 88),
    valuation_risk: score(50, 0),
    market_sentiment: score(50, 70),
  };
}

function score(scoreValue: number, confidence: number) {
  return {
    score: scoreValue,
    confidence,
    reasons: [],
    evidenceUsed: [],
    status: "current" as const,
  };
}
