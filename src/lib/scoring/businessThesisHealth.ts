import {
  average,
  buildScoreResult,
  knownImpactEvidence,
  weightedAverage,
} from "@/lib/scoring/scoringUtils";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoreResult } from "@/types/scoring";

const FRESHNESS_DAYS = 90;

const categories = [
  {
    name: "DRAM pricing",
    weight: 25,
    matches: (text: string) => text.includes("dram") && !text.includes("hbm"),
  },
  {
    name: "HBM demand and execution",
    weight: 25,
    matches: (text: string) => text.includes("hbm"),
  },
  {
    name: "NAND pricing",
    weight: 15,
    matches: (text: string) => text.includes("nand"),
  },
  {
    name: "AI infrastructure demand",
    weight: 20,
    matches: (text: string) =>
      text.includes("ai infrastructure") ||
      text.includes("data center") ||
      text.includes("data-center"),
  },
  {
    name: "Supply and capital discipline",
    weight: 15,
    matches: (text: string) =>
      ["supply", "capacity", "inventory", "capex"].some((term) =>
        text.includes(term),
      ),
  },
] as const;

export function scoreBusinessThesisHealth(
  evidence: EvidenceItem[],
  asOf: Date,
): ScoreResult {
  const relevantEvidence = evidence.filter(
    (item) => item.affectedArea === "business_thesis_health",
  );
  const knownEvidence = knownImpactEvidence(
    relevantEvidence,
    asOf,
    FRESHNESS_DAYS,
  );
  const categoryResults = categories.flatMap((category) => {
    const matches = knownEvidence.filter(({ evidence: item }) =>
      category.matches(searchableText(item)),
    );

    if (matches.length === 0) {
      return [];
    }

    return [
      {
        name: category.name,
        weight: category.weight,
        value: average(matches.map((item) => item.score)),
        evidence: matches,
      },
    ];
  });
  const scoredEvidence = uniqueScoredEvidence(
    categoryResults.flatMap((category) => category.evidence),
  );
  const coverage = categoryResults.reduce(
    (total, category) => total + category.weight,
    0,
  );
  const score = weightedAverage(
    categoryResults.map((category) => ({
      value: category.value,
      weight: category.weight,
    })),
  );
  const reasons =
    categoryResults.length === 0
      ? [
          "No current, directionally classified business evidence is available; the score remains at the neutral baseline.",
          "Missing evidence lowers confidence rather than being treated as negative evidence.",
        ]
      : [
          ...categoryResults.map(
            (category) =>
              `${category.name} contributes ${Math.round(category.value)}/100 from ${category.evidence.length} eligible item${category.evidence.length === 1 ? "" : "s"}.`,
          ),
          coverage < 60
            ? `Only ${coverage}% of configured Business Thesis Health inputs are covered, so the result is provisional.`
            : `${coverage}% of configured Business Thesis Health inputs are covered.`,
        ];

  return buildScoreResult({
    scoredEvidence,
    relevantEvidence,
    score,
    coverage,
    reasons,
    asOf,
    freshnessDays: FRESHNESS_DAYS,
  });
}

function searchableText(evidence: EvidenceItem) {
  return `${evidence.title} ${evidence.description}`.toLowerCase();
}

function uniqueScoredEvidence(
  evidence: ReturnType<typeof knownImpactEvidence>,
) {
  return [...new Map(evidence.map((item) => [item.evidence.id, item])).values()];
}
