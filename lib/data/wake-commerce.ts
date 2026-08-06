import type { DateRange } from '@/lib/date-range';
import { WAKE_PAID_STATUS_IDS } from '@/lib/wake-status';
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
  /** Todo pedido criado no período (briefing v3, seção 5.1) — NÃO filtra por `valido`. */
  ordersCaptured: number;
  ordersBilled: number;
  revenueCaptured: number;
  revenueBilled: number;
  approvalRate: number | null;
  daily: Array<{ date: string; ordersCaptured: number; ordersBilled: number; revenueCaptured: number; revenueBilled: number }>;
}

/** Wake espera `yyyy-mm-dd hh:mm:ss`; assumimos que o horário da loja é America/Sao_Paulo (mesmo timezone de `DateRange`). */
function toWakeDateTime(isoDate: string, edge: 'start' | 'end'): string {
  return `${isoDate} ${edge === 'start' ? '00:00:00' : '23:59:59'}`;
}

// Teto de segurança bem acima de qualquer volume mensal real observado (~700 pedidos/mês
// na amostra usada pra derivar `WAKE_PAID_STATUS_IDS`) — se estourar, é sinal genuíno de
// truncamento, não um limite artificial baixo como o `MAX_PAGES = 20` anterior.
const MAX_PAGES = 400; // 400 x 50 = 20.000 pedidos

export async function getWakeOrdersSummary(range: DateRange): Promise<DataResult<WakeOrdersSummary>> {
  const apiUrl = process.env.WAKE_COMMERCE_API_URL;
  const apiKey = process.env.WAKE_COMMERCE_API_KEY;

  if (!apiUrl || !apiKey) {
    return notConfigured('WAKE_COMMERCE_API_URL ou WAKE_COMMERCE_API_KEY ausentes em .env.local.');
  }

  const orders: WakeOrder[] = [];
  let truncated = false;

  try {
    for (let pagina = 1; pagina <= MAX_PAGES; pagina++) {
      const params = new URLSearchParams({
        dataInicial: toWakeDateTime(range.startDate, 'start'),
        dataFinal: toWakeDateTime(range.endDate, 'end'),
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

  if (truncated) {
    // Regra 23.3: nunca calcular um período parcialmente truncado como se fosse completo.
    return errored(
      `Mais de ${MAX_PAGES * 50} pedidos no período — paginação truncada pelo teto de segurança. Reduza o período ou aumente MAX_PAGES em lib/data/wake-commerce.ts.`,
    );
  }

  // Captado = TODO pedido criado no período, sem filtrar por `valido` (briefing v3, seção 5.1/23.2).
  const billed = orders.filter((o) => WAKE_PAID_STATUS_IDS.includes(o.situacaoPedidoId));

  const byDate = new Map<string, { ordersCaptured: number; ordersBilled: number; revenueCaptured: number; revenueBilled: number }>();
  for (const o of orders) {
    const date = (o.data ?? '').slice(0, 10);
    if (!date) continue;
    const entry = byDate.get(date) ?? { ordersCaptured: 0, ordersBilled: 0, revenueCaptured: 0, revenueBilled: 0 };
    entry.ordersCaptured += 1;
    entry.revenueCaptured += o.valorTotalPedido ?? 0;
    if (WAKE_PAID_STATUS_IDS.includes(o.situacaoPedidoId)) {
      entry.ordersBilled += 1;
      entry.revenueBilled += o.valorTotalPedido ?? 0;
    }
    byDate.set(date, entry);
  }
  const daily = [...byDate.entries()].map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));

  const summary: WakeOrdersSummary = {
    periodStart: range.startDate,
    periodEnd: range.endDate,
    ordersCaptured: orders.length,
    ordersBilled: billed.length,
    revenueCaptured: orders.reduce((acc, o) => acc + (o.valorTotalPedido ?? 0), 0),
    revenueBilled: billed.reduce((acc, o) => acc + (o.valorTotalPedido ?? 0), 0),
    approvalRate: orders.length > 0 ? billed.length / orders.length : null,
    daily,
  };

  return ok(summary, 'oficial');
}
