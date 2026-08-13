import type { DateRange } from '@/lib/date-range';
import type { DataResult } from './types';
import { ok, notConfigured, errored } from './types';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface SearchConsoleSummary {
  periodStart: string;
  periodEnd: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscRow {
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

function getCredentials() {
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  const siteUrl = process.env.GSC_SITE_URL;
  if (!clientId || !clientSecret || !refreshToken || !siteUrl) return null;
  return { clientId, clientSecret, refreshToken, siteUrl };
}

/** Mesmo padrão OAuth refresh-token do Google Ads (lib/data/google-ads.ts) — usa a conta Google
 * que já é dona/tem acesso à propriedade no Search Console, sem precisar de service account
 * nem de adicionar ninguém em "Usuários e permissões". */
async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
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
    throw new Error(`Falha ao renovar access token do Search Console (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('Resposta de refresh token do Search Console sem access_token.');
  return json.access_token;
}

/**
 * Google Search Console (briefing v3, seção 3.6/15) — integração real (não
 * mock), atrás de credenciais que o operador ainda precisa fornecer: um
 * OAuth Client ID/Secret + refresh token da própria conta Google que já é
 * dona/tem acesso à propriedade verificada no Search Console, e a URL exata
 * da propriedade (`https://dominio.com/` para prefixo de URL, ou
 * `sc-domain:dominio.com` para propriedade de domínio).
 */
export async function getSearchConsoleSummary(range: DateRange): Promise<DataResult<SearchConsoleSummary>> {
  const creds = getCredentials();
  if (!creds) {
    return notConfigured(
      'Search Console ainda não configurado: faltam GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN ou GSC_SITE_URL em .env.local.',
    );
  }

  try {
    const accessToken = await getAccessToken(creds.clientId, creds.clientSecret, creds.refreshToken);
    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(creds.siteUrl)}/searchAnalytics/query`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ startDate: range.startDate, endDate: range.endDate }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return errored(`Search Console API retornou ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as { rows?: GscRow[] };
    const row = json.rows?.[0];

    const summary: SearchConsoleSummary = {
      periodStart: range.startDate,
      periodEnd: range.endDate,
      clicks: row?.clicks ?? 0,
      impressions: row?.impressions ?? 0,
      ctr: (row?.ctr ?? 0) * 100,
      position: row?.position ?? 0,
    };

    return ok(summary, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}
