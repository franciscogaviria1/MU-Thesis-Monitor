import { SectionHeading } from "@/components/SectionHeading";
import type {
  EvidenceAffectedArea,
  EvidenceConfidence,
  EvidenceImpactDirection,
  EvidenceItem,
  EvidenceSourceTier,
  EvidenceType,
} from "@/types/evidence";

interface EvidencePanelProps {
  title: string;
  description: string;
  items: EvidenceItem[];
}

const impactLabels: Record<EvidenceImpactDirection, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
  unknown: "Not assessed",
};

const sourceTierLabels: Record<EvidenceSourceTier, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  tier_4: "Tier 4",
  unknown: "Unknown tier",
};

const confidenceLabels: Record<EvidenceConfidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  unknown: "Unknown",
};

const affectedAreaLabels: Record<EvidenceAffectedArea, string> = {
  business_thesis_health: "Business Thesis Health",
  valuation_risk: "Valuation Risk",
  market_sentiment: "Market Sentiment",
};

const evidenceTypeLabels: Record<EvidenceType, string> = {
  market_data: "Market data",
  news: "News",
  manual_input: "Manual input",
  filing: "Filing",
  earnings: "Earnings",
  analyst_revision: "Analyst revision",
  memory_pricing: "Memory pricing",
};

export function EvidencePanel({
  title,
  description,
  items,
}: EvidencePanelProps) {
  return (
    <section className="evidence-section" aria-labelledby="evidence-title">
      <SectionHeading title={title} description={description} />

      <div className="evidence-table-wrap">
        <table className="evidence-table">
          <thead>
            <tr>
              <th scope="col">Evidence</th>
              <th scope="col">Source</th>
              <th scope="col">Confidence</th>
              <th scope="col">Impact</th>
              <th scope="col">Affected area</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.sourceUrl ? (
                    <a
                      className="evidence-title"
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <strong className="evidence-title">{item.title}</strong>
                  )}
                  <p>{item.description}</p>
                  <div className="evidence-meta">
                    <time dateTime={item.observedAt}>
                      {formatTimestamp(item.observedAt)}
                    </time>
                    <span>{evidenceTypeLabels[item.evidenceType]}</span>
                    <span>{formatAnalysisStatus(item.analysisStatus)}</span>
                  </div>
                </td>
                <td>
                  <span className="tier">
                    {sourceTierLabels[item.sourceTier]}
                  </span>
                  <span>{item.sourceName}</span>
                </td>
                <td>
                  <span className={`confidence confidence--${item.confidence}`}>
                    {confidenceLabels[item.confidence]}
                  </span>
                </td>
                <td>
                  <span
                    className={`impact impact--${item.impactDirection}`}
                  >
                    {impactLabels[item.impactDirection]}
                  </span>
                </td>
                <td>{affectedAreaLabels[item.affectedArea]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Timestamp unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

function formatAnalysisStatus(value: EvidenceItem["analysisStatus"]) {
  return value.replaceAll("_", " ");
}
