import type { NewsProvider } from "@/lib/news/NewsProvider";
import { GdeltNewsProvider } from "@/lib/news/providers/GdeltNewsProvider";
import type { NewsFeedSnapshot, NewsItem } from "@/types/news";

const NEWS_QUERY = "Micron Technology";
const PROVIDER_NAME = "GDELT DOC 2.0";

let lastSuccessfulSnapshot: NewsFeedSnapshot | null = null;

export async function getMuNews(): Promise<NewsFeedSnapshot> {
  const provider = createNewsProvider();
  const result = await provider.getNews(NEWS_QUERY);

  if (!result.ok) {
    return createFallbackSnapshot(result.message);
  }

  const items = deduplicateNews(result.items);
  const snapshot: NewsFeedSnapshot = {
    items,
    providerName: provider.name,
    status: "fresh",
    message: `${items.length} recent MU headlines retrieved. Headlines are not analyzed.`,
    lastUpdated: result.retrievedAt,
  };

  lastSuccessfulSnapshot = snapshot;
  return snapshot;
}

function createNewsProvider(): NewsProvider {
  return new GdeltNewsProvider();
}

function createFallbackSnapshot(message: string): NewsFeedSnapshot {
  if (lastSuccessfulSnapshot) {
    return {
      ...lastSuccessfulSnapshot,
      status: "stale",
      message: `${message} Showing the last successful headline snapshot.`,
    };
  }

  return {
    items: [],
    providerName: PROVIDER_NAME,
    status: "unavailable",
    message,
    lastUpdated: null,
  };
}

function deduplicateNews(items: NewsItem[]) {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  return items.filter((item) => {
    const normalizedUrl = item.url.toLowerCase();
    const normalizedTitle = normalizeTitle(item.title);

    if (seenUrls.has(normalizedUrl) || seenTitles.has(normalizedTitle)) {
      return false;
    }

    seenUrls.add(normalizedUrl);
    seenTitles.add(normalizedTitle);
    return true;
  });
}

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
