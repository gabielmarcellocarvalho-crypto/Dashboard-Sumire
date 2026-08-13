import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/kpi-card';
import { RefreshButton } from '@/components/refresh-button';
import { ComboChart, type ComboBarSeries, type ComboLineSeries } from '@/components/charts/combo-chart';
import { ComparativeFunnelChart } from '@/components/charts/comparative-funnel-chart';
import { ChannelMatrixTable } from '@/components/charts/channel-matrix-table';
import { DonutChart, DonutLegend } from '@/components/charts/donut-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { GoalProgress } from '@/components/goal-progress';
import { TrendingUpIcon, TrendingDownIcon } from '@/components/icons';
import { getGoogleAdsSummary, getGoogleAdsDaily } from '@/lib/data/google-ads';
import { getMetaAdsSummary, getMetaAdsDaily } from '@/lib/data/meta-ads';
import { getGa4Summary, getGa4Funnel, isPaidChannel, type Ga4ChannelRow } from '@/lib/data/ga4';
import { getWakeOrdersSummary } from '@/lib/data/wake-commerce';
import { findGoalForMonth } from '@/lib/goals';
import { computeMonthlyPace } from '@/lib/pace';
import { formatCurrency, formatInt, formatPercent, formatDelta } from '@/lib/format';
import { formatRangeLabel, resolveFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/date-range';
import { integrations } from '@/lib/env';

export const dynamic = 'force-dynamic';

const CHANNEL_COLORS = ['#FF1476', '#159AA8', '#9D8BEA', '#D9A53A', '#34D399', '#FB7185', '#EC2E82', '#4A9EFF'];
const META_COLOR = '#9D8BEA';

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function deltaProp(current: number, previous: number | undefined): { value: string; direction: 'up' | 'down' } | undefined {
  if (previous === undefined) return undefined;
  const d = pctDelta(current, previous);
  if (d === null) return undefined;
  return { value: formatDelta(d), direction: d >= 0 ? 'up' : 'down' };
}

function topChannelsWithOthers(rows: Ga4ChannelRow[], metric: 'sessions' | 'revenue', max = 5) {
  const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);
  const top = sorted.slice(0, max);
  const rest = sorted.slice(max);
  const restTotal = rest.reduce((a, c) => a + c[metric], 0);
  const slices = top.map((c, i) => ({ label: c.channel, value: c[metric], color: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }));
  if (rest.length > 0) slices.push({ label: 'Outros', value: restTotal, color: '#52525b' });
  return slices;
}

