export type MarketDataStatus = "fresh" | "stale" | "unavailable";

export interface MarketDataSnapshot {
  symbol: string;
  currency: string;
  currentPrice: number | null;
  dailyChangePercent: number | null;
  fiftyTwoWeekHigh: number | null;
  drawdownFromHighPercent: number | null;
  asOf: string | null;
  lastUpdated: string | null;
  providerName: string;
  status: MarketDataStatus;
  message: string;
}

export type MarketDataFailureCode =
  | "invalid-api-key"
  | "rate-limited"
  | "unavailable"
  | "invalid-response";

export type MarketDataProviderResult =
  | {
      ok: true;
      snapshot: MarketDataSnapshot;
    }
  | {
      ok: false;
      code: MarketDataFailureCode;
      message: string;
    };
