# AI Usage Policy

## Core Rule

AI explains evidence. Deterministic rules calculate scores and assign decision labels.

AI output is analysis, not source evidence. It must remain traceable to collected material and may not override facts, score calculations, confidence gates, or decision rules.

## Allowed Uses

AI may perform:

- headline classification using predefined labels;
- duplicate detection, with deterministic identifiers preferred where available;
- contradiction detection across sources or reporting periods;
- daily summaries of new, cited evidence;
- sourced bull-case generation;
- sourced bear-case generation;
- earnings transcript analysis;
- plain-language explanations of score and decision-label changes.

Allowed output must cite the evidence used, distinguish fact from interpretation, identify uncertainty, and preserve material contradictions.

## Prohibited Uses

AI must not:

- invent facts, quotations, events, figures, or sources;
- generate or estimate market data;
- present model knowledge as current evidence;
- calculate, adjust, or override final scores;
- assign or override final decision labels;
- fill missing evidence with assumptions;
- conceal conflicting evidence;
- issue trading instructions or personalized investment advice.

Unsupported claims must be rejected, omitted, or clearly flagged for review.

## Evidence Handling

Prompts should contain only the evidence needed for the task, including source metadata and dates. Outputs must be stored separately from raw evidence. AI-generated claims may enter scoring only after independent validation and conversion into an eligible deterministic input.

When evidence is incomplete or contradictory, AI must state the limitation. It must not force a conclusion when `Insufficient Evidence` applies.

## Token Efficiency

AI usage must minimize unnecessary processing:

- cache outputs using content, prompt, model, and policy versions;
- prefer deterministic parsing, filtering, deduplication, and calculations;
- avoid re-analysis when source content and instructions are unchanged;
- process new or changed evidence as deltas when possible;
- summarize long material once and reuse the verified summary;
- send only relevant excerpts and metadata;
- use the smallest model and response size that reliably satisfies the task.

Cache invalidation must occur when evidence, policy, prompt, or required output changes. Cost savings must not remove citations, uncertainty, or contradictory evidence.

## Operational Controls

- Record model, prompt version, source references, generation time, and validation status.
- Treat model failure as independent from deterministic scoring.
- Require human review for unsupported, materially contradictory, or high-impact output.
- Make AI analysis replaceable and reproducible where practical.
- Never allow AI availability to determine whether a score can be calculated.

## Dashboard Explanation Layer

- Explanation requests are server-only and user-initiated; page loads must not call AI.
- Inputs are limited to deterministic results, their reasons and warnings, and a small set of relevant evidence summaries.
- Outputs must match the explanation JSON schema and must not contain replacement scores, confidence values, or decision labels.
- Missing credentials, provider failures, refusals, incomplete responses, and invalid JSON leave the deterministic dashboard unchanged.
- The client may cache the latest response for an unchanged dashboard snapshot, but AI output remains separate from source evidence and scoring.
