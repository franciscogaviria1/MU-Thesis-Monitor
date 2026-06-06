import type { EvidenceImpact, EvidenceItem } from "@/types/dashboard";
import { SectionHeading } from "@/components/SectionHeading";

interface EvidencePanelProps {
  title: string;
  description: string;
  items: EvidenceItem[];
}

const impactLabels: Record<EvidenceImpact, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
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
              <th scope="col">Impact</th>
              <th scope="col">Affected area</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                  <time>{item.timestamp}</time>
                </td>
                <td>
                  <span className="tier">Tier {item.tier}</span>
                  <span>{item.sourceName}</span>
                </td>
                <td>
                  <span className={`impact impact--${item.impact}`}>
                    {impactLabels[item.impact]}
                  </span>
                </td>
                <td>{item.affectedArea}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
