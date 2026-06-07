import type { NewsProviderResult } from "@/types/news";

export interface NewsProvider {
  readonly name: string;
  getNews(query: string): Promise<NewsProviderResult>;
}
