import type { DataResult, PaidCampaignRow, PaidMediaSummary } from './types';
import { ok, notConfigured, errored } from './types';

const GRAPH_VERSION = 'v21.0';

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

function num(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Soma qualquer action_type que contenha "purchase" — aproximação razoável de conversões de compra. */
function sumPurchaseActions(actions: MetaAction[] | undefined): number {
  if (!actions) return 0;
  return actions.filter((a) => a.action_type.includes('purchase')).reduce((acc, a) => acc + num(a.value), 0);
}

function toCampaignRow(row: MetaInsightRow): PaidCampaignRow {
  return {
    platform: 'Meta Ads',
    campaign: row.campaign_name ?? row.campaign_id ?? '(sem nome)',
    status: 'ativa/histórico', // Insights não retorna status da campanha — exigiria chamada extra em /campaigns
    cost: num(row.spend),
    impressions: num(row.impressions),
    clicks: num(row.clicks),
    conversions: sumPurchaseActions(row.actions),
    conversionsValue: sumPurchaseActions(row.action_values),
  };
}

async function fetchInsights(adAccountId: string, accessToken: string, level: 'account' | 'campaign', datePreset: string) {
  const fields = ['spend', 'impressions', 'clicks', 'actions', 'action_values', 'campaign_name', 'date_start', 'date_stop'].join(',');
  const params = new URLSearchParams({
    access_token: accessToken,
    level,
    date_preset: datePreset,
    fields,
  });
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${adAccountId}/insights?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Meta Graph API retornou ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: MetaInsightRow[] };
  return json.data ?? [];
}

export interface DailyCost {
  date: string;
  cost: number;
  conversions: number;
}

/** Investimento e conversões por dia — usa time_increment=1 do Graph API (uma linha por dia). */
export async function getMetaAdsDaily(datePreset = 'last_7d'): Promise<DataResult<DailyCost[]>> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return notConfigured('META_ADS_ACCESS_TOKEN ou META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID ausentes em .env.local.');
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    level: 'account',
    date_preset: datePreset,
    time_increment: '1',
    fields: ['spend', 'actions', 'date_start'].join(','),
  });

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${adAccountId}/insights?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return errored(`Meta Graph API retornou ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data?: MetaInsightRow[] };
    const daily = (json.data ?? [])
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

export async function getMetaAdsSummary(datePreset = 'last_7d'): Promise<DataResult<PaidMediaSummary>> {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return notConfigured('META_ADS_ACCESS_TOKEN ou META_ADS_SUMIRE_PERFUMARIA_ACCOUNT_ID ausentes em .env.local.');
  }

  try {
    const [accountRows, campaignRows] = await Promise.all([
      fetchInsights(adAccountId, accessToken, 'account', datePreset),
      fetchInsights(adAccountId, accessToken, 'campaign', datePreset),
    ]);

    const acc = accountRows[0];
    const campaigns = campaignRows.map(toCampaignRow);

    const summary: PaidMediaSummary = {
      platform: 'Meta Ads',
      periodStart: acc?.date_start ?? '',
      periodEnd: acc?.date_stop ?? '',
      cost: num(acc?.spend),
      impressions: num(acc?.impressions),
      clicks: num(acc?.clicks),
      conversions: sumPurchaseActions(acc?.actions),
      conversionsValue: sumPurchaseActions(acc?.action_values),
      campaigns,
    };

    return ok(summary, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}
