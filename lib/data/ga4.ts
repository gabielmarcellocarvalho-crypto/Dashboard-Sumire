import type { DateRange } from '@/lib/date-range';
import { getGoogleServiceAccountToken } from '@/lib/google-service-account';
import type { DataResult } from './types';
import { ok, notConfigured, errored } from './types';

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const ORGANIC_SEARCH_CHANNEL = 'Organic Search';
const PAID_CHANNELS = ['Paid Search', 'Paid Social'] as const;

export interface Ga4ChannelRow {
  channel: string;
  sessions: number;
  /** Transações de e-commerce (`ecommercePurchases`), não a métrica genérica `conversions` — briefing v3 seção 6.3/23.6. */
  transactions: number;
  revenue: number;
}

export interface Ga4Summary {
  periodStart: string;
  periodEnd: string;
  sessions: number;
  /** Query separada sem dimensão — não é soma de `totalUsers` por canal (que supercontaria, briefing 23.5). */
  totalUsers: number;
  transactions: number;
  totalRevenue: number;
  byChannel: Ga4ChannelRow[];
}

function getCredentials() {
  const clientEmail = process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;
  const propertyId = process.env.GA4_SUMIRE_PERFUMARIA_PROPERTY_ID;
  if (!clientEmail || !privateKey || !propertyId) return null;
  return { clientEmail, privateKey, propertyId };
}

async function runReport(propertyId: string, accessToken: string, body: unknown) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return res;
}

export interface Ga4FunnelStep {
  step: string;
  eventName: string;
  count: number;
}

const FUNNEL_EVENTS = [
  'view_item',
  'add_to_cart',
  'view_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'purchase',
] as const;
const FUNNEL_LABELS: Record<(typeof FUNNEL_EVENTS)[number], string> = {
  view_item: 'Visualização de produto',
  add_to_cart: 'Adição ao carrinho',
  view_cart: 'Visualização do carrinho',
  begin_checkout: 'Início do checkout',
  add_shipping_info: 'Informação de frete',
  add_payment_info: 'Informação de pagamento',
  purchase: 'Compra (GA4)',
};

export type Ga4FunnelMetric = 'sessions' | 'totalUsers';

/**
 * Funil sessão → view_item → ... → purchase.
 *
 * A GA4 Data API não tem endpoint de funil nativo. Em vez de `eventCount`
 * bruto (que infla o step quando o mesmo evento dispara mais de uma vez na
 * sessão), pedimos a dimensão `eventName` filtrada pela lista de eventos do
 * funil junto da métrica `sessions`/`totalUsers` — nesse escopo, a métrica
 * retorna sessões/usuários únicos em que aquele evento ocorreu ao menos uma
 * vez, não a contagem bruta de disparos. É a técnica padrão para funil
 * sem BigQuery (briefing v3 seção 6.6), e por não garantir ORDEM sequencial
 * dos eventos dentro da sessão, o resultado deve ser rotulado como
 * "funil não sequencial" na UI.
 */
export async function getGa4Funnel(range: DateRange, metric: Ga4FunnelMetric = 'sessions'): Promise<DataResult<Ga4FunnelStep[]>> {
  const creds = getCredentials();
  if (!creds) {
    return notConfigured('GA4 ainda não configurado: faltam credenciais de service account ou property ID em .env.local.');
  }

  try {
    const accessToken = await getGoogleServiceAccountToken(creds.clientEmail, creds.privateKey, SCOPE);
    const dateRanges = [{ startDate: range.startDate, endDate: range.endDate }];

    const [topRes, eventsRes] = await Promise.all([
      runReport(creds.propertyId, accessToken, { dateRanges, metrics: [{ name: metric }] }),
      runReport(creds.propertyId, accessToken, {
        dateRanges,
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: metric }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', inListFilter: { values: [...FUNNEL_EVENTS] } },
        },
      }),
    ]);

    if (!topRes.ok || !eventsRes.ok) {
      const body = await (!topRes.ok ? topRes : eventsRes).text().catch(() => '');
      return errored(`GA4 Data API retornou erro ao buscar funil: ${body.slice(0, 300)}`);
    }

    const topJson = (await topRes.json()) as { rows?: Array<{ metricValues: Array<{ value: string }> }> };
    const eventsJson = (await eventsRes.json()) as {
      rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>;
    };

    const top = Number(topJson.rows?.[0]?.metricValues?.[0]?.value ?? 0);
    const countByEvent = new Map<string, number>();
    for (const r of eventsJson.rows ?? []) {
      countByEvent.set(r.dimensionValues[0]?.value ?? '', Number(r.metricValues[0]?.value ?? 0));
    }

    const funnel: Ga4FunnelStep[] = [
      { step: metric === 'sessions' ? 'Sessões' : 'Usuários', eventName: 'session', count: top },
      ...FUNNEL_EVENTS.map((ev) => ({ step: FUNNEL_LABELS[ev], eventName: ev, count: countByEvent.get(ev) ?? 0 })),
    ];

    return ok(funnel, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}

