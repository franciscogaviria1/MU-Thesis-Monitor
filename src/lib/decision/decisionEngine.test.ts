import { describe, expect, it } from "vitest";
import { calculateDecision } from "@/lib/decision/decisionEngine";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoreResult, ScoringResults } from "@/types/scoring";

describe("deterministic decision engine", () => {
  it("returns Insufficient Evidence when a critical score is insufficient", () => {
    const decision = calculateDecision({
      scores: scores({
        business: result(80, 80, "insufficient_evidence"),
      }),
      evidence: [],
    });

    expect(decision.label).toBe("Insufficient Evidence");
    expect(decision.confidence).toBeLessThan(50);
    expect(decision.warnings).toContain(
      "Business Thesis Health has insufficient eligible evidence.",
    );
  });

  it("limits strong business thesis with weak sentiment to Watch", () => {
    const decision = calculateDecision({
      scores: scores({
        business: result(82, 85),
        valuation: result(35, 75),
        sentiment: result(35, 80),
      }),
      evidence: [],
    });

    expect(decision.label).toBe("Watch");
    expect(decision.label).not.toBe("Exit Review");
  });

  it("assigns Exit Review for materially adverse corroborated business evidence", () => {
    const evidence = [
      adverseEvidence("business-1", "tier_1"),
      adverseEvidence("business-2", "tier_2"),
    ];
    const decision = calculateDecision({
      scores: scores({
        business: result(29, 75, "current", evidence),
      }),
      evidence,
    });

    expect(decision.label).toBe("Exit Review");
    expect(decision.reasons.join(" ")).toContain("materially adverse");
  });

  it("forces Insufficient Evidence when critical confidence is weak", () => {
    const decision = calculateDecision({
      scores: scores({
        business: result(75, 44),
      }),
      evidence: [],
    });

    expect(decision.label).toBe("Insufficient Evidence");
    expect(decision.confidence).toBeLessThan(50);
  });

  it("prevents Tier 4 evidence alone from triggering severe labels", () => {
    const evidence = [
      adverseEvidence("tier4-1", "tier_4"),
      adverseEvidence("tier4-2", "tier_4"),
    ];
    const decision = calculateDecision({
      scores: scores({
        business: result(20, 80, "current", evidence),
      }),
      evidence,
    });

    expect(decision.label).toBe("Watch");
    expect(decision.label).not.toBe("Reduce Review");
    expect(decision.label).not.toBe("Exit Review");
  });

  it("prevents Strong Hold when critical data is missing", () => {
    const decision = calculateDecision({
      scores: scores({
        business: result(80, 85),
        valuation: result(35, 75),
        sentiment: result(55, 70),
      }),
      evidence: [],
      missingDataSignals: ["Forward valuation estimate is missing."],
    });

    expect(decision.label).toBe("Hold");
    expect(decision.label).not.toBe("Strong Hold");
    expect(decision.warnings).toContain(
      "Forward valuation estimate is missing.",
    );
  });

  it("enforces Strong Hold and Hold score boundaries", () => {
    const strongHold = calculateDecision({
      scores: scores({
        business: result(71, 75),
        valuation: result(44, 60),
        sentiment: result(45, 50),
      }),
      evidence: [],
    });
    const hold = calculateDecision({
      scores: scores({
        business: result(70, 75),
        valuation: result(44, 60),
        sentiment: result(50, 65),
      }),
      evidence: [],
    });

    expect(strongHold.label).toBe("Strong Hold");
    expect(hold.label).toBe("Hold");
  });

  it("assigns Reduce Review at the weakening business boundary", () => {
    const evidence = [adverseEvidence("reduce-1", "tier_1")];
    const decision = calculateDecision({
      scores: scores({
        business: result(44, 55, "current", evidence),
      }),
      evidence,
    });

    expect(decision.label).toBe("Reduce Review");
  });

  it("returns reasons, warnings, evidence, and separate confidence", () => {
    const evidence = [adverseEvidence("audit-1", "tier_1")];
    const decision = calculateDecision({
      scores: scores({
        business: result(44, 70, "current", evidence),
        valuation: result(50, 60),
        sentiment: result(50, 50),
      }),
      evidence,
      staleDataSignals: ["Market data is stale."],
    });

    expect(decision.reasons.length).toBeGreaterThan(0);
    expect(decision.warnings).toContain("Market data is stale.");
    expect(decision.evidenceUsed).toEqual(evidence);
    expect(decision.confidence).toBe(63);
  });
});

interface ScoreOverrides {
  business?: ScoreResult;
  valuation?: ScoreResult;
  sentiment?: ScoreResult;
}

function scores(overrides: ScoreOverrides): ScoringResults {
  return {
    business_thesis_health: overrides.business ?? result(65, 75),
    valuation_risk: overrides.valuation ?? result(45, 70),
    market_sentiment: overrides.sentiment ?? result(55, 65),
  };
}

function result(
  score: number,
  confidence: number,
  status: ScoreResult["status"] = "current",
  evidence: EvidenceItem[] = [],
): ScoreResult {
  return {
    score,
    confidence,
    status,
    reasons: [],
    evidenceUsed: evidence.map((item) => ({
      id: item.id,
      title: item.title,
      sourceName: item.sourceName,
      observedAt: item.observedAt,
    })),
  };
}

function adverseEvidence(
  id: string,
  sourceTier: EvidenceItem["sourceTier"],
): EvidenceItem {
  return {
    id,
    title: `Adverse evidence ${id}`,
    description: "Synthetic adverse business evidence.",
    sourceName: "Synthetic source",
    sourceTier,
    sourceUrl: "",
    observedAt: "2026-06-01T12:00:00.000Z",
    createdAt: "2026-06-01T12:00:00.000Z",
    evidenceType: "manual_input",
    impactDirection: "negative",
    affectedArea: "business_thesis_health",
    confidence: "high",
    analysisStatus: "analyzed",
  };
}
