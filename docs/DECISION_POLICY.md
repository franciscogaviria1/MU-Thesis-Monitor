# Decision Policy

## Purpose

Decision labels summarize the monitoring posture supported by current evidence. They are not predictions, trading signals, personalized advice, or instructions to transact.

Labels are assigned by deterministic rules using all three independent evaluations:

1. Business Thesis Health
2. Valuation Risk
3. Market Sentiment

The evaluations remain separate and must not be collapsed into one composite score. Business Thesis Health is the primary thesis signal; Valuation Risk and Market Sentiment modify the required level and urgency of review.

## Recommendation Categories

| Label | Meaning | Does not mean |
| --- | --- | --- |
| `Strong Hold` | The business thesis is strongly supported, evidence confidence is high, and neither valuation risk nor sentiment creates an immediate review trigger. | Guaranteed upside, low volatility, or an instruction to buy or retain shares. |
| `Hold` | The thesis remains supported, but evidence, valuation, or sentiment is less favorable than required for `Strong Hold`. | No action is ever needed or losses are unlikely. |
| `Watch` | Evidence is mixed, weakening, or approaching a review threshold. More data or closer monitoring is required. | A prediction of decline or an instruction to trade. |
| `Reduce Review` | Deterministic thresholds indicate that elevated valuation risk, weakening thesis health, or corroborated adverse evidence warrants a human review of exposure. | An instruction to reduce a position. |
| `Exit Review` | The business thesis may be materially impaired or invalidated and requires prompt human review against the documented invalidation evidence. | A sell instruction. `Exit Review` never authorizes an automatic transaction. |
| `Insufficient Evidence` | Current eligible evidence cannot support a reliable label. | Neutral conditions, safety, or permission to reuse a stale recommendation as current. |

## Deterministic Assignment

Version `1.0.0` enforces this precedence:

1. Assign `Insufficient Evidence` if any required score lacks sufficient evidence or required confidence.
2. Assign `Exit Review` when corroborated invalidation evidence exists or Business Thesis Health is materially adverse with adequate confidence.
3. Assign `Reduce Review` when the thesis is weakening, valuation risk is high, or adverse sentiment confirms a material deterioration requiring human attention.
4. Assign `Watch` when evidence is mixed, confidence is marginal, or any score approaches a higher-severity threshold.
5. Assign `Hold` when the thesis is supported and no review trigger applies.
6. Assign `Strong Hold` only when thesis health is strongly supportive, confidence is high, valuation risk is below its configured ceiling, and sentiment is not materially adverse.

A favorable Market Sentiment score cannot rescue a materially adverse Business Thesis Health score. Adverse sentiment alone should normally produce `Watch`, unless corroborated business or valuation evidence justifies a higher-severity review.

### Version 1.0.0 Thresholds

- `Insufficient Evidence`: Business Thesis Health is insufficient or below 45% confidence, or Valuation Risk is insufficient or below 35% confidence.
- `Exit Review`: Business Thesis Health is `0-29` with at least 65% confidence and at least two corroborating adverse items from Tier 1-3 sources.
- `Reduce Review`: Business Thesis Health is `0-44` with at least 55% confidence, or Valuation Risk is `71-100` with at least 55% confidence, with eligible non-Tier-4 adverse evidence.
- `Watch`: mixed score thresholds, marginal confidence, adverse sentiment, or a severe trigger supported only by Tier 4 or unknown evidence.
- `Hold`: Business Thesis Health is at least 56 with 60% confidence and Valuation Risk is no more than 55 with 50% confidence, provided sentiment does not trigger Watch.
- `Strong Hold`: Business Thesis Health is at least 71 with 75% confidence, Valuation Risk is no more than 44 with 60% confidence, Market Sentiment is at least 45 with 50% confidence, and there are no material missing or stale data warnings.

Decision confidence is calculated independently as 50% Business Thesis Health confidence, 30% Valuation Risk confidence, and 20% Market Sentiment confidence. `Insufficient Evidence` confidence is capped at 49% so the UI cannot imply that an evidence-gated result is fully supported.

## Required Recommendation Output

Every recommendation must include:

- the assigned label and calculation time;
- all three independent scores and their confidence levels;
- concise supporting evidence with source references and dates;
- material contradicting evidence;
- the deterministic rules that triggered the label;
- missing or stale evidence;
- a plain-language explanation clearly labeled as analysis.

OpenAI may draft the explanation and bull or bear cases from cited evidence. It must not calculate scores, choose the final label, or issue trading instructions.

## Review and History

Rule thresholds, precedence, and confidence gates are governance artifacts and must be versioned. Label changes must preserve the prior label, evidence set, rule version, and reason for change. Human reviewers may record a decision or disagreement, but must not silently alter the deterministic result.
