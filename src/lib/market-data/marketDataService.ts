import { AlphaVantageMarketDataProvider } from "@/lib/market-data/AlphaVantageMarketDataProvider";
import type { MarketDataProvider } from "@/lib/market-data/MarketDataProvider";
import type { MarketDataSnapshot } from "@/types/marketData";

const DEFAULT_SYMBOL = "MU";
const DEFAULT_CURRENCY = "USD";
const PROVIDER_NAME = "Alpha Vantage";

let lastSuccessfulSnapshot: MarketDataSnapshot | null = null;

export async function getMuMarketData(): Promise<MarketDataSnapshot> {
  const provider = createMarketDataProvider();

  if (!provider) {
    return createFallbackSnapshot(
      "Market data is unavailable because ALPHA_VANTAGE_API_KEY is not configured.",
    );
  }

  const result = await provider.getMarketSnapshot(DEFAULT_SYMBOL);

  if (!result.ok) {
    return createFallbackSnapshot(result.message);
  }

  lastSuccessfulSnapshot = result.snapshot;
  return result.snapshot;
}

function createMarketDataProvider(): MarketDataProvider | null {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return new AlphaVantageMarketDataProvider(apiKey);
}

function createFallbackSnapshot(message: string): MarketDataSnapshot {
  if (lastSuccessfulSnapshot) {
    return {
      ...lastSuccessfulSnapshot,
      status: "stale",
      message: `${message} Showing the last successful market snapshot.`,
    };
  }

  return {
    symbol: DEFAULT_SYMBOL,
    currency: DEFAULT_CURRENCY,
    currentPrice: null,
    dailyChangePercent: null,
    fiftyTwoWeekHigh: null,
    drawdownFromHighPercent: null,
    asOf: null,
    lastUpdated: null,
    providerName: PROVIDER_NAME,
    status: "unavailable",
    message,
  };
}
