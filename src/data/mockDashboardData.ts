import type { DashboardData } from "@/types/dashboard";

export const mockDashboardData: DashboardData = {
  appName: "MU Thesis Monitor",
  subtitle: "Local thesis-monitoring dashboard",
  lastUpdatedLabel: "Mock snapshot",
  lastUpdated: "June 6, 2026 at 9:30 AM ET",
  disclaimer: "This is not financial advice.",
  methodologyNote:
    "Mock scores are shown independently. Deterministic rules, not AI, own final scoring and review labels.",
  scoreSectionTitle: "Thesis scorecard",
  scoreSectionDescription:
    "Three independent views of the thesis. A high Valuation Risk score indicates greater risk.",
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
    title: "Confidence and coverage",
    description:
      "Evidence quality is healthy, but the snapshot retains explicit gaps instead of estimating missing values.",
    metrics: [
      {
        label: "Confidence score",
        value: 82,
        detail: "High-confidence mock evidence set",
      },
      {
        label: "Data coverage",
        value: 76,
        detail: "Core inputs pass the mock evidence gate",
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
  recommendation: {
    eyebrow: "Deterministic review posture",
    label: "Hold",
    explanation:
      "Business Thesis Health remains supportive, but elevated Valuation Risk prevents a Strong Hold label. Market Sentiment is constructive without overriding the valuation constraint.",
    evidenceTitle: "Why this label",
    evidence: [
      "HBM and AI infrastructure demand support the operating thesis.",
      "Forward expectations leave limited room for execution misses.",
      "Evidence coverage is sufficient, with two disclosed gaps.",
    ],
    reminder:
      "This is a review label, not a trading instruction. No transaction is authorized or recommended.",
    challengeButtonLabel: "Challenge thesis",
    challengeButtonNote: "AI challenge workflow is not connected in this phase.",
  },
  evidenceSectionTitle: "Evidence register",
  evidenceSectionDescription:
    "Mock items remain separate from interpretation and identify source tier, timing, impact, and affected area.",
  evidenceItems: [
    {
      id: "evidence-001",
      title: "Management reiterates strong HBM demand outlook",
      tier: 1,
      sourceName: "Micron Investor Relations",
      timestamp: "June 5, 2026 · 4:15 PM ET",
      impact: "positive",
      affectedArea: "Business Thesis Health",
    },
    {
      id: "evidence-002",
      title: "DRAM contract pricing trend remains constructive",
      tier: 1,
      sourceName: "TrendForce",
      timestamp: "June 5, 2026 · 8:00 AM ET",
      impact: "positive",
      affectedArea: "Business Thesis Health",
    },
    {
      id: "evidence-003",
      title: "Consensus earnings estimates move higher",
      tier: 1,
      sourceName: "Mock analyst consensus",
      timestamp: "June 4, 2026 · 6:00 PM ET",
      impact: "negative",
      affectedArea: "Valuation Risk",
    },
    {
      id: "evidence-004",
      title: "Semiconductor shares diverge after recent gains",
      tier: 2,
      sourceName: "Reuters",
      timestamp: "June 4, 2026 · 2:40 PM ET",
      impact: "neutral",
      affectedArea: "Market Sentiment",
    },
    {
      id: "evidence-005",
      title: "NAND recovery described as uneven across products",
      tier: 3,
      sourceName: "Industry analysis",
      timestamp: "June 3, 2026 · 10:20 AM ET",
      impact: "negative",
      affectedArea: "Business Thesis Health",
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
    "Phase 6B prototype. MU market data and raw headlines may be live; scores, classified evidence, recommendations, and decision history remain mocked. No OpenAI, database, authentication, or sentiment scoring is connected.",
};
