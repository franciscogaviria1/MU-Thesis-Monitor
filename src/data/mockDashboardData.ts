import type { DashboardData } from "@/types/dashboard";

export const mockDashboardData: DashboardData = {
  appName: "MU Thesis Monitor",
  subtitle: "Local thesis-monitoring dashboard",
  nextEarningsDate: "2026-06-24",
  lastUpdatedLabel: "Mock snapshot",
  lastUpdated: "June 6, 2026 at 9:30 AM ET",
  disclaimer: "This is not financial advice.",
  methodologyNote:
    "Three independent scores and the review label are calculated from eligible evidence by deterministic rules. AI calculates neither.",
  scoreSectionTitle: "Thesis scorecard",
  scoreSectionDescription:
    "Deterministic evidence scores with separate confidence. A high Valuation Risk score indicates greater risk.",
  scoreAreas: [
    {
      id: "business-thesis",
      name: "Business Thesis Health",
      shortName: "Thesis",
      score: 74,
      status: "Strongly supportive",
      summary:
        "HBM demand and AI infrastructure spending support the operating thesis, while NAND pricing remains the main point of uncertainty.",
      drivers: [
        {
          label: "DRAM pricing",
          signal: "Contract pricing is improving",
          direction: "positive",
        },
        {
          label: "HBM demand",
          signal: "Demand remains capacity-constrained",
          direction: "positive",
        },
        {
          label: "AI infrastructure demand",
          signal: "Data-center demand remains firm",
          direction: "positive",
        },
        {
          label: "NAND pricing",
          signal: "Recovery is uneven",
          direction: "neutral",
        },
      ],
    },
    {
      id: "valuation-risk",
      name: "Valuation Risk",
      shortName: "Risk",
      score: 63,
      status: "Elevated",
      summary:
        "The mock valuation reflects substantial earnings improvement, leaving less room for execution misses or weaker memory pricing.",
      drivers: [
        {
          label: "Forward valuation",
          signal: "Above mid-cycle reference",
          direction: "negative",
        },
        {
          label: "Analyst estimates",
          signal: "Revisions remain positive",
          direction: "positive",
        },
        {
          label: "Earnings expectations",
          signal: "High expectations are embedded",
          direction: "negative",
        },
      ],
    },
    {
      id: "market-sentiment",
      name: "Market Sentiment",
      shortName: "Sentiment",
      score: 58,
      status: "Moderately positive",
      summary:
        "Coverage is constructive but increasingly concentrated around AI demand, making sentiment vulnerable to a narrative reversal.",
      drivers: [
        {
          label: "News sentiment",
          signal: "Coverage skews constructive",
          direction: "positive",
        },
        {
          label: "Semiconductor sector sentiment",
          signal: "Sector breadth is mixed",
          direction: "neutral",
        },
        {
          label: "Analyst commentary",
          signal: "Targets are rising with estimates",
          direction: "positive",
        },
      ],
    },
  ],
  confidenceCoverage: {
    title: "Prototype coverage context",
    description:
      "This legacy mock coverage snapshot is operational context only. Use the independent confidence shown on each calculated score.",
    metrics: [
      {
        label: "Mock coverage reference",
        value: 82,
        detail: "Not used by the deterministic scoring engine",
      },
      {
        label: "Mock data coverage",
        value: 76,
        detail: "Retained for dashboard continuity in this phase",
      },
    ],
    missingDataTitle: "Missing data warnings",
    missingDataWarnings: [
      "Current NAND contract-pricing series is incomplete.",
      "Peer forward cash-flow comparison has not been verified.",
    ],
    verifiedLabel: "Last verified",
    lastVerified: "June 6, 2026 at 9:15 AM ET",
  },
  evidenceSectionTitle: "Evidence register",
  evidenceSectionDescription:
    "Normalized records show provenance and impact. Only eligible deterministic fields can affect the scores above.",
  evidenceItems: [
    {
      id: "evidence-001",
      title: "Management reiterates strong HBM demand outlook",
      description:
        "Mock management evidence retained as a manual record until a filing or transcript source is connected.",
      sourceName: "Micron Investor Relations",
      sourceTier: "tier_1",
      sourceUrl: "https://investors.micron.com/",
      observedAt: "2026-06-05T20:15:00.000Z",
      createdAt: "2026-06-06T13:30:00.000Z",
      evidenceType: "manual_input",
      impactDirection: "positive",
      affectedArea: "business_thesis_health",
      confidence: "high",
      analysisStatus: "analyzed",
    },
    {
      id: "evidence-002",
      title: "DRAM contract pricing trend remains constructive",
      description:
        "Mock memory-pricing observation used by the prototype dashboard.",
      sourceName: "TrendForce",
      sourceTier: "tier_1",
      sourceUrl: "https://www.trendforce.com/",
      observedAt: "2026-06-05T12:00:00.000Z",
      createdAt: "2026-06-06T13:30:00.000Z",
      evidenceType: "memory_pricing",
      impactDirection: "positive",
      affectedArea: "business_thesis_health",
      confidence: "high",
      analysisStatus: "analyzed",
    },
    {
      id: "evidence-003",
      title: "Consensus earnings estimates move higher",
      description:
        "Mock analyst-revision record. No live analyst estimates are connected.",
      sourceName: "Mock analyst consensus",
      sourceTier: "tier_3",
      sourceUrl: "",
      observedAt: "2026-06-04T22:00:00.000Z",
      createdAt: "2026-06-06T13:30:00.000Z",
      evidenceType: "analyst_revision",
      impactDirection: "negative",
      affectedArea: "valuation_risk",
      confidence: "low",
      analysisStatus: "manual_review_required",
    },
    {
      id: "evidence-004",
      title: "Semiconductor shares diverge after recent gains",
      description:
        "Mock journalism record retained to demonstrate a normalized evidence row.",
      sourceName: "Reuters",
      sourceTier: "tier_2",
      sourceUrl: "https://www.reuters.com/",
      observedAt: "2026-06-04T18:40:00.000Z",
      createdAt: "2026-06-06T13:30:00.000Z",
      evidenceType: "news",
      impactDirection: "neutral",
      affectedArea: "market_sentiment",
      confidence: "medium",
      analysisStatus: "analyzed",
    },
    {
      id: "evidence-005",
      title: "NAND recovery described as uneven across products",
      description:
        "Mock industry-analysis record retained pending a directly attributable source.",
      sourceName: "Industry analysis",
      sourceTier: "tier_3",
      sourceUrl: "",
      observedAt: "2026-06-03T14:20:00.000Z",
      createdAt: "2026-06-06T13:30:00.000Z",
      evidenceType: "manual_input",
      impactDirection: "negative",
      affectedArea: "business_thesis_health",
      confidence: "low",
      analysisStatus: "manual_review_required",
    },
  ],
  decisionLogTitle: "Decision log preview",
  decisionLogDescription:
    "Historical mock labels retain the reason and confidence available at the time.",
  decisionLog: [
    {
      id: "decision-003",
      date: "June 6, 2026",
      label: "Hold",
      keyReason: "Thesis support remains strong; valuation risk is elevated.",
      confidence: 82,
    },
    {
      id: "decision-002",
      date: "May 30, 2026",
      label: "Watch",
      keyReason: "Coverage fell below the preferred confidence threshold.",
      confidence: 64,
    },
    {
      id: "decision-001",
      date: "May 23, 2026",
      label: "Hold",
      keyReason: "Pricing evidence improved with balanced sentiment.",
      confidence: 78,
    },
  ],
  footerNote:
    "Phase 6K prototype. Earnings Mode adds deterministic pre-earnings checks, persisted post-earnings inputs, normalized earnings evidence, and a manual review summary without trading instructions.",
};
