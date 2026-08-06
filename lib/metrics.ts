/**
 * Registry central de definição de métricas (briefing v3, seção 22.3).
 *
 * Separado do `Reliability` de `lib/reliability.ts`/`DataResult` — aquele
 * descreve se uma FONTE está respondendo normalmente; `classification` aqui
 * descreve se um NÚMERO específico é a verdade financeira do negócio ou um
 * diagnóstico de plataforma/atribuição (briefing seção 4, hierarquia de
 * verdade). Uma métrica pode vir de uma fonte 'oficial' (GA4 respondendo bem)
 * e ainda assim ser classificada como 'diagnostica' pra fins de faturamento.
 */

export type MetricFormat = 'currency' | 'integer' | 'percentage' | 'decimal';
export type MetricClassification = 'oficial' | 'reconciliada' | 'diagnostica' | 'indisponivel';

export interface MetricDefinition {
  id: string;
  label: string;
  formula: string;
  source: string;
  classification: MetricClassification;
  format: MetricFormat;
}

const define = (m: MetricDefinition): MetricDefinition => m;

/** Métricas P0 (briefing v3, seções 4–6). */
export const METRICS: Record<string, MetricDefinition> = {
  ordersCaptured: define({
    id: 'ordersCaptured',
    label: 'Pedidos captados',
    formula: 'Contagem de todos os pedidos criados na Wake no período',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'integer',
  }),
  ordersBilled: define({
    id: 'ordersBilled',
    label: 'Pedidos faturados',
    formula: 'Contagem dos pedidos captados com status pago (WAKE_PAID_STATUS_IDS)',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'integer',
  }),
  revenueCaptured: define({
    id: 'revenueCaptured',
    label: 'Receita captada',
    formula: 'Soma do valor total de todos os pedidos captados',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'currency',
  }),
  revenueBilled: define({
    id: 'revenueBilled',
    label: 'Receita faturada',
    formula: 'Soma do valor total dos pedidos faturados',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'currency',
  }),
  approvalRate: define({
    id: 'approvalRate',
    label: 'Taxa de aprovação',
    formula: 'Pedidos faturados ÷ Pedidos captados',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'percentage',
  }),
  approvalGapOrders: define({
    id: 'approvalGapOrders',
    label: 'Gap de aprovação (pedidos)',
    formula: 'Pedidos captados − Pedidos faturados',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'integer',
  }),
  approvalGapRevenue: define({
    id: 'approvalGapRevenue',
    label: 'Gap de aprovação (receita)',
    formula: 'Receita captada − Receita faturada',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'currency',
  }),
  avgTicketCaptured: define({
    id: 'avgTicketCaptured',
    label: 'Ticket médio captado',
    formula: 'Receita captada ÷ Pedidos captados',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'currency',
  }),
  avgTicketBilled: define({
    id: 'avgTicketBilled',
    label: 'Ticket médio faturado',
    formula: 'Receita faturada ÷ Pedidos faturados',
    source: 'Wake Commerce',
    classification: 'oficial',
    format: 'currency',
  }),
  totalInvestment: define({
    id: 'totalInvestment',
    label: 'Investimento total',
    formula: 'Investimento Meta Ads + Investimento Google Ads',
    source: 'Meta Ads + Google Ads',
    classification: 'oficial',
    format: 'currency',
  }),
  sessions: define({
    id: 'sessions',
    label: 'Sessões',
    formula: 'Sessões GA4 no período',
    source: 'GA4',
    classification: 'oficial',
    format: 'integer',
  }),
  paidSessions: define({
    id: 'paidSessions',
    label: 'Sessões pagas',
    formula: 'Soma de sessões GA4 dos canais Paid Search + Paid Social',
    source: 'GA4',
    classification: 'reconciliada',
    format: 'integer',
  }),
  costPerPaidSession: define({
    id: 'costPerPaidSession',
    label: 'Custo por sessão paga',
    formula: 'Investimento total ÷ Sessões pagas GA4',
    source: 'Meta Ads + Google Ads + GA4',
    classification: 'reconciliada',
    format: 'currency',
  }),
  ga4Revenue: define({
    id: 'ga4Revenue',
    label: 'Receita GA4',
    formula: 'Soma de `totalRevenue` por canal (GA4)',
    source: 'GA4',
    classification: 'diagnostica',
    format: 'currency',
  }),
  ga4Transactions: define({
    id: 'ga4Transactions',
    label: 'Transações GA4',
    formula: 'Soma de `ecommercePurchases` por canal (GA4)',
    source: 'GA4',
    classification: 'diagnostica',
    format: 'integer',
  }),
  ga4ConversionRate: define({
    id: 'ga4ConversionRate',
    label: 'Taxa de conversão GA4',
    formula: 'Transações GA4 ÷ Sessões GA4',
    source: 'GA4',
    classification: 'diagnostica',
    format: 'percentage',
  }),
  captureConversionRate: define({
    id: 'captureConversionRate',
    label: 'Taxa de conversão captada',
    formula: 'Pedidos captados Wake ÷ Sessões GA4',
    source: 'Wake Commerce + GA4',
    classification: 'reconciliada',
    format: 'percentage',
  }),
  billedConversionRate: define({
    id: 'billedConversionRate',
    label: 'Taxa de conversão faturada',
    formula: 'Pedidos faturados Wake ÷ Sessões GA4',
    source: 'Wake Commerce + GA4',
    classification: 'reconciliada',
    format: 'percentage',
  }),
  merCaptured: define({
    id: 'merCaptured',
    label: 'MER captado',
    formula: 'Receita captada Wake ÷ Investimento total',
    source: 'Wake Commerce + Meta Ads + Google Ads',
    classification: 'reconciliada',
    format: 'decimal',
  }),
  merBilled: define({
    id: 'merBilled',
    label: 'MER faturado',
    formula: 'Receita faturada Wake ÷ Investimento total',
    source: 'Wake Commerce + Meta Ads + Google Ads',
    classification: 'reconciliada',
    format: 'decimal',
  }),
  roasMeta: define({
    id: 'roasMeta',
    label: 'ROAS Meta',
    formula: 'Receita atribuída pelo Meta ÷ Investimento Meta',
    source: 'Meta Ads',
    classification: 'diagnostica',
    format: 'decimal',
  }),
  roasGoogle: define({
    id: 'roasGoogle',
    label: 'ROAS Google',
    formula: 'Valor de conversão atribuído pelo Google Ads ÷ Investimento Google',
    source: 'Google Ads',
    classification: 'diagnostica',
    format: 'decimal',
  }),
  roasGa4Paid: define({
    id: 'roasGa4Paid',
    label: 'ROAS GA4 pago consolidado',
    formula: 'Receita GA4 last click de Meta + Google ÷ Investimento total',
    source: 'GA4',
    classification: 'diagnostica',
    format: 'decimal',
  }),
  costPerOrderCaptured: define({
    id: 'costPerOrderCaptured',
    label: 'Custo por pedido captado',
    formula: 'Investimento total ÷ Pedidos captados Wake',
    source: 'Meta Ads + Google Ads + Wake Commerce',
    classification: 'reconciliada',
    format: 'currency',
  }),
  costPerOrderBilled: define({
    id: 'costPerOrderBilled',
    label: 'Custo por pedido faturado',
    formula: 'Investimento total ÷ Pedidos faturados Wake',
    source: 'Meta Ads + Google Ads + Wake Commerce',
    classification: 'reconciliada',
    format: 'currency',
  }),
  organicSessions: define({
    id: 'organicSessions',
    label: 'Sessões orgânicas',
    formula: 'Sessões GA4 do canal Organic Search',
    source: 'GA4',
    classification: 'diagnostica',
    format: 'integer',
  }),
  organicConversionRate: define({
    id: 'organicConversionRate',
    label: 'Taxa de conversão orgânica',
    formula: 'Transações GA4 Organic Search ÷ Sessões GA4 Organic Search',
    source: 'GA4',
    classification: 'diagnostica',
    format: 'percentage',
  }),
};

export function getMetricDefinition(id: string): MetricDefinition | undefined {
  return METRICS[id];
}
