import type { DecisionResult } from "@/types/decision";

interface RecommendationPanelProps {
  decision: DecisionResult;
}

export function RecommendationPanel({ decision }: RecommendationPanelProps) {
  return (
    <section
      className="recommendation-panel"
      aria-labelledby="recommendation-title"
    >
      <div className="recommendation-panel__main">
        <p className="eyebrow">Deterministic review posture</p>
        <div className="recommendation-panel__label-row">
          <h2 id="recommendation-title">{decision.label}</h2>
          <span>{decision.confidence}% confidence</span>
        </div>
        <p className="recommendation-panel__explanation">
          Review label, not trading instruction.
        </p>
        <p className="decision-safety-copy">
          This result summarizes deterministic monitoring rules. It does not
          recommend buying, selling, reducing, or retaining any investment.
        </p>
      </div>

      <div className="recommendation-panel__evidence">
        <p className="field-label">Why this label</p>
        <ul>
          {decision.reasons.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="field-label decision-subheading">Warnings</p>
        {decision.warnings.length > 0 ? (
          <ul className="decision-warnings">
            {decision.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="decision-empty">No material data warnings.</p>
        )}

        <p className="field-label decision-subheading">Evidence used</p>
        {decision.evidenceUsed.length > 0 ? (
          <ul className="decision-evidence-list">
            {decision.evidenceUsed.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.sourceName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="decision-empty">No eligible evidence was used.</p>
        )}

        <p className="policy-reminder">
          Review label, not trading instruction. Exit Review is not a sell
          instruction and never authorizes a transaction.
        </p>
      </div>
    </section>
  );
}
