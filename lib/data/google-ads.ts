import type { DataResult, PaidCampaignRow, PaidMediaSummary } from './types';
import { ok, notConfigured, errored } from './types';

const API_VERSION = 'v24';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const DATE_PRESET_TO_GAQL: Record<string, string> = {
  last_7d: 'LAST_7_DAYS',
  last_30d: 'LAST_30_DAYS',
  today: 'TODAY',
  yesterday: 'YESTERDAY',
  this_month: 'THIS_MONTH',
  last_month: 'LAST_MONTH',
};

interface GaqlCampaignRow {
  campaign?: { id?: string; name?: string; status?: string };
  metrics?: {
    costMicros?: string;
    impressions?: string;
    clicks?: string;
    conversions?: number;
    conversionsValue?: number;
  };
}

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    grant_type: 'refresh_token',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Falha ao renovar access token do Google Ads (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('Resposta de refresh token do Google Ads sem access_token.');
  return json.access_token;
}

async function runQuery(customerId: string, accessToken: string, gaql: string): Promise<GaqlCampaignRow[]> {
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        ? { 'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID }
        : {}),
    },
    body: JSON.stringify({ query: gaql }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Ads API retornou ${res.status}: ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as { results?: GaqlCampaignRow[] };
  return json.results ?? [];
}

function microsToUnits(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n / 1_000_000 : 0;
}

function toCampaignRow(row: GaqlCampaignRow): PaidCampaignRow {
  return {
    platform: 'Google Ads',
    campaign: row.campaign?.name ?? row.campaign?.id ?? '(sem nome)',
    status: row.campaign?.status ?? '—',
    cost: microsToUnits(row.metrics?.costMicros),
    impressions: Number(row.metrics?.impressions ?? 0),
    clicks: Number(row.metrics?.clicks ?? 0),
    conversions: Number(row.metrics?.conversions ?? 0),
    conversionsValue: Number(row.metrics?.conversionsValue ?? 0),
  };
}

export interface DailyCost {
  date: string;
  cost: number;
  conversions: number;
}

interface GaqlDailyRow {
  segments?: { date?: string };
  metrics?: { costMicros?: string; conversions?: number };
}

/** Investimento e conversões por dia — soma todas as campanhas por `segments.date`. */
export async function getGoogleAdsDaily(datePreset = 'last_7d'): Promise<DataResult<DailyCost[]>> {
  const customerId = process.env.GOOGLE_ADS_SUMIRE_PERFUMARIA_CUSTOMER_ID;
  const hasCreds =
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    customerId;

  if (!hasCreds) {
    return notConfigured('Credenciais do Google Ads incompletas em .env.local.');
  }

  const gaqlRange = DATE_PRESET_TO_GAQL[datePreset] ?? 'LAST_7_DAYS';

  try {
    const accessToken = await getAccessToken();
    const rows = (await runQuery(
      customerId!,
      accessToken,
      `SELECT segments.date, metrics.cost_micros, metrics.conversions
       FROM campaign
       WHERE segments.date DURING ${gaqlRange}`,
    )) as unknown as GaqlDailyRow[];

    const byDate = new Map<string, DailyCost>();
    for (const row of rows) {
      const date = row.segments?.date;
      if (!date) continue;
      const entry = byDate.get(date) ?? { date, cost: 0, conversions: 0 };
      entry.cost += microsToUnits(row.metrics?.costMicros);
      entry.conversions += Number(row.metrics?.conversions ?? 0);
      byDate.set(date, entry);
    }

    return ok([...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)), 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}

export async function getGoogleAdsSummary(datePreset = 'last_7d'): Promise<DataResult<PaidMediaSummary>> {
  const customerId = process.env.GOOGLE_ADS_SUMIRE_PERFUMARIA_CUSTOMER_ID;
  const hasCreds =
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    customerId;

  if (!hasCreds) {
    return notConfigured('Credenciais do Google Ads incompletas em .env.local (developer token, OAuth client ou customer ID).');
  }

  const gaqlRange = DATE_PRESET_TO_GAQL[datePreset] ?? 'LAST_7_DAYS';

  try {
    const accessToken = await getAccessToken();
    const rows = await runQuery(
      customerId!,
      accessToken,
      `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value
       FROM campaign
       WHERE segments.date DURING ${gaqlRange}`,
    );

    const campaigns = rows.map(toCampaignRow);
    const summary: PaidMediaSummary = {
      platform: 'Google Ads',
      periodStart: '',
      periodEnd: '',
      cost: campaigns.reduce((a, c) => a + c.cost, 0),
      impressions: campaigns.reduce((a, c) => a + c.impressions, 0),
      clicks: campaigns.reduce((a, c) => a + c.clicks, 0),
      conversions: campaigns.reduce((a, c) => a + c.conversions, 0),
      conversionsValue: campaigns.reduce((a, c) => a + c.conversionsValue, 0),
      campaigns,
    };

    return ok(summary, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}
