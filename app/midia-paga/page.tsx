import { KpiCard } from '@/components/kpi-card';
import { PaidPlatformSection } from '@/components/paid-platform-section';
import { DonutChart, DonutLegend } from '@/components/charts/donut-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { EmptyState } from '@/components/empty-state';
import { getGoogleAdsSummary, getGoogleAdsDaily } from '@/lib/data/google-ads';
import { getMetaAdsSummary, getMetaAdsDaily } from '@/lib/data/meta-ads';
import { getGa4Summary, isPaidChannel } from '@/lib/data/ga4';
import { getWakeOrdersSummary } from '@/lib/data/wake-commerce';
import { formatCurrency, formatInt, formatPercent } from '@/lib/format';
import { formatRangeLabel, resolveFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/date-range';

export const dynamic = 'force-dynamic';

const GOOGLE_COLOR = '#159AA8';
const META_COLOR = '#9D8BEA';

export default async function MidiaPagaOverviewPage({ searchParams }: { searchParams: PageSearchParams }) {
  const { range } = await resolveFiltersFromPageSearchParams(searchParams);
  const [googleAds, metaAds, googleDaily, metaDaily, ga4, wakeOrders] = await Promise.all([
    getGoogleAdsSummary(range),
    getMetaAdsSummary(range),
    getGoogleAdsDaily(range),
    getMetaAdsDaily(range),
    getGa4Summary(range),
    getWakeOrdersSummary(range),
  ]);

  const totalInvestment =
    (googleAds.status === 'ok' ? googleAds.data.cost : 0) + (metaAds.status === 'ok' ? metaAds.data.cost : 0);

  const paidChannels = ga4.status === 'ok' ? ga4.data.byChannel.filter((c) => isPaidChannel(c.channel)) : [];
  const paidSessions = paidChannels.reduce((a, c) => a + c.sessions, 0);
  const ga4RevenuePaid = paidChannels.reduce((a, c) => a + c.revenue, 0);
  const metaGa4Channel = ga4.status === 'ok' ? ga4.data.byChannel.find((c) => c.channel === 'Paid Social') : undefined;
  const googleGa4Channel = ga4.status === 'ok' ? ga4.data.byChannel.find((c) => c.channel === 'Paid Search') : undefined;

  const costPerPaidSession = totalInvestment > 0 && paidSessions > 0 ? totalInvestment / paidSessions : null;
  const roasGa4Paid = totalInvestment > 0 ? ga4RevenuePaid / totalInvestment : null;
  const merBilled = totalInvestment > 0 && wakeOrders.status === 'ok' ? wakeOrders.data.revenueBilled / totalInvestment : null;
  const costPerOrderCaptured = totalInvestment > 0 && wakeOrders.status === 'ok' && wakeOrders.data.ordersCaptured > 0 ? totalInvestment / wakeOrders.data.ordersCaptured : null;
  const costPerOrderBilled = totalInvestment > 0 && wakeOrders.status === 'ok' && wakeOrders.data.ordersBilled > 0 ? totalInvestment / wakeOrders.data.ordersBilled : null;

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

  const consolidatedCampaigns = [
    ...(googleAds.status === 'ok' ? googleAds.data.campaigns : []),
    ...(metaAds.status === 'ok' ? metaAds.data.campaigns : []),
  ].sort((a, b) => b.cost - a.cost);

  return (
    <>
      <div className="section-head">
        <h2>
          <span className="tick" />
          Investimento consolidado
        </h2>
        <span className="hint">Google Ads + Meta Ads · {formatRangeLabel(range)}</span>
      </div>
      <div className="kpi-grid">
        <KpiCard label="Investimento total" value={formatCurrency(totalInvestment)} source="Meta + Google" />
        <KpiCard
          tone="teal"
          label="Investimento Google Ads"
          value={googleAds.status === 'ok' ? formatCurrency(googleAds.data.cost) : '—'}
          source="Google Ads"
          status={googleAds.status === 'ok' ? undefined : googleAds.reason}
        />
        <KpiCard
          tone="violet"
          label="Investimento Meta Ads"
          value={metaAds.status === 'ok' ? formatCurrency(metaAds.data.cost) : '—'}
          source="Meta Ads"
          status={metaAds.status === 'ok' ? undefined : metaAds.reason}
        />
        <KpiCard
          label="Sessões pagas GA4"
          value={formatInt(paidSessions)}
          source="Reconciliada"
          formula="Soma de sessões GA4 dos canais Paid Search + Paid Social"
        />
        <KpiCard
          tone="amber"
          label="Custo por sessão paga"
          value={costPerPaidSession !== null ? formatCurrency(costPerPaidSession) : '—'}
          source="Reconciliada"
          formula="Investimento total ÷ sessões pagas GA4"
        />
        <KpiCard
          label="Receita GA4 last click paga"
          value={formatCurrency(ga4RevenuePaid)}
          source="Diagnóstica"
          formula="Receita GA4 dos canais Paid Search + Paid Social — não somar com receita atribuída pelas plataformas"
        />
        <KpiCard
          label="ROAS GA4 pago"
          value={roasGa4Paid !== null ? `${roasGa4Paid.toFixed(2)}x` : '—'}
          source="Diagnóstica"
          formula="Receita GA4 last click paga ÷ investimento total"
        />
        <KpiCard
          tone="up"
          label="MER faturado"
          value={merBilled !== null ? `${merBilled.toFixed(2)}x` : '—'}
          source="Reconciliada"
          formula="Receita faturada (Wake) ÷ investimento total"
        />
        <KpiCard label="Custo por pedido captado" value={costPerOrderCaptured !== null ? formatCurrency(costPerOrderCaptured) : '—'} source="Reconciliada" />
        <KpiCard label="Custo por pedido faturado" value={costPerOrderBilled !== null ? formatCurrency(costPerOrderBilled) : '—'} source="Reconciliada" />
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Receita atribuída × GA4 last click
        </h2>
      </div>
      <div className="card panel">
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>
          Regra inegociável (briefing seção 4): não somar a receita atribuída pelo Meta com a do Google como
          faturamento total — a mesma venda pode ser atribuída por mais de uma plataforma.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Plataforma</th>
                <th className="num">Receita atribuída (plataforma)</th>
                <th className="num">Receita GA4 last click</th>
                <th className="num">Diferença</th>
                <th className="num">Razão plataforma/GA4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num-strong">Meta Ads</td>
                <td className="num">{metaAds.status === 'ok' ? formatCurrency(metaAds.data.conversionsValue) : '—'}</td>
                <td className="num">{metaGa4Channel ? formatCurrency(metaGa4Channel.revenue) : '—'}</td>
                <td className="num">
                  {metaAds.status === 'ok' && metaGa4Channel ? formatCurrency(metaAds.data.conversionsValue - metaGa4Channel.revenue) : '—'}
                </td>
                <td className="num">
                  {metaAds.status === 'ok' && metaGa4Channel && metaGa4Channel.revenue > 0
                    ? (metaAds.data.conversionsValue / metaGa4Channel.revenue).toFixed(2)
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="num-strong">Google Ads</td>
                <td className="num">{googleAds.status === 'ok' ? formatCurrency(googleAds.data.conversionsValue) : '—'}</td>
                <td className="num">{googleGa4Channel ? formatCurrency(googleGa4Channel.revenue) : '—'}</td>
                <td className="num">
                  {googleAds.status === 'ok' && googleGa4Channel ? formatCurrency(googleAds.data.conversionsValue - googleGa4Channel.revenue) : '—'}
                </td>
                <td className="num">
                  {googleAds.status === 'ok' && googleGa4Channel && googleGa4Channel.revenue > 0
                    ? (googleAds.data.conversionsValue / googleGa4Channel.revenue).toFixed(2)
                    : '—'}
                </td>
              </tr>
              <tr>
                <td className="num-strong">Consolidado pago (GA4)</td>
                <td className="num">—</td>
                <td className="num">{formatCurrency(ga4RevenuePaid)}</td>
                <td className="num">—</td>
                <td className="num">—</td>
              </tr>
              <tr>
                <td className="num-strong">Receita faturada (Wake, contexto)</td>
                <td className="num" colSpan={4}>
                  {wakeOrders.status === 'ok' ? formatCurrency(wakeOrders.data.revenueBilled) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
          Campanhas — todas as plataformas
        </h2>
        <span className="hint">{consolidatedCampaigns.length} campanhas</span>
      </div>
      <div className="card panel">
        {consolidatedCampaigns.length === 0 ? (
          <EmptyState title="Sem campanhas no período" reason="Nenhuma das duas plataformas retornou campanhas com atividade." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plataforma</th>
                  <th>Campanha</th>
                  <th>Status</th>
                  <th className="num">Investimento</th>
                  <th className="num">Impressões</th>
                  <th className="num">Cliques</th>
                  <th className="num">CTR</th>
                  <th className="num">CPC</th>
                  <th className="num">Conversões</th>
                  <th className="num">Receita</th>
                  <th className="num">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedCampaigns.map((c, i) => (
                  <tr key={i}>
                    <td>{c.platform}</td>
                    <td className="num-strong">{c.campaign}</td>
                    <td>{c.status}</td>
                    <td className="num">{formatCurrency(c.cost)}</td>
                    <td className="num">{formatInt(c.impressions)}</td>
                    <td className="num">{formatInt(c.clicks)}</td>
                    <td className="num">{formatPercent(c.impressions > 0 ? (c.clicks / c.impressions) * 100 : null)}</td>
                    <td className="num">{c.clicks > 0 ? formatCurrency(c.cost / c.clicks) : '—'}</td>
                    <td className="num">{formatInt(c.conversions)}</td>
                    <td className="num">{formatCurrency(c.conversionsValue)}</td>
                    <td className="num">{c.cost > 0 ? `${(c.conversionsValue / c.cost).toFixed(2)}x` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
