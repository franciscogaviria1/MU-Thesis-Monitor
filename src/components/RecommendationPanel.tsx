import type { Recommendation } from "@/types/dashboard";

interface RecommendationPanelProps {
  recommendation: Recommendation;
}

export function RecommendationPanel({
  recommendation,
}: RecommendationPanelProps) {
  return (
    <section
      className="recommendation-panel"
      aria-labelledby="recommendation-title"
    >
      <div className="recommendation-panel__main">
        <p className="eyebrow">{recommendation.eyebrow}</p>
        <div className="recommendation-panel__label-row">
          <h2 id="recommendation-title">{recommendation.label}</h2>
          <span>Current mock label</span>
        </div>
        <p className="recommendation-panel__explanation">
          {recommendation.explanation}
        </p>

        <div className="recommendation-panel__action">
          <button
            type="button"
            aria-describedby="challenge-note"
            aria-disabled="true"
            disabled
          >
            {recommendation.challengeButtonLabel}
          </button>
          <span id="challenge-note">{recommendation.challengeButtonNote}</span>
        </div>
      </div>

      <div className="recommendation-panel__evidence">
        <p className="field-label">{recommendation.evidenceTitle}</p>
        <ul>
          {recommendation.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="policy-reminder">{recommendation.reminder}</p>
      </div>
    </section>
  );
}
