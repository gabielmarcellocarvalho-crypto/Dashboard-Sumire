import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency, formatInt } from '@/lib/format';
import type { DataResult, PaidMediaSummary } from '@/lib/data/types';

export function PaidPlatformSection({
  title,
  result,
  showCampaigns = true,
}: {
  title: string;
  result: DataResult<PaidMediaSummary>;
  showCampaigns?: boolean;
}) {
  return (
    <div className="card panel" style={{ marginBottom: 12 }}>
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          <p>Últimos 7 dias</p>
        </div>
        <ReliabilityBadge reliability={result.reliability} />
      </div>

      {result.status !== 'ok' ? (
        <EmptyState title={`${title} indisponível`} reason={result.reason} />
      ) : (
        <>
          <div className="kpi-grid" style={{ marginTop: 10 }}>
            <KpiCard label="Investimento" value={formatCurrency(result.data.cost)} source={title} />
            <KpiCard tone="teal" label="Impressões" value={formatInt(result.data.impressions)} source={title} />
            <KpiCard tone="violet" label="Cliques" value={formatInt(result.data.clicks)} source={title} />
            <KpiCard tone="amber" label="Conversões" value={formatInt(result.data.conversions)} source={title} />
          </div>

          {showCampaigns && result.data.campaigns.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Campanha</th>
                    <th>Status</th>
                    <th className="num">Custo</th>
                    <th className="num">Impressões</th>
                    <th className="num">Cliques</th>
                    <th className="num">Conversões</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.campaigns.map((c, i) => (
                    <tr key={i}>
                      <td className="num-strong">{c.campaign}</td>
                      <td>{c.status}</td>
                      <td className="num">{formatCurrency(c.cost)}</td>
                      <td className="num">{formatInt(c.impressions)}</td>
                      <td className="num">{formatInt(c.clicks)}</td>
                      <td className="num">{formatInt(c.conversions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
