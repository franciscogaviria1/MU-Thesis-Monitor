import type { AuditSummary } from "@/types/audit";

interface AuditSummaryPanelProps {
  audit: AuditSummary;
}

export function AuditSummaryPanel({ audit }: AuditSummaryPanelProps) {
  return (
    <section className="audit-summary" aria-labelledby="audit-summary-title">
      <div className="audit-summary__heading">
        <div>
          <p className="eyebrow">Deterministic trace</p>
          <h2 id="audit-summary-title">Audit Summary</h2>
        </div>
        <p>
          This trace explains which evidence affected scores, what was ignored,
          and which policy guardrails constrained the review label.
        </p>
      </div>

      <div className="audit-authority" aria-label="AI boundary and authority">
        {audit.authorityStatements.map((statement) => (
          <strong key={statement}>{statement}</strong>
        ))}
      </div>

      <div className="audit-summary__grid">
        <AuditEvidenceList
          title="Evidence affecting scores"
          emptyMessage="No evidence affected a deterministic score."
          items={audit.scoreEvidence.map((item) => ({
            id: item.id,
            title: item.title,
            detail: `${item.sourceName} · ${formatArea(item.affectedArea)}`,
          }))}
        />

        <AuditEvidenceList
          title="Ignored evidence and reason"
          emptyMessage="No evidence was ignored."
          items={audit.ignoredEvidence.map(({ evidence, reason }) => ({
            id: evidence.id,
            title: evidence.title,
            detail: reason,
          }))}
        />

        <AuditTextList
          title="Decision safeguards triggered"
          items={audit.decisionSafeguards}
        />

        <div className="audit-confidence">
          <p className="field-label">Confidence impact</p>
          <strong>
            {audit.confidenceReduced
              ? "Reduced by missing or stale data"
              : "No missing/stale reduction detected"}
          </strong>
          {audit.confidenceReductionReasons.length > 0 && (
            <ul>
              {audit.confidenceReductionReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function AuditEvidenceList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: Array<{ id: string; title: string; detail: string }>;
  emptyMessage: string;
}) {
  return (
    <div className="audit-summary__list">
      <p className="field-label">{title}</p>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </div>
  );
}

function AuditTextList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="audit-summary__list">
      <p className="field-label">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatArea(value: string) {
  return value
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
