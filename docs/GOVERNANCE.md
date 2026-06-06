# Governance

## Purpose

Protect the system from AI drift, hidden assumptions, unsupported conclusions, silent policy changes, and unsafe presentation of investment information.

## Authority Boundaries

- Collected, attributable sources provide evidence.
- Deterministic rules calculate scores, confidence, and decision labels.
- AI classifies and explains evidence but is not a scoring authority.
- Humans make investment decisions and may record attributed review notes.

AI availability must never determine whether a deterministic score can be calculated.

## Evidence Rules

- Facts, forecasts, opinions, AI analysis, and human annotations must remain separate.
- Every material conclusion must cite dated, traceable evidence.
- Source tier, freshness, coverage, and contradictions must affect confidence.
- Missing or stale evidence must not be replaced with neutral values, assumptions, prior conclusions, or AI estimates.
- Duplicate and syndicated reporting must not be counted as independent confirmation.
- Raw evidence, normalized inputs, rule versions, and result history must remain auditable.
- `Insufficient Evidence` is a valid outcome and must take precedence when evidence gates fail.

## AI Boundaries

AI may:

- classify headlines;
- detect duplicates and contradictions;
- summarize sourced evidence;
- analyze earnings transcripts;
- generate sourced bull and bear cases;
- explain deterministic score and label changes.

AI must not:

- invent facts, figures, quotations, events, market data, or sources;
- present model knowledge as current evidence;
- calculate, adjust, or override final scores or labels;
- conceal conflicting evidence or fill evidence gaps;
- issue trading instructions or personalized investment advice.

AI output is analysis, not source evidence. Unsupported output must be rejected, flagged, or omitted.

## Decision Safety

- Business Thesis Health, Valuation Risk, and Market Sentiment remain independent.
- Review labels are deterministic monitoring postures, not predictions or trading signals.
- `Exit Review` is not a sell instruction.
- Favorable sentiment must not override materially adverse business evidence.
- Every label must include supporting evidence, confidence, explanation, and material contradictions or gaps.
- Manual overrides or disagreements must preserve the original deterministic result and be attributed, timestamped, and reasoned.

## Change Control

Codex and contributors may improve the project, but must not silently weaken governance, auditability, evidence requirements, source traceability, deterministic scoring, or user safety.

Material changes to scoring, confidence, source tiers, freshness, decision rules, AI permissions, or audit behavior must:

1. Explain the need and tradeoffs.
2. Update affected documentation.
3. Add or update tests when behavior changes.
4. Record the decision in `docs/DECISION_LOG.md`.

Rules and thresholds must be versioned so historical results remain explainable.

## Review Standard

Assume AI, users, contributors, and sources can all be wrong. Prefer explicit uncertainty and reviewable evidence over confident unsupported conclusions.
