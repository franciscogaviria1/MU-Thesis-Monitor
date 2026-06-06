import { ConfidenceCoverage } from "@/components/ConfidenceCoverage";
import { DecisionLog } from "@/components/DecisionLog";
import { EvidencePanel } from "@/components/EvidencePanel";
import { MarketSnapshot } from "@/components/MarketSnapshot";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ScoreCard } from "@/components/ScoreCard";
import { SectionHeading } from "@/components/SectionHeading";
import { mockDashboardData } from "@/data/mockDashboardData";
import { getMuMarketData } from "@/lib/market-data/marketDataService";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = mockDashboardData;
  const marketData = await getMuMarketData();

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
            <span>{data.lastUpdatedLabel}</span>
            <time>{data.lastUpdated}</time>
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

        <section className="score-section" aria-labelledby="scorecard-title">
          <SectionHeading
            title={data.scoreSectionTitle}
            description={data.scoreSectionDescription}
          />
          <div className="score-grid">
            {data.scoreAreas.map((area, index) => (
              <ScoreCard key={area.id} area={area} index={index} />
            ))}
          </div>
        </section>

        <ConfidenceCoverage data={data.confidenceCoverage} />

        <RecommendationPanel recommendation={data.recommendation} />

        <EvidencePanel
          title={data.evidenceSectionTitle}
          description={data.evidenceSectionDescription}
          items={data.evidenceItems}
        />

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
