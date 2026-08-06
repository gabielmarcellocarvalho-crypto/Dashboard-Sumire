import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { BarChart } from '@/components/charts/bar-chart';
import { getInstagramSummary } from '@/lib/data/windsor';
import { formatInt, formatDelta } from '@/lib/format';
import { ACCOUNTS } from '@/lib/accounts';
import { buildPreset } from '@/lib/date-range';

export const dynamic = 'force-dynamic';

/**
 * date_preset do Windsor não documenta "mês atual/anterior" — usamos
 * date_from/date_to explícitos. Reaproveita `lib/date-range.ts` (calculado em
 * America/Sao_Paulo, não `new Date()` do timezone do processo — briefing v3
 * seção 23.12) em vez de repetir a lógica de mês localmente.
 */
function monthRange(monthsAgo: 0 | 1): { dateFrom: string; dateTo: string } {
  const range = buildPreset(monthsAgo === 0 ? 'current_month' : 'previous_month', true);
  return { dateFrom: range.startDate, dateTo: range.endDate };
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
