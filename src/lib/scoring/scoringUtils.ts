import type {
  EvidenceConfidence,
  EvidenceImpactDirection,
  EvidenceItem,
  EvidenceSourceTier,
} from "@/types/evidence";
import type { ScoreEvidenceReference, ScoreResult } from "@/types/scoring";

const sourceQuality: Record<EvidenceSourceTier, number> = {
  tier_1: 100,
  tier_2: 80,
  tier_3: 55,
  tier_4: 25,
  unknown: 10,
};

const declaredConfidence: Record<EvidenceConfidence, number> = {
  high: 100,
  medium: 75,
  low: 45,
  unknown: 20,
};

export const impactScore: Record<EvidenceImpactDirection, number | null> = {
  positive: 80,
  neutral: 50,
  negative: 20,
  unknown: null,
};

export interface ScoredEvidence {
  evidence: EvidenceItem;
  score: number;
}

interface BuildScoreResultInput {
  scoredEvidence: ScoredEvidence[];
  relevantEvidence: EvidenceItem[];
  score: number;
  coverage: number;
  reasons: string[];
  asOf: Date;
  freshnessDays: number;
}

export function buildScoreResult({
  scoredEvidence,
  relevantEvidence,
  score,
  coverage,
  reasons,
  asOf,
  freshnessDays,
}: BuildScoreResultInput): ScoreResult {
  const confidence = calculateConfidence({
    scoredEvidence,
    relevantEvidence,
    coverage,
    asOf,
    freshnessDays,
  });

  return {
    score: clampRound(score),
    confidence,
    reasons,
    evidenceUsed: scoredEvidence.map(({ evidence }) => evidenceReference(evidence)),
    status: coverage >= 60 ? "current" : "insufficient_evidence",
  };
}

export function knownImpactEvidence(
  evidence: EvidenceItem[],
  asOf: Date,
  freshnessDays: number,
) {
  return evidence.flatMap((item): ScoredEvidence[] => {
    const score = impactScore[item.impactDirection];

    if (
      score === null ||
      item.analysisStatus === "manual_review_required" ||
      isStale(item, asOf, freshnessDays)
    ) {
      return [];
    }

    return [{ evidence: item, score }];
  });
}

export function weightedAverage(
  values: Array<{ value: number; weight: number }>,
  fallback = 50,
) {
  const totalWeight = values.reduce((total, item) => total + item.weight, 0);

  if (totalWeight === 0) {
    return fallback;
  }

  return (
    values.reduce((total, item) => total + item.value * item.weight, 0) /
    totalWeight
  );
}

export function average(values: number[], fallback = 50) {
  if (values.length === 0) {
    return fallback;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function isStale(
  evidence: EvidenceItem,
  asOf: Date,
  freshnessDays: number,
) {
  const observedAt = Date.parse(evidence.observedAt);

  if (Number.isNaN(observedAt)) {
    return true;
  }

  const ageMs = asOf.getTime() - observedAt;
  return ageMs > freshnessDays * 24 * 60 * 60 * 1000;
}

export function clampRound(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateConfidence({
  scoredEvidence,
  relevantEvidence,
  coverage,
  asOf,
  freshnessDays,
}: Omit<BuildScoreResultInput, "score" | "reasons">) {
  if (scoredEvidence.length === 0) {
    return 0;
  }

  const sourceScore = average(
    scoredEvidence.map(
      ({ evidence }) =>
        sourceQuality[evidence.sourceTier] * 0.7 +
        declaredConfidence[evidence.confidence] * 0.3,
    ),
    0,
  );
  const freshCount = relevantEvidence.filter(
    (item) => !isStale(item, asOf, freshnessDays),
  ).length;
  const freshnessScore =
    relevantEvidence.length === 0
      ? 0
      : (freshCount / relevantEvidence.length) * 100;
  const directions = scoredEvidence.map(
    ({ evidence }) => evidence.impactDirection,
  );
  const agreementScore = calculateAgreement(directions);

  return clampRound(
    sourceScore * 0.35 +
      coverage * 0.25 +
      freshnessScore * 0.2 +
      agreementScore * 0.2,
  );
}

function calculateAgreement(directions: EvidenceImpactDirection[]) {
  if (directions.length === 1) {
    return 70;
  }

  const counts = new Map<EvidenceImpactDirection, number>();

  directions.forEach((direction) => {
    counts.set(direction, (counts.get(direction) ?? 0) + 1);
  });

  return (
    (Math.max(...counts.values()) / Math.max(1, directions.length)) * 100
  );
}

function evidenceReference(evidence: EvidenceItem): ScoreEvidenceReference {
  return {
    id: evidence.id,
    title: evidence.title,
    sourceName: evidence.sourceName,
    observedAt: evidence.observedAt,
  };
}
