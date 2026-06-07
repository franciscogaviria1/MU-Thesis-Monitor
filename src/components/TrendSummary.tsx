"use client";

import { useMemo, useState } from "react";
import { analyzeTrend } from "@/lib/trends/trendAnalyzer";
import type {
  TrendChange,
  TrendWindowDays,
} from "@/lib/trends/trendTypes";
import type { DailySnapshot } from "@/types/persistence";

interface TrendSummaryProps {
  snapshots: DailySnapshot[];
  persistenceAvailable: boolean;
}

const windows: TrendWindowDays[] = [7, 14, 30];

export function TrendSummary({
  snapshots,
  persistenceAvailable,
}: TrendSummaryProps) {
  const [windowDays, setWindowDays] = useState<TrendWindowDays>(7);
  const trend = useMemo(
    () => analyzeTrend(snapshots, windowDays),
    [snapshots, windowDays],
  );

  return (
    <section className="trend-summary" aria-labelledby="trend-summary-title">
      <div className="trend-summary__heading">
        <div>
          <p className="eyebrow">Persisted snapshot analysis</p>
          <h2 id="trend-summary-title">Trend Summary</h2>
        </div>
        <p>
          Deterministic comparison of saved daily snapshots. No missing dates
          are interpolated and no AI analysis is used.
        </p>
      </div>

      <div className="trend-window-tabs" aria-label="Trend analysis window">
        {windows.map((window) => (
          <button
            key={window}
            type="button"
            aria-pressed={windowDays === window}
            onClick={() => setWindowDays(window)}
          >
            {window} days
          </button>
        ))}
      </div>

      {!persistenceAvailable ? (
        <p className="trend-summary__warning">
          Trend history is unavailable because local persistence is
          unavailable.
        </p>
      ) : (
        <>
          <div className="trend-summary__result">
            <div>
              <span className={`trend-direction trend-direction--${trend.direction}`}>
                {formatDirection(trend.direction)}
              </span>
              <strong>{trend.confidence}% trend confidence</strong>
            </div>
            <p>{trend.summary}</p>
          </div>

          {trend.changes.length > 0 ? (
            <div className="trend-change-grid">
              {trend.changes.map((change) => (
                <TrendChangeCard key={change.metric} change={change} />
              ))}
            </div>
          ) : null}

          {trend.warnings.length > 0 ? (
            <div className="trend-summary__warnings">
              <p className="field-label">Trend warnings</p>
              <ul>
                {trend.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function TrendChangeCard({ change }: { change: TrendChange }) {
  return (
    <article>
      <p className="field-label">{change.metric}</p>
      <div>
        <span>{change.startLabel ?? change.startValue}</span>
        <span aria-hidden="true">to</span>
        <strong>{change.endLabel ?? change.endValue}</strong>
      </div>
      <small className={`trend-change trend-change--${change.direction}`}>
        {change.change > 0 ? "+" : ""}
        {change.change}
      </small>
    </article>
  );
}

function formatDirection(value: string) {
  return value.replaceAll("_", " ");
}
