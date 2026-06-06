# Testing Strategy

## Priorities

Tests are implemented in this order:

1. Governance-critical logic
2. Scoring logic
3. Data freshness logic
4. UI behavior

Failures in governance-critical, scoring, confidence, freshness, or decision logic block release. AI availability must not block deterministic scoring tests.

## Required Coverage

### Governance-Critical Logic

Tests must verify that:

- AI output cannot calculate, change, or override final scores or decision labels;
- unsupported AI claims cannot become source evidence;
- `Insufficient Evidence` takes precedence when required evidence gates fail;
- facts, AI analysis, deterministic results, and human annotations remain separate;
- source references and rule versions are preserved for audit.

### Scoring and Confidence

Tests must cover:

- each scoring input and boundary value;
- configured weights and permitted weight normalization;
- all three independent scores without a composite score;
- confidence calculation from source quality, coverage, freshness, and agreement;
- missing required inputs and less than 60% eligible evidence;
- stale evidence at, before, and after each freshness boundary;
- source tier weighting and mixed-tier evidence;
- contradictory evidence and unresolved conflicts;
- deterministic repeatability for the same evidence and rule version.

### Data and AI Processing

Tests must cover:

- exact, normalized, syndicated, and near-duplicate headline detection;
- unchanged content being served from cache rather than re-analyzed;
- AI JSON validation for valid, malformed, incomplete, extra-field, out-of-range, and unsupported-reference responses;
- collection failures, unavailable sources, and invalid provenance;
- delta processing that excludes unchanged historical evidence.

### Decisions and Overrides

Tests must cover:

- every decision-label threshold and exact boundary;
- precedence among `Insufficient Evidence`, `Exit Review`, `Reduce Review`, `Watch`, `Hold`, and `Strong Hold`;
- the rule that favorable sentiment cannot rescue materially adverse Business Thesis Health;
- manual overrides or disagreements as attributed, timestamped, reasoned audit records;
- preservation of the original deterministic score and label after a manual override;
- prevention of overrides from silently changing source evidence, score history, or rule output.

### UI Behavior

Tests must verify that the dashboard:

- displays three separate scores, confidence, freshness, and evidence;
- clearly distinguishes AI analysis from facts;
- exposes stale, missing, contradictory, and failed-source states;
- explains label changes and manual overrides;
- never presents `Exit Review` as a sell instruction;
- never presents `Insufficient Evidence` as neutral or current evidence.

## Test Design

- Unit tests cover formulas, gates, precedence, validation, and boundaries.
- Integration tests cover evidence ingestion through deterministic scoring and decision assignment.
- Contract tests validate collector fields and AI JSON schemas.
- End-to-end tests cover governance-critical dashboard paths.
- Regression tests accompany every corrected scoring, policy, freshness, or labeling defect.

Test fixtures must be synthetic or fixed snapshots with explicit dates and source tiers. Tests must not depend on live AI responses or changing external market data.

## Change Requirements

Any logic change requires tests demonstrating the previous and new behavior. Changes to weights, thresholds, freshness windows, source tiers, schemas, or override behavior must update affected fixtures and preserve historical rule-version expectations.
