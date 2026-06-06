import type { MarketDataProviderResult } from "@/types/marketData";

export interface MarketDataProvider {
  readonly name: string;
  getMarketSnapshot(symbol: string): Promise<MarketDataProviderResult>;
}
