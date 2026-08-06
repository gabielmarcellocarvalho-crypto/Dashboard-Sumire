import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { getGa4Summary, isOrganicSearchChannel } from '@/lib/data/ga4';
import { getSearchConsoleSummary } from '@/lib/data/search-console';
import { formatCurrency, formatInt, formatPercent } from '@/lib/format';
import { formatRangeLabel, resolveFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/date-range';

export const dynamic = 'force-dynamic';

export default async function SeoPage({ searchParams }: { searchParams: PageSearchParams }) {
  const { range } = await resolveFiltersFromPageSearchParams(searchParams);
  const [ga4, gsc] = await Promise.all([getGa4Summary(range), getSearchConsoleSummary(range)]);

  const organic = ga4.status === 'ok' ? ga4.data.byChannel.find((c) => isOrganicSearchChannel(c.channel)) : undefined;
  const organicRevenueShare =
    ga4.status === 'ok' && organic && ga4.data.totalRevenue > 0 ? (organic.revenue / ga4.data.totalRevenue) * 100 : null;
  const organicConversionRate =
    organic && organic.sessions > 0 ? (organic.transactions / organic.sessions) * 100 : null;
  const organicAvgTicket = organic && organic.transactions > 0 ? organic.revenue / organic.transactions : null;

  return (
    <>
      <PageHeader title="SEO" subtitle="Sumirê Perfumaria — tráfego e resultado orgânico (canal Organic Search)" />

      <div className="card panel">
        <div className="panel-head">
          <div>
            <h3>Google Analytics 4 — Organic Search</h3>
            <p>{formatRangeLabel(range)}. Filtrado ao canal orgânico (não mostra os demais canais do GA4).</p>
          </div>
          <ReliabilityBadge reliability={ga4.reliability} />
        </div>

        {ga4.status !== 'ok' ? (
          <EmptyState title="GA4 indisponível" reason={ga4.reason} />
        ) : !organic ? (
          <EmptyState title="Sem sessões orgânicas no período" reason="Nenhuma linha 'Organic Search' retornada pelo GA4 para esse recorte de datas." />
        ) : (
          <div className="kpi-grid" style={{ marginTop: 10 }}>
            <KpiCard label="Sessões orgânicas" value={formatInt(organic.sessions)} source="GA4" />
            <KpiCard tone="teal" label="Transações orgânicas" value={formatInt(organic.transactions)} source="GA4" />
            <KpiCard
              tone="violet"
              label="Taxa de conversão orgânica"
              value={formatPercent(organicConversionRate)}
              source="GA4"
              status="Transações Organic Search ÷ sessões Organic Search"
            />
            <KpiCard
              tone="amber"
              label="Receita orgânica"
              value={formatCurrency(organic.revenue)}
              source="Diagnóstica"
              status="GA4 last click — não é a verdade financeira (Wake)"
            />
            <KpiCard label="Ticket médio orgânico" value={formatCurrency(organicAvgTicket)} source="GA4" />
            <KpiCard label="Participação na receita GA4" value={formatPercent(organicRevenueShare)} source="GA4" />
          </div>
        )}
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Google Search Console
        </h2>
      </div>
      <div className="card panel">
        <div className="panel-head">
          <div>
            <h3>Cliques, impressões, CTR e posição média</h3>
          </div>
          <ReliabilityBadge reliability={gsc.reliability} />
        </div>
        {gsc.status !== 'ok' ? (
          <EmptyState title="Search Console indisponível" reason={gsc.reason} />
        ) : (
          <div className="kpi-grid" style={{ marginTop: 10 }}>
            <KpiCard label="Cliques" value={formatInt(gsc.data.clicks)} source="Search Console" />
            <KpiCard tone="teal" label="Impressões" value={formatInt(gsc.data.impressions)} source="Search Console" />
            <KpiCard tone="violet" label="CTR" value={formatPercent(gsc.data.ctr)} source="Search Console" formula="Cliques ÷ impressões" />
            <KpiCard tone="amber" label="Posição média" value={gsc.data.position.toFixed(1)} source="Search Console" />
          </div>
        )}
      </div>
    </>
  );
}
