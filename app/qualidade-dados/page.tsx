import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { getGoogleAdsSummary } from '@/lib/data/google-ads';
import { getMetaAdsSummary } from '@/lib/data/meta-ads';
import { getGa4Summary } from '@/lib/data/ga4';
import { getWakeOrdersSummary } from '@/lib/data/wake-commerce';
import { getWakeCrmSummary } from '@/lib/data/wake-crm';
import { getSearchConsoleSummary } from '@/lib/data/search-console';
import { formatPercent } from '@/lib/format';
import { formatRangeLabel, resolveFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/date-range';
import { integrations } from '@/lib/env';
import type { DataResult } from '@/lib/data/types';
import { WAKE_STATUS_MAPPING_VALIDATED } from '@/lib/wake-status';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<DataResult<unknown>['status'], string> = {
  ok: 'Conectado',
  not_configured: 'Não configurado',
  error: 'Erro de API',
};

export default async function QualidadeDadosPage({ searchParams }: { searchParams: PageSearchParams }) {
  const { range } = await resolveFiltersFromPageSearchParams(searchParams);

  const [googleAds, metaAds, ga4, wakeOrders, wakeCrm, gsc] = await Promise.all([
    getGoogleAdsSummary(range),
    getMetaAdsSummary(range),
    getGa4Summary(range),
    getWakeOrdersSummary(range),
    getWakeCrmSummary(),
    getSearchConsoleSummary(range),
  ]);

  const sources: { name: string; result: DataResult<unknown> }[] = [
    { name: 'Google Ads', result: googleAds },
    { name: 'Meta Ads', result: metaAds },
    { name: 'GA4', result: ga4 },
    { name: 'Wake Commerce', result: wakeOrders },
    { name: 'Wake CRM', result: wakeCrm },
    { name: 'Search Console', result: gsc },
  ];

  const orderCoverage = ga4.status === 'ok' && wakeOrders.status === 'ok' && wakeOrders.data.ordersCaptured > 0 ? (ga4.data.transactions / wakeOrders.data.ordersCaptured) * 100 : null;
  const revenueCoverage = ga4.status === 'ok' && wakeOrders.status === 'ok' && wakeOrders.data.revenueCaptured > 0 ? (ga4.data.totalRevenue / wakeOrders.data.revenueCaptured) * 100 : null;

  return (
    <>
      <PageHeader title="Qualidade de dados" subtitle="Status das integrações e reconciliação entre fontes (briefing v3, seção 18)" />

      <div className="section-head">
        <h2>
          <span className="tick" />
          Status por fonte
        </h2>
        <span className="hint">{formatRangeLabel(range)}</span>
      </div>
      <div className="card panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fonte</th>
                <th>Status</th>
                <th>Confiabilidade</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.name}>
                  <td className="num-strong">{s.name}</td>
                  <td>{STATUS_LABEL[s.result.status]}</td>
                  <td>
                    <ReliabilityBadge reliability={s.result.reliability} />
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{s.result.status !== 'ok' ? s.result.reason : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Reconciliação GA4 × Wake
        </h2>
      </div>
      <div className="kpi-grid">
        <KpiCard
          label="Cobertura de pedidos GA4"
          value={formatPercent(orderCoverage)}
          source="Diagnóstica"
          formula="Transações GA4 ÷ pedidos captados Wake"
          status="Divergências grandes (muito abaixo ou acima de 100%) indicam problema de tracking ou atribuição"
        />
        <KpiCard
          label="Cobertura de receita GA4"
          value={formatPercent(revenueCoverage)}
          source="Diagnóstica"
          formula="Receita GA4 ÷ receita captada Wake"
        />
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Mapeamentos pendentes de validação
        </h2>
      </div>
      <div className="card panel" style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>
            <b>Status pagos da Wake</b> ({WAKE_STATUS_MAPPING_VALIDATED ? 'validado' : 'pendente'}): derivado estatisticamente
            de uma amostra de pedidos (ver comentário em <code>lib/wake-status.ts</code>) — o endpoint oficial{' '}
            <code>/situacoesPedido</code> retornou 401 com a chave de API atual (falta de escopo/permissão). Peça ao time
            Wake pra confirmar os nomes das situações ou liberar o escopo dessa chave.
          </li>
          <li>
            <b>Orgânico social</b> ({integrations.windsorIgPerfumaria ? 'Perfumaria IG ok' : 'Perfumaria IG pendente'},{' '}
            {integrations.windsorIgExclusivos ? 'Exclusivos IG ok' : 'Exclusivos IG pendente'},{' '}
            {integrations.windsorTiktokPerfumaria ? 'Perfumaria TikTok ok' : 'Perfumaria TikTok pendente'},{' '}
            {integrations.windsorTiktokExclusivos ? 'Exclusivos TikTok ok' : 'Exclusivos TikTok pendente'}).
          </li>
        </ul>
      </div>
    </>
  );
}
