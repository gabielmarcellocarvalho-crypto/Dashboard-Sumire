import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { ReachAreaChart } from '@/components/charts/reach-area-chart';
import { getInstagramSummary, getTiktokSummary } from '@/lib/data/windsor';
import { formatInt } from '@/lib/format';
import { ACCOUNTS, type AccountSlug } from '@/lib/accounts';

export async function AccountDetail({ slug }: { slug: AccountSlug }) {
  const acc = ACCOUNTS[slug];
  const result =
    acc.platform === 'Instagram'
      ? await getInstagramSummary(process.env[acc.accountIdEnv], acc.brand)
      : await getTiktokSummary();

  if (result.status !== 'ok') {
    return (
      <div className="card">
        <EmptyState title={`${acc.platform} indisponível`} reason={result.reason} />
      </div>
    );
  }

  return (
    <>
      <div className="section-head">
        <h2>
          <span className="tick" />
          Indicadores do período
        </h2>
        <span className="hint">
          {result.data.periodStart} – {result.data.periodEnd}
        </span>
      </div>
      <div className="kpi-grid">
        <KpiCard
          label="Seguidores totais"
          value={formatInt(result.data.totalFollowers)}
          source="Windsor.ai"
          delta={{ value: `+${formatInt(result.data.totals.newFollowers)}`, direction: 'up' }}
          meta="no período"
        />
        <KpiCard tone="teal" label="Alcance" value={formatInt(result.data.totals.reach)} source="Windsor.ai" />
        <KpiCard
          tone="violet"
          label="Visualizações de vídeo"
          value={formatInt(result.data.totals.views)}
          source="Windsor.ai"
        />
        <KpiCard label="Engajamento" value={formatInt(result.data.totals.mediaEngagement)} source="Windsor.ai" />
      </div>

      {result.data.daily.length > 1 && (
        <>
          <div className="section-head">
            <h2>
              <span className="tick" />
              Evolução diária
            </h2>
          </div>
          <div className="card panel">
            <div className="panel-head">
              <div>
                <h3>Alcance diário</h3>
                <p>Windsor.ai, consolidado por dia</p>
              </div>
              <ReliabilityBadge reliability="real" />
            </div>
            <ReachAreaChart data={result.data.daily as unknown as Record<string, unknown>[]} />
          </div>
        </>
      )}
    </>
  );
}
