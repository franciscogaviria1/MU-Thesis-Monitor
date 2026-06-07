import type { SystemHealthSummary } from "@/types/audit";

interface SystemHealthProps {
  health: SystemHealthSummary;
}

export function SystemHealth({ health }: SystemHealthProps) {
  const statuses = [
    health.marketData,
    health.newsData,
    health.manualMemoryData,
    health.persistence,
  ];

  return (
    <section className="system-health" aria-labelledby="system-health-title">
      <div className="system-health__intro">
        <p className="eyebrow">Reliability controls</p>
        <h2 id="system-health-title">System Health / Audit</h2>
        <p>
          Current provider state, evidence coverage, and optional AI
          availability. Operational failures do not replace deterministic
          results.
        </p>
      </div>

      <div className="system-health__status-grid">
        {statuses.map((item) => (
          <article key={item.label}>
            <div>
              <h3>{item.label}</h3>
              <span className={`audit-status audit-status--${item.status}`}>
                {item.status}
              </span>
            </div>
            <p>{item.detail}</p>
            <time dateTime={item.lastUpdated ?? undefined}>
              {item.lastUpdated
                ? `Updated ${formatTimestamp(item.lastUpdated)}`
                : "Last successful update unavailable"}
            </time>
          </article>
        ))}
      </div>

      <dl className="system-health__metrics">
        <div>
          <dt>Evidence count</dt>
          <dd>{health.evidenceCount}</dd>
        </div>
        <div>
          <dt>AI availability</dt>
          <dd>{health.aiAvailable ? "Available" : "Unavailable"}</dd>
        </div>
        <div>
          <dt>Last successful update</dt>
          <dd>
            {health.lastSuccessfulUpdate
              ? formatTimestamp(health.lastSuccessfulUpdate)
              : "Unavailable"}
          </dd>
        </div>
      </dl>

      <div className="system-health__warnings">
        <p className="field-label">Missing critical data warnings</p>
        {health.missingCriticalDataWarnings.length > 0 ? (
          <ul>
            {health.missingCriticalDataWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p>No missing or stale critical data warnings.</p>
        )}
      </div>
    </section>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}
