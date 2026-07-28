import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { BarChart } from '@/components/charts/bar-chart';
import { getInstagramSummary } from '@/lib/data/windsor';
import { formatInt, formatDelta } from '@/lib/format';
import { ACCOUNTS } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** date_preset do Windsor não documenta "mês atual/anterior" — usamos date_from/date_to explícitos (formato confirmado na doc). */
function monthRange(monthsAgo: number): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = monthsAgo === 0 ? now : new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  return { dateFrom: isoDate(start), dateTo: isoDate(end) };
}

export default async function ComparativoPage() {
  const accountId = process.env.WINDSOR_IG_SUMIRE_PERFUMARIA_ACCOUNT_ID;
  const brand = ACCOUNTS['perfumaria-instagram'].brand;

  const [thisMonth, lastMonth] = await Promise.all([
    getInstagramSummary(accountId, brand, monthRange(0)),
    getInstagramSummary(accountId, brand, monthRange(1)),
  ]);

  const canCompare = thisMonth.status === 'ok' && lastMonth.status === 'ok';

  function delta(curr: number, prev: number): number | null {
    if (!prev) return null;
    return ((curr - prev) / prev) * 100;
  }

  return (
    <>
      <PageHeader title="Comparativo mensal (MoM)" subtitle="Sumirê Perfumaria · Instagram" />

      {canCompare && (
        <div className="card panel" style={{ marginBottom: 12 }}>
          <div className="panel-head">
            <div>
              <h3>Alcance — mês a mês</h3>
            </div>
          </div>
          <BarChart
            labels={['Mês anterior', 'Este mês']}
            series={[{ label: 'Alcance', color: '#EC2E82', values: [lastMonth.data.totals.reach, thisMonth.data.totals.reach] }]}
            height={200}
          />
        </div>
      )}

      <div className="card">
        {!canCompare ? (
          <EmptyState
            title="Comparativo indisponível"
            reason={
              thisMonth.status !== 'ok'
                ? thisMonth.reason
                : lastMonth.status !== 'ok'
                  ? lastMonth.reason
                  : 'Uma das janelas de período não retornou dados.'
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th className="num">Este mês</th>
                  <th className="num">Mês anterior</th>
                  <th className="num">Variação</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Alcance', curr: thisMonth.data.totals.reach, prev: lastMonth.data.totals.reach },
                  { label: 'Visualizações de vídeo', curr: thisMonth.data.totals.views, prev: lastMonth.data.totals.views },
                  { label: 'Engajamento', curr: thisMonth.data.totals.mediaEngagement, prev: lastMonth.data.totals.mediaEngagement },
                  { label: 'Novos seguidores', curr: thisMonth.data.totals.newFollowers, prev: lastMonth.data.totals.newFollowers },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="num-strong">{row.label}</td>
                    <td className="num">{formatInt(row.curr)}</td>
                    <td className="num">{formatInt(row.prev)}</td>
                    <td className="num">{formatDelta(delta(row.curr, row.prev))}</td>
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
          Escopo desta tela
        </h2>
      </div>
      <div className="card panel">
        <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
          Por enquanto o comparativo mensal só está disponível para <b>Sumirê Perfumaria · Instagram</b> (única
          conta com credencial Windsor.ai configurada — <ReliabilityBadge reliability="real" />). As demais 3
          contas (Perfumaria TikTok, Exclusivos Instagram e TikTok) entram aqui assim que tiverem credencial
          configurada em <code>.env.local</code>.
        </p>
      </div>
    </>
  );
}
