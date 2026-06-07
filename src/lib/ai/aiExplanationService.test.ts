import { describe, expect, it, vi } from "vitest";
import {
  buildAIExplanationInput,
  generateAIExplanation,
} from "@/lib/ai/aiExplanationService";
import { buildAIExplanationPrompt } from "@/lib/ai/prompts";
import type { AIExplanationRequest } from "@/lib/ai/types";
import type { EvidenceItem } from "@/types/evidence";

describe("AI explanation service", () => {
  it("returns unavailable without an API key and does not call OpenAI", async () => {
    const fetchImpl = vi.fn();

    const result = await generateAIExplanation(createRequest(), {
      apiKey: "",
      fetchImpl,
    });

    expect(result.status).toBe("unavailable");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects invalid model output without changing deterministic data", async () => {
    const result = await generateAIExplanation(createRequest(), {
      apiKey: "test-key",
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              summary: "Invalid because required arrays are missing.",
            }),
          }),
          { status: 200 },
        ),
      ),
    });

    expect(result).toEqual({
      status: "error",
      message:
        "AI returned an invalid explanation. Deterministic scores and the review label are unchanged.",
    });
  });

  it("sends structured output settings and accepts valid JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    summary: "Evidence remains mixed.",
                    bullCase: ["HBM demand is supportive."],
                    bearCase: ["Coverage remains incomplete."],
                    contradictions: [],
                    uncertainties: ["Some inputs are stale."],
                    followUpChecks: ["Refresh memory pricing."],
                  }),
                },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await generateAIExplanation(createRequest(), {
      apiKey: "test-key",
      fetchImpl,
      now: () => new Date("2026-06-07T15:00:00.000Z"),
    });

    expect(result.status).toBe("success");
    const requestBody = JSON.parse(
      (fetchImpl.mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(requestBody.text.format.type).toBe("json_schema");
    expect(requestBody.text.format.strict).toBe(true);
    expect(requestBody.store).toBe(false);
  });

  it("limits evidence and excludes raw URLs and unrelated fields from prompts", () => {
    const request = createRequest();
    request.evidence.push(
      ...Array.from({ length: 8 }, (_, index) =>
        evidenceItem(`extra-${index}`, `Extra evidence ${index}`),
      ),
    );
    request.evidence[0].sourceUrl =
      "https://private.example/raw-unrelated-database-record";
    request.evidence[0].createdAt = "raw-created-at-should-not-be-sent";

    const input = buildAIExplanationInput(request);
    const prompt = buildAIExplanationPrompt(input);

    expect(input.selectedEvidence).toHaveLength(6);
    expect(prompt).not.toContain("raw-unrelated-database-record");
    expect(prompt).not.toContain("raw-created-at-should-not-be-sent");
    expect(prompt).not.toContain("sourceUrl");
    expect(prompt).not.toContain("createdAt");
  });
});

function createRequest(): AIExplanationRequest {
  const evidence = [
    evidenceItem("business", "HBM demand remains strong"),
    evidenceItem("valuation", "MU drawdown from 52-week high", {
      affectedArea: "valuation_risk",
    }),
  ];

  return {
    mode: "summary",
    scores: {
      business_thesis_health: score(72, 58),
      valuation_risk: score(55, 64),
      market_sentiment: score(50, 20),
    },
    decision: {
      label: "Watch",
      confidence: 49,
      reasons: ["Business evidence is constructive but incomplete."],
      warnings: ["Market sentiment evidence is insufficient."],
      evidenceUsed: evidence,
    },
    evidence,
  };
}

function score(scoreValue: number, confidence: number) {
  return {
    score: scoreValue,
    confidence,
    reasons: ["Deterministic reason."],
    evidenceUsed: [],
    status: "current" as const,
  };
}

function evidenceItem(
  id: string,
  title: string,
  overrides: Partial<EvidenceItem> = {},
): EvidenceItem {
  return {
    id,
    title,
    description: `${title} description`,
    sourceName: "Synthetic source",
    sourceTier: "tier_1",
    sourceUrl: "https://example.com/source",
    observedAt: "2026-06-07T12:00:00.000Z",
    createdAt: "2026-06-07T12:00:00.000Z",
    evidenceType: "manual_input",
    impactDirection: "positive",
    affectedArea: "business_thesis_health",
    confidence: "high",
    analysisStatus: "analyzed",
    ...overrides,
  };
}
