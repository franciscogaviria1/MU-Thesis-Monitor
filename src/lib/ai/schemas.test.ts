import { describe, expect, it } from "vitest";
import {
  parseAIExplanationJson,
  validateAIExplanation,
} from "@/lib/ai/schemas";

const validExplanation = {
  summary: "The deterministic result has limited confidence.",
  bullCase: ["HBM demand remains supportive."],
  bearCase: ["Missing pricing coverage limits conviction."],
  contradictions: [],
  uncertainties: ["Current evidence coverage is incomplete."],
  followUpChecks: ["Verify the next memory pricing update."],
};

describe("AI explanation schema", () => {
  it("accepts and normalizes the expected structured output", () => {
    expect(validateAIExplanation(validExplanation)).toEqual(validExplanation);
  });

  it("rejects missing fields and unknown fields", () => {
    expect(
      validateAIExplanation({
        ...validExplanation,
        followUpChecks: undefined,
      }),
    ).toBeNull();
    expect(
      validateAIExplanation({
        ...validExplanation,
        decisionLabel: "Strong Hold",
      }),
    ).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseAIExplanationJson("{invalid")).toBeNull();
  });
});
