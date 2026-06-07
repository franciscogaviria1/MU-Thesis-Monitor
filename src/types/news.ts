export type NewsSourceTier =
  | "tier_1"
  | "tier_2"
  | "tier_3"
  | "tier_4"
  | "unknown";

export type NewsRelatedArea =
  | "business_thesis_health"
  | "valuation_risk"
  | "market_sentiment";

export type NewsItem = {
  id: string;
  title: string;
  sourceName: string;
  sourceTier: NewsSourceTier;
  publishedAt: string;
  url: string;
  summarySnippet?: string;
  relatedAreas: NewsRelatedArea[];
  rawProvider: string;
  analysisStatus: "not_analyzed";
};

export type NewsProviderFailureCode =
  | "rate_limited"
  | "unavailable"
  | "invalid_response";

export type NewsProviderResult =
  | {
      ok: true;
      items: NewsItem[];
      retrievedAt: string;
    }
  | {
      ok: false;
      code: NewsProviderFailureCode;
      message: string;
    };

export type NewsFeedStatus = "fresh" | "stale" | "unavailable";

export interface NewsFeedSnapshot {
  items: NewsItem[];
  providerName: string;
  status: NewsFeedStatus;
  message: string;
  lastUpdated: string | null;
}
