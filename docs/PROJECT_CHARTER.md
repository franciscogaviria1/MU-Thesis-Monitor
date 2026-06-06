# Project Charter

## Mission

Build a local-first decision-support dashboard that monitors whether the Micron Technology (`MU`) investment thesis is strengthening, weakening, or lacks sufficient evidence.

The system organizes current, sourced evidence into explainable scores and review labels. It supports human judgment; it does not replace it.

## Evaluation Model

The system maintains three independent evaluations:

### Business Thesis Health

Measures operating-thesis strength using DRAM and NAND pricing, HBM demand and execution, AI infrastructure demand, inventory, and industry supply discipline.

### Valuation Risk

Measures whether market price and expectations imply outcomes that are more favorable than current business evidence supports.

### Market Sentiment

Measures Micron-specific, analyst, and semiconductor-sector sentiment independently from fundamentals and valuation.

These evaluations must remain separate. The project must not create a single composite investment score.

## Intended Outputs

The dashboard should provide:

- three deterministic scores with confidence and freshness;
- supporting, contradicting, missing, and stale evidence;
- traceable explanations of material score changes;
- deterministic review labels defined by the decision policy;
- AI summaries clearly identified as analysis.

`Insufficient Evidence` is a valid and required outcome when evidence gates are not met.

## Non-Goals

This project is not:

- a stock-price prediction system;
- a trading bot or automated portfolio manager;
- a personalized investment adviser;
- a source of buy, sell, or trading instructions;
- an AI-generated market-data service;
- a system in which AI calculates or overrides final scores or labels.

Labels such as `Reduce Review` and `Exit Review` request human review. They do not authorize a transaction.

## Operating Principles

- Evidence over opinion.
- Explainability over prediction.
- Deterministic rules over AI judgment.
- Reliability and auditability over complexity.
- Source traceability and freshness for every material conclusion.
- Facts, deterministic results, AI analysis, and human annotations remain distinct.
- AI and human conclusions may be wrong and must remain reviewable.
- Token-efficient, incremental processing is preferred over repeated full analysis.

## Success Criteria

The project succeeds when a user can understand:

1. What changed in the MU thesis.
2. Which evidence caused the change.
3. How current and trustworthy that evidence is.
4. Which deterministic rules produced each score and review label.
5. What remains uncertain or unsupported.
