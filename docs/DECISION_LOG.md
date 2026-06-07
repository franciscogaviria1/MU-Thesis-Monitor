# Decision Log

## 2026-06-07: Deterministic Earnings Mode v1

- **Decision:** Add a pre- and post-earnings workflow using a manually configured earnings date and structured user input.
- **Evidence conversion:** Saved earnings records create separate normalized evidence for business thesis commentary, expectation risk, and reported results versus provided expectations.
- **Missing expectations:** Revenue or EPS comparisons are omitted when expectations are absent or unparseable; the evidence requires manual review instead of inferring a beat or miss.
- **Persistence:** Earnings records and their captured pre-earnings deterministic scores and decision are stored in local SQLite.
- **Safety boundary:** Review outcomes are limited to thesis strengthened, thesis weakened, mixed evidence, or insufficient evidence. No trading instruction is generated.
- **Author:** Codex

## 2026-06-07: Deterministic Trend Analysis v1

- **Decision:** Compare persisted daily snapshots across selectable 7-, 14-, and 30-day windows without recalculating historical scores or labels.
- **Direction rules:** Rising Business Thesis Health and Market Sentiment are favorable; rising Valuation Risk is unfavorable; decision labels use an explicit monitoring-posture rank.
- **Confidence:** Trend confidence is separate from trend direction and reflects endpoint confidence, snapshot coverage, and mixed-signal penalties.
- **Insufficient history:** Fewer than two distinct daily snapshots returns `insufficient_data`; missing dates are not interpolated and no trend is inferred.
- **Safety boundary:** Trend analysis is descriptive, deterministic, and read-only. It cannot change scores, confidence values, decision labels, or evidence.
- **Author:** Codex

## 2026-06-07: Local SQLite Persistence v1

- **Decision:** Use Node's built-in SQLite support as the primary local persistence provider behind a replaceable interface and server actions.
- **Data retained:** Manual memory entries, normalized evidence snapshots, three deterministic score snapshots, deterministic decision snapshots, audit summaries, and one updateable daily history record.
- **Migration:** Existing localStorage manual entries are validated, merged by ID, and imported without deleting or rewriting the user's localStorage data.
- **Failure behavior:** SQLite failure leaves the current session operational and retains localStorage as a manual-entry fallback when browser storage is available.
- **Safety boundary:** Persistence stores engine outputs but cannot calculate or alter scores, confidence, or decision labels.
- **Author:** Codex

## 2026-06-07: Reliability and Audit Review v1

- **Decision:** Add read-only system-health and audit summaries derived from provider snapshots, normalized evidence, deterministic score metadata, and decision warnings.
- **Evidence trace:** The audit lists evidence that affected scores by score-reference ID and explains exclusions using current analysis-status, direction, freshness, and category rules.
- **Operational trace:** Market, news, manual-memory, and AI availability are shown independently with last-successful-update and missing/stale warnings.
- **Authority boundary:** Audit metadata cannot alter scores or labels; the UI states that AI is optional and the deterministic decision remains authoritative.
- **Failure behavior:** Unavailable providers, browser storage, or AI credentials remain visible as status warnings without preventing dashboard rendering.
- **Author:** Codex

## 2026-06-07: Optional OpenAI Explanation Layer v1

- **Decision:** Add a server-only, user-initiated explanation layer for the existing deterministic scores and decision label.
- **Boundary:** The model receives a bounded snapshot and returns validated JSON containing narrative analysis only; the output contract has no score or decision-label fields.
- **Token controls:** Requests include at most six prioritized evidence summaries, run only on button click, disable provider storage, and are cached in component state for an unchanged snapshot.
- **Failure behavior:** Missing credentials, provider errors, and invalid output show an unavailable state while deterministic scores and the review label remain visible and unchanged.
- **Safety boundary:** AI output is explicitly not used to calculate scores, cannot issue trading instructions, and is labeled not financial advice.
- **Author:** Codex

## 2026-06-07: Deterministic Decision Engine v1

- **Decision:** Assign one review label from the three independent score results, confidence gates, evidence quality, and missing or stale data warnings.
- **Precedence:** Insufficient critical evidence, materially adverse Business Thesis Health, Reduce Review triggers, Watch triggers, Hold, then Strong Hold.
- **Safety rules:** Market Sentiment alone cannot produce Exit Review; Tier 4 or unknown evidence alone cannot produce Reduce Review or Exit Review; missing critical data prevents Strong Hold.
- **Confidence:** Decision confidence is 50% Business Thesis Health confidence, 30% Valuation Risk confidence, and 20% Market Sentiment confidence.
- **Safety boundary:** Labels are monitoring postures only. Exit Review is not a sell instruction and no label authorizes a transaction.
- **Author:** Codex

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
