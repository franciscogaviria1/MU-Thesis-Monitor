"use client";

import { useState, type FormEvent } from "react";
import { SectionHeading } from "@/components/SectionHeading";
import type { EvidenceSourceTier } from "@/types/evidence";
import type {
  ManualMemoryDataEntry,
  ManualMemoryDataInput,
  MemoryMetricCategory,
  MemoryMetricDirection,
} from "@/types/manualMemoryData";

interface MemoryDataSectionProps {
  entries: ManualMemoryDataEntry[];
  onAddEntry: (input: ManualMemoryDataInput) => boolean;
  storageAvailable: boolean;
}

type FormErrors = Partial<Record<keyof ManualMemoryDataInput, string>>;

const categoryOptions: Array<{
  value: MemoryMetricCategory;
  label: string;
}> = [
  { value: "server_dram_contract", label: "Server DRAM contract" },
  { value: "dram_spot", label: "DRAM spot" },
  { value: "hbm_demand", label: "HBM demand" },
  { value: "hbm_pricing", label: "HBM pricing" },
  { value: "nand_pricing", label: "NAND pricing" },
  { value: "other", label: "Other" },
];

const directionOptions: Array<{
  value: MemoryMetricDirection;
  label: string;
}> = [
  { value: "rising", label: "Rising" },
  { value: "falling", label: "Falling" },
  { value: "flat", label: "Flat" },
  { value: "unknown", label: "Unknown" },
];

const sourceTierOptions: Array<{
  value: EvidenceSourceTier;
  label: string;
}> = [
  { value: "tier_1", label: "Tier 1 - official data" },
  { value: "tier_2", label: "Tier 2 - major journalism" },
  { value: "tier_3", label: "Tier 3 - analysis" },
  { value: "tier_4", label: "Tier 4 - community" },
  { value: "unknown", label: "Unknown tier" },
];

export function MemoryDataSection({
  entries,
  onAddEntry,
  storageAvailable,
}: MemoryDataSectionProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [formMessage, setFormMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = readForm(new FormData(form));
    const nextErrors = validateInput(input);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormMessage("Fix the marked fields before saving.");
      return;
    }

    const persisted = onAddEntry(input);
    form.reset();
    setErrors({});
    setFormMessage(
      persisted
        ? "Memory data saved locally and added to evidence."
        : "Memory data added for this session. Local persistence is unavailable.",
    );
  }

  return (
    <section className="memory-data-section" aria-labelledby="memory-data-title">
      <SectionHeading
        eyebrow="Manual structured data"
        title="Memory data"
        description="Record pricing and HBM observations locally. Entries remain unscored and not analyzed."
      />

      <div className="memory-data-layout">
        <form className="memory-data-form" onSubmit={handleSubmit} noValidate>
          <div className="memory-form-grid">
            <FormField
              label="Metric name"
              name="metricName"
              error={errors.metricName}
            />
            <SelectField
              label="Category"
              name="category"
              options={categoryOptions}
              error={errors.category}
            />
            <FormField label="Value" name="value" error={errors.value} />
            <FormField label="Unit" name="unit" error={errors.unit} />
            <SelectField
              label="Direction"
              name="direction"
              options={directionOptions}
              error={errors.direction}
            />
            <FormField
              label="Period"
              name="period"
              placeholder="Q3 2026 or June 2026"
              error={errors.period}
            />
            <FormField
              label="Source name"
              name="sourceName"
              error={errors.sourceName}
            />
            <SelectField
              label="Source tier"
              name="sourceTier"
              options={sourceTierOptions}
              error={errors.sourceTier}
            />
            <FormField
              label="Source URL"
              name="sourceUrl"
              type="url"
              placeholder="Optional"
              error={errors.sourceUrl}
            />
            <label className="memory-field memory-field--wide">
              <span>Notes</span>
              <textarea name="notes" rows={3} placeholder="Optional context" />
            </label>
          </div>

          <div className="memory-form-actions">
            <button type="submit">Add memory data</button>
            <p aria-live="polite">{formMessage}</p>
          </div>
          {!storageAvailable ? (
            <p className="memory-storage-warning">
              Local storage is unavailable. Entries will last only for this
              page session.
            </p>
          ) : null}
        </form>

        <div className="memory-data-list">
          <div className="memory-data-list__header">
            <span className="field-label">Latest entries</span>
            <strong>{entries.length}</strong>
          </div>

          {entries.length > 0 ? (
            <ol>
              {entries.slice(0, 6).map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>{entry.metricName}</strong>
                    <span>{formatCategory(entry.category)}</span>
                  </div>
                  <p>
                    {entry.value} {entry.unit}
                  </p>
                  <span
                    className={`memory-direction memory-direction--${entry.direction}`}
                  >
                    {entry.direction}
                  </span>
                  <dl>
                    <div>
                      <dt>Source</dt>
                      <dd>{entry.sourceName}</dd>
                    </div>
                    <div>
                      <dt>Observed</dt>
                      <dd>{formatDate(entry.observedAt)}</dd>
                    </div>
                  </dl>
                  {entry.notes ? <small>{entry.notes}</small> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="memory-data-empty">
              No manual memory observations have been saved in this browser.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

interface FormFieldProps {
  label: string;
  name: keyof ManualMemoryDataInput;
  error?: string;
  type?: string;
  placeholder?: string;
}

function FormField({
  label,
  name,
  error,
  type = "text",
  placeholder,
}: FormFieldProps) {
  return (
    <label className="memory-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />
      {error ? <small>{error}</small> : null}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  name: keyof ManualMemoryDataInput;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

function SelectField({ label, name, options, error }: SelectFieldProps) {
  return (
    <label className="memory-field">
      <span>{label}</span>
      <select name={name} defaultValue="" aria-invalid={Boolean(error)}>
        <option value="" disabled>
          Select
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function readForm(formData: FormData): ManualMemoryDataInput {
  return {
    metricName: fieldValue(formData, "metricName"),
    category: fieldValue(formData, "category") as MemoryMetricCategory,
    value: fieldValue(formData, "value"),
    unit: fieldValue(formData, "unit"),
    direction: fieldValue(formData, "direction") as MemoryMetricDirection,
    period: fieldValue(formData, "period"),
    sourceName: fieldValue(formData, "sourceName"),
    sourceTier: fieldValue(formData, "sourceTier") as EvidenceSourceTier,
    sourceUrl: fieldValue(formData, "sourceUrl") || undefined,
    notes: fieldValue(formData, "notes") || undefined,
  };
}

function validateInput(input: ManualMemoryDataInput): FormErrors {
  const errors: FormErrors = {};
  const required: Array<keyof ManualMemoryDataInput> = [
    "metricName",
    "category",
    "value",
    "unit",
    "direction",
    "period",
    "sourceName",
    "sourceTier",
  ];

  required.forEach((field) => {
    if (!input[field]) {
      errors[field] = "Required";
    }
  });

  if (input.sourceUrl) {
    try {
      const url = new URL(input.sourceUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.sourceUrl = "Use an http or https URL";
      }
    } catch {
      errors.sourceUrl = "Enter a valid URL";
    }
  }

  return errors;
}

function fieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formatCategory(value: MemoryMetricCategory) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
