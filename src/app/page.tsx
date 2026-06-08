import { ConfidenceCoverage } from "@/components/ConfidenceCoverage";
import { DecisionLog } from "@/components/DecisionLog";
import { MarketSnapshot } from "@/components/MarketSnapshot";
import { MemoryEvidenceWorkspace } from "@/components/MemoryEvidenceWorkspace";
import { mockDashboardData } from "@/data/mockDashboardData";
import { buildEvidenceItems } from "@/lib/evidence/evidenceService";
import { getMuMarketData } from "@/lib/market-data/marketDataService";
import { getMuNews } from "@/lib/news/newsService";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = mockDashboardData;
  const [marketData, news] = await Promise.all([
    getMuMarketData(),
    getMuNews(),
  ]);
  const evidenceItems = buildEvidenceItems({
    marketData,
    news,
    existingEvidence: data.evidenceItems,
  });
  const calculatedAt = new Date().toISOString();

  return (
    <main>
      <header className="site-header">
        <div className="site-header__brand">
          <div className="brand-mark" aria-hidden="true">
            MU
          </div>
          <div>
            <h1>{data.appName}</h1>
            <p>{data.subtitle}</p>
          </div>
        </div>

        <div className="site-header__meta">
          <div>
            <span>Dashboard generated</span>
            <time dateTime={calculatedAt}>
              {new Date(calculatedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </div>
          <strong>{data.disclaimer}</strong>
        </div>
      </header>

      <div className="dashboard-shell">
        <div className="methodology-strip">
          <span aria-hidden="true">i</span>
          <p>{data.methodologyNote}</p>
        </div>

        <MarketSnapshot snapshot={marketData} />

        <MemoryEvidenceWorkspace
          baseEvidenceItems={evidenceItems}
          scoreAreas={data.scoreAreas}
          scoreSectionTitle={data.scoreSectionTitle}
          scoreSectionDescription={data.scoreSectionDescription}
          evidenceTitle={data.evidenceSectionTitle}
          evidenceDescription={data.evidenceSectionDescription}
          calculatedAt={calculatedAt}
          marketData={marketData}
          news={news}
          aiAvailable={Boolean(process.env.OPENAI_API_KEY?.trim())}
          nextEarningsDate={data.nextEarningsDate}
        >
          <ConfidenceCoverage data={data.confidenceCoverage} />
        </MemoryEvidenceWorkspace>

        <DecisionLog
          title={data.decisionLogTitle}
          description={data.decisionLogDescription}
          entries={data.decisionLog}
        />
      </div>

      <footer>{data.footerNote}</footer>
    </main>
  );
}
