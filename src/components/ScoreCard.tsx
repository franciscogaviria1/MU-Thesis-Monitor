import type { ScoreArea } from "@/types/dashboard";
import type { ScoreResult } from "@/types/scoring";

interface ScoreCardProps {
  area: ScoreArea;
  result: ScoreResult;
  index: number;
}

export function ScoreCard({ area, result, index }: ScoreCardProps) {
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
        <div
          className="score-card__score"
          aria-label={`${result.score} out of 100`}
        >
          <strong>{result.score}</strong>
          <span>/100</span>
        </div>
      </div>

      <div className="score-card__status">
        <span className="status-dot" aria-hidden="true" />
        {scoreStatus(area.id, result)}
      </div>

      <div className="score-card__confidence">
        <span>Confidence</span>
        <strong>{result.confidence}%</strong>
        <div
          className="meter"
          role="progressbar"
          aria-label={`${area.name} confidence`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={result.confidence}
        >
          <span style={{ width: `${result.confidence}%` }} />
        </div>
      </div>

      <div className="score-card__drivers">
        <p className="field-label">Deterministic explanation</p>
        <ul>
          {result.reasons.map((reason) => (
            <li key={reason}>
              <span className="driver-signal">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="score-card__evidence">
        <p className="field-label">Evidence used</p>
        {result.evidenceUsed.length > 0 ? (
          <ul>
            {result.evidenceUsed.map((evidence) => (
              <li key={evidence.id}>
                <strong>{evidence.title}</strong>
                <span>{evidence.sourceName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No eligible evidence used.</p>
        )}
      </div>
    </article>
  );
}

function scoreStatus(areaId: string, result: ScoreResult) {
  if (result.status === "insufficient_evidence") {
    return "Insufficient evidence";
  }

  if (areaId === "valuation-risk") {
    if (result.score >= 71) return "High risk";
    if (result.score >= 56) return "Moderate risk";
    if (result.score >= 45) return "Mixed risk";
    if (result.score >= 30) return "Lower risk";
    return "Low risk";
  }

  if (result.score >= 71) return "Strongly supportive";
  if (result.score >= 56) return "Improving";
  if (result.score >= 45) return "Mixed";
  if (result.score >= 30) return "Weakening";
  return "Materially adverse";
}
