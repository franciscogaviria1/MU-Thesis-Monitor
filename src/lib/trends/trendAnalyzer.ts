import type { DecisionLabel } from "@/types/dashboard";
import type { DailySnapshot } from "@/types/persistence";
import type {
  MetricTrendDirection,
  TrendAnalysis,
  TrendChange,
  TrendDirection,
  TrendWindowDays,
} from "@/lib/trends/trendTypes";

const STABLE_THRESHOLD = 3;

const decisionPosture: Record<DecisionLabel, number | null> = {
  "Strong Hold": 4,
  Hold: 3,
  Watch: 2,
  "Reduce Review": 1,
  "Exit Review": 0,
  "Insufficient Evidence": null,
};

export function analyzeTrend(
  snapshots: DailySnapshot[],
  windowDays: TrendWindowDays,
): TrendAnalysis {
  const windowSnapshots = selectWindowSnapshots(snapshots, windowDays);

  if (windowSnapshots.length < 2) {
    return {
      windowDays,
      direction: "insufficient_data",
      confidence: 0,
      summary: `Insufficient trend history for the ${windowDays}-day window.`,
      changes: [],
      warnings: [
        "At least two distinct persisted daily snapshots are required. No trend was inferred.",
      ],
    };
  }

  const start = windowSnapshots[0];
  const end = windowSnapshots[windowSnapshots.length - 1];
  const changes = [
    createChange(
      "Business Thesis Health",
      start.businessThesisHealth.score,
      end.businessThesisHealth.score,
    ),
    createChange(
      "Valuation Risk",
      start.valuationRisk.score,
      end.valuationRisk.score,
    ),
    createChange(
      "Market Sentiment",
      start.marketSentiment.score,
      end.marketSentiment.score,
    ),
    createChange(
      "Confidence",
      averageConfidence(start),
      averageConfidence(end),
    ),
  ];
  const warnings: string[] = [];
  const favorableSignals = [
    changes[0].change,
    -changes[1].change,
    changes[2].change,
  ];
  const decisionChange = createDecisionChange(start, end);

  if (decisionChange) {
    changes.push(decisionChange);
    favorableSignals.push(decisionChange.change * 5);
  } else {
    warnings.push(
      "Decision-label movement could not be compared because Insufficient Evidence has no directional rank.",
    );
  }

  const direction = classifyOverallDirection(favorableSignals);
  const confidenceChange = changes[3].change;
  const positiveCount = favorableSignals.filter(
    (change) => change >= STABLE_THRESHOLD,
  ).length;
  const negativeCount = favorableSignals.filter(
    (change) => change <= -STABLE_THRESHOLD,
  ).length;

  if (positiveCount > 0 && negativeCount > 0) {
    warnings.push(
      "Score movements are mixed across the monitored areas.",
    );
  }

  if (confidenceChange <= -5) {
    warnings.push(
      `Average deterministic confidence deteriorated by ${Math.abs(confidenceChange)} points.`,
    );
  }

  if (windowSnapshots.length < Math.min(windowDays, 4)) {
    warnings.push(
      `Only ${windowSnapshots.length} daily snapshots are available in this ${windowDays}-day window.`,
    );
  }

  return {
    windowDays,
    direction,
    confidence: calculateTrendConfidence(
      windowSnapshots,
      windowDays,
      positiveCount > 0 && negativeCount > 0,
    ),
    summary: buildSummary(direction, windowDays, changes),
    changes,
    warnings,
  };
}

function selectWindowSnapshots(
  snapshots: DailySnapshot[],
  windowDays: TrendWindowDays,
) {
  const distinctSnapshots = [
    ...new Map(
      snapshots
        .filter((snapshot) => !Number.isNaN(Date.parse(snapshot.createdAt)))
        .map((snapshot) => [snapshot.createdAt.slice(0, 10), snapshot]),
    ).values(),
  ].sort(
    (left, right) =>
      Date.parse(left.createdAt) - Date.parse(right.createdAt),
  );
  const latest = distinctSnapshots[distinctSnapshots.length - 1];

  if (!latest) {
    return [];
  }

  const cutoff =
    Date.parse(latest.createdAt) - (windowDays - 1) * 24 * 60 * 60 * 1000;
  return distinctSnapshots.filter(
    (snapshot) => Date.parse(snapshot.createdAt) >= cutoff,
  );
}

function createChange(
  metric: string,
  startValue: number,
  endValue: number,
): TrendChange {
  const change = Math.round(endValue - startValue);
  return {
    metric,
    startValue: Math.round(startValue),
    endValue: Math.round(endValue),
    change,
    direction: metricDirection(change),
  };
}

function createDecisionChange(
  start: DailySnapshot,
  end: DailySnapshot,
): TrendChange | null {
  const startValue = decisionPosture[start.decision.label];
  const endValue = decisionPosture[end.decision.label];

  if (startValue === null || endValue === null) {
    return null;
  }

  return {
    ...createChange("Decision posture", startValue, endValue),
    startLabel: start.decision.label,
    endLabel: end.decision.label,
  };
}

function averageConfidence(snapshot: DailySnapshot) {
  return Math.round(
    (snapshot.businessThesisHealth.confidence +
      snapshot.valuationRisk.confidence +
      snapshot.marketSentiment.confidence +
      snapshot.decision.confidence) /
      4,
  );
}

function classifyOverallDirection(signals: number[]): TrendDirection {
  const averageSignal =
    signals.reduce((total, signal) => total + signal, 0) /
    Math.max(1, signals.length);

  if (averageSignal >= STABLE_THRESHOLD) {
    return "improving";
  }

  if (averageSignal <= -STABLE_THRESHOLD) {
    return "weakening";
  }

  return "stable";
}

function calculateTrendConfidence(
  snapshots: DailySnapshot[],
  windowDays: TrendWindowDays,
  mixed: boolean,
) {
  const endpointConfidence =
    (averageConfidence(snapshots[0]) +
      averageConfidence(snapshots[snapshots.length - 1])) /
    2;
  const coverage = Math.min(
    100,
    (snapshots.length / Math.min(windowDays, 7)) * 100,
  );
  const mixedPenalty = mixed ? 10 : 0;

  return clampRound(
    endpointConfidence * 0.65 + coverage * 0.35 - mixedPenalty,
  );
}

function buildSummary(
  direction: TrendDirection,
  windowDays: TrendWindowDays,
  changes: TrendChange[],
) {
  const business = changes[0].change;
  const valuation = changes[1].change;
  const sentiment = changes[2].change;

  return `The ${windowDays}-day thesis trend is ${formatDirection(direction)}. Business Thesis Health changed ${formatChange(business)}, Valuation Risk changed ${formatChange(valuation)}, and Market Sentiment changed ${formatChange(sentiment)}.`;
}

function formatDirection(direction: TrendDirection) {
  return direction.replace("_", " ");
}

function formatChange(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function metricDirection(change: number): MetricTrendDirection {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

function clampRound(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
