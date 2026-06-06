import type { MarketDataProvider } from "@/lib/market-data/MarketDataProvider";
import type {
  MarketDataFailureCode,
  MarketDataProviderResult,
} from "@/types/marketData";

const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";
const CACHE_SECONDS = 15 * 60;

interface AlphaVantageQuoteResponse {
  "Global Quote"?: {
    "01. symbol"?: string;
    "05. price"?: string;
    "07. latest trading day"?: string;
    "10. change percent"?: string;
  };
  Information?: string;
  Note?: string;
  "Error Message"?: string;
}

interface AlphaVantageOverviewResponse {
  Symbol?: string;
  Currency?: string;
  "52WeekHigh"?: string;
  Information?: string;
  Note?: string;
  "Error Message"?: string;
}

export class AlphaVantageMarketDataProvider implements MarketDataProvider {
  readonly name = "Alpha Vantage";

  constructor(private readonly apiKey: string) {}

  async getMarketSnapshot(symbol: string): Promise<MarketDataProviderResult> {
    try {
      const [quote, overview] = await Promise.all([
        this.fetchJson<AlphaVantageQuoteResponse>({
          function: "GLOBAL_QUOTE",
          symbol,
        }),
        this.fetchJson<AlphaVantageOverviewResponse>({
          function: "OVERVIEW",
          symbol,
        }),
      ]);

      if (!quote || !overview) {
        return {
          ok: false,
          code: "unavailable",
          message: "Market data is temporarily unavailable from Alpha Vantage.",
        };
      }

      const providerFailure =
        getProviderFailure(quote) || getProviderFailure(overview);

      if (providerFailure) {
        return providerFailure;
      }

      const globalQuote = quote["Global Quote"];
      const currentPrice = parseNumber(globalQuote?.["05. price"]);
      const dailyChangePercent = parsePercent(
        globalQuote?.["10. change percent"],
      );
      const fiftyTwoWeekHigh = parseNumber(overview["52WeekHigh"]);

      if (
        currentPrice === null ||
        dailyChangePercent === null ||
        fiftyTwoWeekHigh === null ||
        fiftyTwoWeekHigh <= 0
      ) {
        return {
          ok: false,
          code: "invalid-response",
          message: "Market data is unavailable because the provider response was incomplete.",
        };
      }

      return {
        ok: true,
        snapshot: {
          symbol: globalQuote?.["01. symbol"] || overview.Symbol || symbol,
          currency: overview.Currency || "USD",
          currentPrice,
          dailyChangePercent,
          fiftyTwoWeekHigh,
          drawdownFromHighPercent: Math.max(
            0,
            ((fiftyTwoWeekHigh - currentPrice) / fiftyTwoWeekHigh) * 100,
          ),
          asOf: globalQuote?.["07. latest trading day"] || null,
          lastUpdated: new Date().toISOString(),
          providerName: this.name,
          status: "fresh",
          message: "Market data retrieved successfully.",
        },
      };
    } catch {
      return {
        ok: false,
        code: "unavailable",
        message: "Market data is temporarily unavailable from Alpha Vantage.",
      };
    }
  }

  private async fetchJson<T>(
    parameters: Record<string, string>,
  ): Promise<T | null> {
    const searchParams = new URLSearchParams({
      ...parameters,
      apikey: this.apiKey,
    });

    const response = await fetch(`${ALPHA_VANTAGE_URL}?${searchParams}`, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: CACHE_SECONDS,
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  }

}

function getProviderFailure(
  response: AlphaVantageQuoteResponse | AlphaVantageOverviewResponse,
): MarketDataProviderResult | null {
  const providerMessage =
    response["Error Message"] || response.Note || response.Information;

  if (!providerMessage) {
    return null;
  }

  const normalizedMessage = providerMessage.toLowerCase();
  let code: MarketDataFailureCode = "unavailable";
  let message = "Market data is temporarily unavailable from Alpha Vantage.";

  if (
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("apikey")
  ) {
    code = "invalid-api-key";
    message = "Market data is unavailable because the Alpha Vantage API key is invalid.";
  } else if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("call frequency") ||
    normalizedMessage.includes("requests per")
  ) {
    code = "rate-limited";
    message = "Market data is temporarily unavailable because the provider rate limit was reached.";
  }

  return {
    ok: false,
    code,
    message,
  };
}

function parseNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePercent(value: string | undefined) {
  return parseNumber(value?.replace("%", ""));
}
