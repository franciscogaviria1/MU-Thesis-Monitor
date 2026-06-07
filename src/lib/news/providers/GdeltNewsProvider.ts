import { createHash } from "node:crypto";
import type { NewsProvider } from "@/lib/news/NewsProvider";
import type {
  NewsItem,
  NewsProviderResult,
  NewsSourceTier,
} from "@/types/news";

const GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc";
const CACHE_SECONDS = 15 * 60;
const MAX_RECORDS = 12;

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

const SOURCE_METADATA: Record<
  string,
  { sourceName: string; sourceTier: NewsSourceTier }
> = {
  "barrons.com": { sourceName: "Barron's", sourceTier: "tier_2" },
  "bloomberg.com": { sourceName: "Bloomberg", sourceTier: "tier_2" },
  "investors.micron.com": {
    sourceName: "Micron Investor Relations",
    sourceTier: "tier_1",
  },
  "marketwatch.com": { sourceName: "MarketWatch", sourceTier: "tier_2" },
  "reuters.com": { sourceName: "Reuters", sourceTier: "tier_2" },
  "sec.gov": { sourceName: "SEC", sourceTier: "tier_1" },
  "wsj.com": { sourceName: "Wall Street Journal", sourceTier: "tier_2" },
};

export class GdeltNewsProvider implements NewsProvider {
  readonly name = "GDELT DOC 2.0";

  async getNews(query: string): Promise<NewsProviderResult> {
    try {
      const parameters = new URLSearchParams({
        query: `"${query}" sourcelang:eng`,
        mode: "artlist",
        maxrecords: String(MAX_RECORDS),
        timespan: "7d",
        sort: "datedesc",
        format: "json",
      });

      const response = await fetch(`${GDELT_DOC_URL}?${parameters}`, {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: CACHE_SECONDS,
        },
        signal: AbortSignal.timeout(8_000),
      });

      if (response.status === 429) {
        return {
          ok: false,
          code: "rate_limited",
          message: "News is temporarily unavailable because the provider rate limit was reached.",
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          code: "unavailable",
          message: "News is temporarily unavailable from GDELT.",
        };
      }

      const responseBody = await response.text();

      if (isRateLimitMessage(responseBody)) {
        return {
          ok: false,
          code: "rate_limited",
          message: "News is temporarily unavailable because the provider rate limit was reached.",
        };
      }

      const payload = parseJson(responseBody);

      if (!payload) {
        return {
          ok: false,
          code: "invalid_response",
          message: "News is unavailable because the provider response could not be validated.",
        };
      }

      const items = (payload.articles ?? [])
        .map((article) => normalizeArticle(article, this.name))
        .filter((item): item is NewsItem => item !== null);

      if (items.length === 0) {
        return {
          ok: false,
          code: "unavailable",
          message: "No current MU headlines were available from GDELT.",
        };
      }

      return {
        ok: true,
        items,
        retrievedAt: new Date().toISOString(),
      };
    } catch {
      return {
        ok: false,
        code: "unavailable",
        message: "News is temporarily unavailable from GDELT.",
      };
    }
  }
}

function normalizeArticle(
  article: GdeltArticle,
  providerName: string,
): NewsItem | null {
  const title = article.title?.trim();
  const url = normalizeUrl(article.url);
  const publishedAt = parseGdeltDate(article.seendate);

  if (!title || !url || !publishedAt) {
    return null;
  }

  const hostname = getHostname(url);
  const source = getSourceMetadata(hostname || article.domain || "");

  return {
    id: createHash("sha256").update(url).digest("hex").slice(0, 20),
    title,
    sourceName: source.sourceName,
    sourceTier: source.sourceTier,
    publishedAt,
    url,
    relatedAreas: ["market_sentiment"],
    rawProvider: providerName,
    analysisStatus: "not_analyzed",
  };
}

function getSourceMetadata(domain: string) {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");

  for (const [knownDomain, metadata] of Object.entries(SOURCE_METADATA)) {
    if (
      normalizedDomain === knownDomain ||
      normalizedDomain.endsWith(`.${knownDomain}`)
    ) {
      return metadata;
    }
  }

  return {
    sourceName: normalizedDomain || "Unknown source",
    sourceTier: "unknown" as const,
  };
}

function normalizeUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getHostname(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

function parseGdeltDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const compactDate = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/,
  );

  if (compactDate) {
    const [, year, month, day, hour, minute, second] = compactDate;
    return new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
    ).toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseJson(value: string): GdeltResponse | null {
  try {
    const parsed = JSON.parse(value) as GdeltResponse;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function isRateLimitMessage(value: string) {
  const normalizedValue = value.toLowerCase();
  return (
    normalizedValue.includes("limit requests") ||
    normalizedValue.includes("rate limit")
  );
}
