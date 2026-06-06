import type { EvidenceImpact, ScoreArea } from "@/types/dashboard";

interface ScoreCardProps {
  area: ScoreArea;
  index: number;
}

const impactLabels: Record<EvidenceImpact, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
};

export function ScoreCard({ area, index }: ScoreCardProps) {
  return (
    <article
      className="score-card reveal"
      style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}
    >
      <div className="score-card__header">
        <div>
          <p className="eyebrow">{area.shortName}</p>
          <h3>{area.name}</h3>
        </div>
        <div className="score-card__score" aria-label={`${area.score} out of 100`}>
          <strong>{area.score}</strong>
          <span>/100</span>
        </div>
      </div>

      <div className="score-card__status">
        <span className="status-dot" aria-hidden="true" />
        {area.status}
      </div>

      <p className="score-card__summary">{area.summary}</p>

      <div className="score-card__drivers">
        <p className="field-label">Key drivers</p>
        <ul>
          {area.drivers.map((driver) => (
            <li key={driver.label}>
              <div>
                <span className="driver-label">{driver.label}</span>
                <span className="driver-signal">{driver.signal}</span>
              </div>
              <span className={`impact impact--${driver.direction}`}>
                {impactLabels[driver.direction]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
