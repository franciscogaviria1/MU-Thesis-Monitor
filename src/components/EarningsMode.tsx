"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  buildEarningsReviewSummary,
  buildPreEarningsChecklist,
  daysUntilEarnings,
  earningsRecordToEvidence,
} from "@/lib/earnings/earningsService";
import type { DecisionResult } from "@/types/decision";
import type {
  EarningsChecklistItem,
  EarningsRecord,
  PostEarningsInput,
} from "@/types/earnings";
import type { EvidenceItem } from "@/types/evidence";
import type { MarketDataSnapshot } from "@/types/marketData";
import type { NewsFeedSnapshot } from "@/types/news";
import type { PersistenceStatus } from "@/types/persistence";
import type { ScoringResults } from "@/types/scoring";

interface EarningsModeProps {
  earningsDate: string;
  calculatedAt: string;
  decision: DecisionResult;
  scores: ScoringResults;
  evidence: EvidenceItem[];
  marketData: MarketDataSnapshot;
  news: NewsFeedSnapshot;
  auditWarnings: string[];
  aiAvailable: boolean;
  earningsRecords: EarningsRecord[];
  onSubmit: (input: PostEarningsInput) => Promise<PersistenceStatus>;
}

type FormErrors = Partial<Record<keyof PostEarningsInput, string>>;

const guidanceOptions = ["raised", "lowered", "unchanged", "unclear"] as const;
const commentaryOptions = ["positive", "negative", "neutral", "unclear"] as const;

