import type { DateRange } from '@/lib/date-range';
import { getGoogleServiceAccountToken } from '@/lib/google-service-account';
import type { DataResult } from './types';
import { ok, notConfigured, errored } from './types';

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

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
  const clientEmail = process.env.GSC_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY;
  const siteUrl = process.env.GSC_SITE_URL;
  if (!clientEmail || !privateKey || !siteUrl) return null;
  return { clientEmail, privateKey, siteUrl };
}

/**
 * Google Search Console (briefing v3, seção 3.6/15) — integração real (não
 * mock), atrás de credenciais que o operador ainda precisa fornecer: uma
 * service account com acesso "Full" ou "Restricted" à propriedade verificada
 * no Search Console (Configurações > Usuários e permissões) + a URL exata da
 * propriedade (`https://dominio.com/` para prefixo de URL, ou
 * `sc-domain:dominio.com` para propriedade de domínio).
 */
export async function getSearchConsoleSummary(range: DateRange): Promise<DataResult<SearchConsoleSummary>> {
  const creds = getCredentials();
  if (!creds) {
    return notConfigured(
      'Search Console ainda não configurado: faltam GSC_SERVICE_ACCOUNT_CLIENT_EMAIL, GSC_SERVICE_ACCOUNT_PRIVATE_KEY ou GSC_SITE_URL em .env.local.',
    );
  }

  try {
    const accessToken = await getGoogleServiceAccountToken(creds.clientEmail, creds.privateKey, SCOPE);
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
