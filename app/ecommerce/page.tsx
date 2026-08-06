import { KpiCard } from '@/components/kpi-card';
import { ReliabilityBadge } from '@/components/reliability-badge';
import { EmptyState } from '@/components/empty-state';
import { BarChart } from '@/components/charts/bar-chart';
import { getWakeOrdersSummary } from '@/lib/data/wake-commerce';
import { getWakeCrmSummary } from '@/lib/data/wake-crm';
import { formatCurrency, formatInt, formatPercent } from '@/lib/format';
import { formatRangeLabel, resolveFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/date-range';
import { WAKE_STATUS_MAPPING_VALIDATED } from '@/lib/wake-status';

export const dynamic = 'force-dynamic';

export default async function EcommercePage({ searchParams }: { searchParams: PageSearchParams }) {
  const { range } = await resolveFiltersFromPageSearchParams(searchParams);
  const [wakeOrders, wakeCrm] = await Promise.all([getWakeOrdersSummary(range), getWakeCrmSummary()]);

  return (
    <>
      <div className="section-head">
        <h2>
          <span className="tick" />
          Pedidos & receita
        </h2>
        <span className="hint">{formatRangeLabel(range)}</span>
      </div>
      <div className="card panel">
        <div className="panel-head">
          <div>
            <h3>Wake Commerce</h3>
            <p>
              Captado = todo pedido criado no período · Faturado = status pago
              {!WAKE_STATUS_MAPPING_VALIDATED && ' (mapeamento de status ainda pendente de validação pelo time Wake)'}
            </p>
          </div>
          <ReliabilityBadge reliability={wakeOrders.reliability} />
        </div>
        {wakeOrders.status !== 'ok' ? (
          <EmptyState title="Wake Commerce indisponível" reason={wakeOrders.reason} />
        ) : (
          <div className="kpi-grid" style={{ marginTop: 10 }}>
            <KpiCard label="Pedidos captados" value={formatInt(wakeOrders.data.ordersCaptured)} source="Wake Commerce" />
            <KpiCard
              tone="teal"
              label="Pedidos faturados"
              value={formatInt(wakeOrders.data.ordersBilled)}
              source="Wake Commerce"
            />
            <KpiCard
              tone="violet"
              label="Receita captada"
              value={formatCurrency(wakeOrders.data.revenueCaptured)}
              source="Wake Commerce"
            />
            <KpiCard
              tone="amber"
              label="Receita faturada"
              value={formatCurrency(wakeOrders.data.revenueBilled)}
              source="Wake Commerce"
            />
            <KpiCard
              label="Taxa de aprovação"
              value={formatPercent(wakeOrders.data.approvalRate !== null ? wakeOrders.data.approvalRate * 100 : null)}
              source="Wake Commerce"
              status="Pedidos faturados ÷ pedidos captados"
            />
            <KpiCard
              label="Gap captado × faturado"
              value={formatCurrency(wakeOrders.data.revenueCaptured - wakeOrders.data.revenueBilled)}
              source="Wake Commerce"
            />
            <KpiCard
              tone="teal"
              label="Ticket médio captado"
              value={wakeOrders.data.ordersCaptured > 0 ? formatCurrency(wakeOrders.data.revenueCaptured / wakeOrders.data.ordersCaptured) : '—'}
              source="Wake Commerce"
            />
            <KpiCard
              tone="violet"
              label="Ticket médio faturado"
              value={wakeOrders.data.ordersBilled > 0 ? formatCurrency(wakeOrders.data.revenueBilled / wakeOrders.data.ordersBilled) : '—'}
              source="Wake Commerce"
            />
          </div>
        )}
      </div>

      {wakeOrders.status === 'ok' && wakeOrders.data.daily.length > 1 && (
        <>
          <div className="section-head">
            <h2>
              <span className="tick" />
              Captado × faturado por data de criação do pedido
            </h2>
          </div>
          <div className="grid-2">
            <div className="card panel">
              <div className="panel-head">
                <div>
                  <h3>Receita diária</h3>
                </div>
                <ReliabilityBadge reliability="oficial" />
              </div>
              <div className="legend">
                <b>
                  <span className="swatch" style={{ background: '#159AA8' }} /> Captada
                </b>
                <b>
                  <span className="swatch" style={{ background: '#34D399' }} /> Faturada
                </b>
              </div>
              <BarChart
                labels={wakeOrders.data.daily.map((d) => d.date.slice(5))}
                series={[
                  { label: 'Receita captada', color: '#159AA8', values: wakeOrders.data.daily.map((d) => d.revenueCaptured) },
                  { label: 'Receita faturada', color: '#34D399', values: wakeOrders.data.daily.map((d) => d.revenueBilled) },
                ]}
              />
            </div>
            <div className="card panel">
              <div className="panel-head">
                <div>
                  <h3>Pedidos por dia</h3>
                </div>
                <ReliabilityBadge reliability="oficial" />
              </div>
              <div className="legend">
                <b>
                  <span className="swatch" style={{ background: '#9D8BEA' }} /> Captados
                </b>
                <b>
                  <span className="swatch" style={{ background: '#D9A53A' }} /> Faturados
                </b>
              </div>
              <BarChart
                labels={wakeOrders.data.daily.map((d) => d.date.slice(5))}
                series={[
                  { label: 'Pedidos captados', color: '#9D8BEA', values: wakeOrders.data.daily.map((d) => d.ordersCaptured) },
                  { label: 'Pedidos faturados', color: '#D9A53A', values: wakeOrders.data.daily.map((d) => d.ordersBilled) },
                ]}
              />
            </div>
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