export function EarningsMode({
  earningsDate,
  calculatedAt,
  decision,
  scores,
  evidence,
  marketData,
  news,
  auditWarnings,
  aiAvailable,
  earningsRecords,
  onSubmit,
}: EarningsModeProps) {
  const [memoryReviewed, setMemoryReviewed] = useState(false);
  const [auditReviewed, setAuditReviewed] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const checklist = useMemo(
    () =>
      buildPreEarningsChecklist({
        evidence,
        marketData,
        news,
        aiAvailable,
        auditWarnings,
        manualReviewState: {
          memoryReviewed,
          auditReviewed,
        },
        asOf: new Date(calculatedAt),
      }),
    [
      aiAvailable,
      auditReviewed,
      auditWarnings,
      calculatedAt,
      evidence,
      marketData,
      memoryReviewed,
      news,
    ],
  );
  const latestRecord = earningsRecords[0];
  const latestEvidence = latestRecord
    ? earningsRecordToEvidence(latestRecord)
    : [];
  const reviewSummary = latestRecord
    ? buildEarningsReviewSummary(latestRecord)
    : null;
  const daysUntil = daysUntilEarnings(earningsDate, new Date(calculatedAt));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = readForm(new FormData(form), earningsDate);
    const nextErrors = validateInput(input);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormMessage("Fix the marked earnings fields before saving.");
      return;
    }

    const status = await onSubmit(input);
    setErrors({});
    setFormMessage(status.message);
    if (status.available) {
      form.reset();
    }
  }

  return (
    <section className="earnings-mode" aria-labelledby="earnings-mode-title">
      <div className="earnings-mode__heading">
        <div>
          <p className="eyebrow">Deterministic workflow</p>
          <h2 id="earnings-mode-title">Earnings Mode</h2>
        </div>
        <p>
          Pre- and post-earnings review workflow. Inputs create evidence but do
          not directly recalculate scores, labels, or trading instructions.
        </p>
      </div>

      <div className="earnings-status-grid">
        <Metric label="Earnings date" value={formatDate(earningsDate)} />
        <Metric
          label="Days until earnings"
          value={daysUntil === null ? "Unavailable" : `${daysUntil}`}
        />
        <Metric label="Current decision" value={decision.label} />
        <Metric
          label="Current confidence"
          value={`${decision.confidence}%`}
        />
      </div>

      <div className="earnings-score-strip">
        <ScoreMetric
          label="Business Thesis Health"
          score={scores.business_thesis_health.score}
          confidence={scores.business_thesis_health.confidence}
        />
        <ScoreMetric
          label="Valuation Risk"
          score={scores.valuation_risk.score}
          confidence={scores.valuation_risk.confidence}
        />
        <ScoreMetric
          label="Market Sentiment"
          score={scores.market_sentiment.score}
          confidence={scores.market_sentiment.confidence}
        />
      </div>

      <div className="earnings-layout">
        <div>
          <Checklist
            items={checklist}
            memoryReviewed={memoryReviewed}
            auditReviewed={auditReviewed}
            onMemoryReviewed={setMemoryReviewed}
            onAuditReviewed={setAuditReviewed}
          />
          <KeyEvidence evidence={decision.evidenceUsed} />
        </div>

        <form className="earnings-form" onSubmit={handleSubmit} noValidate>
          <p className="field-label">Post-earnings manual input</p>
          <div className="earnings-form-grid">
            <FormField
              label="Earnings date"
              name="earningsDate"
              type="date"
              defaultValue={earningsDate}
              error={errors.earningsDate}
            />
            <FormField
              label="Reported revenue"
              name="reportedRevenue"
              error={errors.reportedRevenue}
            />
            <FormField
              label="Revenue expectation"
              name="revenueExpectation"
              error={errors.revenueExpectation}
            />
            <FormField
              label="Reported EPS"
              name="reportedEps"
              error={errors.reportedEps}
            />
            <FormField
              label="EPS expectation"
              name="epsExpectation"
              error={errors.epsExpectation}
            />
            <SelectField
              label="Guidance direction"
              name="guidanceDirection"
              options={guidanceOptions}
              error={errors.guidanceDirection}
            />
            <SelectField
              label="HBM commentary"
              name="hbmCommentary"
              options={commentaryOptions}
              error={errors.hbmCommentary}
            />
            <SelectField
              label="DRAM commentary"
              name="dramCommentary"
              options={commentaryOptions}
              error={errors.dramCommentary}
            />
            <SelectField
              label="Margin commentary"
              name="marginCommentary"
              options={commentaryOptions}
              error={errors.marginCommentary}
            />
            <FormField
              label="Source URL"
              name="sourceUrl"
              type="url"
              error={errors.sourceUrl}
            />
            <label className="earnings-field earnings-field--wide">
              <span>Notes</span>
              <textarea name="notes" rows={3} />
            </label>
          </div>
          <div className="earnings-form-actions">
            <button type="submit">Save earnings review</button>
            <p aria-live="polite">{formMessage}</p>
          </div>
        </form>
      </div>

      <EarningsReviewSummary
        record={latestRecord}
        evidence={latestEvidence}
        summary={reviewSummary}
      />
    </section>
  );
}

