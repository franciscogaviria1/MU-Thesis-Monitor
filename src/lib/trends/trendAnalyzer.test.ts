import { describe, expect, it } from "vitest";
import { analyzeTrend } from "@/lib/trends/trendAnalyzer";
import type { DecisionLabel } from "@/types/dashboard";
import type { DailySnapshot } from "@/types/persistence";

describe("trend analyzer", () => {
  it("identifies an improving trend", () => {
    const trend = analyzeTrend(
      [
        snapshot("2026-06-01", 60, 65, 45, 60, "Watch"),
        snapshot("2026-06-07", 72, 52, 56, 68, "Hold"),
      ],
      7,
    );

    expect(trend.direction).toBe("improving");
    expect(changeFor(trend, "Business Thesis Health").change).toBe(12);
    expect(changeFor(trend, "Valuation Risk").change).toBe(-13);
  });

  it("identifies a weakening trend", () => {
    const trend = analyzeTrend(
      [
        snapshot("2026-06-01", 75, 45, 60, 70, "Hold"),
        snapshot("2026-06-07", 58, 67, 42, 58, "Watch"),
      ],
      7,
    );

    expect(trend.direction).toBe("weakening");
  });

  it("identifies a stable trend when movements are immaterial", () => {
    const trend = analyzeTrend(
      [
        snapshot("2026-06-01", 70, 50, 52, 65, "Hold"),
        snapshot("2026-06-07", 71, 49, 53, 66, "Hold"),
      ],
      7,
    );

    expect(trend.direction).toBe("stable");
  });

  it("returns insufficient data for only one snapshot", () => {
    const trend = analyzeTrend(
      [snapshot("2026-06-07", 70, 50, 52, 65, "Hold")],
      14,
    );

    expect(trend.direction).toBe("insufficient_data");
    expect(trend.confidence).toBe(0);
    expect(trend.changes).toEqual([]);
    expect(trend.warnings.join(" ")).toContain(
      "At least two distinct persisted daily snapshots",
    );
  });

  it("warns when deterministic confidence deteriorates", () => {
    const trend = analyzeTrend(
      [
        snapshot("2026-06-01", 70, 50, 52, 80, "Hold"),
        snapshot("2026-06-07", 70, 50, 52, 55, "Hold"),
      ],
      7,
    );

    expect(changeFor(trend, "Confidence").change).toBe(-25);
    expect(trend.warnings.join(" ")).toContain(
      "confidence deteriorated by 25 points",
    );
  });

  it("surfaces mixed score movements instead of hiding disagreement", () => {
    const trend = analyzeTrend(
      [
        snapshot("2026-06-01", 60, 50, 50, 65, "Watch"),
        snapshot("2026-06-07", 70, 60, 50, 65, "Watch"),
      ],
      7,
    );

    expect(trend.direction).toBe("stable");
    expect(trend.warnings).toContain(
      "Score movements are mixed across the monitored areas.",
    );
  });
});

function changeFor(
  trend: ReturnType<typeof analyzeTrend>,
  metric: string,
) {
  const change = trend.changes.find((item) => item.metric === metric);
  if (!change) {
    throw new Error(`Missing trend change for ${metric}`);
  }
  return change;
}

function snapshot(
  date: string,
  businessScore: number,
  valuationScore: number,
  sentimentScore: number,
  confidence: number,
  label: DecisionLabel,
): DailySnapshot {
  return {
    id: `daily:${date}`,
    createdAt: `${date}T12:00:00.000Z`,
    businessThesisHealth: {
      score: businessScore,
      confidence,
    },
    valuationRisk: {
      score: valuationScore,
      confidence,
    },
    marketSentiment: {
      score: sentimentScore,
      confidence,
    },
    decision: {
      label,
      confidence,
    },
    keyReasons: ["Synthetic reason."],
    warnings: [],
    evidenceIdsUsed: [],
  };
}
