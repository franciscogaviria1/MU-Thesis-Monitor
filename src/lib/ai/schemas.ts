import type { AIExplanation } from "@/lib/ai/types";

const ARRAY_FIELDS = [
  "bullCase",
  "bearCase",
  "contradictions",
  "uncertainties",
  "followUpChecks",
] as const;

export const AI_EXPLANATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "bullCase",
    "bearCase",
    "contradictions",
    "uncertainties",
    "followUpChecks",
  ],
  properties: {
    summary: {
      type: "string",
      minLength: 1,
      maxLength: 1200,
    },
    bullCase: stringArraySchema(),
    bearCase: stringArraySchema(),
    contradictions: stringArraySchema(),
    uncertainties: stringArraySchema(),
    followUpChecks: stringArraySchema(),
  },
} as const;

export function parseAIExplanationJson(value: string): AIExplanation | null {
  try {
    return validateAIExplanation(JSON.parse(value));
  } catch {
    return null;
  }
}

export function validateAIExplanation(value: unknown): AIExplanation | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const allowedKeys = new Set(["summary", ...ARRAY_FIELDS]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    return null;
  }

  if (
    typeof value.summary !== "string" ||
    value.summary.trim().length === 0 ||
    value.summary.length > 1200
  ) {
    return null;
  }

  for (const field of ARRAY_FIELDS) {
    if (!isValidStringArray(value[field])) {
      return null;
    }
  }

  return {
    summary: value.summary.trim(),
    bullCase: normalizeList(value.bullCase),
    bearCase: normalizeList(value.bearCase),
    contradictions: normalizeList(value.contradictions),
    uncertainties: normalizeList(value.uncertainties),
    followUpChecks: normalizeList(value.followUpChecks),
  };
}

function stringArraySchema() {
  return {
    type: "array",
    maxItems: 5,
    items: {
      type: "string",
      minLength: 1,
      maxLength: 500,
    },
  } as const;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 5 &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        item.length <= 500,
    )
  );
}

function normalizeList(value: unknown) {
  return (value as string[]).map((item) => item.trim());
}
