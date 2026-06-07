import type {
  EvidenceAffectedArea,
  EvidenceSourceTier,
} from "@/types/evidence";

export type NewsSourceTier = EvidenceSourceTier;

export type NewsRelatedArea = EvidenceAffectedArea;

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
