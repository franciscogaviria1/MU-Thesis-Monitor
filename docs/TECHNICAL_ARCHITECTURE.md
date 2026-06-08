# Technical Architecture

## System Flow

```text
Market and news providers -----> normalized evidence -----> deterministic scores
Manual and earnings input -----/                           -> deterministic decision
                                                               |
                                                               v
Local SQLite <---- server actions <---- dashboard + audit + trends
                                                               |
                                      optional, user-initiated OpenAI explanation
```

The Next.js App Router application is local-first and evidence-driven. Provider
access, SQLite, and OpenAI remain server-side. Browser components receive only
normalized data, status messages, and deterministic results.

## Data Sources and Collection

Current collection is request-driven:

- Alpha Vantage provides optional MU market data.
- GDELT provides keyless MU news.
- Manual forms capture memory-pricing, HBM, and earnings observations.
- Reference fixtures remain clearly labeled where live sources do not exist.

Provider interfaces keep sources replaceable. Collectors normalize dates and
units, detect duplicates where applicable, and return structured `available`,
`stale`, or `unavailable` states. Expected failures must not throw into page
rendering or produce disruptive development overlays.

AI output is not a source. Any explanation must reference the normalized
evidence supplied to it.

## Evidence and Persistence

All provider and manual records are converted to the shared `EvidenceItem`
contract before scoring or display.

Node's built-in SQLite support stores:

- manual memory entries and earnings records;
- daily normalized evidence snapshots;
- three independent score snapshots;
- deterministic decision snapshots;
- audit summaries and decision history.

The default database is `data/mu-thesis-monitor.sqlite`; it may be overridden
with `MU_PERSISTENCE_PATH`. Database files are ignored by Git.

Server actions are the only browser-to-SQLite boundary. Browser localStorage is
retained as non-destructive migration support and a manual-entry fallback.
Persistence failure must not prevent scoring or dashboard rendering.

## Deterministic Engines

The scoring engine independently calculates Business Thesis Health, Valuation
Risk, and Market Sentiment, each with confidence, reasons, and evidence
references. The decision engine applies documented confidence and safeguard
rules to produce a review label.

These engines are the sole authority for scores and labels. Equivalent evidence
and rule versions must produce equivalent results. AI, UI forms, persistence,
trends, and audit metadata cannot override them.

## OpenAI Explanation Layer

The explanation service is called only through a server action after a user
click. It sends a bounded set of deterministic results and selected evidence
summaries, requests structured JSON, and validates the response before display.

OpenAI may summarize evidence, identify contradictions, and generate bounded
bull and bear cases. It must not invent facts or sources, calculate or modify
scores, alter the decision label, fill missing evidence, or issue trading
instructions.

`OPENAI_API_KEY` never enters client props, browser logs, or a `NEXT_PUBLIC_`
variable. Missing credentials, provider failure, or invalid output leaves the
deterministic dashboard fully available.

## Dashboard and Operations

The dashboard presents the independent scores, review label, evidence register,
system health, audit summary, decision history, trends, and earnings workflow.
It exposes stale, missing, and unavailable states rather than silently treating
old data as current.

Current operational boundaries:

- no cloud database, authentication, deployment, or background ingestion job;
- no paid data scraping;
- no automatic trading instruction;
- no provider or persistence exception may enter the expected render path;
- data corrections remain visible through updated snapshots and history.
