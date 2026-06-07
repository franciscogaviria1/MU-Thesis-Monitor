# Decision Log

## 2026-06-06: Initial News Ingestion Provider

- **Decision:** Use the public GDELT DOC 2.0 API as the first replaceable provider for recent English-language Micron Technology headlines.
- **Rationale:** GDELT is free, keyless, JSON-based, and suitable for a local ingestion foundation without paid scraping or database persistence.
- **Alternatives considered:** Paid financial-news APIs, publisher scraping, and AI-assisted discovery were deferred because they add cost, access restrictions, or prohibited analysis.
- **Affected components:** News provider contract, GDELT adapter, normalization and deduplication service, and read-only dashboard headline feed.
- **Expected impact:** The dashboard can display attributable headline records before classification or sentiment analysis exists.
- **Safety boundary:** Headlines remain `not_analyzed`, default only to the broad Market Sentiment area, and do not affect scores or recommendations.
- **Migration needs:** A later provider may replace GDELT without changing the normalized `NewsItem` contract.
- **Author:** Codex
