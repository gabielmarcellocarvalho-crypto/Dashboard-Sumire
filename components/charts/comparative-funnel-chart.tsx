interface ComparativeFunnelStep {
  label: string;
  current: number;
  /** `null` quando não há comparação selecionada (briefing v3 seção 9.6). */
  compare: number | null;
}

const nf = new Intl.NumberFormat('pt-BR');

/**
 * Funil horizontal comparativo (período atual vs. comparado) — barras div
 * acessíveis, não canvas, mesma filosofia do `FunnelChart` de etapa única.
 */
export function ComparativeFunnelChart({
  steps,
  currentColor = '#FF1476',
  compareColor = '#52525b',
  currentLabel = 'Atual',
  compareLabel = 'Comparado',
}: {
  steps: ComparativeFunnelStep[];
  currentColor?: string;
  compareColor?: string;
  currentLabel?: string;
  compareLabel?: string;
}) {
  const topCurrent = steps[0]?.current || 1;
  const topCompare = steps[0]?.compare || 1;
  const hasCompare = steps.some((s) => s.compare !== null);

  return (
    <div className="funnel funnel-cmp">
      {hasCompare && (
        <div className="legend">
          <b>
            <span className="swatch" style={{ background: currentColor }} /> {currentLabel}
          </b>
          <b>
            <span className="swatch" style={{ background: compareColor }} /> {compareLabel}
          </b>
        </div>
      )}
      {steps.map((s, i) => {
        const pctCurrent = topCurrent > 0 ? (s.current / topCurrent) * 100 : 0;
        const pctCompare = s.compare !== null && topCompare > 0 ? (s.compare / topCompare) * 100 : null;
        const delta = s.compare !== null && s.compare > 0 ? ((s.current - s.compare) / s.compare) * 100 : null;

        return (
          <div className="funnel-row" key={s.label}>
            <div className="funnel-meta">
              <span className="lab">{s.label}</span>
              <span className="num tnum">
                {nf.format(s.current)}
                {i > 0 && <span className="rate">{pctCurrent.toFixed(1)}%</span>}
                {delta !== null && (
                  <span className={`rate ${delta >= 0 ? 'up' : 'down'}`} style={{ marginLeft: 6 }}>
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(1)}% vs. comparado
                  </span>
                )}
              </span>
            </div>
            <div className="funnel-track">
              <div className="funnel-bar" style={{ width: `${Math.max(pctCurrent, 2)}%`, background: currentColor }} />
            </div>
            {pctCompare !== null && (
              <div className="funnel-track funnel-track-sm">
                <div className="funnel-bar" style={{ width: `${Math.max(pctCompare, 2)}%`, background: compareColor }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
