# Scoring Model

## Principles

The system maintains three independent scores. It must not combine them into a single investment score or convert them into a buy, hold, or sell recommendation.

Each score is calculated by deterministic rules from normalized, dated, and sourced evidence. OpenAI may classify or explain evidence, but it does not calculate final scores.

Scores use a `0-100` scale:

- `0-29`: materially adverse
- `30-44`: weakening or elevated risk
- `45-55`: neutral or mixed
- `56-70`: improving or moderate risk
- `71-100`: strongly supportive or high risk

For Business Thesis Health and Market Sentiment, a higher score is more positive. For Valuation Risk, a higher score means greater risk.

## 1. Business Thesis Health

Measures whether Micron's operating thesis is strengthening or weakening.

| Input | Weight |
| --- | ---: |
| DRAM pricing and inventory conditions | 25% |
| HBM demand, adoption, and execution | 25% |
| NAND pricing and inventory conditions | 15% |
| AI infrastructure and data-center memory demand | 20% |
| Industry supply growth and capital discipline | 15% |

Inputs should favor reported results, company guidance, customer or supplier evidence, and reputable industry pricing data. Each input is scored by explicit thresholds and freshness rules defined before implementation.

## 2. Valuation Risk

Measures the risk that market expectations or price already reflect more favorable outcomes than supported by evidence.

| Input | Weight |
| --- | ---: |
| Forward earnings and cash-flow valuation | 30% |
| Valuation relative to Micron's historical cycle | 20% |
| Valuation relative to relevant peers | 15% |
| Analyst estimate growth and revision direction | 20% |
| Gap between market expectations and operating evidence | 15% |

Valuation metrics must use consistent periods and clearly identify whether values are trailing, forward, normalized, or cycle-adjusted. Missing or negative denominators must not be silently converted into misleading multiples.

## 3. Market Sentiment

Measures the market's current stance toward Micron and its relevant industry, independently of business fundamentals and valuation.

| Input | Weight |
| --- | ---: |
| Micron-specific news sentiment | 30% |
| Analyst rating and estimate-revision sentiment | 25% |
| Semiconductor and memory-sector sentiment | 20% |
| Price trend relative to the market and sector | 15% |
| Event-driven attention and narrative concentration | 10% |

Headline volume alone is not positive or negative. Duplicate stories, stale reports, and unsupported commentary should be discounted.

## Weighting and Calculation

Each available input receives a deterministic subscore from `0-100`. A score is the weighted average of eligible inputs. Weights may be renormalized only when the minimum evidence requirements below are satisfied; otherwise the result is `Insufficient Evidence`.

Weight changes are governance changes. They must be documented, versioned, and applied prospectively so historical score changes remain explainable.

## Version 1 Rules

The first implementation uses a neutral `50` baseline and only moves a score when eligible evidence has an explicit deterministic direction or a documented numeric market threshold.

- Positive, neutral, and negative evidence map to `80`, `50`, and `20`.
- Business Thesis Health uses the documented category weights and renormalizes the available eligible categories.
- Valuation Risk uses explicit evidence direction plus drawdown bands: under 10% = 80 risk, 10-19.99% = 65, 20-34.99% = 45, and 35% or more = 30.
- Market Sentiment uses classified evidence direction and daily-price-change bands. Raw `not_analyzed` headlines with unknown impact do not move the score.
- Evidence marked `manual_review_required`, outside the freshness window, or with unknown impact is excluded from score movement.
- Freshness windows are 90 days for Business Thesis Health, 30 days for Valuation Risk, and 14 days for Market Sentiment.

These rules are intentionally conservative. Missing inputs retain the neutral baseline or the weighted result from available evidence and lower confidence instead of being converted into adverse evidence.

## Confidence Score

Each independent score has a separate confidence value from `0-100`. Confidence does not alter the score; it describes the reliability of the evidence behind it.

Confidence is calculated from:

| Factor | Weight |
| --- | ---: |
| Source quality | 35% |
| Evidence coverage | 25% |
| Freshness | 20% |
| Cross-source agreement | 20% |

The dashboard must display both score and confidence, along with the evidence date and the inputs responsible for material changes.

## Insufficient Evidence

A score is `Insufficient Evidence` when:

- less than 60% of its configured input weight has eligible evidence;
- a required core input has no current evidence;
- evidence is outside its defined freshness window;
- source provenance cannot be verified; or
- material contradictions cannot be resolved by deterministic rules.

The system must not replace missing evidence with neutral values, AI estimates, prior assumptions, or invented data. It should identify the missing inputs and preserve the last valid score as historical context, clearly labeled with its calculation date.
