import type { DataResult } from './types';
import { ok, notConfigured, errored } from './types';

/**
 * Auth confirmada no OpenAPI spec público da Wake Commerce (api.fbits.net/swagger/docs/v1):
 * header `Authorization: BASIC {token}` — apesar do nome "BASIC", NÃO é HTTP Basic Auth
 * codificado em base64, é o token literal prefixado por "BASIC ". Não há parâmetro de
 * loja separado nas chamadas (confirma a hipótese do operador: o token já resolve isso).
 */

export interface WakeOrder {
  pedidoId: number;
  situacaoPedidoId: number;
  data: string;
  valorTotalPedido: number;
  valido: boolean;
}

export interface WakeOrdersSummary {
  periodStart: string;
  periodEnd: string;
  ordersReturned: number;
  ordersValid: number;
  revenueCaptured: number;
  truncated: boolean;
  daily: Array<{ date: string; ordersValid: number; revenue: number }>;
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const MAX_PAGES = 20; // limite de segurança (20 x 50 = 1000 pedidos) pra não rodar indefinidamente

export async function getWakeOrdersSummary(days = 7): Promise<DataResult<WakeOrdersSummary>> {
  const apiUrl = process.env.WAKE_COMMERCE_API_URL;
  const apiKey = process.env.WAKE_COMMERCE_API_KEY;

  if (!apiUrl || !apiKey) {
    return notConfigured('WAKE_COMMERCE_API_URL ou WAKE_COMMERCE_API_KEY ausentes em .env.local.');
  }

  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const orders: WakeOrder[] = [];
  let truncated = false;

  try {
    for (let pagina = 1; pagina <= MAX_PAGES; pagina++) {
      const params = new URLSearchParams({
        dataInicial: formatDate(start),
        dataFinal: formatDate(end),
        pagina: String(pagina),
        quantidadeRegistros: '50',
      });

      const res = await fetch(`${apiUrl}/pedidos?${params.toString()}`, {
        headers: { Authorization: `BASIC ${apiKey}`, accept: 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return errored(`Wake Commerce API retornou ${res.status}: ${body.slice(0, 300)}`);
      }

      const page = (await res.json()) as WakeOrder[];
      orders.push(...page);

      if (page.length < 50) break;
      if (pagina === MAX_PAGES) truncated = true;
    }
  } catch (err) {
    return errored(`Falha ao consultar Wake Commerce API: ${(err as Error).message}`);
  }

  const valid = orders.filter((o) => o.valido);

  const byDate = new Map<string, { ordersValid: number; revenue: number }>();
  for (const o of valid) {
    const date = (o.data ?? '').slice(0, 10);
    if (!date) continue;
    const entry = byDate.get(date) ?? { ordersValid: 0, revenue: 0 };
    entry.ordersValid += 1;
    entry.revenue += o.valorTotalPedido ?? 0;
    byDate.set(date, entry);
  }
  const daily = [...byDate.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const summary: WakeOrdersSummary = {
    periodStart: formatDate(start),
    periodEnd: formatDate(end),
    ordersReturned: orders.length,
    ordersValid: valid.length,
    revenueCaptured: valid.reduce((acc, o) => acc + (o.valorTotalPedido ?? 0), 0),
    truncated,
    daily,
  };

  // "Proxy": ainda não confirmamos com o time Wake o mapeamento de situacaoPedidoId
  // pra captado/aprovado/faturado (briefing v2.0, seção 7) — tratamos "válido" como
  // aproximação de "captado" até essa confirmação chegar.
  return ok(summary, 'proxy');
}