export default async function OverviewPage({ searchParams }: { searchParams: PageSearchParams }) {
  const { range, comparisonRange, comparisonMode } = await resolveFiltersFromPageSearchParams(searchParams);

  const [googleAds, metaAds, ga4, wakeOrders, ga4Funnel, googleDaily, metaDaily] = await Promise.all([
    getGoogleAdsSummary(range),
    getMetaAdsSummary(range),
    getGa4Summary(range),
    getWakeOrdersSummary(range),
    getGa4Funnel(range),
    getGoogleAdsDaily(range),
    getMetaAdsDaily(range),
  ]);

  const [prevGoogleAds, prevMetaAds, prevGa4, prevWakeOrders, prevGa4Funnel] = comparisonRange
    ? await Promise.all([
        getGoogleAdsSummary(comparisonRange),
        getMetaAdsSummary(comparisonRange),
        getGa4Summary(comparisonRange),
        getWakeOrdersSummary(comparisonRange),
        getGa4Funnel(comparisonRange),
      ])
    : [null, null, null, null, null];

  const goal = await findGoalForMonth(range.startDate.slice(0, 7));

  // ---- Derivados período atual ----
  const totalInvestment = (googleAds.status === 'ok' ? googleAds.data.cost : 0) + (metaAds.status === 'ok' ? metaAds.data.cost : 0);
  const hasInvestment = googleAds.status === 'ok' || metaAds.status === 'ok';
  const paidSessions =
    ga4.status === 'ok' ? ga4.data.byChannel.filter((c) => isPaidChannel(c.channel)).reduce((a, c) => a + c.sessions, 0) : 0;
  const ga4RevenuePaid =
    ga4.status === 'ok' ? ga4.data.byChannel.filter((c) => isPaidChannel(c.channel)).reduce((a, c) => a + c.revenue, 0) : 0;
  const merBilled = hasInvestment && totalInvestment > 0 && wakeOrders.status === 'ok' ? wakeOrders.data.revenueBilled / totalInvestment : null;
  const merCaptured = hasInvestment && totalInvestment > 0 && wakeOrders.status === 'ok' ? wakeOrders.data.revenueCaptured / totalInvestment : null;
  const costPerPaidSession = totalInvestment > 0 && paidSessions > 0 ? totalInvestment / paidSessions : null;
  const conversionRateCaptured = ga4.status === 'ok' && wakeOrders.status === 'ok' && ga4.data.sessions > 0 ? (wakeOrders.data.ordersCaptured / ga4.data.sessions) * 100 : null;
  const conversionRateGa4 = ga4.status === 'ok' && ga4.data.sessions > 0 ? (ga4.data.transactions / ga4.data.sessions) * 100 : null;
  const avgTicketBilled = wakeOrders.status === 'ok' && wakeOrders.data.ordersBilled > 0 ? wakeOrders.data.revenueBilled / wakeOrders.data.ordersBilled : null;
  const avgTicketCaptured = wakeOrders.status === 'ok' && wakeOrders.data.ordersCaptured > 0 ? wakeOrders.data.revenueCaptured / wakeOrders.data.ordersCaptured : null;
  const costPerOrderBilled = totalInvestment > 0 && wakeOrders.status === 'ok' && wakeOrders.data.ordersBilled > 0 ? totalInvestment / wakeOrders.data.ordersBilled : null;

  // ---- Derivados período comparado (só o essencial pra deltas) ----
  const prevTotalInvestment = prevGoogleAds && prevMetaAds
    ? (prevGoogleAds.status === 'ok' ? prevGoogleAds.data.cost : 0) + (prevMetaAds.status === 'ok' ? prevMetaAds.data.cost : 0)
    : undefined;
  const prevRevenueBilled = prevWakeOrders?.status === 'ok' ? prevWakeOrders.data.revenueBilled : undefined;
  const prevRevenueCaptured = prevWakeOrders?.status === 'ok' ? prevWakeOrders.data.revenueCaptured : undefined;
  const prevSessions = prevGa4?.status === 'ok' ? prevGa4.data.sessions : undefined;
  const prevOrdersCaptured = prevWakeOrders?.status === 'ok' ? prevWakeOrders.data.ordersCaptured : undefined;
  const prevOrdersBilled = prevWakeOrders?.status === 'ok' ? prevWakeOrders.data.ordersBilled : undefined;
  const prevApprovalRate = prevWakeOrders?.status === 'ok' && prevWakeOrders.data.approvalRate !== null ? prevWakeOrders.data.approvalRate * 100 : undefined;

  // ---- Gráfico combinado: investimento (barra) x receita captada/faturada (linha) x MER (linha, eixo secundário) ----
  const dailyDates = [
    ...new Set([
      ...(wakeOrders.status === 'ok' ? wakeOrders.data.daily.map((d) => d.date) : []),
      ...(googleDaily.status === 'ok' ? googleDaily.data.map((d) => d.date) : []),
      ...(metaDaily.status === 'ok' ? metaDaily.data.map((d) => d.date) : []),
    ]),
  ].sort();
  const googleCostByDate = new Map(googleDaily.status === 'ok' ? googleDaily.data.map((d) => [d.date, d.cost]) : []);
  const metaCostByDate = new Map(metaDaily.status === 'ok' ? metaDaily.data.map((d) => [d.date, d.cost]) : []);
  const wakeByDate = new Map(wakeOrders.status === 'ok' ? wakeOrders.data.daily.map((d) => [d.date, d]) : []);

  const investmentSeries = dailyDates.map((d) => (googleCostByDate.get(d) ?? 0) + (metaCostByDate.get(d) ?? 0));
  const revenueCapturedSeries = dailyDates.map((d) => wakeByDate.get(d)?.revenueCaptured ?? null);
  const revenueBilledSeries = dailyDates.map((d) => wakeByDate.get(d)?.revenueBilled ?? null);
  const merSeries = dailyDates.map((d, i) => {
    const inv = investmentSeries[i];
    const rev = wakeByDate.get(d)?.revenueBilled;
    return inv > 0 && rev !== undefined ? rev / inv : null;
  });

  const comboSeries: (ComboBarSeries | ComboLineSeries)[] = [
    { type: 'bar', label: 'Investimento', color: 'rgba(255,20,118,0.55)', values: investmentSeries },
    { type: 'line', label: 'Receita captada', color: '#159AA8', values: revenueCapturedSeries, axis: 'primary' },
    { type: 'line', label: 'Receita faturada', color: '#34D399', values: revenueBilledSeries, axis: 'primary' },
    {
      type: 'line',
      label: 'MER faturado',
      color: '#D9A53A',
      values: merSeries,
      axis: 'secondary',
      format: 'multiplier',
    },
  ];

  // ---- Funil macro comparativo ----
  const funnelSteps =
    ga4Funnel.status === 'ok'
      ? [
          ...ga4Funnel.data.map((s, i) => ({
            label: s.step,
            current: s.count,
            compare: prevGa4Funnel?.status === 'ok' ? (prevGa4Funnel.data[i]?.count ?? null) : null,
          })),
          ...(wakeOrders.status === 'ok'
            ? [
                {
                  label: 'Pedido captado (Wake)',
                  current: wakeOrders.data.ordersCaptured,
                  compare: prevWakeOrders?.status === 'ok' ? prevWakeOrders.data.ordersCaptured : null,
                },
                {
                  label: 'Pedido faturado (Wake)',
                  current: wakeOrders.data.ordersBilled,
                  compare: prevWakeOrders?.status === 'ok' ? prevWakeOrders.data.ordersBilled : null,
                },
              ]
            : []),
        ]
      : [];

  // ---- Metas & pace (oculto se não houver meta cadastrada pro mês, regra 17.1) ----
  const pace = {
    revenueBilled: goal?.revenueBilled ? computeMonthlyPace(wakeOrders.status === 'ok' ? wakeOrders.data.revenueBilled : 0, goal.revenueBilled, range.startDate.slice(0, 7), range.includeToday) : null,
    revenueCaptured: goal?.revenueCaptured ? computeMonthlyPace(wakeOrders.status === 'ok' ? wakeOrders.data.revenueCaptured : 0, goal.revenueCaptured, range.startDate.slice(0, 7), range.includeToday) : null,
    ordersBilled: goal?.ordersBilled ? computeMonthlyPace(wakeOrders.status === 'ok' ? wakeOrders.data.ordersBilled : 0, goal.ordersBilled, range.startDate.slice(0, 7), range.includeToday) : null,
    totalInvestment: goal?.totalInvestment ? computeMonthlyPace(totalInvestment, goal.totalInvestment, range.startDate.slice(0, 7), range.includeToday) : null,
  };

  // ---- Drivers & riscos (regras determinísticas — MVP, briefing seção 9.9) ----
  const drivers: string[] = [];
  const risks: string[] = [];

  if (ga4.status === 'ok' && prevGa4?.status === 'ok') {
    const prevByChannel = new Map(prevGa4.data.byChannel.map((c) => [c.channel, c.revenue]));
    const withDelta = ga4.data.byChannel
      .map((c) => ({ channel: c.channel, delta: c.revenue - (prevByChannel.get(c.channel) ?? 0) }))
      .filter((c) => c.delta > 0)
      .sort((a, b) => b.delta - a.delta);
    if (withDelta[0]) drivers.push(`${withDelta[0].channel} foi o canal que mais adicionou receita GA4 (+${formatCurrency(withDelta[0].delta)})`);
  }
  if (googleAds.status === 'ok' && metaAds.status === 'ok' && totalInvestment > 0) {
    const leader = googleAds.data.cost >= metaAds.data.cost ? 'Google Ads' : 'Meta Ads';
    const share = (Math.max(googleAds.data.cost, metaAds.data.cost) / totalInvestment) * 100;
    drivers.push(`${leader} concentra ${share.toFixed(0)}% do investimento do período`);
  }
  if (wakeOrders.status === 'ok' && prevWakeOrders?.status === 'ok' && prevWakeOrders.data.revenueBilled > 0) {
    const d = pctDelta(wakeOrders.data.revenueBilled, prevWakeOrders.data.revenueBilled);
    if (d !== null && d > 0) drivers.push(`Receita faturada cresceu ${formatDelta(d)} vs. período comparado`);
  }

  if (wakeOrders.status === 'ok' && wakeOrders.data.approvalRate !== null && wakeOrders.data.approvalRate < 0.85) {
    risks.push(`Taxa de aprovação em ${formatPercent(wakeOrders.data.approvalRate * 100)} — abaixo de 85%`);
  }
  if (funnelSteps.length > 1) {
    let worst = { label: '', drop: 0 };
    for (let i = 1; i < funnelSteps.length; i++) {
      const prevStep = funnelSteps[i - 1].current;
      const step = funnelSteps[i].current;
      if (prevStep > 0) {
        const drop = (1 - step / prevStep) * 100;
        if (drop > worst.drop) worst = { label: `${funnelSteps[i - 1].label} → ${funnelSteps[i].label}`, drop };
      }
    }
    if (worst.drop > 50) risks.push(`Maior abandono do funil: ${worst.label} (${worst.drop.toFixed(0)}%)`);
  }
  for (const [name, r] of [
    ['Google Ads', googleAds],
    ['Meta Ads', metaAds],
    ['GA4', ga4],
    ['Wake Commerce', wakeOrders],
  ] as const) {
    if (r.status === 'error') risks.push(`${name} com erro: ${r.reason}`);
  }
  if (ga4.status === 'ok' && wakeOrders.status === 'ok' && wakeOrders.data.ordersCaptured > 0) {
    const coverage = ga4.data.transactions / wakeOrders.data.ordersCaptured;
    if (coverage < 0.5 || coverage > 2) {
      risks.push(`GA4 diverge da Wake: transações GA4 = ${(coverage * 100).toFixed(0)}% dos pedidos captados`);
    }
  }

  const configuredCount = Object.values(integrations).filter(Boolean).length;
  const totalIntegrations = Object.keys(integrations).length;

  return (
    <>
      <PageHeader title="Overview geral" subtitle="Sumirê Perfumaria — visão cruzada: mídia paga, GA4 e e-commerce" />

      <div className="section-head">
        <h2>
          <span className="tick" />
          {formatRangeLabel(range)}
          {comparisonRange && comparisonMode !== 'none' && <span className="hint"> vs. {formatRangeLabel(comparisonRange)}</span>}
        </h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="hint">
            {configuredCount}/{totalIntegrations} fontes configuradas
          </span>
          <RefreshButton />
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Receita faturada"
          value={wakeOrders.status === 'ok' ? formatCurrency(wakeOrders.data.revenueBilled) : '—'}
          source="Wake Commerce"
          delta={wakeOrders.status === 'ok' ? deltaProp(wakeOrders.data.revenueBilled, prevRevenueBilled) : undefined}
          formula="Soma do valor total dos pedidos faturados"
        />
        <KpiCard
          tone="teal"
          label="Receita captada"
          value={wakeOrders.status === 'ok' ? formatCurrency(wakeOrders.data.revenueCaptured) : '—'}
          source="Wake Commerce"
          delta={wakeOrders.status === 'ok' ? deltaProp(wakeOrders.data.revenueCaptured, prevRevenueCaptured) : undefined}
          formula="Soma do valor total de todos os pedidos criados no período"
        />
        <KpiCard
          label="Investimento total"
          value={formatCurrency(totalInvestment)}
          source="Meta + Google"
          delta={deltaProp(totalInvestment, prevTotalInvestment)}
          formula="Investimento Meta Ads + Investimento Google Ads"
        />
        <KpiCard
          tone="violet"
          label="MER faturado"
          value={merBilled !== null ? `${merBilled.toFixed(2)}x` : '—'}
          source="Reconciliada"
          formula="Receita faturada (Wake) ÷ investimento total"
        />
        <KpiCard
          tone="teal"
          label="Sessões"
          value={ga4.status === 'ok' ? formatInt(ga4.data.sessions) : '—'}
          source="GA4"
          delta={ga4.status === 'ok' ? deltaProp(ga4.data.sessions, prevSessions) : undefined}
          status={ga4.status === 'ok' ? undefined : ga4.reason}
          formula="Sessões GA4 no período"
        />
        <KpiCard
          label="Custo por sessão paga"
          value={costPerPaidSession !== null ? formatCurrency(costPerPaidSession) : '—'}
          source="Reconciliada"
          formula="Investimento total ÷ sessões GA4 dos canais pagos (Paid Search + Paid Social)"
        />
        <KpiCard
          tone="amber"
          label="Taxa de conversão captada"
          value={formatPercent(conversionRateCaptured)}
          source="Reconciliada"
          formula="Pedidos captados (Wake) ÷ sessões GA4"
        />
        <KpiCard
          label="Ticket médio faturado"
          value={avgTicketBilled !== null ? formatCurrency(avgTicketBilled) : '—'}
          source="Wake Commerce"
          formula="Receita faturada ÷ pedidos faturados"
        />
      </div>

      <div className="kpi-grid" style={{ marginTop: 14 }}>
        <KpiCard
          tone="muted"
          label="Pedidos captados"
          value={wakeOrders.status === 'ok' ? formatInt(wakeOrders.data.ordersCaptured) : '—'}
          source="Wake Commerce"
          delta={wakeOrders.status === 'ok' ? deltaProp(wakeOrders.data.ordersCaptured, prevOrdersCaptured) : undefined}
        />
        <KpiCard
          tone="muted"
          label="Pedidos faturados"
          value={wakeOrders.status === 'ok' ? formatInt(wakeOrders.data.ordersBilled) : '—'}
          source="Wake Commerce"
          delta={wakeOrders.status === 'ok' ? deltaProp(wakeOrders.data.ordersBilled, prevOrdersBilled) : undefined}
        />
        <KpiCard
          tone="muted"
          label="Taxa de aprovação"
          value={wakeOrders.status === 'ok' && wakeOrders.data.approvalRate !== null ? formatPercent(wakeOrders.data.approvalRate * 100) : '—'}
          source="Wake Commerce"
          delta={
            wakeOrders.status === 'ok' && wakeOrders.data.approvalRate !== null
              ? deltaProp(wakeOrders.data.approvalRate * 100, prevApprovalRate)
              : undefined
          }
          formula="Pedidos faturados ÷ pedidos captados"
        />
        <KpiCard tone="muted" label="Ticket médio captado" value={avgTicketCaptured !== null ? formatCurrency(avgTicketCaptured) : '—'} source="Wake Commerce" />
        <KpiCard tone="muted" label="MER captado" value={merCaptured !== null ? `${merCaptured.toFixed(2)}x` : '—'} source="Reconciliada" formula="Receita captada (Wake) ÷ investimento total" />
        <KpiCard
          tone="muted"
          label="Taxa de conversão GA4"
          value={formatPercent(conversionRateGa4)}
          source="Diagnóstica"
          formula="Transações GA4 (ecommercePurchases) ÷ sessões GA4"
        />
        <KpiCard tone="muted" label="Custo por pedido faturado" value={costPerOrderBilled !== null ? formatCurrency(costPerOrderBilled) : '—'} source="Reconciliada" />
        <KpiCard tone="muted" label="Receita GA4 last click paga" value={formatCurrency(ga4RevenuePaid)} source="Diagnóstica" formula="Receita GA4 dos canais Paid Search + Paid Social" />
      </div>

      {goal && (pace.revenueBilled || pace.revenueCaptured || pace.ordersBilled || pace.totalInvestment) && (
        <>
          <div className="section-head">
            <h2>
              <span className="tick" />
              Metas & pace do mês
            </h2>
          </div>
          <div className="card panel">
            <div className="goal-progress-grid">
              {pace.revenueBilled && goal.revenueBilled && (
                <GoalProgress label="Receita faturada" actual={wakeOrders.status === 'ok' ? wakeOrders.data.revenueBilled : 0} goal={goal.revenueBilled} pace={pace.revenueBilled} format={formatCurrency} />
              )}
              {pace.revenueCaptured && goal.revenueCaptured && (
                <GoalProgress label="Receita captada" actual={wakeOrders.status === 'ok' ? wakeOrders.data.revenueCaptured : 0} goal={goal.revenueCaptured} pace={pace.revenueCaptured} format={formatCurrency} />
              )}
              {pace.ordersBilled && goal.ordersBilled && (
                <GoalProgress label="Pedidos faturados" actual={wakeOrders.status === 'ok' ? wakeOrders.data.ordersBilled : 0} goal={goal.ordersBilled} pace={pace.ordersBilled} format={formatInt} />
              )}
              {pace.totalInvestment && goal.totalInvestment && (
                <GoalProgress label="Investimento" actual={totalInvestment} goal={goal.totalInvestment} pace={pace.totalInvestment} format={formatCurrency} />
              )}
            </div>
          </div>
        </>
      )}

      <div className="section-head">
        <h2>
          <span className="tick" />
          Receita × investimento × MER
        </h2>
      </div>
      <div className="card panel">
        {dailyDates.length > 1 ? (
          <ComboChart labels={dailyDates.map((d) => d.slice(5))} series={comboSeries} />
        ) : (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sem série diária suficiente no período selecionado.</p>
        )}
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Funil macro comparativo
        </h2>
      </div>
      <div className="card panel">
        {funnelSteps.length > 0 ? (
          <ComparativeFunnelChart steps={funnelSteps} compareLabel={comparisonRange ? formatRangeLabel(comparisonRange) : 'Comparado'} />
        ) : (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Funil indisponível: {ga4Funnel.status !== 'ok' ? ga4Funnel.reason : ''}</p>
        )}
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Receita por canal (GA4)
        </h2>
      </div>
      <div className="grid-2">
        <div className="card panel">
          {ga4.status === 'ok' && ga4.data.byChannel.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <DonutChart slices={topChannelsWithOthers(ga4.data.byChannel, 'revenue')} centerLabel="Receita GA4" centerValue={formatCurrency(ga4.data.totalRevenue)} />
              <DonutLegend slices={topChannelsWithOthers(ga4.data.byChannel, 'revenue')} total={ga4.data.totalRevenue} />
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{ga4.status !== 'ok' ? ga4.reason : 'Sem dados de canal no período.'}</p>
          )}
        </div>
        <div className="card panel">
          <div className="panel-head">
            <div>
              <h3>Investimento por plataforma</h3>
            </div>
          </div>
          {hasInvestment ? (
            <BarChart
              labels={['Meta Ads', 'Google Ads']}
              series={[
                {
                  label: 'Investimento',
                  color: META_COLOR,
                  values: [metaAds.status === 'ok' ? metaAds.data.cost : 0, googleAds.status === 'ok' ? googleAds.data.cost : 0],
                },
              ]}
              height={140}
            />
          ) : (
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sem investimento no período.</p>
          )}
        </div>
      </div>

      {ga4.status === 'ok' && ga4.data.byChannel.length > 0 && (
        <div className="card panel" style={{ marginTop: 14 }}>
          <ChannelMatrixTable rows={ga4.data.byChannel} />
        </div>
      )}

      <div className="section-head">
        <h2>
          <span className="tick" />
          Drivers & riscos
        </h2>
      </div>
      <div className="grid-2">
        <div className="card panel">
          <div className="panel-head">
            <div>
              <h3>
                <TrendingUpIcon style={{ width: 14, height: 14, verticalAlign: -2, marginRight: 6 }} /> Principais drivers
              </h3>
            </div>
          </div>
          {drivers.length > 0 ? (
            <ul className="driver-list">
              {drivers.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Sem drivers identificados com os dados disponíveis no período.</p>
          )}
        </div>
        <div className="card panel">
          <div className="panel-head">
            <div>
              <h3>
                <TrendingDownIcon style={{ width: 14, height: 14, verticalAlign: -2, marginRight: 6 }} /> Principais riscos
              </h3>
            </div>
          </div>
          {risks.length > 0 ? (
            <ul className="driver-list">
              {risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Nenhum risco determinístico identificado no período.</p>
          )}
        </div>
      </div>
    </>
  );
}
