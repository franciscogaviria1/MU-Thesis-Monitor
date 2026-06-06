import type { MarketDataSnapshot } from "@/types/marketData";

interface MarketSnapshotProps {
  snapshot: MarketDataSnapshot;
}

export function MarketSnapshot({ snapshot }: MarketSnapshotProps) {
  const price = formatCurrency(snapshot.currentPrice, snapshot.currency);
  const dailyChange = formatPercent(snapshot.dailyChangePercent, true);
  const high = formatCurrency(snapshot.fiftyTwoWeekHigh, snapshot.currency);
  const drawdown = formatPercent(snapshot.drawdownFromHighPercent);

  return (
    <section className="market-snapshot" aria-label={`${snapshot.symbol} market data`}>
      <div className="market-snapshot__identity">
        <div>
          <p className="eyebrow">Market snapshot</p>
          <h2>{snapshot.symbol}</h2>
        </div>
        <span className={`market-status market-status--${snapshot.status}`}>
          {snapshot.status}
        </span>
      </div>

      <dl>
        <div>
          <dt>Current price</dt>
          <dd>{price}</dd>
        </div>
        <div>
          <dt>Daily change</dt>
          <dd className={getChangeClass(snapshot.dailyChangePercent)}>
            {dailyChange}
          </dd>
        </div>
        <div>
          <dt>52-week high</dt>
          <dd>{high}</dd>
        </div>
        <div>
          <dt>Drawdown from high</dt>
          <dd>{drawdown}</dd>
        </div>
      </dl>

      <div className="market-snapshot__provenance">
        <p>{snapshot.message}</p>
        <span>
          {snapshot.providerName}
          {snapshot.asOf ? ` · Market date ${snapshot.asOf}` : ""}
          {snapshot.lastUpdated
            ? ` · Last updated ${formatTimestamp(snapshot.lastUpdated)}`
            : " · Last updated unavailable"}
        </span>
      </div>
    </section>
  );
}

function formatCurrency(value: number | null, currency: string) {
  if (value === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null, showSign = false) {
  if (value === null) {
    return "Unavailable";
  }

  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function getChangeClass(value: number | null) {
  if (value === null || value === 0) {
    return undefined;
  }

  return value > 0 ? "market-value--positive" : "market-value--negative";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}
