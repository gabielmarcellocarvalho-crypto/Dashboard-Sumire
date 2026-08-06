import type { DateRange } from '@/lib/date-range';
import type { DataResult, PaidCampaignRow, PaidMediaSummary } from './types';
import { ok, notConfigured, errored } from './types';

const API_VERSION = 'v24';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const MAX_PAGES = 50; // teto de segurança para o loop de nextPageToken

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

/** Paginação via `nextPageToken` (briefing v3 seção 23.10) — `googleAds:search` retorna no máx. 10k linhas por página. */
async function runQuery<T = GaqlCampaignRow>(customerId: string, accessToken: string, gaql: string): Promise<T[]> {
  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ? { 'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID } : {}),
  };

  const rows: T[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: gaql, pageToken }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Google Ads API retornou ${res.status}: ${body.slice(0, 500)}`);
    }

    const json = (await res.json()) as { results?: T[]; nextPageToken?: string };
    rows.push(...(json.results ?? []));
    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }

  return rows;
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

function hasGoogleAdsCredentials(customerId: string | undefined): customerId is string {
  return Boolean(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      customerId,
  );
}

/** GAQL não aceita hífen em datas — `DURING` presets trocados por `BETWEEN` com o DateRange explícito (briefing seção 22.1). */
function dateRangeClause(range: DateRange): string {
  return `segments.date BETWEEN '${range.startDate}' AND '${range.endDate}'`;
}

/** Investimento e conversões por dia — soma todas as campanhas por `segments.date`. */
export async function getGoogleAdsDaily(range: DateRange): Promise<DataResult<DailyCost[]>> {
  const customerId = process.env.GOOGLE_ADS_SUMIRE_PERFUMARIA_CUSTOMER_ID;
  if (!hasGoogleAdsCredentials(customerId)) {
    return notConfigured('Credenciais do Google Ads incompletas em .env.local.');
  }

  try {
    const accessToken = await getAccessToken();
    const rows = await runQuery<GaqlDailyRow>(
      customerId,
      accessToken,
      `SELECT segments.date, metrics.cost_micros, metrics.conversions
       FROM campaign
       WHERE ${dateRangeClause(range)}`,
    );

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

export async function getGoogleAdsSummary(range: DateRange): Promise<DataResult<PaidMediaSummary>> {
  const customerId = process.env.GOOGLE_ADS_SUMIRE_PERFUMARIA_CUSTOMER_ID;
  if (!hasGoogleAdsCredentials(customerId)) {
    return notConfigured('Credenciais do Google Ads incompletas em .env.local (developer token, OAuth client ou customer ID).');
  }

  try {
    const accessToken = await getAccessToken();
    const rows = await runQuery<GaqlCampaignRow>(
      customerId,
      accessToken,
      `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value
       FROM campaign
       WHERE ${dateRangeClause(range)}`,
    );

    const campaigns = rows.map(toCampaignRow);
    const summary: PaidMediaSummary = {
      platform: 'Google Ads',
      periodStart: range.startDate,
      periodEnd: range.endDate,
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
