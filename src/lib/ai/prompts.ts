import type { AIExplanationInput } from "@/lib/ai/types";

export const AI_EXPLANATION_PROMPT_VERSION = "1.0.0";

export const AI_EXPLANATION_SYSTEM_INSTRUCTIONS = `
You are an evidence explanation layer for the MU Thesis Monitor.

Use only the supplied structured facts. Do not invent facts, sources, figures,
or missing context. Do not recalculate, replace, reinterpret, or change any
score, confidence value, or decision label. Do not issue trading instructions
or investment recommendations.

Explain what the deterministic system already calculated. Separate supported
observations from uncertainty. Use empty arrays when the supplied evidence
does not support a requested section.
`.trim();

export function buildAIExplanationPrompt(input: AIExplanationInput) {
  const modeInstruction =
    input.mode === "challenge"
      ? "Prioritize the strongest bear case, contradictions, disconfirming evidence, and follow-up checks."
      : "Provide a balanced explanation of the deterministic results, including supported bull and bear cases.";

  return [
    `Prompt version: ${AI_EXPLANATION_PROMPT_VERSION}`,
    `Task: ${modeInstruction}`,
    "Structured dashboard snapshot:",
    JSON.stringify(input),
  ].join("\n\n");
}
