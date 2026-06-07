import type {
  EvidenceConfidence,
  EvidenceItem,
  EvidenceSourceTier,
} from "@/types/evidence";
import type { MarketDataSnapshot } from "@/types/marketData";
import type { NewsFeedSnapshot, NewsItem } from "@/types/news";

const MARKET_SOURCE_URL = "https://www.alphavantage.co/";

interface BuildEvidenceInput {
  marketData: MarketDataSnapshot;
  news: NewsFeedSnapshot;
  existingEvidence?: EvidenceItem[];
}

export function buildEvidenceItems({
  marketData,
  news,
  existingEvidence = [],
}: BuildEvidenceInput): EvidenceItem[] {
  const items = [
    ...existingEvidence,
    ...safelyCreate(() => createMarketEvidence(marketData)),
    ...safelyCreate(() => createNewsEvidence(news)),
  ];

  return items.sort(
    (left, right) =>
      Date.parse(right.observedAt) - Date.parse(left.observedAt),
  );
}

function createNewsEvidence(snapshot: NewsFeedSnapshot): EvidenceItem[] {
  const createdAt = snapshot.lastUpdated ?? new Date().toISOString();

  return snapshot.items.map((item) => ({
    id: `news:${item.id}`,
    title: item.title,
    description:
      item.summarySnippet ??
      "Headline collected for review. No classification or interpretation has been applied.",
    sourceName: item.sourceName,
    sourceTier: item.sourceTier,
    sourceUrl: item.url,
    observedAt: item.publishedAt,
    createdAt,
    evidenceType: "news",
    impactDirection: "unknown",
    affectedArea: primaryArea(item),
    confidence: confidenceForTier(item.sourceTier),
    analysisStatus: "not_analyzed",
  }));
}

function createMarketEvidence(snapshot: MarketDataSnapshot): EvidenceItem[] {
  const createdAt = new Date().toISOString();
  const observedAt = snapshot.asOf ?? snapshot.lastUpdated ?? createdAt;
  const sourceUrl = MARKET_SOURCE_URL;

  if (snapshot.status === "unavailable") {
    return [
      {
        id: `market:${snapshot.symbol}:unavailable`,
        title: `${snapshot.symbol} market data unavailable`,
        description: snapshot.message,
        sourceName: snapshot.providerName,
        sourceTier: "tier_1",
        sourceUrl,
        observedAt,
        createdAt,
        evidenceType: "market_data",
        impactDirection: "unknown",
        affectedArea: "valuation_risk",
        confidence: "unknown",
        analysisStatus: "manual_review_required",
      },
    ];
  }

  const evidence: EvidenceItem[] = [];
  const confidence = snapshot.status === "fresh" ? "high" : "low";
  const analysisStatus =
    snapshot.status === "fresh" ? "not_analyzed" : "manual_review_required";

  if (
    snapshot.currentPrice !== null &&
    snapshot.dailyChangePercent !== null
  ) {
    evidence.push({
      id: `market:${snapshot.symbol}:price`,
      title: `${snapshot.symbol} price available`,
      description: `${formatCurrency(snapshot.currentPrice, snapshot.currency)} with a daily change of ${formatPercent(snapshot.dailyChangePercent)}.`,
      sourceName: snapshot.providerName,
      sourceTier: "tier_1",
      sourceUrl,
      observedAt,
      createdAt,
      evidenceType: "market_data",
      impactDirection: "unknown",
      affectedArea: "valuation_risk",
      confidence,
      analysisStatus,
    });
  }

  if (
    snapshot.fiftyTwoWeekHigh !== null &&
    snapshot.drawdownFromHighPercent !== null
  ) {
    evidence.push({
      id: `market:${snapshot.symbol}:drawdown`,
      title: `${snapshot.symbol} drawdown from 52-week high`,
      description: `${formatPercent(snapshot.drawdownFromHighPercent)} from a 52-week high of ${formatCurrency(snapshot.fiftyTwoWeekHigh, snapshot.currency)}.`,
      sourceName: snapshot.providerName,
      sourceTier: "tier_1",
      sourceUrl,
      observedAt,
      createdAt,
      evidenceType: "market_data",
      impactDirection: "unknown",
      affectedArea: "valuation_risk",
      confidence,
      analysisStatus,
    });
  }

  if (snapshot.status === "stale" || evidence.length === 0) {
    evidence.push({
      id: `market:${snapshot.symbol}:${snapshot.status}`,
      title:
        snapshot.status === "stale"
          ? `${snapshot.symbol} market data is stale`
          : `${snapshot.symbol} market data is incomplete`,
      description: snapshot.message,
      sourceName: snapshot.providerName,
      sourceTier: "tier_1",
      sourceUrl,
      observedAt,
      createdAt,
      evidenceType: "market_data",
      impactDirection: "unknown",
      affectedArea: "valuation_risk",
      confidence: snapshot.status === "stale" ? "low" : "unknown",
      analysisStatus: "manual_review_required",
    });
  }

  return evidence;
}

function safelyCreate(factory: () => EvidenceItem[]): EvidenceItem[] {
  try {
    return factory();
  } catch {
    return [];
  }
}

function primaryArea(item: NewsItem) {
  return item.relatedAreas[0] ?? "market_sentiment";
}

function confidenceForTier(tier: EvidenceSourceTier): EvidenceConfidence {
  switch (tier) {
    case "tier_1":
      return "high";
    case "tier_2":
      return "medium";
    case "tier_3":
      return "low";
    case "tier_4":
    case "unknown":
      return "unknown";
  }
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}
