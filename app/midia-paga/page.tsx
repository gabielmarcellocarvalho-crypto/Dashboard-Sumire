import { KpiCard } from '@/components/kpi-card';
import { PaidPlatformSection } from '@/components/paid-platform-section';
import { DonutChart, DonutLegend } from '@/components/charts/donut-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { EmptyState } from '@/components/empty-state';
import { getGoogleAdsSummary, getGoogleAdsDaily } from '@/lib/data/google-ads';
import { getMetaAdsSummary, getMetaAdsDaily } from '@/lib/data/meta-ads';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

const GOOGLE_COLOR = '#159AA8';
const META_COLOR = '#9D8BEA';

export default async function MidiaPagaOverviewPage() {
  const [googleAds, metaAds, googleDaily, metaDaily] = await Promise.all([
    getGoogleAdsSummary(),
    getMetaAdsSummary(),
    getGoogleAdsDaily(),
    getMetaAdsDaily(),
  ]);

  const totalInvestment =
    (googleAds.status === 'ok' ? googleAds.data.cost : 0) + (metaAds.status === 'ok' ? metaAds.data.cost : 0);

  const hasDaily = googleDaily.status === 'ok' && metaDaily.status === 'ok';
  let dailyLabels: string[] = [];
  let googleSeries: number[] = [];
  let metaSeries: number[] = [];
  if (hasDaily) {
    const dates = [...new Set([...googleDaily.data.map((d) => d.date), ...metaDaily.data.map((d) => d.date)])].sort();
    const googleByDate = new Map(googleDaily.data.map((d) => [d.date, d.cost]));
    const metaByDate = new Map(metaDaily.data.map((d) => [d.date, d.cost]));
    dailyLabels = dates.map((d) => d.slice(5));
    googleSeries = dates.map((d) => googleByDate.get(d) ?? 0);
    metaSeries = dates.map((d) => metaByDate.get(d) ?? 0);
  }

  return (
    <>
      <div className="section-head">
        <h2>
          <span className="tick" />
          Investimento consolidado
        </h2>
        <span className="hint">Google Ads + Meta Ads · últimos 7 dias</span>
      </div>
      <div className="kpi-grid">
        <KpiCard label="Investimento total" value={formatCurrency(totalInvestment)} source="Meta + Google" />
        <KpiCard
          tone="teal"
          label="Investimento Google Ads"
          value={googleAds.status === 'ok' ? formatCurrency(googleAds.data.cost) : '—'}
          source="Google Ads"
        />
        <KpiCard
          tone="violet"
          label="Investimento Meta Ads"
          value={metaAds.status === 'ok' ? formatCurrency(metaAds.data.cost) : '—'}
          source="Meta Ads"
        />
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Evolução e mix
        </h2>
      </div>
      <div className="grid-2">
        <div className="card panel">
          <div className="panel-head">
            <div>
              <h3>Investimento diário</h3>
              <p>Meta Ads vs. Google Ads</p>
            </div>
          </div>
          <div className="legend">
            <b>
              <span className="swatch line" style={{ background: META_COLOR }} /> Meta Ads
            </b>
            <b>
              <span className="swatch line" style={{ background: GOOGLE_COLOR }} /> Google Ads
            </b>
          </div>
          {hasDaily ? (
            <BarChart
              labels={dailyLabels}
              series={[
                { label: 'Meta Ads', color: META_COLOR, values: metaSeries },
                { label: 'Google Ads', color: GOOGLE_COLOR, values: googleSeries },
              ]}
            />
          ) : (
            <EmptyState
              title="Evolução diária indisponível"
              reason={googleDaily.status !== 'ok' ? googleDaily.reason : metaDaily.status === 'ok' ? '' : metaDaily.reason}
            />
          )}
        </div>

        <div className="card panel">
          <div className="panel-head">
            <div>
              <h3>Mix de investimento</h3>
              <p>Participação por plataforma</p>
            </div>
          </div>
          {totalInvestment > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <DonutChart
                slices={[
                  { label: 'Meta Ads', value: metaAds.status === 'ok' ? metaAds.data.cost : 0, color: META_COLOR },
                  { label: 'Google Ads', value: googleAds.status === 'ok' ? googleAds.data.cost : 0, color: GOOGLE_COLOR },
                ]}
                centerLabel="Total"
                centerValue={formatCurrency(totalInvestment)}
              />
              <DonutLegend
                slices={[
                  { label: 'Meta Ads', value: metaAds.status === 'ok' ? metaAds.data.cost : 0, color: META_COLOR },
                  { label: 'Google Ads', value: googleAds.status === 'ok' ? googleAds.data.cost : 0, color: GOOGLE_COLOR },
                ]}
                total={totalInvestment}
              />
            </div>
          ) : (
            <EmptyState title="Mix indisponível" reason="Sem investimento no período em nenhuma das duas plataformas." />
          )}
        </div>
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Por plataforma
        </h2>
        <span className="hint">resumo — detalhe completo nas abas Meta Ads / Google Ads</span>
      </div>
      <PaidPlatformSection title="Google Ads" result={googleAds} showCampaigns={false} />
      <PaidPlatformSection title="Meta Ads" result={metaAds} showCampaigns={false} />
    </>
  );
}
