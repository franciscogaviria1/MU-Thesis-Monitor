import type {
  NewsFeedSnapshot,
  NewsRelatedArea,
  NewsSourceTier,
} from "@/types/news";
import { SectionHeading } from "@/components/SectionHeading";

interface NewsFeedProps {
  snapshot: NewsFeedSnapshot;
}

const sourceTierLabels: Record<NewsSourceTier, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  tier_4: "Tier 4",
  unknown: "Unclassified source",
};

const relatedAreaLabels: Record<NewsRelatedArea, string> = {
  business_thesis_health: "Business Thesis Health",
  valuation_risk: "Valuation Risk",
  market_sentiment: "Market Sentiment",
};

export function NewsFeed({ snapshot }: NewsFeedProps) {
  return (
    <section className="news-section" aria-labelledby="news-title">
      <SectionHeading
        eyebrow="Ingestion only"
        title="Recent MU headlines"
        description="Collected headlines are source records only. They have not been classified, summarized, or scored."
      />

      <div className="news-status-row">
        <span className={`news-status news-status--${snapshot.status}`}>
          {snapshot.status}
        </span>
        <p>{snapshot.message}</p>
        <span>
          {snapshot.providerName}
          {snapshot.lastUpdated
            ? ` · Updated ${formatTimestamp(snapshot.lastUpdated)}`
            : " · Last updated unavailable"}
        </span>
      </div>

      {snapshot.items.length > 0 ? (
        <ol className="news-list">
          {snapshot.items.map((item) => (
            <li key={item.id}>
              <div className="news-list__meta">
                <time dateTime={item.publishedAt}>
                  {formatTimestamp(item.publishedAt)}
                </time>
                <span>{sourceTierLabels[item.sourceTier]}</span>
              </div>
              <div className="news-list__content">
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
                <div>
                  <span>{item.sourceName}</span>
                  <span>{relatedAreaLabels[item.relatedAreas[0]]}</span>
                  <span>Not analyzed</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="news-empty">
          No normalized headlines are available. The rest of the dashboard
          remains operational.
        </p>
      )}
    </section>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}
