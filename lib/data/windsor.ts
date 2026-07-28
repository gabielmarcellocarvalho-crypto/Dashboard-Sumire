import type { DataResult, OrganicAccountSummary, OrganicDaily } from './types';
import { ok, notConfigured, errored } from './types';

const WINDSOR_ENDPOINT = 'https://connectors.windsor.ai/instagram';

const FIELDS = [
  'date',
  'datasource',
  'account_name',
  'source',
  'followers_count',
  'reach',
  'media_profile_visits',
  'media_reach',
  'likes',
  'comments',
  'media_saved',
  'views',
  'media_engagement',
  'story_interactions',
  'story_views',
  'city',
  'day_of_month',
  'follower_count',
  'website',
];

interface WindsorRecord {
  date: string;
  account_name?: string;
  followers_count?: number | null;
  reach?: number | null;
  media_profile_visits?: number | null;
  media_reach?: number | null;
  likes?: number | null;
  comments?: number | null;
  media_saved?: number | null;
  views?: number | null;
  media_engagement?: number | null;
  story_interactions?: number | null;
  story_views?: number | null;
  /** Delta de novos seguidores no dia — NÃO confundir com `followers_count` (total). */
  follower_count?: number | null;
  city?: string | null;
}

function extractRecords(payload: unknown): WindsorRecord[] {
  if (Array.isArray(payload)) return payload as WindsorRecord[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: WindsorRecord[] }).data;
  }
  return [];
}

function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
}

/**
 * O Windsor devolve várias linhas por data (quebradas por dimensão — ex.:
 * uma linha por cidade, outra com followers_count, outra com o conjunto
 * reach/likes/comments/views/follower_count do dia). Aqui consolidamos por
 * data somando os campos aditivos e mantendo o snapshot de seguidores.
 *
 * `follower_count` (singular) é o delta de seguidores ganhos naquele dia —
 * distinto de `followers_count` (plural), que é o total acumulado. Os dois
 * nomes quase idênticos são uma armadilha real da API: confirmado inspecionando
 * uma coleta real (valores pequenos tipo 66/62/33 batendo com a linha diária
 * de reach/likes/views, versus um valor grande tipo 128722 isolado por conta).
 */
function normalize(records: WindsorRecord[], accountName: string): OrganicAccountSummary {
  const byDate = new Map<string, WindsorRecord[]>();
  for (const r of records) {
    if (!r.date) continue;
    const arr = byDate.get(r.date) ?? [];
    arr.push(r);
    byDate.set(r.date, arr);
  }

  const dates = [...byDate.keys()].sort();
  const daily: OrganicDaily[] = dates.map((date) => {
    const rows = byDate.get(date) ?? [];
    return {
      date,
      reach: sum(rows.map((r) => r.reach)) || null,
      likes: sum(rows.map((r) => r.likes)) || null,
      comments: sum(rows.map((r) => r.comments)) || null,
      views: sum(rows.map((r) => r.views)) || null,
      mediaSaved: sum(rows.map((r) => r.media_saved)) || null,
      mediaEngagement: sum(rows.map((r) => r.media_engagement)) || null,
      newFollowers: sum(rows.map((r) => r.follower_count)) || null,
      storyInteractions: sum(rows.map((r) => r.story_interactions)) || null,
      storyViews: sum(rows.map((r) => r.story_views)) || null,
      profileVisits: sum(rows.map((r) => r.media_profile_visits)) || null,
    };
  });

  let totalFollowers: number | null = null;
  let followersAsOf: string | null = null;
  for (const date of dates) {
    for (const r of byDate.get(date) ?? []) {
      if (typeof r.followers_count === 'number') {
        totalFollowers = r.followers_count;
        followersAsOf = date;
      }
    }
  }

  const totals = {
    reach: sum(daily.map((d) => d.reach)),
    likes: sum(daily.map((d) => d.likes)),
    comments: sum(daily.map((d) => d.comments)),
    views: sum(daily.map((d) => d.views)),
    mediaSaved: sum(daily.map((d) => d.mediaSaved)),
    mediaEngagement: sum(daily.map((d) => d.mediaEngagement)),
    newFollowers: sum(daily.map((d) => d.newFollowers)),
    storyInteractions: sum(daily.map((d) => d.storyInteractions)),
    storyViews: sum(daily.map((d) => d.storyViews)),
    profileVisits: sum(daily.map((d) => d.profileVisits)),
  };

  return {
    accountName,
    totalFollowers,
    followersAsOf,
    periodStart: dates[0] ?? '',
    periodEnd: dates[dates.length - 1] ?? '',
    daily,
    totals,
  };
}

export interface WindsorDateRange {
  /** Preset confirmado pela doc do Windsor: dias (last_7d/last_30d/...) ou last_2years. */
  datePreset?: string;
  /** Range explícito (YYYY-MM-DD) — usar quando o preset necessário (ex.: "mês atual") não é um preset documentado. */
  dateFrom?: string;
  dateTo?: string;
}

export async function getInstagramSummary(
  accountId: string | undefined,
  accountLabel: string,
  range: string | WindsorDateRange = 'last_7d',
): Promise<DataResult<OrganicAccountSummary>> {
  const apiKey = process.env.WINDSOR_AI_API_KEY;
  if (!apiKey) return notConfigured('WINDSOR_AI_API_KEY não definida em .env.local.');
  if (!accountId?.trim()) {
    return notConfigured(`Account ID do Windsor.ai para "${accountLabel}" ainda não configurado.`);
  }

  const { datePreset, dateFrom, dateTo }: WindsorDateRange = typeof range === 'string' ? { datePreset: range } : range;

  const params = new URLSearchParams({
    api_key: apiKey,
    fields: FIELDS.join(','),
    select_accounts: accountId,
  });
  if (dateFrom && dateTo) {
    params.set('date_from', dateFrom);
    params.set('date_to', dateTo);
  } else {
    params.set('date_preset', datePreset ?? 'last_7d');
  }

  let response: Response;
  try {
    response = await fetch(`${WINDSOR_ENDPOINT}?${params.toString()}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (err) {
    return errored(`Falha de rede ao consultar Windsor.ai: ${(err as Error).message}`);
  }

  if (!response.ok) {
    return errored(`Windsor.ai retornou status ${response.status} (${response.statusText}).`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (err) {
    return errored(`Resposta do Windsor.ai não é JSON válido: ${(err as Error).message}`);
  }

  const records = extractRecords(payload);
  if (records.length === 0) {
    return errored('Windsor.ai retornou 0 registros para o período — verificar account_id e permissões.');
  }

  return ok(normalize(records, accountLabel), 'real');
}

/** TikTok — roteamento (Windsor.ai vs. API direta) ainda não confirmado pelo operador. */
export async function getTiktokSummary(): Promise<DataResult<OrganicAccountSummary>> {
  return notConfigured(
    'Roteamento do TikTok ainda não confirmado pelo operador (Windsor.ai ou TikTok for Developers direto) — ver docs/metricas.md.',
  );
}
