import type { ConfidenceCoverage as ConfidenceCoverageData } from "@/types/dashboard";

interface ConfidenceCoverageProps {
  data: ConfidenceCoverageData;
}

export function ConfidenceCoverage({ data }: ConfidenceCoverageProps) {
  return (
    <section className="coverage-section" aria-labelledby="coverage-title">
      <div className="coverage-section__intro">
        <p className="eyebrow">Evidence quality</p>
        <h2 id="coverage-title">{data.title}</h2>
        <p>{data.description}</p>
        <div className="verified-time">
          <span>{data.verifiedLabel}</span>
          <time>{data.lastVerified}</time>
        </div>
      </div>

      <div className="coverage-metrics">
        {data.metrics.map((metric) => (
          <div className="coverage-metric" key={metric.label}>
            <div className="coverage-metric__topline">
              <span>{metric.label}</span>
              <strong>{metric.value}%</strong>
            </div>
            <div
              className="meter"
              role="progressbar"
              aria-label={metric.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={metric.value}
            >
              <span style={{ width: `${metric.value}%` }} />
            </div>
            <p>{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="warning-list">
        <p className="field-label">{data.missingDataTitle}</p>
        <ul>
          {data.missingDataWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
