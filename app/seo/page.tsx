import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { DonutChart, DonutLegend } from '@/components/charts/donut-chart';
import { getGa4Summary } from '@/lib/data/ga4';
import { formatCurrency, formatInt } from '@/lib/format';

const CHANNEL_COLORS = ['#FF1476', '#159AA8', '#9D8BEA', '#D9A53A', '#34D399', '#FB7185', '#EC2E82', '#4A9EFF'];

export const dynamic = 'force-dynamic';

export default async function SeoPage() {
  const ga4 = await getGa4Summary();

  return (
    <>
      <PageHeader title="SEO" subtitle="Sumirê Perfumaria — tráfego e comportamento via GA4" />

      <div className="card panel">
        <div className="panel-head">
          <div>
            <h3>Google Analytics 4</h3>
            <p>Sessões, usuários e conversões por canal — últimos 7 dias. Canal de interesse principal: Organic Search.</p>
          </div>
          <ReliabilityBadge reliability={ga4.reliability} />
        </div>

        {ga4.status !== 'ok' ? (
          <EmptyState title="GA4 indisponível" reason={ga4.reason} />
        ) : (
          <>
            <div className="kpi-grid" style={{ marginTop: 10 }}>
              <KpiCard label="Sessões" value={formatInt(ga4.data.sessions)} source="GA4" />
              <KpiCard tone="teal" label="Usuários" value={formatInt(ga4.data.totalUsers)} source="GA4" />
              <KpiCard tone="violet" label="Conversões" value={formatInt(ga4.data.conversions)} source="GA4" />
              <KpiCard tone="amber" label="Receita (GA4)" value={formatCurrency(ga4.data.totalRevenue)} source="Diagnóstica" />
            </div>

            {ga4.data.byChannel.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                <DonutChart
                  slices={ga4.data.byChannel.map((c, i) => ({
                    label: c.channel,
                    value: c.sessions,
                    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                  }))}
                  centerLabel="Sessões"
                  centerValue={formatInt(ga4.data.sessions)}
                />
                <DonutLegend
                  slices={ga4.data.byChannel.map((c, i) => ({
                    label: c.channel,
                    value: c.sessions,
                    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                  }))}
                  total={ga4.data.sessions}
                />
              </div>
            )}

            {ga4.data.byChannel.length > 0 && (
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Canal (sessionDefaultChannelGroup)</th>
                      <th className="num">Sessões</th>
                      <th className="num">Conversões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ga4.data.byChannel.map((row) => (
                      <tr key={row.channel}>
                        <td className="num-strong">{row.channel}</td>
                        <td className="num">{formatInt(row.sessions)}</td>
                        <td className="num">{formatInt(row.conversions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
