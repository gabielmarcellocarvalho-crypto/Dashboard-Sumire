import { PageHeader } from '@/components/page-header';
import { readGoals } from '@/lib/goals';
import { formatCurrency, formatInt, formatPercent } from '@/lib/format';
import { todayInAppTimezone } from '@/lib/date-range';
import { saveGoal } from './actions';

export const dynamic = 'force-dynamic';

const FIELDS: { key: string; label: string; kind: 'currency' | 'integer' | 'percentage' | 'decimal' }[] = [
  { key: 'revenueCaptured', label: 'Receita captada', kind: 'currency' },
  { key: 'revenueBilled', label: 'Receita faturada', kind: 'currency' },
  { key: 'ordersCaptured', label: 'Pedidos captados', kind: 'integer' },
  { key: 'ordersBilled', label: 'Pedidos faturados', kind: 'integer' },
  { key: 'sessions', label: 'Sessões', kind: 'integer' },
  { key: 'conversionRate', label: 'Taxa de conversão (%)', kind: 'percentage' },
  { key: 'avgTicket', label: 'Ticket médio', kind: 'currency' },
  { key: 'totalInvestment', label: 'Investimento total', kind: 'currency' },
  { key: 'budgetMeta', label: 'Orçamento Meta Ads', kind: 'currency' },
  { key: 'budgetGoogle', label: 'Orçamento Google Ads', kind: 'currency' },
  { key: 'mer', label: 'MER', kind: 'decimal' },
  { key: 'costPerSession', label: 'Custo por sessão', kind: 'currency' },
];

function formatByKind(v: number | null, kind: (typeof FIELDS)[number]['kind']): string {
  if (v === null) return '—';
  if (kind === 'currency') return formatCurrency(v);
  if (kind === 'integer') return formatInt(v);
  if (kind === 'percentage') return formatPercent(v);
  return v.toFixed(2);
}

export default async function MetasPage() {
  const goals = await readGoals();
  const currentMonth = todayInAppTimezone().slice(0, 7);

  return (
    <>
      <PageHeader title="Metas e Forecast" subtitle="Cadastro manual — nunca inferidas automaticamente (briefing v3, seção 17)" />

      <div className="section-head">
        <h2>
          <span className="tick" />
          Cadastrar / atualizar meta mensal
        </h2>
      </div>
      <div className="card panel">
        <form action={saveGoal} className="goal-form">
          <div className="goal-form-grid">
            <label className="goal-field">
              <span className="drp-label">Mês de referência</span>
              <input type="month" name="month" defaultValue={currentMonth} required />
            </label>
            <label className="goal-field">
              <span className="drp-label">Responsável</span>
              <input type="text" name="owner" placeholder="Nome" />
            </label>
          </div>

          <div className="goal-form-grid">
            {FIELDS.map((f) => (
              <label className="goal-field" key={f.key}>
                <span className="drp-label">{f.label}</span>
                <input type="number" step="any" name={f.key} placeholder="Não cadastrado" />
              </label>
            ))}
          </div>

          <label className="goal-field" style={{ marginTop: 4 }}>
            <span className="drp-label">Observação</span>
            <textarea name="notes" rows={2} />
          </label>

          <button type="submit" className="drp-apply" style={{ marginTop: 12, alignSelf: 'flex-start' }}>
            Salvar meta
          </button>
        </form>
      </div>

      <div className="section-head">
        <h2>
          <span className="tick" />
          Metas cadastradas
        </h2>
      </div>
      <div className="card panel">
        {goals.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>Nenhuma meta cadastrada ainda.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  {FIELDS.map((f) => (
                    <th className="num" key={f.key}>
                      {f.label}
                    </th>
                  ))}
                  <th>Responsável</th>
                  <th>Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g.month}>
                    <td className="num-strong">{g.month}</td>
                    {FIELDS.map((f) => (
                      <td className="num" key={f.key}>
                        {formatByKind(g[f.key as keyof typeof g] as number | null, f.kind)}
                      </td>
                    ))}
                    <td>{g.owner ?? '—'}</td>
                    <td>{new Date(g.updatedAt).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