export async function getGa4Summary(range: DateRange): Promise<DataResult<Ga4Summary>> {
  const creds = getCredentials();
  if (!creds) {
    return notConfigured(
      'GA4 ainda não configurado: faltam GA4_SERVICE_ACCOUNT_CLIENT_EMAIL, GA4_SERVICE_ACCOUNT_PRIVATE_KEY ou GA4_SUMIRE_PERFUMARIA_PROPERTY_ID em .env.local.',
    );
  }

  try {
    const accessToken = await getGoogleServiceAccountToken(creds.clientEmail, creds.privateKey, SCOPE);
    const dateRanges = [{ startDate: range.startDate, endDate: range.endDate }];

    // `totalUsers` pedido SEM dimensão — soma-lo por linha de canal supercontaria
    // usuários que aparecem em mais de um canal no período (briefing 23.5).
    const [byChannelRes, totalUsersRes] = await Promise.all([
      runReport(creds.propertyId, accessToken, {
        dateRanges,
        // `ecommercePurchases`, não a métrica genérica `conversions` (briefing 23.6) —
        // conversão de e-commerce, não qualquer "key event" configurado na propriedade.
        metrics: [{ name: 'sessions' }, { name: 'ecommercePurchases' }, { name: 'totalRevenue' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      }),
      runReport(creds.propertyId, accessToken, { dateRanges, metrics: [{ name: 'totalUsers' }] }),
    ]);

    if (!byChannelRes.ok || !totalUsersRes.ok) {
      const body = await (!byChannelRes.ok ? byChannelRes : totalUsersRes).text().catch(() => '');
      return errored(`GA4 Data API retornou erro: ${body.slice(0, 300)}`);
    }

    const json = (await byChannelRes.json()) as {
      rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>;
    };
    const totalUsersJson = (await totalUsersRes.json()) as { rows?: Array<{ metricValues: Array<{ value: string }> }> };

    const byChannel: Ga4ChannelRow[] = (json.rows ?? []).map((r) => ({
      channel: r.dimensionValues[0]?.value ?? '(não definido)',
      sessions: Number(r.metricValues[0]?.value ?? 0),
      transactions: Number(r.metricValues[1]?.value ?? 0),
      revenue: Number(r.metricValues[2]?.value ?? 0),
    }));

    const summary: Ga4Summary = {
      periodStart: range.startDate,
      periodEnd: range.endDate,
      sessions: byChannel.reduce((a, c) => a + c.sessions, 0),
      totalUsers: Number(totalUsersJson.rows?.[0]?.metricValues?.[0]?.value ?? 0),
      transactions: byChannel.reduce((a, c) => a + c.transactions, 0),
      totalRevenue: byChannel.reduce((a, c) => a + c.revenue, 0),
      byChannel,
    };

    // Este `DataResult.reliability` descreve a FONTE (GA4 está configurado e respondendo
    // 'oficial'-mente) — sessões/usuários são oficiais como dado comportamental (briefing
    // seção 4). Já a classificação financeira de `totalRevenue`/`transactions` como
    // 'diagnostica' (não é a verdade de faturamento) vive em `lib/metrics.ts`, por
    // métrica específica, não neste tag de objeto inteiro — ver seção 22.3 do briefing.
    return ok(summary, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}

export function isPaidChannel(channel: string): boolean {
  return (PAID_CHANNELS as readonly string[]).includes(channel);
}

export function isOrganicSearchChannel(channel: string): boolean {
  return channel === ORGANIC_SEARCH_CHANNEL;
}
