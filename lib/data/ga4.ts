import { createSign } from 'node:crypto';
import type { DataResult } from './types';
import { ok, notConfigured, errored } from './types';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

export interface Ga4Summary {
  periodStart: string;
  periodEnd: string;
  sessions: number;
  totalUsers: number;
  conversions: number;
  totalRevenue: number;
  byChannel: Array<{ channel: string; sessions: number; conversions: number }>;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Autenticação via service account (JWT assertion) — sem dependências externas, usando node:crypto. */
async function getAccessToken(clientEmail: string, privateKeyRaw: string): Promise<string> {
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }),
  );
  const signingInput = `${header}.${claims}`;
  const signature = base64url(createSign('RSA-SHA256').update(signingInput).sign(privateKey));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Falha ao autenticar service account do GA4 (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('Resposta de autenticação GA4 sem access_token.');
  return json.access_token;
}

export interface Ga4FunnelStep {
  step: string;
  eventName: string;
  count: number;
}

const FUNNEL_EVENTS = ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'] as const;
const FUNNEL_LABELS: Record<(typeof FUNNEL_EVENTS)[number], string> = {
  view_item: 'Visualização de produto',
  add_to_cart: 'Adição ao carrinho',
  begin_checkout: 'Início do checkout',
  purchase: 'Compra (GA4)',
};

/**
 * Funil sessão → view_item → add_to_cart → begin_checkout → purchase.
 * A API GA4 (Data API) não tem endpoint de "funil" nativo — construímos a
 * partir de contagem de eventos (dimension eventName + metric eventCount),
 * igual ao relatório de exploração de funil faria por trás.
 */
export async function getGa4Funnel(datePreset: 'last_7d' | 'last_30d' = 'last_7d'): Promise<DataResult<Ga4FunnelStep[]>> {
  const clientEmail = process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;
  const propertyId = process.env.GA4_SUMIRE_PERFUMARIA_PROPERTY_ID;

  if (!clientEmail || !privateKey || !propertyId) {
    return notConfigured('GA4 ainda não configurado: faltam credenciais de service account ou property ID em .env.local.');
  }

  const days = datePreset === 'last_30d' ? '30daysAgo' : '7daysAgo';

  try {
    const accessToken = await getAccessToken(clientEmail, privateKey);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
    const base = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    const [sessionsRes, eventsRes] = await Promise.all([
      fetch(base, {
        method: 'POST',
        headers,
        body: JSON.stringify({ dateRanges: [{ startDate: days, endDate: 'today' }], metrics: [{ name: 'sessions' }] }),
        cache: 'no-store',
      }),
      fetch(base, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [{ startDate: days, endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            filter: { fieldName: 'eventName', inListFilter: { values: [...FUNNEL_EVENTS] } },
          },
        }),
        cache: 'no-store',
      }),
    ]);

    if (!sessionsRes.ok || !eventsRes.ok) {
      const body = await (!sessionsRes.ok ? sessionsRes : eventsRes).text().catch(() => '');
      return errored(`GA4 Data API retornou erro ao buscar funil: ${body.slice(0, 300)}`);
    }

    const sessionsJson = (await sessionsRes.json()) as { rows?: Array<{ metricValues: Array<{ value: string }> }> };
    const eventsJson = (await eventsRes.json()) as {
      rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>;
    };

    const sessions = Number(sessionsJson.rows?.[0]?.metricValues?.[0]?.value ?? 0);
    const countByEvent = new Map<string, number>();
    for (const r of eventsJson.rows ?? []) {
      countByEvent.set(r.dimensionValues[0]?.value ?? '', Number(r.metricValues[0]?.value ?? 0));
    }

    const funnel: Ga4FunnelStep[] = [
      { step: 'Sessões', eventName: 'session', count: sessions },
      ...FUNNEL_EVENTS.map((ev) => ({ step: FUNNEL_LABELS[ev], eventName: ev, count: countByEvent.get(ev) ?? 0 })),
    ];

    return ok(funnel, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}

export async function getGa4Summary(datePreset: 'last_7d' | 'last_30d' = 'last_7d'): Promise<DataResult<Ga4Summary>> {
  const clientEmail = process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL;
  const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;
  const propertyId = process.env.GA4_SUMIRE_PERFUMARIA_PROPERTY_ID;

  if (!clientEmail || !privateKey || !propertyId) {
    return notConfigured(
      'GA4 ainda não configurado: faltam GA4_SERVICE_ACCOUNT_CLIENT_EMAIL, GA4_SERVICE_ACCOUNT_PRIVATE_KEY ou GA4_SUMIRE_PERFUMARIA_PROPERTY_ID em .env.local.',
    );
  }

  const days = datePreset === 'last_30d' ? '30daysAgo' : '7daysAgo';

  try {
    const accessToken = await getAccessToken(clientEmail, privateKey);

    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        dateRanges: [{ startDate: days, endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }, { name: 'totalRevenue' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return errored(`GA4 Data API retornou ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>;
    };

    const byChannel = (json.rows ?? []).map((r) => ({
      channel: r.dimensionValues[0]?.value ?? '(não definido)',
      sessions: Number(r.metricValues[0]?.value ?? 0),
      conversions: Number(r.metricValues[2]?.value ?? 0),
    }));

    const summary: Ga4Summary = {
      periodStart: days,
      periodEnd: 'today',
      sessions: byChannel.reduce((a, c) => a + c.sessions, 0),
      totalUsers: (json.rows ?? []).reduce((a, r) => a + Number(r.metricValues[1]?.value ?? 0), 0),
      conversions: byChannel.reduce((a, c) => a + c.conversions, 0),
      totalRevenue: (json.rows ?? []).reduce((a, r) => a + Number(r.metricValues[3]?.value ?? 0), 0),
      byChannel,
    };

    return ok(summary, 'oficial');
  } catch (err) {
    return errored((err as Error).message);
  }
}
