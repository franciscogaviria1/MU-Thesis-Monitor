# MU Thesis Monitor

MU Thesis Monitor is a local-first decision-support dashboard for evaluating
whether the Micron Technology investment thesis is strengthening or weakening.
It emphasizes traceable evidence, deterministic scoring, explicit confidence,
and review labels that are not trading instructions.

It is not a stock predictor, trading bot, automated adviser, or buy/sell signal
generator.

## Current Capabilities

- Live MU market data through an optional Alpha Vantage key
- Keyless MU news ingestion through GDELT
- Manual DRAM, NAND, and HBM evidence entry
- Normalized evidence with source, freshness, confidence, and audit metadata
- Three independent deterministic scores and a deterministic review label
- Local SQLite snapshots, decision history, trend analysis, and earnings review
- Optional server-only OpenAI explanations that cannot alter scores or labels

## Local Setup

Requirements:

- Node.js 22.5 or newer with built-in `node:sqlite` support
- npm

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All environment variables
are optional; the dashboard remains usable when a provider is unavailable.

| Variable | Required | Purpose |
| --- | --- | --- |
| `ALPHA_VANTAGE_API_KEY` | No | Live MU price, daily change, 52-week high, and drawdown |
| `OPENAI_API_KEY` | No | User-initiated explanation and thesis-challenge requests |
| `OPENAI_EXPLANATION_MODEL` | No | Explanation model; defaults to `gpt-5-mini` |
| `MU_PERSISTENCE_PATH` | No | SQLite path; defaults to `data/mu-thesis-monitor.sqlite` |

Never prefix provider secrets with `NEXT_PUBLIC_`. Keys are read only by server
modules and are not sent to browser components.

## Persistence

SQLite is the primary local persistence layer. Database files under `data/` are
ignored by Git. Existing manual entries in browser `localStorage` are validated,
merged by ID, and imported without deleting the original browser data.

If SQLite cannot be created or reached, the dashboard continues in the current
session and manual memory entries use localStorage when available.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Use [docs/SMOKE_TEST_CHECKLIST.md](docs/SMOKE_TEST_CHECKLIST.md) for the daily
failure-state and persistence checks.

## Governance

The deterministic rules engine is authoritative for scores and review labels.
AI is optional and explanation-only. See:

- [Project Charter](docs/PROJECT_CHARTER.md)
- [Governance](docs/GOVERNANCE.md)
- [Scoring Model](docs/SCORING_MODEL.md)
- [Decision Policy](docs/DECISION_POLICY.md)
- [AI Usage Policy](docs/AI_USAGE_POLICY.md)
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
