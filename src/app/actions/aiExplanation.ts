"use server";

import { generateAIExplanation } from "@/lib/ai/aiExplanationService";
import type {
  AIExplanationRequest,
  AIExplanationResult,
} from "@/lib/ai/types";

export async function requestAIExplanation(
  request: AIExplanationRequest,
): Promise<AIExplanationResult> {
  return generateAIExplanation(request);
}
