import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { FunnelChart } from '@/components/charts/funnel-chart';
import { getGa4Funnel } from '@/lib/data/ga4';
import { getWakeOrdersSummary } from '@/lib/data/wake-commerce';

export const dynamic = 'force-dynamic';

export default async function FunilPage() {
  const [ga4Funnel, wakeOrders] = await Promise.all([getGa4Funnel(), getWakeOrdersSummary()]);

  return (
    <>
      <div className="section-head">
        <h2>
          <span className="tick" />
          Funil de e-commerce
        </h2>
        <span className="hint">Sessão → produto → carrinho → checkout → pedido</span>
      </div>
      <div className="card panel">
        <div className="panel-head">
          <div>
            <h3>Sessão → GA4 → Wake Commerce</h3>
            <p>Etapas de comportamento (GA4) seguidas do pedido válido (Wake) — visões diferentes, não somadas.</p>
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
                ? [{ label: 'Pedido válido (Wake Commerce)', value: wakeOrders.data.ordersValid }]
                : []),
            ]}
          />
        )}

        {wakeOrders.status !== 'ok' && (
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
            Última etapa (pedido Wake) indisponível: {wakeOrders.reason}
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
        As etapas <b>Sessões</b>, <b>Visualização de produto</b>, <b>Adição ao carrinho</b> e <b>Início do checkout</b>{' '}
        vêm do GA4 (contagem de eventos <code>view_item</code>/<code>add_to_cart</code>/<code>begin_checkout</code>).
        A etapa <b>Compra (GA4)</b> é o evento <code>purchase</code> do GA4 — pode divergir do pedido Wake (gap
        estrutural entre as duas fontes, ver briefing v2.0 seção 9). O <b>Pedido válido</b> final vem direto do Wake
        Commerce e é a fonte oficial de receita/pedidos.
      </div>
    </>
  );
}
