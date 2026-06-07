# Token Efficiency

## Principle

AI is used only when language interpretation adds value. Never call AI when a deterministic rule, calculation, lookup, parser, or comparison can answer the question.

Efficiency controls must not weaken citations, evidence coverage, contradiction handling, auditability, or safety.

## Processing Rules

- Process only new or changed data, not the full historical dataset.
- Identify content by stable source identifiers and content hashes.
- Avoid re-analyzing duplicate, syndicated, or unchanged headlines.
- Use deterministic code before AI for retrieval, validation, parsing, filtering, calculations, freshness checks, and exact duplicate detection.
- Send only task-relevant evidence and source metadata to AI, never the full database.
- Process deltas from the last successful run whenever possible.
- Batch related small items only when doing so preserves source attribution.

## Caching

Cache AI responses using:

- normalized input content or content hash;
- task and prompt version;
- model and output-schema version;
- applicable policy version.

Reuse a cached response only when all relevant keys match. Invalidate it when evidence, instructions, policy, model behavior requirements, or output structure changes. Cached analysis must retain its original generation time and source references.

## Structured Output

AI responses must use a task-specific JSON schema when consumed by the system. Required fields should include source references, classification or analysis, confidence or uncertainty, and validation status as applicable.

Invalid JSON, unknown fields, missing required fields, unsupported source references, and out-of-range values must be rejected or sent for review. Free-form prose must not enter deterministic scoring inputs directly.

## Usage and Cost Tracking

For every AI request, record:

- task type and model;
- input and output tokens;
- estimated API cost;
- cache hit or miss;
- source items processed;
- prompt and schema versions;
- request time, duration, and outcome.

Usage should be reviewed by task, source, and time period. Repeated requests, low-value tasks, abnormal token growth, and poor cache performance require investigation.

## Call Gate

Before an AI request, the system must confirm:

1. The task is allowed by `AI_USAGE_POLICY.md`.
2. Deterministic logic cannot fully answer it.
3. The evidence is new or materially changed.
4. No valid cached response exists.
5. Only relevant evidence is included.
6. The expected output has a validation schema.

If any condition fails, the AI request must not be made.

## Explanation Requests

- Generate dashboard explanations only after an explicit user action.
- Limit each request to the three score results, the decision result, warnings, and at most six prioritized evidence summaries.
- Reuse a component-state response while the request mode and deterministic dashboard snapshot are unchanged.
- Do not send source URLs, full raw records, unrelated evidence history, or the complete evidence store to the model.
