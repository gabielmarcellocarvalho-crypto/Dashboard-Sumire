import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { FunnelChart } from '@/components/charts/funnel-chart';
import { getGa4Funnel } from '@/lib/data/ga4';
import { getWakeOrdersSummary } from '@/lib/data/wake-commerce';
import { resolveFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/date-range';

export const dynamic = 'force-dynamic';

export default async function FunilPage({ searchParams }: { searchParams: PageSearchParams }) {
  const { range } = await resolveFiltersFromPageSearchParams(searchParams);
  const [ga4Funnel, wakeOrders] = await Promise.all([getGa4Funnel(range), getWakeOrdersSummary(range)]);

  return (
    <>
      <div className="section-head">
        <h2>
          <span className="tick" />
          Funil de e-commerce
        </h2>
        <span className="hint">Sessão → produto → carrinho → checkout → frete → pagamento → pedido</span>
      </div>
      <div className="card panel">
        <div className="panel-head">
          <div>
            <h3>Sessão → GA4 → Wake Commerce</h3>
            <p>
              Funil não sequencial (sessões únicas por evento, sem garantia de ordem) seguido dos pedidos captado/faturado
              (Wake) — visões diferentes, não somadas.
            </p>
          </div>
          <ReliabilityBadge reliability={ga4Funnel.reliability} />
        </div>

        {ga4Funnel.status !== 'ok' ? (
          <EmptyState title="Funil GA4 indisponível" reason={ga4Funnel.reason} />
        ) : (
          <FunnelChart
            steps={[
              ...ga4Funnel.data.map((s) => ({ label: s.step, value: s.count })),
              ...(wakeOrders.status === 'ok'
                ? [
                    { label: 'Pedido captado (Wake)', value: wakeOrders.data.ordersCaptured },
                    { label: 'Pedido faturado (Wake)', value: wakeOrders.data.ordersBilled },
                  ]
                : []),
            ]}
          />
        )}

        {wakeOrders.status !== 'ok' && (
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
            Últimas etapas (pedido Wake) indisponíveis: {wakeOrders.reason}
          </p>
        )}
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Classificação
        </h2>
      </div>
      <div className="card panel" style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
        As etapas de <b>Sessões</b> até <b>Compra (GA4)</b> vêm do GA4 — sessões/usuários únicos que dispararam cada
        evento (<code>view_item</code>/<code>add_to_cart</code>/<code>view_cart</code>/<code>begin_checkout</code>/
        <code>add_shipping_info</code>/<code>add_payment_info</code>/<code>purchase</code>), não a contagem bruta de
        disparos. A etapa <b>Compra (GA4)</b> pode divergir do pedido Wake (gap estrutural entre as duas fontes). As
        etapas <b>Pedido captado</b>/<b>Pedido faturado</b> finais vêm direto do Wake Commerce e são a fonte oficial de
        receita/pedidos.
      </div>
    </>
  );
}
