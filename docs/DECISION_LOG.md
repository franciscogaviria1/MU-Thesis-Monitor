# Decision Log

## 2026-06-07: Deterministic Scoring Engine v1

- **Decision:** Calculate Business Thesis Health, Valuation Risk, and Market Sentiment independently from normalized evidence using versioned, deterministic rules.
- **Rationale:** The first scoring layer must be transparent, repeatable, and operational before AI classification or recommendation generation exists.
- **Rules:** Explicit evidence direction and deterministic market thresholds may move scores; unknown, unavailable, stale, or manual-review-required evidence cannot. Missing inputs reduce confidence and coverage without being treated as negative evidence.
- **Confidence:** Each score reports separate confidence derived from coverage, source quality, freshness, and directional agreement.
- **Safety boundary:** The engine produces no composite score, does not call AI, and does not change the existing recommendation label.
- **Author:** Codex

## 2026-06-07: Local Manual Memory Data

- **Decision:** Store structured memory-pricing and HBM observations in browser `localStorage` and convert them into normalized evidence at the client boundary.
- **Rationale:** Manual entry provides traceable thesis inputs before paid-data automation exists without introducing a database or ingestion dependency.
- **Affected components:** Manual memory data contract, validation and storage service, dashboard entry form, recent-entry register, and evidence projection.
- **Safety boundary:** Manual entries remain `not_analyzed`, carry `unknown` impact, affect only Business Thesis Health evidence, and cannot change scores or recommendation labels.
- **Failure behavior:** Invalid submissions remain unsaved with field errors; unavailable or malformed local storage does not prevent the dashboard from loading.
- **Author:** Codex

## 2026-06-07: Unified Evidence Model

- **Decision:** Normalize market data, news, and manual prototype records into one `EvidenceItem` contract before presentation.
- **Rationale:** A shared evidence shape preserves source traceability and makes provider failures visible without coupling ingestion to scoring or AI interpretation.
- **Affected components:** Evidence types, deterministic provider-to-evidence conversion, mock evidence records, and the dashboard evidence register.
- **Safety boundary:** Conversion assigns no AI classification, leaves raw news impact unassessed, and cannot modify scores or recommendation labels.
- **Failure behavior:** Failed conversions are omitted without breaking the dashboard; unavailable or stale market state is retained as review-required evidence when a snapshot exists.
- **Author:** Codex

## 2026-06-06: Initial News Ingestion Provider

- **Decision:** Use the public GDELT DOC 2.0 API as the first replaceable provider for recent English-language Micron Technology headlines.
- **Rationale:** GDELT is free, keyless, JSON-based, and suitable for a local ingestion foundation without paid scraping or database persistence.
- **Alternatives considered:** Paid financial-news APIs, publisher scraping, and AI-assisted discovery were deferred because they add cost, access restrictions, or prohibited analysis.
- **Affected components:** News provider contract, GDELT adapter, normalization and deduplication service, and read-only dashboard headline feed.
- **Expected impact:** The dashboard can display attributable headline records before classification or sentiment analysis exists.
- **Safety boundary:** Headlines remain `not_analyzed`, default only to the broad Market Sentiment area, and do not affect scores or recommendations.
- **Migration needs:** A later provider may replace GDELT without changing the normalized `NewsItem` contract.
- **Author:** Codex
