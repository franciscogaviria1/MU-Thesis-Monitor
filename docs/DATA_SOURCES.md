# Data Sources

## Source Tiers

| Tier | Definition | Trust level | Intended use |
| --- | --- | --- | --- |
| Tier 1 | Official company, regulatory, exchange, and direct market data | Highest | Primary facts, reported results, pricing inputs, and score calculation |
| Tier 2 | Major financial journalism with editorial controls | High | Timely events, attributed reporting, and corroboration |
| Tier 3 | Industry commentary, research, and analysis | Medium | Context, forecasts, and hypotheses requiring corroboration |
| Tier 4 | Social media and community discussion | Low | Narrative discovery only; never a scoring fact without higher-tier confirmation |

Trust is assigned to an item, not only its publisher. An official filing remains Tier 1 when linked by journalism; an unattributed opinion remains commentary regardless of publication.

## Business Thesis Health

| Source | Tier | Update frequency | Intended use |
| --- | ---: | --- | --- |
| TrendForce | 1 for direct market datasets; 3 for commentary and forecasts | As published; check weekly | DRAM, NAND, HBM, supply, demand, inventory, and pricing trends |
| DRAMeXchange | 1 for direct pricing data; 3 for analysis | Daily or as published | DRAM and NAND spot or contract pricing evidence |
| Micron Investor Relations | 1 | On publication; check daily during event periods | Earnings releases, presentations, guidance, product announcements, and prepared remarks |
| SEC filings | 1 | On filing; check daily | Audited results, risk factors, capital spending, inventory, material events, and management disclosures |
| Earnings transcripts | 1 when company-issued; otherwise 2 or 3 | Each earnings event | Management commentary, guidance changes, demand signals, and contradictions with prior periods |

Pricing inputs must identify product, unit, geography, contract or spot basis, observation date, and usage rights. Forecasts must remain separate from observed market data.

## Valuation Risk

| Source | Tier | Update frequency | Intended use |
| --- | ---: | --- | --- |
| Analyst estimates | 1 when obtained as direct consensus market data; otherwise 3 | Daily or after estimate changes | Consensus levels, dispersion, revision direction, and expectation risk |
| Revenue estimates | Same tier as estimate provider | Daily and after earnings | Forward growth expectations and comparison with company guidance |
| EPS estimates | Same tier as estimate provider | Daily and after earnings | Forward earnings expectations and revision trends |
| Forward valuation metrics | 1 when calculated from verified market and estimate data | Daily market close | Forward multiples, historical comparisons, peer comparisons, and expectation gaps |

The selected estimate and market-data providers must be recorded before implementation. Forward metrics must retain price timestamp, fiscal period, estimate basis, currency, and calculation method. Provider-displayed metrics must not be mixed with internally calculated metrics without labeling the difference.

## Market Sentiment

| Source | Tier | Update frequency | Intended use |
| --- | ---: | --- | --- |
| Reuters | 2 | Intraday | Attributed company, industry, policy, and market reporting |
| Bloomberg | 2 | Intraday | Market-moving reporting, analyst changes, industry context, and market reaction |
| Wall Street Journal | 2 | Daily or as published | Business reporting and broader technology or semiconductor context |
| Barron's | 2 for reported facts; 3 for opinion | Daily or as published | Investor narrative, analyst commentary, and valuation discussion |
| MarketWatch | 2 for reported facts; 3 for commentary | Intraday | Market reaction, company coverage, and narrative monitoring |

Journalism may support sentiment and explain events, but it does not override Tier 1 facts. Syndicated articles and repeated coverage of the same event count as one evidence cluster.

## Collection Requirements

Every item must retain source, tier, title, author when available, original identifier or URL, publication time, retrieval time, reporting period, and access status. The system must:

- preserve raw evidence and distinguish facts from forecasts or opinions;
- enforce source-specific freshness windows;
- detect duplicates and syndicated copies;
- disclose paywalls, missing fields, and collection failures;
- downgrade confidence when evidence is stale, contradictory, or weakly sourced;
- return `Insufficient Evidence` rather than substitute unsupported data.
