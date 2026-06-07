import { describe, expect, it } from "vitest";
import { calculateScores } from "@/lib/scoring/scoringEngine";
import type {
  EvidenceAffectedArea,
  EvidenceImpactDirection,
  EvidenceItem,
  EvidenceSourceTier,
} from "@/types/evidence";

const AS_OF = new Date("2026-06-07T12:00:00.000Z");

describe("deterministic scoring engine", () => {
  it("returns bounded neutral scores with zero confidence for empty evidence", () => {
    const results = calculateScores([], AS_OF);

    Object.values(results).forEach((result) => {
      expect(result.score).toBe(50);
      expect(result.confidence).toBe(0);
      expect(result.status).toBe("insufficient_evidence");
      expect(result.evidenceUsed).toEqual([]);
    });
  });

  it("keeps every score and confidence within 0-100 boundaries", () => {
    const evidence = [
      businessEvidence("dram", "DRAM contract pricing", "positive"),
      businessEvidence("hbm", "HBM demand", "positive"),
      businessEvidence("nand", "NAND pricing", "negative"),
      businessEvidence("ai", "AI infrastructure demand", "positive"),
      businessEvidence("supply", "Supply capacity discipline", "neutral"),
      evidenceItem({
        id: "valuation",
        title: "Forward valuation pressure",
        impactDirection: "negative",
        affectedArea: "valuation_risk",
      }),
      evidenceItem({
        id: "sentiment",
        title: "MU coverage improves",
        impactDirection: "positive",
        affectedArea: "market_sentiment",
      }),
    ];

    Object.values(calculateScores(evidence, AS_OF)).forEach((result) => {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  it("lowers confidence for missing evidence without treating it as negative", () => {
    const partial = calculateScores(
      [businessEvidence("hbm", "HBM demand", "positive")],
      AS_OF,
    ).business_thesis_health;
    const complete = calculateScores(
      [
        businessEvidence("dram", "DRAM pricing", "positive"),
        businessEvidence("hbm", "HBM demand", "positive"),
        businessEvidence("nand", "NAND pricing", "positive"),
        businessEvidence("ai", "AI infrastructure demand", "positive"),
        businessEvidence("supply", "Supply capacity discipline", "positive"),
      ],
      AS_OF,
    ).business_thesis_health;

    expect(partial.score).toBe(80);
    expect(partial.status).toBe("insufficient_evidence");
    expect(partial.confidence).toBeLessThan(complete.confidence);
    expect(complete.status).toBe("current");
  });

  it("excludes stale evidence from the score and lowers confidence", () => {
    const current = calculateScores(
      [businessEvidence("hbm", "HBM demand", "positive")],
      AS_OF,
    ).business_thesis_health;
    const stale = calculateScores(
      [
        businessEvidence(
          "hbm-stale",
          "HBM demand",
          "positive",
          "2025-12-01T12:00:00.000Z",
        ),
      ],
      AS_OF,
    ).business_thesis_health;

    expect(current.score).toBe(80);
    expect(current.confidence).toBeGreaterThan(0);
    expect(stale.score).toBe(50);
    expect(stale.confidence).toBe(0);
    expect(stale.evidenceUsed).toEqual([]);
  });

  it("calculates higher confidence for higher-tier evidence", () => {
    const tierOne = calculateScores(
      [businessEvidence("hbm-1", "HBM demand", "positive")],
      AS_OF,
    ).business_thesis_health;
    const tierThree = calculateScores(
      [
        businessEvidence(
          "hbm-3",
          "HBM demand",
          "positive",
          "2026-06-01T12:00:00.000Z",
          "tier_3",
        ),
      ],
      AS_OF,
    ).business_thesis_health;

    expect(tierOne.confidence).toBeGreaterThan(tierThree.confidence);
  });

  it("uses deterministic drawdown thresholds for valuation risk", () => {
    const nearHigh = calculateScores(
      [drawdownEvidence("9.00%")],
      AS_OF,
    ).valuation_risk;
    const deepDrawdown = calculateScores(
      [drawdownEvidence("40.00%")],
      AS_OF,
    ).valuation_risk;

    expect(nearHigh.score).toBe(80);
    expect(deepDrawdown.score).toBe(30);
  });

  it("does not score raw news with unknown impact", () => {
    const result = calculateScores(
      [
        evidenceItem({
          id: "raw-news",
          title: "Raw MU headline",
          evidenceType: "news",
          impactDirection: "unknown",
          affectedArea: "market_sentiment",
          analysisStatus: "not_analyzed",
        }),
      ],
      AS_OF,
    ).market_sentiment;

    expect(result.score).toBe(50);
    expect(result.confidence).toBe(0);
    expect(result.reasons).toContain(
      "Raw, not-analyzed headlines do not move Market Sentiment.",
    );
  });
});

function businessEvidence(
  id: string,
  title: string,
  impactDirection: EvidenceImpactDirection,
  observedAt = "2026-06-01T12:00:00.000Z",
  sourceTier: EvidenceSourceTier = "tier_1",
) {
  return evidenceItem({
    id,
    title,
    impactDirection,
    sourceTier,
    affectedArea: "business_thesis_health",
  }, observedAt);
}

function drawdownEvidence(drawdown: string) {
  return evidenceItem({
    id: `drawdown-${drawdown}`,
    title: "MU drawdown from 52-week high",
    description: `${drawdown} from a 52-week high.`,
    evidenceType: "market_data",
    impactDirection: "unknown",
    affectedArea: "valuation_risk",
  });
}

function evidenceItem(
  overrides: Partial<EvidenceItem> & {
    id: string;
    title: string;
    impactDirection: EvidenceImpactDirection;
    affectedArea: EvidenceAffectedArea;
  },
  observedAt = "2026-06-01T12:00:00.000Z",
): EvidenceItem {
  return {
    id: overrides.id,
    title: overrides.title,
    description: overrides.description ?? overrides.title,
    sourceName: overrides.sourceName ?? "Synthetic source",
    sourceTier: overrides.sourceTier ?? "tier_1",
    sourceUrl: "",
    observedAt,
    createdAt: observedAt,
    evidenceType: overrides.evidenceType ?? "manual_input",
    impactDirection: overrides.impactDirection,
    affectedArea: overrides.affectedArea,
    confidence: overrides.confidence ?? "high",
    analysisStatus: overrides.analysisStatus ?? "analyzed",
  };
}
