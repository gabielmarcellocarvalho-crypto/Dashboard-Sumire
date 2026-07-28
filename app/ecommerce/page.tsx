import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { RevenueAreaChart } from '@/components/charts/revenue-area-chart';
import { getWakeOrdersSummary } from '@/lib/data/wake-commerce';
import { getWakeCrmSummary } from '@/lib/data/wake-crm';
import { formatCurrency, formatInt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function EcommercePage() {
  const [wakeOrders, wakeCrm] = await Promise.all([getWakeOrdersSummary(), getWakeCrmSummary()]);

  return (
    <>
      <div className="section-head">
        <h2>
          <span className="tick" />
          Pedidos & receita
        </h2>
        <span className="hint">últimos 7 dias</span>
      </div>
      <div className="card panel">
        <div className="panel-head">
          <div>
            <h3>Wake Commerce</h3>
            <p>Mapeamento exato captado/aprovado/faturado ainda pendente — ver briefing v2.0, seção 7</p>
          </div>
          <ReliabilityBadge reliability={wakeOrders.reliability} />
        </div>
        {wakeOrders.status !== 'ok' ? (
          <EmptyState title="Wake Commerce indisponível" reason={wakeOrders.reason} />
        ) : (
          <div className="kpi-grid" style={{ marginTop: 10 }}>
            <KpiCard label="Pedidos retornados" value={formatInt(wakeOrders.data.ordersReturned)} source="Wake Commerce" />
            <KpiCard
              tone="teal"
              label="Pedidos válidos"
              value={formatInt(wakeOrders.data.ordersValid)}
              source="Wake Commerce"
            />
            <KpiCard
              tone="violet"
              label="Receita (pedidos válidos)"
              value={formatCurrency(wakeOrders.data.revenueCaptured)}
              source="Proxy"
              status="Aproximação — mapeamento de status ainda não confirmado"
            />
          </div>
        )}
      </div>

      {wakeOrders.status === 'ok' && wakeOrders.data.daily.length > 1 && (
        <>
          <div className="section-head">
            <h2>
              <span className="tick" />
              Evolução diária
            </h2>
          </div>
          <div className="card panel">
            <div className="panel-head">
              <div>
                <h3>Receita diária (pedidos válidos)</h3>
              </div>
              <ReliabilityBadge reliability="proxy" />
            </div>
            <RevenueAreaChart data={wakeOrders.data.daily as unknown as Record<string, unknown>[]} />
          </div>
        </>
      )}

      <div className="section-head">
        <h2>
          <span className="tick" />
          CRM
        </h2>
      </div>
      <div className="card panel">
        <div className="panel-head">
          <div>
            <h3>Wake CRM — disparos & receita atribuída</h3>
          </div>
          <ReliabilityBadge reliability={wakeCrm.reliability} />
        </div>
        {wakeCrm.status !== 'ok' ? (
          <EmptyState title="Wake CRM indisponível" reason={wakeCrm.reason} />
        ) : (
          <div className="kpi-grid" style={{ marginTop: 10 }}>
            <KpiCard label="Enviados" value={formatInt(wakeCrm.data.sent)} source="Wake CRM" />
            <KpiCard tone="teal" label="Abertos" value={formatInt(wakeCrm.data.opened)} source="Wake CRM" />
            <KpiCard
              tone="amber"
              label="Receita atribuída"
              value={formatCurrency(wakeCrm.data.revenueAttributed)}
              source="Diagnóstica"
            />
          </div>
        )}
      </div>
    </>
  );
}
