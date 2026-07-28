interface FunnelStep {
  label: string;
  value: number;
}

/** Funil vertical acessível (barras div, não canvas) — cada etapa mostra valor absoluto e taxa vs. topo do funil. */
export function FunnelChart({ steps, color = '#FF1476' }: { steps: FunnelStep[]; color?: string }) {
  const top = steps[0]?.value || 1;
  return (
    <div className="funnel">
      {steps.map((s, i) => {
        const pct = top > 0 ? (s.value / top) * 100 : 0;
        return (
          <div className="funnel-row" key={s.label}>
            <div className="funnel-meta">
              <span className="lab">{s.label}</span>
              <span className="num tnum">
                {new Intl.NumberFormat('pt-BR').format(s.value)}
                {i > 0 && <span className="rate">{pct.toFixed(1)}%</span>}
              </span>
            </div>
            <div className="funnel-track">
              <div
                className="funnel-bar"
                style={{ width: `${Math.max(pct, 2)}%`, background: color, opacity: 1 - i * 0.15 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
