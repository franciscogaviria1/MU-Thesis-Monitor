import type { DailySnapshot } from "@/types/persistence";

interface DecisionHistoryProps {
  snapshots: DailySnapshot[];
  persistenceAvailable: boolean;
}

export function DecisionHistory({
  snapshots,
  persistenceAvailable,
}: DecisionHistoryProps) {
  return (
    <section
      className="decision-history"
      aria-labelledby="decision-history-title"
    >
      <div className="decision-history__heading">
        <div>
          <p className="eyebrow">Local SQLite snapshots</p>
          <h2 id="decision-history-title">Decision History</h2>
        </div>
        <p>
          Daily deterministic score and review-label snapshots. Saving history
          does not change scoring or decision behavior.
        </p>
      </div>

      {!persistenceAvailable ? (
        <p className="decision-history__warning">
          Persistence unavailable. Current session data remains visible and
          localStorage is retained as fallback where available.
        </p>
      ) : snapshots.length > 0 ? (
        <ol>
          {snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <time dateTime={snapshot.createdAt}>
                {formatDate(snapshot.createdAt)}
              </time>
              <div className="decision-history__scores">
                <ScoreValue
                  label="Business"
                  score={snapshot.businessThesisHealth.score}
                  confidence={snapshot.businessThesisHealth.confidence}
                />
                <ScoreValue
                  label="Valuation"
                  score={snapshot.valuationRisk.score}
                  confidence={snapshot.valuationRisk.confidence}
                />
                <ScoreValue
                  label="Sentiment"
                  score={snapshot.marketSentiment.score}
                  confidence={snapshot.marketSentiment.confidence}
                />
              </div>
              <div className="decision-history__decision">
                <span>{snapshot.decision.label}</span>
                <strong>{snapshot.decision.confidence}% confidence</strong>
                <p>{snapshot.keyReasons[0] ?? "No key reason recorded."}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="decision-history__empty">
          No daily snapshots have been saved yet.
        </p>
      )}
    </section>
  );
}

function ScoreValue({
  label,
  score,
  confidence,
}: {
  label: string;
  score: number;
  confidence: number;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{score}</strong>
      <small>{confidence}% confidence</small>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}
