import type { DateRange } from '@/lib/date-range';
import type { DataResult, PaidCampaignRow, PaidMediaSummary } from './types';
import { ok, notConfigured, errored } from './types';

const GRAPH_VERSION = 'v21.0';
const MAX_PAGES = 50; // teto de segurança para o loop de paging.next

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsightRow {
  campaign_name?: string;
  campaign_id?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  date_start?: string;
  date_stop?: string;
}

interface MetaCampaignStatusRow {
  id: string;
  status: string;
}

function num(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * O array `actions` do Meta traz vários `action_type` de compra ao mesmo tempo
 * (ex.: `purchase`, `omni_purchase`, `offsite_conversion.fb_pixel_purchase`)
 * representando a MESMA conversão sob metodologias diferentes — somar todos
 * com `.includes('purchase')` triplica a contagem (briefing v3 seção 23.9).
 * `omni_purchase` é a métrica unificada recomendada pela Meta (cross-device/
 * cross-plataforma); cai para `purchase` só quando `omni_purchase` não vier.
 */
function sumPurchaseActions(actions: MetaAction[] | undefined): number {
  if (!actions) return 0;
  const omni = actions.filter((a) => a.action_type === 'omni_purchase');
  const source = omni.length > 0 ? omni : actions.filter((a) => a.action_type === 'purchase');
  return source.reduce((acc, a) => acc + num(a.value), 0);
}

async function fetchAllPages<T>(initialUrl: string): Promise<T[]> {
  const rows: T[] = [];
  let url: string | undefined = initialUrl;
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Meta Graph API retornou ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data?: T[]; paging?: { next?: string } };
    rows.push(...(json.data ?? []));
    url = json.paging?.next;
  }
  return rows;
}

async function fetchInsights(
  adAccountId: string,
  accessToken: string,
  level: 'account' | 'campaign',
  range: DateRange,
): Promise<MetaInsightRow[]> {
  const fields = ['spend', 'impressions', 'clicks', 'actions', 'action_values', 'campaign_id', 'campaign_name', 'date_start', 'date_stop'].join(',');
  const params = new URLSearchParams({
    access_token: accessToken,
    level,
    time_range: JSON.stringify({ since: range.startDate, until: range.endDate }),
    fields,
    limit: '200',
  });
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${adAccountId}/insights?${params.toString()}`;
  return fetchAllPages<MetaInsightRow>(url);
}

/** Status real da campanha via `/campaigns` — insights não traz esse campo (briefing 23.9). */
async function fetchCampaignStatuses(adAccountId: string, accessToken: string): Promise<Map<string, string>> {
  const params = new URLSearchParams({ access_token: accessToken, fields: 'id,status', limit: '200' });
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${adAccountId}/campaigns?${params.toString()}`;
  const rows = await fetchAllPages<MetaCampaignStatusRow>(url);
  return new Map(rows.map((r) => [r.id, r.status]));
}

function toCampaignRow(row: MetaInsightRow, statusById: Map<string, string>): PaidCampaignRow {
  return {
    platform: 'Meta Ads',
    campaign: row.campaign_name ?? row.campaign_id ?? '(sem nome)',
    status: (row.campaign_id && statusById.get(row.campaign_id)) ?? '—',
    cost: num(row.spend),
    impressions: num(row.impressions),
    clicks: num(row.clicks),
    conversions: sumPurchaseActions(row.actions),
    conversionsValue: sumPurchaseActions(row.action_values),
  };
}

export interface DailyCost {
  date: string;
  cost: number;
  conversions: number;
}

/** Investimento e conversões por dia — usa time_increment=1 do Graph API (uma linha por dia). */
export async function getMetaAdsDaily(range: DateRange): Promise<DataResult<DailyCost[]>> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return notConfigured('META_ADS_ACCESS_TOKEN ou META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID ausentes em .env.local.');
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    level: 'account',
    time_range: JSON.stringify({ since: range.startDate, until: range.endDate }),
    time_increment: '1',
    fields: ['spend', 'actions', 'date_start'].join(','),
    limit: '200',
  });

  try {
    const rows = await fetchAllPages<MetaInsightRow>(
      `https://graph.facebook.com/${GRAPH_VERSION}/${adAccountId}/insights?${params.toString()}`,
    );
    const daily = rows
      .map((row) => ({
        date: row.date_start ?? '',
        cost: num(row.spend),
        conversions: sumPurchaseActions(row.actions),
      }))
      .filter((d) => d.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    return ok(daily, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}

export async function getMetaAdsSummary(range: DateRange): Promise<DataResult<PaidMediaSummary>> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return notConfigured('META_ADS_ACCESS_TOKEN ou META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID ausentes em .env.local.');
  }

  try {
    const [accountRows, campaignRows, statusById] = await Promise.all([
      fetchInsights(adAccountId, accessToken, 'account', range),
      fetchInsights(adAccountId, accessToken, 'campaign', range),
      fetchCampaignStatuses(adAccountId, accessToken),
    ]);

    const acc = accountRows[0];
    const campaigns = campaignRows.map((row) => toCampaignRow(row, statusById));

    const summary: PaidMediaSummary = {
      platform: 'Meta Ads',
      periodStart: acc?.date_start ?? range.startDate,
      periodEnd: acc?.date_stop ?? range.endDate,
      cost: num(acc?.spend),
      impressions: num(acc?.impressions),
      clicks: num(acc?.clicks),
      conversions: sumPurchaseActions(acc?.actions),
      conversionsValue: sumPurchaseActions(acc?.action_values),
      campaigns,
    };

    // `reliability` aqui descreve a FONTE (Meta Ads respondendo normalmente) — investimento
    // é oficial de mídia. A classificação de `conversions`/`conversionsValue` (receita
    // ATRIBUÍDA pela plataforma) como diagnóstica pra fins financeiros vive em
    // `lib/metrics.ts` por métrica, não neste tag do objeto inteiro (briefing seção 22.3/4).
    return ok(summary, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}