function Checklist({
  items,
  memoryReviewed,
  auditReviewed,
  onMemoryReviewed,
  onAuditReviewed,
}: {
  items: EarningsChecklistItem[];
  memoryReviewed: boolean;
  auditReviewed: boolean;
  onMemoryReviewed: (value: boolean) => void;
  onAuditReviewed: (value: boolean) => void;
}) {
  return (
    <div className="earnings-checklist">
      <p className="field-label">Pre-earnings checklist</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.manual ? (
              <input
                type="checkbox"
                checked={
                  item.id === "manual-review"
                    ? memoryReviewed
                    : auditReviewed
                }
                onChange={(event) =>
                  item.id === "manual-review"
                    ? onMemoryReviewed(event.target.checked)
                    : onAuditReviewed(event.target.checked)
                }
                aria-label={item.label}
              />
            ) : (
              <span
                className={
                  item.complete
                    ? "earnings-checklist__complete"
                    : "earnings-checklist__open"
                }
                aria-hidden="true"
              />
            )}
            <div>
              <strong>
                {item.label}
                {item.optional ? " (optional)" : ""}
              </strong>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeyEvidence({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <div className="earnings-key-evidence">
      <p className="field-label">Key evidence before earnings</p>
      {evidence.length > 0 ? (
        <ul>
          {evidence.slice(0, 5).map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.sourceName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pre-earnings score evidence is currently eligible.</p>
      )}
    </div>
  );
}

function EarningsReviewSummary({
  record,
  evidence,
  summary,
}: {
  record?: EarningsRecord;
  evidence: EvidenceItem[];
  summary: ReturnType<typeof buildEarningsReviewSummary> | null;
}) {
  if (!record || !summary) {
    return (
      <div className="earnings-review-summary">
        <p className="field-label">Earnings Review Summary</p>
        <p>No post-earnings review has been saved yet.</p>
      </div>
    );
  }

  return (
    <div className="earnings-review-summary">
      <p className="field-label">Earnings Review Summary</p>
      <div className="earnings-review-summary__topline">
        <strong>{summary.outcome}</strong>
        <span>
          Pre-earnings decision: {record.preEarningsDecision.label} (
          {record.preEarningsDecision.confidence}% confidence)
        </span>
      </div>

      <div className="earnings-review-summary__grid">
        <SummaryList title="Post-earnings evidence" items={evidence.map((item) => item.title)} />
        <SummaryList title="Major thesis changes" items={summary.majorThesisChanges} />
        <SummaryList title="Warnings" items={summary.warnings} empty="No warnings." />
        <SummaryList
          title="Needs manual review"
          items={summary.manualReviewItems}
          empty="No manual review items."
        />
      </div>
    </div>
  );
}

function SummaryList({
  title,
  items,
  empty = "No items.",
}: {
  title: string;
  items: string[];
  empty?: string;
}) {
  return (
    <div>
      <p className="field-label">{title}</p>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScoreMetric({
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

interface FormFieldProps {
  label: string;
  name: keyof PostEarningsInput;
  error?: string;
  type?: string;
  defaultValue?: string;
}

function FormField({
  label,
  name,
  error,
  type = "text",
  defaultValue,
}: FormFieldProps) {
  return (
    <label className="earnings-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
      />
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  error,
}: {
  label: string;
  name: keyof PostEarningsInput;
  options: readonly string[];
  error?: string;
}) {
  return (
    <label className="earnings-field">
      <span>{label}</span>
      <select name={name} defaultValue="" aria-invalid={Boolean(error)}>
        <option value="" disabled>
          Select
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function readForm(
  formData: FormData,
  fallbackEarningsDate: string,
): PostEarningsInput {
  return {
    earningsDate: fieldValue(formData, "earningsDate") || fallbackEarningsDate,
    reportedRevenue: fieldValue(formData, "reportedRevenue"),
    revenueExpectation:
      fieldValue(formData, "revenueExpectation") || undefined,
    reportedEps: fieldValue(formData, "reportedEps"),
    epsExpectation: fieldValue(formData, "epsExpectation") || undefined,
    guidanceDirection: fieldValue(
      formData,
      "guidanceDirection",
    ) as PostEarningsInput["guidanceDirection"],
    hbmCommentary: fieldValue(
      formData,
      "hbmCommentary",
    ) as PostEarningsInput["hbmCommentary"],
    dramCommentary: fieldValue(
      formData,
      "dramCommentary",
    ) as PostEarningsInput["dramCommentary"],
    marginCommentary: fieldValue(
      formData,
      "marginCommentary",
    ) as PostEarningsInput["marginCommentary"],
    notes: fieldValue(formData, "notes") || undefined,
    sourceUrl: fieldValue(formData, "sourceUrl"),
  };
}

function validateInput(input: PostEarningsInput) {
  const errors: FormErrors = {};

  for (const field of [
    "earningsDate",
    "reportedRevenue",
    "reportedEps",
    "guidanceDirection",
    "hbmCommentary",
    "dramCommentary",
    "marginCommentary",
    "sourceUrl",
  ] as const) {
    if (!input[field]) {
      errors[field] = "Required";
    }
  }

  try {
    const url = new URL(input.sourceUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      errors.sourceUrl = "Use an http or https URL";
    }
  } catch {
    errors.sourceUrl = "Enter a valid source URL";
  }

  return errors;
}

function fieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/New_York",
  }).format(new Date(`${value}T12:00:00.000Z`));
}
