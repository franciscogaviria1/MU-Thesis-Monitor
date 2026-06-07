"use client";

import { useState } from "react";
import { requestAIExplanation } from "@/app/actions/aiExplanation";
import type {
  AIExplanationMode,
  AIExplanationRequest,
  AIExplanationResult,
} from "@/lib/ai/types";
import type { DecisionResult } from "@/types/decision";
import type { EvidenceItem } from "@/types/evidence";
import type { ScoringResults } from "@/types/scoring";

interface AIExplanationPanelProps {
  scores: ScoringResults;
  decision: DecisionResult;
  evidence: EvidenceItem[];
  aiAvailable: boolean;
}

export function AIExplanationPanel({
  scores,
  decision,
  evidence,
  aiAvailable,
}: AIExplanationPanelProps) {
  const [cache, setCache] = useState<Record<string, AIExplanationResult>>({});
  const [result, setResult] = useState<AIExplanationResult | null>(null);
  const [activeMode, setActiveMode] = useState<AIExplanationMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function generate(mode: AIExplanationMode) {
    if (!aiAvailable) {
      setResult({
        status: "unavailable",
        message:
          "AI explanation is unavailable because OPENAI_API_KEY is not configured.",
      });
      return;
    }

    const request: AIExplanationRequest = {
      mode,
      scores,
      decision,
      evidence,
    };
    const cacheKey = createCacheKey(request);
    const cachedResult = cache[cacheKey];

    setActiveMode(mode);
    if (cachedResult) {
      setResult(cachedResult);
      return;
    }

    setIsLoading(true);
    const nextResult = await requestAIExplanation(request);
    setCache((current) => ({ ...current, [cacheKey]: nextResult }));
    setResult(nextResult);
    setIsLoading(false);
  }

  return (
    <section className="ai-explanation" aria-labelledby="ai-explanation-title">
      <div className="ai-explanation__header">
        <div>
          <p className="eyebrow">Optional analysis layer</p>
          <h2 id="ai-explanation-title">AI Explanation</h2>
          <p>
            Generate a bounded explanation of the deterministic dashboard
            result, or challenge the thesis using the same selected evidence.
          </p>
        </div>
        <div className="ai-explanation__actions">
          <button
            type="button"
            onClick={() => generate("summary")}
            disabled={isLoading || !aiAvailable}
          >
            Generate explanation
          </button>
          <button
            type="button"
            className="ai-explanation__challenge"
            onClick={() => generate("challenge")}
            disabled={isLoading || !aiAvailable}
          >
            Challenge thesis
          </button>
        </div>
      </div>

      <div className="ai-explanation__policy" aria-label="AI policy reminders">
        <span>AI-generated explanation</span>
        <span>Not used to calculate scores</span>
        <span>Not used to calculate decision label</span>
        <span>Deterministic decision is authoritative</span>
        <span>Not financial advice</span>
      </div>

      <div className="ai-explanation__content" aria-live="polite">
        {isLoading ? (
          <p className="ai-explanation__empty">Generating explanation...</p>
        ) : result?.status === "success" ? (
          <ExplanationResult
            result={result}
            mode={activeMode ?? "summary"}
          />
        ) : result ? (
          <p className="ai-explanation__error">{result.message}</p>
        ) : !aiAvailable ? (
          <p className="ai-explanation__error">
            AI unavailable: OPENAI_API_KEY is not configured. Scores and the
            decision remain fully deterministic and available.
          </p>
        ) : (
          <p className="ai-explanation__empty">
            AI has not been called. The deterministic dashboard remains fully
            available without it.
          </p>
        )}
      </div>
    </section>
  );
}

function ExplanationResult({
  result,
  mode,
}: {
  result: Extract<AIExplanationResult, { status: "success" }>;
  mode: AIExplanationMode;
}) {
  const { explanation } = result;

  return (
    <>
      <div className="ai-explanation__summary">
        <p className="field-label">
          {mode === "challenge" ? "Thesis challenge" : "Summary"}
        </p>
        <p>{explanation.summary}</p>
        <time dateTime={result.generatedAt}>
          Generated {new Date(result.generatedAt).toLocaleString()}
        </time>
      </div>
      <div className="ai-explanation__grid">
        <ExplanationList title="Bull case" items={explanation.bullCase} />
        <ExplanationList title="Bear case" items={explanation.bearCase} />
        <ExplanationList
          title="Contradictions"
          items={explanation.contradictions}
        />
        <ExplanationList
          title="Uncertainties"
          items={explanation.uncertainties}
        />
        <ExplanationList
          title="Follow-up checks"
          items={explanation.followUpChecks}
        />
      </div>
    </>
  );
}

function ExplanationList({ title, items }: { title: string; items: string[] }) {
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
        <p className="decision-empty">No supported item returned.</p>
      )}
    </div>
  );
}

function createCacheKey(request: AIExplanationRequest) {
  return JSON.stringify({
    mode: request.mode,
    scores: request.scores,
    decision: {
      label: request.decision.label,
      confidence: request.decision.confidence,
      reasons: request.decision.reasons,
      warnings: request.decision.warnings,
      evidenceIds: request.decision.evidenceUsed.map((item) => item.id),
    },
    evidence: request.evidence.map((item) => [
      item.id,
      item.observedAt,
      item.analysisStatus,
    ]),
  });
}
