import {
  AI_EXPLANATION_JSON_SCHEMA,
  parseAIExplanationJson,
} from "@/lib/ai/schemas";
import {
  AI_EXPLANATION_SYSTEM_INSTRUCTIONS,
  buildAIExplanationPrompt,
} from "@/lib/ai/prompts";
import type {
  AIExplanationInput,
  AIExplanationRequest,
  AIExplanationResult,
  AIExplanationScore,
  AISelectedEvidence,
} from "@/lib/ai/types";
import type { EvidenceItem, EvidenceSourceTier } from "@/types/evidence";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";
const MAX_SELECTED_EVIDENCE = 6;

interface AIExplanationServiceOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  model?: string;
  now?: () => Date;
}

export async function generateAIExplanation(
  request: AIExplanationRequest,
  options: AIExplanationServiceOptions = {},
): Promise<AIExplanationResult> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      status: "unavailable",
      message: "AI explanation is unavailable because OPENAI_API_KEY is not configured.",
    };
  }

  const input = buildAIExplanationInput(request);
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          options.model ??
          process.env.OPENAI_EXPLANATION_MODEL ??
          DEFAULT_MODEL,
        store: false,
        max_output_tokens: 1200,
        instructions: AI_EXPLANATION_SYSTEM_INSTRUCTIONS,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildAIExplanationPrompt(input),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "mu_thesis_explanation",
            strict: true,
            schema: AI_EXPLANATION_JSON_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) {
      return {
        status: "error",
        message:
          "AI explanation is temporarily unavailable. Deterministic scores and the review label are unchanged.",
      };
    }

    const responseBody: unknown = await response.json();
    const outputText = extractOutputText(responseBody);
    const explanation = outputText
      ? parseAIExplanationJson(outputText)
      : null;

    if (!explanation) {
      return {
        status: "error",
        message:
          "AI returned an invalid explanation. Deterministic scores and the review label are unchanged.",
      };
    }

    return {
      status: "success",
      explanation,
      generatedAt: (options.now ?? (() => new Date()))().toISOString(),
    };
  } catch {
    return {
      status: "error",
      message:
        "AI explanation could not be generated. Deterministic scores and the review label remain available.",
    };
  }
}

export function buildAIExplanationInput(
  request: AIExplanationRequest,
): AIExplanationInput {
  const evidenceUsedIds = new Set(
    request.decision.evidenceUsed.map((item) => item.id),
  );
  const selectedEvidence = [...request.evidence]
    .sort(
      (left, right) =>
        evidencePriority(right, evidenceUsedIds) -
          evidencePriority(left, evidenceUsedIds) ||
        Date.parse(right.observedAt) - Date.parse(left.observedAt),
    )
    .slice(0, MAX_SELECTED_EVIDENCE)
    .map(toSelectedEvidence);

  const warnings = request.decision.warnings
    .filter((warning) => warning.trim().length > 0)
    .slice(0, 8);

  return {
    mode: request.mode,
    scores: {
      businessThesisHealth: toExplanationScore(
        request.scores.business_thesis_health,
      ),
      valuationRisk: toExplanationScore(request.scores.valuation_risk),
      marketSentiment: toExplanationScore(request.scores.market_sentiment),
    },
    decision: {
      label: request.decision.label,
      confidence: clampPercent(request.decision.confidence),
      reasons: request.decision.reasons.slice(0, 6),
      warnings,
    },
    selectedEvidence,
    missingOrStaleWarnings: warnings.filter((warning) =>
      /missing|stale|unavailable|insufficient/i.test(warning),
    ),
  };
}

function toExplanationScore(
  score: AIExplanationRequest["scores"]["business_thesis_health"],
): AIExplanationScore {
  return {
    score: clampPercent(score.score),
    confidence: clampPercent(score.confidence),
    reasons: score.reasons.slice(0, 5),
  };
}

function toSelectedEvidence(item: EvidenceItem): AISelectedEvidence {
  return {
    id: item.id,
    title: truncate(item.title, 180),
    description: truncate(item.description, 320),
    sourceName: truncate(item.sourceName, 100),
    sourceTier: item.sourceTier,
    observedAt: item.observedAt,
    impactDirection: item.impactDirection,
    affectedArea: item.affectedArea,
  };
}

function evidencePriority(
  item: EvidenceItem,
  evidenceUsedIds: Set<string>,
) {
  const decisionWeight = evidenceUsedIds.has(item.id) ? 100 : 0;
  const impactWeight =
    item.impactDirection === "negative"
      ? 20
      : item.impactDirection === "positive"
        ? 15
        : 0;
  return decisionWeight + impactWeight + sourceTierWeight(item.sourceTier);
}

function sourceTierWeight(tier: EvidenceSourceTier) {
  switch (tier) {
    case "tier_1":
      return 40;
    case "tier_2":
      return 30;
    case "tier_3":
      return 20;
    case "tier_4":
      return 10;
    default:
      return 0;
  }
}

function extractOutputText(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.output_text === "string") {
    return value.output_text;
  }

  if (!Array.isArray(value.output)) {
    return null;
  }

  for (const outputItem of value.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        isRecord(contentItem) &&
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        return contentItem.text;
      }
    }
  }

  return null;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 3)}...`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
