# Technical Architecture

## System Flow

```text
Data Sources
    -> Data Collection
    -> Database
    -> Deterministic Rules Engine
    -> OpenAI Analysis Layer
    -> Dashboard
```

The system is local-first and evidence-driven. Every displayed fact, score, and AI explanation must be traceable to stored source evidence and a documented processing step.

## Data Sources

Expected source categories include:

- Micron filings, earnings materials, guidance, and investor communications
- regulatory filings and official company disclosures
- DRAM, NAND, and HBM pricing or market data
- semiconductor supply, capital-spending, and inventory data
- analyst estimates and revisions
- reputable business and industry news
- market price and sector benchmark data

Each source must retain its publisher, original URL or identifier, publication time, retrieval time, and applicable reporting period.

## Data Collection

Collectors retrieve data on source-appropriate schedules, preserve raw evidence, normalize dates and units, and detect duplicates. Collection failures must be visible and must not silently reuse stale data as current.

AI output is not a source. Any classification or summary must reference the underlying collected evidence.

## Database

The database stores raw evidence, normalized observations, source provenance, collection status, scoring inputs, rule versions, score history, confidence values, and AI-generated analysis. Facts and AI interpretations remain separate.

This document defines responsibilities only; it does not prescribe a database schema.

## Deterministic Rules Engine

The rules engine:

- validates evidence eligibility and freshness;
- maps normalized inputs to documented subscores;
- applies configured weights;
- calculates the three independent scores and confidence values;
- returns `Insufficient Evidence` when evidence gates are not met;
- records rule versions and the inputs behind each result.

The rules engine is the sole authority for final scores. The same evidence and rule version must produce the same result.

## OpenAI Analysis Layer

OpenAI may:

- classify headlines using defined labels;
- summarize sourced evidence;
- detect contradictions between sources or time periods;
- generate a sourced bear case and identify thesis risks;
- explain deterministic score changes in plain language.

OpenAI must not:

- invent facts, figures, events, quotations, or sources;
- treat its own output as evidence;
- calculate, adjust, or override final scores;
- fill missing evidence with estimates;
- issue trading recommendations or buy, hold, or sell instructions.

All OpenAI output must include references to the evidence it used. Unsupported output must be rejected, flagged, or omitted rather than displayed as fact.

## Dashboard

The dashboard presents:

- Business Thesis Health, Valuation Risk, and Market Sentiment separately;
- confidence and freshness for each score;
- supporting and contradicting evidence;
- material score changes and their deterministic causes;
- unresolved evidence gaps and collection failures;
- AI summaries clearly labeled as analysis.

The dashboard supports human judgment. It is not a prediction tool, trading bot, or automated investment adviser.

## Operational Boundaries

- Scoring rules, weights, and evidence thresholds are versioned governance artifacts.
- Source failures and stale evidence reduce confidence or produce `Insufficient Evidence`.
- Raw evidence is retained so conclusions can be audited.
- AI analysis may fail independently without preventing deterministic scoring.
- A data correction triggers recalculation under the applicable rule version and remains visible in history.
